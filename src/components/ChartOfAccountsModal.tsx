import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  X,
  Check,
  Building2,
  Phone,
  Layers,
  ArrowRightLeft,
  Filter,
  Wallet,
  Landmark,
  Users,
  CreditCard,
  Printer,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import { Account, Transaction } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface ChartOfAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: Transaction[];
  mode?: 'select' | 'manage';
  selectedAccountName?: string;
  onSelectAccount?: (account: Account) => void;
  onOpenAddAccountModal: () => void;
  onOpenImportModal?: () => void;
  onOpenStatementSheet?: (accountName: string) => void;
  onOpenAccountCard?: (account?: Account) => void;
}

export const ChartOfAccountsModal: React.FC<ChartOfAccountsModalProps> = ({
  isOpen,
  onClose,
  accounts = [],
  transactions = [],
  mode = 'manage',
  selectedAccountName,
  onSelectAccount,
  onOpenAddAccountModal,
  onOpenImportModal,
  onOpenStatementSheet,
  onOpenAccountCard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Compute live balances and transaction count for each account
  const accountsWithCalculations = useMemo(() => {
    return accounts.map((acc) => {
      const txs = transactions.filter((t) => t.accountName === acc.name);
      const totalReceipts = txs.reduce((sum, t) => sum + (t.receipt || 0), 0);
      const totalPayments = txs.reduce((sum, t) => sum + (t.payment || 0), 0);
      
      // Calculate current net balance
      // For Customer (عملاء) / Assets: Opening + Payments (Debits) - Receipts (Credits) or standard
      const currentBalance = (acc.openingBalance || 0) + totalReceipts - totalPayments;

      return {
        ...acc,
        code: acc.code || `120${acc.id.replace(/\D/g, '').slice(-3) || '101'}`,
        transactionCount: txs.length,
        totalReceipts,
        totalPayments,
        calculatedBalance: currentBalance,
      };
    });
  }, [accounts, transactions]);

  // Categories definition
  const categories = useMemo(() => {
    return [
      { id: 'ALL', label: 'كافة الحسابات', count: accounts.length },
      {
        id: 'عملاء',
        label: 'حسابات العملاء (12)',
        count: accounts.filter((a) => a.type === 'عملاء').length,
      },
      {
        id: 'صندوق / بنك',
        label: 'الخزينة والبنوك (11)',
        count: accounts.filter((a) => a.type === 'صندوق / بنك').length,
      },
      {
        id: 'موردين',
        label: 'حسابات الموردين (21)',
        count: accounts.filter((a) => a.type === 'موردين').length,
      },
      {
        id: 'مصروفات',
        label: 'المصروفات التشغيلية (51)',
        count: accounts.filter((a) => a.type === 'مصروفات').length,
      },
      {
        id: 'إيرادات',
        label: 'إيرادات النشاط (41)',
        count: accounts.filter((a) => a.type === 'إيرادات').length,
      },
    ];
  }, [accounts]);

  // Filtered accounts based on search and category
  const filteredAccounts = useMemo(() => {
    return accountsWithCalculations.filter((acc) => {
      // Category filter
      if (selectedCategory !== 'ALL' && acc.type !== selectedCategory) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = acc.name.toLowerCase().includes(query);
        const matchCode = (acc.code || '').toLowerCase().includes(query);
        const matchMain = (acc.mainAccount || '').toLowerCase().includes(query);
        const matchType = (acc.type || '').toLowerCase().includes(query);
        return matchName || matchCode || matchMain || matchType;
      }

      return true;
    });
  }, [accountsWithCalculations, selectedCategory, searchTerm]);

  // Account Type Badge Helper
  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'عملاء':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
            <Users className="w-3 h-3 text-blue-600" />
            عملاء
          </span>
        );
      case 'صندوق / بنك':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
            <Landmark className="w-3 h-3 text-emerald-600" />
            صندوق / بنك
          </span>
        );
      case 'موردين':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-amber-600" />
            موردين
          </span>
        );
      case 'مصروفات':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
            <Wallet className="w-3 h-3 text-rose-600" />
            مصروفات
          </span>
        );
      case 'إيرادات':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-teal-600" />
            إيرادات
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {type}
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div
        id="chart-of-accounts-modal"
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[760px] flex flex-col border border-[#bcd2e8] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[#004e8c] bg-gradient-to-r from-[#003e73] via-[#005a9e] to-[#0078d4] text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 text-white rounded-lg border border-white/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  دليل الحسابات المالي (Chart of Accounts)
                </h3>
                {mode === 'select' && (
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-900 text-[11px] font-extrabold rounded-full shadow-xs">
                    اختيار الحساب للحركة
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100">
                المرجع المحاسبي المعتمد لحقل اسم الحساب والحساب الرئيسي والختامي في قيود اليومية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAccountCard && (
              <button
                onClick={() => onOpenAccountCard()}
                className="h-8 px-2.5 sm:px-3 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-300 shadow-2xs"
                title="فتح شاشة بطاقة الحساب المالي للتصفح والتعديل والإنشاء"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-800" />
                <span>بطاقة الحساب</span>
              </button>
            )}

            {onOpenImportModal && (
              <button
                onClick={onOpenImportModal}
                className="h-8 px-2.5 sm:px-3 text-xs font-bold text-white bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-white/25 shadow-2xs"
                title="استيراد دليل الحسابات من ملف CSV أو نسخ من الإكسيل"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">استيراد دليل حسابات</span>
                <span className="sm:hidden">استيراد</span>
              </button>
            )}

            <button
              onClick={onOpenAddAccountModal}
              className="h-8 px-3 text-xs font-bold text-emerald-950 bg-emerald-300 hover:bg-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="إضافة حساب جديد للدليل"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حساب جديد</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-blue-100 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Filters & Quick Stats */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-[#f0f6fc] via-[#f7fafe] to-[#f0f6fc] border-b border-[#bcd2e8] space-y-3 shrink-0">
          {/* Row 1: Search & Add */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#6c8cae] absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بكود الحساب، أو اسم الحساب، أو الحساب الرئيسي..."
                className="w-full h-9 pr-9 pl-4 text-xs sm:text-sm bg-white border border-[#bcd2e8] rounded-lg focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] focus:outline-none placeholder:text-[#718fae] text-[#0f2d52]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#718fae] hover:text-[#0f2d52] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick summary note */}
            <div className="text-xs text-[#1e3a5f] whitespace-nowrap hidden md:flex items-center gap-1 font-medium bg-white px-3 py-1.5 rounded-lg border border-[#bcd2e8]">
              <span>الحسابات المطابقة:</span>
              <strong className="text-[#0078d4] font-mono-numbers">{filteredAccounts.length}</strong>
              <span className="text-[#718fae]">من أصل</span>
              <strong className="font-mono-numbers text-[#0f2d52]">{accounts.length}</strong>
            </div>
          </div>

          {/* Row 2: Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            <span className="text-xs font-bold text-[#1e3a5f] flex items-center gap-1 pl-1 shrink-0">
              <Filter className="w-3 h-3 text-[#0078d4]" />
              <span>التصنيف:</span>
            </span>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`h-7 px-2.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#0078d4] text-white shadow-2xs font-bold'
                      : 'bg-white text-[#1e3a5f] hover:bg-[#e1edf8] border border-[#bcd2e8]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono-numbers ${
                      isSelected ? 'bg-white/20 text-white font-bold' : 'bg-[#e8f1f9] text-[#1e3a5f]'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accounts Table List */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-3 sm:p-5">
          {filteredAccounts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#f7fafe] rounded-xl border border-dashed border-[#bcd2e8]">
              <BookOpen className="w-10 h-10 text-[#6c8cae] mb-2" />
              <h4 className="font-bold text-[#0f2d52] text-sm mb-1">لا توجد حسابات مطابقة</h4>
              <p className="text-xs text-[#55789e] max-w-sm mb-4">
                لم يتم العثور على أي حساب مطابق لكلمة البحث في دليل الحسابات المالي الحالي.
              </p>
              <button
                onClick={onOpenAddAccountModal}
                className="px-3.5 py-1.5 bg-[#0078d4] hover:bg-[#0067b8] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة هذا الحساب للدليل الآن</span>
              </button>
            </div>
          ) : (
            <div className="border border-[#bcd2e8] rounded-xl overflow-hidden shadow-2xs bg-white">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-gradient-to-b from-[#eaf2fb] via-[#e2eef9] to-[#d6e5f5] text-[#1e3a5f] border-b border-[#bcd2e8] font-bold">
                    <th className="py-2.5 px-3 border-l border-[#bcd2e8] w-24 text-center">كود الحساب</th>
                    <th className="py-2.5 px-3.5 border-l border-[#bcd2e8]">اسم الحساب المالي</th>
                    <th className="py-2.5 px-3 border-l border-[#bcd2e8]">التصنيف والنوع</th>
                    <th className="py-2.5 px-3 border-l border-[#bcd2e8] hidden md:table-cell">الحساب الرئيسي</th>
                    <th className="py-2.5 px-3 border-l border-[#bcd2e8] hidden lg:table-cell">الحساب الختامي</th>
                    <th className="py-2.5 px-3 border-l border-[#bcd2e8] text-left">الرصيد التراكمي</th>
                    <th className="py-2.5 px-3 text-center w-36">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4edf5]">
                  {filteredAccounts.map((acc) => {
                    const isCurrentSelection = selectedAccountName === acc.name;
                    return (
                      <tr
                        key={acc.id}
                        onDoubleClick={() => {
                          if (onOpenAccountCard) onOpenAccountCard(acc);
                        }}
                        className={`hover:bg-[#f1f6fc] transition-colors cursor-pointer ${
                          isCurrentSelection ? 'bg-[#e3effa] font-bold' : ''
                        }`}
                      >
                        {/* كود الحساب */}
                        <td className="py-2.5 px-3 border-l border-[#bcd2e8] text-center font-mono font-bold text-[#0f2d52] font-mono-numbers">
                          <span className="px-2 py-0.5 bg-[#f0f6fc] border border-[#bcd2e8] rounded text-[#0f2d52] text-[11px] block">
                            {acc.code}
                          </span>
                        </td>

                        {/* اسم الحساب */}
                        <td className="py-2.5 px-3.5 border-l border-[#bcd2e8]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0f2d52] text-xs sm:text-sm">
                              {acc.name}
                            </span>
                            {isCurrentSelection && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#0078d4] text-white font-bold">
                                الحساب المختار
                              </span>
                            )}
                          </div>
                          {acc.notes && (
                            <p className="text-[11px] text-[#55789e] truncate max-w-xs">{acc.notes}</p>
                          )}
                        </td>

                        {/* التصنيف والنوع */}
                        <td className="py-2.5 px-3 border-l border-[#bcd2e8] whitespace-nowrap">
                          {renderTypeBadge(acc.type)}
                        </td>

                        {/* الحساب الرئيسي */}
                        <td className="py-2.5 px-3 border-l border-[#bcd2e8] hidden md:table-cell text-[#1e3a5f]">
                          <span className="font-medium">{acc.mainAccount || 'العملاء'}</span>
                        </td>

                        {/* الحساب الختامي */}
                        <td className="py-2.5 px-3 border-l border-[#bcd2e8] hidden lg:table-cell text-[#55789e]">
                          <span className="px-1.5 py-0.5 bg-[#f0f6fc] border border-[#d3e3f3] rounded text-[10px] font-medium text-[#1e3a5f]">
                            {acc.closingAccount || 'ميزانية'}
                          </span>
                        </td>

                        {/* الرصيد التراكمي */}
                        <td className="py-2.5 px-3 border-l border-[#bcd2e8] text-left font-mono font-bold font-mono-numbers">
                          <span
                            className={
                              acc.calculatedBalance > 0
                                ? 'text-emerald-700'
                                : acc.calculatedBalance < 0
                                ? 'text-rose-700'
                                : 'text-[#55789e]'
                            }
                          >
                            {formatCurrency(acc.calculatedBalance)}
                          </span>
                        </td>

                        {/* إجراء الاختيار / كشف الحساب / بطاقة الحساب */}
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          {mode === 'select' && onSelectAccount ? (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectAccount(acc);
                                onClose();
                              }}
                              className="w-full py-1 px-2.5 bg-[#0078d4] hover:bg-[#0067b8] text-white font-bold rounded-md transition-all text-xs flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>اختيار</span>
                            </button>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              {onOpenAccountCard && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenAccountCard(acc);
                                  }}
                                  className="py-1 px-2 text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 font-semibold rounded-md transition-colors text-xs flex items-center gap-1 cursor-pointer"
                                  title="فتح بطاقة الحساب (تعديل، تصفح، حفظ)"
                                >
                                  <Building2 className="w-3.5 h-3.5 text-amber-700" />
                                  <span>البطاقة</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClose();
                                  if (onOpenStatementSheet) {
                                    onOpenStatementSheet(acc.name);
                                  }
                                }}
                                className="py-1 px-2 text-[#1e3a5f] bg-[#f0f6fc] hover:bg-[#e1edf8] border border-[#bcd2e8] font-semibold rounded-md transition-colors text-xs flex items-center gap-1 cursor-pointer"
                                title="عرض كشف الحساب ودفتر الأستاذ"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                <span>كشف الحساب</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 sm:px-6 bg-gradient-to-r from-[#f0f6fc] to-[#e8f1f9] border-t border-[#bcd2e8] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#1e3a5f]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              دليل الحسابات معتمد وفق القواعد المحاسبية (الأصول 1 - الخصوم 2 - الإيرادات 4 - المصروفات 5)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white hover:bg-[#f0f6fc] border border-[#bcd2e8] text-[#1e3a5f] font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-2xs"
            >
              إغلاق الدليل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
