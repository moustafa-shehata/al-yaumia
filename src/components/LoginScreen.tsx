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
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white"
    >
      {/* Background Subtle Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(79,70,229,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-700/40 overflow-hidden my-auto">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-6 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                منظومة اكيورا المالية
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                نظام القيود المحاسبية وتفريغ كشوف الحسابات ومطابقة الأرصدة
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Quick Account Picker (Users from User Management) */}
          <div>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
              {users.map((u) => {
                const isSelected = u.id === selectedUserId || u.username === usernameInput;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-right transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {u.fullName.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {u.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
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
                  className="w-full pl-3 pr-9 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-slate-800 bg-white"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                كلمة المرور (Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="أدخل كلمة المرور الخاصة بحسابك"
                  className="w-full pl-10 pr-9 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-slate-800 bg-white"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
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
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 border border-blue-400/30"
              >
                <LogIn className="w-5 h-5 text-white" />
                <span className="tracking-wide">
                  {isLoading ? 'جاري التحقق وتسجيل الدخول...' : 'تسجيل الدخول إلى المنظومة'}
                </span>
              </button>
            </div>
          </form>

          {/* Footer Note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>إصدار: Acuora ERP v2.6.4 Pro</span>
          </div>
        </div>
      </div>
    </div>
  );
};
