import { Transaction, AuditLogEntry } from '../types';
import { REPORT_META, TECHNICAL_NOTES } from '../data/initialData';
import { formatDateDMY } from './formatters';

export function generatePrintableHtml(transactions: Transaction[], auditLogs: AuditLogEntry[]): string {
  const totalReceipts = transactions.reduce((acc, t) => acc + (t.receipt || 0), 0);
  const totalPayments = transactions.reduce((acc, t) => acc + (t.payment || 0), 0);
  const totalBalance = transactions.reduce((acc, t) => acc + (t.movementBalance || 0), 0);

  const rowsHtml = transactions
    .map(
      (t) => `
      <tr>
        <td style="text-align: center; font-family: monospace; font-weight: bold; border: 1px solid #94a3b8; padding: 6px 8px;">${t.id}</td>
        <td style="font-family: monospace; border: 1px solid #94a3b8; padding: 6px 8px;">${formatDateDMY(t.date)}</td>
        <td style="font-family: monospace; font-weight: bold; color: #065f46; border: 1px solid #94a3b8; padding: 6px 8px;">${t.receipt > 0 ? t.receipt.toLocaleString('en-US') : '-'}</td>
        <td style="font-family: monospace; border: 1px solid #94a3b8; padding: 6px 8px;">${t.payment > 0 ? t.payment.toLocaleString('en-US') : '-'}</td>
        <td style="font-weight: 500; border: 1px solid #94a3b8; padding: 6px 8px;">${t.description || '-'}</td>
        <td style="font-family: monospace; font-weight: bold; color: #9f1239; border: 1px solid #94a3b8; padding: 6px 8px;">${t.movementBalance.toLocaleString('en-US')}</td>
        <td style="text-align: center; border: 1px solid #94a3b8; padding: 6px 8px;"><span style="display:inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; ${t.type === 'قبض' ? 'background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;' : 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;'}">${t.type}</span></td>
        <td style="font-weight: bold; border: 1px solid #94a3b8; padding: 6px 8px;">${t.accountName}</td>
        <td style="border: 1px solid #94a3b8; padding: 6px 8px;">${t.mainAccount}</td>
        <td style="border: 1px solid #94a3b8; padding: 6px 8px;">${t.closingAccount}</td>
        <td style="font-family: monospace; font-size: 10px; border: 1px solid #94a3b8; padding: 6px 8px;">${t.createdBy}</td>
      </tr>
    `
    )
    .join('');

  const auditHtml = auditLogs
    .slice(0, 5)
    .map(
      (log) => `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding: 4px 0; font-size: 11px;">
        <span style="font-family: monospace; color: #1e293b;">${log.rawAuditText}</span>
        <span style="font-family: monospace; color: #64748b;">حركة #${log.transactionId} | ${log.updatedAt}</span>
      </div>
    `
    )
    .join('');

  const notesHtml = TECHNICAL_NOTES.map(
    (n) => `
      <div style="border: 1px solid #cbd5e1; padding: 8px; border-radius: 6px; font-size: 11px;">
        <strong style="display: block; color: #0f172a; margin-bottom: 4px;">${n.title}</strong>
        <span style="color: #475569; line-height: 1.5;">${n.description}</span>
      </div>
    `
  ).join('');

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${REPORT_META.title} - ${REPORT_META.systemName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
    }
    body {
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.5;
    }
    @page {
      size: A4 landscape;
      margin: 12mm;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      margin-bottom: 12px;
      font-size: 11px;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      border: 1px solid #94a3b8;
      padding: 7px 6px;
      text-align: right;
    }
    .header-box {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div>
      <h1 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 800; color: #0f172a;">${REPORT_META.title}</h1>
      <p style="margin: 0; font-size: 12px; color: #475569; font-weight: 600;">${REPORT_META.systemName} | إدارة الحسابات العامة والرقابة المالية</p>
      <div style="margin-top: 6px; font-size: 11px; color: #334155;">
        <span>تاريخ الإصدار: <strong style="font-family: monospace;">${formatDateDMY(REPORT_META.reportDate)}</strong></span> |
        <span>العملة: <strong>الجنيه المصري (EGP)</strong></span> |
        <span>الحالة: <strong style="color: #065f46;">معتمد ومدقق آلياً</strong></span>
      </div>
    </div>
    <div style="border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-family: monospace; text-align: left;">
      <div>REF: ACUORA-ACC-20260902</div>
      <div>GENERATED: 2026-09-02 16:30</div>
      <div>USER: ${REPORT_META.defaultCreator}</div>
    </div>
  </div>

  <h2 style="font-size: 13px; font-weight: bold; color: #1e293b; margin: 12px 0 6px 0; border-right: 4px solid #2563eb; padding-right: 8px;">
    أولاً: ملخص الحركات المالية اليومية (سندات القبض والدفع)
  </h2>
  <table>
    <thead>
      <tr>
        <th style="text-align: center; width: 32px;">م</th>
        <th>التاريخ</th>
        <th>المقبوضات</th>
        <th>المدفوعات</th>
        <th>البيان</th>
        <th>رصيد الحركة</th>
        <th style="text-align: center;">نوع الحركة</th>
        <th>اسم الحساب</th>
        <th>الحساب الرئيسي</th>
        <th>الحساب الختامي</th>
        <th>منشئ الحركة</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
    <tfoot>
      <tr style="background-color: #e2e8f0; font-weight: bold; border-top: 2px solid #0f172a;">
        <td colspan="2" style="padding: 8px; text-align: center; border: 1px solid #94a3b8;">الإجمالي العام</td>
        <td style="padding: 8px; font-family: monospace; color: #065f46; border: 1px solid #94a3b8;">${totalReceipts.toLocaleString('en-US')} ج.م</td>
        <td style="padding: 8px; font-family: monospace; border: 1px solid #94a3b8;">${totalPayments > 0 ? `${totalPayments.toLocaleString('en-US')} ج.م` : '-'}</td>
        <td style="padding: 8px; color: #475569; border: 1px solid #94a3b8;">إجمالي حركات اليوم</td>
        <td style="padding: 8px; font-family: monospace; color: #9f1239; border: 1px solid #94a3b8;">${totalBalance.toLocaleString('en-US')} ج.م</td>
        <td colspan="5" style="padding: 8px; color: #475569; text-align: left; border: 1px solid #94a3b8;">مطابق لقيود اليومية في Acuora Soft</td>
      </tr>
    </tfoot>
  </table>

  <div style="margin-top: 14px;">
    <h2 style="font-size: 13px; font-weight: bold; color: #1e293b; margin: 0 0 6px 0; border-right: 4px solid #0f172a; padding-right: 8px;">
      ثانياً: سجل التدقيق والمطابقة (Audit Log)
    </h2>
    <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #f8fafc;">
      ${auditHtml}
    </div>
  </div>

  <div style="margin-top: 14px;">
    <h2 style="font-size: 13px; font-weight: bold; color: #1e293b; margin: 0 0 6px 0; border-right: 4px solid #0f172a; padding-right: 8px;">
      ثالثاً: الملاحظات والاعتمادات المحاسبية
    </h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 6px;">
      ${notesHtml}
    </div>
  </div>

  <div style="display: flex; justify-content: space-around; margin-top: 28px; padding-top: 16px; border-top: 1px solid #94a3b8; text-align: center; font-size: 11px;">
    <div>
      <span style="font-weight: bold; display: block; margin-bottom: 24px;">المحاسب المسؤول</span>
      <div style="font-family: monospace; color: #475569;">${REPORT_META.defaultCreator}</div>
    </div>
    <div>
      <span style="font-weight: bold; display: block; margin-bottom: 24px;">المراجع المالي</span>
      <div style="color: #475569;">مدقق ومعتمد بالنظام</div>
    </div>
    <div>
      <span style="font-weight: bold; display: block; margin-bottom: 24px;">الاعتماد العام والختم</span>
      <div style="color: #065f46; font-weight: bold;">✓ Acuora Soft Verified</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Triggers a bulletproof print operation using a dedicated hidden iframe.
 * If the iframe print is restricted by browser security policies,
 * it safely falls back to window.print() or opening in a temporary window.
 */
export function executePrintDocument(transactions: Transaction[], auditLogs: AuditLogEntry[]): void {
  const html = generatePrintableHtml(transactions, auditLogs);

  try {
    const iframe = document.createElement('iframe');
    iframe.id = 'acuora-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    iframe.style.border = '0';
    iframe.style.opacity = '0.001';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-99999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.warn('Iframe print error, falling back to window.print:', printErr);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 4000);
        }
      }, 500);
      return;
    }
  } catch (err) {
    console.warn('Iframe print creation failed:', err);
  }

  // Fallback
  try {
    window.print();
  } catch (err) {
    console.warn('Direct print failed:', err);
  }
}

