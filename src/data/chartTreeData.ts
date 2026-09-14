import { Account } from '../types';

export interface MainAccountNode {
  code: string;
  name: string;
  category: 'أصول' | 'خصوم' | 'حقوق ملكية' | 'إيرادات' | 'مصروفات';
  type: 'عملاء' | 'موردين' | 'صندوق / بنك' | 'مصروفات' | 'إيرادات' | 'أصول' | 'خصوم';
  closing: 'الميزانية العمومية' | 'قائمة الدخل';
  description?: string;
}

export const STANDARD_CHART_TREE: MainAccountNode[] = [
  // 1. الأصول
  {
    code: '11',
    name: 'النقدية والأصول المتداولة (خزائن وبنوك)',
    category: 'أصول',
    type: 'صندوق / بنك',
    closing: 'الميزانية العمومية',
    description: 'الخزينة النقدية الرئيسية والعهد والحسابات البنكية',
  },
  {
    code: '12',
    name: 'العملاء والمدينون (الذمم المدينة)',
    category: 'أصول',
    type: 'عملاء',
    closing: 'الميزانية العمومية',
    description: 'حسابات العملاء التجاريين والمدينين وأوراق القبض',
  },
  {
    code: '13',
    name: 'المخزون وبضاعة المستودعات',
    category: 'أصول',
    type: 'أصول',
    closing: 'الميزانية العمومية',
    description: 'بضاعة أول وآخر المدة ومخازن المواد والخامات',
  },
  {
    code: '14',
    name: 'الأصول الثابتة والمعدات',
    category: 'أصول',
    type: 'أصول',
    closing: 'الميزانية العمومية',
    description: 'الأجهزة والمعدات والسيارات والأصول الرأسمالية',
  },

  // 2. الخصوم والالتزامات
  {
    code: '21',
    name: 'الموردون والدائنون (الذمم الدائنة)',
    category: 'خصوم',
    type: 'موردين',
    closing: 'الميزانية العمومية',
    description: 'حسابات الموردين والشركات الموردة وأوراق الدفع',
  },
  {
    code: '22',
    name: 'الالتزامات المتداولة والمستحقات',
    category: 'خصوم',
    type: 'خصوم',
    closing: 'الميزانية العمومية',
    description: 'المصروفات المستحقة والقروض قصيرة الأجل',
  },

  // 3. حقوق الملكية
  {
    code: '31',
    name: 'رأس المال وحقوق الملكية',
    category: 'حقوق ملكية',
    type: 'خصوم',
    closing: 'الميزانية العمومية',
    description: 'رأس المال المدفوع والاحتياطيات النظامية',
  },
  {
    code: '32',
    name: 'الأرباح المحتجزة والمرحلة',
    category: 'حقوق ملكية',
    type: 'خصوم',
    closing: 'الميزانية العمومية',
    description: 'أرباح وخسائر السنوات السابقة والأرباح غير الموزعة',
  },
  {
    code: '33',
    name: 'جاري الشركاء والمالك',
    category: 'حقوق ملكية',
    type: 'خصوم',
    closing: 'الميزانية العمومية',
    description: 'مسحوبات وإيداعات الشركاء والمالك',
  },

  // 4. الإيرادات
  {
    code: '41',
    name: 'إيرادات النشاط والمبيعات',
    category: 'إيرادات',
    type: 'إيرادات',
    closing: 'قائمة الدخل',
    description: 'إيرادات مبيعات البضائع والخدمات الأساسية للمنشأة',
  },
  {
    code: '42',
    name: 'إيرادات متنوعة وأخرى',
    category: 'إيرادات',
    type: 'إيرادات',
    closing: 'قائمة الدخل',
    description: 'عوائد استثمارات وأرباح رأسمالية وإيرادات غير تشغيلية',
  },

  // 5. المصروفات
  {
    code: '51',
    name: 'المصروفات التشغيلية والعمومية',
    category: 'مصروفات',
    type: 'مصروفات',
    closing: 'قائمة الدخل',
    description: 'الرواتب والأجور والإيجارات والكهرباء ومصاريف الإدارة',
  },
  {
    code: '52',
    name: 'تكلفة النشاط والمشتريات',
    category: 'مصروفات',
    type: 'مصروفات',
    closing: 'قائمة الدخل',
    description: 'تكلفة البضاعة المباعة ومشتريات ومصروفات مباشرة',
  },
  {
    code: '53',
    name: 'المصروفات التسويقية والبيعية',
    category: 'مصروفات',
    type: 'مصروفات',
    closing: 'قائمة الدخل',
    description: 'مصاريف الدعاية والإعلان والترويج ونقل المبيعات',
  },
];

/**
 * توليد رمز الحساب التلقائي المسلسل بناءً على رمز الحساب الرئيسي
 * إذا كان رمز الحساب الرئيسي مثلاً 12 (العملاء)، يتولد: 120101، 120102، ...
 * يقرأ أعلى كود مستخدم حالياً لمنع التكرار والحفاظ على التسلسل
 */
export function generateCodeFromMainAccount(
  mainCode: string,
  existingAccounts: Account[],
  customSubCategory: string = '01'
): string {
  const cleanMain = (mainCode || '12').trim();
  const branchPrefix = `${cleanMain}${customSubCategory}`;

  // ابحث عن كل الأكواد الحالية التي تبدأ بهذا الفرع
  const matchingSuffixes: number[] = [];

  for (const acc of existingAccounts) {
    if (!acc.code) continue;
    const codeStr = String(acc.code).trim();
    if (codeStr.startsWith(branchPrefix)) {
      const suffix = codeStr.substring(branchPrefix.length);
      const parsed = parseInt(suffix, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        matchingSuffixes.push(parsed);
      }
    } else if (codeStr.startsWith(cleanMain) && codeStr.length > cleanMain.length) {
      // قد يكون كود مباشر مثل 12001
      const rest = codeStr.substring(cleanMain.length);
      const parsed = parseInt(rest, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        matchingSuffixes.push(parsed % 100);
      }
    }
  }

  const maxSeq = matchingSuffixes.length > 0 ? Math.max(...matchingSuffixes) : 0;
  const nextSeq = maxSeq + 1;
  const formattedSeq = nextSeq.toString().padStart(2, '0');

  return `${branchPrefix}${formattedSeq}`;
}
