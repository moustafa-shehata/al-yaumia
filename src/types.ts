export interface Transaction {
  id: number; // مسلسل
  date: string; // التاريخ (YYYY-MM-DD)
  receipt: number; // المقبوضات
  payment: number; // مدفوعات
  description: string; // البيان
  movementBalance: number; // رصيد الحركة
  type: 'قبض' | 'دفع' | string; // نوع الحركة (قبض أو دفع)
  accountName: string; // اسم الحساب
  mainAccount: string; // الحساب الرئيسي
  closingAccount: string; // الحساب الختامي
  createdBy: string; // منشئ الحركة
  lastModified: string; // آخر تاريخ تعديل
}

export interface Account {
  id: string;
  code?: string; // كود الحساب المالي (مثل 120101)
  name: string; // اسم الحساب
  type: 'عملاء' | 'موردين' | 'صندوق / بنك' | 'مصروفات' | 'إيرادات' | string;
  category?: 'أصول' | 'خصوم' | 'حقوق ملكية' | 'إيرادات' | 'مصروفات' | string;
  mainAccount: string; // الحساب الرئيسي
  mainAccountCode?: string; // رمز الحساب الرئيسي (مثل 12 أو 21)
  closingAccount: string; // الحساب الختامي
  phone?: string;
  openingBalance: number;
  notes?: string;
  createdAt: string;
}

export type ActiveAppTab = 'daily_movement' | 'account_statement';

export type UserActionType = 'دخول' | 'خروج' | 'إضافة' | 'تعديل' | 'حذف' | 'طباعة';

export type ActivityWindowType = 'إضافة حركة' | 'إضافة حساب' | 'بطاقة الحساب' | 'إدارة المستخدمين' | 'تسجيل الدخول';

export interface UserActivityLog {
  id: string; // معرّف فريد
  sequence: number; // مسلسل
  date: string; // التاريخ (YYYY-MM-DD)
  time: string; // الوقت بنظام 12 ساعة (مثلاً: 10:30 ص أو 04:15 م)
  username: string; // اسم المستخدم
  action: UserActionType; // الحركة: دخول, خروج, إضافة, تعديل, حذف, طباعة
  window: ActivityWindowType; // النافذة: إضافة حركة, إضافة حساب, إدارة المستخدمين
  recordId: string | number; // رقم الحركة: رقمها المحفوظ به داخل النافذة
  beforeValue: string; // قبل: القيمة الحالية / السابقة للحركة
  afterValue: string; // بعد: القيمة الجديدة للحركة
}

export type UserRole = 'مدير نظام' | 'محاسب عام' | 'مدخل بيانات' | 'مراجع حسابات';

export interface FiveActionPermission {
  view: boolean;   // الدخول / عرض
  add: boolean;    // إضافة
  edit: boolean;   // تعديل
  delete: boolean; // حذف
  print: boolean;  // طباعة
}

export interface SpecialPermissions {
  skipManagerApproval?: boolean;   // إضافة/تعديل بدون تأكيد مسؤول
  exceedCreditLimit?: boolean;     // تجاوز السقف الائتماني للعملاء
  editPostedEntries?: boolean;     // تعديل القيود بعد الترحيل
  modifyOpeningBalances?: boolean; // تعديل الأرصدة الافتتاحية
  fullDataExport?: boolean;        // تصدير البيانات المالية كاملة
  systemResetPermission?: boolean; // صلاحية تصفير وتهيئة النظام
}

export interface UserPermissions {
  transaction: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
    print: boolean;
  };
  account: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
  userManagement: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
  activityLog: {
    view: boolean;
    export: boolean;
  };
  // Detailed modular system permissions matrix:
  modules?: {
    [sectionKey: string]: {
      [subItemKey: string]: FiveActionPermission;
    };
  };
  special?: SpecialPermissions;
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  status: 'نشط' | 'معطل';
  password?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  lastLogin?: string;
  permissions: UserPermissions;
}

export interface AuditLogEntry {
  id: string;
  transactionId: number;
  updatedAt: string;
  author: string;
  rawAuditText: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  actionType?: 'تعديل' | 'إنشاء' | 'حذف';
}

export interface TechnicalNote {
  id: number;
  title: string;
  description: string;
  badge: string;
}

export interface FilterState {
  searchQuery: string;
  accountName: string;
  type: string;
  startDate: string;
  endDate: string;
}
