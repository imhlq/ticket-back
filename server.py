#!/usr/bin/env python3
import argparse
import csv
import io
import json
import mimetypes
import re
import secrets
import time
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse, parse_qs

ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "tickets.json"
CONFIG_FILE = ROOT / "site_config.json"
PUBLIC_EXTENSIONS = {".html", ".css", ".js", ".ico", ".png", ".jpg", ".jpeg", ".webp", ".svg"}
STATUSES = {"New", "Accepted", "Waiting", "Done"}
DEFAULT_PRIORITIES = {"Low", "Normal", "High"}
DEFAULT_CATEGORIES = {"Network", "Computer", "Account", "Software", "Hardware", "Data or report", "Other"}
REQUIRED_FIELDS = {
    "phone",
    "identityId",
    "orgCode",
    "requester",
    "contact",
    "team",
    "category",
    "priority",
    "neededBy",
    "summary",
    "details",
    "tried",
    "reference",
}
PHONE_RE = re.compile(r"^[+0-9 ()-]{7,24}$")
ID_RE = re.compile(r"^[A-Za-z0-9-]{4,32}$")
ORG_RE = re.compile(r"^[A-Za-z0-9-]{3,24}$")
CHALLENGES = {}
RATE_LIMITS = {}
CHALLENGE_TTL_SECONDS = 10 * 60
DEFAULT_CONFIG = {
    "defaultLanguage": "zh",
    "categories": [{"value": value} for value in sorted(DEFAULT_CATEGORIES)],
    "priorities": [{"value": value} for value in sorted(DEFAULT_PRIORITIES)],
    "emergency": {
        "enabled": True,
        "keywords": ["emergency", "urgent", "asap", "immediately", "911", "紧急", "急需", "立即", "马上"],
    },
    "validation": {
        "summaryMinLength": 12,
        "detailsMinLength": 30,
        "triedMinLength": 10,
        "referenceMinLength": 3,
        "maxTextLength": 1500,
        "maxSummaryLength": 90,
        "minimumChallengeAgeSeconds": 3,
    },
    "security": {
        "maxRequestBytes": 12000,
        "rateLimits": {
            "challenge": {"limit": 20, "windowSeconds": 300},
            "submit": {"limit": 6, "windowSeconds": 3600},
            "api": {"limit": 120, "windowSeconds": 300},
        },
    },
}


class PayloadTooLarge(ValueError):
    pass


class RateLimitExceeded(ValueError):
    pass


class TicketStore:
    def __init__(self, path):
        self.path = path
        self.tickets = self._read()

    def _read(self):
        if not self.path.exists():
            return []
        try:
            with self.path.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            return []

    def _write(self):
        tmp_path = self.path.with_suffix(".json.tmp")
        with tmp_path.open("w", encoding="utf-8") as handle:
            json.dump(self.tickets, handle, indent=2, ensure_ascii=False)
            handle.write("\n")
        tmp_path.replace(self.path)

    def list(self):
        return sorted(self.tickets, key=lambda ticket: ticket["createdAt"], reverse=True)

    def create(self, payload):
        config = load_config()
        clean_payload = {key: clean(payload.get(key)) for key in REQUIRED_FIELDS}
        missing = [key for key, value in clean_payload.items() if not value]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(sorted(missing))}")

        validate_challenge(payload, config)
        validate_payload(clean_payload, payload, config)

        priority = clean_payload["priority"]
        if priority not in config_values(config, "priorities", DEFAULT_PRIORITIES):
            raise ValueError("Invalid priority")
        if clean_payload["category"] not in config_values(config, "categories", DEFAULT_CATEGORIES):
            raise ValueError("Invalid category")

        now = now_iso()
        ticket = {
            **clean_payload,
            "id": self._next_id(now),
            "available": bool(payload.get("available")),
            "verificationConfirmed": bool(payload.get("verificationConfirm")),
            "notEmergency": bool(payload.get("notEmergency")),
            "status": "New",
            "ownerNotes": "",
            "createdAt": now,
            "updatedAt": now,
        }
        self.tickets.insert(0, ticket)
        self._write()
        return ticket

    def update(self, ticket_id, patch):
        ticket = self._find(ticket_id)
        if ticket is None:
            raise KeyError(ticket_id)

        if "status" in patch:
            status = clean(patch["status"])
            if status not in STATUSES:
                raise ValueError("Invalid status")
            ticket["status"] = status

        if "ownerNotes" in patch:
            ticket["ownerNotes"] = clean(patch["ownerNotes"])

        ticket["updatedAt"] = now_iso()
        self._write()
        return ticket

    def clear_done(self):
        before = len(self.tickets)
        self.tickets = [ticket for ticket in self.tickets if ticket.get("status") != "Done"]
        removed = before - len(self.tickets)
        if removed:
            self._write()
        return removed

    def csv(self):
        columns = [
            "id",
            "status",
            "priority",
            "category",
            "requester",
            "phone",
            "identityId",
            "orgCode",
            "contact",
            "team",
            "summary",
            "details",
            "tried",
            "reference",
            "neededBy",
            "ownerNotes",
            "notEmergency",
            "createdAt",
            "updatedAt",
        ]
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(safe_csv_row(ticket, columns) for ticket in self.list())
        return output.getvalue()

    def _find(self, ticket_id):
        return next((ticket for ticket in self.tickets if ticket["id"] == ticket_id), None)

    def _next_id(self, date_string):
        stamp = date_string[:10].replace("-", "")
        existing = [ticket for ticket in self.tickets if ticket["id"].startswith(f"REQ-{stamp}-")]
        return f"REQ-{stamp}-{len(existing) + 1:03d}"


