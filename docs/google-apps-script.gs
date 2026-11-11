/*
 * PULSE & LIFE — Google Sheets receiver with visitor chat replies.
 *
 * Existing spreadsheet tabs:
 *   ChatMessages, ContactInquiries, NewsletterSubscriptions
 *
 * After replacing this script, run upgradeSheets() ONCE to update headers
 * and migrate existing ChatMessages / NewsletterSubscriptions rows safely.
 * Then deploy a NEW VERSION of the existing Web App deployment.
 */

const SPREADSHEET_ID = "1BNaaSzPHYMUZWcglaACz0Lpf1eNEqZlOeeD4LbKrzxE";

const CHAT_HEADERS = [
  "Date", "Time", "Timestamp", "Session ID", "Name", "Email", "Phone",
  "Enquiry Type", "Sender", "Message", "Page", "Admin Reply", "Reply Timestamp"
];
const CONTACT_HEADERS = [
  "Date", "Time", "Timestamp", "Name", "Email", "Phone", "Subject", "Message", "Page"
];
const NEWSLETTER_HEADERS = [
  "Date", "Time", "Timestamp", "Name", "Email", "Phone",
  "Subscription Source", "Page", "Status"
];

function getSpreadsheet_() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.indexOf("PASTE_") === 0) {
    throw new Error("Please configure SPREADSHEET_ID first.");
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function setupSheets() {
  const ss = getSpreadsheet_();
  const tabs = {
    ChatMessages: CHAT_HEADERS,
    ContactInquiries: CONTACT_HEADERS,
    NewsletterSubscriptions: NEWSLETTER_HEADERS
  };
  Object.keys(tabs).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(tabs[name]);
      styleHeader_(sheet, tabs[name].length);
    }
  });
  return "Sheets are ready.";
}

/*
 * Run once after replacing the old script.
 * Migrates the old 7-column chat rows and 6-column newsletter rows
 * into the expanded layouts without discarding existing records.
 */
function upgradeSheets() {
  const ss = getSpreadsheet_();
  const chat = ss.getSheetByName("ChatMessages") || ss.insertSheet("ChatMessages");
  const newsletter = ss.getSheetByName("NewsletterSubscriptions") || ss.insertSheet("NewsletterSubscriptions");
  const contact = ss.getSheetByName("ContactInquiries") || ss.insertSheet("ContactInquiries");

  migrateChat_(chat);
  migrateNewsletter_(newsletter);

  if (contact.getLastRow() === 0) {
    contact.appendRow(CONTACT_HEADERS);
    styleHeader_(contact, CONTACT_HEADERS.length);
  } else {
    contact.getRange(1, 1, 1, CONTACT_HEADERS.length).setValues([CONTACT_HEADERS]);
    styleHeader_(contact, CONTACT_HEADERS.length);
  }
  return "Existing tabs upgraded. Check the headers before using the website.";
}

/* Run this once when adding the optional Enquiry Type chat field.
 * It updates only ChatMessages and preserves all existing rows/replies. */
function upgradeChatEnquiryType() {
  const sheet = getSpreadsheet_().getSheetByName("ChatMessages");
  if (!sheet) throw new Error("ChatMessages tab was not found. Run setupSheets() first.");
  migrateChat_(sheet);
  return "ChatMessages upgraded with Enquiry Type. Existing messages and replies were preserved.";
}

function migrateChat_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const values = lastRow ? sheet.getRange(1, 1, lastRow, lastCol).getValues() : [];
  const oldHeaders = (values[0] || []).map(v => String(v || "").trim());
  const index = {};
  oldHeaders.forEach((h, i) => { if (h) index[h.toLowerCase()] = i; });
  const pick = (row, header, fallback = "") => {
    const i = index[String(header).toLowerCase()];
    return i === undefined ? fallback : (row[i] === undefined ? fallback : row[i]);
  };
  const migrated = values.slice(1).filter(r => r.some(v => v !== "")).map(r => {
    const legacy = oldHeaders.length > 0 && !Object.keys(index).includes("sender");
    return [
      pick(r, "Date"), pick(r, "Time"), pick(r, "Timestamp"),
      pick(r, "Session ID"), pick(r, "Name"), pick(r, "Email"), pick(r, "Phone"),
      pick(r, "Enquiry Type"), legacy ? "Visitor" : pick(r, "Sender", "Visitor"),
      pick(r, "Message"), pageOnly_(pick(r, "Page")),
      pick(r, "Admin Reply"), pick(r, "Reply Timestamp")
    ];
  });
  sheet.clearContents();
  sheet.getRange(1, 1, 1, CHAT_HEADERS.length).setValues([CHAT_HEADERS]);
  if (migrated.length) sheet.getRange(2, 1, migrated.length, CHAT_HEADERS.length).setValues(migrated);
  styleHeader_(sheet, CHAT_HEADERS.length);
}

function migrateNewsletter_(sheet) {
  const lastRow = sheet.getLastRow();
  const oldRows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, Math.max(sheet.getLastColumn(), 6)).getValues() : [];
  const migrated = oldRows.filter(r => r.some(v => v !== "")).map(r => {
    // Previous layout: Date, Time, Timestamp, Email, Subscription Source, Page
    return [r[0] || "", r[1] || "", r[2] || "", "", r[3] || "", "", r[4] || "", pageOnly_(r[5]), "Active"];
  });
  sheet.clearContents();
  sheet.getRange(1, 1, 1, NEWSLETTER_HEADERS.length).setValues([NEWSLETTER_HEADERS]);
  if (migrated.length) sheet.getRange(2, 1, migrated.length, NEWSLETTER_HEADERS.length).setValues(migrated);
  styleHeader_(sheet, NEWSLETTER_HEADERS.length);
}

