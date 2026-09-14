import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileText,
  Printer,
  X,
  Calendar,
  User,
  RotateCw,
  TrendingDown,
  TrendingUp,
  Scale,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Transaction, Account } from '../types';
import { formatCurrency, formatNumber, formatDateDMY } from '../utils/formatters';
import { REPORT_META } from '../data/initialData';
import { AccountSearchInput } from './AccountSearchInput';
import { executePrintStatementReport, openStatementInNewWindow } from '../utils/printHelper';

interface StatementSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts?: Account[];
  initialAccount?: string | null;
}

export const StatementSheetModal: React.FC<StatementSheetModalProps> = ({
  isOpen,
  onClose,
  transactions = [],
  accounts = [],
  initialAccount,
}) => {
  // 1. منطقة المعايير: Defaults to empty string so user can type or choose freely
  const [selectedAccount, setSelectedAccount] = useState<string>(
    initialAccount && initialAccount !== 'ALL' ? initialAccount : ''
  );
  const [fromDate, setFromDate] = useState<string>('2026-09-01');
  const [toDate, setToDate] = useState<string>('2026-09-30');
  const [showOpeningBalance, setShowOpeningBalance] = useState<boolean>(true);
  const [movementFilter, setMovementFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [printStatus, setPrintStatus] = useState<'idle' | 'printing' | 'success'>('idle');

  // Update selected account when initialAccount changes or modal opens (empty by default and ready for typing)
  useEffect(() => {
    if (isOpen) {
      if (initialAccount && initialAccount !== 'ALL') {
        setSelectedAccount(initialAccount);
      } else {
        setSelectedAccount('');
      }
    }
  }, [isOpen, initialAccount]);

  // Selected account meta from دليل الحسابات
  const currentAccountMeta = useMemo(() => {
    return accounts.find((a) => a.name === selectedAccount) || null;
  }, [accounts, selectedAccount]);

  const handleRefreshReport = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  // Build Statement Rows in real time based on criteria
  const { statementRows, totalDebit, totalCredit, accountBalance } = useMemo(() => {
    // 1. Filter transactions by the specific selected account (strictly individual account)
    const matchedTxs = transactions.filter((t) => t.accountName === selectedAccount);

    // 2. Sort by date ascending then by ID
    const sorted = [...matchedTxs].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.id - b.id;
    });

    // 3. Opening balance calculation from دليل الحسابات
    let initialBalance = currentAccountMeta?.openingBalance || 0;

    // Accumulate prior movements before fromDate
    let priorBalance = initialBalance;
    const activeTxs: Transaction[] = [];

    sorted.forEach((t) => {
      const txDate = t.date;
      const isBefore = fromDate && txDate < fromDate;
      const isAfter = toDate && txDate > toDate;

      if (isBefore) {
        // في حالة قبض تكون القيمة في عمود مدين، وفي حالة دفع تكون القيمة في عمود دائن
        const isPay = t.type === 'دفع' || t.type === 'صرف' || (Number(t.payment) > 0 && (Number(t.receipt) || 0) === 0);
        const debit = isPay ? 0 : (Number(t.receipt) || Number(t.payment) || 0);
        const credit = isPay ? (Number(t.payment) || Number(t.receipt) || 0) : 0;
        priorBalance += (debit - credit);
      } else if (!isAfter) {
        activeTxs.push(t);
      }
    });

    const rows: {
      serial: number | string;
      date: string;
      debit: number;
      credit: number;
      description: string;
      movementBalance: number;
      runningBalance: number;
      type: string;
      isOpening?: boolean;
    }[] = [];

    let currentRunningBalance = priorBalance;
    let seq = 1;

    // Add Opening Balance Row if checkbox is checked
    if (showOpeningBalance) {
      const opDebit = priorBalance > 0 ? priorBalance : 0;
      const opCredit = priorBalance < 0 ? Math.abs(priorBalance) : 0;

      let includeOpening = true;
      if (movementFilter === 'debit' && opDebit <= 0) includeOpening = false;
      if (movementFilter === 'credit' && opCredit <= 0) includeOpening = false;

      if (includeOpening) {
        rows.push({
          serial: seq++,
          date: fromDate || '2026-09-01',
          debit: opDebit,
          credit: opCredit,
          description: 'رصيد افتتاحي منقول من دليل الحسابات والعمليات السابقة',
          movementBalance: priorBalance,
          runningBalance: currentRunningBalance,
          type: 'رصيد افتتاحي',
          isOpening: true,
        });
      }
    }

    // Process transactions within date range
    activeTxs.forEach((t) => {
      // في حالة قبض تكون القيمة في عمود مدين، وفي حالة دفع تكون القيمة في عمود دائن
      const isPay = t.type === 'دفع' || t.type === 'صرف' || (Number(t.payment) > 0 && (Number(t.receipt) || 0) === 0);
      const debit = isPay ? 0 : (Number(t.receipt) || Number(t.payment) || 0);
      const credit = isPay ? (Number(t.payment) || Number(t.receipt) || 0) : 0;

      // Filter by Movement Type Radio:
      // 🔘 إظهار جميع الحركات
      // 🔘 إظهار الحركات المدينة فقط
      // 🔘 إظهار الحركات الدائنة فقط
      if (movementFilter === 'debit' && debit <= 0) return;
      if (movementFilter === 'credit' && credit <= 0) return;

      currentRunningBalance = currentRunningBalance + debit - credit;

      rows.push({
        serial: seq++,
        date: t.date,
        debit,
        credit,
        description: t.description || 'حركة قيد يومي',
        movementBalance: debit - credit,
        runningBalance: currentRunningBalance,
        type: isPay ? 'دفع' : 'قبض',
      });
    });

    const sumDebit = rows.reduce((acc, r) => acc + (r.debit || 0), 0);
    const sumCredit = rows.reduce((acc, r) => acc + (r.credit || 0), 0);
    const finalNet = sumDebit - sumCredit;

    return {
      statementRows: rows,
      totalDebit: sumDebit,
      totalCredit: sumCredit,
      accountBalance: finalNet,
    };
  }, [
    transactions,
    selectedAccount,
    currentAccountMeta,
    fromDate,
    toDate,
    showOpeningBalance,
    movementFilter,
  ]);

  // Robust Print Handler (100% Reliable in all browsers and iframes)
  const handlePrintReport = () => {
    if (!selectedAccount) {
      alert('يرجى كتابة أو اختيار حساب من دليل الحسابات أولاً لطباعة كشف الحساب.');
      const el = document.getElementById('statement-account-search-input') as HTMLInputElement;
      if (el) el.focus();
      return;
    }

    setPrintStatus('printing');

    const printPayload = {
      accountName: selectedAccount,
      accountCode: currentAccountMeta?.code,
      accountType: currentAccountMeta?.type,
      fromDate,
      toDate,
      movementFilter,
      statementRows,
      totalDebit,
      totalCredit,
      accountBalance,
    };

    // 1. Isolate print document using print classes
    const cleanup = () => {
      document.body.classList.remove('printing-statement');
      document.body.classList.remove('printing-statement-modal');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    document.body.classList.add('printing-statement');
    document.body.classList.add('printing-statement-modal');

    // 2. Trigger native print or fallback to isolated iframe
    try {
      window.print();
      setPrintStatus('success');
      setTimeout(() => setPrintStatus('idle'), 2500);
      setTimeout(cleanup, 2500);
    } catch (err) {
      console.warn('Direct print failed, using helper fallback:', err);
      cleanup();
      executePrintStatementReport(printPayload);
      setPrintStatus('success');
      setTimeout(() => setPrintStatus('idle'), 2500);
    }
  };

  // Open dedicated standalone printable window/tab
  const handleOpenStandalone = () => {
    if (!selectedAccount) {
      alert('يرجى كتابة أو اختيار حساب من دليل الحسابات أولاً لعرض كشف الحساب في نافذة مستقلة.');
      const el = document.getElementById('statement-account-search-input') as HTMLInputElement;
      if (el) el.focus();
      return;
    }
    openStatementInNewWindow({
      accountName: selectedAccount,
      accountCode: currentAccountMeta?.code,
      accountType: currentAccountMeta?.type,
      fromDate,
      toDate,
      movementFilter,
      statementRows,
      totalDebit,
      totalCredit,
      accountBalance,
    });
  };

  if (!isOpen) return null;

  return (
    <div id="statement-sheet-modal-wrapper">
      {/* 1. Interactive Modal Container (Hidden during @media print) */}
      <div
        id="statement-sheet-interactive-container"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-900/60 backdrop-blur-xs"
      >
        <div
          id="statement-sheet-modal"
          className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[94vh] max-h-[880px] flex flex-col border border-[#bcd2e8] overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* =========================================
              1. شريط الأوامر العلوي الثابت
              [عرض التقرير]  [طباعة التقرير]  [نافذة مستقلة]  [إغلاق]
             ========================================= */}
          <div
            id="statement-top-command-bar"
            className="px-3.5 py-2.5 sm:px-5 sm:py-3 border-b border-[#004e8c] bg-gradient-to-r from-[#003e73] via-[#005a9e] to-[#0078d4] text-white flex items-center justify-between shrink-0 shadow-xs"
          >
            {/* عنوان النافذة + شارة الحساب المحدد */}
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-2 bg-white/15 text-white rounded-lg border border-white/20 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                    كشف الحساب
                  </h3>
                  {currentAccountMeta?.code && (
                    <span className="px-2 py-0.5 rounded bg-white/20 text-white border border-white/30 font-mono text-xs font-bold shrink-0">
                      كود: {currentAccountMeta.code}
                    </span>
                  )}
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-white/15 text-blue-100 text-xs font-semibold shrink-0">
                    {selectedAccount || 'لم يتم تحديد حساب'}
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 truncate">
                  مطابقة حركات الحساب المالي من واقع دليل الحسابات وقيود اليومية
                </p>
              </div>
            </div>

            {/* أزرار الأوامر: عرض التقرير | طباعة التقرير | نافذة مستقلة | إغلاق */}
            <div className="flex items-center gap-2 shrink-0">
              {/* 1. زر عرض التقرير */}
              <button
                type="button"
                id="btn-statement-view-report"
                onClick={handleRefreshReport}
                className="h-8 sm:h-8.5 px-3 sm:px-3.5 text-xs sm:text-sm font-bold bg-[#0078d4] hover:bg-[#0067b8] border border-white/30 active:scale-95 text-white rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="تحديث وإعادة عرض التقرير"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>عرض التقرير</span>
              </button>

              {/* 2. زر طباعة التقرير */}
              <button
                type="button"
                id="btn-statement-print-report"
                onClick={handlePrintReport}
                className="h-8 sm:h-8.5 px-3 sm:px-3.5 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-emerald-400/40"
                title="طباعة كشف الحساب الحالي"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة التقرير</span>
                {printStatus === 'success' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                )}
              </button>

              {/* 3. زر فتح في نافذة مستقلة للطباعة والحفظ */}
              <button
                type="button"
                id="btn-statement-standalone-window"
                onClick={handleOpenStandalone}
                className="h-8 sm:h-8.5 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
                title="فتح في نافذة مستقلة للطباعة المباشرة أو الحفظ كـ PDF"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">نافذة مستقلة</span>
              </button>

              {/* 4. زر إغلاق */}
              <button
                type="button"
                id="btn-statement-close"
                onClick={onClose}
                className="h-8 sm:h-8.5 px-2.5 text-xs sm:text-sm font-semibold text-blue-100 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-white/20"
                title="إغلاق النافذة"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">إغلاق</span>
              </button>
            </div>
          </div>

          {/* =========================================
              2. منطقة المعايير (Criteria Area) - مدمجة وصغيرة وموفرة للمساحة
              حقل الحساب (قابل للكتابة مع بحث لحظي من دليل الحسابات)
              من تاريخ | إلى تاريخ | شيك بوكس الرصيد الافتتاحي | Radio buttons
             ========================================= */}
          <div
            id="statement-criteria-area"
            className="px-3.5 py-2.5 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#f0f6fc] via-[#f7fafe] to-[#f0f6fc] border-b border-[#bcd2e8] space-y-2 shrink-0"
          >
            {/* السطر الأول: حقل الحساب القابل للكتابة + من تاريخ + إلى تاريخ */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              {/* حقل الحساب: قابل للكتابة والبحث اللحظي من دليل الحسابات */}
              <div className="sm:col-span-6">
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="statement-account-search-input"
                    className="text-xs font-bold text-[#0f2d52] flex items-center gap-1"
                  >
                    <User className="w-3.5 h-3.5 text-[#0078d4]" />
                    <span>حساب الأستاذ (من دليل الحسابات):</span>
                  </label>
                  {currentAccountMeta && (
                    <span className="text-[11px] text-[#55789e] font-medium">
                      تصنيف: <strong className="text-[#1e3a5f]">{currentAccountMeta.type}</strong>
                      {currentAccountMeta.code && ` [${currentAccountMeta.code}]`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex-1 min-w-0">
                    <AccountSearchInput
                      id="statement-account-search-input"
                      accounts={accounts}
                      selectedAccountName={selectedAccount}
                      onSelectAccount={(acc) => setSelectedAccount(acc.name)}
                      onClear={() => setSelectedAccount('')}
                      placeholder="اكتب اسم الحساب أو الكود للبحث الفوري..."
                      autoFocus={true}
                    />
                  </div>

                  {/* زر تفريغ محتوى حقل الحساب لتسهيل كتابة حساب مختلف */}
                  <button
                    type="button"
                    id="btn-clear-modal-statement-account"
                    onClick={() => {
                      setSelectedAccount('');
                      const el = document.getElementById('statement-account-search-input') as HTMLInputElement;
                      if (el) {
                        el.value = '';
                        el.focus();
                      }
                    }}
                    disabled={!selectedAccount}
                    className={`h-9 px-2.5 sm:px-3 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all shrink-0 shadow-2xs ${
                      selectedAccount
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 cursor-pointer active:scale-95'
                        : 'bg-[#f0f6fc] text-[#8fa8c4] border-[#bcd2e8] cursor-not-allowed opacity-60'
                    }`}
                    title="تفريغ محتوى حقل الحساب لتسهيل كتابة حساب مختلف"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="hidden sm:inline">تفريغ الحساب</span>
                    <span className="sm:hidden">تفريغ</span>
                  </button>
                </div>
              </div>

              {/* من تاريخ */}
              <div className="sm:col-span-3">
                <label
                  htmlFor="statement-from-date"
                  className="block text-xs font-bold text-[#1e3a5f] mb-1 flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#55789e]" />
                  <span>من تاريخ:</span>
                </label>
                <input
                  type="date"
                  id="statement-from-date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full h-9 px-2.5 bg-white border border-[#bcd2e8] rounded-lg text-xs sm:text-sm text-[#0f2d52] focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] font-mono-numbers"
                />
              </div>

              {/* إلى تاريخ */}
              <div className="sm:col-span-3">
                <label
                  htmlFor="statement-to-date"
                  className="block text-xs font-bold text-[#1e3a5f] mb-1 flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#55789e]" />
                  <span>إلى تاريخ:</span>
                </label>
                <input
                  type="date"
                  id="statement-to-date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full h-9 px-2.5 bg-white border border-[#bcd2e8] rounded-lg text-xs sm:text-sm text-[#0f2d52] focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] font-mono-numbers"
                />
              </div>
            </div>

            {/* السطر الثاني: شيك بوكس الرصيد الافتتاحي + Radio Buttons نوع الحركات */}
            <div className="pt-1.5 border-t border-[#bcd2e8]/60 flex flex-wrap items-center justify-between gap-2">
              {/* خيار شيك بوكس: إظهار الرصيد الافتتاحي */}
              <label
                htmlFor="statement-show-opening-balance"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1e3a5f] cursor-pointer select-none bg-white px-2.5 py-1 rounded-md border border-[#bcd2e8] hover:bg-[#f0f6fc] transition-colors"
              >
                <input
                  type="checkbox"
                  id="statement-show-opening-balance"
                  checked={showOpeningBalance}
                  onChange={(e) => setShowOpeningBalance(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#0078d4] focus:ring-[#0078d4] border-[#bcd2e8] cursor-pointer accent-[#0078d4]"
                />
                <span>إظهار الرصيد الافتتاحي</span>
              </label>

              {/* أزرار الاختيار الدائرية (Radio Buttons):
                  🔘 إظهار جميع الحركات
                  🔘 إظهار الحركات المدينة فقط
                  🔘 إظهار الحركات الدائنة فقط */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white px-2.5 py-1 rounded-md border border-[#bcd2e8] text-xs font-semibold text-[#1e3a5f]">
                <span className="text-[#55789e] font-bold text-[11px]">نوع الحركة:</span>

                {/* 🔘 إظهار جميع الحركات */}
                <label
                  htmlFor="radio-filter-all"
                  className="inline-flex items-center gap-1 cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    id="radio-filter-all"
                    name="statementMovementFilter"
                    value="all"
                    checked={movementFilter === 'all'}
                    onChange={() => setMovementFilter('all')}
                    className="w-3.5 h-3.5 text-[#0078d4] focus:ring-[#0078d4] border-[#bcd2e8] cursor-pointer accent-[#0078d4]"
                  />
                  <span className={movementFilter === 'all' ? 'text-[#0078d4] font-bold' : 'text-[#1e3a5f]'}>
                    إظهار جميع الحركات
                  </span>
                </label>

                {/* 🔘 إظهار الحركات المدينة فقط */}
                <label
                  htmlFor="radio-filter-debit"
                  className="inline-flex items-center gap-1 cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    id="radio-filter-debit"
                    name="statementMovementFilter"
                    value="debit"
                    checked={movementFilter === 'debit'}
                    onChange={() => setMovementFilter('debit')}
                    className="w-3.5 h-3.5 text-[#0078d4] focus:ring-[#0078d4] border-[#bcd2e8] cursor-pointer accent-[#0078d4]"
                  />
                  <span className={movementFilter === 'debit' ? 'text-[#0078d4] font-bold' : 'text-[#1e3a5f]'}>
                    إظهار الحركات المدينة فقط
                  </span>
                </label>

                {/* 🔘 إظهار الحركات الدائنة فقط */}
                <label
                  htmlFor="radio-filter-credit"
                  className="inline-flex items-center gap-1 cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    id="radio-filter-credit"
                    name="statementMovementFilter"
                    value="credit"
                    checked={movementFilter === 'credit'}
                    onChange={() => setMovementFilter('credit')}
                    className="w-3.5 h-3.5 text-[#0078d4] focus:ring-[#0078d4] border-[#bcd2e8] cursor-pointer accent-[#0078d4]"
                  />
                  <span className={movementFilter === 'credit' ? 'text-[#0078d4] font-bold' : 'text-[#1e3a5f]'}>
                    إظهار الحركات الدائنة فقط
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* =========================================
              3. جدول الحركات للحساب (غالب المساحة مخصصة له!)
              [مسلسل , التاريخ, مدين, دائن , البيان, رصيد الحركة, نوع الحركة]
             ========================================= */}
          <div className="flex-1 overflow-y-auto overflow-x-auto p-2.5 sm:p-4 bg-[#f4f8fc]">
            <div className="border border-[#bcd2e8] rounded-xl overflow-hidden shadow-2xs bg-white h-full flex flex-col">
              <div className="overflow-y-auto flex-1">
                <table
                  id="statement-movements-table"
                  className="w-full text-right text-xs sm:text-sm border-collapse"
                >
                  {/* شريط رأس الجدول الثابت (Sticky Header) */}
                  <thead className="sticky top-0 z-10 bg-gradient-to-b from-[#eaf2fb] to-[#d6e5f5] shadow-2xs">
                    <tr className="text-[#0f2d52] border-b border-[#bcd2e8] font-bold">
                      {/* 1. مسلسل */}
                      <th className="py-2.5 px-3 border-l border-[#bcd2e8] text-center w-16">
                        مسلسل
                      </th>
                      {/* 2. التاريخ */}
                      <th className="py-2.5 px-3.5 border-l border-[#bcd2e8] text-center w-28">
                        التاريخ
                      </th>
                      {/* 3. مدين */}
                      <th className="py-2.5 px-3 border-l border-[#bcd2e8] text-left w-28">
                        مدين
                      </th>
                      {/* 4. دائن */}
                      <th className="py-2.5 px-3 border-l border-[#bcd2e8] text-left w-28">
                        دائن
                      </th>
                      {/* 5. البيان */}
                      <th className="py-2.5 px-3.5 border-l border-[#bcd2e8]">
                        البيان
                      </th>
                      {/* 6. رصيد الحركة */}
                      <th className="py-2.5 px-3 border-l border-[#bcd2e8] text-left w-32">
                        رصيد الحركة
                      </th>
                      {/* 7. نوع الحركة */}
                      <th className="py-2.5 px-3 text-center w-24">
                        نوع الحركة
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#e2edf8]">
                    {!selectedAccount ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-14 text-center text-[#55789e] font-medium"
                        >
                          <div className="max-w-md mx-auto flex flex-col items-center justify-center p-6 bg-[#f7fafe] border border-dashed border-[#bcd2e8] rounded-2xl">
                            <div className="w-12 h-12 bg-blue-100 text-[#0078d4] rounded-full flex items-center justify-center mb-3">
                              <User className="w-6 h-6" />
                            </div>
                            <h4 className="text-base font-bold text-[#0f2d52] mb-1">
                              حقل الحساب فارغ ومستعد للإدخال
                            </h4>
                            <p className="text-xs text-[#55789e] text-center leading-relaxed mb-4">
                              اكتب اسم الحساب أو الكود في شريط المعايير أعلاه، أو انقر لاختيار الحساب من القائمة المنسدلة لعرض كشف الحساب والحركات فورياً.
                            </p>
                            {accounts.length > 0 && (
                              <div className="w-full">
                                <span className="text-[11px] font-bold text-[#55789e] block mb-2 text-right">
                                  أو اختر مباشرة من دليل الحسابات:
                                </span>
                                <div className="flex flex-wrap gap-1.5 justify-center">
                                  {accounts.slice(0, 6).map((acc) => (
                                    <button
                                      key={acc.id}
                                      type="button"
                                      onClick={() => setSelectedAccount(acc.name)}
                                      className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-[#eaf2fb] text-[#1e3a5f] hover:text-[#0078d4] border border-[#bcd2e8] hover:border-[#0078d4] rounded-lg transition-colors cursor-pointer shadow-2xs"
                                    >
                                      {acc.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : statementRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-16 text-center text-[#8fa8c4] font-medium"
                        >
                          <p className="text-sm">لا توجد حركات مسجلة للحساب [{selectedAccount}] خلال الفترة المحددة</p>
                          <p className="text-xs text-[#8fa8c4] mt-1">تأكد من نطاق التواريخ أو اختيار حساب آخر من دليل الحسابات</p>
                        </td>
                      </tr>
                    ) : (
                      statementRows.map((row) => (
                        <tr
                          key={`stmt-row-${row.serial}-${row.date}`}
                          className={`hover:bg-[#f1f6fc] transition-colors ${
                            row.isOpening ? 'bg-amber-50/60 font-semibold' : ''
                          }`}
                        >
                          {/* مسلسل */}
                          <td className="py-2 px-3 border-l border-[#bcd2e8] text-center font-mono-numbers text-[#55789e]">
                            {row.serial}
                          </td>

                          {/* التاريخ */}
                          <td className="py-2 px-3.5 border-l border-[#bcd2e8] text-center font-mono font-mono-numbers text-[#1e3a5f]">
                            {formatDateDMY(row.date)}
                          </td>

                          {/* مدين */}
                          <td className="py-2 px-3 border-l border-[#bcd2e8] text-left font-mono font-mono-numbers text-[#0f2d52] font-bold">
                            {row.debit > 0 ? (
                              <span>{row.debit.toLocaleString('en-US')}</span>
                            ) : (
                              <span className="text-[#bcd2e8]">-</span>
                            )}
                          </td>

                          {/* دائن */}
                          <td className="py-2 px-3 border-l border-[#bcd2e8] text-left font-mono font-mono-numbers text-emerald-700 font-bold">
                            {row.credit > 0 ? (
                              <span>{row.credit.toLocaleString('en-US')}</span>
                            ) : (
                              <span className="text-[#bcd2e8]">-</span>
                            )}
                          </td>

                          {/* البيان */}
                          <td className="py-2 px-3.5 border-l border-[#bcd2e8] text-[#0f2d52]">
                            <div className="flex items-center gap-1.5">
                              {row.isOpening && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-200/80 text-amber-900 font-bold shrink-0">
                                  افتتاحي
                                </span>
                              )}
                              <span>{row.description}</span>
                            </div>
                          </td>

                          {/* رصيد الحركة */}
                          <td className="py-2 px-3 border-l border-[#bcd2e8] text-left font-mono font-bold font-mono-numbers">
                            <span
                              className={
                                row.runningBalance > 0
                                  ? 'text-[#0f2d52]'
                                  : row.runningBalance < 0
                                  ? 'text-rose-700'
                                  : 'text-[#55789e]'
                              }
                            >
                              {row.runningBalance.toLocaleString('en-US')}
                            </span>
                          </td>

                          {/* نوع الحركة */}
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                row.type === 'قبض'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                  : row.type === 'دفع'
                                  ? 'bg-blue-50 text-[#004e8c] border border-blue-200'
                                  : 'bg-amber-50 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {row.type}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* =========================================
              4. إجماليات في أسفل الجدول
              [مجموع مدين, مجموع دائن , رصيد الحساب]
             ========================================= */}
          <div
            id="statement-footer-totals"
            className="px-3.5 py-2.5 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#f0f6fc] to-[#e8f1f9] border-t border-[#bcd2e8] flex flex-wrap items-center justify-between gap-2.5 shrink-0"
          >
            {/* إجمالي عدد القيود المعروضة */}
            <div className="text-xs text-[#55789e] font-mono-numbers">
              الحركات المطابقة: <strong className="text-[#0f2d52] font-bold">{statementRows.length}</strong> حركة
            </div>

            {/* بوكس الإجماليات الثلاثة: مجموع مدين | مجموع دائن | رصيد الحساب */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* 1. مجموع مدين */}
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-[#bcd2e8] shadow-2xs">
                <span className="text-xs font-bold text-[#55789e]">مجموع مدين:</span>
                <strong className="text-xs sm:text-sm font-mono font-mono-numbers text-[#0f2d52] font-bold">
                  {formatCurrency(totalDebit)}
                </strong>
              </div>

              {/* 2. مجموع دائن */}
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-[#bcd2e8] shadow-2xs">
                <span className="text-xs font-bold text-emerald-800">مجموع دائن:</span>
                <strong className="text-xs sm:text-sm font-mono font-mono-numbers text-emerald-700 font-bold">
                  {formatCurrency(totalCredit)}
                </strong>
              </div>

              {/* 3. رصيد الحساب */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#003e73] to-[#0078d4] text-white px-3 py-1 rounded-lg shadow-2xs border border-[#004e8c]">
                <span className="text-xs font-bold text-blue-100">رصيد الحساب:</span>
                <strong className="text-xs sm:text-sm font-mono font-mono-numbers text-amber-300 font-bold">
                  {formatCurrency(Math.abs(accountBalance))}
                </strong>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/20 text-white">
                  {accountBalance > 0 ? 'مدين' : accountBalance < 0 ? 'دائن' : 'متزن'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dedicated Official Printable Document (Shown ONLY during @media print) */}
      <div id="statement-printable-document" className="print-only">
        <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
            {REPORT_META.systemName}
          </h1>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#1e3a8a' }}>
            كشف حساب مالي تفصيلي (Account Statement)
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginTop: '6px' }}>
            <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</span>
            <span>نظام: {REPORT_META.systemName}</span>
          </div>
        </div>

        {/* بيانات الحساب والفترة */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '11px' }}>
          <div>
            <strong>اسم الحساب:</strong> {selectedAccount}
          </div>
          <div>
            <strong>كود الحساب:</strong> {currentAccountMeta?.code || '-'}
          </div>
          <div>
            <strong>تصنيف الحساب:</strong> {currentAccountMeta?.type || 'عملاء'}
          </div>
          <div>
            <strong>من تاريخ:</strong> {fromDate ? formatDateDMY(fromDate) : 'البداية'}
          </div>
          <div>
            <strong>إلى تاريخ:</strong> {toDate ? formatDateDMY(toDate) : 'النهاية'}
          </div>
          <div>
            <strong>نوع الحركات:</strong> {movementFilter === 'all' ? 'جميع الحركات' : movementFilter === 'debit' ? 'المدينة فقط' : 'الدائنة فقط'}
          </div>
        </div>

        {/* جدول حركات الكشف للطباعة */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center', width: '40px' }}>مسلسل</th>
              <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center', width: '80px' }}>التاريخ</th>
              <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left', width: '90px' }}>مدين</th>
              <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left', width: '90px' }}>دائن</th>
              <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'right' }}>البيان</th>
              <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left', width: '95px' }}>رصيد الحركة</th>
              <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center', width: '70px' }}>نوع الحركة</th>
            </tr>
          </thead>
          <tbody>
            {statementRows.map((r) => (
              <tr key={`print-row-${r.serial}-${r.date}`}>
                <td style={{ border: '1px solid #94a3b8', padding: '5px', textAlign: 'center', fontFamily: 'monospace' }}>
                  {r.serial}
                </td>
                <td style={{ border: '1px solid #94a3b8', padding: '5px', textAlign: 'center', fontFamily: 'monospace' }}>
                  {formatDateDMY(r.date)}
                </td>
                <td style={{ border: '1px solid #94a3b8', padding: '5px', textAlign: 'left', fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {r.debit > 0 ? r.debit.toLocaleString('en-US') : '-'}
                </td>
                <td style={{ border: '1px solid #94a3b8', padding: '5px', textAlign: 'left', fontFamily: 'monospace', fontWeight: 'bold', color: '#065f46' }}>
                  {r.credit > 0 ? r.credit.toLocaleString('en-US') : '-'}
                </td>
                <td style={{ border: '1px solid #94a3b8', padding: '5px', textAlign: 'right' }}>
                  {r.isOpening ? `[افتتاحي] ${r.description}` : r.description}
                </td>
                <td style={{ border: '1px solid #94a3b8', padding: '5px', textAlign: 'left', fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {r.runningBalance.toLocaleString('en-US')}
                </td>
                <td style={{ border: '1px solid #94a3b8', padding: '5px', textAlign: 'center' }}>
                  {r.type}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
              <td colSpan={2} style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>
                الإجماليات
              </td>
              <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left', fontFamily: 'monospace' }}>
                {totalDebit.toLocaleString('en-US')}
              </td>
              <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left', fontFamily: 'monospace', color: '#065f46' }}>
                {totalCredit.toLocaleString('en-US')}
              </td>
              <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'right' }}>
                رصيد الحساب:
              </td>
              <td colSpan={2} style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left', fontFamily: 'monospace', fontSize: '12px' }}>
                {accountBalance.toLocaleString('en-US')} ج.م {accountBalance > 0 ? '(مدين)' : accountBalance < 0 ? '(دائن)' : '(متزن)'}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* توقيعات اعتماد التقرير */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', fontSize: '11px' }}>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div>إعداد ومراجعة الحسابات</div>
            <div style={{ marginTop: '25px' }}>..........................................</div>
          </div>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div>اعتماد الإدارة المالية</div>
            <div style={{ marginTop: '25px' }}>..........................................</div>
          </div>
        </div>
      </div>
    </div>
  );
};
