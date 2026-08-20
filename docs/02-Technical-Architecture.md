This Technical Architecture Document establishes the engineering blueprint for the **Handmade Maker Marketplace** based on the architectural dossier and PRD. 

--- 

- **1. Tech Stack & Architectural Reasoning** 

| Layer / Component | Production Technology | Architectural Reasoning | 

| --- | --- | --- | 

| **Frontend & Client UI** | Next.js (App Router, RSC), TypeScript, Tailwind CSS, shadcn/ui 

| Server-Side Rendering (SSR) for fast marketplace SEO discovery and low-latency client rendering on Vercel. 

| 

| **State Gateway & WebSockets** | Node.js (Express / `ws`) or Go on AWS ECS 

| Manages persistent WebSocket feeds, signed courier webhook ingestion, and avoids serverless runtime timeouts. 

| 

| **Database & Search** | PostgreSQL 16 with PostGIS extension (Supabase) 

| Relational ACID guarantees, native Row-Level Security (RLS), and index-backed geospatial queries (`ST_DWithin`) for location matching. 

| 

| **AI Verification Engine** | Python 3.11, FastAPI, FFmpeg, Celery, Redis 

| Dynamic keyframe extraction (3–5 frames) and vision inference using Gemini 2.5 Flash without blocking API routes. 

| 

| **Storage & Media CDN** | AWS S3 / Cloudflare R2 + Cloudflare Stream 

| Client direct-to-storage presigned uploads with global streaming distribution for approved maker reels. 

| 

| **Web2 Escrow (Default Rail)** | Castler / Escrowpay Nodal API 

| RBI-compliant nodal accounts with built-in Section 194-O TDS (1%) and GST reconciliation. 

| 

| **Web3 Escrow (Opt-in Rail)** | Solidity 0.8.24 (`DeliveryEscrow.sol`, `EscrowFactory.sol`), Polygon / Arbitrum 

| Low-gas L2 EVM smart contracts managing multi-signature on-chain escrow holds for cryptoverified users. 

| 

| **Logistics Relayer & Oracle** | HMAC-SHA256 Signed Courier Relayers (Delhivery, FedEx, DHL, Blue Dart) 

| Authenticates third-party delivery proofs before starting the 48-hour dispute buffer window. 

| 

| **Job Queue & Scheduling** | BullMQ / Redis or Temporal 

| Guarantees durable execution of the 48-hour dispute window and payout settlement across server restarts. 

| 

--- 

**2. Complete File & Folder Structure** 

A monorepo structure separating the client, gateway, AI engine, and smart contracts: 

```text 

handmade-marketplace/ 

├── apps/ 

│   ├── web/                           # Next.js 14/15 App Router Frontend 

│   │   ├── src/ 

│   │   │   ├── app/                   # Route groups & pages 

- │   │   │   │   ├── (auth)/            # Auth routes (OAuth Google/Apple) │   │   │   │   ├── (buyer)/           # Buyer workspace (marketplace, commissions) │   │   │   │   ├── (vendor)/          # Verified vendor dashboard & reel uploads │   │   │   │   ├── (admin)/           # HITL moderation & dispute triage │   │   │   │   ├── api/               # Next.js BFF proxy routes │   │   │   │   └── layout.tsx │   │   │   ├── components/            # Reusable UI elements (chat, map, media) │   │   │   ├── hooks/                 # Custom React hooks (useWebSockets, useGeo) │   │   │   └── lib/                   # Supabase client, utils, formatters 

- │   │   └── package.json 

- │   │ 

- │   ├── gateway/                       # Node.js/Go Microservice (ECS/Railway) │   │   ├── src/ 

- │   │   │   ├── sockets/               # WebSocket connection & room managers │   │   │   ├── sanitizers/            # Regex & OCR chat content interceptors │   │   │   ├── webhooks/              # Courier signature validation & relayers 

- │   │   │   ├── services/              # Escrow orchestration layer │   │   │   └── index.ts │   │   └── package.json 

- │   │ 

- │   └── ai-engine/                     # Python Celery + FastAPI Inference Worker │       ├── app/ 

- │       │   ├── workers/               # Celery task definitions 

- │       │   ├── pipeline/              # FFmpeg frame extraction & EXIF checks 

- │       │   ├── models/                # Gemini 2.5 Flash vision prompts & schemas 

- │       │   └── main.py 

- │       ├── requirements.txt 

- │       └── Dockerfile 

# │ 

- ├── packages/ 

- │   ├── contracts/                     # Web3 Hardhat/Foundry workspace 

- │   │   ├── contracts/ 

- │   │   │   ├── DeliveryEscrow.sol 

- │   │   │   └── EscrowFactory.sol 

- │   │   ├── scripts/ 

- │   │   └── hardhat.config.ts 

│   ├── database/                      # Shared DB types, Prisma/Drizzle schema & migrations 

│   │   ├── migrations/ 

│   │   └── schema.sql 

- │   └── shared-types/                  # Common TypeScript interfaces & enums 

│ 

├── .env.example 

├── docker-compose.yml 

└── README.md 

``` 