function styleHeader_(sheet, count) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, count)
    .setBackground("#092b43").setFontColor("#ffffff").setFontWeight("bold");
  sheet.autoResizeColumns(1, count);
}

function doPost(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    const type = String(p.type || "").trim();
    const now = new Date();
    const tz = "Asia/Dubai";
    const date = Utilities.formatDate(now, tz, "yyyy-MM-dd");
    const time = Utilities.formatDate(now, tz, "HH:mm:ss");
    const timestamp = Utilities.formatDate(now, tz, "yyyy-MM-dd HH:mm:ss");
    const ss = getSpreadsheet_();

    if (type === "chat" || type === "chat_profile" || type === "chat_event") {
      const sessionId = clean_(p.sessionId, 120);
      if (!sessionId) throw new Error("Chat session is missing.");
      const message = (type === "chat" || type === "chat_event" || type === "chat_profile") ? clean_(p.message, 4000) : "";
      if ((type === "chat" || type === "chat_event") && !message) throw new Error("Message is required.");
      if (type === "chat_profile" && !message) throw new Error("Profile update message is required.");
      const sender = type === "chat" ? "Visitor" : type === "chat_event" ? clean_(p.sender || "Bot", 30) : "Profile";
      if (!["Visitor", "Bot", "Admin", "Profile"].includes(sender)) throw new Error("Invalid chat sender.");
      const sheet = ss.getSheetByName("ChatMessages");
      if (!sheet) throw new Error("ChatMessages tab is missing. Run setupSheets() first.");
      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        sheet.appendRow([
          date, time, timestamp, sessionId, clean_(p.name, 150),
          clean_(p.email, 200), clean_(p.phone, 60), clean_(p.enquiryType, 120),
          sender, message, pageOnly_(p.page), "", ""
        ]);
      } finally { lock.releaseLock(); }
    } else if (type === "contact") {
      const name = clean_(p.name, 150);
      const email = clean_(p.email, 200);
      const message = clean_(p.message, 4000);
      if (!name || !validEmail_(email) || !message) throw new Error("Valid name, email and message are required.");
      ss.getSheetByName("ContactInquiries").appendRow([
        date, time, timestamp, name, email, clean_(p.phone, 60),
        clean_(p.subject, 200), message, pageOnly_(p.page)
      ]);
    } else if (type === "subscription") {
      const email = clean_(p.email, 200);
      if (!validEmail_(email)) throw new Error("A valid email is required.");
      ss.getSheetByName("NewsletterSubscriptions").appendRow([
        date, time, timestamp, clean_(p.name, 150), email,
        clean_(p.phone, 60), clean_(p.source, 120), pageOnly_(p.page), "Active"
      ]);
    } else {
      throw new Error("Unknown submission type.");
    }
    return jsonOutput_({ ok: true });
  } catch (err) {
    return jsonOutput_({ ok: false, error: err.message });
  }
}

/* Public read is restricted to the visitor's high-entropy session ID.
 * JSONP is used because Apps Script ContentService responses are cross-origin.
 */
function doGet(e) {
  const p = (e && e.parameter) ? e.parameter : {};
  if (p.action !== "chatHistory") return jsonOutput_({ ok: true, service: "Pulse Life Website API" });
  const callback = String(p.callback || "");
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService.createTextOutput("/* invalid callback */").setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  try {
    const sessionId = clean_(p.sessionId, 120);
    if (!sessionId) throw new Error("Session is missing.");
    const sheet = getSpreadsheet_().getSheetByName("ChatMessages");
    const rows = sheet.getLastRow() > 1
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, CHAT_HEADERS.length).getValues()
      : [];
    const messages = [];
    rows.forEach((r, i) => {
      if (String(r[3]) !== sessionId) return;
      const sender = String(r[8] || "");
      const message = String(r[9] || "").trim();
      if (!["Visitor", "Bot", "Admin", "Profile"].includes(sender) || !message) return;
      messages.push({
        row: i + 2,
        message: message,
        sender: sender,
        reply: sender === "Visitor" ? String(r[11] || "") : ""
      });
    });
    const payload = { ok: true, messages: messages };
    return ContentService.createTextOutput(callback + "(" + JSON.stringify(payload) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } catch (err) {
    return ContentService.createTextOutput(callback + "(" + JSON.stringify({ ok: false, error: err.message }) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}


/** Automatically timestamp an admin reply when column L is edited.
 * ChatMessages: L = Admin Reply, M = Reply Timestamp.
 */
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== "ChatMessages" || e.range.getRow() < 2 || e.range.getColumn() !== 12) return;
  const reply = String(e.value || "").trim();
  const timestampCell = sheet.getRange(e.range.getRow(), 13);
  if (reply) {
    timestampCell.setValue(Utilities.formatDate(new Date(), "Asia/Dubai", "yyyy-MM-dd HH:mm:ss"));
  } else {
    timestampCell.clearContent();
  }
}

function jsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(value, maxLength) {
  return String(value || "").replace(/[<>]/g, "").trim().slice(0, maxLength);
}
function validEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function pageOnly_(value) {
  let path = String(value || "/").split(/[?#]/)[0].trim();
  if (!path) path = "/";
  if (!path.startsWith("/")) path = "/" + path;
  path = path.replace(/\.html?$/i, "").replace(/\/+$/, "") || "/";
  if (path === "/index") path = "/";
  return path.slice(0, 120);
}
