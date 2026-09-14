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
        className="bg-gradient-to-b from-white via-white to-[#f2f7fc] rounded-lg border border-[#bcd2e8] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(15,45,85,0.06)] relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#e2edf8]">
          <span className="text-xs font-bold text-[#1e3a5f]">إجمالي المقبوضات (مدين)</span>
          <div className="p-1.5 rounded bg-emerald-100/80 text-emerald-800 border border-emerald-300 shadow-2xs">
            <ArrowDownLeft className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono-numbers tracking-tight">
            {formatCurrency(totalReceipts)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#55789e]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>واردات نقدية وبنكية مسجلة</span>
          </div>
        </div>
      </div>

      {/* Payments Card */}
      <div 
        id="stat-payments"
        className="bg-gradient-to-b from-white via-white to-[#f2f7fc] rounded-lg border border-[#bcd2e8] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(15,45,85,0.06)] relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#e2edf8]">
          <span className="text-xs font-bold text-[#1e3a5f]">إجمالي المدفوعات (دائن)</span>
          <div className="p-1.5 rounded bg-amber-100/80 text-amber-800 border border-amber-300 shadow-2xs">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl sm:text-2xl font-black text-[#0f2d52] font-mono-numbers tracking-tight">
            {totalPayments === 0 ? '0.00 ج.م' : formatCurrency(totalPayments)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#718fae]">
            <span>لا توجد مدفوعات مسجلة في هذا اليوم</span>
          </div>
        </div>
      </div>

      {/* Movement Balance Card */}
      <div 
        id="stat-movement-balance"
        className="bg-gradient-to-b from-white via-white to-[#f2f7fc] rounded-lg border border-[#bcd2e8] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(15,45,85,0.06)] relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#e2edf8]">
          <span className="text-xs font-bold text-[#1e3a5f]">صافي رصيد الحركة</span>
          <div className="p-1.5 rounded bg-[#e1edf8] text-[#0067b8] border border-[#b8cfe8] shadow-2xs">
            <Scale className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono-numbers tracking-tight">
            {formatCurrency(totalMovementBalance)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-[#55789e]">
            <span className="text-[#0067b8] font-bold">تسوية قيود العملاء:</span>
            <span>دائن لتسديد حسابات العملاء</span>
          </div>
        </div>
      </div>

      {/* Audit Status & Transactions count */}
      <div 
        id="stat-count-and-audit"
        className="bg-gradient-to-b from-white via-white to-[#f2f7fc] rounded-lg border border-[#bcd2e8] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(15,45,85,0.06)] relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#e2edf8]">
          <span className="text-xs font-bold text-[#1e3a5f]">عدد القيود والتطابق</span>
          <div className="p-1.5 rounded bg-purple-100/80 text-purple-800 border border-purple-300 shadow-2xs">
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-[#0f2d52] font-mono-numbers tracking-tight">
              {transactions.length} <span className="text-xs font-normal text-[#55789e]">قيود</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              100% مطابق
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#55789e]">
            <span>العملة الرسمية: </span>
            <strong className="text-[#0f2d52]">الجنيه المصري (EGP)</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
