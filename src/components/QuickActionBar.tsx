import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus,
  UserPlus,
  BookOpen,
  FileSpreadsheet,
  History,
  Users,
  Search,
  X,
  Printer,
  Download,
  Upload,
  BarChart3,
  RotateCcw,
  Layers,
  CornerDownLeft,
} from 'lucide-react';

export interface OperationItem {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badge?: string;
  shortcut?: string;
  keywords: string[];
  action: () => void;
}

interface QuickActionBarProps {
  onAddTransaction: () => void;
  onAddAccount: () => void;
  onOpenChartOfAccounts: () => void;
  onOpenStatementSheet: () => void;
  onOpenUserActivityLogs: () => void;
  onOpenUserManagement: () => void;
  activityCount?: number;
  onPrint?: () => void;
  onExportCSV?: () => void;
  onOpenImportAccounts?: () => void;
  onNavigateToDailyMovements?: () => void;
  onNavigateToFinancialAnalysis?: () => void;
  onResetData?: () => void;
}

// دالة تسوية الحروف العربية لتسهيل البحث الذكي
function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // إزالة التشكيل
    .trim();
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  onAddTransaction,
  onAddAccount,
  onOpenChartOfAccounts,
  onOpenStatementSheet,
  onOpenUserActivityLogs,
  onOpenUserManagement,
  activityCount = 0,
  onPrint,
  onExportCSV,
  onOpenImportAccounts,
  onNavigateToDailyMovements,
  onNavigateToFinancialAnalysis,
  onResetData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // قائمة العمليات والأوامر الشاملة داخل النظام
  const operations: OperationItem[] = useMemo(() => {
    const list: OperationItem[] = [
      {
        id: 'op-add-tx',
        title: 'إضافة حركة مالية جديدة',
        category: 'العمليات المالية',
        description: 'تسجيل سند قبض أو صرف أو قيد يومية جديد في دفتر اليومية',
        icon: Plus,
        iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
        shortcut: 'F2',
        keywords: ['اضافة', 'حركة', 'جديدة', 'تسجيل', 'سند', 'قبض', 'صرف', 'قيد', 'مدين', 'دائن'],
        action: onAddTransaction,
      },
      {
        id: 'op-add-acc',
        title: 'إضافة حساب جديد',
        category: 'دليل الحسابات',
        description: 'إضافة عميل أو مورد أو حساب بنكي أو خزينة جديدة إلى الدليل المحاسبي',
        icon: UserPlus,
        iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        shortcut: 'F3',
        keywords: ['اضافة', 'حساب', 'عميل', 'مورد', 'بنك', 'خزينة', 'جديد', 'شجرة'],
        action: onAddAccount,
      },
      {
        id: 'op-chart-acc',
        title: 'دليل الحسابات الشجري',
        category: 'دليل الحسابات',
        description: 'استعراض شجرة الحسابات المالية، الأرصدة الافتتاحية، والمستويات المحاسبية',
        icon: BookOpen,
        iconColor: 'text-sky-600 bg-sky-50 border-sky-200',
        shortcut: 'F4',
        keywords: ['دليل', 'شجرة', 'الحسابات', 'الاصول', 'الخصوم', 'المصروفات', 'الايرادات'],
        action: onOpenChartOfAccounts,
      },
      {
        id: 'op-statement',
        title: 'كشف الحساب ودفتر الأستاذ',
        category: 'التقارير المالية',
        description: 'معاينة كشف حساب تفصيلي لأي عميل أو حساب ومطابقة الرصيد المرحل',
        icon: FileSpreadsheet,
        iconColor: 'text-teal-600 bg-teal-50 border-teal-200',
        shortcut: 'F5',
        keywords: ['كشف', 'حساب', 'دفتر', 'استاذ', 'مطابقة', 'رصيد', 'عميل'],
        action: onOpenStatementSheet,
      },
      {
        id: 'op-activity-log',
        title: 'سجل نشاط المستخدمين والتدقيق',
        category: 'الأمان والرقابة',
        description: 'عرض ومراجعة سجل الحركات والتعديلات والمحذوفات لكل مستخدم',
        icon: History,
        iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        shortcut: 'F6',
        keywords: ['سجل', 'نشاط', 'تدقيق', 'audit', 'تتبع', 'مستخدمين', 'تاريخ', 'حركات'],
        action: onOpenUserActivityLogs,
      },
      {
        id: 'op-users',
        title: 'إدارة المستخدمين والصلاحيات',
        category: 'الأمان والرقابة',
        description: 'إدارة حسابات النظام وكلمات المرور والصلاحيات وتراخيص الحسابات',
        icon: Users,
        iconColor: 'text-purple-600 bg-purple-50 border-purple-200',
        shortcut: 'F7',
        keywords: ['ادارة', 'مستخدمين', 'صلاحيات', 'امان', 'كلمة مرور', 'تعديل مستخدم'],
        action: onOpenUserManagement,
      },
    ];

    if (onPrint) {
      list.push({
        id: 'op-print',
        title: 'معاينة وطباعة التقرير المالي الرسمي',
        category: 'الطباعة والتقارير',
        description: 'تجهيز وطباعة تقرير اليومية ودفتر الأستاذ أو تصديره إلى ملف PDF',
        icon: Printer,
        iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
        shortcut: 'Ctrl+P',
        keywords: ['طباعة', 'تقرير', 'pdf', 'معاينة', 'طباعه', 'ورق'],
        action: onPrint,
      });
    }

    if (onExportCSV) {
      list.push({
        id: 'op-export',
        title: 'تصدير البيانات إلى Excel / CSV',
        category: 'الطباعة والتقارير',
        description: 'تصدير وتنزيل كافة بيانات الحركات المالية الحالية إلى جدول إكسيل',
        icon: Download,
        iconColor: 'text-green-600 bg-green-50 border-green-200',
        keywords: ['تصدير', 'اكسيل', 'excel', 'csv', 'تنزيل', 'تحميل', 'شيت'],
        action: onExportCSV,
      });
    }

    if (onOpenImportAccounts) {
      list.push({
        id: 'op-import-accounts',
        title: 'استيراد الحسابات من ملف Excel',
        category: 'دليل الحسابات',
        description: 'رفع واستيراد دليل الحسابات دفعة واحدة من ملف إكسيل مهيأ',
        icon: Upload,
        iconColor: 'text-cyan-600 bg-cyan-50 border-cyan-200',
        keywords: ['استيراد', 'رفع', 'ملف', 'اكسيل', 'excel', 'حسابات'],
        action: onOpenImportAccounts,
      });
    }

    if (onNavigateToFinancialAnalysis) {
      list.push({
        id: 'op-financial-analysis',
        title: 'التحليل المالي والتدفق النقدي (Cash Flow)',
        category: 'التحليلات والمؤشرات',
        description: 'عرض الرسوم البيانية ومخطط المقبوضات والمدفوعات والمؤشرات المالية',
        icon: BarChart3,
        iconColor: 'text-violet-600 bg-violet-50 border-violet-200',
        keywords: ['تحليل', 'مالي', 'رسم', 'بياني', 'مخطط', 'مقبوضات', 'مدفوعات', 'تدفق نقدي'],
        action: onNavigateToFinancialAnalysis,
      });
    }

    if (onNavigateToDailyMovements) {
      list.push({
        id: 'op-daily-movements',
        title: 'بيان حركة اليومية والقيود',
        category: 'العمليات المالية',
        description: 'عرض جدول القيود اليومية العامة والحركات المحاسبية المسجلة',
        icon: Layers,
        iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
        keywords: ['حركة', 'يومية', 'جدول', 'قيود', 'بيان', 'عرض'],
        action: onNavigateToDailyMovements,
      });
    }

    if (onResetData) {
      list.push({
        id: 'op-reset-data',
        title: 'إعادة تعيين البيانات الافتراضية للنظام',
        category: 'إدارة النظام',
        description: 'استرجاع البيانات المحاسبية الأولية وقائمة الحسابات الافتراضية',
        icon: RotateCcw,
        iconColor: 'text-rose-600 bg-rose-50 border-rose-200',
        keywords: ['اعادة', 'ضبط', 'تصفير', 'افتراضي', 'بيانات', 'reset'],
        action: onResetData,
      });
    }

    return list;
  }, [
    onAddTransaction,
    onAddAccount,
    onOpenChartOfAccounts,
    onOpenStatementSheet,
    onOpenUserActivityLogs,
    onOpenUserManagement,
    onPrint,
    onExportCSV,
    onOpenImportAccounts,
    onNavigateToFinancialAnalysis,
    onNavigateToDailyMovements,
    onResetData,
  ]);

  // تصفية العمليات حسب استعلام البحث
  const filteredOperations = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) {
      return operations;
    }
    const q = normalizeArabic(rawQuery);
    return operations.filter((op) => {
      const titleMatch = normalizeArabic(op.title).includes(q);
      const descMatch = normalizeArabic(op.description).includes(q);
      const catMatch = normalizeArabic(op.category).includes(q);
      const keywordMatch = op.keywords.some((kw) => normalizeArabic(kw).includes(q));
      const shortcutMatch = op.shortcut ? op.shortcut.toLowerCase().includes(rawQuery.toLowerCase()) : false;
      return titleMatch || descMatch || catMatch || keywordMatch || shortcutMatch;
    });
  }, [operations, searchQuery]);

  // إعادة ضبط مؤشر التحديد عند تغيير نتائج البحث
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOperations]);

  // إغلاق القائمة عند النقر في أي مكان خارج الحاوية
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputActive = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // فتح حقل البحث السريع بالضغط على '/' أو 'Ctrl+K'
      if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && !isInputActive) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsDropdownOpen(true);
        return;
      }

      // إذا كان التركيز داخل حقل البحث
      if (document.activeElement === searchInputRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (searchQuery) {
            setSearchQuery('');
          } else {
            setIsDropdownOpen(false);
            searchInputRef.current?.blur();
          }
          return;
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setIsDropdownOpen(true);
          setHighlightedIndex((prev) => (prev + 1 < filteredOperations.length ? prev + 1 : 0));
          return;
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setIsDropdownOpen(true);
          setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredOperations.length - 1));
          return;
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredOperations.length > 0 && highlightedIndex < filteredOperations.length) {
            executeOperation(filteredOperations[highlightedIndex]);
          }
          return;
        }
      }

      // اختصارات F2..F7 للعمليات المباشرة
      if (!isInputActive) {
        if (e.key === 'F2') {
          e.preventDefault();
          onAddTransaction();
        } else if (e.key === 'F3') {
          e.preventDefault();
          onAddAccount();
        } else if (e.key === 'F4') {
          e.preventDefault();
          onOpenChartOfAccounts();
        } else if (e.key === 'F5') {
          e.preventDefault();
          onOpenStatementSheet();
        } else if (e.key === 'F6') {
          e.preventDefault();
          onOpenUserActivityLogs();
        } else if (e.key === 'F7') {
          e.preventDefault();
          onOpenUserManagement();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onAddTransaction,
    onAddAccount,
    onOpenChartOfAccounts,
    onOpenStatementSheet,
    onOpenUserActivityLogs,
    onOpenUserManagement,
    filteredOperations,
    highlightedIndex,
    searchQuery,
  ]);

  // تنفيذ العملية وتفريغ حقل البحث
  const executeOperation = (op: OperationItem) => {
    op.action();
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  // مسح نص البحث بالكامل وإعادة التركيز
  const handleClearSearch = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSearchQuery('');
    setIsDropdownOpen(false);
    searchInputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      id="quick-actions-bar"
      className="bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200/90 border border-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.06)] rounded-lg px-2.5 py-1.5 select-none no-print relative"
      dir="rtl"
    >
      {/* صف أفقي واحد متناسق يجمع أزرار العمليات المصغرة + حقل البحث عن العمليات */}
      <div className="flex flex-nowrap items-center justify-between gap-1.5 sm:gap-2">
        
        {/* مجموعة أزرار العمليات المصغرة في صف واحد متصل */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          
          {/* 1. إضافة حركة - F2 */}
          <button
            id="quick-btn-add-tx"
            type="button"
            onClick={onAddTransaction}
            className="h-7.5 inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 text-xs font-bold text-white bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 hover:from-blue-600 hover:to-blue-800 active:from-blue-950 active:to-blue-900 border border-blue-950 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.18)] active:shadow-inner active:translate-y-px transition-all cursor-pointer whitespace-nowrap group"
            title="تسجيل حركة مالية جديدة في بيان اليومية [F2]"
          >
            <Plus className="w-3.5 h-3.5 text-blue-200 stroke-[2.6] group-hover:scale-110 transition-transform" />
            <span>إضافة حركة</span>
            <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-mono font-bold bg-blue-950/70 text-blue-200 rounded border border-blue-800/80">
              F2
            </kbd>
          </button>

          {/* 2. إضافة حساب - F3 */}
          <button
            id="quick-btn-add-account"
            type="button"
            onClick={onAddAccount}
            className="h-7.5 inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 text-xs font-bold text-white bg-gradient-to-b from-emerald-700 via-emerald-800 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 active:from-emerald-950 active:to-emerald-900 border border-emerald-950 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.18)] active:shadow-inner active:translate-y-px transition-all cursor-pointer whitespace-nowrap group"
            title="إضافة حساب مالي أو عميل جديد إلى الدليل المحاسبي [F3]"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-200 stroke-[2.3] group-hover:scale-110 transition-transform" />
            <span>إضافة حساب</span>
            <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-mono font-bold bg-emerald-950/70 text-emerald-200 rounded border border-emerald-800/80">
              F3
            </kbd>
          </button>

          <span className="hidden sm:inline-block h-5 w-px bg-slate-300 mx-0.5" />

          {/* 3. دليل الحسابات - F4 */}
          <button
            id="quick-btn-chart-of-accounts"
            type="button"
            onClick={onOpenChartOfAccounts}
            className="h-7.5 inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 active:bg-slate-200 border border-slate-300 hover:border-slate-400 rounded shadow-2xs active:translate-y-px transition-all cursor-pointer whitespace-nowrap group"
            title="فتح دليل الحسابات المالي الشجري والمفصل [F4]"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-700 stroke-[2.2] group-hover:scale-110 transition-transform" />
            <span>دليل الحسابات</span>
            <kbd className="hidden xl:inline-block px-1 py-0.2 text-[9px] font-mono font-bold bg-slate-100 text-slate-600 rounded border border-slate-300">
              F4
            </kbd>
          </button>

          {/* 4. كشف الحساب - F5 */}
          <button
            id="quick-btn-statement"
            type="button"
            onClick={onOpenStatementSheet}
            className="h-7.5 inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 active:bg-slate-200 border border-slate-300 hover:border-slate-400 rounded shadow-2xs active:translate-y-px transition-all cursor-pointer whitespace-nowrap group"
            title="معاينة كشف الحساب ودفتر الأستاذ [F5]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 stroke-[2.2] group-hover:scale-110 transition-transform" />
            <span>كشف الحساب</span>
            <kbd className="hidden xl:inline-block px-1 py-0.2 text-[9px] font-mono font-bold bg-slate-100 text-slate-600 rounded border border-slate-300">
              F5
            </kbd>
          </button>

          <span className="hidden sm:inline-block h-5 w-px bg-slate-300 mx-0.5" />

          {/* 5. سجل النشاط - F6 */}
          <button
            id="quick-btn-user-activity-log"
            type="button"
            onClick={onOpenUserActivityLogs}
            className="h-7.5 inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 active:bg-slate-200 border border-slate-300 hover:border-slate-400 rounded shadow-2xs active:translate-y-px transition-all cursor-pointer whitespace-nowrap group"
            title="سجل نشاط المستخدمين وتتبع الحركات والعمليات [F6]"
          >
            <History className="w-3.5 h-3.5 text-indigo-700 stroke-[2.2] group-hover:scale-110 transition-transform" />
            <span>سجل النشاط</span>
            {activityCount > 0 && (
              <span className="px-1 py-0.2 bg-indigo-600 text-white text-[9px] font-bold rounded font-mono shadow-2xs">
                {activityCount}
              </span>
            )}
            <kbd className="hidden xl:inline-block px-1 py-0.2 text-[9px] font-mono font-bold bg-slate-100 text-slate-600 rounded border border-slate-300">
              F6
            </kbd>
          </button>

          {/* 6. إدارة المستخدمين - F7 */}
          <button
            id="quick-btn-user-management"
            type="button"
            onClick={onOpenUserManagement}
            className="h-7.5 inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 active:bg-slate-200 border border-slate-300 hover:border-slate-400 rounded shadow-2xs active:translate-y-px transition-all cursor-pointer whitespace-nowrap group"
            title="إدارة المستخدمين وصلاحيات الحسابات [F7]"
          >
            <Users className="w-3.5 h-3.5 text-purple-700 stroke-[2.2] group-hover:scale-110 transition-transform" />
            <span>إدارة المستخدمين</span>
            <kbd className="hidden xl:inline-block px-1 py-0.2 text-[9px] font-mono font-bold bg-slate-100 text-slate-600 rounded border border-slate-300">
              F7
            </kbd>
          </button>
        </div>

        {/* حقل البحث عن العمليات والأوامر داخل النظام */}
        <div className="relative min-w-[200px] sm:min-w-[270px] md:min-w-[310px] max-w-sm flex-1 shrink">
          {/* أيقونة البحث في بداية الحقل (اليمين في RTL) */}
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          
          <input
            ref={searchInputRef}
            id="quick-bar-operation-search"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="بحث عن عملية (إضافة حركة، حساب، كشف، دليل)..."
            className="w-full h-7.5 pr-8 pl-16 text-xs bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 rounded shadow-2xs placeholder-slate-400 text-slate-800 focus:outline-none transition-all"
            title="ابحث عن أي عملية أو أمر في النظام لتنفيذه مباشرة"
            autoComplete="off"
          />

          {/* الجزء الأيسر من الحقل: زر مسح المحتوى + اختصار لوحة المفاتيح */}
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
            {searchQuery ? (
              <button
                id="quick-bar-clear-search-btn"
                type="button"
                onClick={handleClearSearch}
                className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-700 active:bg-rose-200 transition-colors cursor-pointer border border-slate-300 hover:border-rose-300 shadow-2xs"
                title="مسح محتوى البحث (Esc)"
                aria-label="مسح البحث"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : null}

            <span
              className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-mono font-medium rounded cursor-pointer hover:bg-slate-200 transition-colors"
              title="اضغط على / أو Ctrl+K لفتح البحث"
              onClick={() => {
                searchInputRef.current?.focus();
                setIsDropdownOpen(true);
              }}
            >
              Ctrl+K
            </span>
          </div>

          {/* قائمة العمليات المطابقة والمنسدلة (Command Palette Dropdown) */}
          {isDropdownOpen && (
            <div
              id="quick-bar-operations-dropdown"
              className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-300 rounded-lg shadow-xl z-50 overflow-hidden max-h-80 flex flex-col animate-in fade-in zoom-in-95 duration-100"
            >
              {/* شريط رأس القائمة */}
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>العمليات والأوامر المتاحة ({filteredOperations.length})</span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="text-rose-600 hover:text-rose-800 text-[10px] font-bold hover:underline cursor-pointer"
                  >
                    مسح البحث
                  </button>
                )}
              </div>

              {/* عناصر العمليات */}
              <div className="overflow-y-auto divide-y divide-slate-100 max-h-68">
                {filteredOperations.length > 0 ? (
                  filteredOperations.map((op, index) => {
                    const IconComponent = op.icon;
                    const isHighlighted = index === highlightedIndex;
                    return (
                      <div
                        key={op.id}
                        onClick={() => executeOperation(op)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`px-3 py-2 flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                          isHighlighted
                            ? 'bg-blue-50/90 text-blue-950 border-r-3 border-blue-600'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-7 h-7 rounded flex items-center justify-center shrink-0 border ${op.iconColor}`}
                          >
                            <IconComponent className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold truncate">{op.title}</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded border border-slate-200 shrink-0">
                                {op.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {op.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {op.shortcut && (
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 rounded border border-slate-300 shadow-2xs">
                              {op.shortcut}
                            </kbd>
                          )}
                          {isHighlighted && (
                            <CornerDownLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-6 text-center text-slate-500">
                    <p className="text-xs font-bold text-slate-700">لا توجد عملية مطابقة لـ &quot;{searchQuery}&quot;</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      جرّب البحث بكلمات مثل: إضافة، حركة، حساب، كشف، دليل، طباعة، مستخدمين
                    </p>
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>مسح وإظهار كافة العمليات</span>
                    </button>
                  </div>
                )}
              </div>

              {/* شريط أسفل القائمة للإرشاد */}
              <div className="px-3 py-1 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <span>استخدم الأسهم للتنقل و Enter للتنفيذ</span>
                <span>Esc للإلغاء</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
