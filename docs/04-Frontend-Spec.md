# Frontend Specification Document: Handmade Maker Marketplace

**Document Version:** 1.0.0  
**Target Architecture:** Next.js 14/15 (App Router, React Server Components), TypeScript, Tailwind CSS, shadcn/ui  
**Platform Scope:** Responsive Web (Desktop, Tablet, Mobile-first Web)

---

## 1. Executive Design System & Brand Identity

The **Handmade Maker Marketplace** visual language bridges the tactile, organic warmth of artisanal craftsmanship with the crisp, modern trust architecture of institutional escrow and AI verification. The interface utilizes warm terracotta, earthy neutrals, and deep slate anchors to establish authenticity, contrasted with high-clarity status cues for transactional security.

---

## 2. Color Palette & Design Tokens

### 2.1 Core Palette (Hex Codes & CSS Variables)

```css
:root {
  /* Brand & Accents */
  --primary: #C85A32;              /* Terracotta Clay (Primary CTA & Brand Anchor) */
  --primary-hover: #B04B26;        /* Deep Terracotta */
  --primary-foreground: #FFFFFF;   /* Crisp Contrast on Primary */
  
  --secondary: #2C4A3E;            /* Artisan Evergreen / Pine (Trust & Craft Badge) */
  --secondary-hover: #223B31;      /* Deep Forest */
  --secondary-foreground: #FFFFFF; /* Crisp Contrast on Secondary */
  
  --accent: #E08E45;               /* Warm Ochre / Amber (Highlights & Verifications) */
  --accent-muted: #F7EAD9;         /* Soft Ochre Tint (Badges & Inset Highlights) */

  /* Neutral Surface & Backgrounds */
  --background: #FDFBF7;           /* Natural Linen / Off-White Canvas */
  --card: #FFFFFF;                 /* Pure Card Surface */
  --card-foreground: #1E1B18;      /* Deep Charcoal (Primary Typography) */
  
  --popover: #FFFFFF;              /* Dropdown & Modal Canvas */
  --popover-foreground: #1E1B18;
  
  --muted: #F3EFEA;                /* Warm Neutral Wash (Table stripes, secondary buttons) */
  --muted-foreground: #6B635B;     /* Subtitle & Secondary Label Slate */

  /* Structural & Borders */
  --border: #E8E2D9;               /* Subtle Earth Border */
  --input: #E8E2D9;                /* Input Field Outlines */
  --ring: #C85A32;                 /* Focus Ring Glow (Terracotta) */

  /* Semantic Feedback Rails */
  --success: #2E7D32;              /* Verified / Released Payout Green */
  --success-bg: #EDF7ED;           /* Success Soft Surface */
  
  --warning: #ED6C02;              /* 48h Buffer / Review State Amber */
  --warning-bg: #FFF4E5;           /* Warning Soft Surface */
  
  --error: #D32F2F;                /* Chat Violation / Payment Decline Red */
  --error-bg: #FDEDED;             /* Error Soft Surface */

  --info: #0288D1;                 /* Web3 Oracle / Webhook Notice Blue */
  --info-bg: #E1F5FE;              /* Info Soft Surface */
}
```

### 2.2 Palette Application Matrix

| Token Name | Hex Code | Role in Application |
| :--- | :--- | :--- |
| `primary` | `#C85A32` | Primary buttons ("Fund Escrow", "Submit Bid"), active tab highlights, link accents. |
| `secondary` | `#2C4A3E` | "AI Verified Maker" badges, artisan bio pills, trust shield indicators. |
| `accent` | `#E08E45` | Reel confidence meters, star ratings, interactive map markers. |
| `background` | `#FDFBF7` | Global canvas background preventing high-contrast eye fatigue. |
| `card` | `#FFFFFF` | Project listing cards, conversation message blocks, bid cards. |
| `border` | `#E8E2D9` | Card dividers, input borders, data table cell demarcations. |
| `success` | `#2E7D32` | "Escrow Funded", "KYC Passed", "Auto-Approved (>85%)" statuses. |
| `warning` | `#ED6C02` | "48-Hour Dispute Window Active", "Needs Review (<85%)" badges. |
| `error` | `#D32F2F` | "Contact Info Intercepted", "Payment Failed", "Escrow Disputed" tags. |

---

## 3. Typography Hierarchy

### 3.1 Font Stack
* **Display & Headings:** `Plus Jakarta Sans` / `Outfit` (Geometric, warm, modern sans-serif).
* **Body & UI Elements:** `Inter` / `system-ui` (High legibility at dense micro-copy scales).
* **Code & Monetary Values:** `JetBrains Mono` / `ui-monospace` (Fixed-width for escrow ledgers, wallet hashes, transaction IDs).

### 3.2 Type Scale