STORE = TicketStore(DATA_FILE)


def load_config():
    if not CONFIG_FILE.exists():
        return DEFAULT_CONFIG
    try:
        with CONFIG_FILE.open("r", encoding="utf-8") as handle:
            config = json.load(handle)
    except json.JSONDecodeError:
        return DEFAULT_CONFIG

    merged = {
        **DEFAULT_CONFIG,
        **config,
        "emergency": {**DEFAULT_CONFIG["emergency"], **config.get("emergency", {})},
        "validation": {**DEFAULT_CONFIG["validation"], **config.get("validation", {})},
        "security": {**DEFAULT_CONFIG["security"], **config.get("security", {})},
    }
    merged["security"]["rateLimits"] = {
        **DEFAULT_CONFIG["security"]["rateLimits"],
        **config.get("security", {}).get("rateLimits", {}),
    }
    return merged


def config_int(config, section, key, fallback):
    try:
        value = int(config.get(section, {}).get(key, fallback))
    except (TypeError, ValueError):
        return fallback
    return max(0, value)


def config_values(config, key, fallback):
    values = {
        clean(item.get("value"))
        for item in config.get(key, [])
        if isinstance(item, dict) and clean(item.get("value"))
    }
    return values or fallback


def check_rate_limit(ip_address, scope, config):
    settings = config.get("security", {}).get("rateLimits", {}).get(scope)
    if not settings:
        return

    try:
        limit = int(settings.get("limit", 0))
        window = int(settings.get("windowSeconds", 0))
    except (TypeError, ValueError):
        return

    if limit <= 0 or window <= 0:
        return

    now = time.time()
    key = (ip_address, scope)
    hits = [timestamp for timestamp in RATE_LIMITS.get(key, []) if now - timestamp < window]
    if len(hits) >= limit:
        RATE_LIMITS[key] = hits
        raise RateLimitExceeded("Too many requests. Please try again later.")
    hits.append(now)
    RATE_LIMITS[key] = hits


def create_challenge():
    cleanup_challenges()
    challenge_id = secrets.token_urlsafe(18)
    code = f"{secrets.randbelow(1_000_000):06d}"
    now = time.time()
    CHALLENGES[challenge_id] = {"code": code, "created": now, "expires": now + CHALLENGE_TTL_SECONDS}
    return {"id": challenge_id, "code": code}


