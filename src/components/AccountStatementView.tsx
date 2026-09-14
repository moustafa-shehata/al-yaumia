import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  User,
  RotateCw,
  CheckCircle2,
  ArrowRight,
  X,
} from 'lucide-react';
import { Transaction, Account } from '../types';
import { formatCurrency, formatNumber, formatDateDMY } from '../utils/formatters';
import { REPORT_META } from '../data/initialData';
import { AccountSearchInput } from './AccountSearchInput';
import { executePrintStatementReport } from '../utils/printHelper';

interface AccountStatementViewProps {
  transactions: Transaction[];
  accounts: Account[];
  onAddTransactionForAccount: (accountName: string) => void;
  onOpenAddAccountModal: () => void;
  onPrint?: () => void;
  onBackToDailyMovements?: () => void;
}

export const AccountStatementView: React.FC<AccountStatementViewProps> = ({
  transactions = [],
  accounts = [],
  onAddTransactionForAccount,
  onOpenAddAccountModal,
  onBackToDailyMovements,
}) => {
  // منطقة المعايير - Initialized to empty by default (ready for input/selection)
  const [selectedAccountName, setSelectedAccountName] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('2026-09-01');
  const [toDate, setToDate] = useState<string>('2026-09-30');
  const [showOpeningBalance, setShowOpeningBalance] = useState<boolean>(true);
  const [movementFilter, setMovementFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [printStatus, setPrintStatus] = useState<'idle' | 'printing' | 'success'>('idle');

  // Selected account meta from دليل الحسابات
  const selectedAccountMeta = useMemo(() => {
    return accounts.find((a) => a.name === selectedAccountName) || null;
  }, [selectedAccountName, accounts]);

  // Build Statement Rows based on criteria in real time
  const { statementRows, totalDebit, totalCredit, accountBalance } = useMemo(() => {
    // 1. Filter by specific account
    const matchedTxs = transactions.filter((t) => t.accountName === selectedAccountName);

    // 2. Sort by date ascending
    const sorted = [...matchedTxs].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.id - b.id;
    });

    // 3. Opening balance calculation from دليل الحسابات
    let initialBalance = selectedAccountMeta?.openingBalance || 0;

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
          description: 'رصيد افتتاحي منقول من دليل الحسابات والحركات السابقة',
          movementBalance: priorBalance,
          runningBalance: currentRunningBalance,
          type: 'رصيد افتتاحي',
          isOpening: true,
        });
      }
    }

    // Process each transaction within date range
    activeTxs.forEach((t) => {
      // في حالة قبض تكون القيمة في عمود مدين، وفي حالة دفع تكون القيمة في عمود دائن
      const isPay = t.type === 'دفع' || t.type === 'صرف' || (Number(t.payment) > 0 && (Number(t.receipt) || 0) === 0);
      const debit = isPay ? 0 : (Number(t.receipt) || Number(t.payment) || 0);
      const credit = isPay ? (Number(t.payment) || Number(t.receipt) || 0) : 0;

      // Movement radio filter
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

    const sumDebit = rows.reduce((sum, r) => sum + (r.debit || 0), 0);
    const sumCredit = rows.reduce((sum, r) => sum + (r.credit || 0), 0);
    const finalNet = sumDebit - sumCredit;

    return {
      statementRows: rows,
      totalDebit: sumDebit,
      totalCredit: sumCredit,
      accountBalance: finalNet,
    };
  }, [
    transactions,
    selectedAccountName,
    selectedAccountMeta,
    fromDate,
    toDate,
    showOpeningBalance,
    movementFilter,
  ]);

  // Robust Print Handler
  const handlePrintStatement = () => {
    if (!selectedAccountName) {
      alert('يرجى كتابة أو اختيار حساب من دليل الحسابات أولاً لطباعة كشف الحساب.');
      return;
    }

    setPrintStatus('printing');

    executePrintStatementReport({
      accountName: selectedAccountName,
      accountCode: selectedAccountMeta?.code,
      accountType: selectedAccountMeta?.type,
      fromDate,
      toDate,
      movementFilter,
      statementRows,
      totalDebit,
      totalCredit,
      accountBalance,
    });

    setTimeout(() => {
      setPrintStatus('success');
      setTimeout(() => setPrintStatus('idle'), 2500);
    }, 600);
  };

  // Export to CSV
  const handleExportStatementCSV = () => {
    if (!selectedAccountName) {
      alert('يرجى كتابة أو اختيار حساب أولاً لتصدير كشف الحساب.');
      return;
    }
    try {
      const cleanName = (selectedAccountName || 'Account').replace(/\s+/g, '_');
      const title = `كشف_حساب_${cleanName}`;
      const headers = ['مسلسل', 'التاريخ', 'مدين', 'دائن', 'البيان', 'رصيد الحركة', 'نوع الحركة'];
      const rows = statementRows.map((r) => [
        r.serial,
        formatDateDMY(r.date),
        r.debit || 0,
        r.credit || 0,
        `"${String(r.description || '').replace(/"/g, '""')}"`,
        r.runningBalance || 0,
        r.type || '',
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const now = new Date();
      const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      link.setAttribute('download', `${title}_${todayISO}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Failed to export statement CSV:', err);
    }
  };

  return (
    <div id="section-account-statement-view" className="space-y-3">
      {/* 1. Top Command & Info Bar (Compact) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 text-white rounded-lg shadow-xs shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                كشف الحساب المالي (Account Statement)
              </h2>
              {selectedAccountMeta?.code && (
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                  كود: {selectedAccountMeta.code}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              مطابقة الأستاذ العام وتفاصيل قيود الحسابات المدينة والدائنة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onBackToDailyMovements && (
            <button
              type="button"
              onClick={onBackToDailyMovements}
              className="px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="العودة إلى جدول بيان اليومية العامة"
            >
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>العودة لليومية العامة</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportStatementCSV}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="تصدير كشف الحساب إلى CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير CSV</span>
          </button>

          <button
            type="button"
            id="btn-view-statement-print"
            onClick={handlePrintStatement}
            className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 border border-emerald-500/50"
            title="طباعة التقرير"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة التقرير</span>
            {printStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      </div>

      {/* 2. منطقة المعايير (Criteria Area) - مدمجة وموفرة للمساحة */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5">
        {/* Row 1: حقل الحساب القابل للكتابة مع بحث لحظي من دليل الحسابات + التواريخ */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* حقل الحساب */}
          <div className="sm:col-span-6">
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="view-account-search-input"
                className="text-xs font-bold text-slate-800 flex items-center gap-1"
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>حساب الأستاذ (من دليل الحسابات):</span>
              </label>
              {selectedAccountMeta && (
                <span className="text-[11px] text-slate-500 font-medium">
                  تصنيف: <strong className="text-slate-700">{selectedAccountMeta.type}</strong>
                  {selectedAccountMeta.code && ` [${selectedAccountMeta.code}]`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex-1 min-w-0">
                <AccountSearchInput
                  id="view-account-search-input"
                  accounts={accounts}
                  selectedAccountName={selectedAccountName}
                  onSelectAccount={(acc) => setSelectedAccountName(acc.name)}
                  onClear={() => setSelectedAccountName('')}
                  placeholder="اكتب اسم الحساب أو الكود للبحث الفوري من دليل الحسابات..."
                />
              </div>

              {/* زر مخصص لتفريغ محتوى حقل الحساب لتسهيل كتابة حساب مختلف */}
              <button
                type="button"
                id="btn-clear-account-input"
                onClick={() => {
                  setSelectedAccountName('');
                  const el = document.getElementById('view-account-search-input') as HTMLInputElement;
                  if (el) {
                    el.value = '';
                    el.focus();
                  }
                }}
                disabled={!selectedAccountName}
                className={`h-9 px-2.5 sm:px-3 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all shrink-0 shadow-2xs ${
                  selectedAccountName
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 cursor-pointer active:scale-95'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
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
              htmlFor="view-from-date"
              className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>من تاريخ:</span>
            </label>
            <input
              type="date"
              id="view-from-date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono-numbers"
            />
          </div>

          {/* إلى تاريخ */}
          <div className="sm:col-span-3">
            <label
              htmlFor="view-to-date"
              className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>إلى تاريخ:</span>
            </label>
            <input
              type="date"
              id="view-to-date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono-numbers"
            />
          </div>
        </div>

        {/* Row 2: خيار شيك بوكس إظهار الرصيد الافتتاحي + Radio buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {/* خيار شيك بوكس: إظهار الرصيد الافتتاحي */}
          <label
            htmlFor="view-show-opening-balance"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer select-none bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <input
              type="checkbox"
              id="view-show-opening-balance"
              checked={showOpeningBalance}
              onChange={(e) => setShowOpeningBalance(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer accent-blue-600"
            />
            <span>إظهار الرصيد الافتتاحي</span>
          </label>

          {/* Radio Buttons: إظهار جميع الحركات | المدينة فقط | الدائنة فقط */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-700">
            <span className="text-slate-500 font-bold text-[11px]">نوع الحركة:</span>

            {/* 🔘 إظهار جميع الحركات */}
            <label
              htmlFor="view-radio-filter-all"
              className="inline-flex items-center gap-1 cursor-pointer select-none"
            >
              <input
                type="radio"
                id="view-radio-filter-all"
                name="viewStatementMovementFilter"
                value="all"
                checked={movementFilter === 'all'}
                onChange={() => setMovementFilter('all')}
                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer accent-blue-600"
              />
              <span className={movementFilter === 'all' ? 'text-blue-700 font-bold' : 'text-slate-700'}>
                إظهار جميع الحركات
              </span>
            </label>

            {/* 🔘 إظهار الحركات المدينة فقط */}
            <label
              htmlFor="view-radio-filter-debit"
              className="inline-flex items-center gap-1 cursor-pointer select-none"
            >
              <input
                type="radio"
                id="view-radio-filter-debit"
                name="viewStatementMovementFilter"
                value="debit"
                checked={movementFilter === 'debit'}
                onChange={() => setMovementFilter('debit')}
                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer accent-blue-600"
              />
              <span className={movementFilter === 'debit' ? 'text-blue-700 font-bold' : 'text-slate-700'}>
                إظهار الحركات المدينة فقط
              </span>
            </label>

            {/* 🔘 إظهار الحركات الدائنة فقط */}
            <label
              htmlFor="view-radio-filter-credit"
              className="inline-flex items-center gap-1 cursor-pointer select-none"
            >
              <input
                type="radio"
                id="view-radio-filter-credit"
                name="viewStatementMovementFilter"
                value="credit"
                checked={movementFilter === 'credit'}
                onChange={() => setMovementFilter('credit')}
                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer accent-blue-600"
              />
              <span className={movementFilter === 'credit' ? 'text-blue-700 font-bold' : 'text-slate-700'}>
                إظهار الحركات الدائنة فقط
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. جدول الحركات للحساب (المساحة الأكبر والأهم في الشاشة) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto min-h-[420px] max-h-[620px] overflow-y-auto">
          <table className="w-full text-right text-xs sm:text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 shadow-2xs">
              <tr className="text-slate-700 border-b border-slate-300 font-bold">
                <th className="py-2.5 px-3 border-l border-slate-200 text-center w-16">مسلسل</th>
                <th className="py-2.5 px-3.5 border-l border-slate-200 text-center w-28">التاريخ</th>
                <th className="py-2.5 px-3 border-l border-slate-200 text-left w-28">مدين</th>
                <th className="py-2.5 px-3 border-l border-slate-200 text-left w-28">دائن</th>
                <th className="py-2.5 px-3.5 border-l border-slate-200">البيان</th>
                <th className="py-2.5 px-3 border-l border-slate-200 text-left w-32">رصيد الحركة</th>
                <th className="py-2.5 px-3 text-center w-24">نوع الحركة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {!selectedAccountName ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500 font-medium">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                        <User className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800 mb-1">
                        حقل الحساب فارغ ومستعد للإدخال
                      </h4>
                      <p className="text-xs text-slate-500 text-center leading-relaxed mb-4">
                        اكتب اسم الحساب أو الكود في شريط المعايير أعلاه، أو انقر لاختيار الحساب من القائمة المنسدلة لعرض كشف الحساب والحركات فورياً.
                      </p>
                      {accounts.length > 0 && (
                        <div className="w-full">
                          <span className="text-[11px] font-bold text-slate-400 block mb-2 text-right">
                            أو اختر مباشرة من دليل الحسابات:
                          </span>
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {accounts.slice(0, 6).map((acc) => (
                              <button
                                key={acc.id}
                                type="button"
                                onClick={() => setSelectedAccountName(acc.name)}
                                className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
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
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-medium">
                    لا توجد حركات مسجلة للحساب &quot;{selectedAccountName}&quot; مطابقة لمعايير البحث الحالية
                  </td>
                </tr>
              ) : (
                statementRows.map((row) => (
                  <tr
                    key={`stmt-view-${row.serial}-${row.date}`}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      row.isOpening ? 'bg-amber-50/50 font-semibold' : ''
                    }`}
                  >
                    {/* مسلسل */}
                    <td className="py-2 px-3 border-l border-slate-200 text-center font-mono-numbers text-slate-600">
                      {row.serial}
                    </td>

                    {/* التاريخ */}
                    <td className="py-2 px-3.5 border-l border-slate-200 text-center font-mono font-mono-numbers text-slate-700">
                      {formatDateDMY(row.date)}
                    </td>

                    {/* مدين */}
                    <td className="py-2 px-3 border-l border-slate-200 text-left font-mono font-mono-numbers text-slate-900 font-bold">
                      {row.debit > 0 ? (
                        <span>{row.debit.toLocaleString('en-US')}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* دائن */}
                    <td className="py-2 px-3 border-l border-slate-200 text-left font-mono font-mono-numbers text-emerald-700 font-bold">
                      {row.credit > 0 ? (
                        <span>{row.credit.toLocaleString('en-US')}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* البيان */}
                    <td className="py-2 px-3.5 border-l border-slate-200 text-slate-800">
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
                    <td className="py-2 px-3 border-l border-slate-200 text-left font-mono font-bold font-mono-numbers">
                      <span
                        className={
                          row.runningBalance > 0
                            ? 'text-slate-900'
                            : row.runningBalance < 0
                            ? 'text-rose-700'
                            : 'text-slate-600'
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
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : row.type === 'دفع'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
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

        {/* 4. إجماليات في أسفل الجدول */}
        <div className="px-3.5 py-2.5 sm:px-5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-xs text-slate-500 font-mono-numbers">
            إجمالي الحركات المعروضة: <strong className="text-slate-900 font-bold">{statementRows.length}</strong> حركة
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* مجموع مدين */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-300 shadow-2xs">
              <span className="text-xs font-bold text-slate-600">مجموع مدين:</span>
              <strong className="text-xs sm:text-sm font-mono font-mono-numbers text-slate-900 font-bold">
                {formatCurrency(totalDebit)}
              </strong>
            </div>

            {/* مجموع دائن */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-300 shadow-2xs">
              <span className="text-xs font-bold text-emerald-800">مجموع دائن:</span>
              <strong className="text-xs sm:text-sm font-mono font-mono-numbers text-emerald-700 font-bold">
                {formatCurrency(totalCredit)}
              </strong>
            </div>

            {/* رصيد الحساب */}
            <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-lg shadow-2xs border border-slate-800">
              <span className="text-xs font-bold text-slate-300">رصيد الحساب:</span>
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

      {/* Dedicated Printable Area for AccountStatementView */}
      <div id="view-statement-printable-document" className="print-only">
        <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{REPORT_META.systemName}</h1>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#1e3a8a' }}>
            كشف حساب مالي (Account Statement)
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginTop: '6px' }}>
            <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</span>
            <span>نظام: {REPORT_META.systemName}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '11px' }}>
          <div><strong>اسم الحساب:</strong> {selectedAccountName}</div>
          <div><strong>كود الحساب:</strong> {selectedAccountMeta?.code || '-'}</div>
          <div><strong>تصنيف الحساب:</strong> {selectedAccountMeta?.type || 'عملاء'}</div>
          <div><strong>من تاريخ:</strong> {fromDate ? formatDateDMY(fromDate) : 'البداية'}</div>
          <div><strong>إلى تاريخ:</strong> {toDate ? formatDateDMY(toDate) : 'النهاية'}</div>
          <div><strong>نوع الحركات:</strong> {movementFilter === 'all' ? 'جميع الحركات' : movementFilter === 'debit' ? 'المدينة فقط' : 'الدائنة فقط'}</div>
        </div>

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
              <tr key={`view-print-${r.serial}-${r.date}`}>
                <td style={{ border: '1px solid #94a3b8', padding: '5px', textAlign: 'center', fontFamily: 'monospace' }}>{r.serial}</td>
                <td style={{ border: '1px solid #94a3b8', padding: '5px', textAlign: 'center', fontFamily: 'monospace' }}>{formatDateDMY(r.date)}</td>
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
                <td style={{ border: '1px solid #94a3b8', padding: '5px', textAlign: 'center' }}>{r.type}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
              <td colSpan={2} style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>الإجماليات</td>
              <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left', fontFamily: 'monospace' }}>{totalDebit.toLocaleString('en-US')}</td>
              <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left', fontFamily: 'monospace', color: '#065f46' }}>{totalCredit.toLocaleString('en-US')}</td>
              <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'right' }}>رصيد الحساب:</td>
              <td colSpan={2} style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left', fontFamily: 'monospace', fontSize: '12px' }}>
                {accountBalance.toLocaleString('en-US')} ج.م {accountBalance > 0 ? '(مدين)' : accountBalance < 0 ? '(دائن)' : '(متزن)'}
              </td>
            </tr>
          </tfoot>
        </table>

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
