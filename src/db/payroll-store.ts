import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type {
  PayrollRecord,
  SalaryTemplate,
  EmployeePayrollProfile,
  CompanyPayrollSettings,
  VoiceAuthState,
  EarningRow,
  DeductionRow,
  PayrollStatus,
} from '../payroll-types';

// ─── ID Generator ────────────────────────────────────────────────
let _counter = Date.now();
const genId = () => `prl_${(++_counter).toString(36)}`;

// ─── Default Company Settings (fallback if Supabase empty) ───────
const DEFAULT_COMPANY: CompanyPayrollSettings = {
  companyName: 'VYESS Housekeeping And Facility Service',
  companyAddress: 'H-4, AJS Tower, 1st Floor 3rd Street, Opposite Petrol Pump, Kailash Nagar, Sakthi Nagar, Tiruchirappalli - 620019.',
  contactNumbers: '91 86681 81390, 96559 89414',
  email: 'vyessfms@gmail.com',
  website: 'www.vyessfms.com',
  enablePasswordProtection: true,
  passwordCase: 'uppercase',
  footerText: 'www.vyessfms.com',
};

const DEFAULT_VOICE_AUTH: VoiceAuthState = {
  isEnrolled: false,
  enrolledHash: null,
  passphrase: 'Authorize payroll access',
  securityMode: 'normal',
  attemptCount: 0,
  isLocked: false,
};

// ─── Row mappers: DB snake_case → TS camelCase ───────────────────
function mapCompany(row: Record<string, unknown>): CompanyPayrollSettings {
  return {
    companyName:             String(row.company_name ?? ''),
    companyAddress:          String(row.company_address ?? ''),
    contactNumbers:          String(row.contact_numbers ?? ''),
    email:                   String(row.email ?? ''),
    website:                 String(row.website ?? ''),
    logoUrl:                 row.logo_url ? String(row.logo_url) : undefined,
    enablePasswordProtection: Boolean(row.enable_password_protection ?? true),
    passwordCase:            (row.password_case as 'uppercase' | 'lowercase') ?? 'uppercase',
    footerText:              String(row.footer_text ?? ''),
  };
}

function mapTemplate(row: Record<string, unknown>): SalaryTemplate {
  return {
    id:          String(row.id),
    name:        String(row.name),
    description: String(row.description ?? ''),
    category:    row.category as SalaryTemplate['category'],
    earnings:    (row.earnings as Omit<EarningRow, 'id'>[]) ?? [],
    deductions:  (row.deductions as Omit<DeductionRow, 'id'>[]) ?? [],
    createdAt:   String(row.created_at),
    updatedAt:   String(row.updated_at),
  };
}

function mapEmployee(row: Record<string, unknown>): EmployeePayrollProfile {
  return {
    id:                       String(row.id),
    workerId:                 row.worker_id ? String(row.worker_id) : undefined,
    employeeName:             String(row.employee_name ?? ''),
    employeeId:               String(row.employee_id ?? ''),
    designation:              String(row.designation ?? ''),
    department:               String(row.department ?? ''),
    workLocation:             String(row.work_location ?? ''),
    grade:                    String(row.grade ?? ''),
    dateOfJoining:            String(row.date_of_joining ?? ''),
    bankName:                 String(row.bank_name ?? ''),
    bankAccountNo:            String(row.bank_account_no ?? ''),
    panNumber:                String(row.pan_number ?? ''),
    uanNumber:                String(row.uan_number ?? ''),
    pfNumber:                 String(row.pf_number ?? ''),
    esicNumber:               String(row.esic_number ?? ''),
    defaultSalaryTemplateId:  row.default_salary_template_id ? String(row.default_salary_template_id) : undefined,
    basicSalary:              Number(row.basic_salary ?? 0),
    createdAt:                String(row.created_at),
    updatedAt:                String(row.updated_at),
  };
}

function mapRecord(row: Record<string, unknown>): PayrollRecord {
  return {
    id:            String(row.id),
    payrollMonth:  String(row.payroll_month),
    payrollYear:   Number(row.payroll_year),
    status:        (row.status as PayrollStatus) ?? 'draft',
    employee:      (row.employee as PayrollRecord['employee']) ?? {},
    attendance:    (row.attendance as PayrollRecord['attendance']) ?? {},
    earnings:      (row.earnings as EarningRow[]) ?? [],
    deductions:    (row.deductions as DeductionRow[]) ?? [],
    loans:         (row.loans as PayrollRecord['loans']) ?? [],
    payment:       (row.payment as PayrollRecord['payment']) ?? {},
    calculation:   (row.calculation as PayrollRecord['calculation']) ?? {},
    notes:         row.notes ? String(row.notes) : undefined,
    templateId:    row.template_id ? String(row.template_id) : undefined,
    createdAt:     String(row.created_at),
    updatedAt:     String(row.updated_at),
    generatedAt:   row.generated_at ? String(row.generated_at) : undefined,
    paidAt:        row.paid_at ? String(row.paid_at) : undefined,
  };
}

