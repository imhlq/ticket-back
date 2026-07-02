const selectedKey = "personal-request-desk:selected";
const languageKey = "personal-request-desk:language";
const adminPasscodeKey = "personal-request-desk:admin-passcode";
const statuses = ["New", "Accepted", "Waiting", "Done"];
const noteTimers = new Map();
let challenge = { id: "", code: "" };
let siteConfig = defaultSiteConfig();
let adClickSatisfied = false;
let adDismissed = false;

const translations = {
  en: {
    brand: "Personal Desk",
    headline: "Requests start with a ticket.",
    tabSubmit: "Submit",
    tabQueue: "Queue",
    callReplyTitle: "Call Reply",
    replyText: "Please submit a ticket first so I have the request, priority, deadline, and contact details in one place. Emergency or urgent work is not accepted here.",
    copyReply: "Copy Reply",
    copied: "Copied",
    copyFailed: "Copy Failed",
    statOpen: "Open",
    statToday: "Today",
    statHigh: "High",
    adEyebrow: "Ad Space",
    adTitle: "Placeholder",
    adBody: "Reserved for a future ad, announcement, or sponsor message.",
    adLinkText: "Learn more",
    adCloseLocked: "Click Ad First",
    adCloseReady: "Close",
    adClickRequired: "Click the ad once to enable closing.",
    adClicked: "Thanks. You can close this ad now.",
    intakeForm: "Intake Form",
    newRequest: "New request",
    reset: "Reset",
    verificationTitle: "Requester verification",
    verificationIntro: "Provide basic contact verification before the request form can be submitted.",
    hardVerificationTitle: "Company documentation",
    hardVerificationIntro: "For strict mode, the requester must provide organization-level public records before asking for work.",
    privacyNotice: "Do not submit government IDs, private certificates, passwords, or sensitive personal information. Use public business records and keep only what is necessary.",
    companyLegalName: "Legal entity name",
    companyLegalNamePlaceholder: "Registered company or organization name",
    companyRegistrationNumber: "Registration number",
    companyRegistrationPlaceholder: "Company registration or certificate number",
    taxId: "Tax ID",
    taxIdPlaceholder: "Taxpayer ID or equivalent",
    certificateAuthority: "Certificate authority",
    certificateAuthorityPlaceholder: "Issuing authority",
    certificateUrl: "Certificate link",
    certificateUrlPlaceholder: "Public certificate, license, or registry URL",
    authorizedRepresentative: "Authorized representative",
    authorizedRepresentativePlaceholder: "Person authorized to make this request",
    authorizationReference: "Authorization reference",
    authorizationReferencePlaceholder: "Explain why this person and organization are authorized to ask for this work.",
    phone: "Phone number",
    phonePlaceholder: "+1 555 010 1234",
    identityId: "Internal reference ID",
    identityPlaceholder: "Employee, team, or case ID",
    orgCode: "Department code",
    orgPlaceholder: "Team or office code",
    verificationCode: "Verification code",
    refreshCode: "Refresh Code",
    typeCode: "Type the verification code",
    codePlaceholder: "6-digit code",
    verificationConfirm: "I confirm the contact and request details are accurate.",
    emergencyTitle: "Emergency requests are not accepted",
    emergencyIntro: "If this is urgent, safety-related, or business-critical, use the official emergency channel instead.",
    notEmergency: "I confirm this is not an emergency or urgent request.",
    requester: "Your name",
    requesterPlaceholder: "Full name",
    contact: "Contact",
    contactPlaceholder: "Email, phone, or chat ID",
    team: "Team or location",
    teamPlaceholder: "Department, office, room",
    category: "Category",
    chooseOne: "Choose one",
    catNetwork: "Network",
    catComputer: "Computer",
    catAccount: "Account",
    catSoftware: "Software",
    catHardware: "Hardware",
    catData: "Data or report",
    catOther: "Other",
    priority: "Priority",
    priorityLow: "Low",
    priorityNormal: "Normal",
    priorityHigh: "High",
    priorityUrgent: "Urgent",
    priorityUrgentBlocked: "Urgent (not accepted)",
    neededBy: "Needed by",
    summary: "Request summary",
    summaryPlaceholder: "One sentence summary",
    details: "Details",
    detailsPlaceholder: "What do you need, what is blocked, and what outcome would be acceptable?",
    tried: "What have you tried?",
    triedPlaceholder: "Steps already taken, screenshots or links, error messages",
    reference: "Link or reference",
    referencePlaceholder: "URL, document path, asset tag, ticket number",
    available: "I will be available for follow-up questions.",
    createTicket: "Create Ticket",
    creatingTicket: "Creating ticket...",
    ticketCreated: "Created {id}.",
    loadError: "Could not load tickets",
    createError: "Could not create ticket.",
    updateError: "Could not update ticket.",
    clearError: "Could not clear completed tickets.",
    authRequired: "Enter the admin passcode first.",
    authFailed: "Admin passcode is missing or incorrect.",
    ownerView: "Owner View",
    ticketQueue: "Ticket queue",
    adminAccess: "Admin access",
    adminHint: "Enter the preset 4-8 character passcode to update tickets, export CSV, or clear completed tickets.",
    adminPasscode: "Passcode",
    adminPasscodePlaceholder: "4-8 characters",
    exportCsv: "Export CSV",
    clearDone: "Clear Done",
    search: "Search",
    searchPlaceholder: "Name, category, summary",
    status: "Status",
    all: "All",
    statusNew: "New",
    statusAccepted: "Accepted",
    statusWaiting: "Waiting",
    statusDone: "Done",
    noMatches: "No tickets match the current filters.",
    noSelected: "No ticket selected",
    chooseTicket: "Choose a ticket from the queue.",
    due: "due",
    created: "Created",
    updated: "Updated",
    requesterField: "Requester",
    teamField: "Team or location",
    neededByField: "Needed by",
    detailsField: "Details",
    triedField: "What they tried",
    referenceField: "Reference",
    availabilityField: "Availability",
    verifiedPhoneField: "Verified phone",
    identityField: "Internal reference",
    orgCodeField: "Department code",
    companyLegalNameField: "Legal entity",
    companyRegistrationNumberField: "Registration number",
    taxIdField: "Tax ID",
    certificateAuthorityField: "Certificate authority",
    certificateUrlField: "Certificate link",
    authorizedRepresentativeField: "Authorized representative",
    authorizationReferenceField: "Authorization reference",
    availableYes: "Available for follow-up",
    availableNo: "Not confirmed",
    ownerNotes: "Owner notes",
    ownerNotesPlaceholder: "Private next steps, decisions, or follow-up notes",
    clearDoneConfirm: "Clear {count} completed ticket{plural}?"
  },
  zh: {
    brand: "个人服务台",
    headline: "先提交工单，再开始处理。",
    tabSubmit: "提交",
    tabQueue: "队列",
    callReplyTitle: "电话回复",
    replyText: "请先提交工单，把请求内容、优先级、截止时间和联系方式写清楚。紧急请求不在这里受理。",
    copyReply: "复制回复",
    copied: "已复制",
    copyFailed: "复制失败",
    statOpen: "未完成",
    statToday: "今日",
    statHigh: "高优先级",
    adEyebrow: "广告位",
    adTitle: "占位内容",
    adBody: "这里预留给未来的广告、公告或赞助信息。",
    adLinkText: "了解更多",
    adCloseLocked: "先点广告",
    adCloseReady: "关闭",
    adClickRequired: "点击一次广告后即可关闭。",
    adClicked: "谢谢，现在可以关闭广告。",
    intakeForm: "受理表单",
    newRequest: "新请求",
    reset: "重置",
    verificationTitle: "请求人验证",
    verificationIntro: "提交前必须提供基础联系方式验证，并确认信息真实完整。",
    hardVerificationTitle: "公司/机构文件",
    hardVerificationIntro: "严格模式下，请求人必须提供组织层面的公开证明材料，才能提出请求。",
    privacyNotice: "请不要提交政府身份证件、非公开证书、密码或敏感个人信息。请使用公开的企业/机构记录，并只保留必要信息。",
    companyLegalName: "法定主体名称",
    companyLegalNamePlaceholder: "注册公司或机构名称",
    companyRegistrationNumber: "注册/证书编号",
    companyRegistrationPlaceholder: "公司注册号或证书编号",
    taxId: "税号",
    taxIdPlaceholder: "纳税人识别号或等效编号",
    certificateAuthority: "发证机关",
    certificateAuthorityPlaceholder: "证书或执照的签发机关",
    certificateUrl: "证书链接",
    certificateUrlPlaceholder: "公开证书、执照或登记链接",
    authorizedRepresentative: "授权代表",
    authorizedRepresentativePlaceholder: "被授权提出此请求的人",
    authorizationReference: "授权说明",
    authorizationReferencePlaceholder: "说明该人员和组织为什么有权提出此请求。",
    phone: "手机号码",
    phonePlaceholder: "+86 138 0000 0000",
    identityId: "内部参考编号",
    identityPlaceholder: "员工号、团队编号或案件编号",
    orgCode: "部门代码",
    orgPlaceholder: "团队或办公室代码",
    verificationCode: "验证码",
    refreshCode: "刷新验证码",
    typeCode: "输入验证码",
    codePlaceholder: "6 位数字",
    verificationConfirm: "我确认联系方式和请求信息准确无误。",
    emergencyTitle: "不接受紧急请求",
    emergencyIntro: "如果这是紧急、安全相关或关键业务问题，请使用正式紧急渠道。",
    notEmergency: "我确认这不是紧急或加急请求。",
    requester: "姓名",
    requesterPlaceholder: "真实姓名",
    contact: "联系方式",
    contactPlaceholder: "邮箱、电话或聊天账号",
    team: "团队或地点",
    teamPlaceholder: "部门、办公室、房间号",
    category: "类别",
    chooseOne: "请选择",
    catNetwork: "网络",
    catComputer: "电脑",
    catAccount: "账号",
    catSoftware: "软件",
    catHardware: "硬件",
    catData: "数据或报表",
    catOther: "其他",
    priority: "优先级",
    priorityLow: "低",
    priorityNormal: "普通",
    priorityHigh: "高",
    priorityUrgent: "紧急",
    priorityUrgentBlocked: "紧急（不受理）",
    neededBy: "需要完成日期",
    summary: "请求摘要",
    summaryPlaceholder: "用一句话说明请求",
    details: "详细说明",
    detailsPlaceholder: "你需要什么、什么被阻塞、可接受的结果是什么？",
    tried: "你已经尝试过什么？",
    triedPlaceholder: "已尝试的步骤、截图或链接、错误信息",
    reference: "链接或参考信息",
    referencePlaceholder: "URL、文档路径、资产编号、已有工单号",
    available: "我会配合后续问题。",
    createTicket: "创建工单",
    creatingTicket: "正在创建工单...",
    ticketCreated: "已创建 {id}。",
    loadError: "无法加载工单",
    createError: "无法创建工单。",
    updateError: "无法更新工单。",
    clearError: "无法清除已完成工单。",
    authRequired: "请先输入管理员密码。",
    authFailed: "管理员密码缺失或错误。",
    ownerView: "处理人视图",
    ticketQueue: "工单队列",
    adminAccess: "管理员权限",
    adminHint: "输入预先设置的 4-8 位密码后，才能更新工单、导出 CSV 或清除已完成工单。",
    adminPasscode: "密码",
    adminPasscodePlaceholder: "4-8 位字符",
    exportCsv: "导出 CSV",
    clearDone: "清除已完成",
    search: "搜索",
    searchPlaceholder: "姓名、类别、摘要",
    status: "状态",
    all: "全部",
    statusNew: "新建",
    statusAccepted: "已接受",
    statusWaiting: "等待中",
    statusDone: "已完成",
    noMatches: "没有符合当前筛选条件的工单。",
    noSelected: "未选择工单",
    chooseTicket: "请从队列中选择一个工单。",
    due: "截止",
    created: "创建",
    updated: "更新",
    requesterField: "请求人",
    teamField: "团队或地点",
    neededByField: "需要完成日期",
    detailsField: "详细说明",
    triedField: "已尝试内容",
    referenceField: "参考信息",
    availabilityField: "配合状态",
    verifiedPhoneField: "已验证手机号",
    identityField: "内部参考编号",
    orgCodeField: "部门代码",
    companyLegalNameField: "法定主体",
    companyRegistrationNumberField: "注册/证书编号",
    taxIdField: "税号",
    certificateAuthorityField: "发证机关",
    certificateUrlField: "证书链接",
    authorizedRepresentativeField: "授权代表",
    authorizationReferenceField: "授权说明",
    availableYes: "可配合后续问题",
    availableNo: "未确认",
    ownerNotes: "处理人备注",
    ownerNotesPlaceholder: "私人的后续步骤、决定或跟进备注",
    clearDoneConfirm: "清除 {count} 个已完成工单？"
  }
};