--- 

- **3. Database Schema (PostgreSQL 16 + PostGIS)** 

- **`profiles`**: Stores unified identity and access control details. 

- `id` (UUID, Primary Key, references `auth.users.id` on delete cascade) 

- `full_name` (TEXT, NOT NULL) 

- `avatar_url` (TEXT) 

- `is_vendor` (BOOLEAN, default: `FALSE`) 

- `vendor_verified` (BOOLEAN, default: `FALSE`) 

- `kyc_status` (ENUM: `'NONE'`, `'PENDING'`, `'PASSED'`, default: `'NONE'`) 

- `geo_location` (GEOGRAPHY(Point, 4326), spatial index) 

- `wallet_address` (VARCHAR(42), nullable, opt-in Web3 wallet) 

- `created_at` (TIMESTAMPTZ, default: `NOW()`) 

- **`verification_reels`**: Tracks uploaded maker videos and AI checks. 

- `id` (UUID, Primary Key) 

- `vendor_id` (UUID, Foreign Key → `profiles.id`) 

- `video_url` (TEXT, NOT NULL) 

- `stream_media_id` (TEXT, Cloudflare Stream asset ID) 

- `status` (ENUM: `'PENDING'`, `'AUTO_APPROVED'`, `'REJECTED'`, `'NEEDS_REVIEW'`) 

- `confidence_score` (NUMERIC(5,4), e.g., `0.9250`) 

- `extracted_metadata` (JSONB, stores logo, serial number, liveness results) 

- `created_at` (TIMESTAMPTZ, default: `NOW()`) 

- **`custom_projects`**: Custom buyer commission requests. 

- `id` (UUID, Primary Key) 

- `buyer_id` (UUID, Foreign Key → `profiles.id`) 

- `title` (VARCHAR(255), NOT NULL) 

- `description` (TEXT, NOT NULL) 

- `budget_min` (NUMERIC(12,2)) 

- `budget_max` (NUMERIC(12,2)) 

- `deadline` (TIMESTAMPTZ) 

- `delivery_location` (GEOGRAPHY(Point, 4326)) 

- `status` (ENUM: `'OPEN'`, `'IN_PROGRESS'`, `'COMPLETED'`, `'CANCELLED'`) 

- `created_at` (TIMESTAMPTZ, default: `NOW()`) 

- **`project_bids`**: Bids submitted by verified makers on commission requests. 

- `id` (UUID, Primary Key) 

- `project_id` (UUID, Foreign Key → `custom_projects.id`) 

- `vendor_id` (UUID, Foreign Key → `profiles.id`) 

- `bid_amount` (NUMERIC(12,2), NOT NULL) 

- `proposal_text` (TEXT) 

- `status` (ENUM: `'PENDING'`, `'ACCEPTED'`, `'REJECTED'`) 

- `created_at` (TIMESTAMPTZ, default: `NOW()`) 

