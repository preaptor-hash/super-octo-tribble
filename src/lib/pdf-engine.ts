import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PayrollRecord, CompanyPayrollSettings } from '../payroll-types';
import { numberToWords, generatePdfPassword } from '../db/payroll-store';

const PW = 210; // A4 page width mm
const PH = 297; // A4 page height mm

// ─── Exact VYESS colour palette (from uploaded template image) ────
const C = {
  headerBg:   [178, 223, 240] as [number,number,number], // #B2DFF0
  logoBlue:   [0, 90, 170]    as [number,number,number],
  border:     [180, 180, 180] as [number,number,number],
  textDark:   [30, 30, 30]    as [number,number,number],
  textGray:   [90, 90, 90]    as [number,number,number],
  watermark:  [225, 235, 245] as [number,number,number], // Extremely light gray-blue for clean watermark
};

// ─── Draw the exact VYESS header (sky-blue bg + wave + logo) ─────
function drawHeader(doc: jsPDF, company: CompanyPayrollSettings): number {
  // 1. Draw top sky-blue gradient background
  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, PW, 75, 'F');

  // Dark blue wave element on the top right
  doc.setFillColor(34, 75, 140);
  doc.ellipse(PW + 10, 20, 70, 30, 'F');

  // Medium blue wave element overlay
  doc.setFillColor(100, 181, 218);
  doc.ellipse(PW - 15, 25, 45, 20, 'F');

  // 2. White wave sweeping down separating header from body
  doc.setFillColor(255, 255, 255);
  doc.ellipse(PW / 2, 105, PW * 0.7, 35, 'F');

  // Pure white content background area below Y=70
  doc.rect(0, 70, PW, PH - 70, 'F');

  // 3. Draw the Logo (custom uploaded or default V logo)
  if (company.logoUrl) {
    try {
      doc.addImage(company.logoUrl, 'PNG', 16, 14, 24, 24, undefined, 'FAST');
    } catch (e) {
      console.error("Failed to add custom company logo to PDF, falling back to default.", e);
      drawDefaultLogo(doc);
    }
  } else {
    drawDefaultLogo(doc);
  }

  // 4. Company Name next to logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(10, 25, 60);
  doc.text(company.companyName, 44, 25);

  // 5. Contact details below logo (printed on the sky-blue background)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 40, 80);

  // Phone row
  doc.text(`[TEL]  ${company.contactNumbers}`, 20, 46);
  // Email row
  doc.text(`[EMAIL]  ${company.email}`, 20, 52);
  // Address row
  const addrLines = doc.splitTextToSize(company.companyAddress, 170);
  doc.text(addrLines, 20, 58, { lineHeightFactor: 1.3 });

  return 76; // Position where the actual content starts
}

function drawDefaultLogo(doc: jsPDF): void {
  doc.setFillColor(255, 255, 255);
  doc.circle(28, 26, 12, 'F');
  
  doc.setDrawColor(...C.logoBlue);
  doc.setLineWidth(0.6);
  doc.circle(28, 26, 12, 'S');

  // Cyan stroke for left leg
  doc.setDrawColor(0, 180, 240);
  doc.setLineWidth(2.5);
  doc.line(22, 20, 26, 32);

  // Dark blue stroke for right leg
  doc.setDrawColor(0, 40, 100);
  doc.line(26, 32, 34, 18);
}

// ─── Draw CONFIDENTIAL diagonal watermark ─────────────────────────
function drawWatermark(doc: jsPDF): void {
  doc.saveGraphicsState();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(52);
  doc.setTextColor(...C.watermark);
  const cx = PW / 2;
  const cy = PH / 2;
  doc.text('CONFIDENTIAL', cx, cy, {
    align: 'center',
    angle: 45,
  });
  doc.setFontSize(30);
  doc.text('CONFIDENTIAL', cx, cy - 40, { align: 'center', angle: 45 });
  doc.text('CONFIDENTIAL', cx, cy + 40, { align: 'center', angle: 45 });
  doc.restoreGraphicsState();
}

// ─── Draw payslip title line ──────────────────────────────────────
function drawTitle(doc: jsPDF, payrollMonth: string, y: number): number {
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(10, y, PW - 10, y);
  y += 1;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...C.textDark);
  doc.text(`Payslip for the month of ${payrollMonth}`, PW / 2, y + 4.5, { align: 'center' });
  y += 6.5;
  doc.line(10, y, PW - 10, y);
  return y + 2;
}