const state = {
  tickets: [],
  selectedId: localStorage.getItem(selectedKey) || null,
  language: localStorage.getItem(languageKey) || "zh",
  adminPasscode: sessionStorage.getItem(adminPasscodeKey) || "",
  filters: {
    search: "",
    status: "all",
    priority: "all"
  }
};

const elements = {
  tabs: document.querySelectorAll(".tab"),
  views: {
    submit: document.querySelector("#submitView"),
    queue: document.querySelector("#queueView")
  },
  form: document.querySelector("#ticketForm"),
  formStatus: document.querySelector("#formStatus"),
  resetForm: document.querySelector("#resetForm"),
  verificationBox: document.querySelector(".verification-box"),
  hardVerificationBox: document.querySelector("#hardVerificationBox"),
  challengeRow: document.querySelector(".challenge-row"),
  challengeAnswer: document.querySelector("#challengeAnswer"),
  verificationConfirm: document.querySelector("#verificationConfirm"),
  ticketList: document.querySelector("#ticketList"),
  ticketDetail: document.querySelector("#ticketDetail"),
  adModal: document.querySelector("#adModal"),
  adTitle: document.querySelector("#ad-title"),
  adBody: document.querySelector("#adBody"),
  adAction: document.querySelector("#adAction"),
  adClose: document.querySelector("#adClose"),
  adHint: document.querySelector("#adHint"),
  langButtons: document.querySelectorAll(".lang-button"),
  challengeCode: document.querySelector("#challengeCode"),
  refreshChallenge: document.querySelector("#refreshChallenge"),
  searchTickets: document.querySelector("#searchTickets"),
  statusFilter: document.querySelector("#statusFilter"),
  priorityFilter: document.querySelector("#priorityFilter"),
  adminPasscode: document.querySelector("#adminPasscode"),
  exportCsv: document.querySelector("#exportCsv"),
  clearDone: document.querySelector("#clearDone"),
  copyReply: document.querySelector("#copyReply"),
  replyText: document.querySelector("#replyText"),
  openCount: document.querySelector("#openCount"),
  todayCount: document.querySelector("#todayCount"),
  highCount: document.querySelector("#highCount"),
  ticketTemplate: document.querySelector("#ticketButtonTemplate")
};

