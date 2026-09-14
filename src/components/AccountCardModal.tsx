import React, { useState, useEffect, useMemo } from 'react';
import {
  FilePlus,
  Save,
  Trash2,
  X,
  ChevronsRight,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  Building2,
  Hash,
  Phone,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Wallet,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { Account, Transaction } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { STANDARD_CHART_TREE, generateCodeFromMainAccount } from '../data/chartTreeData';

interface AccountCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  initialAccountId?: string;
  initialAccountName?: string;
  onSaveAccount: (account: Account, isNew: boolean) => void;
  onDeleteAccount: (account: Account) => void;
  onOpenStatementSheet?: (accountName: string) => void;
  transactions?: Transaction[];
}

// Standard helper to suggest/generate sequential code derived from the Main Account's code
export const generateSequentialAccountCode = (
  mainAccountCode: string,
  accountType: string,
  existingAccounts: Account[]
): string => {
  const codeToUse = mainAccountCode && mainAccountCode.trim()
    ? mainAccountCode.trim()
    : accountType === 'عملاء'
    ? '12'
    : accountType === 'موردين'
    ? '21'
    : accountType === 'صندوق / بنك'
    ? '11'
    : accountType === 'مصروفات'
    ? '51'
    : accountType === 'إيرادات'
    ? '41'
    : '12';

  return generateCodeFromMainAccount(codeToUse, existingAccounts);
};

export const DEFAULT_MAIN_ACCOUNTS = STANDARD_CHART_TREE;

