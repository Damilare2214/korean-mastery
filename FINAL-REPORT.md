# Korean Mastery Nigeria — Final Project & System Report 🇰🇷

A comprehensive, production-grade Korean language learning web application and a complete ₦0-budget marketing kit built specifically for the Nigerian market, covering the **EPS-TOPIK E-9 work visa pathway (₦2.3M/month earning potential)**, the **Global Korea Scholarship (GKS)**, corporate trade (Samsung, Daewoo, LG), and K-Drama/K-Pop cultural fluency.

---

## 1. Project Directory Structure

```text
/home/user/
├── korean-mastery/
│   ├── backend.py                    # Single-file Flask backend (JWT, Paystack Safety Net, Brevo, Postgres/SQLite)
│   ├── test_backend.py               # Automated unit test suite verifying all API endpoints and security
│   ├── korean_mastery.db             # Local SQLite database (auto-migrated on startup)
│   ├── certificates/                 # Generated verifiable PDF certificates
│   └── public/                       # Frontend SPA (Zero-build HTML5/CSS3/ES6)
│       ├── index.html                # Main landing page, classroom portal, modals & legal terms
│       ├── styles.css                # Responsive CSS design system with Noto Sans KR font support
│       ├── app.js                    # Reactive state machine, Paystack popups, SRS engine & Canvas
│       └── data.js                   # Linguistic database (Hangul, Sino/Native numbers, EPS terms)
├── marketing/
│   ├── STRATEGY-PLAYBOOK.md          # ₦0 budget Nigerian marketing playbook & 30-day calendar
│   ├── 20-VIDEO-SCRIPTS.md           # 20 ready-to-post short vertical video scripts (TikTok/Reels/Shorts)
│   ├── 15-WHATSAPP-MESSAGES.md       # 15 high-converting WhatsApp status updates, broadcasts & group drops
│   ├── SOCIAL-MEDIA-POSTS.md         # Ready-to-post Facebook & Instagram copy & carousels
│   ├── BIOS-AND-HASHTAGS.md          # Profile bios for TikTok, IG, X, YouTube, FB + curated hashtags
│   ├── hangul-cheat-sheet.html       # Print-ready A4 Hangul cheat sheet web page
│   ├── HANGUL-CHEAT-SHEET.pdf        # High-resolution printable PDF cheat sheet
│   ├── posters/
│   │   ├── poster_story_1080x1920.png # Vertical (9:16) poster for WhatsApp Status & Stories
│   │   └── poster_feed_1080x1080.png  # Square (1:1) poster for Instagram & Facebook feeds
│   ├── audio/
│   │   ├── voiceover_part1.mp3       # English voiceover clip (Hook & EPS Facts)
│   │   ├── voiceover_part2_ko.mp3    # Native Korean voiceover clip (Greeting & Motivation)
│   │   ├── voiceover_part3.mp3       # English voiceover clip (CTA & Website)
│   │   └── voiceover_full.mp3        # Master concatenated narration audio
│   └── videos/
│       ├── bg_seoul_vertical.png     # High-resolution vertical Seoul sunset background art
│       └── korean_mastery_promo_1080x1920.mp4 # Rendered 1080x1920 30fps MP4 with Ken Burns zoom & captions
└── FINAL-REPORT.md                   # Complete system documentation & deployment guide
```

---

## 2. Technical Architecture & Safety Net Implementation

### A. Single-File Flask Backend (`backend.py`)
* **Dual Database Drivers:** Automatically connects to Neon PostgreSQL when `DATABASE_URL` is set, or defaults to SQLite (`korean_mastery.db`) for local execution.
* **JWT Authentication:** Issues secure HS256 JWT tokens with a 7-day lifetime. Authenticates requests via `Authorization: Bearer <token>` header or query parameter.
* **Password Hashing:** Uses Werkzeug's `generate_password_hash` with `pbkdf2:sha256`.
* **Brevo HTTPS REST API:** Dispatches automated email receipts, welcome notes, and certificate links via `https://api.brevo.com/v3/smtp/email` over HTTPS port 443. This is **100% immune** to Render’s outbound SMTP port blocking (ports 25, 465, and 587).
* **Security & Sensitive File Protection:** Returns a strict HTTP `404 Not Found` for any client request attempting to access `.py`, `.db`, `.env`, `.sql`, `.git`, or `.sh` files.

