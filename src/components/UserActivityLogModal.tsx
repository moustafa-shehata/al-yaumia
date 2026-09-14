import React, { useState, useMemo } from 'react';
import { 
  X, 
  History, 
  Search, 
  Copy, 
  Check, 
  User, 
  Calendar, 
  Clock, 
  Filter,
  Download,
  RotateCcw,
  LogIn,
  LogOut,
  PlusCircle,
  Edit3,
  Trash2,
  Printer,
  Layout,
  Hash,
  ShieldCheck,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { UserActivityLog, UserActionType, ActivityWindowType, AppUser } from '../types';
import { formatDateDMY, exportActivityLogsToCSV } from '../utils/formatters';

interface UserActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityLogs?: UserActivityLog[];
  users?: AppUser[];
  onClearLogs?: () => void;
}

export const UserActivityLogModal: React.FC<UserActivityLogModalProps> = ({
  isOpen = false,
  onClose,
  activityLogs = [],
  users = [],
}) => {
  // Filters State (منطقة المعايير)
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedWindow, setSelectedWindow] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Safe normalized logs list ensuring every record has defined strings and values
  const normalizedLogs = useMemo(() => {
    const rawList = Array.isArray(activityLogs) ? activityLogs : [];
    return rawList.map((log: any, idx: number): UserActivityLog => {
      const id = log?.id ? String(log.id) : `act-safe-${idx + 1}`;
      const sequence = typeof log?.sequence === 'number' ? log.sequence : idx + 1;
      const date = log?.date ? String(log.date) : '2026-09-02';
      const time = log?.time ? String(log.time) : '12:00 م';
      const username = log?.username ? String(log.username) : (log?.author ? String(log.author) : 'moustafa.acuora.soft.egypt');
      const action = (log?.action ? String(log.action) : (log?.actionType === 'إنشاء' ? 'إضافة' : String(log?.actionType || 'إضافة'))) as UserActionType;
      const windowName = (log?.window ? String(log.window) : 'إضافة حركة') as ActivityWindowType;
      const recordId = log?.recordId != null ? String(log.recordId) : (log?.transactionId != null ? String(log.transactionId) : String(idx + 1));
      const beforeValue = log?.beforeValue != null ? String(log.beforeValue) : (log?.oldValue != null ? String(log.oldValue) : 'لا يوجد');
      const afterValue = log?.afterValue != null ? String(log.afterValue) : (log?.newValue != null ? String(log.newValue) : (log?.rawAuditText ? String(log.rawAuditText) : 'تم توثيق الإجراء'));

      return {
        id,
        sequence,
        date,
        time,
        username,
        action,
        window: windowName,
        recordId,
        beforeValue,
        afterValue,
      };
    });
  }, [activityLogs]);

  // Distinct users list from logs and registered users
  const allUsernames = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(users)) {
      users.forEach((u) => {
        if (u && typeof u.username === 'string' && u.username.trim()) {
          set.add(u.username.trim());
        }
      });
    }
    normalizedLogs.forEach((l) => {
      if (l.username && l.username.trim()) {
        set.add(l.username.trim());
      }
    });
    return Array.from(set);
  }, [users, normalizedLogs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return normalizedLogs.filter((log) => {
      // Filter by User
      if (selectedUser !== 'ALL' && log.username !== selectedUser) {
        return false;
      }
      // Filter by Action Type
      if (selectedAction !== 'ALL' && log.action !== selectedAction) {
        return false;
      }
      // Filter by Window
      if (selectedWindow !== 'ALL' && log.window !== selectedWindow) {
        return false;
      }
      // Filter by Date Range
      if (dateFrom && log.date < dateFrom) {
        return false;
      }
      if (dateTo && log.date > dateTo) {
        return false;
      }
      // Search Query (بحث في: اسم المستخدم، رقم الحركة، قبل، بعد)
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const username = log.username.toLowerCase();
        const recordId = String(log.recordId).toLowerCase();
        const beforeVal = log.beforeValue.toLowerCase();
        const afterVal = log.afterValue.toLowerCase();
        const action = log.action.toLowerCase();
        const win = log.window.toLowerCase();

        const matchText =
          username.includes(q) ||
          recordId.includes(q) ||
          beforeVal.includes(q) ||
          afterVal.includes(q) ||
          action.includes(q) ||
          win.includes(q);

        if (!matchText) return false;
      }

      return true;
    });
  }, [normalizedLogs, selectedUser, selectedAction, selectedWindow, dateFrom, dateTo, searchQuery]);

  if (!isOpen) return null;

  const handleResetFilters = () => {
    setSelectedUser('ALL');
    setSelectedAction('ALL');
    setSelectedWindow('ALL');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const handleExport = () => {
    exportActivityLogsToCSV(filteredLogs, `سجل_نشاط_المستخدمين_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleCopyRow = async (log: UserActivityLog) => {
    const formattedDate = formatDateDMY(log.date) || log.date;
    const text = `مسلسل: ${log.sequence} | التاريخ: ${formattedDate} ${log.time} | المستخدم: ${log.username} | الحركة: ${log.action} | النافذة: ${log.window} | رقم الحركة: ${log.recordId} | قبل: ${log.beforeValue} | بعد: ${log.afterValue}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // ignore
    }
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper for action badges
  const getActionBadge = (action: string) => {
    const act = (action || '').trim();
    switch (act) {
      case 'دخول':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <LogIn className="w-3.5 h-3.5 text-sky-600" />
            <span>دخول</span>
          </span>
        );
      case 'خروج':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>خروج</span>
          </span>
        );
      case 'إضافة':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>إضافة</span>
          </span>
        );
      case 'تعديل':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
            <span>تعديل</span>
          </span>
        );
      case 'حذف':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>حذف</span>
          </span>
        );
      case 'طباعة':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Printer className="w-3.5 h-3.5 text-indigo-600" />
            <span>طباعة</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800">
            {act || 'غير محدد'}
          </span>
        );
    }
  };

  // Helper for window badges
  const getWindowBadge = (windowName: string) => {
    const win = (windowName || '').trim();
    switch (win) {
      case 'إضافة حركة':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Layers className="w-3 h-3 text-blue-500" />
            <span>إضافة حركة</span>
          </span>
        );
      case 'إضافة حساب':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <User className="w-3 h-3 text-teal-600" />
            <span>إضافة حساب</span>
          </span>
        );
      case 'إدارة المستخدمين':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            <span>إدارة المستخدمين</span>
          </span>
        );
      default:
        return <span className="text-xs text-slate-700">{win || 'غير محدد'}</span>;
    }
  };

  return (
    <div 
      id="user-activity-log-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-auto border border-slate-300 flex flex-col overflow-hidden max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-sm">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  سجل نشاط المستخدمين
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono-numbers">
                  {filteredLogs.length} سجل
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تتبع شامل لكافة العمليات اليومية: الدخول، الخروج، الإضافة، التعديل، الحذف، والطباعة مع رصد القيم قبل وبعد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="تصدير سجل النشاط إلى إكسيل / CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">تصدير CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="إغلاق السجل"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1. منطقة المعايير (Criteria & Filter Area) */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>منطقة المعايير والتصفية المتقدمة:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
            {/* Filter 1: اسم المستخدم */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                تصفية حسب المستخدم:
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">جميع المستخدمين ({allUsernames.length})</option>
                {allUsernames.map((u) => {
                  const appUser = Array.isArray(users) ? users.find((x) => x && x.username === u) : null;
                  return (
                    <option key={u} value={u}>
                      {appUser ? `${appUser.fullName} (${u})` : u}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filter 2: نوع الحركة */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                تصفية حسب نوع الحركة:
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">جميع الحركات</option>
                <option value="دخول">دخول</option>
                <option value="خروج">خروج</option>
                <option value="إضافة">إضافة</option>
                <option value="تعديل">تعديل</option>
                <option value="حذف">حذف</option>
                <option value="طباعة">طباعة</option>
              </select>
            </div>

            {/* Filter 3: النافذة */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                تصفية حسب النافذة:
              </label>
              <select
                value={selectedWindow}
                onChange={(e) => setSelectedWindow(e.target.value)}
                className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">جميع النوافذ</option>
                <option value="إضافة حركة">إضافة حركة</option>
                <option value="إضافة حساب">إضافة حساب</option>
                <option value="إدارة المستخدمين">إدارة المستخدمين</option>
                <option value="تسجيل الدخول">تسجيل الدخول</option>
              </select>
            </div>

            {/* Filter 4: البحث السريع */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                بحث في رقم الحركة / القيم (قبل وبعد):
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث برقم الحركة، الاسم، أو تفاصيل القيمة..."
                  className="w-full h-9 pl-3 pr-8.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Active Filter Badges and Reset */}
          {(selectedUser !== 'ALL' || selectedAction !== 'ALL' || selectedWindow !== 'ALL' || searchQuery) && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">الفلاتر النشطة:</span>
                {selectedUser !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-semibold">
                    المستخدم: {selectedUser}
                  </span>
                )}
                {selectedAction !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-semibold">
                    الحركة: {selectedAction}
                  </span>
                )}
                {selectedWindow !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 text-[11px] font-semibold">
                    النافذة: {selectedWindow}
                  </span>
                )}
                {searchQuery && (
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[11px]">
                    بحث: "{searchQuery}"
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-slate-500 hover:text-rose-600 flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط المعايير</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. منطقة جدول السجل (Activity Log Table) */}
        <div className="overflow-x-auto flex-1 bg-white">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10 select-none">
              <tr>
                <th className="py-2.5 px-3 w-16 text-center border-l border-slate-200">مسلسل</th>
                <th className="py-2.5 px-3 w-28 border-l border-slate-200">التاريخ</th>
                <th className="py-2.5 px-3 w-28 border-l border-slate-200 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>الوقت (12س)</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 w-40 border-l border-slate-200">اسم المستخدم</th>
                <th className="py-2.5 px-3 w-24 text-center border-l border-slate-200">الحركة</th>
                <th className="py-2.5 px-3 w-32 text-center border-l border-slate-200">النافذة</th>
                <th className="py-2.5 px-3 w-24 text-center border-l border-slate-200">رقم الحركة</th>
                <th className="py-2.5 px-3.5 min-w-[220px] border-l border-slate-200">قبل</th>
                <th className="py-2.5 px-3.5 min-w-[240px]">بعد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <History className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="text-sm font-semibold text-slate-600">
                      لا توجد سجلات نشاط مطابقة لمعايير التصفية المختارة
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      جرب تغيير نوع الحركة، المستخدم، أو تفريغ كلمات البحث
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const appUser = Array.isArray(users) ? users.find((u) => u && u.username === log.username) : null;
                  const beforeText = log.beforeValue || 'لا يوجد';
                  const isNewDraft = beforeText.includes('لا يوجد') || beforeText === 'لا يوجد' || beforeText === 'غير متصل';

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-blue-50/40 transition-colors group text-slate-800"
                    >
                      {/* 1. مسلسل */}
                      <td className="py-2.5 px-3 text-center font-mono-numbers font-bold text-slate-500 border-l border-slate-200 bg-slate-50/50">
                        {log.sequence ?? '-'}
                      </td>

                      {/* 2. التاريخ */}
                      <td className="py-2.5 px-3 font-mono-numbers text-slate-700 whitespace-nowrap border-l border-slate-200">
                        {formatDateDMY(log.date) || log.date || '-'}
                      </td>

                      {/* 3. الوقت (بنظام 12 ساعة) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap border-l border-slate-200 font-mono-numbers font-semibold text-slate-800 bg-slate-50/30">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {log.time || '-'}
                        </span>
                      </td>

                      {/* 4. اسم المستخدم */}
                      <td className="py-2.5 px-3 border-l border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                            {(log.username ? log.username.slice(0, 1).toUpperCase() : 'U')}
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-bold text-slate-900 truncate" title={log.username || ''}>
                              {appUser ? appUser.fullName : (log.username || 'مستخدم')}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate" title={log.username || ''}>
                              {log.username || '-'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 5. الحركة */}
                      <td className="py-2.5 px-3 text-center border-l border-slate-200 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* 6. النافذة */}
                      <td className="py-2.5 px-3 text-center border-l border-slate-200 whitespace-nowrap">
                        {getWindowBadge(log.window)}
                      </td>

                      {/* 7. رقم الحركة */}
                      <td className="py-2.5 px-3 text-center font-mono-numbers font-bold text-blue-700 border-l border-slate-200 bg-blue-50/20 whitespace-nowrap">
                        #{log.recordId ?? '-'}
                      </td>

                      {/* 8. قبل (القيمة الحالية / السابقة) */}
                      <td className="py-2.5 px-3.5 border-l border-slate-200 text-slate-600 bg-rose-50/20">
                        <div className="font-mono text-[11px] leading-relaxed break-words line-clamp-3" title={beforeText}>
                          {isNewDraft ? (
                            <span className="text-slate-400 italic">{beforeText}</span>
                          ) : (
                            <span className="text-rose-900">{beforeText}</span>
                          )}
                        </div>
                      </td>

                      {/* 9. بعد (القيمة الجديدة) */}
                      <td className="py-2.5 px-3.5 text-slate-900 bg-emerald-50/20">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="font-mono text-[11px] leading-relaxed break-words line-clamp-3 text-emerald-950 font-medium" title={log.afterValue || ''}>
                            {log.afterValue || '-'}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyRow(log)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded transition-all shrink-0 cursor-pointer"
                            title="نسخ تفاصيل السطر"
                          >
                            {copiedId === log.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>نظام الرقابة والتدقيق الداخلي - توثيق آلي غير قابل للتلاعب</span>
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline font-mono-numbers">
              الوقت المسجل بنظام 12 ساعة مع مؤشرات (ص / م)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>تصدير البيانات</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
