import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Check,
  Save,
  Trash2,
  UserCheck,
  RotateCcw,
  BookOpen,
  ClipboardList,
  FileSpreadsheet,
  Package,
  BarChart3,
  Printer,
  Settings,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Minus,
  Square,
  Lock,
  LogIn,
  Sparkles,
  FileText,
  HelpCircle,
  Info,
} from 'lucide-react';
import { AppUser, UserPermissions, UserRole, FiveActionPermission } from '../types';
import {
  SYSTEM_PERMISSION_SECTIONS,
  PermissionSection,
  getFullPermissionsForRole,
  ensureFullUserPermissions,
  createFiveAction,
} from '../data/permissionsMetadata';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  currentActiveUser: AppUser;
  onSwitchActiveUser: (user: AppUser) => void;
  onAddUser: (newUser: AppUser) => void;
  onUpdateUser: (updatedUser: AppUser, oldUser: AppUser) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users = [],
  currentActiveUser,
  onSwitchActiveUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  // Currently selected user in the side panel
  const [selectedUserId, setSelectedUserId] = useState<string>(
    users[0]?.id || currentActiveUser?.id || 'USR-001'
  );

  // Active Tab in the permissions area
  const [activeTab, setActiveTab] = useState<string>('menu_file');

  // Search in users list
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Is editing an existing user or creating a brand new one
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Draft state of the user currently being viewed/edited
  const [draftUser, setDraftUser] = useState<AppUser>(() => {
    const base = users[0] || currentActiveUser;
    return {
      ...base,
      permissions: ensureFullUserPermissions(base.permissions, base.role),
    };
  });

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('••••••••');

  // Notification feedback
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirm delete dialog
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);

  // Sync draft user when selectedUserId changes or when users array updates
  useEffect(() => {
    if (isCreatingNew) return;

    const targetUser = users.find((u) => u.id === selectedUserId) || users[0] || currentActiveUser;
    if (targetUser) {
      setDraftUser({
        ...targetUser,
        permissions: ensureFullUserPermissions(targetUser.permissions, targetUser.role),
      });
      setPasswordInput(targetUser.password || '');
    }
  }, [selectedUserId, users, isCreatingNew, currentActiveUser]);

  // Filter users list based on search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  if (!isOpen) return null;

  // Handler: Start creating a brand new user
  const handleStartCreateNew = () => {
    const nextNum = users.length + 1;
    const generatedId = `USR-${String(nextNum).padStart(3, '0')}`;
    const defaultRole: UserRole = 'محاسب عام';
    const initialPerms = getFullPermissionsForRole(defaultRole);

    const newUserTemplate: AppUser = {
      id: generatedId,
      username: `user_${nextNum}`,
      fullName: `مستخدم جديد ${nextNum}`,
      role: defaultRole,
      status: 'نشط',
      phone: '',
      email: '',
      createdAt: new Date().toISOString().split('T')[0],
      permissions: initialPerms,
    };

    setDraftUser(newUserTemplate);
    setPasswordInput('');
    setIsCreatingNew(true);
    setSelectedUserId(generatedId);
    setActiveTab('profile');
    setSaveSuccessMessage('تم تجهيز قالب مستخدم جديد، يرجى ملء بيانات الحساب وكلمة المرور وحفظ الصلاحيات.');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Handler: Select a user from the side panel
  const handleSelectUser = (user: AppUser) => {
    setIsCreatingNew(false);
    setSelectedUserId(user.id);
    setDraftUser({
      ...user,
      permissions: ensureFullUserPermissions(user.permissions, user.role),
    });
    setPasswordInput(user.password || '');
  };

  // Handler: Save User & Permissions
  const handleSave = () => {
    if (!draftUser.fullName.trim()) {
      setErrorMessage('يرجى إدخال الاسم الكامل للمستخدم');
      return;
    }
    if (!draftUser.username.trim()) {
      setErrorMessage('يرجى إدخال اسم الدخول للمستخدم');
      return;
    }
    if (!passwordInput.trim() && !draftUser.password) {
      setErrorMessage('يرجى إدخال كلمة مرور صالحة للمستخدم');
      return;
    }

    setErrorMessage(null);

    // Sync legacy permission shortcuts for backward compatibility
    const modules = draftUser.permissions.modules || {};
    const dailyTx = modules['menu_file']?.['addTransaction'] || createFiveAction(true, false, false, false, true);
    const accChart = modules['menu_accounts']?.['chartOfAccounts'] || createFiveAction(true, false, false, false, true);
    const userAdmin = modules['menu_system']?.['userManagement'] || createFiveAction(false, false, false, false, false);
    const actAudit = modules['menu_system']?.['userActivityLogs'] || createFiveAction(true, false, false, false, true);

    const finalPassword = passwordInput.trim() || draftUser.password || '';
    const consolidatedUser: AppUser = {
      ...draftUser,
      password: finalPassword,
      permissions: {
        ...draftUser.permissions,
        transaction: {
          view: dailyTx.view,
          add: dailyTx.add,
          edit: dailyTx.edit,
          delete: dailyTx.delete,
          print: dailyTx.print,
        },
        account: {
          view: accChart.view,
          add: accChart.add,
          edit: accChart.edit,
          delete: accChart.delete,
        },
        userManagement: {
          view: userAdmin.view,
          add: userAdmin.add,
          edit: userAdmin.edit,
          delete: userAdmin.delete,
        },
        activityLog: {
          view: actAudit.view,
          export: actAudit.print,
        },
      },
    };

    if (isCreatingNew) {
      onAddUser(consolidatedUser);
      setIsCreatingNew(false);
      setSelectedUserId(consolidatedUser.id);
      setSaveSuccessMessage(`تمت إضافة المستخدم الجديد "${consolidatedUser.fullName}" وحفظ صلاحياته بنجاح`);
    } else {
      const originalUser = users.find((u) => u.id === consolidatedUser.id) || consolidatedUser;
      onUpdateUser(consolidatedUser, originalUser);
      setSaveSuccessMessage(`تم حفظ وتحديث صلاحيات المستخدم "${consolidatedUser.fullName}" بنجاح`);
    }

    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 4000);
  };

  // Handler: Delete User
  const handleDelete = () => {
    if (draftUser.id === 'USR-001' || draftUser.role === 'مدير نظام' && users.filter(u => u.role === 'مدير نظام').length <= 1) {
      setErrorMessage('لا يمكن حذف مدير النظام الأساسي لضمان استمرارية تشغيل المنظومة.');
      return;
    }
    if (draftUser.id === currentActiveUser.id) {
      setErrorMessage('لا يمكن حذف المستخدم النشط حالياً في هذه الجلسة. قم بالتبديل لمستخدم آخر أولاً.');
      return;
    }

    onDeleteUser(draftUser.id);
    setIsConfirmDeleteOpen(false);
    const remainingUsers = users.filter((u) => u.id !== draftUser.id);
    if (remainingUsers.length > 0) {
      setSelectedUserId(remainingUsers[0].id);
      setDraftUser(remainingUsers[0]);
    }
    setSaveSuccessMessage('تم حذف المستخدم بنجاح');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Handler: Switch Active User to selected user
  const handleSwitchToCurrent = () => {
    onSwitchActiveUser(draftUser);
    setSaveSuccessMessage(`تم تبديل الجلسة الحالية والعمل باسم: ${draftUser.fullName}`);
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Handler: Apply Role Preset
  const handleApplyRolePreset = (targetRole: UserRole) => {
    const defaultPerms = getFullPermissionsForRole(targetRole);
    setDraftUser((prev) => ({
      ...prev,
      role: targetRole,
      permissions: defaultPerms,
    }));
    setSaveSuccessMessage(`تم تطبيق مصفوفة الصلاحيات الافتراضية لدور [${targetRole}]`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Helper to get permission for a sub-item
  const getSubItemPermission = (sectionId: string, subItemId: string): FiveActionPermission => {
    const modules = draftUser.permissions.modules;
    if (modules && modules[sectionId] && modules[sectionId][subItemId]) {
      return modules[sectionId][subItemId];
    }
    return { view: false, add: false, edit: false, delete: false, print: false };
  };

  // Toggle single action for a sub-item
  const handleToggleSubItemAction = (
    sectionId: string,
    subItemId: string,
    action: keyof FiveActionPermission
  ) => {
    setDraftUser((prev) => {
      const currentModules = { ...(prev.permissions.modules || {}) };
      const currentSection = { ...(currentModules[sectionId] || {}) };
      const currentItem = {
        ...(currentSection[subItemId] || { view: false, add: false, edit: false, delete: false, print: false }),
      };

      const newValue = !currentItem[action];
      currentItem[action] = newValue;

      // Logic rule: If adding, editing, deleting, or printing is granted, view/access is automatically granted
      if (newValue && action !== 'view') {
        currentItem.view = true;
      }
      // If view is disabled, all sub actions under it are disabled
      if (!newValue && action === 'view') {
        currentItem.add = false;
        currentItem.edit = false;
        currentItem.delete = false;
        currentItem.print = false;
      }

      currentSection[subItemId] = currentItem;
      currentModules[sectionId] = currentSection;

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          modules: currentModules,
        },
      };
    });
  };

  // Toggle all permissions for the whole current section
  const handleToggleAllSection = (section: PermissionSection, state: boolean) => {
    setDraftUser((prev) => {
      const currentModules = { ...(prev.permissions.modules || {}) };
      const currentSection: Record<string, FiveActionPermission> = {};

      section.subItems.forEach((item) => {
        currentSection[item.id] = createFiveAction(state, state, state, state, state);
      });

      currentModules[section.id] = currentSection;

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          modules: currentModules,
        },
      };
    });
  };

  // Toggle entire column across current section (e.g. all view, all add...)
  const handleToggleColumnInSection = (
    section: PermissionSection,
    action: keyof FiveActionPermission
  ) => {
    setDraftUser((prev) => {
      const currentModules = { ...(prev.permissions.modules || {}) };
      const currentSection = { ...(currentModules[section.id] || {}) };

      // Check if all are currently checked
      const allChecked = section.subItems.every((item) => {
        const p = currentSection[item.id];
        return p && p[action];
      });

      const nextVal = !allChecked;

      section.subItems.forEach((item) => {
        const existing = currentSection[item.id] || {
          view: false,
          add: false,
          edit: false,
          delete: false,
          print: false,
        };
        const updated = { ...existing, [action]: nextVal };

        if (nextVal && action !== 'view') {
          updated.view = true;
        }
        if (!nextVal && action === 'view') {
          updated.add = false;
          updated.edit = false;
          updated.delete = false;
          updated.print = false;
        }

        currentSection[item.id] = updated;
      });

      currentModules[section.id] = currentSection;

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          modules: currentModules,
        },
      };
    });
  };

  // Toggle special permission flag
  const handleToggleSpecialFlag = (flagId: string) => {
    setDraftUser((prev) => {
      const currentSpecial = { ...(prev.permissions.special || {}) };
      const typedKey = flagId as keyof typeof currentSpecial;
      currentSpecial[typedKey] = !currentSpecial[typedKey];
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          special: currentSpecial,
        },
      };
    });
  };

  // Current section object if activeTab is a section
  const currentSection = SYSTEM_PERMISSION_SECTIONS.find((s) => s.id === activeTab);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto no-scrollbar"
      dir="rtl"
    >
      <div className="bg-slate-100 rounded-lg border-2 border-slate-400 shadow-2xl w-full max-w-6xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden text-slate-900 select-none">
        
        {/* 1. Desktop Window Frame & Titlebar (شريط عنوان نافذة سطح المكتب) */}
        <div className="bg-slate-900 text-slate-200 px-3 py-1.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-xs sm:text-sm text-white">
                إدارة المستخدمين والصلاحيات
              </span>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                - تخصيص ملفات الصلاحيات المستقلة وقوائم المنظومة [الإصدار المكتبي]
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="تصغير"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="تكبير"
            >
              <Square className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-950/80 rounded transition-colors cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Classic Desktop Command Toolbar (شريط الأوامر العلوي الثابت: جديد، حفظ، حذف، إغلاق مجتمعة بجانب بعضها) */}
        <div className="bg-gradient-to-b from-slate-100 to-slate-200 border-b border-slate-300 px-3 py-1.5 flex items-center justify-between gap-3 shrink-0">
          {/* مجموعة أزرار الأوامر متجاورة مباشرة */}
          <div className="flex items-center gap-1.5">
            {/* Button: جديد */}
            <button
              type="button"
              onClick={handleStartCreateNew}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 active:bg-slate-200 text-slate-800 rounded border border-slate-300 hover:border-slate-400 shadow-2xs text-xs font-bold transition-colors cursor-pointer"
              title="إضافة مستخدم جديد للنظام"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>جديد</span>
            </button>

            {/* Button: حفظ */}
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded border border-emerald-800 shadow-2xs text-xs font-bold transition-colors cursor-pointer"
              title="حفظ بيانات وصلاحيات المستخدم (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ</span>
            </button>

            {/* Button: حذف */}
            <button
              type="button"
              onClick={() => setIsConfirmDeleteOpen(true)}
              disabled={isCreatingNew || draftUser.id === 'USR-001' || draftUser.id === currentActiveUser.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-700 disabled:text-slate-400 disabled:bg-slate-100 rounded border border-slate-300 hover:border-rose-300 shadow-2xs text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="حذف هذا المستخدم من النظام"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف</span>
            </button>

            {/* Button: دخول بحساب هذا المستخدم فورياً */}
            {!isCreatingNew && draftUser.id !== currentActiveUser.id && (
              <button
                type="button"
                onClick={handleSwitchToCurrent}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded border border-indigo-700 shadow-2xs text-xs font-bold transition-colors cursor-pointer"
                title={`التبديل فوراً وتفعيل جلسة العمل بحساب "${draftUser.fullName}"`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>دخول بحسابه</span>
              </button>
            )}

            {/* Button: إغلاق - مباشرة بجوار الأزرار في نفس شريط الأوامر */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-700 rounded border border-slate-300 hover:border-rose-300 shadow-2xs text-xs font-bold transition-colors cursor-pointer"
              title="إغلاق نافذة إدارة المستخدمين"
            >
              <X className="w-3.5 h-3.5 text-rose-600" />
              <span>إغلاق</span>
            </button>
          </div>

          {/* تنبيهات النجاح والخطأ عند الحفظ */}
          <div className="flex items-center gap-2">
            {saveSuccessMessage && (
              <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {saveSuccessMessage}
              </span>
            )}
            {errorMessage && (
              <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-100/90 border border-rose-300 px-2 py-0.5 rounded text-xs font-semibold animate-in fade-in">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                {errorMessage}
              </span>
            )}
          </div>
        </div>

        {/* 3. Main Workspace Area: Split into Two Primary Panels (المنطقتين الرئيسيتين) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* ======================================================== */}
          {/* المنطقة الأولى (عرض المستخدمين - Side Panel) */}
          {/* ======================================================== */}
          <div className="w-full md:w-80 lg:w-96 bg-white border-l border-slate-300 flex flex-col shrink-0">
            {/* Side Panel Header */}
            <div className="p-2.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Users className="w-4 h-4 text-blue-700" />
                <span>قائمة المستخدمين في المنظومة</span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 border border-slate-300 text-[11px] font-mono font-bold">
                {users.length} مستخدمين
              </span>
            </div>

            {/* Quick Search in Users */}
            <div className="p-2 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث سريع عن مستخدم بالاسم أو الكود..."
                  className="w-full pl-2 pr-8 py-1 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Users Table / List */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-1 divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  لا يوجد مستخدم يطابق البحث
                </div>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isSelected = !isCreatingNew && draftUser.id === user.id;
                  const isSessionActive = user.id === currentActiveUser.id;

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`p-2 rounded cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono ${
                              isSelected
                                ? 'bg-blue-800 text-white'
                                : 'bg-slate-200 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs truncate">
                                {user.fullName}
                              </span>
                              {isSessionActive && (
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded font-bold shrink-0 ${
                                    isSelected
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  }`}
                                >
                                  الجلسة الحالية
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-[10px] truncate ${
                                isSelected ? 'text-blue-100' : 'text-slate-400'
                              }`}
                            >
                              @{user.username} • {user.id}
                            </div>
                          </div>
                        </div>

                        <div className="text-left shrink-0">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium block ${
                              isSelected
                                ? 'bg-blue-700 text-white'
                                : user.role === 'مدير نظام'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : user.role === 'محاسب عام'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : user.role === 'مدخل بيانات'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* المنطقة الثانية (إدارة الصلاحيات وقوائم النظام - Main Panel) */}
          {/* ======================================================== */}
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            
            {/* Top Info Banner: اسم المستخدم المحدد */}
            <div className="p-2.5 bg-gradient-to-r from-amber-50 via-slate-100 to-blue-50 border-b border-slate-300 shrink-0">
              <div className="flex items-center gap-2.5">
                {/* اسم المستخدم البارز */}
                <div className="px-3 py-1 rounded bg-amber-100 border border-amber-300 shadow-2xs text-amber-900 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-amber-800">اسم المستخدم:</span>
                  <strong className="text-sm font-black text-rose-700">
                    {draftUser.fullName || 'مستخدم جديد'}
                  </strong>
                </div>

                <span className="text-xs px-2.5 py-0.5 rounded bg-white border border-slate-300 text-slate-700 font-mono font-bold">
                  {draftUser.id}
                </span>

                <span className="text-xs px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 font-bold">
                  الدور: {draftUser.role}
                </span>
              </div>
            </div>

            {/* System Menus Tabs Bar (نظام التبويبات العلوية للأقسام وقوائم النظام) */}
            <div className="bg-slate-200/90 border-b border-slate-300 px-2 pt-2 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none">
              
              {/* Tab: بطاقة المستخدم */}
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1.5 rounded-t text-xs font-bold flex items-center gap-1.5 transition-colors border-t border-x cursor-pointer shrink-0 ${
                  activeTab === 'profile'
                    ? 'bg-white text-blue-900 border-slate-300 shadow-xs -mb-px pb-2'
                    : 'bg-slate-100 hover:bg-white text-slate-700 border-slate-300/60'
                }`}
              >
                <User className="w-3.5 h-3.5 text-blue-700" />
                <span>بطاقة المستخدم</span>
              </button>

              {/* Sections Tabs from SYSTEM_PERMISSION_SECTIONS (قوائم النظام الفعلية كما في الشريط العلوي) */}
              {SYSTEM_PERMISSION_SECTIONS.map((section) => {
                const isActive = activeTab === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveTab(section.id)}
                    className={`px-3 py-1.5 rounded-t text-xs font-bold flex items-center gap-1.5 transition-colors border-t border-x cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-white text-blue-900 border-slate-300 shadow-xs -mb-px pb-2'
                        : 'bg-slate-100 hover:bg-white text-slate-700 border-slate-300/60'
                    }`}
                  >
                    {section.id === 'menu_file' && <FileText className="w-3.5 h-3.5 text-blue-700" />}
                    {section.id === 'menu_accounts' && <BookOpen className="w-3.5 h-3.5 text-emerald-700" />}
                    {section.id === 'menu_reports' && <BarChart3 className="w-3.5 h-3.5 text-purple-700" />}
                    {section.id === 'menu_system' && <Settings className="w-3.5 h-3.5 text-indigo-700" />}
                    {section.id === 'menu_help' && <HelpCircle className="w-3.5 h-3.5 text-amber-700" />}
                    <span>{section.shortTitle}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Workspace Content */}
            <div className="flex-1 bg-white p-3 sm:p-4 overflow-y-auto no-scrollbar">
              
              {/* VIEW 1: User Profile / Card Tab */}
              {activeTab === 'profile' ? (
                <div className="max-w-2xl mx-auto space-y-4 py-2">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2 text-xs text-blue-900">
                    <UserCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>بيانات حساب المستخدم الأساسية:</strong> قم بتعيين اسم الدخول وكلمة المرور والدور الوظيفي. يمكنك بعد ذلك تخصيص الصلاحيات المستقلة من التبويبات المجاورة.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* User ID */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        رقم / كود المستخدم
                      </label>
                      <input
                        type="text"
                        value={draftUser.id}
                        disabled
                        className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 bg-slate-100 text-slate-600 font-mono font-bold"
                      />
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الاسم الكامل للمستخدم <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={draftUser.fullName}
                        onChange={(e) => setDraftUser((p) => ({ ...p, fullName: e.target.value }))}
                        placeholder="مثال: مصطفى شحاتة"
                        className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        اسم الدخول (Username) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={draftUser.username}
                        onChange={(e) => setDraftUser((p) => ({ ...p, username: e.target.value }))}
                        placeholder="مثال: moustafa"
                        className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        كلمة المرور
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الدور الرئيسي في النظام
                      </label>
                      <select
                        value={draftUser.role}
                        onChange={(e) => handleApplyRolePreset(e.target.value as UserRole)}
                        className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="مدير نظام">مدير نظام (كامل الصلاحيات)</option>
                        <option value="محاسب عام">محاسب عام (قيود وتقارير)</option>
                        <option value="مدخل بيانات">مدخل بيانات (إدخال حركات)</option>
                        <option value="مراجع حسابات">مراجع حسابات (تدقيق وطباعة)</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        حالة الحساب
                      </label>
                      <select
                        value={draftUser.status}
                        onChange={(e) =>
                          setDraftUser((p) => ({ ...p, status: e.target.value as 'نشط' | 'معطل' }))
                        }
                        className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white font-bold"
                      >
                        <option value="نشط">نشط (مسموح له بتسجيل الدخول)</option>
                        <option value="معطل">معطل (حظر الدخول مؤقتاً)</option>
                      </select>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        رقم الهاتف / الواتساب
                      </label>
                      <input
                        type="text"
                        value={draftUser.phone || ''}
                        onChange={(e) => setDraftUser((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="010XXXXXXXX"
                        className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        value={draftUser.email || ''}
                        onChange={(e) => setDraftUser((p) => ({ ...p, email: e.target.value }))}
                        placeholder="user@example.com"
                        className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                    تاريخ الإنشاء: {draftUser.createdAt} • آخر دخول: {draftUser.lastLogin || 'لم يسجل دخول بعد'}
                  </div>
                </div>
              ) : currentSection ? (
                /* VIEW 2: System Permissions Matrix for Selected Section */
                <div className="space-y-3">
                  
                  {/* Section Top Toolbar (شريط التحكم السريع في القسم كما في الصورة الإرشادية) */}
                  <div className="p-2.5 bg-slate-100 rounded-md border border-slate-300 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {/* Checkbox: تفعيل وعرض القائمة */}
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentSection.subItems.some(
                            (it) => getSubItemPermission(currentSection.id, it.id).view
                          )}
                          onChange={(e) => handleToggleAllSection(currentSection, e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>عرض وتفعيل قائمة ({currentSection.title})</span>
                      </label>
                    </div>

                    {/* Quick Selection Actions */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleToggleAllSection(currentSection, true)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-blue-800 border border-slate-300 rounded font-bold shadow-2xs cursor-pointer"
                        title="تحديد كافة الصلاحيات في هذا التبويب"
                      >
                        تحديد الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleAllSection(currentSection, false)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded font-bold shadow-2xs cursor-pointer"
                        title="إلغاء تحديد كافة الصلاحيات في هذا التبويب"
                      >
                        إلغاء تحديد الكل
                      </button>
                    </div>
                  </div>

                  {/* Permissions Matrix Table (جدول الصلاحيات الخمس الأساسية) */}
                  <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-200/90 text-slate-800 border-b border-slate-300 font-black">
                          <th className="p-2.5 text-right w-1/3">
                            اسم القائمة والعملية الفرعية
                          </th>
                          
                          {/* 1. الدخول */}
                          <th
                            className="p-2 text-center w-[13%] hover:bg-slate-300/80 cursor-pointer transition-colors"
                            onClick={() => handleToggleColumnInSection(currentSection, 'view')}
                            title="انقر لتحديد / إلغاء عمود الدخول بالكامل"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>الدخول</span>
                            </div>
                          </th>

                          {/* 2. الإضافة */}
                          <th
                            className="p-2 text-center w-[13%] hover:bg-slate-300/80 cursor-pointer transition-colors"
                            onClick={() => handleToggleColumnInSection(currentSection, 'add')}
                            title="انقر لتحديد / إلغاء عمود الإضافة بالكامل"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>الإضافة</span>
                            </div>
                          </th>

                          {/* 3. التعديل */}
                          <th
                            className="p-2 text-center w-[13%] hover:bg-slate-300/80 cursor-pointer transition-colors"
                            onClick={() => handleToggleColumnInSection(currentSection, 'edit')}
                            title="انقر لتحديد / إلغاء عمود التعديل بالكامل"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>التعديل</span>
                            </div>
                          </th>

                          {/* 4. الحذف */}
                          <th
                            className="p-2 text-center w-[13%] hover:bg-slate-300/80 cursor-pointer transition-colors"
                            onClick={() => handleToggleColumnInSection(currentSection, 'delete')}
                            title="انقر لتحديد / إلغاء عمود الحذف بالكامل"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>الحذف</span>
                            </div>
                          </th>

                          {/* 5. الطباعة */}
                          <th
                            className="p-2 text-center w-[13%] hover:bg-slate-300/80 cursor-pointer transition-colors"
                            onClick={() => handleToggleColumnInSection(currentSection, 'print')}
                            title="انقر لتحديد / إلغاء عمود الطباعة بالكامل"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>الطباعة</span>
                            </div>
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {currentSection.subItems.map((item) => {
                          const perms = getSubItemPermission(currentSection.id, item.id);
                          const hasAnyPermission = perms.view || perms.add || perms.edit || perms.delete || perms.print;

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-blue-50/50 transition-colors ${
                                hasAnyPermission ? 'bg-white' : 'bg-slate-50/60 text-slate-400'
                              }`}
                            >
                              {/* Item Title & Description */}
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900 text-xs flex items-center justify-between gap-2">
                                  <span>{item.title}</span>
                                  {item.shortcut && (
                                    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-600 shrink-0">
                                      {item.shortcut}
                                    </kbd>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 line-clamp-1">
                                  {item.description}
                                </div>
                              </td>

                              {/* 1. الدخول (View) */}
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.view}
                                  onChange={() => handleToggleSubItemAction(currentSection.id, item.id, 'view')}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
                                  title={`صلاحية دخول: ${item.title}`}
                                />
                              </td>

                              {/* 2. الإضافة (Add) */}
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.add}
                                  onChange={() => handleToggleSubItemAction(currentSection.id, item.id, 'add')}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer accent-emerald-600"
                                  title={`صلاحية إضافة: ${item.title}`}
                                />
                              </td>

                              {/* 3. التعديل (Edit) */}
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.edit}
                                  onChange={() => handleToggleSubItemAction(currentSection.id, item.id, 'edit')}
                                  className="w-4 h-4 rounded text-amber-600 focus:ring-0 cursor-pointer accent-amber-600"
                                  title={`صلاحية تعديل: ${item.title}`}
                                />
                              </td>

                              {/* 4. الحذف (Delete) */}
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.delete}
                                  onChange={() => handleToggleSubItemAction(currentSection.id, item.id, 'delete')}
                                  className="w-4 h-4 rounded text-rose-600 focus:ring-0 cursor-pointer accent-rose-600"
                                  title={`صلاحية حذف: ${item.title}`}
                                />
                              </td>

                              {/* 5. الطباعة (Print) */}
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.print}
                                  onChange={() => handleToggleSubItemAction(currentSection.id, item.id, 'print')}
                                  className="w-4 h-4 rounded text-purple-600 focus:ring-0 cursor-pointer accent-purple-600"
                                  title={`صلاحية طباعة وتصدير: ${item.title}`}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Special Permissions Box (الصلاحيات الخاصة والاستثنائية كما في الصورة الإرشادية) */}
                  {currentSection.specialFlags && currentSection.specialFlags.length > 0 && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md">
                      <div className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-700" />
                        <span>صلاحيات خاصة واستثنائية لقسم ({currentSection.title}):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {currentSection.specialFlags.map((flag) => {
                          const isFlagChecked = Boolean(
                            draftUser.permissions.special?.[
                              flag.id as keyof typeof draftUser.permissions.special
                            ]
                          );
                          return (
                            <label
                              key={flag.id}
                              className="flex items-start gap-2 p-1.5 rounded bg-white border border-amber-200 hover:bg-amber-100/50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isFlagChecked}
                                onChange={() => handleToggleSpecialFlag(flag.id)}
                                className="w-4 h-4 rounded text-amber-700 focus:ring-0 cursor-pointer mt-0.5 accent-amber-600"
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-900 block">
                                  {flag.title}
                                </span>
                                <span className="text-[10px] text-slate-500 block leading-tight">
                                  {flag.description}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Note */}
                  <div className="pt-1 text-[11px] text-slate-500 text-left">
                    * التعديلات تُحفظ فقط للمستخدم المحدد عبر زر (حفظ) في شريط الأوامر العلوي
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* 4. Confirm Delete Dialog */}
        {isConfirmDeleteOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg border border-slate-300 p-4 max-w-sm w-full shadow-2xl space-y-3 text-right">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>تأكيد حذف المستخدم</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                هل أنت متأكد من حذف المستخدم <strong>{draftUser.fullName}</strong> ({draftUser.id}) نهائياً من النظام؟
                لن يتمكن من تسجيل الدخول بعد الآن.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تأكيد الحذف</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
