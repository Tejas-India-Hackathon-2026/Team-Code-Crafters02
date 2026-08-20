# Feature Ticket List: Handmade Maker Marketplace

This document translates the functional requirements, system architecture, and security policies from the PRD and Technical Specifications into buildable, single-prompt AI engineering tasks.

---

### Epic 1: Identity, Authentication & Profile System

#### Ticket ID: `AUTH-01`
* **Feature Name:** Next.js Supabase Social OAuth Integration
* **Task Description:** Build the frontend authentication entry point and session handler using `@supabase/ssr` in Next.js (App Router). Implement Google and Apple passwordless OAuth sign-in flows that create an entry in `auth.users` and redirect to an auth callback route storing HttpOnly, SameSite=Lax session JWTs.
* **Acceptance Criteria:**
  - Clicking "Sign in with Google" or "Sign in with Apple" redirects to the respective OAuth provider consent screen.
  - Successful OAuth callback populates `auth.users`, establishes a secure HttpOnly cookie session, and forwards the user to their target path.
  - JWT token is set with a 1-hour expiration and automatic refresh handling.
* **Dependencies:** None
* **Priority:** Must-have for launch

#### Ticket ID: `AUTH-02`
* **Feature Name:** PostgreSQL Profiles Schema & RLS Policies
* **Task Description:** Write database migration scripts to initialize the `profiles` table in Supabase PostgreSQL with columns (`id`, `full_name`, `avatar_url`, `is_vendor`, `vendor_verified`, `kyc_status`, `geo_location`, `wallet_address`, `created_at`). Apply Row-Level Security (RLS) policies allowing public read access for storefronts and restricting write/update operations strictly to the profile owner (`auth.uid() = id`).
* **Acceptance Criteria:**
  - Table is created with proper data types, default values, and foreign key cascades to `auth.users.id`.
  - Unauthenticated/authenticated users can view public profile details via `SELECT`.
  - Authenticated users cannot update any profile where `id != auth.uid()`.
* **Dependencies:** `AUTH-01`
* **Priority:** Must-have for launch

#### Ticket ID: `AUTH-03`
* **Feature Name:** EIP-4361 Web3 Wallet Linkage Modal
* **Task Description:** Implement an opt-in Web3 wallet verification flow on the user profile settings page using `wagmi`, `viem`, and `@rainbow-me/rainbowkit`. The client requests a nonce challenge from the backend and prompts the user to sign an EIP-4361 ("Sign-In with Ethereum") message to bind their `wallet_address` to their Supabase profile.
* **Acceptance Criteria:**
  - User can connect an EVM-compatible browser wallet (MetaMask, Rainbow, Coinbase Wallet).
  - Backend verifies the cryptographic signature of the nonce challenge before writing the address to `profiles.wallet_address`.
  - Reject signature mismatches without altering the profile state.
* **Dependencies:** `AUTH-02`
* **Priority:** Should-have

---

### Epic 2: Artisan Video Ingestion & AI Verification Engine

#### Ticket ID: `VERIF-01`
* **Feature Name:** S3 / Cloudflare R2 Presigned Upload API Route
* **Task Description:** Create a Next.js BFF endpoint (`POST /api/vendor/reels/presign`) that validates file constraints (`video/mp4`, `video/quicktime`, maximum size 100 MB) and generates a direct-to-storage presigned upload URL expiring in 60 seconds. Insert an initial entry into `verification_reels` with `status = 'PENDING'`.
* **Acceptance Criteria:**
  - Endpoint returns a valid presigned PUT URL and newly generated `reelId` (UUID).
  - Rejects payloads exceeding 100 MB or unsupported MIME types with HTTP 400.
  - S3 upload policy restricts uploads strictly to the authorized maker's folder prefix.
* **Dependencies:** `AUTH-02`
* **Priority:** Must-have for launch

#### Ticket ID: `VERIF-02`
* **Feature Name:** 9:16 Video Upload Client & Verification Trigger
* **Task Description:** Build a vertical video uploader component for artisans. The component executes a direct binary `PUT` request to the presigned storage URL with an active progress bar, and upon `200 OK`, invokes `POST /api/vendor/reels/verify` to queue the backend AI inspection.
* **Acceptance Criteria:**
  - Artisan can select or drag-and-drop a 30–60s video file.
  - Upload progress displays percentage correctly during direct binary transmission.
  - Dispatches verification request payload `{"reelId": "UUID"}` immediately upon completion.
* **Dependencies:** `VERIF-01`
* **Priority:** Must-have for launch

