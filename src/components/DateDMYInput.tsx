import React, { useRef, useState, useMemo } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

interface DateDMYInputProps {
  value: string; // ISO date "YYYY-MM-DD" or "DD/MM/YYYY"
  onChange: (isoDate: string) => void;
  className?: string;
  required?: boolean;
}

/**
 * Helper to format local date to ISO YYYY-MM-DD string
 */
const formatISODate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Helper to format local date to DD/MM/YYYY string for display labels
 */
const formatDisplayDMY = (d: Date): string => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Custom Date Input that strictly formats and displays the date as
 * Day / Month / Year (DD/MM/YYYY) with the month strictly in the middle.
 * Safe in sandboxed iframes (no uncaught showPicker exceptions).
 */
export const DateDMYInput: React.FC<DateDMYInputProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);
  const [showPresets, setShowPresets] = useState(false);

  // Calculate dynamic current dates based on user's real local time
  const todayDate = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => formatISODate(todayDate), [todayDate]);
  const todayLabel = useMemo(() => formatDisplayDMY(todayDate), [todayDate]);

  const yesterdayDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);
  const yesterdayISO = useMemo(() => formatISODate(yesterdayDate), [yesterdayDate]);
  const yesterdayLabel = useMemo(() => formatDisplayDMY(yesterdayDate), [yesterdayDate]);

  const firstOfMonthDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  }, []);
  const firstOfMonthISO = useMemo(() => formatISODate(firstOfMonthDate), [firstOfMonthDate]);
  const firstOfMonthLabel = useMemo(() => formatDisplayDMY(firstOfMonthDate), [firstOfMonthDate]);

  // Safe parsing of any date format, falling back dynamically to today's local date
  const parseDateParts = (raw: string | null | undefined) => {
    const fallback = {
      day: String(todayDate.getDate()).padStart(2, '0'),
      month: String(todayDate.getMonth() + 1).padStart(2, '0'),
      year: String(todayDate.getFullYear()),
    };
    if (!raw) return fallback;
    const str = String(raw).trim();
    if (!str) return fallback;

    if (str.includes('-')) {
      const parts = str.split('-');
      return {
        year: (parts[0] || fallback.year).slice(0, 4),
        month: (parts[1] || fallback.month).padStart(2, '0').slice(-2),
        day: (parts[2] || fallback.day).split(' ')[0].padStart(2, '0').slice(-2),
      };
    }

    if (str.includes('/')) {
      const parts = str.split('/');
      return {
        day: (parts[0] || fallback.day).padStart(2, '0').slice(-2),
        month: (parts[1] || fallback.month).padStart(2, '0').slice(-2),
        year: (parts[2] || fallback.year).slice(0, 4),
      };
    }

    return fallback;
  };

  const { day, month, year } = parseDateParts(value);

  const updateDate = (newDay: string, newMonth: string, newYear: string) => {
    const d = (newDay || String(todayDate.getDate())).padStart(2, '0').slice(-2);
    const m = (newMonth || String(todayDate.getMonth() + 1)).padStart(2, '0').slice(-2);
    const y = (newYear || String(todayDate.getFullYear())).slice(0, 4);
    onChange(`${y}-${m}-${d}`);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);
    const num = parseInt(val, 10);
    if (num > 31) val = '31';
    updateDate(val, month, year);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);
    const num = parseInt(val, 10);
    if (num > 12) val = '12';
    updateDate(day, val, year);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    updateDate(day, month, val);
  };

  // Safe calendar picker trigger wrapped in try/catch to avoid uncaught iframe security exceptions
  const openCalendarPicker = () => {
    if (hiddenDateInputRef.current) {
      try {
        if (typeof hiddenDateInputRef.current.showPicker === 'function') {
          hiddenDateInputRef.current.showPicker();
          return;
        }
      } catch (err) {
        // showPicker might be disallowed in cross-origin / sandboxed iframes
        console.warn('Native showPicker not allowed, showing presets:', err);
      }
    }
    // Fallback: Toggle presets dropdown
    setShowPresets((prev) => !prev);
  };

  const presets = [
    { label: `اليوم (${todayLabel})`, date: todayISO },
    { label: `أمس (${yesterdayLabel})`, date: yesterdayISO },
    { label: `أول الشهر (${firstOfMonthLabel})`, date: firstOfMonthISO },
  ];

  return (
    <div className={`relative ${className}`}>
      <div 
        className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all text-xs sm:text-sm"
        dir="ltr"
      >
        {/* Segmented Inputs: Day / Month / Year (Month strictly in the middle) */}
        <div className="flex items-center gap-1 font-mono-numbers font-medium text-slate-800">
          {/* Day */}
          <div className="flex flex-col items-center">
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={day}
              onChange={handleDayChange}
              onFocus={(e) => e.target.select()}
              placeholder={String(todayDate.getDate()).padStart(2, '0')}
              className="w-7 text-center font-bold text-slate-900 bg-transparent focus:bg-blue-50 focus:text-blue-700 rounded py-0.5 outline-none"
              title="اليوم (DD)"
            />
          </div>

          <span className="text-slate-400 font-bold select-none">/</span>

          {/* Month - In the Middle */}
          <div className="flex flex-col items-center">
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={month}
              onChange={handleMonthChange}
              onFocus={(e) => e.target.select()}
              placeholder={String(todayDate.getMonth() + 1).padStart(2, '0')}
              className="w-7 text-center font-bold text-blue-700 bg-blue-50/70 border border-blue-200/60 focus:bg-blue-100 rounded py-0.5 outline-none"
              title="الشهر في الوسط (MM)"
            />
          </div>

          <span className="text-slate-400 font-bold select-none">/</span>

          {/* Year */}
          <div className="flex flex-col items-center">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={year}
              onChange={handleYearChange}
              onFocus={(e) => e.target.select()}
              placeholder={String(todayDate.getFullYear())}
              className="w-12 text-center font-bold text-slate-800 bg-transparent focus:bg-blue-50 focus:text-blue-700 rounded py-0.5 outline-none"
              title="السنة (YYYY)"
            />
          </div>
        </div>

        {/* Action Controls: Quick buttons */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
          <button
            type="button"
            onClick={() => {
              onChange(todayISO);
              setShowPresets(false);
            }}
            className="text-[10px] px-1.5 py-0.5 font-bold text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            title={`تعيين تاريخ اليوم الحالي (${todayLabel})`}
          >
            اليوم
          </button>
          
          <button
            type="button"
            onClick={openCalendarPicker}
            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer flex items-center gap-0.5"
            title="اختيار التاريخ أو عرض التواريخ السريعة"
          >
            <Calendar className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Hidden Native Input (wrapped safely) */}
      <input
        ref={hiddenDateInputRef}
        type="date"
        value={value && value.includes('-') ? value : todayISO}
        onChange={(e) => {
          if (e.target.value) {
            onChange(e.target.value);
            setShowPresets(false);
          }
        }}
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}
      />

      {/* Quick Presets Dropdown */}
      {showPresets && (
        <div 
          className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 text-xs animate-in fade-in zoom-in-95"
          dir="rtl"
        >
          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 border-b border-slate-100">
            تواريخ سريعة
          </div>
          {presets.map((p) => {
            const isSelected = value === p.date;
            return (
              <button
                key={p.date}
                type="button"
                onClick={() => {
                  onChange(p.date);
                  setShowPresets(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-right transition-colors cursor-pointer ${
                  isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>{p.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
        <span>ترتيب التاريخ: <strong className="text-slate-700">اليوم ({day})</strong> / <strong className="text-blue-700 bg-blue-50 px-1 rounded">الشهر ({month})</strong> / <strong className="text-slate-700">السنة ({year})</strong></span>
        <span className="text-emerald-700 font-medium font-mono-numbers">DD/MM/YYYY</span>
      </div>
    </div>
  );
};
