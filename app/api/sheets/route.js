export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAppsScriptUrl() {
  const url =
    process.env.GOOGLE_APPS_SCRIPT_URL ||
    process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL ||
    "";
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)) {
    throw new Error("Google Apps Script URL is missing or invalid. Add the deployed /exec URL to .env.local and restart Next.js.");
  }
  return url;
}

export async function POST(request) {
  try {
    const input = await request.json();
    const allowed = [
      "type", "name", "email", "phone", "subject", "message", "page",
      "source", "sessionId", "enquiryType", "sender"
    ];
    const payload = {};
    for (const key of allowed) {
      if (input[key] !== undefined && input[key] !== null) {
        payload[key] = String(input[key]).slice(0, key === "message" ? 4000 : 500);
      }
    }

    if (!["chat", "chat_profile", "chat_event", "contact", "subscription"].includes(payload.type)) {
      return Response.json({ ok: false, error: "Unsupported submission type." }, { status: 400 });
    }
    if (["chat", "chat_profile", "chat_event"].includes(payload.type) &&
        !/^PL-[a-z0-9]{20,80}$/i.test(payload.sessionId || "")) {
      return Response.json({ ok: false, error: "Chat session is invalid. Please refresh the page." }, { status: 400 });
    }
    if (["chat", "chat_event"].includes(payload.type) && !payload.message?.trim()) {
      return Response.json({ ok: false, error: "Please enter a message." }, { status: 400 });
    }
    if (payload.type === "contact" &&
        (!payload.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email || "") || !payload.message?.trim())) {
      return Response.json({ ok: false, error: "Please provide your name, a valid email and a message." }, { status: 400 });
    }
    if (payload.type === "subscription" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email || "")) {
      return Response.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    payload.page = String(payload.page || "/").slice(0, 120);
    const form = new URLSearchParams(payload);
    const upstream = await fetch(getAppsScriptUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: form.toString(),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const text = await upstream.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error("Google Apps Script returned an unreadable response. Check that the Web App is deployed and accessible to Anyone.");
    }
    if (!upstream.ok || !result.ok) {
      throw new Error(result.error || `Google Apps Script request failed (${upstream.status}).`);
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Pulse & Life Sheets API:", error);
    return Response.json(
      { ok: false, error: error.message || "Could not save the submission." },
      { status: 502 }
    );
  }
}