// ─── Draw employee details (2-column grid, matching template) ─────
function drawEmployeeDetails(doc: jsPDF, record: PayrollRecord, y: number): number {
  const emp = record.employee;

  // Exact fields matching user template
  const fields = [
    { leftL: 'Emp ID :', leftV: emp.employeeId, rightL: 'Employee Name :', rightV: emp.employeeName },
    { leftL: 'Location :', leftV: emp.workLocation || 'Gurgaon', rightL: 'Grade :', rightV: emp.grade || 'Executive' },
    { leftL: 'Designation :', leftV: emp.designation, rightL: 'Department :', rightV: emp.department },
    { leftL: 'Bank Name :', leftV: emp.bankName, rightL: 'Bank A\\C No. :', rightV: emp.bankAccountNo },
    { leftL: 'PAN :', leftV: emp.panNumber, rightL: 'Date Of Join :', rightV: emp.dateOfJoining },
    { leftL: 'UAN :', leftV: emp.uanNumber, rightL: 'PF No. :', rightV: emp.pfNumber },
    { leftL: 'ESIC No. :', leftV: emp.esicNumber, rightL: '', rightV: '' },
  ];

  const rowH = 6;
  const tableH = fields.length * rowH;
  
  // Outer border box
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.rect(10, y, PW - 20, tableH, 'S');

  // Middle vertical line separator
  doc.line(PW / 2, y, PW / 2, y + tableH);

  doc.setFontSize(8);
  for (let i = 0; i < fields.length; i++) {
    const rowY = y + i * rowH;
    
    // Horizontal separator line
    if (i > 0) {
      doc.line(10, rowY, PW - 10, rowY);
    }

    const { leftL, leftV, rightL, rightV } = fields[i];
    const textY = rowY + rowH / 2 + 1.2;

    // Left column
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.textDark);
    doc.text(leftL, 12, textY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textDark);
    doc.text(leftV || '', 36, textY);

    // Right column
    if (rightL) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.textDark);
      doc.text(rightL, PW / 2 + 2, textY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.textDark);
      doc.text(rightV || '', PW / 2 + 32, textY);
    }
  }

  return y + tableH + 3;
}

// ─── Draw attendance bar ──────────────────────────────────────────
function drawAttendance(doc: jsPDF, record: PayrollRecord, y: number): number {
  const att = record.attendance;
  const H = 7;
  doc.setFillColor(255, 255, 255);
  doc.rect(10, y, PW - 20, H, 'F');
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.rect(10, y, PW - 20, H, 'S');

  // Separator lines inside attendance
  doc.line(10 + (PW - 20) * 0.25, y, 10 + (PW - 20) * 0.25, y + H);
  doc.line(10 + (PW - 20) * 0.5, y, 10 + (PW - 20) * 0.5, y + H);
  doc.line(10 + (PW - 20) * 0.75, y, 10 + (PW - 20) * 0.75, y + H);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.textDark);
  const midY = y + H / 2 + 1.2;

  doc.text(`Total Days :${att.totalWorkingDays.toFixed(2)}`, 12, midY);
  doc.text(`Days Present :${att.presentDays.toFixed(2)}`, 10 + (PW - 20) * 0.25 + 2, midY);
  doc.text(`PH/WEO :${att.phWeo.toFixed(2)}`, 10 + (PW - 20) * 0.5 + 2, midY);
  doc.text(`LWP/Absent :${att.absentDays.toFixed(2)}`, 10 + (PW - 20) * 0.75 + 2, midY);

  return y + H + 3;
}