#### Ticket ID: `VERIF-03`
* **Feature Name:** Celery & FFmpeg Frame Extraction Pipeline
* **Task Description:** Set up a Python 3.11 Celery worker backed by Redis. Build an FFmpeg pipeline that ingests raw reel files from S3/R2, validates EXIF integrity, dynamically extracts 3–5 representative keyframes, and prepares images for model inference.
* **Acceptance Criteria:**
  - Celery task downloads the video asset and successfully extracts frames without local disk exhaustion.
  - Task retries up to 3 times on transient FFmpeg/S3 failures before marking reel status as `NEEDS_REVIEW`.
* **Dependencies:** `VERIF-01`
* **Priority:** Must-have for launch

#### Ticket ID: `VERIF-04`
* **Feature Name:** Multimodal Vision Verification with Gemini 2.5 Flash
* **Task Description:** Build the inference module in FastAPI/Celery utilizing the Gemini 2.5 Flash API. Prompt the model to evaluate keyframes for brand logo visibility, sequential limited-edition batch markings (e.g., "#04/50"), and maker presence. Output a structured JSON response containing the confidence score and metadata.
* **Acceptance Criteria:**
  - Model outputs a validated JSON schema containing `confidence_score` (0.0 to 1.0) and extracted tags.
  - Database updates `verification_reels.status`: `AUTO_APPROVED` if score $\ge 0.85$, or `NEEDS_REVIEW` if score $< 0.85$.
  - Automatically updates `profiles.vendor_verified = TRUE` when a reel meets auto-approval criteria.
* **Dependencies:** `VERIF-03`
* **Priority:** Must-have for launch

#### Ticket ID: `VERIF-05`
* **Feature Name:** Admin HITL Review Queue Dashboard
* **Task Description:** Build an admin triage interface at `app/(admin)/triage/page.tsx` displaying all verification reels with `status = 'NEEDS_REVIEW'`. Allow operators with admin claims to inspect keyframes, view AI confidence scores, and manually click "Approve" or "Reject".
* **Acceptance Criteria:**
  - Restricted to users with admin JWT claims via Next.js middleware and Supabase RLS.
  - Admin approval transitions reel to `AUTO_APPROVED` and sets maker's `vendor_verified = TRUE`.
  - Admin rejection updates reel status to `REJECTED` with a mandatory logged reason.
* **Dependencies:** `VERIF-04`
* **Priority:** Must-have for launch

---

### Epic 3: Geospatial Custom Project Marketplace

#### Ticket ID: `MKT-01`
* **Feature Name:** Custom Commission Posting Form with PostGIS Coordinates
* **Task Description:** Build the custom order creation screen at `app/(buyer)/projects/new/page.tsx`. Use browser geolocation or Mapbox forward geocoding to capture buyer coordinates and store them as a `GEOGRAPHY(Point, 4326)` in `custom_projects` along with title, description, budget range, and delivery deadline.
* **Acceptance Criteria:**
  - Form validates required fields: title, description, budget min/max, and target location.
  - Successfully creates a record in `custom_projects` with `status = 'OPEN'` via Supabase client.
  - Buyer is navigated to the project detail view upon successful creation.
* **Dependencies:** `AUTH-02`
* **Priority:** Must-have for launch

#### Ticket ID: `MKT-02`
* **Feature Name:** PostGIS Proximity Match RPC (`find_nearby_makers`)
* **Task Description:** Write a PostgreSQL RPC function `find_nearby_makers(lat FLOAT, lng FLOAT, radius_meters INT)` utilizing PostGIS `ST_DWithin` and spatial indexing. Expose nearby projects to verified vendors and nearby makers to buyers based on geographical distance.
* **Acceptance Criteria:**
  - Query returns matching records sorted in ascending order of calculated distance in kilometers.
  - Execution uses spatial indices on `geo_location` without performing full table scans.
  - Returns empty list gracefully if no makers exist within the specified radius.
* **Dependencies:** `MKT-01`
* **Priority:** Must-have for launch

#### Ticket ID: `MKT-03`
* **Feature Name:** Verified Maker Bidding Module
* **Task Description:** Create the bidding UI and database schema for `project_bids`. Implement Supabase RLS policies ensuring that only users with `is_vendor = TRUE` and `vendor_verified = TRUE` can submit bids, and only the project owner and bidder can view submitted bid amounts.
* **Acceptance Criteria:**
  - Unverified users or standard buyers attempting to insert into `project_bids` receive HTTP 403 / RLS block.
  - Project creator can view all received bids; competing makers cannot see other bids on the same project.
  - Maker can specify bid amount and proposal text.
* **Dependencies:** `MKT-01`, `VERIF-04`
* **Priority:** Must-have for launch

