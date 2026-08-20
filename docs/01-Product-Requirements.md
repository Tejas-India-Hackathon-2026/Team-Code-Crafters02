# Product Requirements Document (PRD): Handmade Maker Marketplace & Verification Platform

## 1. Problem Statement
* Small-scale, local artisans and makers lack the marketing budgets, distribution channels, and technical infrastructure needed to reach broader audiences[cite: 1].
* Online buyers face frequent counterfeits, unverified craftsmanship, and payment scams where goods never arrive or sellers never receive funds[cite: 1].
* Increasing consumer demand for authentic, limited-batch, and local goods requires high-trust verification[cite: 1].
* Modern automated multimodal AI and escrow solutions can now eliminate manual verification bottlenecks and transactional fraud affordably[cite: 1].

---

## 2. Target User
* **Makers / Artisans (Sellers):**
  * Independent creators and small craft business owners looking to monetize handmade inventory and custom commissions[cite: 1].
  * Want to showcase authentic production workflows, win local custom commissions, and receive guaranteed on-time payouts without payment disputes[cite: 1].
  * Face high platform fees, competition against mass-manufactured drop-shipped goods, non-paying clients, and marketing complexity[cite: 1].
* **Discerning Buyers (Consumers):**
  * Shoppers seeking verified bespoke, handmade, or localized products[cite: 1].
  * Want to discover authentic local artisans, order custom items, and securely transact with full delivery guarantees[cite: 1].
  * Experience misleading product photos, lack of delivery assurance, and difficulty finding reliable local makers[cite: 1].

---

## 3. Core Features (MVP Only)

### Must-Have Features
* **Edge Video Ingestion & Asynchronous AI Verification:**
  * Direct-to-storage video reel uploads (30–60 seconds) via presigned URLs to AWS S3 or Cloudflare R2[cite: 1].
  * Asynchronous Python Celery worker extracts keyframes via FFmpeg and performs multimodal vision checks using Gemini 2.5 Flash[cite: 1].
  * Validates brand logo visibility and sequential limited-edition markings (e.g., "1/100") with confidence score routing ($\ge 85\%$ auto-approved; $< 85\%$ routed to Admin Review Queue)[cite: 1].
* **Geospatial Custom Order Marketplace:**
  * Dedicated buyer workflow to post tailor-made requests with image attachments, descriptions, budget, deadline, and coordinates[cite: 1].
  * PostGIS-indexed geospatial search (`ST_DWithin`) prioritizing nearby verified makers to review requests and place bids[cite: 1].
* **Ingress-Sanitized In-App Direct Messaging:**
  * Real-time WebSocket chat layer connecting buyers and makers[cite: 1].
  * Multi-layer ingress sanitization stripping phone numbers, email addresses, external links, and payment handles (UPI, PayPal) via regex and OCR to prevent disintermediation[cite: 1].
  * Embedded actionable contract triggers allowing vendors to issue quote cards and buyers to fund escrows directly within the thread[cite: 1].
* **Dual-Rail Escrow Orchestration & Logistics Oracles:**
  * Dynamic escrow orchestrator defaulting to an RBI-compliant Web2 nodal escrow account (Castler/Escrowpay) with automated TDS (Section 194-O) and GST deduction[cite: 1].
  * Opt-in Web3 EVM smart contract deployment (`EscrowFactory.sol` on Polygon/Arbitrum) for crypto-verified users[cite: 1].
  * Unified courier webhook ingestion service parsing signed HMAC-SHA256 delivery events from carriers (Delhivery, FedEx, DHL, Blue Dart)[cite: 1].
  * Enforces a 48-hour dispute buffer window post-delivery before automated fund release[cite: 1].
* **Granular Identity & Access Management:**
  * Single public registration via OAuth 2.0 (Google/Apple) mapped to a unified PostgreSQL profile[cite: 1].
  * Row-Level Security (RLS) policies gating vendor bidding and reel posting behind verified vendor flags (`is_vendor = TRUE`, `vendor_verified = TRUE`)[cite: 1].

### Nice to Have (Post-Launch)
* Push notifications for chat and order state transitions[cite: 1].
* Social sharing integration for approved product reels[cite: 1].

---

## 4. Out of Scope (v1)
* **Complex Predictive Analytics Dashboards:** Replaced with basic PostgreSQL metrics and lightweight client analytics (PostHog/Google Analytics)[cite: 1].
* **Multi-Currency FX Conversions:** Operations restricted strictly to a single base currency (e.g., INR or USD)[cite: 1].
* **Automated Gas Optimization & Account Abstraction:** Standard L2 transactions or default Web2 fiat escrow flows used instead[cite: 1].
* **In-App Video Editing Tools:** Users upload raw, unedited camera captures directly to storage[cite: 1].
* **Automated AI Dispute Resolution:** Payout disputes handled via a human Admin Review Dashboard inspecting chat logs and evidence[cite: 1].

---

## 5. Success Metrics
* **AI Verification Turnaround & Precision:** $\ge 80\%$ of submitted reels processed and auto-triaged within $< 2$ seconds with $< 2\%$ false-positive approvals[cite: 1].
* **Custom Commission Conversion:** $\ge 25\%$ of posted custom project requests successfully funded into escrow within 48 hours[cite: 1].
* **Settlement Execution:** $100\%$ delivery event verification accuracy via HMAC-signed relayer with zero unauthorized early releases[cite: 1].

---

## 6. Technical Assumptions
* **Frontend:** Next.js (App Router, Server-Side Rendering) + Tailwind CSS hosted on Vercel[cite: 1].
* **Gateway & WebSockets:** Go or Node.js / Express microservice on AWS ECS or Railway[cite: 1].
* **Database:** PostgreSQL 16 + PostGIS extension on Supabase with Row-Level Security (RLS)[cite: 1].
* **AI & Processing Cluster:** Python (FastAPI) + FFmpeg + Celery/Redis cluster calling Gemini 2.5 Flash[cite: 1].
* **Media Storage & CDN:** AWS S3 / Cloudflare R2 presigned uploads + Cloudflare Stream delivery[cite: 1].
* **Escrow Architecture:** Dual-rail orchestrator wrapping Castler/Escrowpay APIs (Web2 default) and `ProductionDeliveryEscrow.sol` / `EscrowFactory.sol` (Web3 opt-in)[cite: 1].
* **Courier Ingestion:** Webhook relayer validating HMAC-SHA256 signatures for logistics providers[cite: 1].

---

## 7. Open Questions
* What polling or reconciliation fallback will trigger if a logistics carrier fails to send the final `DELIVERED` webhook[cite: 1]?
* Will vendor onboarding require third-party document/KYC automation prior to setting `vendor_verified = TRUE`, or manual admin triage for early cohorts[cite: 1]?
* Is the 48-hour post-delivery dispute buffer standard across all craft categories, or should high-value/fragile items support configurable durations[cite: 1]?
* What secure key management service (AWS KMS, HashiCorp Vault) will store the relayer private key used for automated Web3 delivery confirmations[cite: 1]?