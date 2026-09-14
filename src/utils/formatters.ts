import { Transaction, UserActivityLog } from '../types';

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0.00 ج.م';
  const isNegative = amount < 0;
  const absFormatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-${absFormatted} ج.م` : `${absFormatted} ج.م`;
}

export function formatNumber(amount: number): string {
  if (amount === 0) return '-';
  return amount.toLocaleString('en-US');
}

/**
 * Formats a date string (YYYY-MM-DD) into DD/MM/YYYY
 * where the month is strictly in the middle (e.g., 03/09/2026).
 */
export function formatDateDMY(dateStr: any): string {
  if (dateStr === null || dateStr === undefined) return '';
  const str = String(dateStr).trim();
  if (!str) return '';
  // If already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;

  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      const [year, month, dayWithTime] = parts;
      const day = (dayWithTime || '').trim().split(' ')[0].split('T')[0];
      const cleanDay = (day || '01').padStart(2, '0').slice(-2);
      const cleanMonth = (month || '01').padStart(2, '0').slice(-2);
      const cleanYear = (year || '2026').slice(0, 4);
      return `${cleanDay}/${cleanMonth}/${cleanYear}`;
    }
  }

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const [p1, p2, p3] = parts;
      if (p3 && p3.length === 4) {
        return `${(p1 || '01').padStart(2, '0').slice(-2)}/${(p2 || '01').padStart(2, '0').slice(-2)}/${p3}`;
      }
    }
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
    // ignore
  }

  return str;
}

/**
 * Converts DD/MM/YYYY to YYYY-MM-DD for standard database/state storage
 */
export function parseDMYToISO(dmyStr: any): string {
  if (!dmyStr) return '';
  const str = String(dmyStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${(year || '2026').slice(0, 4)}-${(month || '01').padStart(2, '0').slice(-2)}-${(day || '01').padStart(2, '0').slice(-2)}`;
    }
  }
  return str;
}

/**
 * Generates transaction description automatically without user intervention
 * e.g. "قبض من مكتب ميلانو" or "صرف إلى مكتب النور"
 */
export function formatAutoDescription(type: string | undefined, accountName: string | undefined): string {
  const cleanName = accountName ? accountName.trim() : '';
  const cleanType = type || 'قبض';

  if (!cleanName) {
    if (cleanType === 'قبض') return 'قبض من ';
    if (cleanType === 'دفع' || cleanType === 'صرف') return 'دفع إلى ';
    return `${cleanType}`;
  }

  if (cleanType === 'قبض') {
    return `قبض من ${cleanName}`;
  }
  if (cleanType === 'دفع' || cleanType === 'صرف') {
    return `دفع إلى ${cleanName}`;
  }
  return `${cleanType} - ${cleanName}`;
}

/**
 * Converts a number to Arabic words in Egyptian Pounds (Tafqeet)
 * Supports up to billions and fractions (piasters / قروش)
 */