bindEvents();
setMinimumDate();
applyLanguage();
initialize();

function defaultSiteConfig() {
  return {
    siteTitle: {
      en: "Personal Request Desk",
      zh: "个人服务台"
    },
    defaultLanguage: "zh",
    text: {},
    ad: {
      enabled: true,
      title: {
        en: "Ad placeholder",
        zh: "广告占位"
      },
      body: {
        en: "Reserved for a future ad, announcement, or sponsor message.",
        zh: "这里预留给未来的广告、公告或赞助信息。"
      },
      linkText: {
        en: "Learn more",
        zh: "了解更多"
      },
      url: ""
    },
    strictness: {
      activeLevel: "middle",
      levels: {
        easy: {
          requireChallenge: false,
          requireVerificationConfirm: false,
          verificationFields: [],
          companyFields: []
        },
        middle: {
          requireChallenge: true,
          requireVerificationConfirm: true,
          verificationFields: ["phone", "identityId", "orgCode"],
          companyFields: []
        },
        hard: {
          requireChallenge: true,
          requireVerificationConfirm: true,
          verificationFields: ["phone", "orgCode"],
          companyFields: [
            "companyLegalName",
            "companyRegistrationNumber",
            "taxId",
            "certificateAuthority",
            "certificateUrl",
            "authorizedRepresentative",
            "authorizationReference"
          ]
        }
      }
    },
    categories: [
      option("Network", "Network", "网络"),
      option("Computer", "Computer", "电脑"),
      option("Account", "Account", "账号"),
      option("Software", "Software", "软件"),
      option("Hardware", "Hardware", "硬件"),
      option("Data or report", "Data or report", "数据或报表"),
      option("Other", "Other", "其他")
    ],
    priorities: [
      option("Low", "Low", "低"),
      option("Normal", "Normal", "普通"),
      option("High", "High", "高")
    ],
    emergency: {
      enabled: true,
      keywords: ["emergency", "urgent", "asap", "immediately", "911", "紧急", "急需", "立即", "马上"]
    },
    validation: {
      summaryMinLength: 12,
      detailsMinLength: 30,
      triedMinLength: 10,
      referenceMinLength: 3,
      maxTextLength: 1500,
      maxSummaryLength: 90,
      minimumChallengeAgeSeconds: 3
    },
    security: {
      maxRequestBytes: 12000,
      rateLimits: {
        challenge: { limit: 20, windowSeconds: 300 },
        submit: { limit: 6, windowSeconds: 3600 },
        api: { limit: 120, windowSeconds: 300 }
      }
    },
    admin: {
      enabled: true
    }
  };
}