### B. The 5-Point Payment Safety Net (Paystack)
1. **HMAC-SHA512 Webhook Verification:** The `POST /api/paystack/webhook` endpoint verifies the raw payload signature against `PAYSTACK_SECRET_KEY` using `hmac.compare_digest` to eliminate timing attacks.
2. **Idempotent Fulfillment (`fulfill_payment`):**
   * Never credits an account twice for the same reference.
   * Enforces exact minimum amount verification (rejects underpayment: ₦500 requires $\ge 50,000$ kobo; ₦2,000 requires $\ge 200,000$ kobo).
   * **Never downgrades** a customer already holding a higher tier.
3. **Cross-Account Theft Prevention:** The `POST /api/paystack/verify` endpoint queries Paystack's API and returns `403 Forbidden` if the customer email on the transaction does not match the authenticated student account.
4. **Self-Healing Auto-Reconciliation:** Called automatically during every `/api/auth/me` request. If a student closes their browser popup after transferring funds, the backend reconciles pending transactions with Paystack and instantly unlocks access on the next page refresh.
5. **Dedicated Reconcile Endpoint:** Accessible at `GET /api/paystack/reconcile` for manual or scheduled sync.

---

## 3. The Three Course Tiers & In-App Curriculum

| Course Tier | Price | Target Audience | Key Features & Modules |
| :--- | :--- | :--- | :--- |
| **Tier 1: Free Foundation** | **₦0 (Free)** | Total Beginners, K-Drama fans | • 10 Basic & 11 Compound Vowels with mouth shapes<br>• 14 Consonants + 5 Double Consonants<br>• Syllable block construction (Initial + Medial + Final *Batchim*)<br>• 25 High-Frequency daily words with audio<br>• Interactive 10-Question Hangul Mastery Quiz |
| **Tier 2: Survival Korean** | **₦500 (One-Time)** | Daily communicators, travelers, K-Drama lovers | • Politeness levels (*~합니다* vs *~해요* vs *반말*)<br>• Dual Number Systems (Sino-Korean for Money/Dates vs Native Korean for Counting/Hours)<br>• Food & Restaurant survival (*"이거 주세요!"*, asking for non-spicy)<br>• Transport, taxis (*"서울역으로 가주세요"*), and directions<br>• Family & social hierarchy titles (*Oppa, Unnie, Hyung, Noona, Sunbae*)<br>• Survival Practice Quizzes |
| **Tier 3: Fluency & Career Tools** | **₦2,000 (One-Time)** | EPS-TOPIK candidates (₦2.3M/mo jobs), GKS applicants, corporate pros | • EPS-TOPIK factory machines, safety gear (*안전모, 안전화*), and commands<br>• 300+ Spaced Repetition (SRS) Leitner Flashcards<br>• Interactive Stroke Writing Canvas with character tracing<br>• Interactive AI Dialogue Simulator (Job interview, Pocha ordering)<br>• Business Etiquette (Bowing angles 15°/30°/45°, two-hand rule, *Nunchi*)<br>• GKS Scholarship Embassy Track action guide<br>• Verifiable Digital Certificate of Completion (PDF download + public verification URL) |

---

## 4. Marketing Deliverables Summary

1. **Strategy Playbook (`marketing/STRATEGY-PLAYBOOK.md`):** Complete ₦0 budget marketing blueprint outlining the 4 Nigerian audience segments, organic traffic engines (TikTok, WhatsApp, Facebook, Nairaland, KCCN), and a 30-day launch schedule.
2. **20 Short Video Scripts (`marketing/20-VIDEO-SCRIPTS.md`):** 20 ready-to-record vertical video scripts with hooks, visual cues, voiceover lines, on-screen text, and CTAs across EPS-TOPIK jobs, K-Drama secrets, GKS scholarships, and Hangul hacks.
3. **15 WhatsApp Messages (`marketing/15-WHATSAPP-MESSAGES.md`):** 5 Status updates, 5 Direct DMs/Broadcasts, and 5 Community Group drops.
4. **Social Media Copy (`marketing/SOCIAL-MEDIA-POSTS.md`):** Educational long-form posts, 10-slide Instagram carousel copy, GKS scholarship blueprints, and engagement quizzes.
5. **Profile Bios & Hashtags (`marketing/BIOS-AND-HASHTAGS.md`):** High-converting bios for TikTok, Instagram, Twitter/X, YouTube, and Facebook, with curated hashtag bundles.
6. **Printable Hangul Cheat Sheet:** Available as web HTML (`marketing/hangul-cheat-sheet.html`) and print-ready PDF (`marketing/HANGUL-CHEAT-SHEET.pdf`).
7. **High-Resolution PNG Posters:**
   * `marketing/posters/poster_story_1080x1920.png` (Vertical 9:16 for WhatsApp Status, Stories)
   * `marketing/posters/poster_feed_1080x1080.png` (Square 1:1 for Instagram and Facebook feeds)