export function tafqeetArabic(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return 'صفر جنيه مصري';
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const pounds = Math.floor(absAmount);
  const piasters = Math.round((absAmount - pounds) * 100);

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  
  function convertGroup(n: number): string {
    if (n === 0) return '';
    let result = '';
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;
    
    if (h > 0) {
      result += hundreds[h];
    }
    
    if (remainder > 0) {
      if (result) result += ' و';
      if (remainder < 10) {
        result += ones[remainder];
      } else if (remainder >= 10 && remainder < 20) {
        result += teens[remainder - 10];
      } else {
        if (o > 0) {
          result += ones[o] + ' و' + tens[t];
        } else {
          result += tens[t];
        }
      }
    }
    return result;
  }

  function convertFullNumber(num: number): string {
    if (num === 0) return '';

    const billions = Math.floor(num / 1_000_000_000);
    const millions = Math.floor((num % 1_000_000_000) / 1_000_000);
    const thousands = Math.floor((num % 1_000_000) / 1000);
    const remainder = num % 1000;

    const parts: string[] = [];

    // مليارات
    if (billions > 0) {
      if (billions === 1) parts.push('مليار');
      else if (billions === 2) parts.push('ملياران');
      else if (billions >= 3 && billions <= 10) parts.push(convertGroup(billions) + ' مليارات');
      else parts.push(convertGroup(billions) + ' مليار');
    }

    // ملايين
    if (millions > 0) {
      if (millions === 1) parts.push('مليون');
      else if (millions === 2) parts.push('مليونان');
      else if (millions >= 3 && millions <= 10) parts.push(convertGroup(millions) + ' ملايين');
      else parts.push(convertGroup(millions) + ' مليون');
    }

    // آلاف
    if (thousands > 0) {
      if (thousands === 1) parts.push('ألف');
      else if (thousands === 2) parts.push('ألفان');
      else if (thousands >= 3 && thousands <= 10) parts.push(convertGroup(thousands) + ' آلاف');
      else parts.push(convertGroup(thousands) + ' ألف');
    }

    // الباقي (0-999)
    if (remainder > 0) {
      parts.push(convertGroup(remainder));
    }

    return parts.join(' و');
  }

  let result = '';

  if (pounds > 0) {
    const poundsText = convertFullNumber(pounds);
    if (pounds === 1) {
      result = 'جنيه مصري واحد';
    } else if (pounds === 2) {
      result = 'جنيهان مصريان';
    } else if (pounds >= 3 && pounds <= 10) {
      result = `${poundsText} جنيهات مصرية`;
    } else {
      result = `${poundsText} جنيه مصري`;
    }
  }

  if (piasters > 0) {
    const piastersText = convertGroup(piasters);
    let piastersStr = '';
    if (piasters === 1) {
      piastersStr = 'قرش واحد';
    } else if (piasters === 2) {
      piastersStr = 'قرشان';
    } else if (piasters >= 3 && piasters <= 10) {
      piastersStr = `${piastersText} قروش`;
    } else {
      piastersStr = `${piastersText} قرشاً`;
    }

    if (result) {
      result += ` و${piastersStr}`;
    } else {
      result = piastersStr;
    }
  }

  if (!result) {
    return 'صفر جنيه مصري';
  }

  const prefix = isNegative ? 'سالب ' : 'فقط ';
  return `${prefix}${result} لا غير`;
}

export function format12HourTime(input?: Date | string): string {
  if (!input) {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${minutes} ${period}`;
  }

  if (typeof input === 'string') {
    const str = input.trim();
    // If it already has ص or م
    if (str.includes('ص') || str.includes('م') || /am|pm/i.test(str)) {
      return str;
    }
    // If it's a 24-hour time like "14:35" or "14:35:10"
    const match = str.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2];
      const period = h >= 12 ? 'م' : 'ص';
      h = h % 12 || 12;
      return `${String(h).padStart(2, '0')}:${m} ${period}`;
    }
    const parsedDate = new Date(str);
    if (!isNaN(parsedDate.getTime())) {
      let hours = parsedDate.getHours();
      const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
      const period = hours >= 12 ? 'م' : 'ص';
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
    }
    return str;
  }

  if (input instanceof Date && !isNaN(input.getTime())) {
    let hours = input.getHours();
    const minutes = String(input.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
  }

  return '12:00 م';
}

export function exportToCSV(transactions: Transaction[], filename = 'Daily_Account_Statement_2026-09-02.csv') {
  try {
    const headers = [
      'مسلسل',
      'التاريخ',
      'المقبوضات',
      'مدفوعات',
      'البيان',
      'رصيد الحركة',
      'نوع الحركة',
      'اسم الحساب',
      'الحساب الرئيسي',
      'الحساب الختامي',
      'منشئ الحركة',
      'آخر تاريخ تعديل',
    ];

    const safeStr = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = transactions.map((t) => [
      t.id,
      formatDateDMY(t.date),
      t.receipt || 0,
      t.payment === 0 ? '-' : (t.payment || 0),
      safeStr(t.description),
      t.movementBalance || 0,
      t.type || '',
      safeStr(t.accountName),
      safeStr(t.mainAccount),
      safeStr(t.closingAccount),
      safeStr(t.createdBy),
      safeStr(t.lastModified),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Failed to export CSV:', err);
  }
}

export function exportActivityLogsToCSV(logs: UserActivityLog[], filename = 'سجل_نشاط_المستخدمين.csv') {
  try {
    const headers = [
      'مسلسل',
      'التاريخ',
      'الوقت',
      'اسم المستخدم',
      'الحركة',
      'النافذة',
      'رقم الحركة',
      'قبل',
      'بعد',
    ];

    const safeStr = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = logs.map((log) => [
      log.sequence,
      formatDateDMY(log.date),
      safeStr(log.time),
      safeStr(log.username),
      safeStr(log.action),
      safeStr(log.window),
      safeStr(log.recordId),
      safeStr(log.beforeValue),
      safeStr(log.afterValue),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Failed to export Activity Logs CSV:', err);
  }
}

