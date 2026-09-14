import React, { useState } from 'react';
import { 
  X, 
  History, 
  Search, 
  Copy, 
  Check, 
  User, 
  Calendar, 
  Clock, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { AuditLogEntry, Transaction } from '../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
  transactions: Transaction[];
  initialSelectedTransactionId?: number | null;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  transactions,
  initialSelectedTransactionId,
}) => {
  const [filterTxId, setFilterTxId] = useState<string>(
    initialSelectedTransactionId ? initialSelectedTransactionId.toString() : 'ALL'
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredLogs = auditLogs.filter((log) => {
    if (!log) return false;
    const q = (searchFilter || '').trim().toLowerCase();
    const matchesTx = filterTxId === 'ALL' || (log.transactionId != null && log.transactionId.toString() === filterTxId);
    const matchesSearch =
      !q ||
      (log.rawAuditText || '').toLowerCase().includes(q) ||
      (log.author || '').toLowerCase().includes(q) ||
      (Boolean(log.field) && String(log.field).toLowerCase().includes(q));
    return matchesTx && matchesSearch;
  });

  const handleCopy = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
      }
    } catch (err) {
      console.warn('Clipboard write prevented:', err);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="bg-[#f0f6fc] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-[#bcd2e8] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#003e73] via-[#005a9e] to-[#0078d4] text-white flex items-center justify-between border-b border-[#004e8c]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 text-white rounded-xl shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                ثانياً: تفاصيل سجل التعديلات التدقيقي (Audit Log)
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                تتبع كامل لكافة العمليات والتعديلات المسجلة مع طوابع الوقت وهوية المستخدمين
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-blue-100 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-[#f0f6fc] border-b border-[#bcd2e8] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-[#1e3a5f]">تصفية حسب الحركة:</label>
            <select
              value={filterTxId}
              onChange={(e) => setFilterTxId(e.target.value)}
              className="text-xs sm:text-sm py-1.5 px-3 bg-white border border-[#bcd2e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] text-[#0f2d52] font-semibold cursor-pointer shadow-2xs"
            >
              <option value="ALL">جميع الحركات ({auditLogs.length} تعديل)</option>
              {transactions.map((t) => (
                <option key={t.id} value={t.id.toString()}>
                  الحركة رقم ({t.id}) - {t.accountName}
                </option>
              ))}
            </select>
          </div>

          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="w-4 h-4 text-[#55789e] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="بحث في النصوص التدقيقية..."
              className="w-full pl-3 pr-9 py-1.5 text-xs sm:text-sm bg-white border border-[#bcd2e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] text-[#0f2d52] shadow-2xs"
            />
          </div>
        </div>

        {/* Logs List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-[#edf3f8]">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-[#55789e]">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#8aaecb]" />
              <p className="text-sm">لا توجد سجلات تدقيق مطابقة لهذا المعيار.</p>
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              const tx = transactions.find((t) => t.id === log.transactionId);
              return (
                <div
                  key={log.id || index}
                  className="bg-white rounded-xl border border-[#bcd2e8] p-4 shadow-2xs hover:border-[#0078d4]/50 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#e6eef6]">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#eaf2fb] text-[#0078d4] border border-[#bcd2e8] font-mono-numbers">
                        حركة #{log.transactionId}
                      </span>
                      {tx && (
                        <span className="text-xs font-semibold text-[#0f2d52]">
                          {tx.accountName} - {tx.description}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#55789e]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#55789e]" />
                        <span className="font-mono-numbers">{log.updatedAt}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono-numbers bg-[#f0f6fc] border border-[#bcd2e8] px-2 py-0.5 rounded-md text-[#1e3a5f]">
                        <User className="w-3 h-3 text-[#0078d4]" />
                        {log.author}
                      </span>
                    </div>
                  </div>

                  {/* Raw Audit Text Display */}
                  <div className="mt-3">
                    <div className="flex items-start justify-between gap-2 bg-[#0c2340] text-emerald-300 rounded-lg p-3 font-mono text-xs overflow-x-auto border border-[#004e8c]">
                      <code className="whitespace-pre-wrap break-all leading-relaxed">
                        {log.rawAuditText}
                      </code>
                      <button
                        onClick={() => handleCopy(log.rawAuditText, log.id)}
                        className="p-1.5 text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors shrink-0 cursor-pointer"
                        title="نسخ النص التدقيقي"
                      >
                        {copiedId === log.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Breakdown breakdown if available */}
                    {log.field && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[#55789e]">الحقل المعدل:</span>
                        <span className="font-bold text-[#0f2d52] px-2 py-0.5 bg-[#eaf2fb] border border-[#bcd2e8] rounded-md">
                          {log.field}
                        </span>
                        {log.oldValue && (
                          <>
                            <span className="text-[#55789e]">القيمة السابقة:</span>
                            <span className="text-rose-700 font-mono-numbers bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              {log.oldValue}
                            </span>
                          </>
                        )}
                        {log.newValue && (
                          <>
                            <span className="text-[#55789e]">القيمة الجديدة:</span>
                            <span className="text-emerald-700 font-mono-numbers bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {log.newValue}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#f0f6fc] border-t border-[#bcd2e8] flex items-center justify-between">
          <div className="text-xs text-[#55789e] flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#0078d4]" />
            <span>نظام التدقيق الداخلي التلقائي - Acuora Soft Egypt</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs sm:text-sm font-bold text-[#0f2d52] bg-white border border-[#bcd2e8] hover:bg-[#eaf2fb] rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