| Element / Class | Font Family | Size (Desktop / Mobile) | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero H1** | Display | `36px (2.25rem)` / `28px (1.75rem)` | Bold (700) | `1.2` | `-0.02em` |
| **Section H2** | Display | `28px (1.75rem)` / `22px (1.375rem)` | SemiBold (600) | `1.25` | `-0.015em` |
| **Card Title H3** | Display | `20px (1.25rem)` / `18px (1.125rem)` | SemiBold (600) | `1.3` | `-0.01em` |
| **Subsection H4** | Inter | `16px (1.0rem)` / `15px (0.9375rem)` | Medium (500) | `1.4` | `0` |
| **Body (Default)** | Inter | `15px (0.9375rem)` / `14px (0.875rem)` | Regular (400) | `1.5` | `0` |
| **Body Small** | Inter | `13px (0.8125rem)` / `12px (0.75rem)` | Regular (400) | `1.4` | `+0.01em` |
| **Badge / Caption** | Inter | `11px (0.6875rem)` / `11px (0.6875rem)` | SemiBold (600) | `1.2` | `+0.04em` (Uppercase) |
| **Monospace Values**| Mono | `13px (0.8125rem)` / `12px (0.75rem)` | Medium (500) | `1.4` | `0` |

---

## 4. Component Design Specifications (shadcn/ui & Tailwind)

### 4.1 Buttons (`<Button />`)

* **Primary Button:** `bg-[#C85A32] text-white hover:bg-[#B04B26] shadow-sm rounded-lg px-4 py-2.5 font-medium transition-all active:scale-[0.98]`
* **Secondary / Verified Action:** `bg-[#2C4A3E] text-white hover:bg-[#223B31] shadow-sm rounded-lg px-4 py-2.5 font-medium`
* **Outline / Secondary Neutral:** `border border-[#E8E2D9] bg-white text-[#1E1B18] hover:bg-[#F3EFEA] rounded-lg px-4 py-2.5`
* **Destructive / Dispute:** `bg-[#FDEDED] text-[#D32F2F] hover:bg-[#FADBD8] border border-[#F5C2C7] rounded-lg px-4 py-2.5 font-medium`
* **Loading State:** Spinner icon replaces leading icon; button disables with `opacity-70 cursor-not-allowed`.

### 4.2 Form Inputs & Controls (`<Input />`, `<Textarea />`, `<Select />`)

* **Standard Text Input:** 
  * Height: `42px` (`h-10.5`), Padding: `px-3.5 py-2`.
  * Style: `border-[#E8E2D9] bg-white rounded-lg text-[#1E1B18] placeholder:text-[#6B635B] focus:border-[#C85A32] focus:ring-2 focus:ring-[#C85A32]/20 outline-none transition-all`
* **Error State:**
  * Style: `border-[#D32F2F] text-[#D32F2F] focus:border-[#D32F2F] focus:ring-[#D32F2F]/20`
  * Error Caption: `text-[12px] text-[#D32F2F] mt-1 flex items-center gap-1`

### 4.3 Marketplace & Project Cards (`<Card />`)

* **Standard Card:**
  * Background: `#FFFFFF`, Border: `1px solid #E8E2D9`, Corner Radius: `12px` (`rounded-xl`).
  * Elevation / Shadow: `shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] hover:border-[#C85A32]/40 transition-all`
  * Layout: `p-5 flex flex-col gap-3`

### 4.4 Custom Platform Widgets

#### A. In-Chat Interactive Quote Card
* Embedded card inside direct messaging thread allowing instant escrow locking.
* **Styling:** Inset container `bg-[#FDFBF7] border-2 border-[#C85A32]/30 rounded-xl p-4 my-2`
* **Elements:**
  1. Header: *"Maker Quote Proposal"* + Milestone Title.
  2. Pricing Ledger: Gross Amount (INR/USDC), Section 194-O TDS deduction preview, Net Payout breakdown.
  3. Action CTA: Full-width `"Accept & Fund Escrow"` button.

#### B. Verification Reel Video Player Card
* **Aspect Ratio:** `9:16` vertical video container with Cloudflare Stream player integration.
* **Overlay Layer:** Top pill displaying `Confidence: 94.2% • Logo Detected` (Green badge if $\ge 85\%$, Amber if $< 85\%$).
* **Artisan Watermark:** Subtitle pill at bottom showing maker serial batch number (`e.g., #04/50`).

#### C. Geospatial PostGIS Map Pin & Floating Sheet
* **Map Engine:** Mapbox GL / Leaflet rendered with warm custom tile layer.
* **Maker Marker:** Custom SVG terracotta pin pulsing with radius circle (`ST_DWithin` perimeter visualization).
* **Bottom Sheet:** Mobile slide-over card (`rounded-t-2xl p-4 bg-white shadow-2xl`) showing maker distance, rating, and open commission slots.

