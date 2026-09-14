import React, { useState } from 'react';
import { Printer, X, CheckCircle2, ExternalLink, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { Transaction, AuditLogEntry } from '../types';
import { REPORT_META, TECHNICAL_NOTES } from '../data/initialData';
import { formatDateDMY } from '../utils/formatters';
import { executePrintDocument, generatePrintableHtml } from '../utils/printHelper';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  auditLogs: AuditLogEntry[];
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  transactions,
  auditLogs,
}) => {
  const [printSuccess, setPrintSuccess] = useState(false);

  if (!isOpen) return null;

  const totalReceipts = transactions.reduce((acc, t) => acc + (t.receipt || 0), 0);
  const totalPayments = transactions.reduce((acc, t) => acc + (t.payment || 0), 0);
  const totalBalance = transactions.reduce((acc, t) => acc + (t.movementBalance || 0), 0);

  const handlePrintNow = () => {
    executePrintDocument(transactions, auditLogs);
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 3000);
  };

  const handleOpenStandalonePrint = () => {
    try {
      const html = generatePrintableHtml(transactions, auditLogs);
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
            console.warn(e);
          }
        }, 500);
      } else {
        executePrintDocument(transactions, auditLogs);
      }
    } catch (err) {
      console.warn('Popup print blocked, falling back:', err);
      executePrintDocument(transactions, auditLogs);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="bg-[#f0f6fc] rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col border border-[#bcd2e8] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Control Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#003e73] via-[#005a9e] to-[#0078d4] text-white flex flex-wrap items-center justify-between gap-3 border-b border-[#004e8c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl text-white shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  معاينة طباعة التقرير المالي الرسمي
                </h3>
                <span className="text-[10px] bg-emerald-500/30 text-white border border-emerald-400/40 px-2 py-0.5 rounded font-mono-numbers font-bold">
                  A4 Landscape
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                {REPORT_META.systemName} - مجهز للطباعة المباشرة وحفظ ملفات PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Print Button */}
            <button
              onClick={handlePrintNow}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة المستند الآن</span>
            </button>

            {/* Standalone Window Print */}
            <button
              onClick={handleOpenStandalonePrint}
              className="hidden sm:flex px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer"
              title="فتح في نافذة مستقلة للطباعة في حال قيود التصفح"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
              <span>نافذة طباعة مستقلة</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-blue-100 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {printSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>تم إرسال أمر الطباعة إلى الطابعة أو نافذة حفظ PDF بنجاح!</span>
          </div>
        )}

        {/* Printable Document A4 Canvas Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#edf3f8] flex justify-center">
          <div
            id="printable-official-document"
            className="w-full max-w-4xl bg-white shadow-md border border-slate-300 rounded-lg p-6 sm:p-8 text-slate-900 select-text"
          >
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {REPORT_META.title}
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  {REPORT_META.systemName} | إدارة الحسابات والرقابة المالية
                </p>
                <div className="mt-2 text-xs text-slate-700 flex flex-wrap items-center gap-2 font-semibold">
                  <span>تاريخ اليومية: <strong className="font-mono-numbers">{formatDateDMY(REPORT_META.reportDate)}</strong></span>
                  <span>|</span>
                  <span>العملة: <strong>الجنيه المصري (EGP)</strong></span>
                  <span>|</span>
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    معتمد ومدقق آلياً
                  </span>
                </div>
              </div>

              <div className="text-left text-xs text-slate-600 font-mono-numbers border border-slate-300 p-2.5 rounded bg-slate-50 self-start">
                <div>REF: ACUORA-ACC-20260902</div>
                <div>GENERATED: 2026-09-02 16:30</div>
                <div>USER: {REPORT_META.defaultCreator}</div>
              </div>
            </div>

            {/* Section 1: Transactions Table */}
            <div className="mb-6">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 mb-2 border-r-4 border-blue-600 pr-2">
                أولاً: بيان الحركات اليومية المسجلة (سندات القبض والدفع)
              </h2>
              <div className="overflow-x-auto border border-slate-300 rounded">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-300 text-slate-800">
                      <th className="p-2 border border-slate-300 text-center w-8">م</th>
                      <th className="p-2 border border-slate-300">التاريخ</th>
                      <th className="p-2 border border-slate-300">المقبوضات</th>
                      <th className="p-2 border border-slate-300">المدفوعات</th>
                      <th className="p-2 border border-slate-300">البيان</th>
                      <th className="p-2 border border-slate-300">رصيد الحركة</th>
                      <th className="p-2 border border-slate-300 text-center">نوع الحركة</th>
                      <th className="p-2 border border-slate-300">اسم الحساب</th>
                      <th className="p-2 border border-slate-300">الحساب الرئيسي</th>
                      <th className="p-2 border border-slate-300">الحساب الختامي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-slate-200 hover:bg-slate-50/60">
                        <td className="p-2 border border-slate-300 text-center font-bold font-mono-numbers">{t.id}</td>
                        <td className="p-2 border border-slate-300 font-mono-numbers">{formatDateDMY(t.date)}</td>
                        <td className="p-2 border border-slate-300 font-bold font-mono-numbers text-emerald-800">
                          {t.receipt > 0 ? t.receipt.toLocaleString('en-US') : '-'}
                        </td>
                        <td className="p-2 border border-slate-300 font-mono-numbers text-amber-800">
                          {t.payment > 0 ? t.payment.toLocaleString('en-US') : '-'}
                        </td>
                        <td className="p-2 border border-slate-300 font-medium">{t.description}</td>
                        <td className="p-2 border border-slate-300 font-mono-numbers font-bold text-rose-800">
                          {t.movementBalance.toLocaleString('en-US')}
                        </td>
                        <td className="p-2 border border-slate-300 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            t.type === 'قبض' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-300 font-bold">{t.accountName}</td>
                        <td className="p-2 border border-slate-300">{t.mainAccount}</td>
                        <td className="p-2 border border-slate-300">{t.closingAccount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200 font-bold border-t-2 border-slate-800 text-xs">
                      <td colSpan={2} className="p-2.5 text-center">الإجمالي العام</td>
                      <td className="p-2.5 font-mono-numbers text-emerald-900">{totalReceipts.toLocaleString('en-US')} ج.م</td>
                      <td className="p-2.5 font-mono-numbers text-amber-900">{totalPayments > 0 ? `${totalPayments.toLocaleString('en-US')} ج.م` : '-'}</td>
                      <td className="p-2.5 text-slate-600">إجمالي قيود اليوم</td>
                      <td className="p-2.5 font-mono-numbers text-rose-900">{totalBalance.toLocaleString('en-US')} ج.م</td>
                      <td colSpan={4} className="p-2.5 text-slate-600 text-left">
                        مطابق لقيود اليومية في Acuora Soft
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Section 2: Audit Logs */}
            <div className="mb-6">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 mb-2 border-r-4 border-slate-900 pr-2">
                ثانياً: سجل التدقيق والمطابقة (Audit Log)
              </h2>
              <div className="border border-slate-300 rounded p-3 text-xs bg-slate-50 space-y-1.5">
                {auditLogs.slice(0, 5).map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-slate-200 pb-1 last:border-0 last:pb-0">
                    <span className="font-mono text-[11px] text-slate-800">{log.rawAuditText}</span>
                    <span className="font-mono text-[10px] text-slate-500 mr-2 whitespace-nowrap">
                      حركة #{log.transactionId} | {log.updatedAt}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Technical Notes */}
            <div className="mb-6">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 mb-2 border-r-4 border-slate-900 pr-2">
                ثالثاً: الملاحظات المحاسبية الفنية
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-700 border border-slate-300 p-3 rounded bg-slate-50/50">
                {TECHNICAL_NOTES.map((note) => (
                  <div key={note.id}>
                    <strong className="block text-slate-900 mb-1">{note.title}:</strong>
                    <p className="leading-relaxed text-slate-600">{note.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-300 text-center text-xs">
              <div>
                <span className="font-bold text-slate-800 block mb-10">المحاسب المسؤول</span>
                <div className="border-t border-dashed border-slate-400 pt-1 text-slate-600 font-mono-numbers">
                  {REPORT_META.defaultCreator}
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-800 block mb-10">المراجع المالي</span>
                <div className="border-t border-dashed border-slate-400 pt-1 text-slate-600">
                  مدقق ومعتمد بالنظام
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-800 block mb-10">الاعتماد العام والختم</span>
                <div className="border-t border-dashed border-slate-400 pt-1 text-emerald-800 font-bold">
                  ✓ Acuora Soft Official Seal
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-3 bg-[#f0f6fc] border-t border-[#bcd2e8] flex items-center justify-between text-xs text-[#1e3a5f]">
          <div className="flex items-center gap-1.5 text-[#55789e]">
            <FileSpreadsheet className="w-4 h-4 text-[#0078d4]" />
            <span>جاهز للإرسال للطباعة أو الحفظ كملف PDF</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-[#eaf2fb] border border-[#bcd2e8] text-[#0f2d52] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            إغلاق المعاينة
          </button>
        </div>
      </div>
    </div>
  );
};
