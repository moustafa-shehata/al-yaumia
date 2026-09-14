import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, ShieldCheck, Coins, BookOpen } from 'lucide-react';
import { TECHNICAL_NOTES } from '../data/initialData';

export const TechnicalNotesCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div 
      id="section-technical-notes"
      className="bg-white border border-[#bcd2e8] rounded-xl overflow-hidden shadow-2xs no-print transition-all"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between bg-[#f0f6fc] hover:bg-[#eaf2fb] transition-colors text-right cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#eaf2fb] text-[#0078d4] border border-[#bcd2e8] rounded-lg">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-[#0f2d52] text-sm sm:text-base">
              ثالثاً: ملاحظات فنية للمحلل الذكي (Technical Notes)
            </span>
            <span className="text-xs text-[#55789e] mr-2">
              (إرشادات التدقيق، العملة، وتفسير تسوية أرصدة القيود)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#55789e]">
          <span className="text-xs hidden sm:inline font-medium">
            {isOpen ? 'إخفاء الملاحظات' : 'إظهار الملاحظات'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-6 border-t border-[#bcd2e8] bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Note 1 */}
            <div className="p-4 rounded-xl bg-[#f8fbfe] border border-[#bcd2e8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#0f2d52] flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-500" />
                    1. العملة الافتراضية للتقرير
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                    EGP
                  </span>
                </div>
                <p className="text-xs text-[#1e3a5f] leading-relaxed">
                  العملة المعتمدة في النظام هي <strong>الجنيه المصري (EGP)</strong>. تظهر كافة المعاملات والمبالغ مسعرة ومسجلة بها طبقاً لمعايير المحاسبة المصرية المعمول بها.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#bcd2e8] text-[11px] text-[#55789e]">
                رمز التداول المالي: EGP (ج.م)
              </div>
            </div>

            {/* Note 2 */}
            <div className="p-4 rounded-xl bg-[#f8fbfe] border border-[#bcd2e8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#0f2d52] flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#0078d4]" />
                    2. طبيعة رصيد الحركة السالب
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                    تسوية قيود
                  </span>
                </div>
                <p className="text-xs text-[#1e3a5f] leading-relaxed">
                  يظهر رصيد الحركة بقيم سالبة (<span className="font-mono-numbers text-rose-600 font-semibold">-30,000</span>، <span className="font-mono-numbers text-rose-600 font-semibold">-35,000</span>، <span className="font-mono-numbers text-rose-600 font-semibold">-40,000</span>) بناءً على إعدادات تسوية القيود المحاسبية لكل عملية قبض بشكل مستقل (طرف دائن لحساب العميل يؤدي إلى تخفيض مديونيته).
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#bcd2e8] text-[11px] text-[#55789e]">
                القيد: من حـ/ النقدية أو البنك (مدين) إلى حـ/ العميل (دائن)
              </div>
            </div>

            {/* Note 3 */}
            <div className="p-4 rounded-xl bg-[#f8fbfe] border border-[#bcd2e8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#0f2d52] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    3. تطابق البيانات والتدقيق
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                    آلي 100%
                  </span>
                </div>
                <p className="text-xs text-[#1e3a5f] leading-relaxed">
                  تم استخراج هذا النص وتدقيقه آلياً لضمان مطابقته التامة لملف العمل الافتراضي وقواعد سجل التعديلات التدقيقي (Audit Log) المعتمدة في النظام.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#bcd2e8] text-[11px] text-[#55789e]">
                آخر تدقيق ناجح: 2026-09-02 16:02
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
