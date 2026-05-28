-- Vyesshrms: Complete Supabase PostgreSQL Schema Migration
-- Designed for real-world manpower and field staffing operations in Trichy.

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Create Multi-Tenant Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Create Operational Branches
CREATE TABLE IF NOT EXISTS public.branches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    address text,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Create App Users (Recruiters, Managers)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    full_name text,
    role text NOT NULL DEFAULT 'recruiter' CHECK (role IN ('super_admin', 'organization_admin', 'branch_manager', 'recruiter', 'viewer')),
    organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. Create Hyperlocal Master Areas (Trichy Centroids)
CREATE TABLE IF NOT EXISTS public.areas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    pincode text,
    latitude numeric,
    longitude numeric,
    zone text,
    polygon geography(POLYGON, 4326),
    created_at timestamp with time zone DEFAULT now()
);

-- 6. Create Workers Central Table (Save First, Complete Later)
CREATE TABLE IF NOT EXISTS public.workers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_id text UNIQUE,
    full_name text,
    phone text,
    alternate_phone text,
    gender text,
    age integer,
    profile_photo_url text,
    worker_status text DEFAULT 'draft' CHECK (worker_status IN ('active', 'inactive', 'draft', 'deployed', 'blacklisted', 'unavailable')),
    recruitment_stage text DEFAULT 'new' CHECK (recruitment_stage IN ('new', 'contacted', 'interested', 'verification_pending', 'ready_to_join', 'deployed', 'rejected')),
    skill_category text,
    experience_years integer,
    salary_expected numeric,
    city text DEFAULT 'Trichy',
    area_id uuid REFERENCES public.areas(id) ON DELETE SET NULL,
    pincode text,
    location geography(POINT, 4326), -- PostGIS Point for proximity sliders
    availability text,
    shift_preference text,
    aadhaar_number text,
    pan_number text,
    notes text,
    assigned_recruiter_id uuid REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 7. Create Shift Attendance Log (Selfies & Coordinates Hidden on Front-End)
CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    check_in_time timestamp with time zone,
    check_out_time timestamp with time zone,
    type text NOT NULL CHECK (type IN ('present', 'absent', 'leave', 'half_day', 'late')),
    gps_location geography(POINT, 4326), -- PostGIS coordinates stamp
    selfie_url text, -- Supabase Storage selfie url
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- 8. Create Notes Action Feed / Interaction Timeline
CREATE TABLE IF NOT EXISTS public.notes_timeline (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    note_content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 9. Create Credentials & Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    document_type text NOT NULL CHECK (document_type IN ('aadhaar', 'pan', 'resume', 'certificate')),
    file_url text NOT NULL,
    uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

-- 10. Create Deployments Shift History
CREATE TABLE IF NOT EXISTS public.deployments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    client_name text,
    deployment_location text,
    shift text,
    joining_date date,
    deployment_status text DEFAULT 'active' CHECK (deployment_status IN ('active', 'completed', 'cancelled')),
    created_at timestamp with time zone DEFAULT now()
);


-- INDEXES FOR MAXIMUM SEARCH & PROXIMITY PERFORMANCE

-- Trigram Indexes for pg_trgm similarity search (KK Nagar delivery, Mutha tailor)
CREATE INDEX IF NOT EXISTS idx_workers_full_name_trgm ON public.workers USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_workers_skill_trgm ON public.workers USING gin (skill_category gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_workers_notes_trgm ON public.workers USING gin (notes gin_trgm_ops);

-- Spatial GiST Indexes for Hyperlocal Proximity Queries (mocking ST_DWithin range calculations)
CREATE INDEX IF NOT EXISTS idx_workers_location_gist ON public.workers USING gist (location);
CREATE INDEX IF NOT EXISTS idx_areas_polygon_gist ON public.areas USING gist (polygon);


-- SEED DATA PRE-POPULATION (TRICHY CENTROIDS)
INSERT INTO public.organizations (id, name) VALUES ('org-1'::uuid, 'CrewOps Manpower & Staffing Solutions Pvt Ltd') ON CONFLICT DO NOTHING;

INSERT INTO public.branches (id, organization_id, name, address) 
VALUES ('branch-trichy'::uuid, 'org-1'::uuid, 'Trichy Main Office', '12B, Salai Road, Woraiyur, Trichy - 620003') ON CONFLICT DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, organization_id, branch_id) VALUES
('user-rec-1'::uuid, 'karthik@crewops.in', 'Karthik Raja', 'recruiter', 'org-1'::uuid, 'branch-trichy'::uuid) ON CONFLICT DO NOTHING;

