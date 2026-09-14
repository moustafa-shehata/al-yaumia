import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  FileText,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { Transaction } from '../types';
import { REPORT_META } from '../data/initialData';
import { formatDateDMY, tafqeetArabic } from '../utils/formatters';
import { generatePrintableVoucherHtml } from '../utils/printHelper';

interface VoucherPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const VoucherPrintModal: React.FC<VoucherPrintModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const [copied, setCopied] = useState(false);
  const [printed, setPrinted] = useState(false);

  if (!isOpen || !transaction) return null;

  const isReceipt = (transaction.receipt || 0) > 0;
  const isPayment = (transaction.payment || 0) > 0;
  const amount = isReceipt
    ? transaction.receipt
    : isPayment
    ? transaction.payment
    : Math.abs(transaction.movementBalance || 0);

  const voucherTitle = isReceipt
    ? 'سند قبض مالي (رسمي)'
    : isPayment
    ? 'سند صرف مالي (رسمي)'
    : 'سند قيد حركة مالية';

  const voucherCode = isReceipt
    ? `REC-20260901-${String(transaction.id).padStart(3, '0')}`
    : isPayment
    ? `PAY-20260901-${String(transaction.id).padStart(3, '0')}`
    : `VCH-20260901-${String(transaction.id).padStart(3, '0')}`;

  const amountInWords = tafqeetArabic(amount);

  // Direct In-App Print
  const handlePrint = () => {
    try {
      document.body.classList.add('printing-voucher');
      window.print();
      setPrinted(true);
      setTimeout(() => setPrinted(false), 3000);
    } catch (err) {
      console.warn('Direct print failed, using popup:', err);
      handleOpenInNewTab();
    } finally {
      setTimeout(() => {
        document.body.classList.remove('printing-voucher');
      }, 500);
    }
  };

  // Open in Standalone Tab
  const handleOpenInNewTab = () => {
    try {
      const html = generatePrintableVoucherHtml(transaction);
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
        window.print();
      }
    } catch (err) {
      console.warn('Popup print blocked:', err);
      window.print();
    }
  };

  const handleCopySummary = () => {
    const text = `
=== ${voucherTitle} ===
كود السند: ${voucherCode}
رقم الحركة: ${transaction.id}
التاريخ: ${formatDateDMY(transaction.date)}
اسم الحساب: ${transaction.accountName}
المبلغ: ${amount.toLocaleString('en-US')} ج.م (${amountInWords})
البيان: ${transaction.description || '-'}
رصيد الحركة: ${transaction.movementBalance.toLocaleString('en-US')} ج.م
النظام: ${REPORT_META.systemName}
    `.trim();

    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      id="voucher-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#f0f6fc] rounded-xl shadow-2xl w-full max-w-3xl my-auto border border-[#bcd2e8] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Control Header */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-[#003e73] via-[#005a9e] to-[#0078d4] text-white flex items-center justify-between gap-3 border-b border-[#004e8c] no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg text-white shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  معاينة وطباعة السند المالي
                </h3>
                <span className="text-[10px] bg-white/20 text-white border border-white/30 px-2 py-0.5 rounded font-mono-numbers font-bold">
                  {voucherCode}
                </span>
              </div>
              <p className="text-xs text-blue-100">
                سند محاسبي معتمد بنظام {REPORT_META.systemName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="p-1.5 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
              title="نسخ ملخص السند"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'تم النسخ' : 'نسخ'}</span>
            </button>

            {/* Standalone Window Print */}
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="p-1.5 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
              title="فتح السند بنافذة جديدة للطباعة أو التصدير PDF"
            >
              <ExternalLink className="w-4 h-4 text-blue-200" />
              <span className="hidden sm:inline">نافذة جديدة</span>
            </button>

            {/* Primary Print Button */}
            <button
              type="button"
              id="btn-print-voucher-now"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/30 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{printed ? 'جاري الطباعة...' : 'طباعة السند الآن'}</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-blue-100 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              title="إغلاق المعاينة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Voucher Body */}
        <div className="p-4 sm:p-8 bg-[#edf3f8] overflow-y-auto max-h-[75vh]">
          <div 
            id="printable-voucher-area"
            className="bg-white rounded-xl shadow-sm border border-slate-300 p-6 sm:p-8 max-w-2xl mx-auto text-slate-900 font-sans"
          >
            {/* Voucher Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    A
                  </div>
                  <span className="font-extrabold text-slate-900 text-base">
                    {REPORT_META.systemName}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {REPORT_META.systemName} - قسم الحسابات والمالية
                </p>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  السجل المحاسبي المركزي - القاهرة، جمهورية مصر العربية
                </div>
              </div>

              <div className="text-left font-mono-numbers text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 flex items-center justify-end gap-1.5">
                  <span>{voucherCode}</span>
                  <span className="text-slate-400 font-sans">:الكود</span>
                </div>
                <div className="text-slate-600 mt-1 flex items-center justify-end gap-1.5">
                  <span>{formatDateDMY(transaction.date)}</span>
                  <span className="text-slate-400 font-sans">:التاريخ</span>
                </div>
                <div className="text-slate-600 mt-0.5 flex items-center justify-end gap-1.5">
                  <span>#{transaction.id}</span>
                  <span className="text-slate-400 font-sans">:رقم الحركة</span>
                </div>
              </div>
            </div>

            {/* Voucher Title */}
            <div className="text-center my-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight inline-block px-4 py-1 border-b-2 border-slate-400">
                {voucherTitle}
              </h2>
            </div>

            {/* Amount Banner */}
            <div className="my-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs text-slate-500 font-medium">المبلغ المطلوب إثباته:</div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">
                  {amountInWords}
                </div>
              </div>
              <div 
                className="text-xl sm:text-2xl font-black font-mono-numbers text-emerald-700 self-end sm:self-center"
                dir="ltr"
              >
                {amount.toLocaleString('en-US')} <span className="text-xs font-bold font-sans text-slate-500">ج.م</span>
              </div>
            </div>

            {/* Transaction Grid Details */}
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs sm:text-sm mb-6">
              <div className="grid grid-cols-3 border-b border-slate-200">
                <div className="p-2.5 bg-slate-100 font-bold text-slate-700 col-span-1 border-l border-slate-200">
                  اسم الحساب / العميل
                </div>
                <div className="p-2.5 text-slate-900 font-bold col-span-2">
                  {transaction.accountName}
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-slate-200">
                <div className="p-2.5 bg-slate-100 font-bold text-slate-700 col-span-1 border-l border-slate-200">
                  البيان والتفاصيل
                </div>
                <div className="p-2.5 text-slate-800 col-span-2">
                  {transaction.description || '-'}
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-slate-200">
                <div className="p-2.5 bg-slate-100 font-bold text-slate-700 col-span-1 border-l border-slate-200">
                  نوع الحركة
                </div>
                <div className="p-2.5 text-slate-800 col-span-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                    isReceipt ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {transaction.type || 'قبض'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-slate-200">
                <div className="p-2.5 bg-slate-100 font-bold text-slate-700 col-span-1 border-l border-slate-200">
                  الحساب الرئيسي / الختامي
                </div>
                <div className="p-2.5 text-slate-800 col-span-2">
                  {transaction.mainAccount} / {transaction.closingAccount}
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-slate-200">
                <div className="p-2.5 bg-slate-100 font-bold text-slate-700 col-span-1 border-l border-slate-200">
                  رصيد الحركة
                </div>
                <div 
                  className="p-2.5 font-mono-numbers font-bold text-rose-700 col-span-2"
                  dir="ltr"
                >
                  {transaction.movementBalance.toLocaleString('en-US')} ج.م
                </div>
              </div>

              <div className="grid grid-cols-3">
                <div className="p-2.5 bg-slate-100 font-bold text-slate-700 col-span-1 border-l border-slate-200">
                  المستخدم ومنشئ السند
                </div>
                <div className="p-2.5 text-slate-500 font-mono-numbers text-xs col-span-2">
                  {transaction.createdBy}
                </div>
              </div>
            </div>

            {/* Official Signatures Section */}
            <div className="pt-4 border-t border-slate-200 mt-6 grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="font-bold text-slate-700 mb-8">توقيع أمين الصندوق</div>
                <div className="border-t border-dashed border-slate-300 pt-1 text-[11px] text-slate-400">
                  التوقيع والختم
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-700 mb-8">المحاسب المعتمد</div>
                <div className="border-t border-dashed border-slate-300 pt-1 text-[11px] text-slate-400">
                  المراجعة والتدقيق
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-700 mb-8">المستلم / العميل</div>
                <div className="border-t border-dashed border-slate-300 pt-1 text-[11px] text-slate-400">
                  الاسم والتوقيع
                </div>
              </div>
            </div>

            {/* Official Footer Verification */}
            <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>مستند مالي معتمد صادق لجميع المعاملات الضريبية والمحاسبية</span>
              </div>
              <div className="font-mono-numbers">
                طبع بواسطة: {REPORT_META.systemName}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 bg-[#f0f6fc] border-t border-[#bcd2e8] flex items-center justify-between no-print text-xs">
          <span className="text-[#55789e]">
            يمكنك حفظ السند كملف <strong className="text-[#0f2d52] font-semibold">PDF</strong> عبر نافذة الطباعة
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-[#bcd2e8] bg-white hover:bg-[#eaf2fb] font-bold text-[#0f2d52] cursor-pointer shadow-2xs"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-[#0078d4] hover:bg-[#0067b8] active:bg-[#004e8c] text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