def cleanup_challenges():
    now = time.time()
    expired = [challenge_id for challenge_id, value in CHALLENGES.items() if value["expires"] < now]
    for challenge_id in expired:
        CHALLENGES.pop(challenge_id, None)


def validate_challenge(payload, config):
    cleanup_challenges()
    challenge_id = clean(payload.get("challengeId"))
    answer = clean(payload.get("challengeAnswer"))
    challenge = CHALLENGES.pop(challenge_id, None)
    if challenge is None:
        raise ValueError("Verification code expired. Refresh the code and try again.")
    if answer != challenge["code"]:
        raise ValueError("Verification code is incorrect.")
    minimum_age = config_int(config, "validation", "minimumChallengeAgeSeconds", 3)
    if time.time() - challenge.get("created", 0) < minimum_age:
        raise ValueError("Please spend a little more time reviewing the form before submitting.")


def validate_payload(values, payload, config):
    validation = config.get("validation", {})
    if clean(payload.get("companyWebsite")):
        raise ValueError("Spam check failed.")
    if not PHONE_RE.match(values["phone"]):
        raise ValueError("Phone number must be 7-24 characters and use only digits, spaces, +, -, or parentheses.")
    if not ID_RE.match(values["identityId"]):
        raise ValueError("Work or school ID must be 4-32 letters, numbers, or hyphens.")
    if not ORG_RE.match(values["orgCode"]):
        raise ValueError("Department code must be 3-24 letters, numbers, or hyphens.")
    max_text_length = config_int(config, "validation", "maxTextLength", 1500)
    max_summary_length = config_int(config, "validation", "maxSummaryLength", 90)
    if len(values["summary"]) > max_summary_length:
        raise ValueError("Request summary is too long.")
    for field_name in ("details", "tried", "reference"):
        if len(values[field_name]) > max_text_length:
            raise ValueError(f"{field_name} is too long.")
    if len(values["summary"]) < config_int(config, "validation", "summaryMinLength", 12):
        raise ValueError("Request summary must be at least 12 characters.")
    if len(values["details"]) < config_int(config, "validation", "detailsMinLength", 30):
        raise ValueError("Details must be at least 30 characters.")
    if len(values["tried"]) < config_int(config, "validation", "triedMinLength", 10):
        raise ValueError("What you tried must be at least 10 characters.")
    if len(values["reference"]) < config_int(config, "validation", "referenceMinLength", 3):
        raise ValueError("Link or reference must be at least 3 characters.")
    try:
        needed_by = datetime.fromisoformat(values["neededBy"]).date()
    except ValueError as error:
        raise ValueError("Needed by must be a valid date.") from error
    if needed_by < datetime.now(timezone.utc).date():
        raise ValueError("Needed by cannot be in the past.")
    if not payload.get("available"):
        raise ValueError("You must confirm availability for follow-up questions.")
    if not payload.get("verificationConfirm"):
        raise ValueError("You must confirm the verification details are accurate.")
    if not payload.get("notEmergency"):
        raise ValueError("Emergency or urgent requests are not accepted here.")
    reject_emergency_text(values, config)


def reject_emergency_text(values, config):
    emergency = config.get("emergency", {})
    if not emergency.get("enabled", True):
        return
    keywords = [clean(keyword).lower() for keyword in emergency.get("keywords", []) if clean(keyword)]
    haystack = " ".join(values.values()).lower()
    matched = next((keyword for keyword in keywords if keyword in haystack), "")
    if matched:
        raise ValueError("Emergency or urgent requests are not accepted here.")


