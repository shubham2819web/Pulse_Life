export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAppsScriptUrl() {
  const url =
    process.env.GOOGLE_APPS_SCRIPT_URL ||
    process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL ||
    "";
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)) {
    throw new Error("Google Apps Script URL is missing or invalid. Configure .env.local and restart Next.js.");
  }
  return url;
}

export async function GET(request) {
  try {
    const sessionId = new URL(request.url).searchParams.get("sessionId") || "";
    if (!/^PL-[a-z0-9]{20,80}$/i.test(sessionId)) {
      return Response.json({ ok: false, error: "Invalid chat session." }, { status: 400 });
    }

    const url = new URL(getAppsScriptUrl());
    url.searchParams.set("action", "chatHistory");
    url.searchParams.set("sessionId", sessionId);
    url.searchParams.set("callback", "pulseLifeCallback");
    url.searchParams.set("_", String(Date.now()));

    const upstream = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const text = await upstream.text();
    const match = text.match(/^\s*pulseLifeCallback\(([\s\S]*)\);?\s*$/);
    if (!upstream.ok || !match) {
      throw new Error("Google Apps Script did not return chat history. Check the Web App deployment.");
    }
    const result = JSON.parse(match[1]);
    if (!result.ok) throw new Error(result.error || "Could not load chat history.");
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Pulse & Life chat history API:", error);
    return Response.json({ ok: false, error: error.message || "Could not load chat history." }, { status: 502 });
  }
}