// ─── Draw Earnings + Deductions side-by-side table ────────────────
function drawEarningsDeductions(doc: jsPDF, record: PayrollRecord, y: number): number {
  const earnings = record.earnings.filter(e => e.name.trim() && e.amount > 0);
  const deductions = record.deductions.filter(d => d.name.trim() && d.amount > 0);
  const maxRows = Math.max(earnings.length, deductions.length);

  const ROW_H = 5.5;
  const HALF = (PW - 20) / 2; // 95mm each half
  const LX = 10, RX = 10 + HALF;
  const LINE_W = 0.25;

  // Table Headers
  const hY = y;
  const hH = 6;
  doc.setFillColor(255, 255, 255);
  doc.rect(LX, hY, HALF, hH, 'F');
  doc.rect(RX, hY, HALF, hH, 'F');
  doc.setDrawColor(...C.border);
  doc.setLineWidth(LINE_W);
  doc.rect(LX, hY, HALF, hH, 'S');
  doc.rect(RX, hY, HALF, hH, 'S');

  // Header labels
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.textDark);
  doc.text('Earnings', LX + 2, hY + 4.2);
  doc.text('Rate', LX + 58, hY + 4.2);
  doc.text('Amount', LX + HALF - 2, hY + 4.2, { align: 'right' });
  doc.text('Deductions', RX + 2, hY + 4.2);
  doc.text('Rate', RX + 58, hY + 4.2);
  doc.text('Amount', RX + HALF - 2, hY + 4.2, { align: 'right' });

  y = hY + hH;

  // Data rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  for (let i = 0; i < maxRows; i++) {
    const rY = y + i * ROW_H;
    doc.setDrawColor(...C.border);
    doc.rect(LX, rY, HALF, ROW_H, 'S');
    doc.rect(RX, rY, HALF, ROW_H, 'S');

    const textY = rY + ROW_H / 2 + 1;

    if (i < earnings.length) {
      const e = earnings[i];
      doc.setTextColor(...C.textDark);
      doc.text(e.name, LX + 2, textY);
      if (e.rate) doc.text(e.rate, LX + 58, textY);
      doc.text(e.amount.toFixed(2), LX + HALF - 2, textY, { align: 'right' });
    }

    if (i < deductions.length) {
      const d = deductions[i];
      doc.setTextColor(...C.textDark);
      doc.text(d.name, RX + 2, textY);
      if (d.rate) doc.text(d.rate, RX + 58, textY);
      doc.text(d.amount.toFixed(2), RX + HALF - 2, textY, { align: 'right' });
    }
  }

  y += maxRows * ROW_H;

  // Total Row
  const tH = 6;
  doc.setDrawColor(...C.border);
  doc.rect(LX, y, HALF, tH, 'S');
  doc.rect(RX, y, HALF, tH, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.textDark);
  doc.text('Total Earnings :', LX + 2, y + 4.2);
  doc.text(record.calculation.grossEarnings.toFixed(2), LX + HALF - 2, y + 4.2, { align: 'right' });
  doc.text('Total Deductions :', RX + 2, y + 4.2);
  doc.text(record.calculation.totalDeductions.toFixed(2), RX + HALF - 2, y + 4.2, { align: 'right' });

  y += tH;

  // Net Pay Row
  const nH = 6;
  doc.rect(LX, y, HALF, nH, 'S');
  doc.rect(RX, y, HALF, nH, 'S');

  // Net Pay in right column
  doc.setFont('helvetica', 'bold');
  doc.text('Net Pay :', RX + 24, y + 4.2);
  doc.text(record.calculation.netSalary.toFixed(2), RX + HALF - 2, y + 4.2, { align: 'right' });

  y += nH;
  return y + 3;
}

// ─── Draw RUPEES in words ─────────────────────────────────────────
function drawRupeesWords(doc: jsPDF, netSalary: number, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.textDark);
  const words = numberToWords(Math.round(netSalary));
  doc.text(`RUPEES : ${words}`, 10, y);
  return y + 4;
}

// ─── Draw Payment Details table ───────────────────────────────────
function drawPaymentDetails(doc: jsPDF, record: PayrollRecord, y: number): number {
  const pmt = record.payment;
  const hasPmt = pmt.mode || pmt.bank || pmt.accountNo || pmt.disbursementDate || pmt.amount > 0;
  if (!hasPmt) return y;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.textDark);
  doc.text('Payment Details :', 10, y);
  y += 3;

  const body: string[][] = [[
    pmt.mode || '',
    pmt.disbursementDate || '',
    pmt.bank || '',
    pmt.accountNo || '',
    pmt.amount > 0 ? pmt.amount.toFixed(2) : record.calculation.netSalary.toFixed(2),
  ]];

  autoTable(doc, {
    startY: y,
    head: [['Mode of Payment', 'Disbursement Date', 'Employee Bank', 'Account No', 'Amount']],
    body,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 30, 30], font: 'helvetica' },
    headStyles: { fillColor: [255, 255, 255], textColor: [30, 30, 30], fontStyle: 'bold', lineWidth: 0.25 },
    margin: { left: 10, right: 10 },
    tableWidth: PW - 20,
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
}

