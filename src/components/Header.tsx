import React from 'react';
import { FileSpreadsheet, Cloud, CloudCheck, LogIn, LogOut, Loader2 } from 'lucide-react';
import { REPORT_META } from '../data/initialData';
import { useFirebase } from '../context/FirebaseContext';
import { AppUser } from '../types';

interface HeaderProps {
  onOpenUserManagement?: () => void;
  currentUser?: AppUser;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUserManagement,
  currentUser,
  onLogout,
}) => {
  const { firebaseUser, isAuthReady, isFirestoreConnected, loginWithGoogle, logout } = useFirebase();

  return (
    <header className="bg-white/95 backdrop-blur-xs border-b border-[#c8daf0] shadow-[0_1px_4px_rgba(15,45,85,0.05)] select-none no-print" dir="rtl">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Right side: App Icon, Main Title, and Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0078d4] via-[#0067b8] to-[#004e8c] text-white flex items-center justify-center shadow-xs shrink-0 border border-blue-400/30">
            <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-[#0f2d52] tracking-tight">
                {REPORT_META.title}
              </h1>
            </div>
            <p className="text-xs text-[#4b6a8d] font-normal mt-0.5 hidden sm:block">
              منظومة القيود المحاسبية وتفريغ كشوف الحسابات ومطابقة الأرصدة
            </p>
          </div>
        </div>

        {/* Left side: Firebase Cloud Sync & Authentication */}
        <div className="flex items-center gap-3">
          {/* Cloud Connection Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium bg-[#f0f6fc] border-[#cfe0f2] text-[#0f4c81]">
            {isFirestoreConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] text-[#0f4c81] font-medium">سحابة Firebase: متصلة</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] text-[#5a7696]">سحابة Firebase: قيد التهيئة</span>
              </>
            )}
          </div>

          {/* User Auth Control */}
          {!isAuthReady ? (
            <div className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
          ) : firebaseUser ? (
            <div className="flex items-center gap-2 bg-[#f0f6fc] border border-[#cfe0f2] rounded-lg p-1 pr-2">
              {firebaseUser.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'مستخدم'}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full border border-[#b9d3ec]"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#0078d4] text-white text-xs flex items-center justify-center font-bold">
                  {(firebaseUser.displayName || firebaseUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-[#0f2d52] leading-tight">
                  {firebaseUser.displayName || firebaseUser.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold leading-none">
                  مزامنة سحابية نشطة
                </span>
              </div>
              <button
                onClick={logout}
                title="تسجيل الخروج من سحابة Firebase"
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0078d4] hover:bg-[#0067b8] text-white text-xs font-semibold rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer border border-[#005da6]"
              title="تسجيل الدخول للمزامنة الحية عبر قاعدة بيانات Firebase"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>مزامنة Firebase</span>
            </button>
          )}
          {/* Acuora App User Profile & Quick Logout */}
          {currentUser && (
            <div className="flex items-center gap-1.5 bg-[#f0f6fc] border border-[#cfe0f2] rounded-lg p-1 pr-2">
              <button
                type="button"
                onClick={onOpenUserManagement}
                className="flex items-center gap-2 hover:opacity-85 transition-opacity text-right cursor-pointer"
                title="المستخدم النشط - انقر لفتح إدارة المستخدمين والصلاحيات"
              >
                <div className="w-7 h-7 rounded-full bg-[#0f2d52] text-white text-xs flex items-center justify-center font-bold shrink-0 border border-[#1d4677]">
                  {currentUser.fullName.slice(0, 1)}
                </div>
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-[#0f2d52] leading-tight">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-[#0067b8] font-bold leading-none">
                    {currentUser.role}
                  </span>
                </div>
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="تسجيل الخروج من المنظومة"
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

