import React, { useState } from 'react';
import {
  User,
  KeyRound,
  LogIn,
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AppUser, UserRole } from '../types';

interface LoginScreenProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
  lastUserId?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLogin,
  lastUserId,
}) => {
  // Find initial user from user management
  const initialUser = users.find((u) => u.id === lastUserId) || users[0];

  const [selectedUserId, setSelectedUserId] = useState<string>(initialUser?.id || '');
  const [usernameInput, setUsernameInput] = useState<string>(initialUser?.username || '');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Handle Quick User Selection from User Management list
  const handleSelectUser = (user: AppUser) => {
    setSelectedUserId(user.id);
    setUsernameInput(user.username);
    // Do not inject hardcoded default password; prompt user for their actual password
    setPasswordInput('');
    setErrorMsg(null);
  };

  // Handle Login Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedUsername = usernameInput.trim().toLowerCase();
    const targetUser = users.find(
      (u) => u.username.toLowerCase() === trimmedUsername
    ) || users.find((u) => u.id === selectedUserId);

    if (!targetUser) {
      setErrorMsg('اسم المستخدم غير مسجل بالنظام.');
      return;
    }

    if (targetUser.status === 'معطل') {
      setErrorMsg('هذا الحساب معطل حالياً. يرجى مراجعة مسؤول النظام.');
      return;
    }

    // Strictly verify password against user management records
    const expectedPassword = targetUser.password ? targetUser.password.trim() : '';
    const enteredPassword = passwordInput.trim();

    if (!expectedPassword) {
      setErrorMsg('لا توجد كلمة مرور مسجلة لهذا الحساب. يرجى مراجعة مسؤول النظام.');
      return;
    }

    if (enteredPassword !== expectedPassword) {
      setErrorMsg('كلمة المرور غير صحيحة.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin(targetUser);
    }, 300);
  };

  // Helper for role color badge
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'مدير نظام':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'محاسب عام':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'مدخل بيانات':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'مراجع حسابات':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-[#00274d] via-[#004e8c] to-[#0078d4] flex items-center justify-center p-4 selection:bg-[#0078d4] selection:text-white"
    >
      {/* Background Subtle Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,120,212,0.2),transparent_50%)] pointer-events-none" />

      <div className="relative w-full max-w-lg bg-[#f0f6fc] rounded-2xl shadow-2xl border border-[#bcd2e8] overflow-hidden my-auto">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#003e73] via-[#005a9e] to-[#0078d4] text-white p-5 sm:p-6 border-b border-[#004e8c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center shadow-lg shadow-black/10 shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                منظومة اكيورا المالية
              </h1>
              <p className="text-xs text-blue-100 mt-0.5">
                نظام القيود المحاسبية وتفريغ كشوف الحسابات ومطابقة الأرصدة
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Quick Account Picker (Users from User Management) */}
          <div>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1.5 bg-[#eaf2fb] rounded-xl border border-[#bcd2e8]">
              {users.map((u) => {
                const isSelected = u.id === selectedUserId || u.username === usernameInput;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-right transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#0078d4] ring-2 ring-[#0078d4]/20 shadow-xs'
                        : 'bg-white/80 border-[#bcd2e8] hover:bg-white hover:border-[#0078d4]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                          isSelected ? 'bg-[#0078d4] text-white' : 'bg-[#e6eef6] text-[#1e3a5f]'
                        }`}
                      >
                        {u.fullName.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0f2d52] truncate">
                          {u.fullName}
                        </div>
                        <div className="text-[10px] text-[#55789e] font-mono truncate">
                          {u.username}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${getRoleBadge(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold text-[#1e3a5f] mb-1">
                اسم الدخول المعتمد (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    const matched = users.find(
                      (u) => u.username.toLowerCase() === e.target.value.trim().toLowerCase()
                    );
                    if (matched) {
                      setSelectedUserId(matched.id);
                    }
                  }}
                  placeholder="أدخل اسم الدخول المسجل"
                  className="w-full pl-3 pr-9 py-2 text-xs rounded-lg border border-[#bcd2e8] focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] font-mono text-[#0f2d52] bg-white focus:outline-none"
                />
                <User className="w-4 h-4 text-[#55789e] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-[#1e3a5f] mb-1">
                كلمة المرور (Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="أدخل كلمة المرور الخاصة بحسابك"
                  className="w-full pl-10 pr-9 py-2 text-xs rounded-lg border border-[#bcd2e8] focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] font-mono text-[#0f2d52] bg-white focus:outline-none"
                />
                <KeyRound className="w-4 h-4 text-[#55789e] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55789e] hover:text-[#0f2d52] cursor-pointer p-1"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-rose-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button - Highly visible, prominent styling */}
            <div className="pt-1">
              <button
                type="submit"
                id="btn-submit-login"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#005a9e] to-[#0078d4] hover:from-[#004e8c] hover:to-[#0067b8] active:scale-[0.99] text-white font-extrabold text-sm shadow-md shadow-[#0078d4]/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 border border-white/20"
              >
                <LogIn className="w-5 h-5 text-white" />
                <span className="tracking-wide">
                  {isLoading ? 'جاري التحقق وتسجيل الدخول...' : 'تسجيل الدخول إلى المنظومة'}
                </span>
              </button>
            </div>
          </form>

          {/* Footer Note */}
          <div className="pt-2 border-t border-[#bcd2e8] flex items-center justify-between text-[11px] text-[#55789e]">
            <span>إصدار: Acuora ERP v2.6.4 Pro</span>
            <span>Acuora Soft Egypt</span>
          </div>
        </div>
      </div>
    </div>
  );
};
