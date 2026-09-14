import React, { useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export interface PermissionNotice {
  id?: string;
  title?: string;
  actionName?: string;
  targetResource?: string;
  requiredRoleOrPerm?: string;
  message?: string;
  details?: string;
  userFullName?: string;
  userName?: string;
  userRole?: string;
}

interface PermissionModalAlertProps {
  notice: PermissionNotice | null;
  onClose: () => void;
}

export const PermissionModalAlert: React.FC<PermissionModalAlertProps> = ({
  notice,
  onClose,
}) => {
  useEffect(() => {
    if (!notice) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notice, onClose]);

  if (!notice) return null;

  // Determine concise primary message
  const mainMessage =
    notice.message ||
    notice.details ||
    (notice.actionName
      ? `لا تملك الصلاحية الكافية لإتمام "${notice.actionName}".`
      : 'عفواً، لا تملك الصلاحية لتنفيذ هذا الإجراء.');

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-[#f0f6fc] rounded-2xl shadow-2xl border border-[#bcd2e8] p-6 text-center animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 left-3.5 w-7 h-7 rounded-full text-[#55789e] hover:text-[#0f2d52] hover:bg-[#e6eef6] flex items-center justify-center transition-colors cursor-pointer"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Visual Icon */}
        <div className="w-12 h-12 mx-auto mb-3.5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-2xs">
          <ShieldAlert className="w-6 h-6" />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#0f2d52] mb-2">
          {notice.title || 'صلاحية غير متوفرة'}
        </h3>

        {/* Concise Message */}
        <p className="text-xs sm:text-sm text-[#4b6a8d] leading-relaxed mb-5">
          {mainMessage}
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="w-full py-2.5 px-4 rounded-xl bg-[#0078d4] hover:bg-[#0067b8] active:bg-[#004e8c] text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs border border-white/20"
        >
          حسناً، فهمت
        </button>
      </div>
    </div>
  );
};
