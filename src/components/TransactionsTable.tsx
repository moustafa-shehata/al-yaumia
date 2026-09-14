import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  History, 
  Edit3, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight,
  User,
  CheckCircle2,
  Calendar,
  X,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ListOrdered
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, formatNumber, formatDateDMY } from '../utils/formatters';

export type TransactionSortMode = 'date_serial_asc' | 'date_serial_desc' | 'serial_asc' | 'serial_desc';

interface TransactionsTableProps {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: number) => void;
  onViewAudit: (transactionId: number) => void;
  onOpenStatementSheet?: (accountName?: string) => void;
  highlightedTxId?: number | null;
  onResequenceTransactions?: () => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  onViewAudit,
  onOpenStatementSheet,
  highlightedTxId,
  onResequenceTransactions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [sortMode, setSortMode] = useState<TransactionSortMode>('date_serial_asc');

  // If a new transaction is highlighted, automatically reset search filters to guarantee it is visible immediately
  React.useEffect(() => {
    if (highlightedTxId) {
      setSearchQuery('');
      setSelectedAccount('ALL');
      setSelectedType('ALL');
    }
  }, [highlightedTxId]);

  // Unique accounts and types for filter dropdowns
  const uniqueAccounts = useMemo(() => {
    const accounts = Array.from(new Set(transactions.map((t) => t.accountName)));
    return accounts.filter(Boolean);
  }, [transactions]);

  const uniqueTypes = useMemo(() => {
    const types = Array.from(new Set(transactions.map((t) => t.type)));
    return types.filter(Boolean);
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return transactions.filter((t) => {
      if (!t) return false;
      const matchesSearch =
        !q ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.accountName || '').toLowerCase().includes(q) ||
        (t.mainAccount || '').toLowerCase().includes(q) ||
        (t.closingAccount || '').toLowerCase().includes(q) ||
        (t.createdBy || '').toLowerCase().includes(q) ||
        (t.date || '').includes(q) ||
        (t.receipt > 0 && t.receipt.toString().includes(q)) ||
        (t.payment > 0 && t.payment.toString().includes(q)) ||
        (t.movementBalance !== 0 && t.movementBalance.toString().includes(q)) ||
        (t.id != null && t.id.toString().includes(q));

      const matchesAccount = selectedAccount === 'ALL' || t.accountName === selectedAccount;
      const matchesType = selectedType === 'ALL' || t.type === selectedType;

      return matchesSearch && matchesAccount && matchesType;
    });
  }, [transactions, searchQuery, selectedAccount, selectedType]);

  // Sorted transactions strictly adhering to date ordering and serial sequence
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (sortMode === 'serial_asc') {
        return a.id - b.id;
      }
      if (sortMode === 'serial_desc') {
        return b.id - a.id;
      }
      if (sortMode === 'date_serial_desc') {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.id - a.id;
      }
      // Default: 'date_serial_asc' (التاريخ تصاعدياً ثم المسلسل تصاعدياً 1..N)
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.id - b.id;
    });
  }, [filteredTransactions, sortMode]);

  // Calculate totals for currently filtered items
  const filteredTotals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, curr) => {
        acc.receipts += curr.receipt || 0;
        acc.payments += curr.payment || 0;
        acc.balance += curr.movementBalance || 0;
        return acc;
      },
      { receipts: 0, payments: 0, balance: 0 }
    );
  }, [filteredTransactions]);

  const hasActiveFilters = searchQuery !== '' || selectedAccount !== 'ALL' || selectedType !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedAccount('ALL');
    setSelectedType('ALL');
  };

  return (
    <div id="section-transactions-table" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Table Header & Search Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                أولاً: ملخص الحركات المالية (جدول البيانات)
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-100 text-blue-800 border border-blue-200 font-mono-numbers">
                {filteredTransactions.length} / {transactions.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              عرض تفريغ قيود الحركة اليومية المسجلة وتفاصيل الحسابات وأرصدة التسوية
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px] sm:min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالبيان، اسم الحساب، أو المسلسل..."
                className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400 text-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Account filter */}
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="text-xs sm:text-sm py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="ALL">جميع الحسابات</option>
              {uniqueAccounts.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>

            {/* Type filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs sm:text-sm py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="ALL">جميع أنواع الحركة</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Sort Order Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as TransactionSortMode)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer text-xs text-slate-700"
                title="ترتيب قيود اليومية حسب التاريخ والمسلسل"
              >
                <option value="date_serial_asc">التاريخ ثم المسلسل (تصاعدي 1 ← N)</option>
                <option value="date_serial_desc">التاريخ ثم المسلسل (تنازلي N ← 1)</option>
                <option value="serial_asc">المسلسل فقط (تصاعدي 1 ← N)</option>
                <option value="serial_desc">المسلسل فقط (تنازلي N ← 1)</option>
              </select>
            </div>

            {/* Optional Resequence button */}
            {onResequenceTransactions && (
              <button
                type="button"
                onClick={onResequenceTransactions}
                className="text-xs py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="إعادة ترقيم مسلسل جميع القيود بالتتابع الزمني حسب التاريخ (1، 2، 3...)"
              >
                <ListOrdered className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden xl:inline">إعادة تسلسل القيود زمنياً</span>
              </button>
            )}

            {onOpenStatementSheet && (
              <button
                onClick={() => onOpenStatementSheet(selectedAccount === 'ALL' ? undefined : selectedAccount)}
                className="text-xs sm:text-sm py-2 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="فتح كشف الحساب المالي المعتمد"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>كشف الحساب</span>
              </button>
            )}

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-2 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                إلغاء التصفية
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Container - Showing all columns with smooth horizontal scroll and sticky Actions column */}
      <div className="w-full overflow-x-auto relative">
        <table className="w-full text-right border-collapse text-xs table-auto min-w-[1050px]">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-[11px] sm:text-xs whitespace-nowrap">
              {/* مسلسل */}
              <th 
                onClick={() => setSortMode((prev) => (prev === 'serial_asc' ? 'serial_desc' : 'serial_asc'))}
                className="py-2.5 px-1.5 text-center w-12 shrink-0 cursor-pointer hover:bg-slate-200/80 transition-colors select-none group"
                title="انقر لترتيب المسلسل (تصاعدي 1..N / تنازلي N..1)"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>مسلسل</span>
                  {sortMode === 'serial_asc' && <ArrowUp className="w-3 h-3 text-blue-600 font-bold" />}
                  {sortMode === 'serial_desc' && <ArrowDown className="w-3 h-3 text-blue-600 font-bold" />}
                  {sortMode !== 'serial_asc' && sortMode !== 'serial_desc' && (
                    <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600" />
                  )}
                </div>
              </th>

              {/* التاريخ */}
              <th 
                onClick={() => setSortMode((prev) => (prev === 'date_serial_asc' ? 'date_serial_desc' : 'date_serial_asc'))}
                className="py-2.5 px-1.5 cursor-pointer hover:bg-slate-200/80 transition-colors select-none group"
                title="انقر لترتيب التاريخ والمسلسل (من الأقدم للأحدث / من الأحدث للأقدم)"
              >
                <div className="flex items-center gap-1">
                  <span>التاريخ</span>
                  {sortMode === 'date_serial_asc' && <ArrowUp className="w-3 h-3 text-blue-600 font-bold" />}
                  {sortMode === 'date_serial_desc' && <ArrowDown className="w-3 h-3 text-blue-600 font-bold" />}
                  {sortMode !== 'date_serial_asc' && sortMode !== 'date_serial_desc' && (
                    <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600" />
                  )}
                </div>
              </th>

              <th className="py-2.5 px-1.5 text-emerald-700">المقبوضات</th>
              <th className="py-2.5 px-1.5 text-amber-700">مدفوعات</th>
              <th className="py-2.5 px-1.5">البيان</th>
              <th className="py-2.5 px-1.5 text-rose-700">رصيد الحركة</th>
              <th className="py-2.5 px-1.5 text-center">نوع الحركة</th>
              <th className="py-2.5 px-1.5">اسم الحساب</th>
              <th className="py-2.5 px-1.5">الحساب الرئيسي</th>
              <th className="py-2.5 px-1.5">الحساب الختامي</th>
              <th className="py-2.5 px-2 text-center no-print min-w-[130px] w-32 sticky left-0 z-20 bg-slate-100 border-r border-slate-200 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {sortedTransactions.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  لا توجد حركات مطابقة لمعايير البحث الحالية.
                </td>
              </tr>
            ) : (
              sortedTransactions.map((item) => {
                const isHighlighted = item.id === highlightedTxId;
                return (
                  <tr 
                    key={item.id}
                    id={`transaction-row-${item.id}`}
                    className={`transition-all duration-700 ${
                      isHighlighted 
                        ? 'bg-emerald-100/70 ring-2 ring-emerald-500/80 shadow-md font-semibold' 
                        : 'hover:bg-blue-50/40'
                    }`}
                  >
                    {/* المسلسل */}
                    <td className="py-2 px-1.5 text-center font-bold text-slate-900 font-mono-numbers bg-slate-50/40 text-[11px]">
                      <div className="flex items-center justify-center gap-1">
                        <span>{item.id}</span>
                        {isHighlighted && (
                          <span className="px-1 py-0.2 text-[9px] font-extrabold bg-emerald-600 text-white rounded shadow-xs animate-bounce">
                            جديد
                          </span>
                        )}
                      </div>
                    </td>

                  {/* التاريخ (DD/MM/YYYY - الشهر في الوسط) */}
                  <td className="py-2 px-1.5 font-mono-numbers text-slate-600 whitespace-nowrap text-[11px]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{formatDateDMY(item.date)}</span>
                    </div>
                  </td>

                  {/* المقبوضات */}
                  <td className="py-2 px-1.5 font-bold text-emerald-700 font-mono-numbers whitespace-nowrap text-[11px] sm:text-xs">
                    {item.receipt > 0 ? (
                      <span className="flex items-center gap-0.5">
                        <ArrowDownLeft className="w-3 h-3 text-emerald-600 inline shrink-0" />
                        {item.receipt.toLocaleString('en-US')}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>

                  {/* مدفوعات */}
                  <td className="py-2 px-1.5 font-mono-numbers text-slate-500 whitespace-nowrap text-[11px] sm:text-xs">
                    {item.payment > 0 ? (
                      <span className="text-amber-700 font-bold flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3 text-amber-600 inline shrink-0" />
                        {item.payment.toLocaleString('en-US')}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>

                  {/* البيان */}
                  <td className="py-2 px-1.5 font-medium text-slate-900 text-[11px] sm:text-xs max-w-[140px] sm:max-w-[200px] truncate" title={item.description}>
                    {item.description}
                  </td>

                  {/* رصيد الحركة */}
                  <td className="py-2 px-1.5 font-bold font-mono-numbers whitespace-nowrap text-[11px]">
                    <span 
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        item.movementBalance < 0
                          ? 'text-rose-700 bg-rose-50 border border-rose-100'
                          : 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                      }`}
                    >
                      {item.movementBalance.toLocaleString('en-US')}
                    </span>
                  </td>

                  {/* نوع الحركة */}
                  <td className="py-2 px-1.5 text-center whitespace-nowrap">
                    {(() => {
                      const isPayment =
                        item.type === 'دفع' ||
                        item.type === 'صرف' ||
                        (Number(item.payment) > 0 && (Number(item.receipt) || 0) === 0);
                      const displayType = isPayment ? 'دفع' : 'قبض';
                      return (
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                            displayType === 'قبض'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {displayType}
                        </span>
                      );
                    })()}
                  </td>

                  {/* اسم الحساب */}
                  <td className="py-2 px-1.5 font-bold text-slate-800 whitespace-nowrap text-[11px] sm:text-xs">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[100px] sm:max-w-none">{item.accountName}</span>
                    </div>
                  </td>

                  {/* الحساب الرئيسي */}
                  <td className="py-2 px-1.5 whitespace-nowrap text-slate-600 text-[11px]">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                      {item.mainAccount}
                    </span>
                  </td>

                  {/* الحساب الختامي */}
                  <td className="py-2 px-1.5 whitespace-nowrap text-slate-600 text-[11px]">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                      {item.closingAccount}
                    </span>
                  </td>

                  {/* إجراءات */}
                  <td
                    className={`py-2 px-2 text-center no-print whitespace-nowrap min-w-[130px] w-32 sticky left-0 z-10 border-r border-slate-200 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)] transition-colors ${
                      isHighlighted ? 'bg-amber-50 group-hover:bg-amber-100/80' : 'bg-white group-hover:bg-blue-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {onOpenStatementSheet && (
                        <button
                          onClick={() => onOpenStatementSheet(item.accountName)}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          title={`عرض كشف حساب: ${item.accountName}`}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                      )}

                      <button
                        onClick={() => onViewAudit(item.id)}
                        className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title="عرض سجل نشاط المستخدمين لهذه الحركة"
                      >
                        <History className="w-3.5 h-3.5 text-blue-600" />
                      </button>

                      <button
                        onClick={() => onEditTransaction(item)}
                        className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title="تعديل بيانات القيد"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600 hover:text-blue-600" />
                      </button>

                      <button
                        onClick={() => onDeleteTransaction(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="حذف القيد"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>

          {/* Totals Footer Row */}
          <tfoot>
            <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
              <td className="py-2.5 px-1.5 text-center">الإجمالي</td>
              <td className="py-2.5 px-1.5 text-slate-500 text-xs font-mono-numbers">
                {filteredTransactions.length} سجل
              </td>
              <td className="py-2.5 px-1.5 text-emerald-700 font-mono-numbers whitespace-nowrap">
                {filteredTotals.receipts.toLocaleString('en-US')} ج.م
              </td>
              <td className="py-2.5 px-1.5 text-amber-700 font-mono-numbers whitespace-nowrap">
                {filteredTotals.payments > 0 ? `${filteredTotals.payments.toLocaleString('en-US')} ج.م` : '-'}
              </td>
              <td className="py-2.5 px-1.5 text-slate-500 text-xs">
                إجمالي حركة اليوم
              </td>
              <td className="py-2.5 px-1.5 text-rose-700 font-mono-numbers whitespace-nowrap">
                {filteredTotals.balance.toLocaleString('en-US')} ج.م
              </td>
              <td colSpan={4} className="py-2.5 px-1.5 text-slate-500 text-xs text-left pl-4">
                مطابق لقيود اليومية
              </td>
              <td className="py-2.5 px-2 text-center sticky left-0 bg-slate-100 border-r border-slate-300 z-10"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