function option(value, en, zh) {
  return { value, label: { en, zh } };
}

async function initialize() {
  await loadConfig();
  if (activeStrictnessLevel().requireChallenge) {
    await refreshChallenge();
  }
  await loadTickets();
}

async function loadConfig() {
  try {
    const response = await fetch("/api/config");
    if (!response.ok) throw new Error(t("loadError"));
    siteConfig = mergeConfig(defaultSiteConfig(), await response.json());
  } catch {
    siteConfig = defaultSiteConfig();
  }
  applyConfig();
}

function mergeConfig(base, override) {
  if (!override || typeof override !== "object") return base;
  return {
    ...base,
    ...override,
    text: { ...base.text, ...(override.text || {}) },
    ad: { ...base.ad, ...(override.ad || {}) },
    strictness: mergeStrictness(base.strictness, override.strictness),
    admin: { ...base.admin, ...(override.admin || {}) },
    emergency: { ...base.emergency, ...(override.emergency || {}) },
    validation: { ...base.validation, ...(override.validation || {}) },
    security: { ...base.security, ...(override.security || {}) },
    categories: Array.isArray(override.categories) ? override.categories : base.categories,
    priorities: Array.isArray(override.priorities) ? override.priorities : base.priorities
  };
}

function mergeStrictness(base, override) {
  if (!override || typeof override !== "object") return base;
  const levels = { ...base.levels };
  Object.entries(override.levels || {}).forEach(([levelName, levelConfig]) => {
    levels[levelName] = { ...(levels[levelName] || {}), ...(levelConfig || {}) };
  });
  return {
    ...base,
    ...override,
    levels
  };
}

function applyConfig() {
  if (!localStorage.getItem(languageKey) && siteConfig.defaultLanguage) {
    state.language = siteConfig.defaultLanguage === "en" ? "en" : "zh";
  }
  document.title = localizedConfigText(siteConfig.siteTitle, t("brand"));
  populateSelect(document.querySelector("#category"), siteConfig.categories, true);
  populateSelect(document.querySelector("#priority"), siteConfig.priorities, true);
  populateSelect(elements.priorityFilter, siteConfig.priorities, false, true);
  applyValidationConfig();
  applyStrictnessConfig();
  applyLanguage();
  applyAdConfig();
}

function applyValidationConfig() {
  const validation = siteConfig.validation || {};
  setNumberAttribute("#summary", "minlength", validation.summaryMinLength);
  setNumberAttribute("#summary", "maxlength", validation.maxSummaryLength);
  setNumberAttribute("#details", "minlength", validation.detailsMinLength);
  setNumberAttribute("#details", "maxlength", validation.maxTextLength);
  setNumberAttribute("#tried", "minlength", validation.triedMinLength);
  setNumberAttribute("#tried", "maxlength", validation.maxTextLength);
  setNumberAttribute("#reference", "minlength", validation.referenceMinLength);
  setNumberAttribute("#reference", "maxlength", validation.maxTextLength);
}

