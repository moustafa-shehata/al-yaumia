import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  RotateCcw,
  BookOpen,
  Building2,
  Upload,
  FileSpreadsheet,
  History,
  Users,
  Info,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { AppUser } from '../types';

interface DesktopMenuBarProps {
  onAddTransaction: () => void;
  onAddAccount: () => void;
  onOpenChartOfAccounts: () => void;
  onOpenAccountCard: () => void;
  onOpenImportAccounts: () => void;
  onOpenStatementSheet: () => void;
  onOpenUserActivityLogs: () => void;
  onOpenUserManagement: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  onResetData: () => void;
  onLogout?: () => void;
  currentUser?: AppUser;
}

type MenuKey = 'file' | 'edit' | 'accounts' | 'reports' | 'system' | 'help' | null;

export const DesktopMenuBar: React.FC<DesktopMenuBarProps> = ({
  onAddTransaction,
  onAddAccount,
  onOpenChartOfAccounts,
  onOpenAccountCard,
  onOpenImportAccounts,
  onOpenStatementSheet,
  onOpenUserActivityLogs,
  onOpenUserManagement,
  onExportCSV,
  onPrint,
  onResetData,
  onLogout,
  currentUser,
}) => {
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menu: MenuKey) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const handleMenuHover = (menu: MenuKey) => {
    if (activeMenu !== null) {
      setActiveMenu(menu);
    }
  };

  const closeMenuAndRun = (action: () => void) => {
    setActiveMenu(null);
    action();
  };

  return (
    <div
      ref={menuContainerRef}
      className="bg-slate-200 border-b border-slate-300 text-slate-800 text-xs px-2 py-0.5 select-none relative z-40 no-print"
      dir="rtl"
    >
      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* ملف (File) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('file')}
            onMouseEnter={() => handleMenuHover('file')}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              activeMenu === 'file'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-800 hover:bg-slate-300/80'
            }`}
          >
            <span>ملف</span>
            <span className="text-[10px] text-slate-500 font-mono underline">F</span>
          </button>

          {activeMenu === 'file' && (
            <div className="absolute right-0 top-full mt-0.5 w-64 bg-white border border-slate-300 shadow-xl rounded-md py-1 z-50 text-slate-800 animate-in fade-in-50 duration-100">
              <button
                type="button"
                onClick={() => closeMenuAndRun(onAddTransaction)}
                className="w-full px-3 py-1.5 text-right text-xs hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>إضافة حركة جديدة</span>
                </span>
                <kbd className="text-[10px] text-slate-400 font-mono">F2</kbd>
              </button>

              <button
                type="button"
                onClick={() => closeMenuAndRun(onAddAccount)}
                className="w-full px-3 py-1.5 text-right text-xs hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>إضافة حساب مالي جديد</span>
                </span>
                <kbd className="text-[10px] text-slate-400 font-mono">F3</kbd>
              </button>

              <div className="my-1 border-t border-slate-200" />

              <button
                type="button"
                onClick={() => closeMenuAndRun(onPrint)}
                className="w-full px-3 py-1.5 text-right text-xs hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>معاينة وطباعة التقرير (A4)</span>
                </span>
                <kbd className="text-[10px] text-slate-400 font-mono">Ctrl+P</kbd>
              </button>

              <button
                type="button"
                onClick={() => closeMenuAndRun(onExportCSV)}
                className="w-full px-3 py-1.5 text-right text-xs hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تصدير البيانات إلى ملف Excel (CSV)</span>
                </span>
                <kbd className="text-[10px] text-slate-400 font-mono">Ctrl+E</kbd>
              </button>

              <div className="my-1 border-t border-slate-200" />

              <button
                type="button"
                onClick={() => closeMenuAndRun(onResetData)}
                className="w-full px-3 py-1.5 text-right text-xs text-rose-700 hover:bg-rose-50 flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>استعادة البيانات الافتراضية الأصلية</span>
                </span>
              </button>

              {onLogout && (
                <>
                  <div className="my-1 border-t border-slate-200" />
                  <button
                    type="button"
                    onClick={() => closeMenuAndRun(onLogout)}
                    className="w-full px-3 py-1.5 text-right text-xs text-rose-700 hover:bg-rose-50 flex items-center justify-between group cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>تسجيل الخروج من الجلسة (Logout)</span>
                    </span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* الحسابات (Accounts) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('accounts')}
            onMouseEnter={() => handleMenuHover('accounts')}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              activeMenu === 'accounts'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-800 hover:bg-slate-300/80'
            }`}
          >
            <span>الحسابات</span>
            <span className="text-[10px] text-slate-500 font-mono underline">A</span>
          </button>

          {activeMenu === 'accounts' && (
            <div className="absolute right-0 top-full mt-0.5 w-64 bg-white border border-slate-300 shadow-xl rounded-md py-1 z-50 text-slate-800 animate-in fade-in-50 duration-100">
              <button
                type="button"
                onClick={() => closeMenuAndRun(onOpenChartOfAccounts)}
                className="w-full px-3 py-1.5 text-right text-xs hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>دليل الحسابات المالي الشجري</span>
                </span>
                <kbd className="text-[10px] text-slate-400 font-mono">F4</kbd>
              </button>

              <button
                type="button"
                onClick={() => closeMenuAndRun(onOpenAccountCard)}
                className="w-full px-3 py-1.5 text-right text-xs hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>بطاقة الحساب المالي (تصفح وتعديل)</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => closeMenuAndRun(onOpenImportAccounts)}
                className="w-full px-3 py-1.5 text-right text-xs hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>استيراد وتخصيص دليل الحسابات</span>
                </span>
              </button>

              <div className="my-1 border-t border-slate-200" />

              <button
                type="button"
                onClick={() => closeMenuAndRun(onAddAccount)}
                className="w-full px-3 py-1.5 text-right text-xs hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تعريف عميل أو مورد جديد</span>
                </span>
                <kbd className="text-[10px] text-slate-400 font-mono">F3</kbd>
              </button>
            </div>
          )}
        </div>

        {/* التقارير (Reports) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('reports')}
            onMouseEnter={() => handleMenuHover('reports')}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              activeMenu === 'reports'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-800 hover:bg-slate-300/80'
            }`}
          >
            <span>التقارير</span>
            <span className="text-[10px] text-slate-500 font-mono underline">R</span>
          </button>

          {activeMenu === 'reports' && (
            <div className="absolute right-0 top-full mt-0.5 w-60 bg-white border border-slate-300 shadow-xl rounded-md py-1 z-50 text-slate-800 animate-in fade-in-50 duration-100">
              <button
                type="button"
                onClick={() => closeMenuAndRun(onOpenStatementSheet)}
                className="w-full px-3 py-1.5 text-right text-xs hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>كشف الحساب المعتمد ودفتر الأستاذ</span>
                </span>
                <kbd className="text-[10px] text-slate-400 font-mono">F5</kbd>
              </button>

              <button
                type="button"
                onClick={() => closeMenuAndRun(onPrint)}
                className="w-full px-3 py-1.5 text-right text-xs hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>طباعة اليومية العامة الرسمية</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => closeMenuAndRun(onExportCSV)}
                className="w-full px-3 py-1.5 text-right text-xs hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>تصدير تقرير الحركة إلى Excel</span>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* إدارة النظام والمستخدمين (System) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('system')}
            onMouseEnter={() => handleMenuHover('system')}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              activeMenu === 'system'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-800 hover:bg-slate-300/80'
            }`}
          >
            <span>إدارة النظام</span>
            <span className="text-[10px] text-slate-500 font-mono underline">U</span>
          </button>

          {activeMenu === 'system' && (
            <div className="absolute right-0 top-full mt-0.5 w-64 bg-white border border-slate-300 shadow-xl rounded-md py-1 z-50 text-slate-800 animate-in fade-in-50 duration-100">
              <button
                type="button"
                onClick={() => closeMenuAndRun(onOpenUserActivityLogs)}
                className="w-full px-3 py-1.5 text-right text-xs hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-indigo-600" />
                  <span>سجل نشاط المستخدمين والتدقيق المالي</span>
                </span>
                <kbd className="text-[10px] text-slate-400 font-mono">F6</kbd>
              </button>

              <button
                type="button"
                onClick={() => closeMenuAndRun(onOpenUserManagement)}
                className="w-full px-3 py-1.5 text-right text-xs hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>إدارة المستخدمين وصلاحيات الدخول</span>
                </span>
                <kbd className="text-[10px] text-slate-400 font-mono">F7</kbd>
              </button>

              {currentUser && (
                <div className="px-3 py-1.5 text-[11px] bg-slate-50 border-t border-slate-200 text-slate-600 flex items-center justify-between gap-1.5">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>المستخدم: <strong>{currentUser.fullName}</strong></span>
                  </span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-blue-100 text-blue-800 font-semibold">
                    {currentUser.role}
                  </span>
                </div>
              )}

              {onLogout && (
                <>
                  <div className="my-1 border-t border-slate-200" />
                  <button
                    type="button"
                    onClick={() => closeMenuAndRun(onLogout)}
                    className="w-full px-3 py-1.5 text-right text-xs text-rose-700 hover:bg-rose-50 flex items-center justify-between group cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>تسجيل الخروج من الجلسة (Logout)</span>
                    </span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* مساعدة (Help) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('help')}
            onMouseEnter={() => handleMenuHover('help')}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              activeMenu === 'help'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-800 hover:bg-slate-300/80'
            }`}
          >
            <span>مساعدة</span>
            <span className="text-[10px] text-slate-500 font-mono underline">H</span>
          </button>

          {activeMenu === 'help' && (
            <div className="absolute right-0 top-full mt-0.5 w-60 bg-white border border-slate-300 shadow-xl rounded-md py-1.5 z-50 text-slate-800 animate-in fade-in-50 duration-100">
              <div className="px-3 py-1 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>نظام اليومية والأستاذ العام Desktop Pro</span>
              </div>
              <p className="px-3 py-1 text-[11px] text-slate-500 leading-normal">
                منظومة محاسبية متكاملة تدعم الشجرة المحاسبية القياسية، القيود المزدوجة، ومطابقة الأرصدة.
              </p>
              <div className="px-3 py-1 text-[10px] font-mono text-slate-400 border-t border-slate-200 mt-1">
                الإصدار 2.4 Desktop Edition (2026)
              </div>
            </div>
          )}
        </div>

        {/* Current User Session Badge & Quick Logout Button on Menu Bar */}
        {currentUser && (
          <div className="mr-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenUserManagement}
              className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/70 hover:bg-white border border-slate-300 text-slate-700 transition-colors cursor-pointer"
              title="انقر لفتح إدارة المستخدمين والصلاحيات"
            >
              <UserCheck className="w-3 h-3 text-emerald-600" />
              <span className="text-slate-800 font-bold">{currentUser.fullName}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-blue-100 text-blue-800 font-semibold">
                {currentUser.role}
              </span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100/80 hover:bg-rose-200 active:bg-rose-300 text-rose-800 border border-rose-300 text-xs font-bold transition-colors cursor-pointer"
                title="تسجيل الخروج من المنظومة"
              >
                <LogOut className="w-3 h-3 text-rose-700" />
                <span>خروج</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