function mapVoiceAuth(row: Record<string, unknown>): VoiceAuthState {
  return {
    isEnrolled:   Boolean(row.is_enrolled),
    enrolledHash: row.enrolled_hash ? String(row.enrolled_hash) : null,
    passphrase:   String(row.passphrase ?? 'Authorize payroll access'),
    securityMode: (row.security_mode as VoiceAuthState['securityMode']) ?? 'normal',
    attemptCount: Number(row.attempt_count ?? 0),
    lastAttempt:  row.last_attempt ? String(row.last_attempt) : undefined,
    isLocked:     Boolean(row.is_locked),
  };
}

// ─── State Interface ──────────────────────────────────────────────
interface PayrollState {
  records:     PayrollRecord[];
  employees:   EmployeePayrollProfile[];
  templates:   SalaryTemplate[];
  company:     CompanyPayrollSettings;
  voiceAuth:   VoiceAuthState;
  _companyRowId:   string | null;
  _voiceAuthRowId: string | null;

  // Bootstrap
  loadAll: () => Promise<void>;

  // Records
  savePayroll:      (record: Omit<PayrollRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PayrollRecord>;
  updatePayroll:    (id: string, updates: Partial<PayrollRecord>) => Promise<void>;
  deletePayroll:    (id: string) => Promise<void>;
  duplicatePayroll: (id: string) => Promise<PayrollRecord | null>;
  setPayrollStatus: (id: string, status: PayrollStatus) => Promise<void>;
  getPayroll:       (id: string) => PayrollRecord | undefined;

  // Employee Profiles
  saveEmployeeProfile:   (profile: Omit<EmployeePayrollProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<EmployeePayrollProfile>;
  updateEmployeeProfile: (id: string, updates: Partial<EmployeePayrollProfile>) => Promise<void>;
  deleteEmployeeProfile: (id: string) => Promise<void>;

  // Templates
  saveTemplate:   (tpl: Omit<SalaryTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SalaryTemplate>;
  updateTemplate: (id: string, updates: Partial<SalaryTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  // Company
  updateCompany: (updates: Partial<CompanyPayrollSettings>) => Promise<void>;

  // Voice Auth
  enrollVoice:       (hash: string, passphrase: string) => Promise<void>;
  verifyVoice:       (hash: string) => boolean;
  lockPayroll:       () => Promise<void>;
  unlockPayroll:     () => Promise<void>;
  resetVoiceAttempts:() => Promise<void>;

  // Computed
  getPayrollStats: () => {
    totalEmployees: number;
    totalGenerated: number;
    totalPending: number;
    monthlyExpense: number;
    totalDeductions: number;
    activeWorkforce: number;
  };
  filterRecords: (filters: { month?: string; year?: number; status?: PayrollStatus; search?: string }) => PayrollRecord[];
}

// ─── Store ────────────────────────────────────────────────────────
export const usePayrollStore = create<PayrollState>((set, get) => ({
  records:          [],
  employees:        [],
  templates:        [],
  company:          DEFAULT_COMPANY,
  voiceAuth:        DEFAULT_VOICE_AUTH,
  _companyRowId:    null,
  _voiceAuthRowId:  null,

  // ── Bootstrap: load all payroll data from Supabase ───────────
  loadAll: async () => {
    // 1. Company settings
    const { data: companyRows } = await supabase
      .from('payroll_company_settings')
      .select('*')
      .limit(1);
    const companyRow = companyRows?.[0];

    // 2. Templates
    const { data: tplRows } = await supabase
      .from('payroll_salary_templates')
      .select('*')
      .order('created_at', { ascending: true });

    // 3. Employee profiles
    const { data: empRows } = await supabase
      .from('payroll_employee_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // 4. Payroll records
    const { data: recRows } = await supabase
      .from('payroll_records')
      .select('*')
      .order('created_at', { ascending: false });

    // 5. Voice auth
    const { data: voiceRows } = await supabase
      .from('payroll_voice_auth')
      .select('*')
      .limit(1);
    const voiceRow = voiceRows?.[0];

    set({
      company:         companyRow ? mapCompany(companyRow as Record<string, unknown>) : DEFAULT_COMPANY,
      templates:       (tplRows ?? []).map(r => mapTemplate(r as Record<string, unknown>)),
      employees:       (empRows  ?? []).map(r => mapEmployee(r as Record<string, unknown>)),
      records:         (recRows  ?? []).map(r => mapRecord(r as Record<string, unknown>)),
      voiceAuth:       voiceRow ? mapVoiceAuth(voiceRow as Record<string, unknown>) : DEFAULT_VOICE_AUTH,
      _companyRowId:   companyRow ? String(companyRow.id) : null,
      _voiceAuthRowId: voiceRow  ? String(voiceRow.id)   : null,
    });
  },

  // ── Records ──────────────────────────────────────────────────
  savePayroll: async (data) => {
    const now = new Date().toISOString();
    const record: PayrollRecord = {
      ...data,
      id: genId(),
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic update
    set(s => ({ records: [record, ...s.records] }));

    await supabase.from('payroll_records').insert({
      id:            record.id,
      payroll_month: record.payrollMonth,
      payroll_year:  record.payrollYear,
      status:        record.status,
      employee:      record.employee,
      attendance:    record.attendance,
      earnings:      record.earnings,
      deductions:    record.deductions,
      loans:         record.loans,
      payment:       record.payment,
      calculation:   record.calculation,
      notes:         record.notes ?? null,
      template_id:   record.templateId ?? null,
    });

    return record;
  },

  updatePayroll: async (id, updates) => {
    const now = new Date().toISOString();
    set(s => ({
      records: s.records.map(r =>
        r.id === id ? { ...r, ...updates, updatedAt: now } : r
      ),
    }));

    const dbUpdates: Record<string, unknown> = { updated_at: now };
    if (updates.payrollMonth  !== undefined) dbUpdates.payroll_month  = updates.payrollMonth;
    if (updates.payrollYear   !== undefined) dbUpdates.payroll_year   = updates.payrollYear;
    if (updates.status        !== undefined) dbUpdates.status         = updates.status;
    if (updates.employee      !== undefined) dbUpdates.employee       = updates.employee;
    if (updates.attendance    !== undefined) dbUpdates.attendance     = updates.attendance;
    if (updates.earnings      !== undefined) dbUpdates.earnings       = updates.earnings;
    if (updates.deductions    !== undefined) dbUpdates.deductions     = updates.deductions;
    if (updates.loans         !== undefined) dbUpdates.loans          = updates.loans;
    if (updates.payment       !== undefined) dbUpdates.payment        = updates.payment;
    if (updates.calculation   !== undefined) dbUpdates.calculation    = updates.calculation;
    if (updates.notes         !== undefined) dbUpdates.notes          = updates.notes;
    if (updates.templateId    !== undefined) dbUpdates.template_id    = updates.templateId;
    if (updates.generatedAt   !== undefined) dbUpdates.generated_at   = updates.generatedAt;
    if (updates.paidAt        !== undefined) dbUpdates.paid_at        = updates.paidAt;

    await supabase.from('payroll_records').update(dbUpdates).eq('id', id);
  },

  deletePayroll: async (id) => {
    set(s => ({ records: s.records.filter(r => r.id !== id) }));
    await supabase.from('payroll_records').delete().eq('id', id);
  },

  duplicatePayroll: async (id) => {
    const original = get().records.find(r => r.id === id);
    if (!original) return null;
    const now = new Date().toISOString();
    const duplicate: PayrollRecord = {
      ...original,
      id: genId(),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      generatedAt: undefined,
      paidAt: undefined,
    };

    set(s => ({ records: [duplicate, ...s.records] }));

    await supabase.from('payroll_records').insert({
      id:            duplicate.id,
      payroll_month: duplicate.payrollMonth,
      payroll_year:  duplicate.payrollYear,
      status:        duplicate.status,
      employee:      duplicate.employee,
      attendance:    duplicate.attendance,
      earnings:      duplicate.earnings,
      deductions:    duplicate.deductions,
      loans:         duplicate.loans,
      payment:       duplicate.payment,
      calculation:   duplicate.calculation,
      notes:         duplicate.notes ?? null,
      template_id:   duplicate.templateId ?? null,
    });

    return duplicate;
  },

  setPayrollStatus: async (id, status) => {
    const now = new Date().toISOString();
    set(s => ({
      records: s.records.map(r => {
        if (r.id !== id) return r;
        return {
          ...r,
          status,
          updatedAt:   now,
          generatedAt: status === 'generated' ? now : r.generatedAt,
          paidAt:      status === 'paid'      ? now : r.paidAt,
        };
      }),
    }));

    await supabase.from('payroll_records').update({
      status,
      updated_at:   now,
      generated_at: status === 'generated' ? now : undefined,
      paid_at:      status === 'paid'      ? now : undefined,
    }).eq('id', id);
  },

  getPayroll: (id) => get().records.find(r => r.id === id),

  // ── Employee Profiles ─────────────────────────────────────────
  saveEmployeeProfile: async (data) => {
    const now = new Date().toISOString();
    const profile: EmployeePayrollProfile = {
      ...data,
      id: genId(),
      createdAt: now,
      updatedAt: now,
    };

    set(s => ({ employees: [profile, ...s.employees] }));

    await supabase.from('payroll_employee_profiles').insert({
      id:                         profile.id,
      worker_id:                  profile.workerId ?? null,
      employee_name:              profile.employeeName,
      employee_id:                profile.employeeId,
      designation:                profile.designation,
      department:                 profile.department,
      work_location:              profile.workLocation,
      grade:                      profile.grade,
      date_of_joining:            profile.dateOfJoining || null,
      bank_name:                  profile.bankName,
      bank_account_no:            profile.bankAccountNo,
      pan_number:                 profile.panNumber,
      uan_number:                 profile.uanNumber,
      pf_number:                  profile.pfNumber,
      esic_number:                profile.esicNumber,
      default_salary_template_id: profile.defaultSalaryTemplateId ?? null,
      basic_salary:               profile.basicSalary,
    });

    return profile;
  },

  updateEmployeeProfile: async (id, updates) => {
    const now = new Date().toISOString();
    set(s => ({
      employees: s.employees.map(e =>
        e.id === id ? { ...e, ...updates, updatedAt: now } : e
      ),
    }));

    const db: Record<string, unknown> = { updated_at: now };
    if (updates.employeeName             !== undefined) db.employee_name              = updates.employeeName;
    if (updates.employeeId               !== undefined) db.employee_id                = updates.employeeId;
    if (updates.designation              !== undefined) db.designation                = updates.designation;
    if (updates.department               !== undefined) db.department                 = updates.department;
    if (updates.workLocation             !== undefined) db.work_location              = updates.workLocation;
    if (updates.grade                    !== undefined) db.grade                      = updates.grade;
    if (updates.dateOfJoining            !== undefined) db.date_of_joining            = updates.dateOfJoining || null;
    if (updates.bankName                 !== undefined) db.bank_name                  = updates.bankName;
    if (updates.bankAccountNo            !== undefined) db.bank_account_no            = updates.bankAccountNo;
    if (updates.panNumber                !== undefined) db.pan_number                 = updates.panNumber;
    if (updates.uanNumber                !== undefined) db.uan_number                 = updates.uanNumber;
    if (updates.pfNumber                 !== undefined) db.pf_number                  = updates.pfNumber;
    if (updates.esicNumber               !== undefined) db.esic_number                = updates.esicNumber;
    if (updates.defaultSalaryTemplateId  !== undefined) db.default_salary_template_id = updates.defaultSalaryTemplateId ?? null;
    if (updates.basicSalary              !== undefined) db.basic_salary               = updates.basicSalary;
    if (updates.workerId                 !== undefined) db.worker_id                  = updates.workerId ?? null;

    await supabase.from('payroll_employee_profiles').update(db).eq('id', id);
  },

  deleteEmployeeProfile: async (id) => {
    set(s => ({ employees: s.employees.filter(e => e.id !== id) }));
    await supabase.from('payroll_employee_profiles').delete().eq('id', id);
  },

  // ── Templates ─────────────────────────────────────────────────
  saveTemplate: async (data) => {
    const now = new Date().toISOString();
    const tpl: SalaryTemplate = {
      ...data,
      id: genId(),
      createdAt: now,
      updatedAt: now,
    };

    set(s => ({ templates: [tpl, ...s.templates] }));

    await supabase.from('payroll_salary_templates').insert({
      id:          tpl.id,
      name:        tpl.name,
      description: tpl.description,
      category:    tpl.category,
      earnings:    tpl.earnings,
      deductions:  tpl.deductions,
    });

    return tpl;
  },

  updateTemplate: async (id, updates) => {
    const now = new Date().toISOString();
    set(s => ({
      templates: s.templates.map(t =>
        t.id === id ? { ...t, ...updates, updatedAt: now } : t
      ),
    }));

    const db: Record<string, unknown> = { updated_at: now };
    if (updates.name        !== undefined) db.name        = updates.name;
    if (updates.description !== undefined) db.description = updates.description;
    if (updates.category    !== undefined) db.category    = updates.category;
    if (updates.earnings    !== undefined) db.earnings    = updates.earnings;
    if (updates.deductions  !== undefined) db.deductions  = updates.deductions;

    await supabase.from('payroll_salary_templates').update(db).eq('id', id);
  },

  deleteTemplate: async (id) => {
    set(s => ({ templates: s.templates.filter(t => t.id !== id) }));
    await supabase.from('payroll_salary_templates').delete().eq('id', id);
  },

  // ── Company ───────────────────────────────────────────────────
  updateCompany: async (updates) => {
    set(s => ({ company: { ...s.company, ...updates } }));

    const { _companyRowId } = get();
    const db: Record<string, unknown> = {};
    if (updates.companyName              !== undefined) db.company_name              = updates.companyName;
    if (updates.companyAddress           !== undefined) db.company_address           = updates.companyAddress;
    if (updates.contactNumbers           !== undefined) db.contact_numbers           = updates.contactNumbers;
    if (updates.email                    !== undefined) db.email                     = updates.email;
    if (updates.website                  !== undefined) db.website                   = updates.website;
    if (updates.logoUrl                  !== undefined) db.logo_url                  = updates.logoUrl ?? null;
    if (updates.enablePasswordProtection !== undefined) db.enable_password_protection = updates.enablePasswordProtection;
    if (updates.passwordCase             !== undefined) db.password_case             = updates.passwordCase;
    if (updates.footerText               !== undefined) db.footer_text               = updates.footerText;

    if (_companyRowId) {
      await supabase.from('payroll_company_settings').update(db).eq('id', _companyRowId);
    } else {
      const { data } = await supabase.from('payroll_company_settings').insert({
        ...db,
        company_name: get().company.companyName,
      }).select('id').single();
      if (data) set({ _companyRowId: data.id });
    }
  },

  // ── Voice Auth ────────────────────────────────────────────────
  enrollVoice: async (hash, passphrase) => {
    const updated: VoiceAuthState = {
      ...get().voiceAuth,
      isEnrolled: true,
      enrolledHash: hash,
      passphrase,
      attemptCount: 0,
      isLocked: false,
    };
    set({ voiceAuth: updated });

    const { _voiceAuthRowId } = get();
    const db = {
      is_enrolled:   true,
      enrolled_hash: hash,
      passphrase,
      attempt_count: 0,
      is_locked:     false,
    };
    if (_voiceAuthRowId) {
      await supabase.from('payroll_voice_auth').update(db).eq('id', _voiceAuthRowId);
    } else {
      const { data } = await supabase.from('payroll_voice_auth').insert(db).select('id').single();
      if (data) set({ _voiceAuthRowId: data.id });
    }
  },

  verifyVoice: (hash) => {
    const { voiceAuth } = get();
    const match = voiceAuth.enrolledHash === hash;
    const attempts = match ? 0 : voiceAuth.attemptCount + 1;
    const locked = attempts >= 3;
    const now = new Date().toISOString();
    const updated: VoiceAuthState = {
      ...voiceAuth,
      attemptCount: attempts,
      isLocked: locked,
      lastAttempt: now,
    };
    set({ voiceAuth: updated });

    const { _voiceAuthRowId } = get();
    if (_voiceAuthRowId) {
      supabase.from('payroll_voice_auth').update({
        attempt_count: attempts,
        is_locked:     locked,
        last_attempt:  now,
      }).eq('id', _voiceAuthRowId);
    }

    return match;
  },

  lockPayroll: async () => {
    set(s => ({ voiceAuth: { ...s.voiceAuth, isLocked: true } }));
    const { _voiceAuthRowId } = get();
    if (_voiceAuthRowId) {
      await supabase.from('payroll_voice_auth').update({ is_locked: true }).eq('id', _voiceAuthRowId);
    }
  },

  unlockPayroll: async () => {
    set(s => ({ voiceAuth: { ...s.voiceAuth, isLocked: false, attemptCount: 0 } }));
    const { _voiceAuthRowId } = get();
    if (_voiceAuthRowId) {
      await supabase.from('payroll_voice_auth').update({ is_locked: false, attempt_count: 0 }).eq('id', _voiceAuthRowId);
    }
  },

  resetVoiceAttempts: async () => {
    set(s => ({ voiceAuth: { ...s.voiceAuth, attemptCount: 0, isLocked: false } }));
    const { _voiceAuthRowId } = get();
    if (_voiceAuthRowId) {
      await supabase.from('payroll_voice_auth').update({ attempt_count: 0, is_locked: false }).eq('id', _voiceAuthRowId);
    }
  },

  // ── Computed ──────────────────────────────────────────────────
  getPayrollStats: () => {
    const { records } = get();
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const thisMonthRecords = records.filter(r => r.payrollMonth === currentMonth);

    return {
      totalEmployees:  new Set(records.map(r => r.employee.employeeId)).size,
      totalGenerated:  records.filter(r => r.status === 'generated' || r.status === 'paid').length,
      totalPending:    records.filter(r => r.status === 'draft').length,
      monthlyExpense:  thisMonthRecords.reduce((sum, r) => sum + r.calculation.netSalary, 0),
      totalDeductions: thisMonthRecords.reduce((sum, r) => sum + r.calculation.totalDeductions, 0),
      activeWorkforce: new Set(thisMonthRecords.map(r => r.employee.employeeId)).size,
    };
  },

  filterRecords: (filters) => {
    let list = [...get().records];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        r =>
          r.employee.employeeName.toLowerCase().includes(q) ||
          r.employee.employeeId.toLowerCase().includes(q) ||
          r.employee.department.toLowerCase().includes(q)
      );
    }
    if (filters.month)  list = list.filter(r => r.payrollMonth.toLowerCase().includes(filters.month!.toLowerCase()));
    if (filters.year)   list = list.filter(r => r.payrollYear === filters.year);
    if (filters.status) list = list.filter(r => r.status === filters.status);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
}));

// ─── Helper: Generate Payroll ID ─────────────────────────────────
export const generatePayrollId = (prefix = 'PAY') => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}-${year}${month}-${seq}`;
};

// ─── Helper: Number to Words ──────────────────────────────────────
export const numberToWords = (num: number): string => {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  if (num === 0) return 'ZERO';
  if (num < 0) return 'MINUS ' + numberToWords(-num);

  const convert = (n: number): string => {
    if (n < 20)       return ones[n];
    if (n < 100)      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000)     return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000)   return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' CRORE' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  const rupees = Math.floor(num);
  const paise  = Math.round((num - rupees) * 100);
  let result = convert(rupees) + ' RUPEES';
  if (paise > 0) result += ' AND ' + convert(paise) + ' PAISE';
  return result + ' ONLY';
};

// ─── Helper: Generate PDF Password ───────────────────────────────
export const generatePdfPassword = (
  employeeName: string,
  passwordCase: 'uppercase' | 'lowercase' = 'uppercase'
): string => {
  const clean = employeeName.replace(/\s+/g, '');
  return passwordCase === 'uppercase' ? clean.toUpperCase() : clean.toLowerCase();
};

// ─── Helper: Default Earnings Rows ───────────────────────────────
export const defaultEarnings = (): EarningRow[] => [
  { id: genId(), name: 'Basic Salary',      rate: '', amount: 0 },
  { id: genId(), name: 'HRA',               rate: '', amount: 0 },
  { id: genId(), name: 'Special Allowance', rate: '', amount: 0 },
  { id: genId(), name: 'Incentive',         rate: '', amount: 0 },
  { id: genId(), name: 'Bonus',             rate: '', amount: 0 },
  { id: genId(), name: 'Overtime',          rate: '', amount: 0 },
  { id: genId(), name: 'Travel Allowance',  rate: '', amount: 0 },
  { id: genId(), name: 'Food Allowance',    rate: '', amount: 0 },
];

// ─── Helper: Default Deduction Rows ──────────────────────────────
export const defaultDeductions = (): DeductionRow[] => [
  { id: genId(), name: 'Provident Fund',   rate: '12%',   amount: 0 },
  { id: genId(), name: 'ESI',              rate: '0.75%', amount: 0 },
  { id: genId(), name: 'Advance Recovery', rate: '',      amount: 0 },
  { id: genId(), name: 'Penalty',          rate: '',      amount: 0 },
  { id: genId(), name: 'Loan EMI',         rate: '',      amount: 0 },
  { id: genId(), name: 'Leave Deduction',  rate: '',      amount: 0 },
  { id: genId(), name: 'LWF',              rate: '',      amount: 0 },
];