// ─── Draw Loan Details table ──────────────────────────────────────
function drawLoanDetails(doc: jsPDF, record: PayrollRecord, y: number): number {
  const loans = record.loans.filter(
    l => l.name.trim() || l.loanAmount > 0 || l.balanceAmount > 0 || l.installmentAmount > 0
  );
  
  // If no loans, draw the default "Advance" row to match template perfectly
  const hasLoans = loans.length > 0;
  const loanData = hasLoans ? loans : [{ name: 'Advance', loanAmount: 0, balanceAmount: 0, installmentAmount: 0 }];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.textDark);
  doc.text('LOAN DETAIL', 10, y);
  y += 3;

  const body = loanData.map(l => [
    l.name || '',
    l.loanAmount > 0 ? l.loanAmount.toFixed(2) : '',
    l.balanceAmount >= 0 ? l.balanceAmount.toFixed(2) : '0.00',
    l.installmentAmount > 0 ? l.installmentAmount.toFixed(2) : '',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Loan Name', 'Loan Amount', 'Balance Amount', 'Installment Amount']],
    body,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 30, 30], font: 'helvetica' },
    headStyles: { fillColor: [255, 255, 255], textColor: [30, 30, 30], fontStyle: 'bold', lineWidth: 0.25 },
    margin: { left: 10, right: 10 },
    tableWidth: PW - 20,
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
}

// ─── Draw Signature line ──────────────────────────────────────────
function drawSignature(doc: jsPDF, y: number): void {
  if (y > 252) return; // Not enough space on current page
  const sigY = Math.max(y + 4, 252);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.textGray);

  const positions = [
    { x: 18, label: 'Employee Signature' },
    { x: 85, label: 'HR Signature' },
    { x: 148, label: 'Authorized Signatory' },
  ];
  positions.forEach(({ x, label }) => {
    doc.line(x, sigY, x + 44, sigY);
    doc.text(label, x + 22, sigY + 4, { align: 'center' });
  });
}

// ─── Draw footer bar (black with website and side accents) ────────
function drawFooter(doc: jsPDF, company: CompanyPayrollSettings): void {
  // Solid black bar
  doc.setFillColor(15, 15, 15);
  doc.rect(0, PH - 12, PW, 12, 'F');

  // Slanted blue accent paths on corners
  doc.setFillColor(100, 181, 218);
  doc.triangle(0, PH, 12, PH, 0, PH - 12, 'F');
  doc.triangle(PW, PH, PW - 12, PH, PW, PH - 12, 'F');

  // Dynamic website from company settings
  const website = company.website ?? 'www.vyessfms.com';
  const displayUrl = website.replace(/^https?:\/\//, '').split('').join(' ');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(displayUrl, PW / 2, PH - 4.5, { align: 'center' });
}

// ─── Draw password protection notice ─────────────────────────────
function drawPasswordNotice(doc: jsPDF, password: string): void {
  doc.setFillColor(255, 250, 210);
  doc.rect(10, PH - 25, PW - 20, 7, 'F');
  doc.setDrawColor(220, 180, 0);
  doc.setLineWidth(0.2);
  doc.rect(10, PH - 25, PW - 20, 7, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 70, 0);
  doc.text(
    `[LOCK] This payslip is password protected. Open with employee name (no spaces). Password: ${password}`,
    PW / 2, PH - 20.5,
    { align: 'center', maxWidth: PW - 24 }
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT: Generate VYESS Payslip PDF
// Strictly reproduces the exact uploaded template layout. No alternates.
// ═══════════════════════════════════════════════════════════════════
export async function generateVyessPayslipPDF(
  record: PayrollRecord,
  company: CompanyPayrollSettings
): Promise<{ blob: Blob; filename: string; password: string }> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // 1. Exact VYESS blue curve wave header
  let y = drawHeader(doc, company);

  // 2. Diagonal watermark
  drawWatermark(doc);

  // 3. Payslip title month bar
  y = drawTitle(doc, record.payrollMonth, y);

  // 4. Employee grid table
  y = drawEmployeeDetails(doc, record, y);

  // 5. Attendance bar
  y = drawAttendance(doc, record, y);

  // 6. Side-by-side Earnings & Deductions
  y = drawEarningsDeductions(doc, record, y);

  // 7. Rupees in words
  y = drawRupeesWords(doc, record.calculation.netSalary, y);

  // 8. Payment Details
  y = drawPaymentDetails(doc, record, y);

  // 9. Loan details
  y = drawLoanDetails(doc, record, y);

  // 10. Signature block
  drawSignature(doc, y);

  // 11. Password notice (if enabled)
  const password = company.enablePasswordProtection
    ? generatePdfPassword(record.employee.employeeName, company.passwordCase)
    : '';
  if (password) drawPasswordNotice(doc, password);

  // 12. Black bottom footer
  drawFooter(doc, company);

  // Output
  const monthLabel = record.payrollMonth.replace(/\s+/g, '_');
  const empName    = (record.employee.employeeName || 'Employee').replace(/\s+/g, '_');
  const filename   = `${empName}_Payslip_${monthLabel}.pdf`;
  const blob       = doc.output('blob');

  return { blob, filename, password };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
