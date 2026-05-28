-- Vyesshrms: Complete Supabase PostgreSQL Schema Migration
-- Designed for real-world manpower and field staffing operations in Trichy.
-- Last updated: Fixed RLS recursive loop, location column type, WITH CHECK clauses.

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- NOTE: postgis not required; location stored as jsonb {latitude, longitude}

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
    location jsonb,  -- stored as {latitude: ..., longitude: ...}
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

-- 7. Create Shift Attendance Log
CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    check_in_time timestamp with time zone,
    check_out_time timestamp with time zone,
    type text NOT NULL CHECK (type IN ('present', 'absent', 'leave', 'half_day', 'late')),
    gps_location jsonb,  -- stored as {latitude: ..., longitude: ...}
    selfie_url text,
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


-- INDEXES FOR SEARCH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_workers_full_name_trgm ON public.workers USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_workers_skill_trgm ON public.workers USING gin (skill_category gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_workers_notes_trgm ON public.workers USING gin (notes gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_workers_location_gin ON public.workers USING gin (location);


-- SEED DATA (TRICHY CENTROIDS)
INSERT INTO public.areas (name, pincode, latitude, longitude, zone) VALUES
('KK Nagar',      '620021', 10.7905, 78.7118, 'Ponmalai Zone'),
('Thillai Nagar', '620018', 10.8286, 78.6872, 'Abhishekapuram Zone'),
('Cantonment',    '620001', 10.8122, 78.6865, 'Abhishekapuram Zone'),
('Srirangam',     '620006', 10.8622, 78.6903, 'Srirangam Zone'),
('Kattur',        '620019', 10.7937, 78.7495, 'Golden Rock Zone'),
('Lalgudi',       '621601', 10.8667, 78.8167, 'Outskirts North'),
('Tiruverumbur',  '620013', 10.7925, 78.7678, 'Ponmalai Zone')
ON CONFLICT (name) DO NOTHING;


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

-- ============================================================
-- SECURITY DEFINER HELPER (avoids recursive RLS on users table)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- AUTH TRIGGER: Auto-sync auth.users -> public.users on signup
-- ============================================================
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

-- ============================================================
-- RLS POLICIES (non-recursive, WITH CHECK on all writes)
-- ============================================================

-- AREAS: any authenticated user
CREATE POLICY "areas_all" ON public.areas
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- USERS: own row or same org (non-recursive via get_my_org_id)
CREATE POLICY "users_select" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR organization_id = public.get_my_org_id());

CREATE POLICY "users_insert" ON public.users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "users_update" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "users_delete" ON public.users
  FOR DELETE TO authenticated USING (id = auth.uid());

-- WORKERS: same org, with full USING + WITH CHECK
CREATE POLICY "workers_select" ON public.workers
  FOR SELECT TO authenticated
  USING (NOT (organization_id IS DISTINCT FROM public.get_my_org_id()));

CREATE POLICY "workers_insert" ON public.workers
  FOR INSERT TO authenticated
  WITH CHECK (NOT (organization_id IS DISTINCT FROM public.get_my_org_id()));

CREATE POLICY "workers_update" ON public.workers
  FOR UPDATE TO authenticated
  USING (NOT (organization_id IS DISTINCT FROM public.get_my_org_id()))
  WITH CHECK (NOT (organization_id IS DISTINCT FROM public.get_my_org_id()));

CREATE POLICY "workers_delete" ON public.workers
  FOR DELETE TO authenticated
  USING (NOT (organization_id IS DISTINCT FROM public.get_my_org_id()));

-- NOTES_TIMELINE
CREATE POLICY "notes_all" ON public.notes_timeline
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workers w WHERE w.id = notes_timeline.worker_id AND NOT (w.organization_id IS DISTINCT FROM public.get_my_org_id())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workers w WHERE w.id = notes_timeline.worker_id AND NOT (w.organization_id IS DISTINCT FROM public.get_my_org_id())));

-- ATTENDANCE
CREATE POLICY "attendance_all" ON public.attendance
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workers w WHERE w.id = attendance.worker_id AND NOT (w.organization_id IS DISTINCT FROM public.get_my_org_id())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workers w WHERE w.id = attendance.worker_id AND NOT (w.organization_id IS DISTINCT FROM public.get_my_org_id())));

-- DEPLOYMENTS
CREATE POLICY "deployments_all" ON public.deployments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workers w WHERE w.id = deployments.worker_id AND NOT (w.organization_id IS DISTINCT FROM public.get_my_org_id())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workers w WHERE w.id = deployments.worker_id AND NOT (w.organization_id IS DISTINCT FROM public.get_my_org_id())));

-- DOCUMENTS
CREATE POLICY "documents_all" ON public.documents
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workers w WHERE w.id = documents.worker_id AND NOT (w.organization_id IS DISTINCT FROM public.get_my_org_id())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workers w WHERE w.id = documents.worker_id AND NOT (w.organization_id IS DISTINCT FROM public.get_my_org_id())));

-- BRANCHES
CREATE POLICY "branches_all" ON public.branches
  FOR ALL TO authenticated
  USING (NOT (organization_id IS DISTINCT FROM public.get_my_org_id()))
  WITH CHECK (NOT (organization_id IS DISTINCT FROM public.get_my_org_id()));

-- ORGANIZATIONS
CREATE POLICY "organizations_all" ON public.organizations
  FOR ALL TO authenticated
  USING (NOT (id IS DISTINCT FROM public.get_my_org_id()))
  WITH CHECK (NOT (id IS DISTINCT FROM public.get_my_org_id()));

 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
 - -   S T O R A G E   B U C K E T S   &   P O L I C I E S 
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
 I N S E R T   I N T O   s t o r a g e . b u c k e t s   ( i d ,   n a m e ,   p u b l i c )   V A L U E S   ( ' w o r k e r - m e d i a ' ,   ' w o r k e r - m e d i a ' ,   t r u e )   O N   C O N F L I C T   ( i d )   D O   N O T H I N G ; 
 
 C R E A T E   P O L I C Y   " P u b l i c   A c c e s s "   O N   s t o r a g e . o b j e c t s   F O R   S E L E C T   U S I N G   ( b u c k e t _ i d   =   ' w o r k e r - m e d i a ' ) ; 
 C R E A T E   P O L I C Y   " A u t h   I n s e r t "   O N   s t o r a g e . o b j e c t s   F O R   I N S E R T   W I T H   C H E C K   ( b u c k e t _ i d   =   ' w o r k e r - m e d i a '   A N D   a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ; 
 
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
 - -   R E A L T I M E   S U B S C R I P T I O N S 
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
 A L T E R   P U B L I C A T I O N   s u p a b a s e _ r e a l t i m e   A D D   T A B L E   p u b l i c . w o r k e r s ; 
 A L T E R   P U B L I C A T I O N   s u p a b a s e _ r e a l t i m e   A D D   T A B L E   p u b l i c . a t t e n d a n c e ; 
  
 