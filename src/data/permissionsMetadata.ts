import { FiveActionPermission, UserPermissions, UserRole } from '../types';

export interface PermissionSubItem {
  id: string;
  title: string;
  shortcut?: string;
  description: string;
}

export interface PermissionSection {
  id: string;
  menuCode: string;
  title: string;
  shortTitle: string;
  description: string;
  subItems: PermissionSubItem[];
  specialFlags?: {
    id: string;
    title: string;
    description: string;
  }[];
}

// القوائم الفعلية الحالية داخل النظام كما في شريط القوائم العلوي (DesktopMenuBar)
export const SYSTEM_PERMISSION_SECTIONS: PermissionSection[] = [
  {
    id: 'menu_file',
    menuCode: 'F',
    title: 'قائمة ملف (File)',
    shortTitle: 'ملف [F]',
    description: 'أوامر قائمة ملف الرئيسية: إضافة حركة، إضافة حساب، معاينة وطباعة التقرير، تصدير إكسيل، واستعادة البيانات',
    subItems: [
      { id: 'addTransaction', title: 'إضافة حركة جديدة', shortcut: 'F2', description: 'تسجيل قيود اليومية وسندات الصرف والقبض' },
      { id: 'addAccount', title: 'إضافة حساب مالي جديد', shortcut: 'F3', description: 'إنشاء حساب فرعي في شجرة الحسابات' },
      { id: 'printReport', title: 'معاينة وطباعة التقرير (A4)', shortcut: 'Ctrl+P', description: 'معاينة وطباعة تقرير جدول الحركة العام' },
      { id: 'exportExcel', title: 'تصدير البيانات إلى ملف Excel (CSV)', shortcut: 'Ctrl+E', description: 'تصدير الحركات المالية إلى ملف CSV متوافق مع إكسيل' },
      { id: 'resetData', title: 'استعادة البيانات الافتراضية الأصلية', shortcut: '', description: 'إعادة ضبط المنظومة للبيانات الأولية' },
      { id: 'transactionsOps', title: 'تعديل وحذف قيود اليومية المسجلة', shortcut: '', description: 'تعديل مبالغ وبيان القيود أو حذفها من جدول الحركة' },
    ],
    specialFlags: [
      { id: 'editOtherUsersEntries', title: 'تعديل وحذف قيود المستخدمين الآخرين', description: 'السماح بتعديل وحذف حركات سجلها مستخدمون آخرون' },
    ],
  },
  {
    id: 'menu_accounts',
    menuCode: 'A',
    title: 'قائمة الحسابات (Accounts)',
    shortTitle: 'الحسابات [A]',
    description: 'أوامر قائمة الحسابات: دليل الحسابات الشجري، بطاقة الحساب، استيراد الحسابات، وتعريف العملاء والموردين',
    subItems: [
      { id: 'chartOfAccounts', title: 'دليل الحسابات المالي الشجري', shortcut: 'F4', description: 'استعراض شجرة الحسابات (أصول، خصوم، إيرادات، مصروفات)' },
      { id: 'accountCard', title: 'بطاقة الحساب المالي (تصفح وتعديل)', shortcut: '', description: 'فتح بطاقة الحساب، البحث، وتعديل التفاصيل' },
      { id: 'importAccounts', title: 'استيراد وتخصيص دليل الحسابات', shortcut: '', description: 'استيراد جماعي عبر النسخ واللصق أو ملفات إكسيل' },
      { id: 'defineParty', title: 'تعريف عميل أو مورد جديد', shortcut: 'F3', description: 'إضافة عميل أو مورد وتعيين تصنيفه وحسابه الأب' },
      { id: 'deleteAccount', title: 'حذف الحسابات المالية غير المقيدة', shortcut: '', description: 'حذف بطاقة حساب غير مرتبطة بحركات مالية' },
    ],
    specialFlags: [
      { id: 'overrideOpeningBalances', title: 'تعديل الأرصدة الافتتاحية للحسابات', description: 'تعديل رصيد أول المدة المسجل في بطاقة الحساب' },
    ],
  },
  {
    id: 'menu_reports',
    menuCode: 'R',
    title: 'قائمة التقارير (Reports)',
    shortTitle: 'التقارير [R]',
    description: 'أوامر قائمة التقارير: كشف الحساب المعتمد ودفتر الأستاذ، طباعة اليومية العامة الرسمية، وتصدير الحركة',
    subItems: [
      { id: 'accountStatement', title: 'كشف الحساب المعتمد ودفتر الأستاذ', shortcut: 'F5', description: 'عرض كشف حساب العميل وحركات المدين والدائن والرصيد' },
      { id: 'statementSheet', title: 'شيت تفريغ ومطابقة كشوفات الحساب', shortcut: '', description: 'نافذة تفريغ ومطابقة كشوف العملاء ومراجعة القيود' },
      { id: 'printOfficialJournal', title: 'طباعة اليومية العامة الرسمية', shortcut: '', description: 'الطباعة الرسمية لسجل القيود اليومية بشعار الشركة' },
      { id: 'exportMovementExcel', title: 'تصدير تقرير الحركة إلى Excel', shortcut: '', description: 'تصدير كشوف وحركات اليومية لملفات إكسيل' },
      { id: 'cashFlowStats', title: 'رسم ومؤشرات التدفقات النقدية والمقبوضات', shortcut: '', description: 'استعراض المخطط البياني للتدفقات الشهرية والمؤشرات' },
    ],
    specialFlags: [
      { id: 'fullDataExport', title: 'تصدير كامل قاعدة البيانات والتقارير بدون قيود', description: 'تصدير البيانات الشاملة للتقارير المالية' },
    ],
  },
  {
    id: 'menu_system',
    menuCode: 'U',
    title: 'قائمة إدارة النظام (System)',
    shortTitle: 'إدارة النظام [U]',
    description: 'أوامر قائمة إدارة النظام: سجل نشاط المستخدمين والتدقيق، إدارة المستخدمين وصلاحيات الدخول، وتبديل المستخدم',
    subItems: [
      { id: 'userActivityLogs', title: 'سجل نشاط المستخدمين والتدقيق المالي', shortcut: 'F6', description: 'سجل عمليات الدخول، الإضافة، التعديل، والحذف الرقابي' },
      { id: 'userManagement', title: 'إدارة المستخدمين وصلاحيات الدخول', shortcut: 'F7', description: 'إنشاء المستخدمين وتحديد الصلاحيات وكلمات المرور' },
      { id: 'switchUser', title: 'تبديل المستخدم المسجل في الجلسة', shortcut: '', description: 'تسجيل الدخول الفوري والعمل بحساب مستخدم آخر' },
    ],
    specialFlags: [
      { id: 'systemResetPermission', title: 'صلاحية تصفير وتهيئة النظام كاملة', description: 'إعادة ضبط قاعدة البيانات وحذف العمليات التجريبية' },
    ],
  },
  {
    id: 'menu_help',
    menuCode: 'H',
    title: 'قائمة مساعدة (Help)',
    shortTitle: 'مساعدة [H]',
    description: 'أوامر قائمة مساعدة: معلومات المنظومة ودليل الاستخدام، الملاحظات الفنية المحاسبية، ودليل الاختصارات',
    subItems: [
      { id: 'systemInfo', title: 'معلومات المنظومة وترخيص البرنامج', shortcut: '', description: 'استعراض اسم الإصدار وبيانات ترخيص المنظومة' },
      { id: 'technicalNotes', title: 'الملاحظات الفنية المحاسبية والرقابية', shortcut: '', description: 'الاطلاع على القواعد والتعليمات الفنية والمحاسبية' },
      { id: 'keyboardShortcuts', title: 'دليل اختصارات لوحة المفاتيح', shortcut: '', description: 'عرض قائمة الاختصارات السريعة (F2, F3, F4, F5, F6, F7, Ctrl+P)' },
    ],
  },
];