---

### Epic 4: Ingress-Sanitized Direct Messaging & In-Chat Quotes

#### Ticket ID: `CHAT-01`
* **Feature Name:** Gateway WebSocket Messaging Service
* **Task Description:** Implement a Node.js or Go persistent WebSocket server on AWS ECS. Authenticate inbound connections via Supabase JWT bearer tokens, maintain in-memory channel rooms mapped to `conversation_id`, and persist message payloads to PostgreSQL.
* **Acceptance Criteria:**
  - Client connects and authenticates via `{"type": "AUTH", "token": "Bearer <JWT>"}` envelope.
  - Real-time message exchange delivers bi-directional events with sub-200ms latency.
  - Non-participants attempting to connect to a conversation room are disconnected with HTTP 401/403.
* **Dependencies:** `AUTH-01`, `AUTH-02`
* **Priority:** Must-have for launch

#### Ticket ID: `CHAT-02`
* **Feature Name:** Chat Ingress Sanitizer & OCR Interceptor
* **Task Description:** Create a middleware interceptor in the gateway microservice that runs regex checks on outgoing text frames and background OCR checks on image attachments. Detect and redact phone numbers, email addresses, external URLs, and UPI/payment IDs before committing the record to the database.
* **Acceptance Criteria:**
  - Outgoing message strings containing contact details (e.g., `+91-9876543210`, `maker@gmail.com`, `upi@oksbi`) are sanitized.
  - Message is persisted with `is_flagged = TRUE` and `flag_reason = 'CONTACT_INFO_INTERCEPTED'`.
  - Client receives a system alert banner: *"External contact details and off-platform payment info are hidden for safety."*
* **Dependencies:** `CHAT-01`
* **Priority:** Must-have for launch

#### Ticket ID: `CHAT-03`
* **Feature Name:** In-Chat Interactive Quote Card Widget
* **Task Description:** Build an embedded quote component inside the direct messaging thread. Verified makers can generate formal milestone quotes with itemized gross pricing, automatic Section 194-O TDS (1%) calculations, and net payout previews. The buyer sees an inline "Accept & Fund Escrow" CTA.
* **Acceptance Criteria:**
  - Only verified makers in the conversation thread can spawn a proposal quote.
  - Dynamic preview accurately calculates and displays Gross Amount, 1% TDS deduction, and Net Maker Earnings.
  - Clicking "Accept & Fund Escrow" opens the dual-rail checkout modal pre-filled with project and bid IDs.
* **Dependencies:** `CHAT-01`, `MKT-03`
* **Priority:** Must-have for launch

---

### Epic 5: Dual-Rail Escrow (Web2 Nodal & Web3 Contracts)

#### Ticket ID: `ESC-01`
* **Feature Name:** Web2 Castler / Escrowpay Nodal Orchestrator
* **Task Description:** Build backend endpoint `POST /api/escrow/web2/create-order` integrating with RBI-compliant nodal escrow APIs (Castler/Escrowpay). Compute platform commission, GST split (CGST/SGST/IGST), and Section 194-O TDS before generating a secure nodal deposit session.
* **Acceptance Criteria:**
  - Generates a valid nodal escrow order ID and returns a hosted payment gateway URL / UPI intent link.
  - Creates an `escrow_orders` record with `rail = 'WEB2_NODAL'` and `status = 'AWAITING_PAYMENT'`.
  - Handles payment webhook callbacks to transition order status to `HELD_IN_ESCROW`.
* **Dependencies:** `CHAT-03`
* **Priority:** Must-have for launch

#### Ticket ID: `ESC-02`
* **Feature Name:** Web3 Solidity Smart Contracts (`DeliveryEscrow.sol`, `EscrowFactory.sol`)
* **Task Description:** Write and test production Solidity (0.8.24) contracts for decentralized escrow on Polygon/Arbitrum. `EscrowFactory` deploys dedicated `DeliveryEscrow` instances holding ERC-20 (USDC) funds using OpenZeppelin `ReentrancyGuard`, locked until released by buyer signature or authorized oracle relayer.
* **Acceptance Criteria:**
  - `createEscrow()` deploys a clone holding buyer deposit in state `HELD_IN_ESCROW`.
  - Only the designated relayer address or buyer address can call `confirmDelivery()`.
  - Contract strictly prevents reentrancy attacks and double releases.
* **Dependencies:** `AUTH-03`
* **Priority:** Should-have

