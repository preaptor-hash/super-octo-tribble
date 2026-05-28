export type UserRole = 'super_admin' | 'organization_admin' | 'branch_manager' | 'recruiter' | 'viewer';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  organization_id: string | null;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Branch {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface Area {
  id: string;
  name: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  zone: string | null;
  polygon: string | null; // serialized POLYGON coordinates
  created_at: string;
}

export type WorkerStatus = 'active' | 'inactive' | 'draft' | 'deployed' | 'blacklisted' | 'unavailable';
export type RecruitmentStage = 'new' | 'contacted' | 'interested' | 'verification_pending' | 'ready_to_join' | 'deployed' | 'rejected';

export interface Worker {
  id: string;
  internal_id: string | null; // Unique, nullable
  full_name: string | null;
  phone: string | null;
  alternate_phone: string | null;
  gender: string | null;
  age: number | null;
  profile_photo_url: string | null;
  worker_status: WorkerStatus | null;
  recruitment_stage: RecruitmentStage | null;
  skill_category: string | null;
  experience_years: number | null;
  salary_expected: number | null;
  city: string | null;
  area_id: string | null;
  pincode: string | null;
  location: { latitude: number; longitude: number } | null; // mock PostGIS POINT
  availability: string | null;
  shift_preference: string | null;
  aadhaar_number: string | null;
  pan_number: string | null;
  notes: string | null;
  assigned_recruiter_id: string | null;
  branch_id: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export type AttendanceType = 'present' | 'absent' | 'leave' | 'half_day' | 'late';

export interface Attendance {
  id: string;
  worker_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  type: AttendanceType;
  gps_location: { latitude: number; longitude: number } | null; // mock PostGIS geography POINT
  selfie_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface NotesTimeline {
  id: string;
  worker_id: string;
  user_id: string;
  note_content: string;
  created_at: string;
}

export interface WorkerDocument {
  id: string;
  worker_id: string;
  document_type: string; // aadhaar, pan, resume, certificate
  file_url: string;
  uploaded_by: string;
  created_at: string;
}

export type DeploymentStatus = 'active' | 'completed' | 'cancelled';

export interface Deployment {
  id: string;
  worker_id: string;
  client_name: string | null;
  deployment_location: string | null;
  shift: string | null;
  joining_date: string | null; // YYYY-MM-DD
  deployment_status: DeploymentStatus | null;
  created_at: string;
}