function setNumberAttribute(selector, attribute, value) {
  if (!Number.isFinite(Number(value))) return;
  document.querySelector(selector).setAttribute(attribute, String(value));
}

function applyStrictnessConfig() {
  const level = activeStrictnessLevel();
  const verificationFields = new Set(level.verificationFields || []);
  const companyFields = new Set(level.companyFields || []);
  const showVerification = level.requireChallenge || level.requireVerificationConfirm || verificationFields.size > 0;

  elements.verificationBox.hidden = !showVerification;
  elements.challengeRow.hidden = !level.requireChallenge;
  elements.challengeAnswer.required = !!level.requireChallenge;
  elements.challengeAnswer.disabled = !level.requireChallenge;
  elements.verificationConfirm.required = !!level.requireVerificationConfirm;
  elements.verificationConfirm.disabled = !level.requireVerificationConfirm;
  elements.verificationConfirm.closest("label").hidden = !level.requireVerificationConfirm;

  ["phone", "identityId", "orgCode"].forEach((fieldName) => {
    setFieldRequirement(fieldName, verificationFields.has(fieldName));
  });

  elements.hardVerificationBox.hidden = companyFields.size === 0;
  hardCompanyFields().forEach((fieldName) => {
    setFieldRequirement(fieldName, companyFields.has(fieldName));
  });
}

function activeStrictnessLevel() {
  const strictness = siteConfig.strictness || {};
  const levels = strictness.levels || {};
  const activeLevel = strictness.activeLevel || "middle";
  return levels[activeLevel] || levels.middle || defaultSiteConfig().strictness.levels.middle;
}

function hardCompanyFields() {
  return [
    "companyLegalName",
    "companyRegistrationNumber",
    "taxId",
    "certificateAuthority",
    "certificateUrl",
    "authorizedRepresentative",
    "authorizationReference"
  ];
}

function setFieldRequirement(fieldName, isRequired) {
  const field = document.querySelector(`[name="${fieldName}"]`);
  if (!field) return;
  const label = field.closest("label");
  field.required = isRequired;
  field.disabled = !isRequired;
  if (label) label.hidden = !isRequired;
  if (!isRequired) field.value = "";
}

function populateSelect(select, options, includePlaceholder, includeAll = false) {
  const currentValue = select.value;
  select.innerHTML = "";

  if (includePlaceholder) {
    select.append(createSelectOption("", t("chooseOne")));
  }
  if (includeAll) {
    select.append(createSelectOption("all", t("all")));
  }

  options.forEach((item) => {
    select.append(createSelectOption(item.value, optionLabel(item)));
  });

  const values = Array.from(select.options).map((item) => item.value);
  select.value = values.includes(currentValue) ? currentValue : select.options[0]?.value || "";
}

function createSelectOption(value, label) {
  const optionEl = document.createElement("option");
  optionEl.value = value;
  optionEl.textContent = label;
  return optionEl;
}

function optionLabel(item) {
  return item.label?.[state.language] || item.label?.en || item.value;
}

function applyAdConfig() {
  const ad = siteConfig.ad || {};
  elements.adTitle.textContent = localizedConfigText(ad.title, t("adTitle"));
  elements.adBody.textContent = localizedConfigText(ad.body, t("adBody"));
  elements.adAction.textContent = localizedConfigText(ad.linkText, t("adLinkText"));
  elements.adHint.textContent = adClickSatisfied ? t("adClicked") : t("adClickRequired");
  elements.adClose.textContent = adClickSatisfied ? t("adCloseReady") : t("adCloseLocked");
  elements.adClose.disabled = !adClickSatisfied;
  elements.adModal.hidden = ad.enabled === false || adDismissed;
}

function localizedConfigText(value, fallback) {
  if (typeof value === "string") return value;
  return value?.[state.language] || value?.en || fallback;
}

function bindEvents() {
  elements.adminPasscode.value = state.adminPasscode;
  elements.adminPasscode.addEventListener("input", (event) => {
    state.adminPasscode = event.target.value.trim();
    sessionStorage.setItem(adminPasscodeKey, state.adminPasscode);
  });

  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  elements.langButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.language = button.dataset.lang;
      localStorage.setItem(languageKey, state.language);
      applyConfig();
      render();
    });
  });

  elements.refreshChallenge.addEventListener("click", refreshChallenge);
  elements.form.addEventListener("submit", createTicket);
  elements.resetForm.addEventListener("click", () => {
    elements.form.reset();
    setMinimumDate();
    if (activeStrictnessLevel().requireChallenge) {
      refreshChallenge();
    }
    setStatus("");
  });

  elements.searchTickets.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    renderQueue();
  });

  elements.statusFilter.addEventListener("change", (event) => {
    state.filters.status = event.target.value;
    renderQueue();
  });

  elements.priorityFilter.addEventListener("change", (event) => {
    state.filters.priority = event.target.value;
    renderQueue();
  });

  elements.exportCsv.addEventListener("click", exportTickets);
  elements.clearDone.addEventListener("click", clearDoneTickets);
  elements.copyReply.addEventListener("click", copyReplyText);
  elements.adAction.addEventListener("click", handleAdAction);
  elements.adClose.addEventListener("click", closeAd);
}

