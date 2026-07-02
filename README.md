# ticket-back

> If they make you fill forms, they can fill forms too.

`ticket-back` is a personal request desk for reversing one small unfairness of modern life: organizations often require people to submit forms, open tickets, verify identity, choose categories, and wait. But when those same organizations want something from a person, they may call directly, interrupt immediately, and provide little context.

This project gives you a calm boundary:

> Please submit a ticket first.

It is not about being rude. It is about making the relationship more equal.

## 中文

> 如果他们要求你填表，他们也可以填表。

`ticket-back` 是一个个人工单系统，用来抵消一种很常见的不公平：公司、政府部门、学校、平台、房东或其他组织，常常要求个人填表、提交工单、验证身份、选择类别，然后等待处理。

但当这些组织反过来向个人提出要求时，却可能直接打电话、立即打断、不给清晰背景，也不给工单编号。

这个项目提供一个平静的边界：

> 请先提交工单。

这不是为了无礼，而是为了让关系更平等。

## Features

- Chinese-first bilingual interface
- Required request form before someone can ask for your time
- Configurable strictness levels: `easy`, `middle`, and `hard`
- Ticket queue, status tracking, owner notes, and CSV export
- Configurable categories, priorities, text, validation rules, and ad placeholder
- Basic spam resistance and private runtime data protection
- Emergency/urgent request rejection

## Run

```bash
python3 server.py --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/`.

To allow other devices on your local network:

```bash
python3 server.py --host 0.0.0.0 --port 8000
```

## Configure

Edit `site_config.json` to customize:

- strictness level
- site title and text
- categories and priorities
- ad placeholder content
- validation limits
- rate limits
- emergency keywords

Strictness levels:

- `easy`: basic request details, minimal verification
- `middle`: current default, with phone/internal ID/department code and verification code
- `hard`: middle level plus company documentation such as legal entity name, registration number, tax ID, certificate authority, certificate link, authorized representative, and authorization reference

Runtime tickets are stored in `tickets.json`, which is ignored by git.