// Helper to generate a 5-action permission object
export const createFiveAction = (
  view: boolean,
  add: boolean,
  edit: boolean,
  deleteAct: boolean,
  print: boolean
): FiveActionPermission => ({
  view,
  add,
  edit,
  delete: deleteAct,
  print,
});

// Generate default module permissions based on Role
export const generateModulePermissionsForRole = (
  role: UserRole
): Record<string, Record<string, FiveActionPermission>> => {
  const result: Record<string, Record<string, FiveActionPermission>> = {};

  const isAdmin = role === 'مدير نظام';
  const isGeneralAccountant = role === 'محاسب عام';
  const isDataEntry = role === 'مدخل بيانات';
  const isAuditor = role === 'مراجع حسابات';

  SYSTEM_PERMISSION_SECTIONS.forEach((section) => {
    result[section.id] = {};
    section.subItems.forEach((item) => {
      if (isAdmin) {
        // Admin has full permissions
        result[section.id][item.id] = createFiveAction(true, true, true, true, true);
      } else if (isGeneralAccountant) {
        // General Accountant:
        if (section.id === 'menu_file') {
          const isReset = item.id === 'resetData';
          result[section.id][item.id] = createFiveAction(!isReset, !isReset, !isReset, !isReset, true);
        } else if (section.id === 'menu_accounts') {
          const isDelete = item.id === 'deleteAccount';
          result[section.id][item.id] = createFiveAction(true, true, true, !isDelete, true);
        } else if (section.id === 'menu_reports') {
          result[section.id][item.id] = createFiveAction(true, true, true, false, true);
        } else if (section.id === 'menu_system') {
          const isLogs = item.id === 'userActivityLogs';
          result[section.id][item.id] = createFiveAction(isLogs, false, false, false, isLogs);
        } else if (section.id === 'menu_help') {
          result[section.id][item.id] = createFiveAction(true, false, false, false, true);
        }
      } else if (isDataEntry) {
        // Data Entry:
        if (section.id === 'menu_file') {
          const canAdd = item.id === 'addTransaction' || item.id === 'addAccount';
          result[section.id][item.id] = createFiveAction(true, canAdd, false, false, true);
        } else if (section.id === 'menu_accounts') {
          const canAdd = item.id === 'defineParty';
          result[section.id][item.id] = createFiveAction(true, canAdd, false, false, true);
        } else if (section.id === 'menu_reports') {
          result[section.id][item.id] = createFiveAction(true, false, false, false, true);
        } else if (section.id === 'menu_system') {
          result[section.id][item.id] = createFiveAction(false, false, false, false, false);
        } else if (section.id === 'menu_help') {
          result[section.id][item.id] = createFiveAction(true, false, false, false, false);
        }
      } else if (isAuditor) {
        // Auditor: Read and print only
        if (section.id === 'menu_system') {
          const isLogs = item.id === 'userActivityLogs';
          result[section.id][item.id] = createFiveAction(isLogs, false, false, false, isLogs);
        } else {
          result[section.id][item.id] = createFiveAction(true, false, false, false, true);
        }
      }
    });
  });

  return result;
};