function handleAdAction() {
  const ad = siteConfig.ad || {};
  adClickSatisfied = true;
  applyAdConfig();
  if (ad.url) {
    window.open(ad.url, "_blank", "noopener");
  }
}

function closeAd() {
  if (!adClickSatisfied) return;
  adDismissed = true;
  elements.adModal.hidden = true;
}

function t(key, params = {}) {
  const template = siteConfig.text?.[state.language]?.[key] || siteConfig.text?.en?.[key] || translations[state.language]?.[key] || translations.en[key] || key;
  return Object.entries(params).reduce((text, [name, value]) => {
    return text.replaceAll(`{${name}}`, value);
  }, template);
}

function applyLanguage() {
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
  });
  elements.langButtons.forEach((button) => {
    const isActive = button.dataset.lang === state.language;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

async function refreshChallenge() {
  if (!activeStrictnessLevel().requireChallenge) {
    challenge = { id: "", code: "" };
    elements.challengeCode.textContent = "------";
    elements.challengeAnswer.value = "";
    return;
  }
  try {
    const response = await fetch("/api/challenge");
    if (!response.ok) throw new Error(t("loadError"));
    challenge = await response.json();
    elements.challengeCode.textContent = challenge.code;
    document.querySelector("#challengeAnswer").value = "";
  } catch (error) {
    challenge = { id: "", code: "" };
    elements.challengeCode.textContent = "------";
    setStatus(error.message || t("loadError"), true);
  }
}

async function loadTickets() {
  try {
    const response = await fetch("/api/tickets");
    if (!response.ok) throw new Error(t("loadError"));
    state.tickets = await response.json();
    if (!state.tickets.some((ticket) => ticket.id === state.selectedId)) {
      state.selectedId = state.tickets[0]?.id || null;
    }
    render();
  } catch (error) {
    setStatus(error.message, true);
    render();
  }
}

function switchView(viewName) {
  elements.tabs.forEach((tab) => {
    const isActive = tab.dataset.view === viewName;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });

  Object.entries(elements.views).forEach(([name, view]) => {
    view.classList.toggle("active", name === viewName);
  });

  if (viewName === "queue") {
    loadTickets();
  }
}

async function createTicket(event) {
  event.preventDefault();
  const data = new FormData(elements.form);
  const submitButton = elements.form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  setStatus(t("creatingTicket"));

  const payload = {
    phone: clean(data.get("phone")),
    identityId: clean(data.get("identityId")),
    orgCode: clean(data.get("orgCode")),
    challengeId: challenge.id,
    challengeAnswer: clean(data.get("challengeAnswer")),
    companyWebsite: clean(data.get("companyWebsite")),
    verificationConfirm: data.get("verificationConfirm") === "on",
    notEmergency: data.get("notEmergency") === "on" || data.get("notEmergency") === "true",
    requester: clean(data.get("requester")),
    contact: clean(data.get("contact")),
    team: clean(data.get("team")),
    category: clean(data.get("category")),
    priority: clean(data.get("priority")),
    neededBy: clean(data.get("neededBy")),
    summary: clean(data.get("summary")),
    details: clean(data.get("details")),
    tried: clean(data.get("tried")),
    reference: clean(data.get("reference")),
    available: data.get("available") === "on",
    companyLegalName: clean(data.get("companyLegalName")),
    companyRegistrationNumber: clean(data.get("companyRegistrationNumber")),
    taxId: clean(data.get("taxId")),
    certificateAuthority: clean(data.get("certificateAuthority")),
    certificateUrl: clean(data.get("certificateUrl")),
    authorizedRepresentative: clean(data.get("authorizedRepresentative")),
    authorizationReference: clean(data.get("authorizationReference"))
  };

  try {
    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await response.text());

    const ticket = await response.json();
    state.tickets.unshift(ticket);
    state.selectedId = ticket.id;
    localStorage.setItem(selectedKey, ticket.id);
    elements.form.reset();
    setMinimumDate();
    if (activeStrictnessLevel().requireChallenge) {
      await refreshChallenge();
    }
    setStatus(t("ticketCreated", { id: ticket.id }));
    switchView("queue");
    render();
  } catch (error) {
    await refreshChallenge();
    setStatus(error.message || t("createError"), true);
  } finally {
    submitButton.disabled = false;
  }
}

function render() {
  renderStats();
  renderQueue();
}

function renderStats() {
  const today = new Date().toISOString().slice(0, 10);
  elements.openCount.textContent = state.tickets.filter((ticket) => ticket.status !== "Done").length;
  elements.todayCount.textContent = state.tickets.filter((ticket) => ticket.createdAt.slice(0, 10) === today).length;
  elements.highCount.textContent = state.tickets.filter((ticket) => ticket.priority === "High" && ticket.status !== "Done").length;
}

function renderQueue() {
  const tickets = filteredTickets();
  elements.ticketList.innerHTML = "";

  if (tickets.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    empty.textContent = t("noMatches");
    elements.ticketList.append(empty);
  } else {
    tickets.forEach((ticket) => elements.ticketList.append(createTicketButton(ticket)));
  }

  if (!state.tickets.some((ticket) => ticket.id === state.selectedId)) {
    state.selectedId = tickets[0]?.id || state.tickets[0]?.id || null;
  }

  renderDetail();
}

function createTicketButton(ticket) {
  const node = elements.ticketTemplate.content.firstElementChild.cloneNode(true);
  node.classList.toggle("active", ticket.id === state.selectedId);
  node.querySelector(".ticket-id").textContent = ticket.id;
  node.querySelector(".ticket-summary").textContent = ticket.summary;
  node.querySelector(".ticket-meta").textContent = `${ticket.requester} · ${displayCategory(ticket.category)} · ${t("due")} ${formatDate(ticket.neededBy)}`;

  const badge = node.querySelector(".badge");
  badge.textContent = `${displayPriority(ticket.priority)} / ${displayStatus(ticket.status)}`;
  badge.classList.add(ticket.priority.toLowerCase());

  node.addEventListener("click", () => {
    state.selectedId = ticket.id;
    localStorage.setItem(selectedKey, ticket.id);
    renderQueue();
  });

  return node;
}

function renderDetail() {
  const ticket = state.tickets.find((item) => item.id === state.selectedId);

  if (!ticket) {
    elements.ticketDetail.innerHTML = `
      <div class="empty-state">
        <h3>${escapeHtml(t("noSelected"))}</h3>
        <p>${escapeHtml(t("chooseTicket"))}</p>
      </div>
    `;
    return;
  }

  elements.ticketDetail.innerHTML = "";
  const fragment = document.createDocumentFragment();

  const head = document.createElement("header");
  head.className = "detail-head";
  head.innerHTML = `
    <div class="detail-topline">
      <span class="detail-id">${escapeHtml(ticket.id)}</span>
      <span class="badge ${ticket.priority.toLowerCase()}">${escapeHtml(displayPriority(ticket.priority))} / ${escapeHtml(displayStatus(ticket.status))}</span>
    </div>
    <h3 class="detail-title">${escapeHtml(ticket.summary)}</h3>
    <p class="ticket-meta">${escapeHtml(t("created"))} ${formatDateTime(ticket.createdAt)} · ${escapeHtml(t("updated"))} ${formatDateTime(ticket.updatedAt)}</p>
  `;
  fragment.append(head);

  const grid = document.createElement("section");
  grid.className = "detail-grid";
  grid.append(
    fieldBox(t("requesterField"), `${ticket.requester} (${ticket.contact})`),
    fieldBox(t("verifiedPhoneField"), ticket.phone || "Not provided"),
    fieldBox(t("identityField"), ticket.identityId || "Not provided"),
    fieldBox(t("orgCodeField"), ticket.orgCode || "Not provided"),
    fieldBox(t("teamField"), ticket.team),
    fieldBox(t("category"), displayCategory(ticket.category)),
    fieldBox(t("neededByField"), formatDate(ticket.neededBy)),
    fieldBox(t("detailsField"), ticket.details),
    fieldBox(t("triedField"), ticket.tried),
    fieldBox(t("referenceField"), ticket.reference),
    fieldBox(t("availabilityField"), ticket.available ? t("availableYes") : t("availableNo"))
  );
  hardCompanyDetailBoxes(ticket).forEach((box) => grid.append(box));
  fragment.append(grid);

  const actions = document.createElement("div");
  actions.className = "detail-actions";
  statuses.forEach((status) => {
    const button = document.createElement("button");
    button.type = "button";
    button.classList.toggle("active", ticket.status === status);
    button.textContent = displayStatus(status);
    button.addEventListener("click", () => updateTicket(ticket.id, { status }));
    actions.append(button);
  });
  fragment.append(actions);

  const notes = document.createElement("label");
  notes.className = "notes-box";
  notes.textContent = t("ownerNotes");
  const textarea = document.createElement("textarea");
  textarea.value = ticket.ownerNotes || "";
  textarea.placeholder = t("ownerNotesPlaceholder");
  textarea.addEventListener("input", (event) => updateNotes(ticket.id, event.target.value));
  notes.append(textarea);
  fragment.append(notes);

  elements.ticketDetail.append(fragment);
}

function fieldBox(label, value) {
  const box = document.createElement("div");
  box.className = "field-box";

  const labelEl = document.createElement("span");
  labelEl.textContent = label;

  const valueEl = document.createElement("p");
  valueEl.textContent = value;

  box.append(labelEl, valueEl);
  return box;
}

function hardCompanyDetailBoxes(ticket) {
  const fields = [
    ["companyLegalName", t("companyLegalNameField")],
    ["companyRegistrationNumber", t("companyRegistrationNumberField")],
    ["taxId", t("taxIdField")],
    ["certificateAuthority", t("certificateAuthorityField")],
    ["certificateUrl", t("certificateUrlField")],
    ["authorizedRepresentative", t("authorizedRepresentativeField")],
    ["authorizationReference", t("authorizationReferenceField")]
  ];
  return fields
    .filter(([fieldName]) => ticket[fieldName])
    .map(([fieldName, label]) => fieldBox(label, ticket[fieldName]));
}

async function updateTicket(id, patch) {
  const ticket = state.tickets.find((item) => item.id === id);
  if (!ticket) return;
  const passcode = requireAdminPasscode();
  if (!passcode) return;

  Object.assign(ticket, patch, { updatedAt: new Date().toISOString() });
  render();

  try {
    const response = await fetch(`/api/tickets/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: adminHeaders({ "Content-Type": "application/json" }, passcode),
      body: JSON.stringify(patch)
    });
    if (!response.ok) throw new Error(await response.text());
    const updated = await response.json();
    state.tickets = state.tickets.map((item) => (item.id === id ? updated : item));
    render();
  } catch (error) {
    setStatus(error.message || t("updateError"), true);
    await loadTickets();
  }
}

function updateNotes(id, ownerNotes) {
  const ticket = state.tickets.find((item) => item.id === id);
  if (!ticket) return;

  ticket.ownerNotes = ownerNotes;
  ticket.updatedAt = new Date().toISOString();
  renderStats();

  window.clearTimeout(noteTimers.get(id));
  noteTimers.set(id, window.setTimeout(() => updateTicket(id, { ownerNotes }), 400));
}

function filteredTickets() {
  const { search, status, priority } = state.filters;
  return state.tickets.filter((ticket) => {
    const searchable = [
      ticket.id,
      ticket.requester,
      ticket.phone,
      ticket.identityId,
      ticket.orgCode,
      ticket.contact,
      ticket.team,
      ticket.category,
      ticket.priority,
      ticket.summary,
      ticket.details,
      ticket.companyLegalName,
      ticket.companyRegistrationNumber,
      ticket.taxId,
      ticket.certificateAuthority,
      ticket.certificateUrl,
      ticket.authorizedRepresentative,
      ticket.authorizationReference
    ].join(" ").toLowerCase();

    const matchesSearch = search === "" || searchable.includes(search);
    const matchesStatus = status === "all" || ticket.status === status;
    const matchesPriority = priority === "all" || ticket.priority === priority;
    return matchesSearch && matchesStatus && matchesPriority;
  });
}

async function exportTickets() {
  const passcode = requireAdminPasscode();
  if (!passcode) return;

  try {
    const response = await fetch("/api/tickets.csv", { headers: adminHeaders({}, passcode) });
    if (!response.ok) throw new Error(await response.text());
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "personal-request-desk.csv";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    setStatus(error.message || t("authFailed"), true);
  }
}

async function clearDoneTickets() {
  const passcode = requireAdminPasscode();
  if (!passcode) return;
  const doneCount = state.tickets.filter((ticket) => ticket.status === "Done").length;
  if (doneCount === 0) return;

  const confirmed = window.confirm(t("clearDoneConfirm", { count: doneCount, plural: doneCount === 1 ? "" : "s" }));
  if (!confirmed) return;

  try {
    const response = await fetch("/api/tickets?status=Done", {
      method: "DELETE",
      headers: adminHeaders({}, passcode)
    });
    if (!response.ok) throw new Error(await response.text());
    await loadTickets();
  } catch (error) {
    setStatus(error.message || t("clearError"), true);
  }
}

function requireAdminPasscode() {
  const passcode = state.adminPasscode.trim();
  if (!/^[A-Za-z0-9]{4,8}$/.test(passcode)) {
    elements.adminPasscode.focus();
    setStatus(t("authRequired"), true);
    return "";
  }
  return passcode;
}

function adminHeaders(headers = {}, passcode = state.adminPasscode.trim()) {
  return {
    ...headers,
    "X-Admin-Passcode": passcode
  };
}

async function copyReplyText() {
  const text = `${elements.replyText.textContent} ${window.location.href}`;

  try {
    await navigator.clipboard.writeText(text);
    elements.copyReply.textContent = t("copied");
  } catch {
    elements.copyReply.textContent = t("copyFailed");
  }

  window.setTimeout(() => {
    elements.copyReply.textContent = t("copyReply");
  }, 1600);
}

function setMinimumDate() {
  const today = new Date().toISOString().slice(0, 10);
  const neededBy = document.querySelector("#neededBy");
  neededBy.min = today;
  neededBy.value = today;
}

function setStatus(message, isError = false) {
  elements.formStatus.textContent = message;
  elements.formStatus.classList.toggle("error", isError);
}

function clean(value) {
  return String(value || "").trim();
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat(locale(), {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${dateString}T00:00:00`));
}

function formatDateTime(dateString) {
  return new Intl.DateTimeFormat(locale(), {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(dateString));
}

function locale() {
  return state.language === "zh" ? "zh-CN" : undefined;
}

function displayStatus(status) {
  return {
    New: t("statusNew"),
    Accepted: t("statusAccepted"),
    Waiting: t("statusWaiting"),
    Done: t("statusDone")
  }[status] || status;
}

function displayPriority(priority) {
  return displayConfiguredOption(siteConfig.priorities, priority) || {
    Urgent: t("priorityUrgentBlocked")
  }[priority] || priority;
}

function displayCategory(category) {
  return displayConfiguredOption(siteConfig.categories, category) || category;
}

function displayConfiguredOption(options, value) {
  const item = options.find((optionItem) => optionItem.value === value);
  return item ? optionLabel(item) : "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