INSERT INTO public.areas (id, name, pincode, latitude, longitude, zone) VALUES
('area-kk-nagar'::uuid, 'KK Nagar', '620021', 10.7905, 78.7118, 'Ponmalai Zone'),
('area-thillai-nagar'::uuid, 'Thillai Nagar', '620018', 10.8286, 78.6872, 'Abhishekapuram Zone'),
('area-cantonment'::uuid, 'Cantonment', '620001', 10.8122, 78.6865, 'Abhishekapuram Zone'),
('area-srirangam'::uuid, 'Srirangam', '620006', 10.8622, 78.6903, 'Srirangam Zone'),
('area-kattur'::uuid, 'Kattur', '620019', 10.7937, 78.7495, 'Golden Rock Zone'),
('area-lalgudi'::uuid, 'Lalgudi', '621601', 10.8667, 78.8167, 'Outskirts North'),
('area-tiruverumbur'::uuid, 'Tiruverumbur', '620013', 10.7925, 78.7678, 'Ponmalai Zone')
ON CONFLICT DO NOTHING;


-- SECURITY & RLS CONFIGURATION
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Trigger function to automatically create/sync public user profiles on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'recruiter'
  )
  ON CONFLICT (email) DO UPDATE
  SET id = EXCLUDED.id,
      full_name = coalesce(EXCLUDED.full_name, public.users.full_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Organizations RLS
CREATE POLICY "Users can view and manage their organization" ON public.organizations
    FOR ALL USING (
        id IS NOT DISTINCT FROM (SELECT organization_id FROM public.users WHERE id = auth.uid())
    );

-- Branches RLS
CREATE POLICY "Users can view and manage branches in their organization" ON public.branches
    FOR ALL USING (
        organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.users WHERE id = auth.uid())
    );

-- Users RLS
CREATE POLICY "Users can manage their own profile or organization members" ON public.users
    FOR ALL USING (
        id = auth.uid()
        OR organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.users WHERE id = auth.uid())
    );

-- Areas RLS
CREATE POLICY "Authenticated users can manage areas" ON public.areas
    FOR ALL USING (
        auth.role() = 'authenticated'
    );

-- Null-safe organization management RLS policies for Workers and core logs
CREATE POLICY "Users can manage workers of same organization" ON public.workers
    FOR ALL USING (
        organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.users WHERE id = auth.uid())
    );

CREATE POLICY "Users can manage attendance" ON public.attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workers w
            JOIN public.users u ON u.id = auth.uid()
            WHERE w.id = attendance.worker_id 
              AND w.organization_id IS NOT DISTINCT FROM u.organization_id
        )
    );

CREATE POLICY "Users can manage deployments" ON public.deployments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workers w
            JOIN public.users u ON u.id = auth.uid()
            WHERE w.id = deployments.worker_id 
              AND w.organization_id IS NOT DISTINCT FROM u.organization_id
        )
    );

CREATE POLICY "Users can manage notes" ON public.notes_timeline
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workers w
            JOIN public.users u ON u.id = auth.uid()
            WHERE w.id = notes_timeline.worker_id 
              AND w.organization_id IS NOT DISTINCT FROM u.organization_id
        )
    );

CREATE POLICY "Users can manage documents" ON public.documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workers w
            JOIN public.users u ON u.id = auth.uid()
            WHERE w.id = documents.worker_id 
              AND w.organization_id IS NOT DISTINCT FROM u.organization_id
        )
    );
