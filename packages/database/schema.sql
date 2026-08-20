-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create KYC status ENUM
DO $$ BEGIN
    CREATE TYPE kyc_status_enum AS ENUM ('NONE', 'PENDING', 'PASSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  is_vendor BOOLEAN DEFAULT FALSE,
  vendor_verified BOOLEAN DEFAULT FALSE,
  kyc_status kyc_status_enum DEFAULT 'NONE',
  geo_location GEOGRAPHY(Point, 4326),
  wallet_address VARCHAR(42),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Spatial Index for PostGIS queries
CREATE INDEX IF NOT EXISTS profiles_geo_location_idx 
ON public.profiles USING GIST (geo_location);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Apply RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile only" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 7. Trigger to automatically provision profiles on OAuth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    avatar_url, 
    is_vendor, 
    vendor_verified, 
    kyc_status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Artisan User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    FALSE,
    FALSE,
    'NONE'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



-- 1. Create Reel Status ENUM
DO $$ BEGIN
    CREATE TYPE reel_status_enum AS ENUM ('PENDING', 'AUTO_APPROVED', 'REJECTED', 'NEEDS_REVIEW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Verification Reels Table
CREATE TABLE IF NOT EXISTS public.verification_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  stream_media_id TEXT,
  status reel_status_enum DEFAULT 'PENDING',
  confidence_score NUMERIC(5,4),
  extracted_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.verification_reels ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Reels
CREATE POLICY "Approved reels are viewable by everyone" ON public.verification_reels FOR SELECT USING (status = 'AUTO_APPROVED');
CREATE POLICY "Vendors can view own uploaded reels" ON public.verification_reels FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "Makers can upload own reels" ON public.verification_reels FOR INSERT WITH CHECK (auth.uid() = vendor_id);


-- 1. Create Enums for Projects and Bids
DO $$ BEGIN
    CREATE TYPE project_status_enum AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bid_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Custom Projects Table (MKT-01)
CREATE TABLE IF NOT EXISTS public.custom_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  budget_min NUMERIC(12,2) NOT NULL,
  budget_max NUMERIC(12,2) NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  delivery_location GEOGRAPHY(Point, 4326),
  status project_status_enum DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS custom_projects_location_idx ON public.custom_projects USING GIST (delivery_location);

-- 3. Create Project Bids Table (MKT-03)
CREATE TABLE IF NOT EXISTS public.project_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.custom_projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bid_amount NUMERIC(12,2) NOT NULL,
  proposal_text TEXT NOT NULL,
  status bid_status_enum DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.custom_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_bids ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Custom Projects
CREATE POLICY "Open projects are viewable by everyone" ON public.custom_projects 
  FOR SELECT USING (status = 'OPEN' OR auth.uid() = buyer_id);

CREATE POLICY "Buyers can create own project" ON public.custom_projects 
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update own project" ON public.custom_projects 
  FOR UPDATE USING (auth.uid() = buyer_id);

-- 6. RLS Policies for Project Bids (Privacy & Gating)
CREATE POLICY "Bids visible to project buyer and bidder" ON public.project_bids 
  FOR SELECT USING (
    auth.uid() = vendor_id OR 
    auth.uid() IN (SELECT buyer_id FROM public.custom_projects WHERE id = project_id)
  );

CREATE POLICY "Only verified vendors can place bids" ON public.project_bids 
  FOR INSERT WITH CHECK (
    auth.uid() = vendor_id AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_vendor = true AND vendor_verified = true
    )
  );

-- 7. PostGIS Spatial RPC Function: find_nearby_makers (MKT-02)
CREATE OR REPLACE FUNCTION public.find_nearby_makers(
  lat FLOAT, 
  lng FLOAT, 
  radius_meters INT DEFAULT 50000
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  distance_km FLOAT,
  vendor_verified BOOLEAN
) LANGUAGE plpgsql 
SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    ROUND((ST_Distance(p.geo_location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) / 1000)::numeric, 2)::FLOAT AS distance_km,
    p.vendor_verified
  FROM public.profiles p
  WHERE p.is_vendor = TRUE
    AND p.geo_location IS NOT NULL
    AND ST_DWithin(p.geo_location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
  ORDER BY distance_km ASC;
END;
$$;

-- 1. Create Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.custom_projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_buyer_vendor_project UNIQUE (buyer_id, vendor_id, project_id)
);

-- 2. Create Messages Table with Sanitization & Flagging Fields
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Conversations (Participants only)
CREATE POLICY "Participants can view conversations" ON public.conversations 
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = vendor_id);

CREATE POLICY "Participants can create conversations" ON public.conversations 
  FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = vendor_id);

-- 5. RLS Policies for Messages (Participants only)
CREATE POLICY "Participants can view messages" ON public.messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id AND (buyer_id = auth.uid() OR vendor_id = auth.uid())
    )
  );

CREATE POLICY "Participants can insert messages" ON public.messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND 
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id AND (buyer_id = auth.uid() OR vendor_id = auth.uid())
    )
  );
  -- 1. Create Enums for Escrow Rail and Order Status
DO $$ BEGIN
    CREATE TYPE escrow_rail_enum AS ENUM ('WEB2_NODAL', 'WEB3_CONTRACT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE escrow_status_enum AS ENUM (
      'AWAITING_PAYMENT', 
      'HELD_IN_ESCROW', 
      'DISPATCHED', 
      'DELIVERED_PENDING_BUFFER', 
      'DISPUTED', 
      'RELEASED', 
      'REFUNDED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Escrow Orders Table
CREATE TABLE IF NOT EXISTS public.escrow_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.custom_projects(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rail escrow_rail_enum DEFAULT 'WEB2_NODAL',
  gross_amount NUMERIC(12,2) NOT NULL,
  withheld_tds NUMERIC(12,2) NOT NULL,
  gst_split JSONB DEFAULT '{"cgst": 0, "sgst": 0, "igst": 0}'::jsonb,
  net_payout NUMERIC(12,2) NOT NULL,
  status escrow_status_enum DEFAULT 'AWAITING_PAYMENT',
  contract_address VARCHAR(42),
  nodal_ref_id VARCHAR(100),
  tracking_id VARCHAR(100),
  carrier_code VARCHAR(50),
  delivery_timestamp TIMESTAMPTZ,
  auto_release_at TIMESTAMPTZ,
  dispute_reason TEXT,
  dispute_evidence_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE public.escrow_orders ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Escrow Orders
CREATE POLICY "Parties can view their escrow orders" ON public.escrow_orders 
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = vendor_id);

CREATE POLICY "Buyers can create escrow orders" ON public.escrow_orders 
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Parties can update their escrow orders" ON public.escrow_orders 
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = vendor_id);