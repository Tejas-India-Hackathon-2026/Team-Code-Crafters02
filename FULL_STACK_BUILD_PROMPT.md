# 🚀 FULL-STACK MASTER EXECUTION PROMPT: KARIGAR KART MARKETPLACE

You are an expert full-stack TypeScript, Next.js (App Router), Tailwind CSS, and Python engineer. Your task is to continue the development of the **Handmade Maker Marketplace** monorepo from where it was left off[cite: 10]. 

You must inspect the existing files in the workspace (`/docs`, `.antigravity_rules`, `schema.sql`, `apps/web`, `apps/gateway`, and `apps/ai-engine`) and make all required updates to ensure all features, designs, and tech stacks are fully operational[cite: 8, 10].

---

## 🎨 1. FRONTEND DESIGN SYSTEM & 30 DESIGN RULES COMPLIANCE

Strictly follow all design tokens and visual principles in the frontend UI (`apps/web`)[cite: 8, 12]:
1. **Core Color Palette Tokens (`globals.css` & Tailwind config):**
   - Canvas / Global Background: `#FDFBF7` (Natural Linen)[cite: 8]
   - Primary CTA / Brand Accent: `#C85A32` (Terracotta Clay, hover: `#B04B26`)[cite: 8]
   - Secondary / Trust Badge: `#2C4A3E` (Artisan Evergreen, hover: `#223B31`)[cite: 8]
   - Highlights & Meters: `#E08E45` (Warm Ochre)[cite: 8]
   - Card Surfaces: Pure White `#FFFFFF` with `#E8E2D9` border[cite: 8]
   - Text Hierarchy: `#1E1B18` for primary headings; `#6B635B` for muted labels[cite: 8]
   - Semantic Statuses: Success `#2E7D32` (Green), Warning `#ED6C02` (Amber), Error `#D32F2F` (Red)[cite: 8].
2. **Typography & Optical Balance:**
   - Fonts: `Plus Jakarta Sans` / `Outfit` for headings and `Inter` for body[cite: 8]. Monospace for ledgers/IDs (`JetBrains Mono`)[cite: 8].
   - Apply the **1-2-Rest hierarchy rule**, **7-word line limits** for readable body text, and **60-30-10 color split**[cite: 12].
   - Ensure strict micro-padding (`p-5`, `rounded-xl`) and subtle elevation shadows on cards (`shadow-[0_2px_8px_rgba(0,0,0,0.04)]`)[cite: 8, 12].

---

## 🔐 2. AUTHENTICATION SYSTEM (EMAIL & PASSWORD)

**Discard Google/Apple social OAuth.** Implement direct email and password authentication[cite: 7]:
1. **Login & Register UI (`apps/web/src/app/(auth)/login/page.tsx`):**
   - Replace OAuth buttons with a clean, tabbed / toggleable form: **"Sign In"** and **"Create Account"**.
   - Input fields:
     - Full Name (on Register)
     - Email Address
     - Password (with show/hide toggle)
     - Role Selector pill: **"Buyer / Shopper"** vs. **"Artisan Maker"** (`is_vendor = true`)[cite: 9].
   - Use `@supabase/ssr` / `supabase.auth.signInWithPassword` and `supabase.auth.signUp`.
2. **Profile Creation Hook / Callback:**
   - Upon registration, automatically insert or upsert the user's profile record into `public.profiles` (`id`, `full_name`, `is_vendor`, `vendor_verified = false`, `kyc_status = 'NONE'`)[cite: 7, 10].
   - Provide a persistent top navigation bar with User Avatar, Role Badge, and a Sign Out button.

---

## 🛠️ 3. CORE MODULE COMPLETION (RESUME & REFINE)

### Module A: Artisan Video Upload & AI Reel Pipeline (`apps/web` + `apps/ai-engine`)
- **Presigned Upload & Player:**
  - Build `app/(vendor)/verification/upload/page.tsx` with a 9:16 vertical drop zone[cite: 7, 8].
  - Support direct binary upload with progress feedback to AWS S3/Cloudflare R2, then call `/api/vendor/reels/verify` to queue processing[cite: 7, 8].
  - Video feed page rendering 9:16 reels with the top AI Confidence pill (Green if $\ge 85\%$, Amber if $< 85\%$) and bottom batch watermark[cite: 7, 8].
- **AI Engine (`apps/ai-engine`):**
  - Verify `app/main.py` and Celery tasks extract 3–5 keyframes using FFmpeg and run multimodal inspection with Gemini 2.5 Flash (`GEMINI_API_KEY`)[cite: 7, 10].
  - Update `verification_reels.status` and set `profiles.vendor_verified = true` when score $\ge 0.85$[cite: 7, 10].

### Module B: Geospatial Custom Projects & Bidding (`apps/web`)
- **Commission Creator (`app/(buyer)/projects/new/page.tsx`):**
  - Form with Title, Description, Budget Min/Max, Delivery Deadline, and Location Pin/Coordinates[cite: 7, 8].
  - Persist to `custom_projects` table[cite: 7, 10].
- **Maker Proximity & Bids (`app/(vendor)/dashboard/page.tsx`):**
  - Fetch open projects matching PostGIS proximity or active list[cite: 7, 8].
  - Bid submission modal allowing verified makers to submit proposals and bid amounts[cite: 7, 8].

### Module C: Ingress-Sanitized Direct Chat & In-Chat Quotes (`apps/web` + `apps/gateway`)
- **WebSocket Gateway (`apps/gateway/src/index.ts`):**
  - Connect to port 4000 with Upstash Redis Pub/Sub backend[cite: 7, 10].
  - Ingress sanitizer regex check: Detect phone numbers, email addresses, and UPI IDs[cite: 7, 9]. Flag message (`is_flagged = true`) and return safety notice[cite: 7, 9].
- **Interactive Quote Card Widget (`apps/web/src/components/chat/QuoteCard.tsx`):**
  - Verified makers can create an in-chat quote calculating: Gross Amount, Section 194-O TDS deduction (1%), and Net Maker Payout[cite: 7, 8].
  - Buyers see an inline **"Accept & Fund Escrow"** primary CTA button[cite: 7, 8].

### Module D: Dual-Rail Escrow & Logistics Dispute Buffer (`apps/web`)
- **Escrow Order Tracking (`app/(buyer)/orders/[id]/page.tsx`):**
  - State machine visualization: `AWAITING_PAYMENT` $\rightarrow$ `HELD_IN_ESCROW` $\rightarrow$ `DELIVERED_PENDING_BUFFER` $\rightarrow$ `RELEASED`[cite: 8, 10].
  - When status is `DELIVERED_PENDING_BUFFER`, render the active **48-Hour Dispute Countdown Window**[cite: 7, 8].
  - Provide a **"Raise Dispute"** button that opens a dispute modal (reason + image proof upload)[cite: 7, 8].

### Module E: Admin HITL Triage Dashboard (`app/(admin)/triage/page.tsx`)
- Review queue for reels with $< 85\%$ confidence and active order disputes[cite: 7, 8, 11].
- Provide "Approve" and "Reject" actions that update Supabase records[cite: 7, 8].

---

## 🔍 4. VERIFICATION & ACCEPTANCE
1. Execute TypeScript checks (`npx tsc --noEmit`) in `apps/web` and `apps/gateway` to ensure zero compilation errors[cite: 8, 10].
2. Confirm all environment variables are read from `.env` without hardcoded secrets[cite: 10].
3. Ensure all visual pages are styled cleanly according to the 30 Design Rules and linen/terracotta palette[cite: 8, 12].