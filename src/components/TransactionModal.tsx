import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  AlertCircle,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  UserPlus,
  Sparkles,
  Lock,
  FileText,
  BookOpen,
} from 'lucide-react';
import { Transaction, Account } from '../types';
import { REPORT_META } from '../data/initialData';
import { formatAutoDescription, tafqeetArabic } from '../utils/formatters';
import { DateDMYInput } from './DateDMYInput';
import { VoucherPrintModal } from './VoucherPrintModal';
import { ChartOfAccountsModal } from './ChartOfAccountsModal';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction, isNew: boolean, changesLog?: string[]) => void;
  onDelete?: (id: number) => void;
  transactions?: Transaction[];
  transactionToEdit?: Transaction | null;
  nextId: number;
  accounts?: Account[];
  onAddNewAccount?: () => void;
  defaultAccountName?: string;
  onPrintVoucher?: (transaction: Transaction) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  transactions = [],
  transactionToEdit,
  nextId,
  accounts = [],
  onAddNewAccount,
  defaultAccountName,
  onPrintVoucher,
}) => {
  // Sort transactions in chronological & serial order (date ascending, then id ascending)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.id - b.id;
    });
  }, [transactions]);

  // Helper to get today's local date in YYYY-MM-DD format
  const getTodayISODate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Determine standard default date: strictly today's current date for new transactions
  const defaultDate = useMemo(() => {
    return getTodayISODate();
  }, []);

  // Active transaction id (null = new transaction draft)
  const [activeTxId, setActiveTxId] = useState<number | null>(() => {
    return transactionToEdit ? transactionToEdit.id : null;
  });

  const [formData, setFormData] = useState<Partial<Transaction>>(() => {
    const today = getTodayISODate();
    const now = new Date();
    const nowTimestamp = `${today} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return {
      id: nextId,
      date: transactionToEdit ? transactionToEdit.date : today,
      receipt: 0,
      payment: 0,
      description: formatAutoDescription('قبض', defaultAccountName || ''),
      movementBalance: 0,
      type: 'قبض',
      accountName: defaultAccountName || '',
      mainAccount: 'العملاء',
      closingAccount: 'ميزانية',
      createdBy: `${REPORT_META.defaultCreator} (${nowTimestamp})`,
      lastModified: nowTimestamp,
    };
  });

  const [isAutoDescription, setIsAutoDescription] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'delete'; text: string } | null>(null);

  // Delete confirmation dialog state (Yes / No)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Voucher print preview modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [voucherData, setVoucherData] = useState<Transaction | null>(null);

  // Chart of Accounts Selector modal state
  const [isChartOfAccountsOpen, setIsChartOfAccountsOpen] = useState(false);

  // Match current account from Chart of Accounts
  const currentMatchedAccount = useMemo(() => {
    if (!formData.accountName || !formData.accountName.trim()) return null;
    const searchVal = formData.accountName.trim().toLowerCase();
    return accounts.find(
      (a) =>
        a.name.toLowerCase() === searchVal ||
        (a.code && a.code.toLowerCase() === searchVal)
    );
  }, [accounts, formData.accountName]);

  const handleSelectAccountFromChart = (acc: Account) => {
    setFormData((prev) => ({
      ...prev,
      accountName: acc.name,
      mainAccount: acc.mainAccount || prev.mainAccount,
      closingAccount: acc.closingAccount || prev.closingAccount,
      description: isAutoDescription
        ? formatAutoDescription(prev.type || 'قبض', acc.name)
        : prev.description,
    }));
    setIsChartOfAccountsOpen(false);
  };

  // Sync activeTxId on opening or prop change
  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setActiveTxId(transactionToEdit.id);
      } else {
        setActiveTxId(null);
      }
      setFeedbackMsg(null);
      setError(null);
    }
  }, [isOpen, transactionToEdit]);

  // Current index in sorted transactions
  const currentIndex = useMemo(() => {
    if (activeTxId === null) return -1;
    return sortedTransactions.findIndex((t) => t.id === activeTxId);
  }, [activeTxId, sortedTransactions]);

  const isNewMode = activeTxId === null || currentIndex === -1;
  const currentSavedTx = isNewMode ? null : sortedTransactions[currentIndex];

  // Update formData when activeTxId changes
  useEffect(() => {
    if (!isOpen) return;

    if (activeTxId !== null) {
      const found = sortedTransactions.find((t) => t.id === activeTxId);
      if (found) {
        const effType =
          Number(found.payment) > 0 && (Number(found.receipt) || 0) === 0
            ? 'دفع'
            : (Number(found.receipt) || 0) > 0 && (Number(found.payment) || 0) === 0
            ? 'قبض'
            : found.type || 'قبض';
        setFormData({ ...found, type: effType });
        const expectedAuto = formatAutoDescription(effType, found.accountName);
        setIsAutoDescription(!found.description || found.description === expectedAuto);
        setError(null);
        return;
      }
    }

    // New draft
    const acc = defaultAccountName || '';
    const autoDesc = formatAutoDescription('قبض', acc);
    const today = getTodayISODate();
    const now = new Date();
    const nowTimestamp = `${today} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setFormData({
      id: nextId,
      date: today,
      receipt: 0,
      payment: 0,
      description: autoDesc,
      movementBalance: 0,
      type: 'قبض',
      accountName: acc,
      mainAccount: 'العملاء',
      closingAccount: 'ميزانية',
      createdBy: `${REPORT_META.defaultCreator} (${nowTimestamp})`,
      lastModified: nowTimestamp,
    });
    setIsAutoDescription(true);
    setError(null);
  }, [activeTxId, isOpen, sortedTransactions, nextId, defaultAccountName, defaultDate]);

  // Navigation: First (الحركة الأولى)
  const handleGoFirst = () => {
    if (sortedTransactions.length > 0) {
      setActiveTxId(sortedTransactions[0].id);
      setFeedbackMsg(null);
      setError(null);
    }
  };

  // Navigation: Previous (السابق)
  const handleGoPrev = () => {
    if (sortedTransactions.length === 0) return;
    setFeedbackMsg(null);
    setError(null);
    if (isNewMode) {
      setActiveTxId(sortedTransactions[sortedTransactions.length - 1].id);
    } else if (currentIndex > 0) {
      setActiveTxId(sortedTransactions[currentIndex - 1].id);
    }
  };

  // Navigation: Next (التالي)
  const handleGoNext = () => {
    if (sortedTransactions.length === 0) return;
    setFeedbackMsg(null);
    setError(null);
    if (!isNewMode) {
      if (currentIndex < sortedTransactions.length - 1) {
        setActiveTxId(sortedTransactions[currentIndex + 1].id);
      } else {
        // Step into new draft
        setActiveTxId(null);
      }
    }
  };

  // Navigation: Last (الحركة الأخيرة)
  const handleGoLast = () => {
    if (sortedTransactions.length > 0) {
      setActiveTxId(sortedTransactions[sortedTransactions.length - 1].id);
      setFeedbackMsg(null);
      setError(null);
    }
  };

  // Command: جديد
  const handleGoNew = () => {
    setActiveTxId(null);
    setFeedbackMsg(null);
    setError(null);
  };

  // Command: إضافة / حفظ
  const handleSave = () => {
    if (!formData.accountName?.trim()) {
      setError('يرجى إدخال أو اختيار اسم الحساب');
      return;
    }

    const paymentNum = Number(formData.payment) || 0;
    const receiptNum = Number(formData.receipt) || 0;

    // Automatic accurate movement type detection:
    // When payment > 0 and receipt === 0, type is 'دفع'
    // When receipt > 0 and payment === 0, type is 'قبض'
    let effectiveType: 'قبض' | 'دفع' =
      formData.type === 'دفع' || formData.type === 'صرف' ? 'دفع' : 'قبض';
    if (paymentNum > 0 && receiptNum === 0) {
      effectiveType = 'دفع';
    } else if (receiptNum > 0 && paymentNum === 0) {
      effectiveType = 'قبض';
    }

    const finalDescription =
      isAutoDescription || !formData.description?.trim()
        ? formatAutoDescription(effectiveType, formData.accountName || '')
        : formData.description.trim();

    const isNew = isNewMode;
    const nowTimestamp = '2026-09-02 16:35';

    // Calculate changes for audit log
    const changes: string[] = [];
    if (!isNew && currentSavedTx) {
      if (formData.date !== currentSavedTx.date) {
        changes.push(`[التاريخ] ${currentSavedTx.date} -> ${formData.date}`);
      }
      if (formData.accountName !== currentSavedTx.accountName) {
        changes.push(`[اسم الحساب] ${currentSavedTx.accountName} -> ${formData.accountName}`);
      }
      if (effectiveType !== currentSavedTx.type) {
        changes.push(`[نوع الحركة] ${currentSavedTx.type} -> ${effectiveType}`);
      }
      if (receiptNum !== currentSavedTx.receipt) {
        changes.push(`[المقبوضات] ${currentSavedTx.receipt} -> ${receiptNum}`);
      }
      if (paymentNum !== currentSavedTx.payment) {
        changes.push(`[المدفوعات] ${currentSavedTx.payment} -> ${paymentNum}`);
      }
      if (formData.movementBalance !== currentSavedTx.movementBalance) {
        changes.push(`[رصيد الحركة] ${currentSavedTx.movementBalance} -> ${formData.movementBalance}`);
      }
      if (finalDescription !== currentSavedTx.description) {
        changes.push(`[البيان] "${currentSavedTx.description}" -> "${finalDescription}"`);
      }
      if (formData.mainAccount !== currentSavedTx.mainAccount) {
        changes.push(`[الحساب الرئيسي] ${currentSavedTx.mainAccount} -> ${formData.mainAccount}`);
      }
      if (formData.closingAccount !== currentSavedTx.closingAccount) {
        changes.push(`[الحساب الختامي] ${currentSavedTx.closingAccount} -> ${formData.closingAccount}`);
      }
    }

    const calculatedBalance = effectiveType === 'دفع' ? Math.abs(paymentNum) : -Math.abs(receiptNum);

    const completeTx: Transaction = {
      id: isNew ? (formData.id || nextId) : currentSavedTx!.id,
      date: formData.date || defaultDate,
      receipt: receiptNum,
      payment: paymentNum,
      description: finalDescription,
      movementBalance: calculatedBalance,
      type: effectiveType,
      accountName: formData.accountName || '',
      mainAccount: formData.mainAccount || 'العملاء',
      closingAccount: formData.closingAccount || 'ميزانية',
      createdBy: !isNew && currentSavedTx ? currentSavedTx.createdBy : `${REPORT_META.defaultCreator} (${nowTimestamp})`,
      lastModified: nowTimestamp,
    };

    onSave(completeTx, isNew, changes);
    setActiveTxId(completeTx.id);

    setFeedbackMsg({
      type: 'success',
      text: isNew
        ? `تم إضافة الحركة رقم (${completeTx.id}) بنجاح`
        : `تم حفظ تعديلات الحركة رقم (${completeTx.id}) بنجاح`,
    });
    setError(null);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Command: حذف - يفتح نافذة التأكيد مع خيار نعم أم لا (لا يتم الحذف فوراً)
  const handleDeleteCurrent = () => {
    if (isNewMode || !currentSavedTx || !onDelete) return;
    setShowDeleteConfirm(true);
  };

  // تنفيذ الحذف الفعلي فقط عند الضغط على "نعم، حذف الحركة"
  const confirmActualDelete = () => {
    if (isNewMode || !currentSavedTx || !onDelete) {
      setShowDeleteConfirm(false);
      return;
    }

    const deletedId = currentSavedTx.id;
    onDelete(deletedId);
    setShowDeleteConfirm(false);

    setFeedbackMsg({
      type: 'delete',
      text: `تم حذف الحركة رقم (${deletedId}) بنجاح`,
    });
    setError(null);

    // Step to neighboring transaction
    const remaining = sortedTransactions.filter((t) => t.id !== deletedId);
    if (remaining.length === 0) {
      setActiveTxId(null);
    } else if (currentIndex < remaining.length) {
      setActiveTxId(remaining[currentIndex].id);
    } else {
      setActiveTxId(remaining[remaining.length - 1].id);
    }
  };

  // Command: طباعة - فتح نافذة معاينة وطباعة السند المعتمد مباشرة
  const handlePrint = () => {
    const paymentNum = Number(formData.payment) || 0;
    const receiptNum = Number(formData.receipt) || 0;
    let effectiveType: 'قبض' | 'دفع' =
      formData.type === 'دفع' || formData.type === 'صرف' ? 'دفع' : 'قبض';
    if (paymentNum > 0 && receiptNum === 0) {
      effectiveType = 'دفع';
    } else if (receiptNum > 0 && paymentNum === 0) {
      effectiveType = 'قبض';
    }

    const calculatedBalance = effectiveType === 'دفع' ? Math.abs(paymentNum) : -Math.abs(receiptNum);

    const finalTx: Transaction = {
      id: formData.id || nextId,
      date: formData.date || defaultDate,
      receipt: receiptNum,
      payment: paymentNum,
      description: formData.description || formatAutoDescription(effectiveType, formData.accountName || ''),
      movementBalance: calculatedBalance,
      type: effectiveType,
      accountName: formData.accountName || 'غير محدد',
      mainAccount: formData.mainAccount || 'العملاء',
      closingAccount: formData.closingAccount || 'ميزانية',
      createdBy: formData.createdBy || REPORT_META.defaultCreator,
      lastModified: formData.lastModified || '2026-09-02',
    };
    setVoucherData(finalTx);
    setShowPrintModal(true);
    if (onPrintVoucher) {
      onPrintVoucher(finalTx);
    }
  };

  // Active transaction amount for Tafqeet
  const activeAmount = useMemo(() => {
    const r = Number(formData.receipt) || 0;
    const p = Number(formData.payment) || 0;
    if (formData.type === 'قبض') {
      return r > 0 ? r : p;
    }
    if (formData.type === 'دفع' || formData.type === 'صرف') {
      return p > 0 ? p : r;
    }
    return r > 0 ? r : p;
  }, [formData.type, formData.receipt, formData.payment]);

  const activeTafqeet = useMemo(() => {
    return tafqeetArabic(activeAmount);
  }, [activeAmount]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleGoPrev();
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGoNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isNewMode, currentIndex, sortedTransactions]);

  if (!isOpen) return null;

  // Receipt & Payment calculation
  const handleReceiptChange = (val: number) => {
    const numVal = Number(val) || 0;
    setFormData((prev) => {
      const nextType = numVal > 0 ? 'قبض' : prev.type || 'قبض';
      return {
        ...prev,
        receipt: numVal,
        payment: 0,
        type: nextType,
        movementBalance: -Math.abs(numVal),
        description: isAutoDescription
          ? formatAutoDescription(nextType, prev.accountName || '')
          : prev.description,
      };
    });
  };

  const handlePaymentChange = (val: number) => {
    const numVal = Number(val) || 0;
    setFormData((prev) => {
      const nextType = 'دفع';
      return {
        ...prev,
        payment: numVal,
        receipt: 0,
        type: nextType,
        movementBalance: Math.abs(numVal),
        description: isAutoDescription
          ? formatAutoDescription(nextType, prev.accountName || '')
          : prev.description,
      };
    });
  };

  const handleTypeChange = (type: string) => {
    const isPay = type === 'دفع' || type === 'صرف';
    const effectiveType = isPay ? 'دفع' : 'قبض';
    const currentAmount = (formData.payment || formData.receipt) || 0;
    const balance = isPay ? Math.abs(currentAmount) : -Math.abs(currentAmount);

    setFormData((prev) => ({
      ...prev,
      type: effectiveType,
      receipt: isPay ? 0 : currentAmount,
      payment: isPay ? currentAmount : 0,
      movementBalance: balance,
      description: isAutoDescription
        ? formatAutoDescription(effectiveType, prev.accountName || '')
        : prev.description,
    }));
  };

  // Current transaction number to display in dedicated box
  const currentDisplayedNumber = formData.id || nextId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs"
      dir="rtl"
    >
      <div
        className="bg-[#f0f6fc] rounded-xl shadow-2xl w-full max-w-xl flex flex-col border border-[#bcd2e8] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* ========================================================================= */}
        {/* شريط الأدوات المدمج (TOOLBAR) - صفين متتاليين تماماً بدون فراغات         */}
        {/* ========================================================================= */}
        <div id="modal-integrated-toolbar" className="flex flex-col border-b border-[#bcd2e8] shrink-0">
          {/* 1. الصف العلوي (شريط الأوامر الثابت): [جديد] [حفظ] [طباعة] [حذف] [إغلاق] */}
          <div
            id="toolbar-commands-row"
            className="bg-gradient-to-r from-[#003e73] via-[#005a9e] to-[#0078d4] px-3 py-2 flex items-center justify-start gap-1.5 text-white select-none"
          >
            {/* [جديد] */}
            <button
              type="button"
              id="toolbar-btn-new"
              onClick={handleGoNew}
              className="px-3.5 py-1 text-xs sm:text-sm font-bold rounded bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer border border-white/20 shadow-2xs"
            >
              جديد
            </button>

            {/* [حفظ] */}
            <button
              type="button"
              id="toolbar-btn-save"
              onClick={handleSave}
              className="px-3.5 py-1 text-xs sm:text-sm font-bold rounded bg-white text-[#004e8c] hover:bg-blue-50 active:bg-blue-100 transition-colors cursor-pointer shadow-xs"
            >
              حفظ
            </button>

            {/* [طباعة] */}
            <button
              type="button"
              id="toolbar-btn-print"
              onClick={handlePrint}
              className="px-3.5 py-1 text-xs sm:text-sm font-bold rounded bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer border border-white/20 shadow-2xs"
            >
              طباعة
            </button>

            {/* [حذف] */}
            <button
              type="button"
              id="toolbar-btn-delete"
              onClick={handleDeleteCurrent}
              disabled={isNewMode || !onDelete}
              className="px-3.5 py-1 text-xs sm:text-sm font-bold rounded bg-rose-600/80 hover:bg-rose-600 active:bg-rose-700 disabled:opacity-35 disabled:pointer-events-none text-white transition-colors cursor-pointer border border-rose-400/30 shadow-2xs"
            >
              حذف
            </button>

            {/* [إغلاق] */}
            <button
              type="button"
              id="toolbar-btn-close"
              onClick={onClose}
              className="px-3.5 py-1 text-xs sm:text-sm font-bold rounded bg-black/25 hover:bg-black/40 active:bg-black/60 text-white transition-colors cursor-pointer border border-white/10 shadow-2xs"
            >
              إغلاق
            </button>
          </div>

          {/* 2. الصف السفلي (شريط التنقل بين الحركات): ملتصق تماماً بالصف العلوي */}
          <div
            id="toolbar-navigation-row"
            className="bg-[#eaf2fb] px-3 py-1.5 flex items-center justify-start gap-1 border-t border-[#bcd2e8] select-none"
          >
            {/* سهم (الحركة الأولى) */}
            <button
              type="button"
              id="nav-btn-first"
              onClick={handleGoFirst}
              disabled={sortedTransactions.length === 0 || (!isNewMode && currentIndex === 0)}
              className="p-1 text-[#0f2d52] hover:text-[#0078d4] hover:bg-white active:bg-[#dce9f6] disabled:opacity-25 disabled:hover:bg-transparent rounded border border-transparent hover:border-[#bcd2e8] transition-colors cursor-pointer"
              title="الحركة الأولى"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>

            {/* سهم (السابق) */}
            <button
              type="button"
              id="nav-btn-prev"
              onClick={handleGoPrev}
              disabled={sortedTransactions.length === 0 || (!isNewMode && currentIndex === 0)}
              className="p-1 text-[#0f2d52] hover:text-[#0078d4] hover:bg-white active:bg-[#dce9f6] disabled:opacity-25 disabled:hover:bg-transparent rounded border border-transparent hover:border-[#bcd2e8] transition-colors cursor-pointer"
              title="السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* منطقة العرض: مربع مخصص فقط لعرض [رقم الحركة الحالية] */}
            <div
              id="current-transaction-display"
              dir="ltr"
              className="h-7 min-w-[54px] px-2.5 flex items-center justify-center font-mono font-bold text-xs sm:text-sm bg-white border border-[#bcd2e8] rounded text-[#0078d4] shadow-2xs select-none font-mono-numbers"
              title="رقم الحركة الحالية"
            >
              {currentDisplayedNumber}
            </div>

            {/* سهم (التالي) */}
            <button
              type="button"
              id="nav-btn-next"
              onClick={handleGoNext}
              disabled={isNewMode}
              className="p-1 text-[#0f2d52] hover:text-[#0078d4] hover:bg-white active:bg-[#dce9f6] disabled:opacity-25 disabled:hover:bg-transparent rounded border border-transparent hover:border-[#bcd2e8] transition-colors cursor-pointer"
              title="التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* سهم (الحركة الأخيرة) */}
            <button
              type="button"
              id="nav-btn-last"
              onClick={handleGoLast}
              disabled={sortedTransactions.length === 0 || (!isNewMode && currentIndex === sortedTransactions.length - 1)}
              className="p-1 text-[#0f2d52] hover:text-[#0078d4] hover:bg-white active:bg-[#dce9f6] disabled:opacity-25 disabled:hover:bg-transparent rounded border border-transparent hover:border-[#bcd2e8] transition-colors cursor-pointer"
              title="الحركة الأخيرة"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* استمارة البيانات المدمجة - بدون شريط تمرير عمودي (No Vertical Scrollbar) */}
        {/* ========================================================================= */}
        <div className="p-3.5 sm:p-4 space-y-2.5 text-xs sm:text-sm overflow-hidden bg-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* إشعارات الحفظ أو الأخطاء السريعة */}
          {feedbackMsg && (
            <div
              className={`p-2 border rounded-md flex items-center gap-2 text-xs font-semibold ${
                feedbackMsg.type === 'delete'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {error && (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* صف 1: التاريخ ونوع الحركة (بدون تكرار رقم المسلسل لوجوده في شريط التنقل) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-[#1e3a5f] text-xs mb-1">
                التاريخ <span className="text-[#55789e] font-normal">(اليوم / الشهر / السنة)</span>
              </label>
              <DateDMYInput
                value={formData.date || defaultDate}
                onChange={(newDate) => setFormData({ ...formData, date: newDate })}
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1e3a5f] text-xs mb-1">نوع الحركة (قبض \ دفع)</label>
              <select
                value={formData.type === 'صرف' ? 'دفع' : formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full h-8 px-2.5 bg-white border border-[#bcd2e8] rounded-md focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] focus:outline-none text-[#0f2d52] text-xs sm:text-sm font-bold cursor-pointer"
              >
                <option value="قبض">قبض</option>
                <option value="دفع">دفع</option>
              </select>
            </div>
          </div>

          {/* صف 2: اسم الحساب والمبالغ (مقبوضات / مدفوعات) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-[#1e3a5f] text-xs">
                  اسم الحساب <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsChartOfAccountsOpen(true)}
                    className="text-[11px] text-[#0078d4] bg-[#eaf2fb] hover:bg-[#dce9f6] border border-[#bcd2e8] px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title="استعراض واختيار الحساب من دليل الحسابات المالي"
                  >
                    <BookOpen className="w-3 h-3 text-[#0078d4]" />
                    <span>دليل الحسابات</span>
                  </button>
                  {onAddNewAccount && (
                    <button
                      type="button"
                      onClick={onAddNewAccount}
                      className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="إضافة حساب جديد إلى الدليل"
                    >
                      <UserPlus className="w-3 h-3 text-emerald-600" />
                      <span>حساب جديد</span>
                    </button>
                  )}
                </div>
              </div>
              <input
                type="text"
                required
                list="modal-accounts-list"
                placeholder="اختر من دليل الحسابات أو اكتب الاسم أو الكود..."
                value={formData.accountName}
                onChange={(e) => {
                  const val = e.target.value;
                  const searchVal = val.trim().toLowerCase();
                  const matched = accounts.find(
                    (a) =>
                      a.name.toLowerCase() === searchVal ||
                      (a.code && a.code.toLowerCase() === searchVal)
                  );
                  const effectiveName = matched ? matched.name : val;
                  setFormData((prev) => ({
                    ...prev,
                    accountName: effectiveName,
                    mainAccount: matched ? matched.mainAccount : prev.mainAccount,
                    closingAccount: matched ? matched.closingAccount : prev.closingAccount,
                    description: isAutoDescription
                      ? formatAutoDescription(prev.type || 'قبض', effectiveName)
                      : prev.description,
                  }));
                }}
                className="w-full h-8 px-2.5 bg-white border border-[#bcd2e8] rounded-md focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] focus:outline-none text-[#0f2d52] font-medium text-xs sm:text-sm"
              />
              <datalist id="modal-accounts-list">
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.name}>
                    {acc.code ? `[${acc.code}] ` : ''}{acc.name} - ({acc.type}) | رئيسي: {acc.mainAccount}
                  </option>
                ))}
              </datalist>

              {/* شريط التحقق والربط بدليل الحسابات المالي */}
              {currentMatchedAccount ? (
                <div className="mt-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] flex items-center justify-between gap-1 text-slate-700">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-mono font-bold text-slate-900 font-mono-numbers">
                      كود: {currentMatchedAccount.code || '120101'}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600 truncate">{currentMatchedAccount.type}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500 truncate">رئيسي: {currentMatchedAccount.mainAccount}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                    معتمد بالدليل
                  </span>
                </div>
              ) : formData.accountName.trim() ? (
                <div className="mt-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[11px] flex items-center justify-between gap-1 text-amber-900">
                  <span className="truncate">هذا الحساب غير مسجل حالياً في دليل الحسابات</span>
                  {onAddNewAccount && (
                    <button
                      type="button"
                      onClick={onAddNewAccount}
                      className="text-[10px] font-bold text-blue-700 hover:underline shrink-0 mr-1"
                    >
                      + إدراجه في الدليل الآن
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  الحقل مرتبط تلقائياً بـ <strong>دليل الحسابات</strong> المحاسبي
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#1e3a5f] text-xs mb-1">
                  المقبوضات (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  dir="ltr"
                  value={formData.receipt === 0 ? '' : formData.receipt}
                  onChange={(e) => handleReceiptChange(Number(e.target.value))}
                  placeholder="0"
                  className="w-full h-8 px-2.5 bg-white border border-[#bcd2e8] rounded-md focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] focus:outline-none font-mono-numbers text-[#0f2d52] text-xs sm:text-sm text-right"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1e3a5f] text-xs mb-1">
                  المدفوعات (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  dir="ltr"
                  value={formData.payment === 0 ? '' : formData.payment}
                  onChange={(e) => handlePaymentChange(Number(e.target.value))}
                  placeholder="0"
                  className="w-full h-8 px-2.5 bg-white border border-[#bcd2e8] rounded-md focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] focus:outline-none font-mono-numbers text-[#0f2d52] text-xs sm:text-sm text-right"
                />
              </div>
            </div>
          </div>

          {/* تفقيط المبلغ بالحروف (Tafqeet) */}
          <div
            id="amount-tafqeet-bar"
            className="px-3 py-1.5 bg-[#eaf2fb] border border-[#bcd2e8] rounded-md flex items-center justify-between gap-2 text-xs transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              <FileText className="w-3.5 h-3.5 text-[#0078d4] shrink-0" />
              <span className="font-bold text-[#0f2d52] shrink-0">تفقيط المبلغ:</span>
              <span
                className="font-bold text-[#004e8c] truncate select-all"
                title={activeTafqeet}
              >
                {activeTafqeet}
              </span>
            </div>
            {activeAmount > 0 && (
              <span className="text-[11px] font-bold font-mono-numbers text-[#004e8c] bg-white px-2 py-0.5 rounded border border-[#bcd2e8] shrink-0">
                {activeAmount.toLocaleString('en-US')} ج.م
              </span>
            )}
          </div>

          {/* صف 3: البيان وتفاصيل القيد */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-1 font-semibold text-[#1e3a5f] text-xs">
                <span>البيان وتفاصيل القيد</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#eaf2fb] text-[#0078d4] border border-[#bcd2e8]">
                  <Sparkles className="w-2.5 h-2.5 text-[#0078d4]" />
                  <span>توليد تلقائي</span>
                </span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const nextState = !isAutoDescription;
                  setIsAutoDescription(nextState);
                  if (nextState) {
                    setFormData((prev) => ({
                      ...prev,
                      description: formatAutoDescription(prev.type || 'قبض', prev.accountName || ''),
                    }));
                  }
                }}
                className="text-[11px] text-[#55789e] hover:text-[#0078d4] font-medium transition-colors cursor-pointer"
              >
                {isAutoDescription ? 'تعديل يدوي؟' : 'استعادة التلقائي ↺'}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                readOnly={isAutoDescription}
                value={
                  isAutoDescription
                    ? formatAutoDescription(formData.type || 'قبض', formData.accountName || '')
                    : formData.description || ''
                }
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="البيان التوضيحي للحركة..."
                className={`w-full h-8 px-2.5 border rounded-md focus:outline-none text-xs sm:text-sm font-medium transition-colors ${
                  isAutoDescription
                    ? 'bg-[#f0f6fc] text-[#1e3a5f] border-[#bcd2e8] cursor-default select-all'
                    : 'bg-white text-[#0f2d52] border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20'
                }`}
              />
              {isAutoDescription && (
                <div className="absolute left-2.5 top-2 text-[10px] text-[#55789e] flex items-center gap-1 pointer-events-none select-none">
                  <Lock className="w-3 h-3 text-[#55789e]" />
                  <span>تلقائي</span>
                </div>
              )}
            </div>
          </div>

          {/* صف 4: رصيد الحركة والحسابات (الرئيسي والختامي) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
            <div>
              <label className="block font-semibold text-[#1e3a5f] text-xs mb-1">
                رصيد الحركة
              </label>
              <div 
                className="h-8 px-2.5 bg-[#f0f6fc] border border-[#bcd2e8] rounded-md flex items-center justify-between text-xs font-bold font-mono-numbers text-rose-600"
                dir="ltr"
              >
                <span>{formData.movementBalance !== undefined ? formData.movementBalance.toLocaleString('en-US') : '0'}</span>
                <span className="text-[10px] text-[#55789e] font-normal">ج.م</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1e3a5f] text-xs mb-1">الحساب الرئيسي</label>
              <select
                value={formData.mainAccount}
                onChange={(e) => setFormData({ ...formData, mainAccount: e.target.value })}
                className="w-full h-8 px-2 bg-white border border-[#bcd2e8] rounded-md focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] focus:outline-none text-[#0f2d52] text-xs sm:text-sm cursor-pointer"
              >
                <option value="العملاء">العملاء</option>
                <option value="الموردين">الموردين</option>
                <option value="الخزينة">الخزينة</option>
                <option value="البنك">البنك</option>
                <option value="المصروفات">المصروفات</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1e3a5f] text-xs mb-1">الحساب الختامي</label>
              <select
                value={formData.closingAccount}
                onChange={(e) => setFormData({ ...formData, closingAccount: e.target.value })}
                className="w-full h-8 px-2 bg-white border border-[#bcd2e8] rounded-md focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] focus:outline-none text-[#0f2d52] text-xs sm:text-sm cursor-pointer"
              >
                <option value="ميزانية">ميزانية</option>
                <option value="أرباح وخسائر">أرباح وخسائر</option>
              </select>
            </div>
          </div>
        </div>

        {/* تم إلغاء شريط الأوامر السفلي تماماً وفق التعليمات */}
      </div>

      {/* نافذة تنبيه تأكيد الحذف مع خيار (نعم / لا) - لا يتم الحذف فوراً */}
      {showDeleteConfirm && currentSavedTx && (
        <div
          id="delete-confirmation-overlay"
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-300 overflow-hidden text-right animate-in zoom-in-95 duration-150">
            {/* Header with warning icon */}
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  تأكيد حذف الحركة المالية
                </h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  تنبيه: لن يتم الحذف إلا بعد تأكيدك بالضغط على خيار (نعم)
                </p>
              </div>
            </div>

            {/* Content & Details of the item being deleted */}
            <div className="p-4 sm:p-5 space-y-3.5 text-xs sm:text-sm text-slate-700">
              <p className="font-semibold text-slate-800">
                هل أنت متأكد من رغبتك في حذف هذه الحركة بشكل نهائي من السجلات؟
              </p>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">رقم الحركة:</span>
                  <span className="font-bold text-slate-900 font-mono-numbers" dir="ltr">#{currentSavedTx.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">اسم الحساب:</span>
                  <span className="font-bold text-slate-900">{currentSavedTx.accountName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">نوع الحركة:</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                    currentSavedTx.type === 'قبض' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {currentSavedTx.type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">المبلغ:</span>
                  <span className="font-bold text-slate-900 font-mono-numbers" dir="ltr">
                    {(currentSavedTx.receipt > 0 ? currentSavedTx.receipt : currentSavedTx.payment).toLocaleString('en-US')} ج.م
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">التاريخ:</span>
                  <span className="text-slate-700 font-mono-numbers">{currentSavedTx.date}</span>
                </div>
                {currentSavedTx.description && (
                  <div className="pt-1.5 border-t border-slate-200/80 flex items-start justify-between gap-2">
                    <span className="text-slate-500 font-medium shrink-0">البيان:</span>
                    <span className="text-slate-700 text-left line-clamp-2">{currentSavedTx.description}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: [لا، تراجع] و [نعم، حذف الحركة] */}
            <div className="p-3.5 bg-slate-100/90 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                id="btn-confirm-delete-no"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                لا، تراجع
              </button>

              <button
                type="button"
                id="btn-confirm-delete-yes"
                onClick={confirmActualDelete}
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف الحركة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة معاينة وطباعة السند المالي الرسمي */}
      <VoucherPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        transaction={voucherData}
      />

      {/* نافذة دليل الحسابات المالي لاختيار الحساب كمرجع معتمد */}
      <ChartOfAccountsModal
        isOpen={isChartOfAccountsOpen}
        onClose={() => setIsChartOfAccountsOpen(false)}
        accounts={accounts}
        transactions={transactions}
        mode="select"
        selectedAccountName={formData.accountName}
        onSelectAccount={handleSelectAccountFromChart}
        onOpenAddAccountModal={() => {
          setIsChartOfAccountsOpen(false);
          if (onAddNewAccount) onAddNewAccount();
        }}
      />
    </div>
  );
};
