
/* =========================================================
   PULSE & LIFE - PROFESSIONAL CHATBOT
   - Customer messages and profile details are saved.
   - Automatic bot replies are NOT saved to Google Sheets.
   - Admin replies are read from chat history.
   - Duplicate submission protection.
   - No automatic scroll jump while customer reads old messages.
   ========================================================= */

(() => {
  "use strict";

  // Prevent the same script from attaching listeners twice.
  if (window.__PULSE_LIFE_CHAT_V2__) return;
  window.__PULSE_LIFE_CHAT_V2__ = true;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const panel = $("#chatPanel");
  const messagesEl = $("#chatMessages");
  const form = $("#chatForm");
  const input = form?.querySelector("[name='message']");
  const sendButton = form?.querySelector("button[type='submit']");
  const launch = $("#chatLaunch");
  const statusEl = $("#chatStatus");

  if (!panel || !messagesEl || !form || !input || !launch) {
    console.warn("Pulse & Life chatbot: Required HTML elements were not found.");
    return;
  }

  // Prevent duplicate binding on the same form.
  if (form.dataset.chatBound === "true") return;
  form.dataset.chatBound = "true";

  const sessionId = createSessionId();

  const profile = {
    name: "",
    email: "",
    phone: "",
    enquiryType: ""
  };

  const renderedRows = new Set();

  let busy = false;
  let historyBusy = false;
  let poller = null;
  let profileMode = "";
  let greetingShown = false;
  let askedForContact = false;
  let lastHistoryError = "";

  const profileButtons = {
    name: $('[data-profile="name"]'),
    email: $('[data-profile="email"]'),
    phone: $('[data-profile="phone"]')
  };

  const enquiryButtons = $$("[data-enquiry]");

  function createSessionId() {
    const bytes = new Uint8Array(18);

    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    return "PL-" + Array.from(bytes, byte =>
      byte.toString(16).padStart(2, "0")
    ).join("");
  }

  const currentPage = () => location.pathname || "/";

  function setStatus(message = "") {
    if (statusEl) statusEl.textContent = message;
  }

  function normalizeName(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  function nearBottom() {
    const distance =
      messagesEl.scrollHeight -
      messagesEl.scrollTop -
      messagesEl.clientHeight;

    return distance < 100;
  }

  function scrollToBottom(force = false) {
    if (!force && !nearBottom()) return;

    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function addBubble(message, sender, uniqueKey, forceScroll = false) {
    const text = String(message || "").trim();

    if (!text || renderedRows.has(uniqueKey)) return false;

    const shouldScroll = forceScroll || nearBottom();

    renderedRows.add(uniqueKey);

    const bubble = document.createElement("div");

    const isCustomer =
      sender === "Visitor" ||
      sender === "Profile" ||
      sender === "Customer";

    bubble.className =
      "chat-msg " + (isCustomer ? "user" : "admin");

    bubble.dataset.messageKey = uniqueKey;
    bubble.textContent = text;

    messagesEl.appendChild(bubble);

    if (shouldScroll) scrollToBottom(true);

    return true;
  }

  function botSay(message) {
    addBubble(
      message,
      "Bot",
      "local-bot-" + crypto.randomUUID(),
      true
    );
  }

  // IMPORTANT: Bot messages are never posted to /api/sheets.
  async function saveCustomerMessage(payload) {
    const response = await fetch("/api/sheets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...payload,
        sessionId,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        enquiryType: profile.enquiryType,
        page: currentPage(),
        sender: payload.sender || "Visitor"
      }),
      cache: "no-store"
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      throw new Error(
        result.error || "Your message could not be saved. Please try again."
      );
    }

    return result;
  }

  function readProfileFromHistory(messages) {
    messages.forEach(item => {
      if (item.sender !== "Profile") return;

      const text = String(item.message || "");

      const name = text.match(/^(?:Shared\s+)?Name:\s*(.+)$/i);
      const email = text.match(/^(?:Shared\s+)?Email:\s*(.+)$/i);
      const phone = text.match(/^(?:Shared\s+)?Phone:\s*(.+)$/i);
      const enquiry = text.match(/^Enquiry type:\s*(.+)$/i);

      if (name) profile.name = name[1].trim();
      if (email) profile.email = email[1].trim();
      if (phone) profile.phone = phone[1].trim();
      if (enquiry) profile.enquiryType = enquiry[1].trim();
    });

    updateProfileButtons();
  }

  async function refreshHistory() {
    if (historyBusy || !panel.classList.contains("open")) return;

    historyBusy = true;

    try {
      const response = await fetch(
        "/api/chat?sessionId=" + encodeURIComponent(sessionId),
        {
          method: "GET",
          cache: "no-store"
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to load chat history.");
      }

      const messages = Array.isArray(data.messages)
        ? data.messages
        : [];

      readProfileFromHistory(messages);

      messages.forEach(item => {
        const row = String(item.row ?? "");
        const message = String(item.message || "");
        const sender = String(item.sender || "Visitor");

        // Old automatic bot replies are intentionally not displayed.
        // New bot replies are generated locally.
        if (sender.toLowerCase() === "bot") return;

        if (message) {
          addBubble(
            message,
            sender,
            "sheet-" + row + "-message"
          );
        }

        // Admin replies are displayed as separate bubbles.
        if (item.reply) {
          addBubble(
            item.reply,
            "Admin",
            "sheet-" + row + "-reply"
          );
        }
      });

      lastHistoryError = "";
    } catch (error) {
      if (lastHistoryError !== error.message) {
        console.warn("Pulse & Life chat history:", error.message);
        lastHistoryError = error.message;
      }
    } finally {
      historyBusy = false;
    }
  }

  function startPolling() {
    if (poller) return;

    refreshHistory();
    poller = setInterval(refreshHistory, 4000);
  }

  function stopPolling() {
    if (poller) {
      clearInterval(poller);
      poller = null;
    }
  }

  function updateProfileButtons() {
    const nameButton = profileButtons.name;
    const emailButton = profileButtons.email;
    const phoneButton = profileButtons.phone;

    if (nameButton) {
      nameButton.hidden = Boolean(profile.name);
      nameButton.classList.remove("chat-next-step");
    }

    if (emailButton) {
      // After name, encourage the customer to share email.
      emailButton.hidden = Boolean(profile.email);
      emailButton.classList.toggle(
        "chat-next-step",
        Boolean(profile.name) && !profile.email
      );
    }

    if (phoneButton) {
      // Phone remains available until shared.
      phoneButton.hidden = Boolean(profile.phone);
      phoneButton.classList.toggle(
        "chat-next-step",
        Boolean(profile.email) && !profile.phone
      );
    }
  }

  function showContactButtons() {
    if (profileButtons.email && !profile.email) {
      profileButtons.email.hidden = false;
    }

    if (profileButtons.phone && !profile.phone) {
      profileButtons.phone.hidden = false;
    }

    updateProfileButtons();
  }

  function openProfileInput(mode) {
    const prompts = {
      name: "Please enter your name",
      email: "Please enter your email address",
      phone: "Please enter your contact number"
    };

    profileMode = mode;

    input.type =
      mode === "email" ? "email" :
      mode === "phone" ? "tel" : "text";

    input.placeholder = prompts[mode];
    input.value = profile[mode] || "";

    Object.entries(profileButtons).forEach(([key, button]) => {
      if (!button) return;

      button.classList.toggle("selected", key === mode);
      button.setAttribute(
        "aria-pressed",
        key === mode ? "true" : "false"
      );
    });

    input.focus();
  }

  function resetProfileInput() {
    profileMode = "";
    input.type = "text";
    input.placeholder = "Type your message...";
    input.value = "";

    Object.values(profileButtons).forEach(button => {
      if (!button) return;
      button.classList.remove("selected");
      button.setAttribute("aria-pressed", "false");
    });
  }

  Object.entries(profileButtons).forEach(([mode, button]) => {
    if (!button || button.dataset.chatBound === "true") return;

    button.dataset.chatBound = "true";

    button.addEventListener("click", () => {
      if (busy || button.hidden) return;
      openProfileInput(mode);
    });
  });

  function profileBotReply(mode) {
    const name = normalizeName(profile.name);

    if (mode === "name") {
      return (
        "Welcome, " + name + "! 😊\n\n" +
        "How may I assist you today?\n\n" +
        "Please click the Email button above and share your email address. " +
        "This will help our team contact you and respond to your enquiry.\n\n" +
        "You may also share your contact number if that is more convenient."
      );
    }

    if (mode === "email") {
      return (
        "Thank you. I’ve saved your email for this conversation. 😊\n\n" +
        "If you prefer, you can also share your contact number. " +
        "This will help our team speak with you directly and assist " +
        "with resolving your query.\n\n" +
        "Please feel free to share your question or product requirement here."
      );
    }

    return (
      "Thank you. I’ve saved your contact number. 😊\n\n" +
      "Our team will contact you regarding your enquiry.\n\n" +
      "If you have a question, product requirement, pricing request " +
      "or any other query, please share the details here. " +
      "Our team will review your message and get in touch with you."
    );
  }

  function isGreeting(message) {
    return /^(hi+|hello+|helo+|hey+|good morning|good afternoon|good evening|hii+)[!.?,\s]*$/i
      .test(message.trim());
  }

  function botReply(message) {
    const q = message.toLowerCase().trim();
    const name = normalizeName(profile.name);
    const greeting = name ? "Hello " + name + "!" : "Hello!";

    if (isGreeting(message)) {
      if (name) {
        return (
          greeting + " 😊 Welcome to Pulse & Life.\n\n" +
          "Please raise your query here. Our team will review your " +
          "message and contact you to assist.\n\n" +
          "You can ask us about products, pricing, availability, " +
          "medical and surgical articles, para pharmaceutical products " +
          "or business enquiries."
        );
      }

      askedForContact = true;
      showContactButtons();

      return (
        "Hello! 😊 Welcome to Pulse & Life.\n\n" +
        "We will be happy to assist you. Please share your query here, " +
        "and our team will get in touch with you.\n\n" +
        "To help our team contact you, please click the Email or Phone " +
        "button above and share either your email address or contact number."
      );
    }

    if (/price|pricing|cost|quote|quotation|rate|discount/.test(q)) {
      return (
        "Thank you for your pricing enquiry" +
        (name ? ", " + name : "") + ".\n\n" +
        "We will be happy to help you with the relevant pricing information.\n\n" +
        "Please share the product name, required specifications, " +
        "preferred brand and approximate quantity.\n\n" +
        "Our team will review your requirements and contact you with " +
        "the appropriate details."
      );
    }

    if (/availability|available|stock|supply|order|product/.test(q)) {
      return (
        "Thank you for your product enquiry" +
        (name ? ", " + name : "") + ".\n\n" +
        "Please tell us which product you are looking for. " +
        "You may also share the brand, specifications and required quantity.\n\n" +
        "Our team will review the details and assist you with availability " +
        "and the next steps."
      );
    }

    if (/para.?pharma|pharma/.test(q)) {
      return (
        "Thank you for your interest in para pharmaceutical products.\n\n" +
        "Pulse & Life is a Dubai-based trading company. " +
        "We would be glad to understand your requirements.\n\n" +
        "Please share the product name, preferred brand, specifications " +
        "and approximate quantity. Our team will review your enquiry."
      );
    }

    if (/medical|surgical|clinic|hospital|equipment|article/.test(q)) {
      return (
        "Thank you for contacting us about medical and surgical articles.\n\n" +
        "Please share the items you require, along with any preferred " +
        "brand, specifications and quantity.\n\n" +
        "If you have a product list or a specific requirement, " +
        "you can describe it here. Our team will review it and assist you."
      );
    }

    if (/paper|tissue|stationery/.test(q)) {
      return (
        "Thank you for your interest in paper products trading.\n\n" +
        "Please share the product type, size, quality, quantity " +
        "and delivery location.\n\n" +
        "Our team will review your requirements and get back to you."
      );
    }

    if (/partner|partnership|supplier|vendor|distribut/.test(q)) {
      return (
        "Thank you for considering Pulse & Life for a business partnership.\n\n" +
        "We welcome relevant supplier and business enquiries.\n\n" +
        "Please share your company name, product range, business location " +
        "and a short description of your proposal.\n\n" +
        "Our team will review your information and contact you."
      );
    }

    if (/human|person|team|agent|representative|call me|contact me/.test(q)) {
      askedForContact = true;
      showContactButtons();

      return (
        "Certainly" + (name ? ", " + name : "") + ".\n\n" +
        "Our team will be happy to assist you personally.\n\n" +
        "Please click the Email or Phone button above and share either " +
        "your email address or contact number. You can also describe " +
        "your query here so our team has the necessary context."
      );
    }

    if (/thank|thanks/.test(q)) {
      return (
        "You're most welcome" + (name ? ", " + name : "") + "! 😊\n\n" +
        "Please feel free to share any other question or requirement. " +
        "We will be glad to help."
      );
    }

    if (/contact|phone|email|address|location|dubai/.test(q)) {
      return (
        "You can contact Pulse & Life using the following details:\n\n" +
        "Email: plmedicinedxb@gmail.com\n" +
        "Phone: +971 55 301 7379\n" +
        "Location: Dubai, UAE\n\n" +
        "You can also share your query here, and our team will be glad to assist."
      );
    }

    // For any direct non-greeting enquiry, request contact details once.
    if (!profile.email && !profile.phone && !askedForContact) {
      askedForContact = true;
      showContactButtons();

      return (
        "Thank you for sharing your query" +
        (name ? ", " + name : "") + ".\n\n" +
        "We will be happy to help you with this.\n\n" +
        "Please click the Email or Phone button above and share either " +
        "your email address or contact number, so our team can contact you.\n\n" +
        "In the meantime, please share any additional details about " +
        "your requirement. Our team will review your message."
      );
    }

    return (
      "Thank you for explaining your requirement" +
      (name ? ", " + name : "") + ".\n\n" +
      "We have noted your message. To help us guide you correctly, " +
      "could you please share a little more detail about the product " +
      "or service you need?\n\n" +
      "For example, you can mention the product name, specifications, " +
      "quantity, preferred brand or delivery location.\n\n" +
      "Our team will review your query and get in touch with you."
    );
  }

  async function saveProfile(mode, value) {
    let cleanValue = value.trim();

    if (mode === "name") {
      cleanValue = normalizeName(cleanValue);

      if (cleanValue.length < 2) {
        throw new Error("Please enter your full name.");
      }
    }

    if (mode === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)) {
        throw new Error("Please enter a valid email address.");
      }
    }

    if (mode === "phone") {
      if (cleanValue.replace(/\D/g, "").length < 6) {
        throw new Error("Please enter a valid contact number.");
      }
    }

    await saveCustomerMessage({
      type: "chat_profile",
      sender: "Profile",
      message:
        mode.charAt(0).toUpperCase() +
        mode.slice(1) +
        ": " +
        cleanValue,
      [mode]: cleanValue
    });

    profile[mode] = cleanValue;

    // Show the customer's actual submitted value immediately.
    addBubble(
      mode.charAt(0).toUpperCase() + mode.slice(1) + ": " + cleanValue,
      "Profile",
      "local-profile-" + mode + "-" + sessionId,
      true
    );

    updateProfileButtons();
    resetProfileInput();

    // Bot reply is local only: never save it to Google Sheets.
    botSay(profileBotReply(mode));
  }

  async function saveEnquiryType(value) {
    await saveCustomerMessage({
      type: "chat_profile",
      sender: "Profile",
      message: "Enquiry type: " + value,
      enquiryType: value
    });

    profile.enquiryType = value;

    addBubble(
      "Enquiry type: " + value,
      "Profile",
      "local-enquiry-" + sessionId,
      true
    );

    const group = $(".chat-enquiry-group");
    if (group) group.hidden = true;

    botSay(
      "Thank you for selecting " + value + ". 😊\n\n" +
      "Please tell us a little more about your requirement. " +
      "Our team will review your query and contact you."
    );
  }

  enquiryButtons.forEach(button => {
    if (button.dataset.chatBound === "true") return;
    button.dataset.chatBound = "true";

    button.addEventListener("click", async () => {
      if (busy || button.disabled || profile.enquiryType) return;

      busy = true;
      enquiryButtons.forEach(item => item.disabled = true);

      try {
        await saveEnquiryType(button.dataset.enquiry);
        setStatus("");
      } catch (error) {
        setStatus(error.message);
      } finally {
        busy = false;
        enquiryButtons.forEach(item => item.disabled = false);
      }
    });
  });

  // Exactly ONE submit listener. Do not add another send-button click handler.
  form.addEventListener("submit", async event => {
    event.preventDefault();
    event.stopPropagation();

    if (busy) return;

    const value = input.value.trim();
    if (!value) return;

    busy = true;

    if (sendButton) sendButton.disabled = true;
    input.disabled = true;

    setStatus("Sending...");

    try {
      if (profileMode) {
        await saveProfile(profileMode, value);
      } else {
        // Save customer message once.
        await saveCustomerMessage({
          type: "chat",
          sender: "Visitor",
          message: value
        });

        // Clear input only after successful save.
        input.value = "";

        // Display the customer message locally.
        addBubble(
          value,
          "Visitor",
          "local-customer-" + crypto.randomUUID(),
          true
        );

        // Generate a local bot response; do not save it.
        botSay(botReply(value));
      }

      setStatus("");

      // Refresh history to pick up server-side records and admin replies.
      // No forced scroll: existing scroll position is preserved.
      refreshHistory();

    } catch (error) {
      setStatus(
        error.message ||
        "Your message could not be sent. Please try again."
      );
    } finally {
      busy = false;

      if (sendButton) sendButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  });

  function openChat() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    launch.setAttribute("aria-expanded", "true");

    startPolling();

    if (!greetingShown) {
      greetingShown = true;

      botSay(
        "Hello! Welcome to Pulse & Life. 😊\n\n" +
        "We are happy to assist you. Please share your query here. " +
        "Our team will review your message and get in touch with you.\n\n" +
        "You can ask us about products, pricing, availability, " +
        "medical and surgical articles or business enquiries."
      );
    }

    setTimeout(() => input.focus(), 100);
  }

  function closeChat() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    launch.setAttribute("aria-expanded", "false");
    stopPolling();
  }

  launch.addEventListener("click", event => {
    event.stopPropagation();

    if (panel.classList.contains("open")) {
      closeChat();
    } else {
      openChat();
    }
  });

  $("#chatClose")?.addEventListener("click", closeChat);

  document.addEventListener("click", event => {
    if (
      panel.classList.contains("open") &&
      !panel.contains(event.target) &&
      !launch.contains(event.target)
    ) {
      closeChat();
    }
  });

  panel.addEventListener("click", event => event.stopPropagation());

  // Optional hide/restore widget controls.
  $("#chatHideWidget")?.addEventListener("click", () => {
    closeChat();
    launch.hidden = true;

    const restore = $("#chatRestore");
    if (restore) restore.hidden = false;

    try {
      localStorage.setItem("pl-chat-hidden", "1");
    } catch (_) {}
  });

  $("#chatRestore")?.addEventListener("click", () => {
    launch.hidden = false;

    const restore = $("#chatRestore");
    if (restore) restore.hidden = true;

    try {
      localStorage.removeItem("pl-chat-hidden");
    } catch (_) {}

    openChat();
  });

  try {
    if (localStorage.getItem("pl-chat-hidden") === "1") {
      launch.hidden = true;

      const restore = $("#chatRestore");
      if (restore) restore.hidden = false;
    }
  } catch (_) {}
  updateProfileButtons();
})();