/**
 * Generates an official accounting receipt voucher (سند قبض / سند صرف مالي)
 */
export function generatePrintableVoucherHtml(transaction: Transaction): string {
  const isReceipt = transaction.type === 'قبض';
  const amount = isReceipt ? (transaction.receipt || 0) : (transaction.payment || 0);
  const voucherTitle = isReceipt ? 'سند قبض مالي' : 'سند صرف مالي';
  const voucherColor = isReceipt ? '#065f46' : '#1e40af';

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${voucherTitle} #${transaction.id} - ${REPORT_META.systemName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Cairo', Tahoma, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background: #ffffff;
      font-size: 13px;
    }
    .voucher-card {
      max-width: 680px;
      margin: 0 auto;
      border: 2px solid ${voucherColor};
      border-radius: 12px;
      padding: 24px;
      position: relative;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .title-box {
      text-align: center;
    }
    .title-box h1 {
      margin: 0;
      font-size: 20px;
      color: ${voucherColor};
    }
    .title-box span {
      font-size: 12px;
      color: #64748b;
    }
    .meta-box {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      text-align: left;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .grid-table th, .grid-table td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: right;
    }
    .grid-table th {
      background: #f8fafc;
      color: #475569;
      width: 28%;
    }
    .grid-table td {
      font-weight: 600;
    }
    .amount-banner {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .amount-value {
      font-size: 20px;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      color: ${voucherColor};
    }
    .signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #cbd5e1;
      text-align: center;
    }
    .sig-block {
      font-size: 12px;
      color: #475569;
    }
    .sig-line {
      margin-top: 32px;
      border-bottom: 1px dashed #94a3b8;
    }
  </style>
</head>
<body>
  <div class="voucher-card">
    <div class="header">
      <div>
        <div style="font-weight: 800; font-size: 16px;">${REPORT_META.systemName}</div>
        <div style="font-size: 11px; color: #64748b;">${REPORT_META.title}</div>
      </div>
      <div class="title-box">
        <h1>${voucherTitle}</h1>
        <span>قيد رقم #${transaction.id}</span>
      </div>
      <div class="meta-box">
        <div>التاريخ: ${formatDateDMY(transaction.date)}</div>
        <div>النظام: ${REPORT_META.systemName}</div>
      </div>
    </div>

    <div class="amount-banner">
      <div>المبلغ المطلوب إثباته:</div>
      <div class="amount-value">${amount.toLocaleString('en-US')} ج.م</div>
    </div>

    <table class="grid-table">
      <tr>
        <th>اسم الحساب</th>
        <td>${transaction.accountName}</td>
      </tr>
      <tr>
        <th>البيان والتفاصيل</th>
        <td>${transaction.description || '-'}</td>
      </tr>
      <tr>
        <th>الحساب الرئيسي</th>
        <td>${transaction.mainAccount}</td>
      </tr>
      <tr>
        <th>الحساب الختامي</th>
        <td>${transaction.closingAccount}</td>
      </tr>
      <tr>
        <th>رصيد الحركة</th>
        <td style="font-family: monospace; color: #b91c1c;">${transaction.movementBalance.toLocaleString('en-US')} ج.م</td>
      </tr>
      <tr>
        <th>منشئ السند</th>
        <td style="font-size: 11px;">${transaction.createdBy}</td>
      </tr>
    </table>

    <div class="signatures">
      <div class="sig-block">
        <div>توقيع أمين الصندوق</div>
        <div class="sig-line"></div>
      </div>
      <div class="sig-block">
        <div>المحاسب المعتمد</div>
        <div class="sig-line"></div>
      </div>
      <div class="sig-block">
        <div>توقيع المستلم</div>
        <div class="sig-line"></div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Triggers printing of a single transaction voucher receipt.
 */
export function executePrintVoucher(transaction: Transaction): void {
  const html = generatePrintableVoucherHtml(transaction);

  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (e) {
          console.warn('PrintWindow print error:', e);
        }
      }, 500);
      return;
    }
  } catch (windowErr) {
    console.warn('window.open was blocked, trying iframe:', windowErr);
  }

  try {
    const iframe = document.createElement('iframe');
    iframe.id = 'acuora-voucher-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    iframe.style.border = '0';
    iframe.style.opacity = '0.001';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-99999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.warn('Iframe print error, falling back to window.print:', printErr);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 4000);
        }
      }, 500);
      return;
    }
  } catch (err) {
    console.warn('Iframe print creation failed:', err);
  }

  // Fallback
  try {
    window.print();
  } catch (err) {
    console.warn('Direct print failed:', err);
  }
}

