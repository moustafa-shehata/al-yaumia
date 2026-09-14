import React, { useState } from 'react';
import { X, UserPlus, Save, AlertCircle, Building2, Phone, Coins, FileText } from 'lucide-react';
import { Account } from '../types';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => void;
  existingAccounts: Account[];
}

const getSuggestedCode = (type: string, existing: Account[]) => {
  let prefix = '120';
  if (type === 'صندوق / بنك') prefix = '110';
  else if (type === 'موردين') prefix = '210';
  else if (type === 'مصروفات') prefix = '510';
  else if (type === 'إيرادات') prefix = '410';
  const matching = existing.filter((a) => a.code && a.code.startsWith(prefix));
  const nextSeq = matching.length + 1;
  return `${prefix}${nextSeq.toString().padStart(3, '0')}`;
};

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingAccounts,
}) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'عملاء',
    mainAccount: 'العملاء',
    closingAccount: 'ميزانية',
    phone: '',
    openingBalance: 0,
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  // Auto-set suggested code when modal opens or type changes
  React.useEffect(() => {
    if (isOpen && !formData.code) {
      setFormData((prev) => ({
        ...prev,
        code: getSuggestedCode(prev.type, existingAccounts),
      }));
    }
  }, [isOpen, existingAccounts]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: string) => {
    let main = 'العملاء';
    let closing = 'ميزانية';
    if (newType === 'صندوق / بنك') {
      main = 'النقدية وما في حكمها';
      closing = 'ميزانية';
    } else if (newType === 'موردين') {
      main = 'الموردون';
      closing = 'ميزانية';
    } else if (newType === 'مصروفات') {
      main = 'المصروفات التشغيلية';
      closing = 'أرباح وخسائر';
    } else if (newType === 'إيرادات') {
      main = 'الإيرادات';
      closing = 'أرباح وخسائر';
    }
    const suggested = getSuggestedCode(newType, existingAccounts);
    setFormData((prev) => ({
      ...prev,
      type: newType,
      mainAccount: main,
      closingAccount: closing,
      code: suggested,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      setError('يرجى إدخال اسم الحساب');
      return;
    }

    const exists = existingAccounts.some(
      (a) => a.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      setError('هذا الحساب موجود بالفعل في دليل الحسابات');
      return;
    }

    const assignedCode = formData.code.trim() || getSuggestedCode(formData.type, existingAccounts);

    const newAccount: Account = {
      id: `acc-${Date.now()}`,
      code: assignedCode,
      name: trimmedName,
      type: formData.type,
      mainAccount: formData.mainAccount || 'العملاء',
      closingAccount: formData.closingAccount || 'ميزانية',
      phone: formData.phone.trim() || undefined,
      openingBalance: Number(formData.openingBalance) || 0,
      notes: formData.notes.trim() || undefined,
      createdAt: '2026-09-02',
    };

    onSave(newAccount);
    // Reset
    setFormData({
      code: '',
      name: '',
      type: 'عملاء',
      mainAccount: 'العملاء',
      closingAccount: 'ميزانية',
      phone: '',
      openingBalance: 0,
      notes: '',
    });
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                إضافة حساب مالي / عميل جديد
              </h3>
              <p className="text-[11px] text-slate-400">
                إدراج الحساب في دليل حسابات الأستاذ العام وكشف الحساب
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 text-xs sm:text-sm flex-1">
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Account Name */}
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">
                اسم الحساب / العميل <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-2" />
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة النصر للتجارة / أحمد محمود"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (error) setError(null);
                  }}
                  className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-slate-800 font-medium text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Account Code (كود الحساب المالي) */}
              <div>
                <label className="block font-semibold text-slate-700 text-xs mb-1">
                  كود الحساب المالي في الدليل <span className="text-blue-600 font-normal">(تلقائي)</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="مثال: 120105"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-slate-900 font-mono font-bold text-xs sm:text-sm text-left"
                />
              </div>

              {/* Account Classification */}
              <div>
                <label className="block font-semibold text-slate-700 text-xs mb-1">
                  تصنيف الحساب
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-slate-800 text-xs sm:text-sm font-semibold"
                >
                  <option value="عملاء">عملاء (12)</option>
                  <option value="موردين">موردين (21)</option>
                  <option value="صندوق / بنك">صندوق / بنك (11)</option>
                  <option value="مصروفات">مصروفات (51)</option>
                  <option value="إيرادات">إيرادات (41)</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Phone */}
              <div>
                <label className="block font-semibold text-slate-700 text-xs mb-1">
                  رقم الهاتف (اختياري)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2" />
                  <input
                    type="tel"
                    dir="ltr"
                    placeholder="01xxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-slate-800 font-mono-numbers text-xs sm:text-sm text-right"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Main Account */}
              <div>
                <label className="block font-semibold text-slate-700 text-xs mb-1">
                  الحساب الرئيسي
                </label>
                <input
                  type="text"
                  value={formData.mainAccount}
                  onChange={(e) => setFormData({ ...formData, mainAccount: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm"
                />
              </div>

              {/* Opening Balance */}
              <div>
                <label className="block font-semibold text-slate-700 text-xs mb-1">
                  الرصيد الافتتاحي (ج.م)
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-slate-400 absolute right-3 top-2" />
                  <input
                    type="number"
                    dir="ltr"
                    placeholder="0"
                    value={formData.openingBalance === 0 ? '' : formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                    className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-slate-800 font-mono-numbers text-xs sm:text-sm text-right"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">
                ملاحظات أو بيان إضافي
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute right-3 top-2" />
                <input
                  type="text"
                  placeholder="ملاحظات حول الحساب أو الشروط المالية..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-slate-800 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions Sticky Footer */}
          <div className="p-3 sm:px-5 sm:py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              إلغاء / إغلاق
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الحساب</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
