import React from 'react';
import { FileSpreadsheet, Cloud, CloudCheck, LogIn, LogOut, Loader2 } from 'lucide-react';
import { REPORT_META } from '../data/initialData';
import { useFirebase } from '../context/FirebaseContext';

interface HeaderProps {
  onOpenUserManagement?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const { firebaseUser, isAuthReady, isFirestoreConnected, loginWithGoogle, logout } = useFirebase();

  return (
    <header className="bg-white border-b border-slate-200/90 shadow-2xs select-none no-print" dir="rtl">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Right side: App Icon, Main Title, and Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center shadow-xs shrink-0 border border-blue-700/20">
            <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                {REPORT_META.title}
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md border border-slate-200">
                سنة {new Date().getFullYear()}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5 hidden sm:block">
              منظومة القيود المحاسبية وتفريغ كشوف الحسابات ومطابقة الأرصدة
            </p>
          </div>
        </div>

        {/* Left side: Firebase Cloud Sync & Authentication */}
        <div className="flex items-center gap-3">
          {/* Cloud Connection Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium bg-slate-50 border-slate-200 text-slate-700">
            {isFirestoreConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] text-slate-700">سحابة Firebase: متصلة</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] text-slate-600">سحابة Firebase: قيد التهيئة</span>
              </>
            )}
          </div>

          {/* User Auth Control */}
          {!isAuthReady ? (
            <div className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
          ) : firebaseUser ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 pr-2">
              {firebaseUser.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'مستخدم'}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full border border-slate-300"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                  {(firebaseUser.displayName || firebaseUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {firebaseUser.displayName || firebaseUser.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium leading-none">
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              title="تسجيل الدخول للمزامنة الحية عبر قاعدة بيانات Firebase"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>مزامنة Firebase</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

