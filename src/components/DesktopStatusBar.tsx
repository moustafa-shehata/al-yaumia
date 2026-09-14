import React, { useState, useEffect } from 'react';
import {
  Clock,
  Database,
  UserCheck,
  CloudCheck,
  Cloud,
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';
import { AppUser } from '../types';
import { useFirebase } from '../context/FirebaseContext';

interface DesktopStatusBarProps {
  totalReceipts?: number;
  totalPayments?: number;
  totalBalance?: number;
  transactionsCount: number;
  accountsCount: number;
  currentUser?: AppUser;
  onOpenUserManagement?: () => void;
}

export const DesktopStatusBar: React.FC<DesktopStatusBarProps> = ({
  transactionsCount,
  accountsCount,
  currentUser,
  onOpenUserManagement,
}) => {
  const { isFirestoreConnected, firebaseUser } = useFirebase();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer
      id="desktop-status-bar"
      className="h-7 bg-slate-100 border-t border-slate-300 text-slate-700 text-[11px] px-3 select-none flex items-center justify-between gap-4 overflow-hidden whitespace-nowrap shrink-0 no-print"
      dir="rtl"
    >
      {/* Right side: System Status & Database */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Ready Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded border border-slate-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-2xs" />
          <span className="font-bold text-slate-800 text-[10px]">جاهز</span>
        </div>

        {/* Database connection */}
        <div className="flex items-center gap-1 text-slate-600">
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span>قاعدة البيانات: <strong className="text-slate-800">متصلة ومطابقة 100%</strong></span>
        </div>

        {/* Firebase Cloud status */}
        <div className="flex items-center gap-1 text-slate-600">
          {isFirestoreConnected ? (
            <>
              <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">سحابة Firebase: <strong className="text-emerald-700 font-semibold">{firebaseUser ? 'مزامنة حية' : 'متصلة'}</strong></span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">سحابة Firebase: <strong className="text-amber-700">قيد الاتصال</strong></span>
            </>
          )}
        </div>

        <span className="h-3 w-px bg-slate-300" />

        {/* Transactions & Accounts Count */}
        <div className="flex items-center gap-2 text-slate-600 font-mono-numbers">
          <span>القيود: <strong className="text-slate-800 font-bold">{formatNumber(transactionsCount)}</strong></span>
          <span>•</span>
          <span>الحسابات: <strong className="text-slate-800 font-bold">{formatNumber(accountsCount)}</strong></span>
        </div>
      </div>

      {/* Left side: User & Clock */}
      <div className="flex items-center gap-3 shrink-0 mr-auto text-slate-600">
        {/* Current User */}
        {currentUser && (
          <button
            type="button"
            onClick={onOpenUserManagement}
            className="flex items-center gap-1 text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
            title="المستخدم الحالي للنظام - انقر لإدارة الصلاحيات"
          >
            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>
              المستخدم: <strong className="text-slate-900">{currentUser.fullName}</strong>{' '}
              <span className="text-blue-700 font-semibold">({currentUser.role})</span>
            </span>
          </button>
        )}

        <span className="h-3 w-px bg-slate-300" />

        {/* Current System Time */}
        <div className="flex items-center gap-1 font-mono-numbers text-slate-500">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{currentTime || '12:00:00'}</span>
        </div>
      </div>
    </footer>
  );
};
