# **Security & Access Document: Handmade Maker Marketplace** 

This document establishes the security boundaries, access rules, data isolation policies, and error handling behaviors across the web client, gateway, AI engine, and escrow rails. 

# **1. Authentication Method** 

User identity is verified through passwordless social OAuth 2.0 (Google and Apple) managed by Supabase Auth. 

- **Registration & Sign-In Flow:** Users authenticate via Google or Apple OAuth. The gateway creates an entry in auth.users and automatically initializes a corresponding record in public.profiles. 

- **Session Lifecycle:** 

   - The frontend receives a short-lived JSON Web Token (JWT valid for 1 hour) and a cryptographically secure refresh token stored in an HttpOnly, SameSite=Lax, Secure browser cookie. 

   - API requests to Next.js BFF routes and WebSocket connection upgrade headers validate the user's JWT bearer token against Supabase public signing keys. 

- **Web3 Identity Binding (Opt-In):** Verified makers or crypto-enabled buyers may link an EVMcompatible wallet address to their profile. Wallet linkage requires signing an EIP-4361 ("SignIn with Ethereum") nonce challenge issued by the gateway to prevent wallet spoofing. 

# **2. User Roles & Permissions Matrix** 

The platform implements Role-Based Access Control (RBAC) gated by verified flags (is_vendor, vendor_verified, kyc_status) and administrative scopes in the profiles table. 