- **`conversations` & `messages**`: In-app messaging and audit trail. 

- `conversations`: `id` (UUID, PK), `buyer_id`, `vendor_id`, `project_id`, `created_at` 

* `messages`: `id` (UUID, PK), `conversation_id` (FK), `sender_id` (FK), `content` (TEXT), `is_flagged` (BOOLEAN, default: `FALSE`), `flag_reason` (TEXT, nullable), `created_at` (TIMESTAMPTZ) 

- **`escrow_orders`**: Dual-rail transaction ledger. 

- `id` (UUID, Primary Key, e.g., `ORD-XXXX`) 

- `project_id` (UUID, Foreign Key → `custom_projects.id`) 

- `buyer_id` (UUID, Foreign Key → `profiles.id`) 

- `vendor_id` (UUID, Foreign Key → `profiles.id`) 

- `rail` (ENUM: `'WEB2_NODAL'`, `'WEB3_CONTRACT'`, default: `'WEB2_NODAL'`) 

- `gross_amount` (NUMERIC(12,2), in paise or USDC) 

- `withheld_tds` (NUMERIC(12,2), 1% under Section 194-O) 

- `gst_split` (JSONB: `{ cgst, sgst, igst }`) 

- `net_payout` (NUMERIC(12,2)) 

- `status` (ENUM: `'AWAITING_PAYMENT'`, `'HELD_IN_ESCROW'`, `'DISPATCHED'`, 

- `'DELIVERED_PENDING_BUFFER'`, `'DISPUTED'`, `'RELEASED'`, `'REFUNDED'`) 

- `contract_address` (VARCHAR(42), nullable, Web3 contract address) 

- `nodal_ref_id` (VARCHAR(100), nullable, Castler transaction reference) 

- `tracking_id` (VARCHAR(100), courier tracking number) 

- `carrier_code` (VARCHAR(50), e.g., `'DELHIVERY'`, `'BLUEDART'`) 

- `delivery_timestamp` (TIMESTAMPTZ, set by courier webhook) 

- `auto_release_at` (TIMESTAMPTZ, `delivery_timestamp + 48 hours`) 

--- 

- **4. Environment Variables & Configuration Blueprint** 

**Gateway & Next.js Client** 

- `DATABASE_URL`: PostgreSQL connection string (with PostGIS enabled). 

- `SUPABASE_SERVICE_ROLE_KEY`: Admin key for backend queries bypassing RLS. 

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Client key for authenticated requests. 

- `REDIS_URL`: BullMQ job scheduler and Celery broker connection. 

- `COURIER_WEBHOOK_SECRET`: Secret key for HMAC-SHA256 signature verification of carrier events. 

- **Web2 Compliance & Nodal Escrow** 

- `CASTLER_API_KEY` / `ESCROWPAY_KEY`: Production credentials for the RBI nodal escrow service. 

* `PLATFORM_GSTIN`: Platform Goods and Services Tax Identification Number for invoice generation. 

- `PLATFORM_TAN`: Platform Tax Deduction Account Number for Form 26Q TDS filings. 

- **Web3 Smart Contract Rail** 

- `RPC_PROVIDER_URL`: Alchemy / Infura endpoint for Arbitrum or Polygon. 

- `RELAYER_PRIVATE_KEY`: Private key of the trusted oracle relayer stored in AWS KMS or HashiCorp Vault. 

- `ESCROW_FACTORY_ADDRESS`: Deployed address of `EscrowFactory.sol`. 

**AI Inference Engine** 

- `GEMINI_API_KEY`: API key for Gemini 2.5 Flash multimodal vision analysis. 

- `AWS_S3_BUCKET` / `CLOUDFLARE_R2_BUCKET`: Storage bucket name for raw reel uploads. 

- `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`: IAM credentials with scoped S3 PutObject presigning policies. 

- `CLOUDFLARE_STREAM_API_TOKEN`: Token for ingesting and streaming verified maker reels. 