8. **Vertical Faceless Video Asset:**
   * `marketing/videos/korean_mastery_promo_1080x1920.mp4` (1080x1920 vertical, 30fps, H.264+AAC, Ken Burns zoom, dark scrim, animated captions, dual English/Korean AI voiceover narration).

---

## 5. Step-by-Step Plain-Language Deployment Guide

Follow these numbered steps to deploy your site live to the world:

### Step 1: Create Your Neon PostgreSQL Database (Free)
1. Go to **[neon.tech](https://neon.tech)** and sign up for a free account.
2. Create a new project called `korean-mastery-db`.
3. Copy your connection string (`postgres://...` or `postgresql://...`).

### Step 2: Deploy Backend to Render (Free Tier)
1. Push this project repository to your GitHub account.
2. Go to **[render.com](https://render.com)** and create a **New Web Service**.
3. Select your GitHub repository.
4. Configure the service:
   * **Root Directory:** `korean-mastery`
   * **Environment:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt` (or `pip install flask pyjwt requests psycopg2-binary pillow reportlab gunicorn`)
   * **Start Command:** `gunicorn backend:app --bind 0.0.0.0:$PORT`
5. Add Environment Variables under the **Environment** tab:
   * `DATABASE_URL` = `<Your Neon Connection String>`
   * `SECRET_KEY` = `<Generate a random 32-character string>`
   * `PAYSTACK_SECRET_KEY` = `<Your Paystack Secret Key: sk_live_...>`
   * `PAYSTACK_PUBLIC_KEY` = `<Your Paystack Public Key: pk_live_...>`
   * `BREVO_API_KEY` = `<Your Brevo API Key: xkeysib-...>`
   * `BREVO_SENDER_EMAIL` = `support@yourdomain.com`

### Step 3: Configure Paystack Webhook
1. Log in to your **[Paystack Dashboard](https://dashboard.paystack.co)**.
2. Go to **Settings $\rightarrow$ API Keys & Webhooks**.
3. Set your **Live Webhook URL** to: `https://<your-render-app>.onrender.com/api/paystack/webhook`.
4. **CRITICAL GOTCHA:** Go to **Preferences** and ensure **"Pass transaction fees to customer"** is **DISABLED (OFF)**. (When enabled, ₦500 charges ₦507.62, breaking exact amount validation).

### Step 4: Deploy Frontend to Netlify (Free)
1. Go to **[netlify.com](https://netlify.com)** and select **Add new site $\rightarrow$ Import from Git**.
2. Set **Publish directory** to `korean-mastery/public`.
3. In `korean-mastery/public/app.js`, update `API_BASE` to `https://<your-render-app>.onrender.com/api` (or configure a Netlify redirect rule `_redirects`: `/api/* https://<your-render-app>.onrender.com/api/:splat 200`).
4. Set up your custom domain (e.g., `koreanmastery.ng`). Note: Share only your custom domain or production Netlify URL — never share temporary hash deploy URLs.

---

## 6. Verification & Automated Test Results

The automated backend test suite was executed against the database and API endpoints:
* ✅ `test_01_health`: Passed (HTTP 200, API healthy).
* ✅ `test_02_registration_and_login`: Passed (Password hashing verified, JWT token issued).
* ✅ `test_03_payment_and_idempotency`: Passed (Paystack initialize, exact amount verification, no double granting, tier upgrade protection preserved).
* ✅ `test_04_certificate_generation`: Passed (Verifiable certificate created, public verification endpoint validated, PDF rendered).
* ✅ `test_05_security_and_404`: Passed (Direct access to `.py`, `.db`, and `.env` returned HTTP 404).

---

## 7. Operational & Marketing Launch Checklist

- [x] Backend API, database schemas, and JWT authentication verified.
- [x] Paystack webhook and auto-reconciliation safety net active.
- [x] Brevo HTTPS email service integrated (no SMTP port hang).
- [x] Interactive Single-Page App with Hangul Google Fonts and native audio active on port 5000.
- [x] 20 Vertical Video Scripts ready for daily posting.
- [x] 15 WhatsApp Broadcasts & Status sequences ready.
- [x] High-resolution Story (1080x1920) and Feed (1080x1080) PNG posters generated.
- [x] Vertical faceless promo video (1080x1920, 30fps MP4) compiled with AI voiceover.
- [x] Printable Hangul Cheat Sheet (A4 PDF) generated.

*Everything is built, verified, and ready to launch!* 🇰🇷🚀