---

## 5. Spacing, Grid & Layout System

### 5.1 Breakpoint Standards

| Breakpoint | Minimum Width | Target Devices | Grid Columns | Container Margin |
| :--- | :--- | :--- | :--- | :--- |
| **sm** | `640px` | Large Phones | 4 Columns | `16px` (`px-4`) |
| **md** | `768px` | Tablets | 8 Columns | `24px` (`px-6`) |
| **lg** | `1024px` | Small Laptops | 12 Columns | `32px` (`px-8`) |
| **xl** | `1280px` | Desktops | 12 Columns | `max-w-7xl mx-auto` |
| **2xl** | `1536px` | Ultra-wide Screens | 12 Columns | `max-w-7xl mx-auto` |

### 5.2 Elevation & Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 1000;
--z-sticky-nav: 1100;
--z-modal-backdrop: 1200;
--z-modal-content: 1250;
--z-toast-notification: 1400;
--z-watermark-overlay: 50;
```

---

## 6. Full API & Third-Party Integration Specification

### 6.1 Supabase (Auth, PostgreSQL 16 + PostGIS, Storage)

* **Purpose:** User authentication (Google/Apple OAuth), relational profile data, PostGIS spatial queries, and Row-Level Security enforcement.
* **Client Integration:** `@supabase/supabase-js` and `@supabase/ssr` client in Next.js App Router.

#### Key API Calls:
1. **OAuth Sign In:**
   - Method: `supabase.auth.signInWithOAuth({ provider: 'google' | 'apple', options: { redirectTo: '/auth/callback' } })`
   - Response: Redirect to provider consent screen -> Session token stored in Secure HttpOnly Cookie.
2. **Geospatial Maker Query (`custom_projects` vicinity):**
   - RPC Call: `supabase.rpc('find_nearby_makers', { lat: 25.5941, lng: 85.1376, radius_meters: 50000 })`
   - Output: `Array<{ id: UUID, full_name: string, distance_km: number, vendor_verified: boolean }>`
3. **Escrow Orders & Project Status Fetch:**
   - Query: `supabase.from('escrow_orders').select('*, project:custom_projects(*)').eq('buyer_id', user.id)`
   - Output: Typed `EscrowOrder` records filtered by RLS policies.

---

### 6.2 Gateway Microservice & WebSockets (Node.js/Go on AWS ECS)

* **Purpose:** Real-time bi-directional direct messaging, chat ingress sanitization, live typing indicators, and courier delivery status broadcasts.
* **Client Integration:** Native WebSocket hook `useWebSockets({ url: process.env.NEXT_PUBLIC_GATEWAY_WS_URL })`.

#### Key Message Envelopes:
1. **Connect & Authenticate:**
   - Outgoing Frame: `{"type": "AUTH", "token": "Bearer <SUPABASE_JWT>"}`
   - Incoming Frame: `{"type": "AUTH_SUCCESS", "userId": "UUID"}`
2. **Send Direct Message (with Ingress Sanitizer Check):**
   - Outgoing Frame: `{"type": "SEND_MESSAGE", "conversationId": "UUID", "content": "Can you craft this in teak wood?"}`
   - Sanitization Interception: Gateway scans for phone numbers/email/UPI. If detected, incoming frame yields:
     `{"type": "MESSAGE_FLAGGED", "error": "Contact details hidden for platform safety"}`
3. **Escrow State Update Broadcast:**
   - Incoming Frame: `{"type": "ESCROW_STATE_CHANGED", "orderId": "ORD-8921", "status": "DELIVERED_PENDING_BUFFER", "autoReleaseAt": "2026-08-20T14:30:00Z"}`

---

### 6.3 Media Uploads & Cloudflare Stream / AWS S3 Direct Ingestion

* **Purpose:** Direct-from-browser vertical video uploads bypassing server limits, delivering adaptive bitrate streaming for verified reels.

#### Workflow & Endpoints:
1. **Request Presigned Upload URL:**
   - Route: `POST /api/vendor/reels/presign`
   - Request Body: `{"fileName": "reel_process_01.mp4", "fileType": "video/mp4", "fileSizeBytes": 45100200}`
   - Response Expected: `{"uploadUrl": "https://s3.amazonaws.com/bucket/...", "streamMediaId": "cf_media_908123", "reelId": "UUID"}`
2. **Client Direct Binary Upload:**
   - Method: `PUT <uploadUrl>` (Headers: `Content-Type: video/mp4`)
   - Response: `200 OK` (S3/R2 direct upload completed)
3. **Trigger AI Verification Worker:**
   - Route: `POST /api/vendor/reels/verify`
   - Request Body: `{"reelId": "UUID"}`
   - Response: `{"status": "QUEUED", "jobId": "celery_task_102"}`

---

### 6.4 Web2 Nodal Escrow Rail (Castler / Escrowpay Nodal API)

* **Purpose:** RBI-compliant domestic INR escrow deposits, Section 194-O TDS (1%) deduction, automated GST split, and milestone disbursement.

#### Client & BFF Endpoints:
1. **Initialize Fiat Escrow Order:**
   - Route: `POST /api/escrow/web2/create-order`
   - Payload: `{"projectId": "UUID", "bidId": "UUID", "amountPaise": 1500000}`
   - Response: `{"orderId": "ORD-1092", "nodalPaymentUrl": "https://gateway.castler.com/pay/...", "tdsWithheld": 15000}`
2. **Client Payment Modal:**
   - Pops Castler iframe / UPI redirect drawer.
3. **Dispute Order Trigger (Buyer Action):**
   - Route: `POST /api/escrow/orders/:id/dispute`
   - Payload: `{"reason": "Item arrived damaged", "evidenceUrls": ["https://s3.../img1.jpg"]}`
   - Response: `{"orderId": "ORD-1092", "status": "DISPUTED", "disputeLoggedAt": "ISO_DATE"}`

---

### 6.5 Web3 Escrow Rail (Polygon / Arbitrum EVM Smart Contracts)

* **Purpose:** Opt-in decentralized multi-signature escrow holding USDC/ETH with automated oracle release.
* **Client Integration:** `wagmi`, `viem`, and `@rainbow-me/rainbowkit`.

#### Contract Methods:
1. **Wallet Verification & Nonce Binding (EIP-4361):**
   - Method: `signMessage({ message: "Sign in with Ethereum to Handmade Marketplace: Nonce 908123" })`
2. **Deploy/Fund Escrow Instance (`DeliveryEscrow.sol`):**
   - Method: `writeContract({ address: EscrowFactoryAddress, abi: EscrowFactoryABI, functionName: 'createEscrow', args: [vendorWallet, buyerWallet, depositAmount] })`
   - Event Monitored: `EscrowCreated(address escrowContract, uint256 amount)`
3. **Automated Oracle Fund Release:**
   - Relayer node sends signed delivery receipt to `confirmDelivery()` on-chain once 48-hour buffer concludes without disputes.

---

## 7. Frontend State Management & File Architecture

```text
apps/web/src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx               # OAuth Provider Buttons & SIWE Modal
│   ├── (buyer)/
│   │   ├── projects/new/page.tsx        # PostGIS Coordinate & Commission Creator
│   │   ├── orders/[id]/page.tsx         # Escrow Tracking & Dispute Buffer Countdown
│   │   └── messages/page.tsx            # Ingress-Sanitized WebSocket Chat
│   ├── (vendor)/
│   │   ├── dashboard/page.tsx           # Bidding Workspace & Earnings Ledger
│   │   └── verification/upload/page.tsx # Presigned S3 Video Upload & AI Meter
│   └── (admin)/
│       └── triage/page.tsx              # HITL Review (<85% confidence queue)
├── components/
│   ├── ui/                              # shadcn/ui base primitives (Button, Modal, Input)
│   ├── chat/                            # WebSocket Feed, Quote Card, Sanitize Alert
│   ├── media/                           # Cloudflare Stream Video Player, Confidence Pill
│   ├── map/                             # PostGIS Mapbox Canvas & Artisan Pin Layers
│   └── escrow/                          # Dual-Rail Payment Sheet (Web2 Nodal vs Web3)
├── hooks/
│   ├── useWebSockets.ts                 # Persistent gateway socket manager
│   ├── useGeoLocation.ts                # Browser geolocation & PostGIS converter
│   └── useEscrowContract.ts             # Wagmi EVM contract interactions
└── lib/
    ├── supabaseClient.ts                # Typed Supabase client (RSC + Browser)
    └── formatters.ts                    # Currency, GST/TDS split, date countdowns
```

---

## 8. Summary Checklist for Frontend Developers

- [x] All brand colors configured via CSS variables and Tailwind theme extension.
- [x] Typography styles matched to `Plus Jakarta Sans` (headings) and `Inter` (body).
- [x] Dynamic in-chat quote cards styled with direct escrow funding integration.
- [x] Cloudflare Stream 9:16 vertical player with dynamic AI verification confidence badges.
- [x] Dual-rail escrow checkout interface supporting Castler Web2 Nodal and Web3 Wagmi modal.
- [x] Ingress chat interceptor banner configured for real-time regex/OCR sanitization alerts.
- [x] 48-hour post-delivery countdown widget with active dispute action triggers.