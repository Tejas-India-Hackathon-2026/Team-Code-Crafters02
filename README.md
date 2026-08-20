# Karigar Kart
### AI-Verified Artisan Marketplace & Dual-Rail Escrow

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash_Vision-8E75B2?style=flat-square&logo=google)](https://ai.google.dev/)
[![Escrow Rails](https://img.shields.io/badge/Escrow-Dual--Rail_(Web2_Nodal_+_Web3_EVM)-orange?style=flat-square)]()

> **Bridging grassroots Indian artisans to conscious buyers with Gemini Multimodal authenticity inspection and statutory escrow settlement.**

---

## 📌 Executive Summary

India's traditional artisanal economy suffers from two existential challenges:
1. **Machine-Made Counterfeiting & Trust Deficit**: Industrial knock-offs flood direct-to-consumer markets, depressing handcrafted goods prices and misleading conscious buyers.
2. **Payment Insecurity & Statutory Friction**: Grassroots makers lack formal contract enforcement, face payment defaults, and struggle with statutory tax compliances like **Section 194-O (1% TDS on e-commerce operators)**.

**Karigar Kart** introduces an autonomous verification pipeline powered by **Google Gemini 2.5 Flash Multimodal Vision** to analyze raw workshop footage for handcrafted markers (hand-tool ergonomics, natural material grain variations, manual joinery) while filtering industrial CNC/lathe signatures. Transactions are settled via a **Dual-Rail Escrow protocol** featuring a **48-hour post-delivery inspection window** and automated statutory tax compliance.

---

## ⚡ Core Features

### 🔍 1. Gemini AI Multimodal Authenticity Verification
- **Frame-by-Frame Craft Inspection**: Uploaded maker reels and workshop videos are processed by Gemini 2.5 Flash to verify authentic handcraft techniques (e.g., hand chiseling, manual block printing, handloom weaving).
- **Counterfeit & Automation Rejection**: Identifies high-speed CNC routing, uniform injection-molded seams, and automated lathe tooling.
- **Audit-Grade Verification Score**: Emits structured confidence metrics, material classification, detected toolsets, and generates an unalterable authenticity certificate for every artisan listing.

### 🛡️ 2. Dual-Rail Escrow with 48-Hour Inspection Buffer
- **Default Web2 Rail (RBI-Compliant Nodal Account)**: Integrates nodal banking escrow rails (e.g., Castler/Escrowpay) holding funds until courier milestone confirmation.
- **Opt-In Web3 Rail (EVM Smart Contracts)**: Solidity escrow contracts (`DeliveryEscrow.sol`, `EscrowFactory.sol`) supporting on-chain programmatic settlement.
- **48-Hour Buyer Dispute Window**: Funds are held safely after carrier delivery. If no dispute is raised within 48 hours (or upon buyer approval), the escrow auto-releases payouts directly to the maker.

### ⚖️ 3. Statutory Section 194-O Automated Compliance
- **Real-Time Tax Deduction**: Automatically computes and reserves the statutory **1% TDS under Section 194-O of the Indian Income Tax Act** alongside platform commission fees before artisan disbursement.
- **Transparent Fee Breakdown**: Buyers and sellers receive full visibility into item cost, platform escrow fees, GST, and net TDS-adjusted payouts.

### 💬 4. Live Artisan Collaboration & Real-Time Tracking
- **Direct Maker-Buyer Chat**: Real-time communication powered by Supabase Realtime and State Gateway WebSockets.
- **Custom Milestone Quoting**: Artisans can issue customized milestone quotes directly inside the chat interface.
- **Interactive Geolocation Discovery**: Map-based search (`NearbyMakersMap`) enabling buyers to discover and connect with local indigenous craft clusters.

---

## 🏗️ System Architecture

Karigar Kart operates as a modular monorepo orchestrating real-time client applications, stateless micro-gateways, and AI vision inference pipelines.

```mermaid
graph TD
    User([Buyer / Artisan Client]) -->|Next.js App Router| WebApp[apps/web]
    WebApp -->|Auth & Database / RLS| Supabase[(Supabase PostgreSQL + Realtime)]
    WebApp -->|Direct Presigned Uploads| S3Bucket[(S3 / Storage CDN)]
    WebApp -->|Video Verification API| GeminiAI[Google Gemini 2.5 Flash API]
    WebApp -->|Realtime Events & Webhooks| Gateway[apps/gateway Express / WS]
    Gateway -->|Courier Tracking Webhooks| CourierRelayer[Logistics Relayer]
    Gateway -->|Task Processing| BullMQ[Redis / BullMQ]
    WebApp -->|Web2 Nodal Escrow| NodalAPI[Castler / Nodal Banking API]
    WebApp -->|Web3 Dual-Rail Escrow| SmartContracts[Solidity Escrow Contracts]
```

### Monorepo Structure

```
karigar_kart/
├── apps/
│   ├── web/                     # Next.js 16 (App Router), Tailwind CSS, UI Components
│   │   ├── src/
│   │   │   ├── app/             # Buyer, Vendor, Admin, and API Route Handlers
│   │   │   ├── components/      # Auth, Escrow, Media Uploader, Map, Chat
│   │   │   └── lib/             # Supabase client/server and utilities
│   │   └── public/              # Static assets and media files
│   ├── gateway/                 # Express + WebSockets courier relayer & state gateway
│   │   └── src/                 # Webhooks, chat sanitizers, and WebSocket server
│   └── ai-engine/               # Vision inference pipelines and frame extraction
├── packages/
│   ├── contracts/               # Solidity Smart Contracts (DeliveryEscrow, EscrowFactory)
│   └── database/                # PostgreSQL schema definitions and RLS policies
├── docs/                        # Specifications, PRDs, and architecture blueprints
├── .gitignore                   # Optimized monorepo Git exclusion rules
└── package.json                 # Monorepo root package management
```

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Turbopack) |
| **Styling & Icons** | [Tailwind CSS 4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Language & Runtime** | [TypeScript](https://www.typescriptlang.org/) (Strict mode), [Node.js 18+](https://nodejs.org/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 16, Row-Level Security, Realtime) |
| **Multimodal AI Vision** | [Google Gemini 2.5 Flash](https://ai.google.dev/) (Video & Keyframe Authenticity Inspection) |
| **Escrow & Settlement** | Dual-Rail (Nodal Banking API + EVM Solidity Smart Contracts) |
| **WebSockets & Gateway** | [Express](https://expressjs.com/), `ws`, [BullMQ](https://bullmq.io/) & [Redis](https://redis.io/) |
| **Web3 Integration** | [Wagmi](https://wagmi.sh/), [Viem](https://viem.sh/), [RainbowKit](https://www.rainbowkit.com/) |

---

## 🚀 Local Setup & Installation Guide

### Prerequisites
- **Node.js**: v18.18.0 or higher
- **npm** (or **pnpm** / **yarn**)
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Tejas-India-Hackathon-2026/Team-Code-Crafters02.git
cd karigar_kart
```

---

### Step 2: Configure Environment Variables

Create environment configuration files for both `apps/web` and `apps/gateway`.

#### `apps/web/.env.local`
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Storage & CDN (AWS S3 / Cloudflare)
AWS_S3_BUCKET=maker-marketplace-assets
CLOUDFLARE_STREAM_API_TOKEN=your-cf-stream-token

# Gateway WebSocket Endpoint
NEXT_PUBLIC_GATEWAY_WS_URL=ws://localhost:4000
```

#### `apps/gateway/.env`
```env
PORT=4000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
REDIS_URL=redis://localhost:6379
CASTLER_API_KEY=your_nodal_escrow_api_key
COURIER_WEBHOOK_SECRET=your_courier_webhook_secret
```

---

### Step 3: Install Dependencies

Install all monorepo dependencies:
```bash
# Install root and workspace dependencies
npm install

# Install web app dependencies
npm --prefix apps/web install

# Install gateway dependencies
npm --prefix apps/gateway install
```

---

### Step 4: Run the Development Servers

Start the Next.js web application:
```bash
npm run dev
# or
npm run dev:web
```
The marketplace client will be accessible at **[http://localhost:3000](http://localhost:3000)**.

To optionally start the realtime courier & state gateway:
```bash
npm run dev:gateway
```
The gateway will run on **[http://localhost:4000](http://localhost:4000)** (WebSocket on `ws://localhost:4000`).

---

## 🔒 Security & Compliance Safeguards

- **Row-Level Security (RLS)**: Fine-grained PostgreSQL RLS ensures buyers and makers can only read/write their authorized orders, quotes, and messages.
- **Section 194-O Automated Hold**: Transparently reconciles TDS and platform commissions prior to payout dispatches.
- **Tamper-Proof Courier Hooks**: Courier updates require HMAC-SHA256 signature verification to guard delivery states.
- **Strict Video Inspection**: Craft verification rejects AI synthetic deepfakes and pre-recorded automated assembly lines.

---

## 📄 License & Attribution

Developed for **Tejas India Hackathon 2026** by **Team Code Crafters 02**.  
Licensed under the [MIT License](LICENSE).
