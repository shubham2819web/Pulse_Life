
/* PULSE & LIFE - CHATBOT
   Only customer messages/profile details are saved to Google Sheets.
   Bot replies are displayed locally and are never submitted to Sheets.
*/
(() => {
  if (window.__pulseLifeChatInitialized) return;
  window.__pulseLifeChatInitialized = true;

  const panel = document.getElementById("chatPanel");
  const messagesEl = document.getElementById("chatMessages");
  const form = document.getElementById("chatForm");
  const input = form?.querySelector("[name='message']");
  const sendButton = form?.querySelector("button[type='submit']");
  const statusEl = document.getElementById("chatStatus");
  const launch = document.getElementById("chatLaunch");

  if (!panel || !messagesEl || !input || !form || !launch) return;

  const sessionId = createSessionId();

  const profile = {
    name: "",
    email: "",
    phone: "",
    enquiryType: ""
  };

  const renderedRows = new Set();
  let profileMode = "";
  let busy = false;
  let historyBusy = false;
  let poller = null;
  let botCounter = 0;
  let greetingShown = false;

  const profileButtons = {
    name: document.querySelector('[data-profile="name"]'),
    email: document.querySelector('[data-profile="email"]'),
    phone: document.querySelector('[data-profile="phone"]')
  };

  function createSessionId() {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    return "PL-" + Array.from(bytes, b =>
      b.toString(16).padStart(2, "0")
    ).join("");
  }

  const pagePath = () => location.pathname || "/";

  function setStatus(message = "") {
    if (statusEl) statusEl.textContent = message;
  }

  function displayName(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  async function saveCustomerData(payload) {
    const response = await fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        sessionId,
        ...profile,
        page: pagePath()
      }),
      cache: "no-store"
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      throw new Error(
        result.error || "Your message could not be sent. Please try again."
      );
    }

    return result;
  }

  function addBubble(message, sender, key) {
    if (!message || renderedRows.has(key)) return;

    renderedRows.add(key);

    const bubble = document.createElement("div");
    bubble.className =
      "chat-msg " +
      (["Visitor", "Profile"].includes(sender) ? "user" : "admin");

    bubble.textContent = message;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function botSay(message) {
    botCounter++;
    addBubble(message, "Bot", "local-bot-" + botCounter);
  }

  function updateProfileButtons() {
    const nameBtn = profileButtons.name;
    const emailBtn = profileButtons.email;
    const phoneBtn = profileButtons.phone;

    if (nameBtn) {
      nameBtn.hidden = Boolean(profile.name);
      nameBtn.classList.remove("chat-next-step");
    }

    if (emailBtn) {
      emailBtn.hidden = !profile.name || Boolean(profile.email);
      emailBtn.classList.toggle(
        "chat-next-step",
        Boolean(profile.name) && !profile.email
      );
    }

    if (phoneBtn) {
      phoneBtn.hidden = !profile.email || Boolean(profile.phone);
      phoneBtn.classList.toggle(
        "chat-next-step",
        Boolean(profile.email) && !profile.phone
      );
    }

    const group = document.querySelector(".chat-profile-group");
    if (group) {
      group.hidden = Boolean(
        profile.name && profile.email && profile.phone
      );
    }
  }

  function recoverProfileFromHistory(messages) {
    messages.forEach(item => {
      const text = String(item.message || "");

      if (item.sender !== "Profile") return;

      const name = text.match(/^Name:\s*(.+)$/i);
      const email = text.match(/^Email:\s*(.+)$/i);
      const phone = text.match(/^Phone:\s*(.+)$/i);
      const enquiry = text.match(/^Enquiry type:\s*(.+)$/i);

      if (name) profile.name = name[1].trim();
      if (email) profile.email = email[1].trim();
      if (phone) profile.phone = phone[1].trim();
      if (enquiry) profile.enquiryType = enquiry[1].trim();
    });

    updateProfileButtons();
  }

  async function refreshHistory() {
    if (historyBusy) return;

    historyBusy = true;

    try {
      const response = await fetch(
        "/api/chat?sessionId=" + encodeURIComponent(sessionId),
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to load chat history.");
      }

      const messages = data.messages || [];

      recoverProfileFromHistory(messages);

      messages.forEach(item => {
        const rowKey = String(item.row);

        if (item.message) {
          addBubble(item.message, item.sender, rowKey + ":message");
        }

        if (item.reply) {
          addBubble(item.reply, "Admin", rowKey + ":reply");
        }
      });

      messagesEl.scrollTop = messagesEl.scrollHeight;

    } catch (error) {
      console.warn("Chat history:", error.message);
    } finally {
      historyBusy = false;
    }
  }

  function startPolling() {
    if (poller) return;

    refreshHistory();
    poller = setInterval(refreshHistory, 3000);
  }

  function stopPolling() {
    if (poller) clearInterval(poller);
    poller = null;
  }

  function closeChat() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    launch.setAttribute("aria-expanded", "false");
    stopPolling();
  }

  function openChat() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    launch.setAttribute("aria-expanded", "true");

    startPolling();

    if (!greetingShown) {
      greetingShown = true;

      botSay(
        "Hello! Welcome to Pulse & Life. 😊\n\n" +
        "We are happy to assist you. You can ask us about para pharmaceutical products, medical and surgical articles, paper products, pricing, availability or business partnerships.\n\n" +
        "How may we help you today?"
      );
    }

    setTimeout(() => input.focus(), 100);
  }

  launch.addEventListener("click", event => {
    event.stopPropagation();

    panel.classList.contains("open")
      ? closeChat()
      : openChat();
  });

  document.getElementById("chatClose")
    ?.addEventListener("click", closeChat);

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

  function resetInput() {
    profileMode = "";
    input.type = "text";
    input.placeholder = "Type your message...";
    input.value = "";

    Object.values(profileButtons).forEach(button => {
      button?.classList.remove("selected");
      button?.setAttribute("aria-pressed", "false");
    });
  }

  Object.entries(profileButtons).forEach(([mode, button]) => {
    if (!button) return;

    button.addEventListener("click", () => {
      if (busy || button.hidden) return;

      profileMode = mode;

      const prompts = {
        name: "Please enter your full name",
        email: "Please enter your email address",
        phone: "Please enter your contact number"
      };

      input.type =
        mode === "email" ? "email" :
        mode === "phone" ? "tel" : "text";

      input.placeholder = prompts[mode];
      input.value = "";

      Object.values(profileButtons).forEach(item => {
        item?.classList.remove("selected");
        item?.setAttribute("aria-pressed", "false");
      });

      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");

      input.focus();
    });
  });

  document.querySelectorAll("[data-enquiry]").forEach(button => {
    button.addEventListener("click", async () => {
      if (busy || profile.enquiryType) return;

      busy = true;
      const value = button.dataset.enquiry;

      try {
        await saveCustomerData({
          type: "chat_profile",
          message: "Enquiry type: " + value,
          enquiryType: value
        });

        profile.enquiryType = value;

        document.querySelector(".chat-enquiry-group")?.setAttribute(
          "hidden", ""
        );

        addBubble(
          "Enquiry type: " + value,
          "Profile",
          "local-enquiry-" + Date.now()
        );

        botSay(
          "Thank you for selecting " + value + ". 😊\n\n" +
          "Please tell us a little more about what you are looking for. " +
          "For example, you can share the product name, specifications, " +
          "required quantity or any other details."
        );

      } catch (error) {
        setStatus(error.message);
      } finally {
        busy = false;
      }
    });
  });

  function profileReply(mode, value) {
    const name = displayName(profile.name);

    if (mode === "name") {
      return (
        "Welcome, " + name + "! 😊\n\n" +
        "How may I assist you today?\n\n" +
        "Could you also share your email address? " +
        "This will help our team contact you and respond to your enquiry."
      );
    }

    if (mode === "email") {
      return (
        "Thank you. I’ve saved your email for this conversation. 😊\n\n" +
        "You may also share your contact number if you wish. " +
        "This will make it easier for our team to speak with you " +
        "and help resolve your query."
      );
    }

    if (mode === "phone") {
      return (
        "Thank you. I’ve saved your phone number for this conversation. 😊\n\n" +
        "Our team will contact you regarding your enquiry.\n\n" +
        "If you have a question, product requirement, pricing request " +
        "or any other query, please share it here. " +
        "Our team will review your message and get in touch with you."
      );
    }
  }

  function botReply(message) {
    const q = message.toLowerCase();
    const name = profile.name ? displayName(profile.name) : "";

    const hello = name ? "Hello " + name + "!" : "Hello!";

    if (/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(q)) {
      return (
        hello + " Welcome to Pulse & Life. 😊\n\n" +
        "We are glad to assist you. Are you looking for product information, " +
        "pricing, availability, medical and surgical articles, " +
        "para pharmaceutical products or a business partnership?"
      );
    }

    if (/price|pricing|cost|quote|quotation|rate|discount/.test(q)) {
      return (
        "Thank you for your interest" + (name ? ", " + name : "") + ".\n\n" +
        "We will be happy to assist you with pricing.\n\n" +
        "To help our team provide relevant information, please share:\n" +
        "• Product name\n" +
        "• Required specifications or brand\n" +
        "• Approximate quantity\n" +
        "• Delivery location\n\n" +
        "Our team can review your requirements and follow up with you."
      );
    }

    if (/availability|available|stock|supply|order|product/.test(q)) {
      return (
        "Certainly! We can help you with product-related enquiries.\n\n" +
        "Please share the product name, required specifications, " +
        "brand preference and approximate quantity.\n\n" +
        "If you have a product list or specific requirement, " +
        "you can mention the details here. Our team will review it."
      );
    }

    if (/para.?pharma|pharma/.test(q)) {
      return (
        "Pulse & Life is a Dubai-based trading company dealing in " +
        "para pharmaceutical products.\n\n" +
        "We would be glad to understand your requirement. " +
        "Please share the product name, preferred brand, specifications " +
        "and quantity so our team can assist you further."
      );
    }

    if (/medical|surgical|hospital|clinic|equipment|article/.test(q)) {
      return (
        "Thank you for your enquiry about medical and surgical articles.\n\n" +
        "Please let us know which items you require, along with " +
        "the specifications, preferred brand and approximate quantity.\n\n" +
        "Our team will review your requirements and guide you further."
      );
    }

    if (/paper|tissue|stationery/.test(q)) {
      return (
        "We can assist with paper products trading enquiries.\n\n" +
        "Please share the paper product type, size, quality, " +
        "quantity and any specific requirements.\n\n" +
        "Our team will review the details and get back to you."
      );
    }

    if (/partner|partnership|supplier|vendor|distribut/.test(q)) {
      return (
        "Thank you for considering Pulse & Life as a business partner.\n\n" +
        "We welcome relevant business and supplier enquiries.\n\n" +
        "Please share your company name, product range, " +
        "business location and a brief introduction to your proposal.\n\n" +
        "Our team will review your information and contact you."
      );
    }

    if (/human|person|team|agent|representative|call me/.test(q)) {
      return (
        "Of course! We will be happy to have our team assist you.\n\n" +
        "Please share your name, email address or contact number " +
        "and briefly describe your requirement.\n\n" +
        "Our team will review your message and connect with you."
      );
    }

    if (/thank|thanks/.test(q)) {
      return (
        "You're most welcome" + (name ? ", " + name : "") + "! 😊\n\n" +
        "We are always happy to help. Please feel free to share " +
        "any other question or product requirement."
      );
    }

    if (/contact|phone|email|address|location|dubai/.test(q)) {
      return (
        "You can contact Pulse & Life through the following details:\n\n" +
        "Email: plmedicinedxb@gmail.com\n" +
        "Phone: +971 55 301 7379\n" +
        "Location: Dubai, UAE\n\n" +
        "You can also leave your query here. Our team will be glad to assist."
      );
    }

    return (
      "Thank you for explaining your requirement" +
      (name ? ", " + name : "") + ". 😊\n\n" +
      "We would like to understand it better so that our team can guide you correctly.\n\n" +
      "Could you please share:\n" +
      "• What product or service are you looking for?\n" +
      "• What specifications or quantity do you need?\n" +
      "• Is this a general enquiry, pricing request or business proposal?\n\n" +
      "Please share whatever details you have. Our team will review your query."
    );
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (busy) return;

    const value = input.value.trim();
    if (!value) return;

    busy = true;
    if (sendButton) sendButton.disabled = true;
    setStatus("Sending...");

    try {
      if (profileMode) {
        const mode = profileMode;

        if (mode === "email" &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error("Please enter a valid email address.");
        }

        if (mode === "phone" &&
            value.replace(/\D/g, "").length < 6) {
          throw new Error("Please enter a valid phone number.");
        }

        if (mode === "name" && value.length < 2) {
          throw new Error("Please enter your name.");
        }

        const formatted =
          mode === "name" ? displayName(value) : value;

        await saveCustomerData({
          type: "chat_profile",
          message:
            mode.charAt(0).toUpperCase() + mode.slice(1) + ": " + formatted,
          [mode]: formatted
        });

        profile[mode] = formatted;

        addBubble(
          mode.charAt(0).toUpperCase() + mode.slice(1) + ": " + formatted,
          "Profile",
          "local-profile-" + mode
        );

        resetInput();
        updateProfileButtons();

        botSay(profileReply(mode, formatted));

      } else {
        await saveCustomerData({
          type: "chat",
          message: value
        });

        addBubble(
          value,
          "Visitor",
          "local-visitor-" + Date.now() + "-" + Math.random()
        );

        input.value = "";
        botSay(botReply(value));
      }

      setStatus("");

    } catch (error) {
      setStatus(error.message || "Unable to send your message.");
    } finally {
      busy = false;
      if (sendButton) sendButton.disabled = false;
      input.focus();
    }
  });

  document.getElementById("chatHideWidget")
    ?.addEventListener("click", () => {
      closeChat();
      launch.hidden = true;

      const restore = document.getElementById("chatRestore");
      if (restore) restore.hidden = false;

      try {
        localStorage.setItem("pl-chat-hidden", "1");
      } catch (_) {}
    });

  document.getElementById("chatRestore")
    ?.addEventListener("click", () => {
      launch.hidden = false;

      const restore = document.getElementById("chatRestore");
      if (restore) restore.hidden = true;

      try {
        localStorage.removeItem("pl-chat-hidden");
      } catch (_) {}

      openChat();
    });

  try {
    if (localStorage.getItem("pl-chat-hidden") === "1") {
      launch.hidden = true;
      const restore = document.getElementById("chatRestore");
      if (restore) restore.hidden = false;
    }
  } catch (_) {}

  updateProfileButtons();
})();
