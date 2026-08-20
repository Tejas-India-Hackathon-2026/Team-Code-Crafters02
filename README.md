# 🏺 Karigar Kart

> **AI-Verified Marketplace & Proof-of-Craft Platform for Local Artisans**  
> *Built for the Tejas India Hackathon 2026 by Team Code Crafters (Government Engineering College, Jamui)*

---

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash_Vision-8E75B2?style=flat-square&logo=google)](https://ai.google.dev/)
[![Escrow Rails](https://img.shields.io/badge/Escrow-Dual--Rail_(Web2_Nodal_+_Web3_EVM)-orange?style=flat-square)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 📌 Problem Statement & Market Context

India is home to over **64.66 lakh artisans** across handloom, pottery, metal crafts, and woodworking. Despite the immense cultural heritage and market demand:
1. **Middlemen Exploitation:** Traditional physical and digital intermediaries capture **15–25%+ cuts**, leaving master artisans with razor-thin margins and unpredictable income.
2. **Counterfeit Machine-Made Goods:** An estimated **15%+ of online "handmade" listings** are mass-produced factory knock-offs, eroding buyer confidence and depressing prices for genuine handmade items.
3. **Statutory Tax & Payment Insecurity:** Grassroots makers struggle with delayed payments, arbitrary chargebacks, and legal tax compliances like **Section 194-O of the Indian Income Tax Act** (1% TDS on e-commerce operators).

**Karigar Kart** introduces a **Proof-of-Craft** ecosystem that replaces unverified static photos with AI-inspected video reels, hyperlocal reverse-bidding, and dual-rail escrow with automated tax compliance.

---

## ✨ Core Platform Innovations

### 🎥 1. Proof-of-Craft Video Reels
Instead of static images that can be stolen from factory catalogs, artisans upload **30–60 second vertical reels (9:16)** demonstrating their raw making process (chisel work, wheel throwing, handloom shuttle movements, natural dye mixing).

### 🤖 2. Tiered Multimodal AI Verification Pipeline
Powered by **Google Gemini 2.5 Flash Multimodal Vision**, our inspection pipeline extracts keyframes and evaluates handcraft authenticity against registered workshop brand stamps and maker tooling:
* **$\ge 90\%$ Confidence Score:** $\rightarrow$ **Instant Auto-Approval** & badge minting (`#BATCH-CERTIFIED`).
* **$85\text{--}90\%$ Confidence Score:** $\rightarrow$ **Admin Triage Queue** for human-in-the-loop guild review.
* **$< 85\%$ Confidence Score:** $\rightarrow$ **Automated Rejection** with automated guidance on what authentic making markers were missing.

### 📍 3. Hyperlocal Reverse-Bidding & Geo-Discovery
* Buyers post custom commission specifications (budget bounds, reference sketches, delivery deadline, and GPS coordinates).
* **PostGIS spatial indexing (`ST_DWithin`)** identifies verified makers within the buyer's geographical radius.
* Artisans browse open regional commissions and submit bespoke bids with structured milestones and delivery timelines.

### 🔒 4. Dual-Rail Escrow Settlement & 48-Hour Inspection Buffer
* **Default Web2 Rail (RBI-Compliant Nodal Account):** Secure bank nodal escrow (e.g., Castler/Escrowpay) holding UPI/Netbanking funds.
* **Opt-In Web3 Rail (EVM Smart Contracts):** Programmatic on-chain settlement using Solidity (`DeliveryEscrow.sol`, `EscrowFactory.sol`) with USDC / ERC-20 tokens.
* **48-Hour Post-Delivery Buffer:** Payout is held safely post-delivery. If no defect dispute is lodged within 48 hours, the payout auto-releases directly to the artisan's bank account.

### 💬 5. In-App Moderated Negotiation & Ingress Contact Masking
* Real-time in-app chat enabling custom milestone quotes, material clarification, and progress photos.
* Automated regex and pattern-matching sanitize phone numbers, emails, and external payment links to protect both parties from off-platform bypass fraud.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          Next.js 16 Client UI                           │
│        (Framer Motion, Motion Primitives, Kinto Design Tokens)          │
└────────────────────┬───────────────────────────────┬────────────────────┘
                     │                               │
             HTTP / REST Actions              WebSocket Relayer
                     │                               │
┌────────────────────▼───────────────────────────────▼────────────────────┐
│                       Next.js & Gateway Core Engine                     │
│         (Auth, Reverse-Bidding, Escrow Dispatcher, Tax Engine)          │
└────────┬──────────────────────────┬────────────────────────────┬────────┘
         │                          │                            │
┌────────▼──────────┐      ┌────────▼──────────┐       ┌─────────▼────────┐
│    PostgreSQL     │      │   Python Engine   │       │   Dual-Rail      │
│     + PostGIS     │      │  + Google Gemini  │       │  Escrow Engine   │
│  (Supabase + RLS) │      │ (Multimodal AI)   │       │ (Nodal + Web3)   │
└───────────────────┘      └───────────────────┘       └──────────────────┘
```

### Monorepo Structure

```
karigar_kart/
├── apps/
│   ├── web/                        # Next.js 16 (App Router), Tailwind CSS 4, Motion Primitives
│   │   ├── src/
│   │   │   ├── app/                # Buyer, Artisan, Admin, and API Route Handlers
│   │   │   ├── components/         # Kinto UI Cards, Badges, Chat, Escrow, Map, Sliding Tabs
│   │   │   ├── lib/                # Supabase clients (client, server, middleware)
│   │   │   └── types/              # TypeScript models (bids, orders, verification)
│   │   └── public/                 # Static branding assets and icons
│   ├── gateway/                    # Express + WebSockets courier tracking & state gateway
│   │   └── src/                    # Ingress chat sanitizers, webhooks, and WS server
│   └── ai-engine/                  # Python FastAPI multimodal video verification pipeline
│       └── app/
│           ├── models/             # Gemini 2.5 Flash vision checker & brand stamp matcher
│           └── pipeline/           # OpenCV keyframe extractor & liveness filter
├── packages/
│   ├── contracts/                  # Solidity smart contracts (DeliveryEscrow.sol, EscrowFactory.sol)
│   └── database/                   # PostgreSQL schema definitions, PostGIS setup, and RLS policies
├── docs/                           # Architecture specifications, diagrams, and PRD documents
├── package.json                    # Monorepo root workspace management
└── README.md                       # Complete platform documentation
```

---

## 🛠️ Complete Tech Stack

| Domain | Technology / Library | Role & Implementation |
|---|---|---|
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) | Modern server/client hybrid web application |
| **Styling & UI Tokens** | [Tailwind CSS 4](https://tailwindcss.com/) + Custom Kinto System | Warm canvas aesthetic (`#FAF7F2`), frosted glass, dot-matrix grid |
| **Motion & Micro-interactions** | [Framer Motion](https://www.framer.com/motion) & Motion Primitives | Spring tabs, animated number tickers, expandable order breakdown |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 16, PostGIS, RLS) | Relational storage, geolocation spatial indexing, OAuth & RBAC |
| **Multimodal AI Vision** | [Google Gemini 2.5 Flash](https://ai.google.dev/) | 9:16 video frame inspection, logo stamp matching, liveness check |
| **Video Processing** | [OpenCV](https://opencv.org/) & [FFmpeg](https://ffmpeg.org/) | Adaptive keyframe extraction and resolution normalization |
| **WebSockets & Relayer** | [Express](https://expressjs.com/), `ws`, [BullMQ](https://bullmq.io/), [Redis](https://redis.io/) | Courier webhook ingestion & real-time chat gateway |
| **Web3 Smart Contracts** | [Solidity 0.8.24](https://soliditylang.org/), [Hardhat](https://hardhat.org/), [Wagmi](https://wagmi.sh/), [Viem](https://viem.sh/) | Non-custodial crypto escrow settlement with emergency dispute resolution |

---

## 📊 Unit Economics & Section 194-O Math

Traditional e-commerce platforms charge 15–25% in take rates, while middlemen take 30–50%. Karigar Kart operates on a sustainable **5% platform fee** and automates statutory **Section 194-O (1% TDS)** deductions for complete compliance.

### Example Settlement Math for a ₹10,000 Custom Commission:

$$\text{Gross Order Amount} = ₹10,000$$

$$\text{Platform Commission (5\%)} = ₹500$$

$$\text{Section 194-O TDS (1\% on Gross)} = ₹100$$

$$\text{Net Artisan Disbursement} = ₹10,000 - (₹500 + ₹100) = ₹9,400$$

| Parameter | Traditional Middlemen Model | Karigar Kart Proof-of-Craft |
|---|---|---|
| **Gross Customer Price** | ₹10,000 | ₹10,000 |
| **Intermediary Fee / Margin** | 20% – 35% (₹2,000 – ₹3,500) | **5% (₹500)** |
| **Statutory TDS Compliance** | Manual / Often evaded | **Automated 1% (₹100)** |
| **Maker Net Payout** | ₹6,500 – ₹8,000 | **₹9,400 (94% Take-Home)** |
| **Payment Protection** | Unsecured / 30–60 day delay | **Guaranteed Dual-Rail Escrow** |

---

## 🚀 Local Setup & Installation Guide

### Prerequisites
* **Node.js**: v18.18.0 or higher
* **Python**: 3.10 or higher
* **npm** / **pnpm**
* **Git**

---

### Step 1: Clone the Monorepo
```bash
git clone https://github.com/Tejas-India-Hackathon-2026/Team-Code-Crafters02.git
cd karigar_kart
```

---

### Step 2: Configure Environment Variables

#### `apps/web/.env.local`
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Google Gemini AI API Key
GEMINI_API_KEY=your-google-gemini-api-key

# Storage & Assets
NEXT_PUBLIC_STORAGE_BUCKET=verification_reels

# Gateway Endpoint
NEXT_PUBLIC_GATEWAY_WS_URL=ws://localhost:4000
```

#### `apps/ai-engine/.env`
```env
PORT=8000
GEMINI_API_KEY=your-google-gemini-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

#### `apps/gateway/.env`
```env
PORT=4000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
REDIS_URL=redis://localhost:6379
COURIER_WEBHOOK_SECRET=your_courier_webhook_secret
```

---

### Step 3: Install Monorepo Dependencies

```bash
# Install root dependencies
npm install

# Install web client dependencies
npm --prefix apps/web install

# Install gateway dependencies
npm --prefix apps/gateway install

# (Optional) Setup Python AI Engine virtual environment
cd apps/ai-engine
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
pip install -r requirements.txt
cd ../..
```

---

### Step 4: Run the Development Environments

```bash
# Run the Next.js Web Application
npm run dev

# (Optional) Run the Gateway Server in a separate terminal
npm run dev:gateway
```

The web marketplace will be live on **[http://localhost:3000](http://localhost:3000)**.

---

## 🔒 Security & Verification Controls

* **Row-Level Security (RLS):** Every PostgreSQL table (`profiles`, `custom_projects`, `project_bids`, `orders`, `messages`) is locked behind granular user/vendor ID policies.
* **HMAC-SHA256 Webhook Verification:** Courier status webhooks (Dispatched $\rightarrow$ In-Transit $\rightarrow$ Delivered) require cryptographic signature validation before triggering escrow countdowns.
* **Smart Contract Reentrancy Protection:** `DeliveryEscrow.sol` includes non-reentrant guards (`nonReentrant`) and state validation (`onlyBuyerOrRelayer`).
* **Ingress Sanitizer:** Chat messages are sanitized in real time to prevent cross-site scripting (XSS) and off-platform disintermediation.

---

## 👥 Team Credits

Built with ❤️ for **Tejas India Hackathon 2026** by **Team Code Crafters 02**:

* **Institution:** Government Engineering College, Jamui (Bihar)
* **Team:** Team Code Crafters
* **Repository:** [Tejas-India-Hackathon-2026/Team-Code-Crafters02](https://github.com/Tejas-India-Hackathon-2026/Team-Code-Crafters02)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
