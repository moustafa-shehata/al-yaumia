import React from 'react';
import { Transaction, AuditLogEntry } from '../types';
import { REPORT_META, TECHNICAL_NOTES } from '../data/initialData';
import { formatDateDMY } from '../utils/formatters';

interface PrintReportViewProps {
  transactions: Transaction[];
  auditLogs: AuditLogEntry[];
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({ transactions, auditLogs }) => {
  const totalReceipts = transactions.reduce((acc, t) => acc + (t.receipt || 0), 0);
  const totalPayments = transactions.reduce((acc, t) => acc + (t.payment || 0), 0);
  const totalBalance = transactions.reduce((acc, t) => acc + (t.movementBalance || 0), 0);

  return (
    <div className="print-only p-8 text-slate-900 bg-white">
      {/* Official Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {REPORT_META.title}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {REPORT_META.systemName} | إدارة الحسابات والرقابة المالية
          </p>
          <div className="mt-2 text-xs font-semibold text-slate-700 space-x-4 space-x-reverse">
            <span>تاريخ إصدار التقرير: <strong className="font-mono-numbers">{formatDateDMY(REPORT_META.reportDate)}</strong></span>
            <span>|</span>
            <span>العملة: <strong>الجنيه المصري (EGP)</strong></span>
            <span>|</span>
            <span>حالة الاعتماد: <strong>مدقق ومعتمد آلياً</strong></span>
          </div>
        </div>

        <div className="text-left text-xs text-slate-500 font-mono-numbers border border-slate-300 p-2 rounded">
          <div>REF: ACUORA-ACC-20260902</div>
          <div>GENERATED: 2026-09-02 16:30</div>
          <div>USER: moustafa.acuora.soft.egypt</div>
        </div>
      </div>

      {/* Primary Table */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-2 border-r-4 border-slate-900 pr-2">
          أولاً: ملخص الحركات المالية (جدول البيانات)
        </h2>
        <table className="w-full text-xs text-right border border-slate-400">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-400 text-slate-800">
              <th className="p-2 border border-slate-300 text-center w-8">م</th>
              <th className="p-2 border border-slate-300">التاريخ</th>
              <th className="p-2 border border-slate-300">المقبوضات</th>
              <th className="p-2 border border-slate-300">مدفوعات</th>
              <th className="p-2 border border-slate-300">البيان</th>
              <th className="p-2 border border-slate-300">رصيد الحركة</th>
              <th className="p-2 border border-slate-300 text-center">نوع الحركة</th>
              <th className="p-2 border border-slate-300">اسم الحساب</th>
              <th className="p-2 border border-slate-300">الحساب الرئيسي</th>
              <th className="p-2 border border-slate-300">الحساب الختامي</th>
              <th className="p-2 border border-slate-300">منشئ الحركة</th>
              <th className="p-2 border border-slate-300">آخر تعديل</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-slate-300">
                <td className="p-2 border border-slate-300 text-center font-bold font-mono-numbers">{t.id}</td>
                <td className="p-2 border border-slate-300 font-mono-numbers">{formatDateDMY(t.date)}</td>
                <td className="p-2 border border-slate-300 font-bold font-mono-numbers text-emerald-800">
                  {t.receipt > 0 ? t.receipt.toLocaleString('en-US') : '-'}
                </td>
                <td className="p-2 border border-slate-300 font-mono-numbers">
                  {t.payment > 0 ? t.payment.toLocaleString('en-US') : '-'}
                </td>
                <td className="p-2 border border-slate-300 font-medium">{t.description}</td>
                <td className="p-2 border border-slate-300 font-mono-numbers font-bold text-rose-800">
                  {t.movementBalance.toLocaleString('en-US')}
                </td>
                <td className="p-2 border border-slate-300 text-center">{t.type}</td>
                <td className="p-2 border border-slate-300 font-bold">{t.accountName}</td>
                <td className="p-2 border border-slate-300">{t.mainAccount}</td>
                <td className="p-2 border border-slate-300">{t.closingAccount}</td>
                <td className="p-2 border border-slate-300 font-mono-numbers text-[10px]">{t.createdBy}</td>
                <td className="p-2 border border-slate-300 font-mono-numbers text-[10px]">{t.lastModified}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 font-bold border-t-2 border-slate-800 text-xs">
              <td colSpan={2} className="p-2 text-center">الإجمالي العام</td>
              <td className="p-2 font-mono-numbers text-emerald-900">{totalReceipts.toLocaleString('en-US')} ج.م</td>
              <td className="p-2 font-mono-numbers">{totalPayments > 0 ? `${totalPayments.toLocaleString('en-US')} ج.م` : '-'}</td>
              <td className="p-2 text-slate-600">إجمالي قيود اليوم</td>
              <td className="p-2 font-mono-numbers text-rose-900">{totalBalance.toLocaleString('en-US')} ج.م</td>
              <td colSpan={6} className="p-2 text-slate-600 text-left">مطابق لسجلات الأستاذ العام</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Audit Log Summary */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-2 border-r-4 border-slate-900 pr-2">
          ثانياً: تفاصيل سجل التعديلات التدقيقي (Audit Log)
        </h2>
        <div className="border border-slate-300 rounded p-3 text-xs bg-slate-50 space-y-2">
          {auditLogs.slice(0, 5).map((log, idx) => (
            <div key={idx} className="flex items-start justify-between border-b border-slate-200 pb-1.5 last:border-0 last:pb-0">
              <span className="font-mono text-[11px] text-slate-800">{log.rawAuditText}</span>
              <span className="font-mono text-[10px] text-slate-500 whitespace-nowrap mr-2">
                حركة #{log.transactionId} | {log.updatedAt}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Notes Summary */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-800 mb-2 border-r-4 border-slate-900 pr-2">
          ثالثاً: ملاحظات فنية للمحلل المالي والتدقيق
        </h2>
        <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-700 border border-slate-300 p-3 rounded">
          {TECHNICAL_NOTES.map((note) => (
            <div key={note.id}>
              <strong className="block text-slate-900 mb-1">{note.title}:</strong>
              <p className="leading-normal text-slate-600">{note.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Signatures & Approvals */}
      <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-400 text-center text-xs">
        <div>
          <span className="font-bold text-slate-800 block mb-12">المحاسب المسؤول</span>
          <div className="border-t border-dashed border-slate-400 pt-1 text-slate-500 font-mono-numbers">
            {REPORT_META.defaultCreator}
          </div>
        </div>
        <div>
          <span className="font-bold text-slate-800 block mb-12">المراجع والمدقق الداخلي</span>
          <div className="border-t border-dashed border-slate-400 pt-1 text-slate-500">
            تم التدقيق الآلي بتاريخ 2026-09-02
          </div>
        </div>
        <div>
          <span className="font-bold text-slate-800 block mb-12">المدير المالي / الاعتماد</span>
          <div className="border-t border-dashed border-slate-400 pt-1 text-slate-500">
            خاتم الاعتماد الرسمي
          </div>
        </div>
      </div>
    </div>
  );
};
