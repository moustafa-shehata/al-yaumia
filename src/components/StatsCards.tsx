import React from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Scale, 
  Layers, 
  CheckCircle2
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface StatsCardsProps {
  transactions: Transaction[];
  onOpenNotes?: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ transactions }) => {
  const totalReceipts = transactions.reduce((acc, curr) => acc + (curr.receipt || 0), 0);
  const totalPayments = transactions.reduce((acc, curr) => acc + (curr.payment || 0), 0);
  const totalMovementBalance = transactions.reduce((acc, curr) => acc + (curr.movementBalance || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 no-print" dir="rtl">
      {/* Receipts Card */}
      <div 
        id="stat-receipts"
        className="bg-white rounded-md border border-slate-300 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.05)] relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-600">إجمالي المقبوضات (مدين)</span>
          <div className="p-1.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
            <ArrowDownLeft className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono-numbers tracking-tight">
            {formatCurrency(totalReceipts)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>واردات نقدية وبنكية مسجلة</span>
          </div>
        </div>
      </div>

      {/* Payments Card */}
      <div 
        id="stat-payments"
        className="bg-white rounded-md border border-slate-300 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.05)] relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-600">إجمالي المدفوعات (دائن)</span>
          <div className="p-1.5 rounded bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl sm:text-2xl font-black text-slate-800 font-mono-numbers tracking-tight">
            {totalPayments === 0 ? '0.00 ج.م' : formatCurrency(totalPayments)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
            <span>لا توجد مدفوعات مسجلة في هذا اليوم</span>
          </div>
        </div>
      </div>

      {/* Movement Balance Card */}
      <div 
        id="stat-movement-balance"
        className="bg-white rounded-md border border-slate-300 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.05)] relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-600">صافي رصيد الحركة</span>
          <div className="p-1.5 rounded bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs">
            <Scale className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono-numbers tracking-tight">
            {formatCurrency(totalMovementBalance)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
            <span className="text-blue-800 font-bold">تسوية قيود العملاء:</span>
            <span>دائن لتسديد حسابات العملاء</span>
          </div>
        </div>
      </div>

      {/* Audit Status & Transactions count */}
      <div 
        id="stat-count-and-audit"
        className="bg-white rounded-md border border-slate-300 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.05)] relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-600">عدد القيود والتطابق</span>
          <div className="p-1.5 rounded bg-purple-100 text-purple-800 border border-purple-300 shadow-2xs">
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono-numbers tracking-tight">
              {transactions.length} <span className="text-xs font-normal text-slate-500">قيود</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              100% مطابق
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
            <span>العملة الرسمية: </span>
            <strong className="text-slate-800">الجنيه المصري (EGP)</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