export const AccountCardModal: React.FC<AccountCardModalProps> = ({
  isOpen,
  onClose,
  accounts = [],
  initialAccountId,
  initialAccountName,
  onSaveAccount,
  onDeleteAccount,
  onOpenStatementSheet,
  transactions = [],
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isNewMode, setIsNewMode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    code: string;
    mainAccount: string;
    mainAccountCode: string;
    type: string;
    phone: string;
    closingAccount: string;
    openingBalance: number;
    notes: string;
    createdAt: string;
  }>({
    id: '',
    name: '',
    code: '',
    mainAccount: 'العملاء والمدينون',
    mainAccountCode: '12',
    type: 'عملاء',
    phone: '',
    closingAccount: 'الميزانية العمومية',
    openingBalance: 0,
    notes: '',
    createdAt: new Date().toISOString().split('T')[0],
  });

  // Sync index on opening or initial parameters
  useEffect(() => {
    if (!isOpen) return;

    if (accounts.length === 0) {
      handleNew();
      return;
    }

    let targetIdx = 0;
    if (initialAccountId) {
      const idx = accounts.findIndex((a) => a.id === initialAccountId);
      if (idx !== -1) targetIdx = idx;
    } else if (initialAccountName) {
      const idx = accounts.findIndex((a) => a.name.trim().toLowerCase() === initialAccountName.trim().toLowerCase());
      if (idx !== -1) targetIdx = idx;
    }

    setCurrentIndex(targetIdx);
    loadAccountIntoForm(accounts[targetIdx]);
    setIsNewMode(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [isOpen, initialAccountId, initialAccountName, accounts]);

  const loadAccountIntoForm = (acc?: Account) => {
    if (!acc) return;
    setFormData({
      id: acc.id,
      name: acc.name || '',
      code: acc.code || '',
      mainAccount: acc.mainAccount || 'العملاء والمدينون',
      mainAccountCode: acc.mainAccountCode || (acc.code ? acc.code.slice(0, 2) : '12'),
      type: acc.type || 'عملاء',
      phone: acc.phone || '',
      closingAccount: acc.closingAccount || 'الميزانية العمومية',
      openingBalance: acc.openingBalance || 0,
      notes: acc.notes || '',
      createdAt: acc.createdAt || new Date().toISOString().split('T')[0],
    });
    setErrorMessage(null);
  };

  // Switch to NEW Account Mode
  const handleNew = () => {
    const defaultMain = DEFAULT_MAIN_ACCOUNTS[0];
    const generatedCode = generateSequentialAccountCode(defaultMain.code, defaultMain.type, accounts);

    setFormData({
      id: `acc-${Date.now()}`,
      name: '',
      code: generatedCode,
      mainAccount: defaultMain.name,
      mainAccountCode: defaultMain.code,
      type: defaultMain.type,
      phone: '',
      closingAccount: defaultMain.closing,
      openingBalance: 0,
      notes: '',
      createdAt: new Date().toISOString().split('T')[0],
    });
    setIsNewMode(true);
    setErrorMessage(null);
    setSuccessMessage('تم فتح بطاقة حساب جديد. يرجى إدخال البيانات والضغط على "حفظ"');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Navigation Handlers
  const handleFirst = () => {
    if (accounts.length === 0) return;
    setCurrentIndex(0);
    loadAccountIntoForm(accounts[0]);
    setIsNewMode(false);
  };

  const handlePrevious = () => {
    if (accounts.length === 0) return;
    const prev = Math.max(0, currentIndex - 1);
    setCurrentIndex(prev);
    loadAccountIntoForm(accounts[prev]);
    setIsNewMode(false);
  };

  const handleNext = () => {
    if (accounts.length === 0) return;
    const next = Math.min(accounts.length - 1, currentIndex + 1);
    setCurrentIndex(next);
    loadAccountIntoForm(accounts[next]);
    setIsNewMode(false);
  };

  const handleLast = () => {
    if (accounts.length === 0) return;
    const last = accounts.length - 1;
    setCurrentIndex(last);
    loadAccountIntoForm(accounts[last]);
    setIsNewMode(false);
  };

  // Jump to specific account from dropdown
  const handleSelectSpecificAccount = (accId: string) => {
    const idx = accounts.findIndex((a) => a.id === accId);
    if (idx !== -1) {
      setCurrentIndex(idx);
      loadAccountIntoForm(accounts[idx]);
      setIsNewMode(false);
    }
  };

  // Main Account change handler (auto-fills main code, type, closing account, and generates code)
  const handleMainAccountChange = (mainName: string) => {
    const match = DEFAULT_MAIN_ACCOUNTS.find((m) => m.name === mainName);
    const mainCode = match ? match.code : formData.mainAccountCode || '10';
    const accType = match ? match.type : formData.type;
    const closing = match ? match.closing : formData.closingAccount;

    const newCode = isNewMode
      ? generateSequentialAccountCode(mainCode, accType, accounts)
      : formData.code;

    setFormData((prev) => ({
      ...prev,
      mainAccount: mainName,
      mainAccountCode: mainCode,
      type: accType,
      closingAccount: closing,
      code: newCode,
    }));
  };

  // Regenerate sequential code on demand
  const handleGenerateSequentialCode = () => {
    const nextCode = generateSequentialAccountCode(
      formData.mainAccountCode,
      formData.type,
      accounts
    );
    setFormData((prev) => ({ ...prev, code: nextCode }));
    setSuccessMessage(`تم توليد الكود المسلسل الجديد: ${nextCode}`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // Save Account
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setErrorMessage('يرجى إدخال اسم الحساب (حقل إلزامي)');
      return;
    }

    const trimmedCode = formData.code.trim();
    if (!trimmedCode) {
      setErrorMessage('يرجى تحديد أو توليد كود الحساب (حقل إلزامي)');
      return;
    }

    // Duplicate check
    const duplicate = accounts.find(
      (a) =>
        a.id !== formData.id &&
        (a.name.trim().toLowerCase() === trimmedName.toLowerCase() || (a.code && a.code === trimmedCode))
    );

    if (duplicate) {
      if (duplicate.name.trim().toLowerCase() === trimmedName.toLowerCase()) {
        setErrorMessage(`يوجد حساب مسجل بالفعل بالاسم "${duplicate.name}" في دليل الحسابات`);
        return;
      }
      if (duplicate.code === trimmedCode) {
        setErrorMessage(`كود الحساب (${trimmedCode}) مستخدم مسبقاً للحساب "${duplicate.name}". يمكنك استخدام كود آخر أو التوليد التلقائي`);
        return;
      }
    }

    const savedAccount: Account = {
      id: formData.id || `acc-${Date.now()}`,
      name: trimmedName,
      code: trimmedCode,
      mainAccount: formData.mainAccount,
      mainAccountCode: formData.mainAccountCode,
      type: formData.type,
      closingAccount: formData.closingAccount,
      phone: formData.phone.trim() || undefined,
      openingBalance: Number(formData.openingBalance) || 0,
      notes: formData.notes.trim() || undefined,
      createdAt: formData.createdAt || new Date().toISOString().split('T')[0],
    };

    onSaveAccount(savedAccount, isNewMode);

    setSuccessMessage(
      isNewMode
        ? `تم إنشاء وحفظ بطاقة الحساب "${savedAccount.name}" بنجاح`
        : `تم تحديث بيانات بطاقة الحساب "${savedAccount.name}" بنجاح`
    );
    setIsNewMode(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Delete Account
  const handleDelete = () => {
    if (isNewMode) {
      handleFirst();
      return;
    }

    const currentAcc = accounts[currentIndex];
    if (!currentAcc) return;

    // Check if account has transactions
    const relatedTxCount = transactions.filter(
      (tx) => tx.accountName.trim().toLowerCase() === currentAcc.name.trim().toLowerCase()
    ).length;

    if (relatedTxCount > 0) {
      const proceed = window.confirm(
        `تنبيه هام:\nالحساب "${currentAcc.name}" لديه (${relatedTxCount}) حركة مسجلة في اليومية!\nهل أنت متأكد من رغبتك في حذف بطاقة الحساب من الدليل؟`
      );
      if (!proceed) return;
    } else {
      const proceed = window.confirm(`هل أنت متأكد من رغبتك في حذف بطاقة الحساب "${currentAcc.name}" نهائياً من دليل الحسابات؟`);
      if (!proceed) return;
    }

    onDeleteAccount(currentAcc);
    setSuccessMessage(`تم حذف بطاقة الحساب "${currentAcc.name}"`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Current Account Stats
  const accountStats = useMemo(() => {
    if (isNewMode || !formData.name) {
      return { txCount: 0, currentBalance: formData.openingBalance, totalReceipt: 0, totalPayment: 0 };
    }
    const accTxs = transactions.filter(
      (tx) => tx.accountName.trim().toLowerCase() === formData.name.trim().toLowerCase()
    );
    const totalReceipt = accTxs.reduce((sum, tx) => sum + (tx.receipt || 0), 0);
    const totalPayment = accTxs.reduce((sum, tx) => sum + (tx.payment || 0), 0);
    const currentBalance = (formData.openingBalance || 0) + (totalReceipt - totalPayment);
    return {
      txCount: accTxs.length,
      currentBalance,
      totalReceipt,
      totalPayment,
    };
  }, [isNewMode, formData.name, formData.openingBalance, transactions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* ========================================================
            1. SHIRIT ALAWY THABET (شريط علوي ثابت: جديد, حفظ, حذف, إغلاق)
           ======================================================== */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-900 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">بطاقة الحساب المالي</h3>
                {isNewMode ? (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-xs font-bold">
                    حساب جديد
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded text-xs font-mono font-bold">
                    {formData.code || 'بدون كود'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                إدارة بيانات الحساب الرئيسي والفرعي والرموز المحاسبية
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar: جديد, حفظ, حذف, إغلاق */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* جديد (New) */}
            <button
              type="button"
              onClick={handleNew}
              className="h-9 px-3 text-xs sm:text-sm font-bold text-slate-100 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              title="تفريغ البطاقة لإنشاء حساب جديد"
            >
              <FilePlus className="w-4 h-4 text-emerald-400" />
              <span>جديد</span>
            </button>

            {/* حفظ (Save) */}
            <button
              type="button"
              onClick={() => handleSave()}
              className="h-9 px-3.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="حفظ بيانات الحساب في دليل الحسابات"
            >
              <Save className="w-4 h-4 text-white" />
              <span>حفظ</span>
            </button>

            {/* حذف (Delete) */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isNewMode && accounts.length === 0}
              className="h-9 px-3 text-xs sm:text-sm font-bold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-700 active:bg-rose-800 rounded-xl flex items-center gap-1.5 transition-colors border border-rose-800/60 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              title="حذف الحساب الحالي من دليل الحسابات"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>حذف</span>
            </button>

            <span className="w-px h-6 bg-slate-700 mx-1 hidden sm:inline-block" />

            {/* إغلاق (Close) */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="إغلاق بطاقة الحساب"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================
            2. SHIRIT TANAQQUL MAA AL-ASHOM (شريط تنقل مع الأسهم)
           ======================================================== */}
        <div className="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            {/* First: الأول */}
            <button
              type="button"
              onClick={handleFirst}
              disabled={accounts.length === 0 || (!isNewMode && currentIndex === 0)}
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
              title="الحساب الأول"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>

            {/* Previous: السابق */}
            <button
              type="button"
              onClick={handlePrevious}
              disabled={accounts.length === 0 || (!isNewMode && currentIndex === 0)}
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
              title="الحساب السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Location Counter */}
            <div className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs">
              {isNewMode ? (
                <span className="text-emerald-700 font-semibold">إدخال حساب جديد</span>
              ) : accounts.length > 0 ? (
                <span>
                  حساب <strong className="text-blue-700 font-mono">{currentIndex + 1}</strong> من{' '}
                  <strong className="font-mono">{accounts.length}</strong>
                </span>
              ) : (
                <span>لا توجد حسابات</span>
              )}
            </div>

            {/* Next: التالي */}
            <button
              type="button"
              onClick={handleNext}
              disabled={accounts.length === 0 || (!isNewMode && currentIndex === accounts.length - 1)}
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
              title="الحساب التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Last: الأخير */}
            <button
              type="button"
              onClick={handleLast}
              disabled={accounts.length === 0 || (!isNewMode && currentIndex === accounts.length - 1)}
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
              title="الحساب الأخير"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Jump Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 hidden sm:inline">انتقال سريع:</label>
            <select
              value={isNewMode ? '' : accounts[currentIndex]?.id || ''}
              onChange={(e) => handleSelectSpecificAccount(e.target.value)}
              className="h-8 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs max-w-[200px] truncate"
            >
              {isNewMode && <option value="">-- حساب جديد قيد الإدخال --</option>}
              {accounts.map((acc, i) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code ? `${acc.code} - ` : ''}
                  {acc.name}
                </option>
              ))}
            </select>

            {/* Open Statement Sheet Button */}
            {onOpenStatementSheet && formData.name && !isNewMode && (
              <button
                type="button"
                onClick={() => {
                  onOpenStatementSheet(formData.name);
                  onClose();
                }}
                className="h-8 px-2.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="فتح كشف حساب تفصيلي لهذا الحساب"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">كشف الحساب</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ========================================================
            3. HUQOOL BITAKAT AL-HISAB (حقول بطاقة الحساب)
           ======================================================== */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
            {/* Section 1: الحساب الرئيسي والرمز */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* حقل اسم الحساب الرئيسي */}
              <div className="sm:col-span-8">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الحساب الرئيسي <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    list="main-accounts-list"
                    value={formData.mainAccount}
                    onChange={(e) => handleMainAccountChange(e.target.value)}
                    placeholder="اختر أو اكتب اسم الحساب الرئيسي"
                    className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                  <datalist id="main-accounts-list">
                    {DEFAULT_MAIN_ACCOUNTS.map((m) => (
                      <option key={m.name} value={m.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* حقل رمز الحساب الرئيسي */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رمز الحساب الرئيسي
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.mainAccountCode}
                    onChange={(e) => setFormData({ ...formData, mainAccountCode: e.target.value })}
                    placeholder="مثال: 12"
                    className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: اسم الحساب ورمز الحساب (مسلسل تلقائي) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
              {/* حقل اسم الحساب */}
              <div className="sm:col-span-7">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الحساب <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="مثال: شركة الأمل للمقاولات / الخزينة الرئيسية"
                    className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* حقل رمز الحساب (مع خيار التسلسل التلقائي) */}
              <div className="sm:col-span-5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    رمز الحساب <span className="text-blue-600 font-normal">(مسلسل)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSequentialCode}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                    title="توليد رقم مسلسل تلقائياً بناءً على الحساب الرئيسي والدليل"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>توليد تلقائي مسلسل</span>
                  </button>
                </div>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    dir="ltr"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="مثال: 120101"
                    className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: نوع الحساب، رقم الهاتف، اسم الحساب الختامي */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* نوع الحساب */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الحساب</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="عملاء">عملاء</option>
                  <option value="موردين">موردين</option>
                  <option value="صندوق / بنك">صندوق / بنك</option>
                  <option value="مصروفات">مصروفات</option>
                  <option value="إيرادات">إيرادات</option>
                  <option value="أصول">أصول أخرى</option>
                  <option value="خصوم">خصوم والتزامات</option>
                </select>
              </div>

              {/* رقم الهاتف */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="tel"
                    dir="ltr"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="مثال: 01012345678"
                    className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* اسم الحساب الختامي */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الحساب الختامي
                </label>
                <div className="relative">
                  <FileSpreadsheet className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <select
                    value={formData.closingAccount}
                    onChange={(e) => setFormData({ ...formData, closingAccount: e.target.value })}
                    className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="الميزانية العمومية">الميزانية العمومية</option>
                    <option value="قائمة الدخل">قائمة الدخل</option>
                    <option value="أرباح وخسائر">أرباح وخسائر</option>
                    <option value="المتاجرة">المتاجرة</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: الرصيد الافتتاحي والملاحظات */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* الرصيد الافتتاحي */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الرصيد الافتتاحي (ج.م)
                </label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.openingBalance}
                    onChange={(e) =>
                      setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                    className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* ملاحظات */}
              <div className="sm:col-span-8">
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات وبيان الحساب</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات إضافية، العنوان، شروط الدفع، إلخ..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: ملخص إحصائي سريع لحركات الحساب */}
          {!isNewMode && (
            <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-500 block">عدد الحركات المسجلة:</span>
                  <strong className="text-slate-800 font-mono text-sm">{accountStats.txCount} حركة</strong>
                </div>
                <div className="w-px h-6 bg-blue-200" />
                <div>
                  <span className="text-slate-500 block">إجمالي المقبوضات:</span>
                  <strong className="text-emerald-700 font-mono text-sm">
                    {formatCurrency(accountStats.totalReceipt)}
                  </strong>
                </div>
                <div className="w-px h-6 bg-blue-200" />
                <div>
                  <span className="text-slate-500 block">إجمالي المدفوعات:</span>
                  <strong className="text-rose-700 font-mono text-sm">
                    {formatCurrency(accountStats.totalPayment)}
                  </strong>
                </div>
                <div className="w-px h-6 bg-blue-200" />
                <div>
                  <span className="text-slate-500 block">الرصيد الفعلي الحالي:</span>
                  <strong
                    className={`font-mono text-sm ${
                      accountStats.currentBalance >= 0 ? 'text-blue-900 font-bold' : 'text-rose-700 font-bold'
                    }`}
                  >
                    {formatCurrency(accountStats.currentBalance)}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">تاريخ الإنشاء: {formData.createdAt}</span>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>تتيح لك بطاقة الحساب استعراض وحفظ وتعديل وحذف أي حساب في الدليل مع الترقيم المسلسل التلقائي.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              إغلاق البطاقة
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