class RequestHandler(BaseHTTPRequestHandler):
    server_version = "PersonalRequestDesk/1.0"

    def do_GET(self):
        parsed = urlparse(self.path)
        config = load_config()
        if parsed.path == "/api/config":
            if not self.rate_limit("api", config):
                return
            self.send_json(load_config())
            return
        if parsed.path == "/api/challenge":
            if not self.rate_limit("challenge", config):
                return
            self.send_json(create_challenge())
            return
        if parsed.path == "/api/tickets":
            if not self.rate_limit("api", config):
                return
            self.send_json(STORE.list())
            return
        if parsed.path == "/api/tickets.csv":
            if not self.rate_limit("api", config):
                return
            self.send_text(
                STORE.csv(),
                content_type="text/csv; charset=utf-8",
                headers={"Content-Disposition": "attachment; filename=personal-request-desk.csv"},
            )
            return
        self.serve_static(parsed.path)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/tickets":
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        config = load_config()
        try:
            if not self.rate_limit("submit", config):
                return
            self.send_json(STORE.create(self.read_json(config)), status=HTTPStatus.CREATED)
        except PayloadTooLarge as error:
            self.send_text(str(error), status=HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
        except RateLimitExceeded as error:
            self.send_text(str(error), status=HTTPStatus.TOO_MANY_REQUESTS)
        except ValueError as error:
            self.send_text(str(error), status=HTTPStatus.BAD_REQUEST)

    def do_PATCH(self):
        parsed = urlparse(self.path)
        prefix = "/api/tickets/"
        if not parsed.path.startswith(prefix):
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        ticket_id = unquote(parsed.path[len(prefix):])
        config = load_config()
        try:
            if not self.rate_limit("api", config):
                return
            self.send_json(STORE.update(ticket_id, self.read_json(config)))
        except KeyError:
            self.send_text("Ticket not found", status=HTTPStatus.NOT_FOUND)
        except PayloadTooLarge as error:
            self.send_text(str(error), status=HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
        except RateLimitExceeded as error:
            self.send_text(str(error), status=HTTPStatus.TOO_MANY_REQUESTS)
        except ValueError as error:
            self.send_text(str(error), status=HTTPStatus.BAD_REQUEST)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        if parsed.path == "/api/tickets" and query.get("status") == ["Done"]:
            try:
                if not self.rate_limit("api", load_config()):
                    return
                self.send_json({"removed": STORE.clear_done()})
            except RateLimitExceeded as error:
                self.send_text(str(error), status=HTTPStatus.TOO_MANY_REQUESTS)
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def read_json(self, config):
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        max_bytes = config_int(config, "security", "maxRequestBytes", 12000)
        if max_bytes and length > max_bytes:
            raise PayloadTooLarge("Request body is too large.")
        raw = self.rfile.read(length).decode("utf-8")
        payload = json.loads(raw)
        if not isinstance(payload, dict):
            raise ValueError("JSON body must be an object.")
        return payload

    def rate_limit(self, scope, config):
        try:
            check_rate_limit(self.client_address[0], scope, config)
            return True
        except RateLimitExceeded as error:
            self.send_text(str(error), status=HTTPStatus.TOO_MANY_REQUESTS)
            return False

    def serve_static(self, request_path):
        path = unquote(request_path).lstrip("/") or "index.html"
        file_path = (ROOT / path).resolve()
        if ROOT not in file_path.parents and file_path != ROOT:
            self.send_error(HTTPStatus.FORBIDDEN)
            return
        if any(part.startswith(".") for part in file_path.relative_to(ROOT).parts):
            self.send_error(HTTPStatus.FORBIDDEN)
            return
        if file_path.is_dir():
            file_path = file_path / "index.html"
        if not file_path.exists():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        if file_path.suffix.lower() not in PUBLIC_EXTENSIONS:
            self.send_error(HTTPStatus.FORBIDDEN)
            return

        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        body = file_path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_text(self, body, status=HTTPStatus.OK, content_type="text/plain; charset=utf-8", headers=None):
        data = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(data)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("Content-Security-Policy", "default-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'")
        super().end_headers()

    def log_message(self, format, *args):
        print(f"{self.address_string()} - {format % args}")


def clean(value):
    return str(value or "").strip()


def safe_csv_row(ticket, columns):
    return {column: safe_csv_value(ticket.get(column, "")) for column in columns}


def safe_csv_value(value):
    text = str(value)
    return f"'{text}" if text.startswith(("=", "+", "-", "@")) else text


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def main():
    parser = argparse.ArgumentParser(description="Run Personal Request Desk.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8000, type=int)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), RequestHandler)
    print(f"Personal Request Desk running at http://{args.host}:{args.port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