// Generate complete UserPermissions for a Role
export const getFullPermissionsForRole = (role: UserRole): UserPermissions => {
  const isAdmin = role === 'مدير نظام';
  const isGeneralAccountant = role === 'محاسب عام';
  const isDataEntry = role === 'مدخل بيانات';
  const isAuditor = role === 'مراجع حسابات';

  const modules = generateModulePermissionsForRole(role);

  return {
    transaction: {
      view: true,
      add: isAdmin || isGeneralAccountant || isDataEntry,
      edit: isAdmin || isGeneralAccountant,
      delete: isAdmin || isGeneralAccountant,
      print: true,
    },
    account: {
      view: true,
      add: isAdmin || isGeneralAccountant || isDataEntry,
      edit: isAdmin || isGeneralAccountant,
      delete: isAdmin,
    },
    userManagement: {
      view: isAdmin || isAuditor,
      add: isAdmin,
      edit: isAdmin,
      delete: isAdmin,
    },
    activityLog: {
      view: true,
      export: isAdmin || isGeneralAccountant || isAuditor,
    },
    modules,
    special: {
      skipManagerApproval: isAdmin,
      exceedCreditLimit: isAdmin || isGeneralAccountant,
      editPostedEntries: isAdmin,
      modifyOpeningBalances: isAdmin,
      fullDataExport: isAdmin || isAuditor,
      systemResetPermission: isAdmin,
    },
  };
};

// Ensure that an existing or newly loaded user has the full modules dictionary matching actual system menus
export const ensureFullUserPermissions = (permissions: UserPermissions, role: UserRole): UserPermissions => {
  const defaultPermissions = getFullPermissionsForRole(role);

  const mergedModules: Record<string, Record<string, FiveActionPermission>> = {};

  SYSTEM_PERMISSION_SECTIONS.forEach((section) => {
    mergedModules[section.id] = {};
    section.subItems.forEach((subItem) => {
      // Check if existing permissions has this subItem in the section
      const existingSub = permissions.modules?.[section.id]?.[subItem.id];
      if (existingSub) {
        mergedModules[section.id][subItem.id] = {
          view: Boolean(existingSub.view),
          add: Boolean(existingSub.add),
          edit: Boolean(existingSub.edit),
          delete: Boolean(existingSub.delete),
          print: Boolean(existingSub.print),
        };
      } else {
        // Fallback to role default
        mergedModules[section.id][subItem.id] =
          defaultPermissions.modules?.[section.id]?.[subItem.id] ||
          createFiveAction(false, false, false, false, false);
      }
    });
  });

  return {
    ...permissions,
    modules: mergedModules,
    special: {
      ...defaultPermissions.special,
      ...permissions.special,
    },
  };
};
