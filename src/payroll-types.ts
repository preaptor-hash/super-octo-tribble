// ─── VyessHRMS Payroll Type Definitions ────────────────────────

export type PayrollStatus = 'draft' | 'generated' | 'paid';

export interface EarningRow {
  id: string;
  name: string;
  rate: string;
  amount: number;
}

export interface DeductionRow {
  id: string;
  name: string;
  rate: string;
  amount: number;
}

export interface LoanDetail {
  id: string;
  name: string;
  loanAmount: number;
  balanceAmount: number;
  installmentAmount: number;
}

export interface PaymentDetail {
  mode: string;
  disbursementDate: string;
  bank: string;
  accountNo: string;
  amount: number;
  notes: string;
}

export interface AttendanceData {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  phWeo: number;
  overtimeHours: number;
  overtimeRate: number;
}

export interface EmployeePayrollDetails {
  employeeName: string;
  employeeId: string;
  designation: string;
  department: string;
  workLocation: string;
  grade: string;
  dateOfJoining: string;
  bankName: string;
  bankAccountNo: string;
  panNumber: string;
  uanNumber: string;
  pfNumber: string;
  esicNumber: string;
}

export interface PayrollCalculation {
  perDaySalary: number;
  presentEarnings: number;
  absentDeduction: number;
  overtimeAmount: number;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
}

export interface PayrollRecord {
  id: string;
  payrollMonth: string; // "May 2026"
  payrollYear: number;
  status: PayrollStatus;
  employee: EmployeePayrollDetails;
  attendance: AttendanceData;
  earnings: EarningRow[];
  deductions: DeductionRow[];
  loans: LoanDetail[];
  payment: PaymentDetail;
  calculation: PayrollCalculation;
  createdAt: string;
  updatedAt: string;
  generatedAt?: string;
  paidAt?: string;
  notes?: string;
  templateId?: string;
}

export interface SalaryTemplate {
  id: string;
  name: string;
  description: string;
  category: 'housekeeping' | 'security' | 'supervisor' | 'office' | 'contract' | 'custom';
  earnings: Omit<EarningRow, 'id'>[];
  deductions: Omit<DeductionRow, 'id'>[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployeePayrollProfile {
  id: string;
  workerId?: string;
  employeeName: string;
  employeeId: string;
  designation: string;
  department: string;
  workLocation: string;
  grade: string;
  dateOfJoining: string;
  bankName: string;
  bankAccountNo: string;
  panNumber: string;
  uanNumber: string;
  pfNumber: string;
  esicNumber: string;
  defaultSalaryTemplateId?: string;
  basicSalary: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyPayrollSettings {
  companyName: string;
  companyAddress: string;
  contactNumbers: string;
  email: string;
  website: string;
  logoUrl?: string;
  enablePasswordProtection: boolean;
  passwordCase: 'uppercase' | 'lowercase';
  footerText: string;
  workLocation?: string;
}

export interface VoiceAuthState {
  isEnrolled: boolean;
  enrolledHash: string | null;
  passphrase: string;
  securityMode: 'normal' | 'high' | 'mfa';
  attemptCount: number;
  lastAttempt?: string;
  isLocked: boolean;
}

export interface PayrollReport {
  month: string;
  year: number;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  departmentBreakdown: { department: string; count: number; totalNet: number }[];
}