#### Ticket ID: `ESC-03`
* **Feature Name:** Web3 Wagmi Client Checkout Modal
* **Task Description:** Implement the frontend Web3 escrow checkout component using `wagmi` and `viem`. Allow crypto-linked buyers to approve USDC token transfer and invoke `EscrowFactory.createEscrow()`, saving transaction hash and contract address to Supabase upon confirmation.
* **Acceptance Criteria:**
  - Modal prompts ERC-20 token approval followed by contract creation call.
  - Monitors on-chain transaction receipt and transitions UI from pending to confirmed state.
  - Updates `escrow_orders` with `contract_address` and `rail = 'WEB3_CONTRACT'`.
* **Dependencies:** `ESC-02`
* **Priority:** Should-have

---

### Epic 6: Logistics Oracle & Automated Dispute Buffer

#### Ticket ID: `LOG-01`
* **Feature Name:** HMAC-SHA256 Signed Courier Webhook Ingestion
* **Task Description:** Build a webhook ingestion route in the gateway microservice for carrier delivery updates (Delhivery, Blue Dart, FedEx, DHL). Compute and verify the incoming request's HMAC-SHA256 signature against `COURIER_WEBHOOK_SECRET` before processing.
* **Acceptance Criteria:**
  - Payloads with missing or invalid HMAC signatures are rejected with HTTP 401 and logged to audit trails.
  - Valid `DELIVERED` status updates `escrow_orders` with `delivery_timestamp = NOW()` and `status = 'DELIVERED_PENDING_BUFFER'`.
  - Sets `auto_release_at = delivery_timestamp + 48 hours` and enqueues a delayed settlement job.
* **Dependencies:** `ESC-01`
* **Priority:** Must-have for launch

#### Ticket ID: `LOG-02`
* **Feature Name:** BullMQ 48-Hour Dispute Timer & Settlement Worker
* **Task Description:** Implement a BullMQ delayed job queue worker in Node.js backed by Redis. When an order enters `DELIVERED_PENDING_BUFFER`, schedule a job to fire after 48 hours to automatically trigger nodal fund release (Web2) or relayer smart contract release (Web3) if no disputes are filed.
* **Acceptance Criteria:**
  - BullMQ job persists across gateway service restarts.
  - Executes payout disbursement at exactly `auto_release_at` timestamp if `status == 'DELIVERED_PENDING_BUFFER'`.
  - Transitions order status to `RELEASED` and notifies maker via WebSocket broadcast.
* **Dependencies:** `LOG-01`
* **Priority:** Must-have for launch

#### Ticket ID: `LOG-03`
* **Feature Name:** Buyer Dispute Modal & Settlement Hold Trigger
* **Task Description:** Build a dispute submission interface accessible to buyers within the 48-hour buffer window at `app/(buyer)/orders/[id]/page.tsx`. Submitting a dispute transitions `escrow_orders.status` to `DISPUTED`, cancels the BullMQ auto-settlement timer, and alerts admin operators.
* **Acceptance Criteria:**
  - Dispute button is disabled once the 48-hour countdown reaches zero.
  - Submitting dispute requires text reason and evidence image upload.
  - Order state switches to `DISPUTED`, preventing all automated payouts until manual admin resolution.
* **Dependencies:** `LOG-02`
* **Priority:** Must-have for launch

---

### Ticket Dependency & Implementation Flow

```text
[AUTH-01] OAuth Auth Flow
   │
   ▼
[AUTH-02] Profiles & RLS ──────────────┐
   │                                   │
   ├───────────────┬───────────────────┤
   ▼               ▼                   ▼
[VERIF-01]     [MKT-01]            [AUTH-03]
Presigned S3   PostGIS Project     SIWE EIP-4361
   │               │                   │
   ▼               ▼                   ▼
[VERIF-02]     [MKT-02]            [ESC-02]
Reel Upload    Spatial RPC         Solidity Escrow
   │               │                   │
   ▼               ▼                   ▼
[VERIF-03]     [VERIF-04]          [ESC-03]
FFmpeg Celery  Gemini Vision       Wagmi Modal
   │               │
   └───────┬───────┘
           ▼
       [VERIF-05] HITL Admin Queue
           │
           ▼
       [MKT-03] Maker Bidding
           │
           ▼
       [CHAT-01] WebSocket Gateway
           │
           ▼
       [CHAT-02] Chat Ingress Sanitizer
           │
           ▼
       [CHAT-03] In-Chat Quote Card
           │
           ▼
       [ESC-01] Web2 Nodal Escrow API
           │
           ▼
       [LOG-01] HMAC Courier Webhooks
           │
           ▼
       [LOG-02] BullMQ 48h Timer & Settlement
           │
           ▼
       [LOG-03] Dispute Management Modal