|**Role**|**Target Identty**|**Permissions &**<br>**Capabilites**|**Explicit**<br>**Restrictons &**<br>**Blocks**|
|---|---|---|---|
|||• View public landing<br>pages|• Cannot post<br>custom project<br>requests|
|**Guest /**<br>**Anonymous**|Unauthentcated visitors browsing<br>the web|• View approved<br>verifcaton reels on<br>Cloudfare Stream|• Cannot submit<br>bids or open direct<br>chat channels|



|**Role**|**Target Identty**|**Permissions &**<br>**Capabilites**|**Explicit**<br>**Restrictons &**<br>**Blocks**|
|---|---|---|---|
|||• View public artsan<br>profles|• Cannot initalize<br>escrow orders|
|**Buyer**|Standard authentcated user<br>(is_vendor = FALSE)|• Create, edit, and<br>cancel own<br>custom_projects<br>• Accept bids and<br>fund Web2/Web3<br>escrows<br>• Chat with vendors<br>on actve project<br>threads<br>• Raise order<br>disputes within the<br>48-hour bufer<br>window|• Cannot submit<br>project bids<br>• Cannot upload<br>maker verifcaton<br>reels<br>• Cannot access<br>admin triage or<br>override dispute<br>holds|
|||• Upload 30–60s<br>maker process reels<br>via presigned URLs|• Cannot bid on<br>custom projects|
|**Unverifed**<br>**Vendor**|User applied as maker (is_vendor =<br>TRUE, vendor_verifed = FALSE)|• Submit KYC identty<br>documentaton|• Cannot issue<br>direct chat quote<br>cards|



|**Role**|**Target Identty**|**Permissions &**<br>**Capabilites**|**Explicit**<br>**Restrictons &**<br>**Blocks**|
|---|---|---|---|
|||• Edit artsan public<br>storefront draf|• Storefront<br>hidden from public<br>search indices|
|||• Submit bids<br>(project_bids) on<br>custom projects|• Cannot approve<br>own verifcaton<br>reels|
|**Verifed**<br>**Vendor**|AI or Admin approved maker<br>(vendor_verifed = TRUE,<br>kyc_status = 'PASSED')|• Chat with buyers<br>and issue actonable<br>quote cards<br>• Receive Web2 fat<br>bank setlements or<br>Web3 token payouts|• Cannot resolve<br>disputes or release<br>own escrow funds<br>prematurely|
|||• Review and<br>override AI<br>verifcaton triage<br>queues (< 85%<br>confdence)|• Cannot modify<br>backend audit trail<br>logs|
|**Admin /**<br>**Moderator**|Internal operatons team with<br>admin JWT claim|• Manually resolve<br>delivery disputes and<br>authorize refunds or<br>releases|• Cannot extract<br>raw private keys or<br>plain API<br>credentals|



|**Role**|**Target Identty**|**Permissions &**<br>**Capabilites**|**Explicit**<br>**Restrictons &**<br>**Blocks**|
|---|---|---|---|
|||• Audit fagged chat<br>messages (of-<br>platorm contact<br>atempts)||
|||• Celery AI worker<br>updates reel<br>confdence scores &<br>approval statuses||
|**System**<br>**Service**<br>**Worker**|Microservice running with<br>SUPABASE_SERVICE_ROLE_KEY|• Webhook relayer<br>verifes carrier HMAC<br>signatures & triggers<br>escrow tmers|• Cannot initate<br>buyer refund<br>requests outside<br>signed<br>carrier/admin<br>triggers|
|||• BullMQ worker<br>setles payouts on<br>tmer expiraton||



# **3. Database Row-Level Security (RLS) Rules** 

PostgreSQL Row-Level Security must be enabled (ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;) across all application tables in Supabase. 

# SQL 

-- 1. PROFILES: Public read for storefronts; update restricted to profile owner 

CREATE POLICY "Public profiles are viewable by everyone" 

ON public.profiles FOR SELECT 

USING (true); 

CREATE POLICY "Users can update own profile only" 

ON public.profiles FOR UPDATE 

USING (auth.uid() = id); 

-- 2. VERIFICATION REELS: Public can view approved reels; makers view/create own 

CREATE POLICY "Approved reels are viewable by everyone" 

ON public.verification_reels FOR SELECT 

USING (status = 'AUTO_APPROVED'); 

CREATE POLICY "Vendors can view own uploaded reels" 

ON public.verification_reels FOR SELECT 

USING (auth.uid() = vendor_id); 

CREATE POLICY "Makers can upload own reels" 

ON public.verification_reels FOR INSERT 

WITH CHECK (auth.uid() = vendor_id); 

-- 3. CUSTOM PROJECTS: Public can view open projects; buyers manage own 

CREATE POLICY "Open projects are viewable by everyone" 

ON public.custom_projects FOR SELECT 

USING (status = 'OPEN' OR auth.uid() = buyer_id); 

CREATE POLICY "Buyers can create own project" 

ON public.custom_projects FOR INSERT 

WITH CHECK (auth.uid() = buyer_id); 

CREATE POLICY "Buyers can update own project" 

ON public.custom_projects FOR UPDATE 

USING (auth.uid() = buyer_id); 

-- 4. PROJECT BIDS: Only project owner & bidding maker can view; verified vendors can bid 

CREATE POLICY "Bids visible to project buyer and bidder" 

ON public.project_bids FOR SELECT 

USING ( 

auth.uid() = vendor_id OR 

auth.uid() IN (SELECT buyer_id FROM public.custom_projects WHERE id = project_id) 

); 

CREATE POLICY "Only verified vendors can place bids" 

ON public.project_bids FOR INSERT 

WITH CHECK ( 

auth.uid() = vendor_id AND 

EXISTS ( 

SELECT 1 FROM public.profiles 

WHERE id = auth.uid() AND is_vendor = true AND vendor_verified = true ) 

); 

-- 5. CONVERSATIONS & MESSAGES: Restricted strictly to thread participants 

CREATE POLICY "Participants can view conversations" 

ON public.conversations FOR SELECT 

USING (auth.uid() = buyer_id OR auth.uid() = vendor_id); 

CREATE POLICY "Participants can view messages" 

ON public.messages FOR SELECT 

USING ( 

EXISTS ( 

SELECT 1 FROM public.conversations 

WHERE id = conversation_id AND (buyer_id = auth.uid() OR vendor_id = auth.uid()) 

) 

); 

CREATE POLICY "Participants can insert messages" 

ON public.messages FOR INSERT 

WITH CHECK ( 

auth.uid() = sender_id AND 

EXISTS ( 

SELECT 1 FROM public.conversations 

WHERE id = conversation_id AND (buyer_id = auth.uid() OR vendor_id = auth.uid()) 

) 

); 

-- 6. ESCROW ORDERS: Restricted to involved buyer, vendor, or service role 

CREATE POLICY "Parties can view their escrow orders" 

ON public.escrow_orders FOR SELECT 

USING (auth.uid() = buyer_id OR auth.uid() = vendor_id); 

# **4. Error Handling & Failure Matrix** 

|**Failure Point**|**Trigger**<br>**Conditon**|**System Behavior & Technical**<br>**Acton**|**User-Facing Message**|
|---|---|---|---|
|**Invalid Auth**<br>**Token**|Expired or<br>malformed JWT<br>in API/WS header|Deny request; return HTTP 401<br>Unauthorized. Frontend triggers<br>session refresh; redirects to login|_"Your session has_<br>_expired. Please sign in_<br>_again to contnue."_|



|**Failure Point**|**Trigger**<br>**Conditon**|**System Behavior & Technical**<br>**Acton**|**User-Facing Message**|
|---|---|---|---|
|||if expired.||
|**Unverifed**<br>**Vendor Acton**|Unverifed user<br>atempts to bid<br>on project|Block database insert via RLS<br>policy; return HTTP 403<br>Forbidden.|_"You must complete_<br>_verifcaton and pass_<br>_artsan onboarding_<br>_before placing bids."_|
|**Chat Contact**<br>**Leak**<br>**Intercepton**|Regex/OCR<br>detects phone,<br>email, or UPI<br>handle in<br>message|Gateway sanitzes payload, fags<br>message (is_fagged = TRUE),<br>drops sensitve tokens before DB<br>write.|_"External contact_<br>_details and of-_<br>_platorm payment_<br>_info are hidden for_<br>_safety."_|
|**Web2 Escrow**<br>**Payment**<br>**Failure**|Bank or card<br>decline via<br>Castler /<br>Escrowpay|Gateway marks order<br>AWAITING_PAYMENT, unlocks<br>project status, triggers payment<br>retry webhook.|_"Payment could not_<br>_be completed. Your_<br>_funds have not been_<br>_debited. Please try_<br>_again."_|
|**Web3**<br>**Transacton**<br>**Revert**|Out-of-gas,<br>rejected<br>signature, or<br>slippage error|Discard pending transacton<br>hash, keep project state in<br>checkout stage.|_"Blockchain_<br>_transacton failed or_<br>_was rejected in your_<br>_wallet. Please check_<br>_gas fees and retry."_|
|**AI Reel**<br>**Processing**<br>**Timeout**|Video keyframe<br>extracton or<br>Gemini API<br>failure|Celery moves task to retry queue<br>(max 3 atempts); routes to<br>NEEDS_REVIEW if unrecovered.|_"Your video is taking a_<br>_bit longer to process._<br>_Our moderaton team_<br>_is completng the_<br>_review."_|
|**Courier**<br>**Webhook**<br>**Signature**<br>**Mismatch**|Webhook<br>received without<br>valid HMAC-<br>SHA256<br>signature|Reject webhook payload<br>immediately with HTTP 401<br>Unauthorized; write security<br>alert to audit logs.|_(No user response —_<br>_automated courier_<br>_integraton endpoint)._|



|**Failure Point**|**Trigger**<br>**Conditon**|**System Behavior & Technical**<br>**Acton**|**User-Facing Message**|
|---|---|---|---|
|**Dispute**<br>**Window**<br>**Expiraton**|48 hours pass<br>post-delivery<br>without dispute<br>log|BullMQ executes setlement job,<br>releasing nodal fat or contract<br>escrow to vendor.|_"Order fnalized._<br>_Payout has been_<br>_released to the_<br>_maker."_|



# **5. Launch Edge Cases Checklist** 

- **Network Latency & Slow Connections:** The Next.js client renders optimistic UI updates for chat messages and displays skeleton loaders on PostGIS geospatial maps while coordinates resolve. 

- **Replay Attacks on Courier Webhooks:** The gateway checks the tracking_id and delivery timestamp to guarantee carrier delivery webhooks are processed exactly once. 

- **Large File Upload Exhaustion:** Presigned upload policies strictly constrain S3/R2 direct uploads to video/mp4 and video/quicktime formats under 100 MB with a 60-second presigned URL expiration. 

- **Concurrent Project Acceptance:** PostgreSQL database transactions enforce atomic state locking (SELECT ... FOR UPDATE) so a buyer cannot accept two bids simultaneously on a single project. 

- **Double Spend in Web3 Escrow:** Smart contracts use OpenZeppelin ReentrancyGuard and state locking (HELD_IN_ESCROW _→_ RELEASED) to prevent double payout exploits. 

- **Off-Platform Circumvention via Images:** Images uploaded to direct messaging are sent to an asynchronous background worker that runs OCR text extraction to sanitize hidden phone numbers or QR codes. 