export interface StatementPrintData {
  accountName: string;
  accountCode?: string;
  accountType?: string;
  fromDate?: string;
  toDate?: string;
  movementFilter?: 'all' | 'debit' | 'credit';
  statementRows: {
    serial: number | string;
    date: string;
    debit: number;
    credit: number;
    description: string;
    runningBalance: number;
    type: string;
    isOpening?: boolean;
  }[];
  totalDebit: number;
  totalCredit: number;
  accountBalance: number;
}

/**
 * Generates official printable HTML for an Account Statement (كشف حساب مالي)
 */
export function generatePrintableStatementHtml(data: StatementPrintData): string {
  const movementFilterLabel =
    data.movementFilter === 'debit'
      ? 'الحركات المدينة فقط'
      : data.movementFilter === 'credit'
      ? 'الحركات الدائنة فقط'
      : 'جميع الحركات';

  const rowsHtml = data.statementRows
    .map(
      (r) => `
      <tr style="${r.isOpening ? 'background-color: #fef3c7;' : ''}">
        <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; font-family: monospace;">${r.serial}</td>
        <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; font-family: monospace;">${formatDateDMY(r.date)}</td>
        <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; font-family: monospace; font-weight: bold; color: #0f172a;">${r.debit > 0 ? r.debit.toLocaleString('en-US') : '-'}</td>
        <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; font-family: monospace; font-weight: bold; color: #065f46;">${r.credit > 0 ? r.credit.toLocaleString('en-US') : '-'}</td>
        <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: right;">${r.isOpening ? `<strong>[رصيد افتتاحي]</strong> ` : ''}${r.description || '-'}</td>
        <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; font-family: monospace; font-weight: bold; color: ${r.runningBalance < 0 ? '#9f1239' : '#0f172a'};">${r.runningBalance.toLocaleString('en-US')}</td>
        <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center;"><span style="display:inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; ${r.type === 'قبض' ? 'background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;' : r.type === 'دفع' ? 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;' : 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;'}">${r.type}</span></td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>كشف حساب مالي - ${data.accountName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
    }
    body {
      margin: 0;
      padding: 20px;
      color: #0f172a;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.5;
    }
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 12px;
      font-size: 11px;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      border: 1px solid #94a3b8;
      padding: 7px 8px;
    }
    .header-box {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 14px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      font-size: 11px;
    }
    .info-item strong {
      color: #1e293b;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div>
      <h1 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 800; color: #0f172a;">${REPORT_META.systemName}</h1>
      <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: #2563eb;">كشف حساب مالي تفصيلي (Account Statement)</h2>
      <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">إدارة الحسابات العامة - تقرير مطابقة حركة الحساب المالي</p>
    </div>
    <div style="border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-family: monospace; text-align: left;">
      <div>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</div>
      <div>نظام: Acuora Soft v2.4</div>
    </div>
  </div>

  <div class="info-card">
    <div class="info-item"><strong>اسم الحساب:</strong> ${data.accountName}</div>
    <div class="info-item"><strong>كود الحساب:</strong> ${data.accountCode || '-'}</div>
    <div class="info-item"><strong>تصنيف الحساب:</strong> ${data.accountType || 'عملاء'}</div>
    <div class="info-item"><strong>من تاريخ:</strong> ${data.fromDate ? formatDateDMY(data.fromDate) : 'البداية'}</div>
    <div class="info-item"><strong>إلى تاريخ:</strong> ${data.toDate ? formatDateDMY(data.toDate) : 'النهاية'}</div>
    <div class="info-item"><strong>نوع الحركات:</strong> ${movementFilterLabel}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 45px; text-align: center;">مسلسل</th>
        <th style="width: 85px; text-align: center;">التاريخ</th>
        <th style="width: 95px; text-align: left;">مدين</th>
        <th style="width: 95px; text-align: left;">دائن</th>
        <th style="text-align: right;">البيان</th>
        <th style="width: 100px; text-align: left;">رصيد الحركة</th>
        <th style="width: 75px; text-align: center;">نوع الحركة</th>
      </tr>
    </thead>
    <tbody>
      ${data.statementRows.length === 0 ? `
        <tr>
          <td colspan="7" style="border: 1px solid #94a3b8; padding: 24px; text-align: center; color: #64748b;">
            لا توجد حركات مسجلة لهذا الحساب خلال الفترة المحددة
          </td>
        </tr>
      ` : rowsHtml}
    </tbody>
    <tfoot>
      <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a;">
        <td colspan="2" style="border: 1px solid #94a3b8; padding: 8px; text-align: center;">الإجماليات</td>
        <td style="border: 1px solid #94a3b8; padding: 8px; text-align: left; font-family: monospace; font-size: 12px; color: #0f172a;">${data.totalDebit.toLocaleString('en-US')} ج.م</td>
        <td style="border: 1px solid #94a3b8; padding: 8px; text-align: left; font-family: monospace; font-size: 12px; color: #065f46;">${data.totalCredit.toLocaleString('en-US')} ج.م</td>
        <td style="border: 1px solid #94a3b8; padding: 8px; text-align: right;">صافي رصيد الحساب:</td>
        <td colspan="2" style="border: 1px solid #94a3b8; padding: 8px; text-align: left; font-family: monospace; font-size: 12px; color: ${data.accountBalance < 0 ? '#9f1239' : '#0f172a'};">
          ${Math.abs(data.accountBalance).toLocaleString('en-US')} ج.م (${data.accountBalance > 0 ? 'مدين' : data.accountBalance < 0 ? 'دائن' : 'متزن'})
        </td>
      </tr>
    </tfoot>
  </table>

  <div style="display: flex; justify-content: space-between; margin-top: 36px; padding-top: 14px; border-top: 1px dashed #94a3b8; text-align: center; font-size: 11px;">
    <div style="width: 200px;">
      <span style="font-weight: bold; display: block; margin-bottom: 24px;">المحاسب المسؤول</span>
      <div style="color: #64748b;">..........................................</div>
    </div>
    <div style="width: 200px;">
      <span style="font-weight: bold; display: block; margin-bottom: 24px;">المراجع المالي</span>
      <div style="color: #64748b;">..........................................</div>
    </div>
    <div style="width: 200px;">
      <span style="font-weight: bold; display: block; margin-bottom: 24px;">اعتماد الإدارة المالية والختم</span>
      <div style="color: #065f46; font-weight: bold;">✓ معتمد ومطابق دفترياً</div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      window.focus();
      setTimeout(function() {
        try {
          window.print();
        } catch (e) {
          console.warn('Auto print failed:', e);
        }
      }, 300);
    });
  </script>
</body>
</html>
  `.trim();
}

/**
 * Triggers printing of Account Statement using an isolated hidden iframe
 * with automatic fallback to popup window and in-app print.
 */
export function executePrintStatementReport(data: StatementPrintData): void {
  const html = generatePrintableStatementHtml(data);

  // Method 1: If in-page document exists, trigger in-page print with body class
  const hasStatementModal = document.getElementById('statement-printable-document') !== null;
  const hasStatementView = document.getElementById('view-statement-printable-document') !== null;

  if (hasStatementModal || hasStatementView) {
    const bodyClass = hasStatementModal ? 'printing-statement-modal' : 'printing-statement-view';
    const cleanup = () => {
      document.body.classList.remove('printing-statement');
      document.body.classList.remove('printing-statement-modal');
      document.body.classList.remove('printing-statement-view');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    document.body.classList.add('printing-statement');
    document.body.classList.add(bodyClass);

    try {
      window.print();
      setTimeout(cleanup, 2500);
      return;
    } catch (directPrintErr) {
      console.warn('Direct window.print failed, attempting iframe/popup fallback:', directPrintErr);
      cleanup();
    }
  }

  // Method 2: Isolated layout-visible iframe
  try {
    const iframe = document.createElement('iframe');
    iframe.id = 'statement-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    iframe.style.border = '0';
    iframe.style.opacity = '0.001';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-99999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.warn('Iframe print error, falling back to popup:', printErr);
          fallbackPrintWindow(html);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 6000);
        }
      }, 400);
      return;
    }
  } catch (err) {
    console.warn('Iframe print creation failed:', err);
  }

  // Fallback
  fallbackPrintWindow(html);
}

/**
 * Open statement in a dedicated new window/tab for printing or PDF export
 */
export function openStatementInNewWindow(data: StatementPrintData): void {
  const html = generatePrintableStatementHtml(data);
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      return;
    }
  } catch (e) {
    console.warn('Direct popup blocked:', e);
  }

  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (err) {
    console.warn('Blob window open failed:', err);
    executePrintStatementReport(data);
  }
}

function fallbackPrintWindow(html: string): void {
  try {
    const printWindow = window.open('', '_blank', 'width=950,height=750');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (e) {
          console.warn(e);
        }
      }, 500);
      return;
    }
  } catch (popupErr) {
    console.warn('Popup print blocked:', popupErr);
  }

  // Ultimate fallback
  try {
    document.body.classList.add('printing-statement');
    window.print();
  } catch (err) {
    console.warn('Direct print failed:', err);
  } finally {
    setTimeout(() => {
      document.body.classList.remove('printing-statement');
    }, 2000);
  }
}
