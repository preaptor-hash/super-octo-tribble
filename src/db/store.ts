import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type {
  User,
  Area,
  Worker,
  Attendance,
  NotesTimeline,
  Deployment,
  WorkerDocument,
  WorkerStatus,
  RecruitmentStage,
  AttendanceType,
} from '../types';

// ─── Haversine distance helper ────────────────────────────────
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── State shape ──────────────────────────────────────────────
interface HRMSState {
  // Data
  currentUser: User | null;
  users: User[];
  areas: Area[];
  workers: Worker[];
  attendance: Attendance[];
  notesTimeline: NotesTimeline[];
  deployments: Deployment[];
  documents: WorkerDocument[];

  // Bootstrap
  loadAll: () => Promise<void>;

  // Auth
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;

  // Workers
  fastAddWorker: (data: {
    full_name: string;
    phone: string;
    skill_category: string | null;
    area_id: string | null;
    gender: string | null;
  }) => Promise<Worker | null>;
  updateWorker: (id: string, updates: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;

  // Notes
  addNote: (workerId: string, content: string) => Promise<void>;

  // Attendance
  checkIn: (
    workerId: string,
    type: AttendanceType,
    location: { latitude: number; longitude: number } | null,
    selfieUrl: string | null,
    notes: string | null
  ) => Promise<void>;
  checkOut: (workerId: string) => Promise<void>;

  // Deployments
  deployWorker: (
    workerId: string,
    clientName: string,
    location: string,
    shift: string,
    joiningDate: string
  ) => Promise<void>;
  cancelDeployment: (deploymentId: string) => Promise<void>;

  // Documents
  uploadDocument: (workerId: string, type: string, url: string) => Promise<void>;

  // Areas
  addArea: (data: {
    name: string;
    pincode: string | null;
    latitude: number | null;
    longitude: number | null;
    zone: string | null;
  }) => Promise<Area | null>;
  updateArea: (id: string, updates: Partial<Area>) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;

  // Search
  searchWorkers: (
    query: string,
    filters: {
      areaId?: string;
      radiusKm?: number;
      skills?: string[];
      status?: WorkerStatus[];
      stage?: RecruitmentStage[];
      gender?: string;
      incompleteOnly?: boolean;
      shiftPreference?: string;
    }
  ) => Worker[];

  // System
  resetDatabase: () => void;
}

// ─── Store ────────────────────────────────────────────────────
export const useHRMSStore = create<HRMSState>((set, get) => ({
  currentUser: null,
  users: [],
  areas: [],
  workers: [],
  attendance: [],
  notesTimeline: [],
  deployments: [],
  documents: [],

  // ── Bootstrap: load everything from Supabase ──────────────
  loadAll: async () => {
    try {
      const [
        { data: users },
        { data: areas },
        { data: workers },
        { data: attendance },
        { data: notes },
        { data: deployments },
        { data: documents },
      ] = await Promise.all([
        supabase.from('users').select('*').order('created_at'),
        supabase.from('areas').select('*').order('name'),
        supabase.from('workers').select('*').order('created_at', { ascending: false }),
        supabase.from('attendance').select('*').order('created_at', { ascending: false }),
        supabase.from('notes_timeline').select('*').order('created_at', { ascending: false }),
        supabase.from('deployments').select('*').order('created_at', { ascending: false }),
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
      ]);

      // Normalize location field — Supabase may return it as a JSON string
      const parseWorkers: Worker[] = (workers ?? []).map((w) => ({
        ...w,
        location:
          w.location == null
            ? null
            : typeof w.location === 'string'
            ? JSON.parse(w.location)
            : w.location,
      })) as Worker[];

      set({
        users: users ?? [],
        areas: areas ?? [],
        workers: parseWorkers,
        attendance: attendance ?? [],
        notesTimeline: notes ?? [],
        deployments: deployments ?? [],
        documents: documents ?? [],
      });
    } catch (error) {
      console.error('Failed to load data from Supabase:', error);
      // Set empty arrays so the app can still render
      set({
        users: [],
        areas: [],
        workers: [],
        attendance: [],
        notesTimeline: [],
        deployments: [],
        documents: [],
      });
    }
  },

  // ── Auth ──────────────────────────────────────────────────
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return false;

    // Fetch the user's profile row from the users table
    let { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    // If no profile row exists yet, create one so RLS checks work
    if (!profile) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email ?? email,
        full_name: data.user.user_metadata?.full_name ?? email.split('@')[0],
        role: 'recruiter',
      }, { onConflict: 'id' });

      // Re-fetch after upsert to get server-assigned org_id etc.
      const { data: refetched } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      profile = refetched;
    }

    // Final safety fallback (should never reach here after upsert)
    const currentUser: User = profile ?? {
      id: data.user.id,
      email: data.user.email ?? email,
      full_name: data.user.user_metadata?.full_name ?? email.split('@')[0],
      role: 'recruiter',
      organization_id: null,
      branch_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set({ currentUser });

    // Load all data after successful login
    await get().loadAll();
    return true;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      currentUser: null,
      users: [],
      areas: [],
      workers: [],
      attendance: [],
      notesTimeline: [],
      deployments: [],
      documents: [],
    });
  },

  // ── Workers ───────────────────────────────────────────────
  fastAddWorker: async (data) => {
    const store = get();
    const nextIdNum = store.workers.length + 1;
    const internalId = `CRW-2026-${String(nextIdNum).padStart(4, '0')}`;

    const area = store.areas.find((a) => a.id === data.area_id);
    const locationJson =
      area?.latitude && area?.longitude
        ? {
            latitude: area.latitude + (Math.random() - 0.5) * 0.003,
            longitude: area.longitude + (Math.random() - 0.5) * 0.003,
          }
        : null;

    const payload = {
      internal_id: internalId,
      full_name: data.full_name || null,
      phone: data.phone || null,
      gender: data.gender || null,
      worker_status: 'draft' as WorkerStatus,
      recruitment_stage: 'new' as RecruitmentStage,
      skill_category: data.skill_category || null,
      city: 'Trichy',
      area_id: data.area_id || null,
      pincode: area?.pincode ?? null,
      location: locationJson,
      availability: 'immediate',
      notes: 'Profile created via rapid worker entry workflow.',
      assigned_recruiter_id: store.currentUser?.id ?? null,
      branch_id: store.currentUser?.branch_id ?? null,
      organization_id: store.currentUser?.organization_id ?? null,
    };

    const { data: inserted, error } = await supabase
      .from('workers')
      .insert(payload)
      .select()
      .single();

    if (error || !inserted) {
      console.error('fastAddWorker error:', error?.message);
      return null;
    }

    const newWorker = { ...inserted, location: locationJson };
    set((s) => ({ workers: [newWorker, ...s.workers] }));

    // Auto-log timeline note
    await get().addNote(inserted.id, 'Recruiter quick-added worker. Initial draft profile created.');

    return newWorker;
  },

  updateWorker: async (id, updates) => {
    const store = get();
    const existing = store.workers.find((w) => w.id === id);
    const isCompletingProfile =
      existing?.worker_status === 'draft' &&
      updates.worker_status &&
      updates.worker_status !== 'draft';

    const { error } = await supabase
      .from('workers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('updateWorker error:', error.message);
      return;
    }

    set((s) => ({
      workers: s.workers.map((w) =>
        w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w
      ),
    }));

    if (isCompletingProfile) {
      await get().addNote(
        id,
        `Worker profile status updated from Draft to ${updates.worker_status}. Gradual profile fields populated.`
      );
    }
  },

  deleteWorker: async (id) => {
    const { error } = await supabase.from('workers').delete().eq('id', id);
    if (error) {
      console.error('deleteWorker error:', error.message);
      return;
    }
    set((s) => ({ workers: s.workers.filter((w) => w.id !== id) }));
  },

  // ── Notes ─────────────────────────────────────────────────
  addNote: async (workerId, content) => {
    const store = get();
    const payload = {
      worker_id: workerId,
      user_id: store.currentUser?.id ?? null,
      note_content: content,
    };

    const { data: inserted, error } = await supabase
      .from('notes_timeline')
      .insert(payload)
      .select()
      .single();

    if (error || !inserted) {
      console.error('addNote error:', error?.message);
      return;
    }

    set((s) => ({ notesTimeline: [inserted, ...s.notesTimeline] }));
  },

  // ── Attendance ────────────────────────────────────────────
  checkIn: async (workerId, type, location, selfieUrl, notes) => {
    const payload = {
      worker_id: workerId,
      check_in_time: new Date().toISOString(),
      type,
      gps_location: location,
      selfie_url: selfieUrl,
      notes,
    };

    const { data: inserted, error } = await supabase
      .from('attendance')
      .insert(payload)
      .select()
      .single();

    if (error || !inserted) {
      console.error('checkIn error:', error?.message);
      return;
    }

    set((s) => ({ attendance: [inserted, ...s.attendance] }));

    await get().addNote(
      workerId,
      `Checked in at ${new Date().toLocaleTimeString()} (Status: ${type.toUpperCase()}). Location captured via GPS.`
    );
  },

  checkOut: async (workerId) => {
    const store = get();
    const record = store.attendance.find(
      (a) => a.worker_id === workerId && !a.check_out_time
    );
    if (!record) return;

    const checkOutTime = new Date().toISOString();
    const { error } = await supabase
      .from('attendance')
      .update({ check_out_time: checkOutTime })
      .eq('id', record.id);

    if (error) {
      console.error('checkOut error:', error.message);
      return;
    }

    set((s) => ({
      attendance: s.attendance.map((a) =>
        a.id === record.id ? { ...a, check_out_time: checkOutTime } : a
      ),
    }));

    await get().addNote(
      workerId,
      `Checked out at ${new Date().toLocaleTimeString()}. Shift ended.`
    );
  },

  // ── Deployments ───────────────────────────────────────────
  deployWorker: async (workerId, clientName, location, shift, joiningDate) => {
    const payload = {
      worker_id: workerId,
      client_name: clientName,
      deployment_location: location,
      shift,
      joining_date: joiningDate,
      deployment_status: 'active' as const,
    };

    const { data: inserted, error } = await supabase
      .from('deployments')
      .insert(payload)
      .select()
      .single();

    if (error || !inserted) {
      console.error('deployWorker error:', error?.message);
      return;
    }

    set((s) => ({ deployments: [inserted, ...s.deployments] }));

    await get().updateWorker(workerId, {
      worker_status: 'deployed',
      recruitment_stage: 'deployed',
    });

    await get().addNote(
      workerId,
      `Deployed to ${clientName} at ${location} for shift: ${shift}. Joining Date: ${joiningDate}.`
    );
  },

  cancelDeployment: async (deploymentId) => {
    const store = get();
    const dep = store.deployments.find((d) => d.id === deploymentId);
    if (!dep) return;

    const { error } = await supabase
      .from('deployments')
      .update({ deployment_status: 'cancelled' })
      .eq('id', deploymentId);

    if (error) {
      console.error('cancelDeployment error:', error.message);
      return;
    }

    set((s) => ({
      deployments: s.deployments.map((d) =>
        d.id === deploymentId ? { ...d, deployment_status: 'cancelled' as const } : d
      ),
    }));

    await get().updateWorker(dep.worker_id, {
      worker_status: 'active',
      recruitment_stage: 'ready_to_join',
    });

    await get().addNote(
      dep.worker_id,
      'Active deployment cancelled. Worker status restored to Active (Ready to Join).'
    );
  },

  // ── Documents ─────────────────────────────────────────────
  uploadDocument: async (workerId, type, url) => {
    const store = get();
    const payload = {
      worker_id: workerId,
      document_type: type,
      file_url: url,
      uploaded_by: store.currentUser?.id ?? null,
    };

    const { data: inserted, error } = await supabase
      .from('documents')
      .insert(payload)
      .select()
      .single();

    if (error || !inserted) {
      console.error('uploadDocument error:', error?.message);
      return;
    }

    set((s) => ({ documents: [...s.documents, inserted] }));

    await get().addNote(workerId, `Uploaded new document: ${type.toUpperCase()} verified.`);
  },

  // ── Areas ─────────────────────────────────────────────────
  addArea: async (data) => {
    const payload = {
      name: data.name,
      pincode: data.pincode || null,
      latitude: data.latitude ?? 10.7905 + (Math.random() - 0.5) * 0.04,
      longitude: data.longitude ?? 78.7047 + (Math.random() - 0.5) * 0.04,
      zone: data.zone || 'Trichy Region',
    };

    const { data: inserted, error } = await supabase
      .from('areas')
      .insert(payload)
      .select()
      .single();

    if (error || !inserted) {
      console.error('addArea error:', error?.message);
      return null;
    }

    set((s) => ({ areas: [...s.areas, inserted] }));
    return inserted;
  },

  updateArea: async (id, updates) => {
    const { error } = await supabase.from('areas').update(updates).eq('id', id);
    if (error) {
      console.error('updateArea error:', error.message);
      return;
    }
    set((s) => ({
      areas: s.areas.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  },

  deleteArea: async (id) => {
    const { error } = await supabase.from('areas').delete().eq('id', id);
    if (error) {
      console.error('deleteArea error:', error.message);
      return;
    }
    set((s) => ({ areas: s.areas.filter((a) => a.id !== id) }));
  },

  // ── Search (client-side, operates on loaded state) ────────
  searchWorkers: (query, filters) => {
    const store = get();
    let list = [...store.workers];

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter((w) => {
        const area = store.areas.find((a) => a.id === w.area_id);
        return (
          w.full_name?.toLowerCase().includes(q) ||
          w.skill_category?.toLowerCase().includes(q) ||
          w.notes?.toLowerCase().includes(q) ||
          w.internal_id?.toLowerCase().includes(q) ||
          area?.name.toLowerCase().includes(q) ||
          area?.pincode?.includes(q)
        );
      });
    }

    if (filters.areaId) {
      const refArea = store.areas.find((a) => a.id === filters.areaId);
      if (refArea && filters.radiusKm && refArea.latitude && refArea.longitude) {
        list = list.filter((w) => {
          if (!w.location) return false;
          return (
            calculateDistance(
              refArea.latitude!,
              refArea.longitude!,
              w.location.latitude,
              w.location.longitude
            ) <= (filters.radiusKm ?? 5)
          );
        });
      } else {
        list = list.filter((w) => w.area_id === filters.areaId);
      }
    }

    if (filters.skills?.length) {
      list = list.filter((w) => w.skill_category && filters.skills!.includes(w.skill_category));
    }

    if (filters.status?.length) {
      list = list.filter((w) => w.worker_status && filters.status!.includes(w.worker_status));
    }

    if (filters.stage?.length) {
      list = list.filter((w) => w.recruitment_stage && filters.stage!.includes(w.recruitment_stage));
    }

    if (filters.gender) {
      list = list.filter((w) => w.gender === filters.gender);
    }

    if (filters.incompleteOnly) {
      list = list.filter(
        (w) =>
          w.worker_status === 'draft' ||
          !w.aadhaar_number ||
          !w.profile_photo_url ||
          !w.age
      );
    }

    if (filters.shiftPreference) {
      list = list.filter(
        (w) => w.shift_preference === filters.shiftPreference || !w.shift_preference
      );
    }

    return list;
  },

  // ── System ────────────────────────────────────────────────
  resetDatabase: () => {
    // Clears any cached state and reloads from Supabase
    set({
      workers: [],
      attendance: [],
      notesTimeline: [],
      deployments: [],
      documents: [],
      areas: [],
    });
    get().loadAll();
  },
}));
