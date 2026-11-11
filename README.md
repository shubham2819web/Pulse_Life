# Pulse & Life Medicine Trading L.L.C. — Next.js Website

A full Next.js App Router conversion of the approved five-page HTML website. It preserves the existing navy/white/medical-green design, English/Arabic language selector, responsive layout, contact form, newsletter form, professional chat widget and Google Sheets integration.

## Pages

- `/` — Home
- `/about` — About Us
- `/products` — Products & Services
- `/why-us` — Why Choose Us
- `/contact` — Contact Us

## Requirements

- Node.js 18.18.0 or newer (Node 20 LTS is recommended for a new production server)
- npm
- The existing Google Apps Script Web App URL ending in `/exec` if you want forms/chat to write to Google Sheets

## 1. Install and run on Windows

1. Extract the ZIP.
2. Open the extracted `Pulse_Life_NextJS` folder in VS Code.
3. Open Terminal → New Terminal.
4. Run:

```bash
npm install
```

5. Copy `.env.example` to `.env.local`.
6. Open `.env.local` and add your own Apps Script Web App URL:

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

7. Start the development server:

```bash
npm run dev
```

8. Open `http://localhost:3000`.

Stop the server with `Ctrl + C`.

## 2. Google Sheets integration

The website uses the existing Google Apps Script receiver from the approved HTML project. Its source is included at:

`docs/google-apps-script.gs`

The Next.js server reads `GOOGLE_APPS_SCRIPT_URL` from `.env.local`. The browser calls the same-origin `/api/sheets` and `/api/chat` routes; the Apps Script URL is not exposed in browser JavaScript. The server sends URL-encoded form data to Apps Script, matching the `e.parameter` format expected by `doPost(e)`.

Keep the Google Spreadsheet itself set to **Restricted**. Do not publish the spreadsheet. The Spreadsheet ID belongs only in Apps Script's `SPREADSHEET_ID` constant, not in this Next.js project.

Expected tabs and headers:

### ChatMessages (13 columns)

```text
Date | Time | Timestamp | Session ID | Name | Email | Phone | Enquiry Type | Sender | Message | Page | Admin Reply | Reply Timestamp
```

### ContactInquiries (9 columns)

```text
Date | Time | Timestamp | Name | Email | Phone | Subject | Message | Page
```

### NewsletterSubscriptions (9 columns)

```text
Date | Time | Timestamp | Name | Email | Phone | Subscription Source | Page | Status
```

If your existing Apps Script is already deployed and working with these headers, you do not need to migrate the spreadsheet again. Do not run `upgradeSheets()` repeatedly: it is a one-time migration function. Confirm the first-row headers match the lists above. The Web App deployment must be set to **Execute as: Me** and **Who has access: Anyone**. If you make changes to `docs/google-apps-script.gs`, copy them into Apps Script and deploy a new version of the Web App.

### Admin chat replies

The integration stores visitor messages and automated assistant replies in `ChatMessages`. Put the response in the **Admin Reply** column (L) on the visitor's message row. The Apps Script `onEdit` handler timestamps the reply in column M, and the visitor's open chat polls for new replies every five seconds. The visitor must keep the chat open to see a reply in near real time. The built-in assistant replies are friendly keyword-guided responses, not a live generative-AI agent; unanswered or specific requests are handed to your team for follow-up.

## 3. Production build

```bash
npm run build
npm run start
```

The site listens on port 3000 by default. Put Nginx in front of it and use PM2 or systemd to keep the Next.js process running. Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS domain before building so the sitemap and canonical metadata use the production origin.

Example PM2 commands:

```bash
npm install -g pm2
pm2 start npm --name pulse-life -- start
pm2 save
pm2 startup
```

## 4. Important production notes

- The Apps Script endpoint is public-facing. Add server-side spam controls (CAPTCHA/rate limiting) before using the site for high-volume public traffic.
- The current HTML project uses remote Unsplash images and Google Fonts. A network connection is required to load those assets.
- The Dubai office street address and Google Maps pin were not provided, so the original "address to be confirmed" placeholder is preserved.
- The website positions the company as a **trading company**, not a pharmaceutical manufacturer, in line with the licensed activities described for the site.
- This conversion retains the original site's DOM-based interactions through `public/app.js`. Internal navigation uses normal page loads so the existing script initializes reliably on each page.

## 5. Project structure

```text
Pulse_Life_NextJS/
├── app/
│   ├── api/
│   │   ├── chat/route.js
│   │   └── sheets/route.js
│   ├── about/page.js
│   ├── contact/page.js
│   ├── products/page.js
│   ├── why-us/page.js
│   ├── globals.css
│   ├── icon.svg
│   ├── layout.js
│   ├── page.js
│   ├── robots.js
│   └── sitemap.js
├── components/LegacyPage.jsx
├── docs/google-apps-script.gs
├── lib/site-content.js
├── public/
│   ├── app.js
│   └── chatbot.js
├── .env.example
├── jsconfig.json
├── next.config.mjs
└── package.json
```
