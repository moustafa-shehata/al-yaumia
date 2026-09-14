import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Plus,
  Trash2,
  Clipboard,
  Building2,
  Phone,
  Hash,
  Eye,
  ArrowRight,
  SlidersHorizontal,
  Check,
  RefreshCw,
  FolderTree,
} from 'lucide-react';
import { Account } from '../types';
import { STANDARD_CHART_TREE, generateCodeFromMainAccount, MainAccountNode } from '../data/chartTreeData';
import { formatCurrency } from '../utils/formatters';

interface ImportAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAccounts: (importedAccounts: Account[], mode: 'merge' | 'replace') => void;
  existingAccounts: Account[];
  onOpenAccountCard?: (account: Account) => void;
}

export interface ImportGridRow {
  id: string;
  code: string; // رمز الحساب
  name: string; // اسم الحساب
  mainAccount: string; // اسم الحساب الرئيسي
  mainAccountCode: string; // رمز الحساب الرئيسي
  type: string; // نوع الحساب
  phone: string; // رقم الهاتف
  closingAccount: string; // اسم الحساب الختامي
  openingBalance: number; // الرصيد الافتتاحي
  notes: string; // ملاحظات
}

type ColumnFieldType =
  | 'name'
  | 'code'
  | 'mainAccount'
  | 'mainAccountCode'
  | 'type'
  | 'phone'
  | 'closingAccount'
  | 'openingBalance'
  | 'notes'
  | 'ignore';

interface ColumnOption {
  value: ColumnFieldType;
  label: string;
  required?: boolean;
}

const AVAILABLE_COLUMN_OPTIONS: ColumnOption[] = [
  { value: 'name', label: '📌 اسم الحساب المالي (إلزامي)', required: true },
  { value: 'code', label: '🔢 رمز الحساب (إن لم يوجد يولد تلقائياً)' },
  { value: 'mainAccount', label: '🏢 اسم الحساب الرئيسي' },
  { value: 'mainAccountCode', label: '🏷️ رمز الحساب الرئيسي' },
  { value: 'type', label: '📂 نوع الحساب (عملاء/موردين/بنك...)' },
  { value: 'phone', label: '📞 رقم الهاتف / التواصل' },
  { value: 'closingAccount', label: '📊 اسم الحساب الختامي' },
  { value: 'openingBalance', label: '💰 الرصيد الافتتاحي' },
  { value: 'notes', label: '📝 ملاحظات الحساب' },
  { value: 'ignore', label: '🚫 [تجاهل هذا العمود]' },
];

const SAMPLE_CSV_EXPORT = `رمز الحساب,اسم الحساب,اسم الحساب الرئيسي,رمز الحساب الرئيسي,نوع الحساب,رقم الهاتف,اسم الحساب الختامي,الرصيد الافتتاحي
110101,الخزينة المركزية الرئيسية,النقدية والأصول المتداولة (خزائن وبنوك),11,صندوق / بنك,01000000001,الميزانية العمومية,50000
110201,البنك الأهلي المصري - جاري,النقدية والأصول المتداولة (خزائن وبنوك),11,صندوق / بنك,19623,الميزانية العمومية,120000
120101,شركة الأمل للمقاولات العامة,العملاء والمدينون (الذمم المدينة),12,عملاء,01011223344,الميزانية العمومية,25000
120102,مؤسسة النور للتوريدات,العملاء والمدينون (الذمم المدينة),12,عملاء,01122334455,الميزانية العمومية,14000
210101,الشركة الدولية للأجهزة,الموردون والدائنون (الذمم الدائنة),21,موردين,01099887766,الميزانية العمومية,-35000
210102,مصنع الأهرام للمواد الخام,الموردون والدائنون (الذمم الدائنة),21,موردين,01234567890,الميزانية العمومية,-18000
510101,مصروفات الرواتب والأجور,المصروفات التشغيلية والعمومية,51,مصروفات,,قائمة الدخل,0
510102,مصروفات إيجار المقر,المصروفات التشغيلية والعمومية,51,مصروفات,,قائمة الدخل,0
410101,إيرادات مبيعات النشاط,إيرادات النشاط والمبيعات,41,إيرادات,,قائمة الدخل,0`;

export const ImportAccountsModal: React.FC<ImportAccountsModalProps> = ({
  isOpen,
  onClose,
  onImportAccounts,
  existingAccounts = [],
  onOpenAccountCard,
}) => {
  // Navigation tabs / view state: 'grid' (the multi-column editor) or 'mapping-wizard'
  const [activeView, setActiveView] = useState<'grid' | 'mapping-wizard'>('grid');

  // Raw pasted text in wizard
  const [rawText, setRawText] = useState<string>('');
  const [hasHeaderRow, setHasHeaderRow] = useState<boolean>(false);
  const [columnMappings, setColumnMappings] = useState<ColumnFieldType[]>([]);

  // Default fallback settings when imported data has no code or main account
  const [defaultMainAccountCode, setDefaultMainAccountCode] = useState<string>('12');
  const [autoGenerateCodes, setAutoGenerateCodes] = useState<boolean>(true);

  // Strategy & status
  const [importStrategy, setImportStrategy] = useState<'merge' | 'replace'>('merge');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Grid Rows (default demo rows)
  const [gridRows, setGridRows] = useState<ImportGridRow[]>([
    {
      id: 'row-1',
      code: '120101',
      name: 'شركة الأمل للمقاولات العامة',
      mainAccount: 'العملاء والمدينون (الذمم المدينة)',
      mainAccountCode: '12',
      type: 'عملاء',
      phone: '01011223344',
      closingAccount: 'الميزانية العمومية',
      openingBalance: 15000,
      notes: '',
    },
    {
      id: 'row-2',
      code: '120102',
      name: 'مؤسسة النور للتوريدات والتجارة',
      mainAccount: 'العملاء والمدينون (الذمم المدينة)',
      mainAccountCode: '12',
      type: 'عملاء',
      phone: '01122334455',
      closingAccount: 'الميزانية العمومية',
      openingBalance: 8500,
      notes: '',
    },
    {
      id: 'row-3',
      code: '210101',
      name: 'الشركة الدولية للمواد الخام والمهمات',
      mainAccount: 'الموردون والدائنون (الذمم الدائنة)',
      mainAccountCode: '21',
      type: 'موردين',
      phone: '01099887766',
      closingAccount: 'الميزانية العمومية',
      openingBalance: -25000,
      notes: '',
    },
  ]);

  // Selected default main account node
  const selectedDefaultMainNode = useMemo(() => {
    return (
      STANDARD_CHART_TREE.find((m) => m.code === defaultMainAccountCode) ||
      STANDARD_CHART_TREE.find((m) => m.code === '12') ||
      STANDARD_CHART_TREE[0]
    );
  }, [defaultMainAccountCode]);

  // Split raw pasted lines and cells
  const parsedRawData = useMemo(() => {
    if (!rawText.trim()) return { lines: [], maxCols: 0 };

    const rawLines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (rawLines.length === 0) return { lines: [], maxCols: 0 };

    const firstLine = rawLines[0];
    let delimiter = '\t';
    if (!firstLine.includes('\t')) {
      if (firstLine.includes(',')) delimiter = ',';
      else if (firstLine.includes(';')) delimiter = ';';
      else if (firstLine.includes('|')) delimiter = '|';
    }

    const splitCells = (line: string): string[] => {
      return line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    };

    const lines = rawLines.map(splitCells);
    const maxCols = Math.max(...lines.map((l) => l.length), 0);

    return { lines, maxCols };
  }, [rawText]);

  // Automatically adjust columnMappings array length when raw text columns change
  React.useEffect(() => {
    const cols = parsedRawData.maxCols;
    if (cols === 0) return;

    setColumnMappings((prev) => {
      // If already matching length and has sensible values, keep
      if (prev.length === cols) return prev;

      // Detect smart mapping from header or position
      const firstRow = parsedRawData.lines[0] || [];
      const newMappings: ColumnFieldType[] = [];

      for (let colIdx = 0; colIdx < cols; colIdx++) {
        const headerCell = (firstRow[colIdx] || '').toLowerCase();

        // 1. Header name detection
        if (headerCell.includes('رمز الحساب الرئيسي') || headerCell.includes('كود الرئيسي') || headerCell.includes('main code')) {
          newMappings.push('mainAccountCode');
        } else if (headerCell.includes('اسم الحساب الرئيسي') || headerCell.includes('الحساب الرئيسي') || headerCell.includes('main account')) {
          newMappings.push('mainAccount');
        } else if (headerCell.includes('ختامي') || headerCell.includes('closing')) {
          newMappings.push('closingAccount');
        } else if (headerCell.includes('كود') || headerCell.includes('رمز') || headerCell.includes('code')) {
          newMappings.push('code');
        } else if (headerCell.includes('اسم') || headerCell.includes('name') || headerCell.includes('عميل') || headerCell.includes('مورد')) {
          newMappings.push('name');
        } else if (headerCell.includes('هاتف') || headerCell.includes('تليفون') || headerCell.includes('phone') || headerCell.includes('موبايل')) {
          newMappings.push('phone');
        } else if (headerCell.includes('نوع') || headerCell.includes('type')) {
          newMappings.push('type');
        } else if (headerCell.includes('رصيد') || headerCell.includes('افتتاحي') || headerCell.includes('balance')) {
          newMappings.push('openingBalance');
        } else if (headerCell.includes('ملاحظ') || headerCell.includes('note')) {
          newMappings.push('notes');
        } else {
          // 2. Intelligent positional fallback (NEVER assume col 0 is code! Col 0 is overwhelmingly account name in customer/vendor lists)
          if (cols === 1) {
            newMappings.push('name');
          } else if (cols === 2) {
            // [Name, Phone] or [Name, Balance]
            if (colIdx === 0) newMappings.push('name');
            else {
              const sampleCell = (parsedRawData.lines[1]?.[colIdx] || parsedRawData.lines[0]?.[colIdx] || '').trim();
              if (sampleCell.length >= 8 && /^\+?[0-9\s-]+$/.test(sampleCell)) newMappings.push('phone');
              else if (!isNaN(Number(sampleCell.replace(/,/g, '')))) newMappings.push('openingBalance');
              else newMappings.push('phone');
            }
          } else if (cols === 3) {
            // Typical [Name, Phone, Balance]
            if (colIdx === 0) newMappings.push('name');
            else if (colIdx === 1) newMappings.push('phone');
            else newMappings.push('openingBalance');
          } else if (cols === 4) {
            // [Code, Name, Phone, Balance] or [Name, MainAccount, Phone, Balance]
            if (colIdx === 0) newMappings.push('code');
            else if (colIdx === 1) newMappings.push('name');
            else if (colIdx === 2) newMappings.push('phone');
            else newMappings.push('openingBalance');
          } else {
            // 8 standard columns: [Code, Name, MainAccount, MainCode, Type, Phone, Closing, Balance]
            const standardCols: ColumnFieldType[] = [
              'code',
              'name',
              'mainAccount',
              'mainAccountCode',
              'type',
              'phone',
              'closingAccount',
              'openingBalance',
            ];
            newMappings.push(standardCols[colIdx] || 'ignore');
          }
        }
      }

      return newMappings;
    });
  }, [parsedRawData]);

  if (!isOpen) return null;

  // Add empty row in table
  const handleAddRow = () => {
    const def = selectedDefaultMainNode;
    const newRow: ImportGridRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code: '',
      name: '',
      mainAccount: def.name,
      mainAccountCode: def.code,
      type: def.type,
      phone: '',
      closingAccount: def.closing,
      openingBalance: 0,
      notes: '',
    };
    setGridRows((prev) => [...prev, newRow]);
  };

  // Delete row from table
  const handleDeleteRow = (id: string) => {
    setGridRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Update cell in table
  const handleUpdateRow = (id: string, field: keyof ImportGridRow, value: any) => {
    setGridRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };

        // Auto sync when mainAccount changes
        if (field === 'mainAccount') {
          const match = STANDARD_CHART_TREE.find((m) => m.name === value || m.code === value);
          if (match) {
            updated.mainAccount = match.name;
            updated.mainAccountCode = match.code;
            updated.type = match.type;
            updated.closingAccount = match.closing;
          }
        }
        return updated;
      })
    );
  };

  // Auto-generate sequential codes for all rows based on their mainAccountCode
  const handleAutoSequenceAll = () => {
    // Build accounts pool initialized with existing accounts to prevent duplicates
    const simulatedPool: Account[] = [...existingAccounts];

    const updatedRows = gridRows.map((row) => {
      const mainCode = row.mainAccountCode || defaultMainAccountCode || '12';
      const generated = generateCodeFromMainAccount(mainCode, simulatedPool);

      // Register generated code into simulatedPool so subsequent rows get sequential codes
      simulatedPool.push({
        id: row.id,
        name: row.name || 'حساب',
        code: generated,
        type: row.type,
        mainAccount: row.mainAccount,
        mainAccountCode: mainCode,
        closingAccount: row.closingAccount,
        openingBalance: row.openingBalance,
        createdAt: '2026-09-02',
      });

      return { ...row, code: generated };
    });

    setGridRows(updatedRows);
    setStatusMessage({
      type: 'success',
      text: `تم توليد وترقيم الأكواد تلقائياً وبشكل مسلسل لجميع السطور (${updatedRows.length} حساب) بناءً على شجرة الحسابات دون تكرار`,
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Process the user's custom column mapping into the table
  const handleApplyColumnMapping = () => {
    if (!parsedRawData.lines || parsedRawData.lines.length === 0) {
      setStatusMessage({ type: 'error', text: 'لا توجد بيانات صالحة للمعالجة.' });
      return;
    }

    // Verify that 'name' column is mapped
    const nameColIdx = columnMappings.indexOf('name');
    if (nameColIdx === -1) {
      setStatusMessage({
        type: 'error',
        text: 'يرجى تحديد أي عمود يمثل "اسم الحساب المالي" (حقل إلزامي للاستيراد).',
      });
      return;
    }

    const startIndex = hasHeaderRow ? 1 : 0;
    const newRows: ImportGridRow[] = [];
    const simulatedPool: Account[] = [...existingAccounts];

    for (let i = startIndex; i < parsedRawData.lines.length; i++) {
      const cells = parsedRawData.lines[i];
      if (!cells || cells.length === 0) continue;

      // Extract values based on mapping
      let extracted: Partial<ImportGridRow> = {};

      columnMappings.forEach((mappingField, colIdx) => {
        const val = cells[colIdx] ? cells[colIdx].trim() : '';
        if (mappingField !== 'ignore') {
          if (mappingField === 'openingBalance') {
            const num = parseFloat(val.replace(/,/g, '')) || 0;
            extracted.openingBalance = num;
          } else {
            extracted[mappingField] = val;
          }
        }
      });

      const name = (extracted.name || '').trim();
      if (!name) continue;

      // Main account logic
      let mainAccount = (extracted.mainAccount || '').trim();
      let mainAccountCode = (extracted.mainAccountCode || '').trim();

      if (!mainAccount && !mainAccountCode) {
        mainAccount = selectedDefaultMainNode.name;
        mainAccountCode = selectedDefaultMainNode.code;
      } else if (mainAccount && !mainAccountCode) {
        const match = STANDARD_CHART_TREE.find((m) => m.name === mainAccount);
        mainAccountCode = match ? match.code : defaultMainAccountCode;
      } else if (!mainAccount && mainAccountCode) {
        const match = STANDARD_CHART_TREE.find((m) => m.code === mainAccountCode);
        mainAccount = match ? match.name : selectedDefaultMainNode.name;
      }

      // Account type logic
      let type = (extracted.type || '').trim();
      if (!type) {
        const match = STANDARD_CHART_TREE.find((m) => m.code === mainAccountCode);
        type = match ? match.type : selectedDefaultMainNode.type;
      }

      // Closing account logic
      let closingAccount = (extracted.closingAccount || '').trim();
      if (!closingAccount) {
        const match = STANDARD_CHART_TREE.find((m) => m.code === mainAccountCode);
        closingAccount = match ? match.closing : selectedDefaultMainNode.closing;
      }

      // Code logic: either from extracted or auto-generated from mainAccountCode
      let code = (extracted.code || '').trim();
      if (!code && autoGenerateCodes) {
        code = generateCodeFromMainAccount(mainAccountCode, simulatedPool);
        simulatedPool.push({
          id: `tmp-${i}`,
          name,
          code,
          type,
          mainAccount,
          mainAccountCode,
          closingAccount,
          openingBalance: extracted.openingBalance || 0,
          createdAt: '2026-09-02',
        });
      }

      newRows.push({
        id: `row-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        code,
        name,
        mainAccount,
        mainAccountCode,
        type,
        phone: extracted.phone || '',
        closingAccount,
        openingBalance: extracted.openingBalance || 0,
        notes: extracted.notes || '',
      });
    }

    if (newRows.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'لم يتم العثور على أسطر تحتوي على أسماء حسابات صالحة في البيانات المدخلة.',
      });
      return;
    }

    setGridRows(newRows);
    setActiveView('grid');
    setStatusMessage({
      type: 'success',
      text: `تم توزيع البيانات بنجاح في الأعمدة المحددة وتوليد الأكواد لـ (${newRows.length}) حساب`,
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Load demo chart
  const handleLoadDemo = () => {
    const demo: ImportGridRow[] = [
      { id: 'd1', code: '110101', name: 'الخزينة المركزية الرئيسية', mainAccount: 'النقدية والأصول المتداولة (خزائن وبنوك)', mainAccountCode: '11', type: 'صندوق / بنك', phone: '01000000001', closingAccount: 'الميزانية العمومية', openingBalance: 50000, notes: '' },
      { id: 'd2', code: '110201', name: 'البنك الأهلي المصري - جاري', mainAccount: 'النقدية والأصول المتداولة (خزائن وبنوك)', mainAccountCode: '11', type: 'صندوق / بنك', phone: '19623', closingAccount: 'الميزانية العمومية', openingBalance: 120000, notes: '' },
      { id: 'd3', code: '120101', name: 'شركة الأمل للمقاولات العامة', mainAccount: 'العملاء والمدينون (الذمم المدينة)', mainAccountCode: '12', type: 'عملاء', phone: '01011223344', closingAccount: 'الميزانية العمومية', openingBalance: 25000, notes: '' },
      { id: 'd4', code: '120102', name: 'مؤسسة النور للتوريدات', mainAccount: 'العملاء والمدينون (الذمم المدينة)', mainAccountCode: '12', type: 'عملاء', phone: '01122334455', closingAccount: 'الميزانية العمومية', openingBalance: 14000, notes: '' },
      { id: 'd5', code: '210101', name: 'الشركة الدولية للأجهزة', mainAccount: 'الموردون والدائنون (الذمم الدائنة)', mainAccountCode: '21', type: 'موردين', phone: '01099887766', closingAccount: 'الميزانية العمومية', openingBalance: -35000, notes: '' },
      { id: 'd6', code: '210102', name: 'مصنع الأهرام للمواد الخام', mainAccount: 'الموردون والدائنون (الذمم الدائنة)', mainAccountCode: '21', type: 'موردين', phone: '01234567890', closingAccount: 'الميزانية العمومية', openingBalance: -18000, notes: '' },
      { id: 'd7', code: '510101', name: 'مصروفات الرواتب والأجور الشهرية', mainAccount: 'المصروفات التشغيلية والعمومية', mainAccountCode: '51', type: 'مصروفات', phone: '', closingAccount: 'قائمة الدخل', openingBalance: 0, notes: '' },
      { id: 'd8', code: '510102', name: 'مصروفات إيجار المقرات والمعارض', mainAccount: 'المصروفات التشغيلية والعمومية', mainAccountCode: '51', type: 'مصروفات', phone: '', closingAccount: 'قائمة الدخل', openingBalance: 0, notes: '' },
      { id: 'd9', code: '410101', name: 'إيرادات المبيعات والخدمات', mainAccount: 'إيرادات النشاط والمبيعات', mainAccountCode: '41', type: 'إيرادات', phone: '', closingAccount: 'قائمة الدخل', openingBalance: 0, notes: '' },
    ];
    setGridRows(demo);
    setStatusMessage({
      type: 'info',
      text: 'تم تحميل نموذج دليل حسابات قياسي جاهز مع الأكواد المسلسلة المعتمدة',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Download template CSV file
  const handleDownloadTemplate = () => {
    const blob = new Blob(['\uFEFF' + SAMPLE_CSV_EXPORT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'نموذج_أعمدة_دليل_الحسابات.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      setActiveView('mapping-wizard');
    };
    reader.readAsText(file, 'UTF-8');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save / Apply Import to System
  const handleApplyImport = () => {
    const validRows = gridRows.filter((r) => r.name.trim().length > 0);
    if (validRows.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'يرجى إدخال اسم الحساب لسطر واحد على الأقل في الجدول قبل الاستيراد.',
      });
      return;
    }

    // Map to full Account objects
    const importedAccounts: Account[] = validRows.map((r, idx) => ({
      id: `acc-imp-${Date.now()}-${idx}`,
      code: r.code.trim() || generateCodeFromMainAccount(r.mainAccountCode || '12', existingAccounts),
      name: r.name.trim(),
      mainAccount: r.mainAccount || selectedDefaultMainNode.name,
      mainAccountCode: r.mainAccountCode || selectedDefaultMainNode.code,
      type: r.type || selectedDefaultMainNode.type,
      phone: r.phone.trim() || undefined,
      closingAccount: r.closingAccount || selectedDefaultMainNode.closing,
      openingBalance: Number(r.openingBalance) || 0,
      notes: r.notes.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0],
    }));

    onImportAccounts(importedAccounts, importStrategy);
    onClose();
  };

  // Open Preview Account Card for a specific row
  const handlePreviewCard = (row: ImportGridRow) => {
    if (!onOpenAccountCard) return;
    const previewAccount: Account = {
      id: row.id,
      code: row.code,
      name: row.name || 'حساب بدون اسم',
      mainAccount: row.mainAccount,
      mainAccountCode: row.mainAccountCode,
      type: row.type,
      phone: row.phone,
      closingAccount: row.closingAccount,
      openingBalance: Number(row.openingBalance) || 0,
      notes: row.notes,
      createdAt: '2026-09-02',
    };
    onOpenAccountCard(previewAccount);
  };

  return (
    <div
      id="import-accounts-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        id="import-accounts-modal-container"
        className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
      >
        {/* ========================================================
            HEADER
           ======================================================== */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  استيراد وتخصيص دليل الحسابات
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold">
                  تحديد الأعمدة والترقيم المسلسل
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                تحديد تخصيص كل عمود، والتوليد التلقائي لرموز الحسابات المشتقة من شجرة الحسابات الرئيسية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveView('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'grid'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                جدول الحسابات ({gridRows.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveView('mapping-wizard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeView === 'mapping-wizard'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>لصق وتعيين الأعمدة</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {statusMessage && (
          <div
            className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
              {statusMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-600" />}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================
            VIEW 1: MAPPING WIZARD (تحديد وتخصيص الأعمدة المنسوخة)
           ======================================================== */}
        {activeView === 'mapping-wizard' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/70">
            {/* 1. Paste & Upload Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clipboard className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-800">
                    الخطوة 1: الصق بياناتك من الإكسيل أو ارفع ملف CSV
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv,.txt,.tsv"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع ملف CSV / TXT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRawText(`شركة الأمل للمقاولات\t01011223344\t25000\nمؤسسة النور للتوريدات\t01122334455\t14000\nشركة الشرق الهندسية\t01223344556\t19500`);
                    }}
                    className="px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-semibold cursor-pointer"
                  >
                    تجربة لصق أسماء وهواتف فقط
                  </button>
                </div>
              </div>

              <textarea
                rows={4}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="الصق النصوص أو خلايا الإكسيل هنا مباشرة (Ctrl + V)... مثال:&#10;شركة الأمل للمقاولات    01011223344    25000&#10;مؤسسة النور للتوريدات    01122334455    14000"
                className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 leading-relaxed"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasHeaderRow}
                    onChange={(e) => setHasHeaderRow(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-700">
                    الصف الأول يحتوي على أسماء وعناوين الأعمدة (تخطي الصف الأول)
                  </span>
                </label>

                {parsedRawData.maxCols > 0 && (
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    تم اكتشاف: {parsedRawData.lines.length} صفوف × {parsedRawData.maxCols} أعمدة
                  </span>
                )}
              </div>
            </div>

            {/* 2. Interactive Column Field Assignment (تحديد ماهية كل عمود) */}
            {parsedRawData.maxCols > 0 ? (
              <div className="bg-white border border-blue-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-800">
                      الخطوة 2: حدد النصوص المدخلة تخص أي عمود
                    </h4>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">
                    يمكنك تعيين أي عمود ليمثل اسم الحساب أو الهاتف أو الرصيد أو تجاهله
                  </span>
                </div>

                {/* Column Dropdowns Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  {Array.from({ length: parsedRawData.maxCols }).map((_, colIdx) => {
                    const currentMapping = columnMappings[colIdx] || 'ignore';
                    const sampleVal =
                      parsedRawData.lines[hasHeaderRow ? 1 : 0]?.[colIdx] || 'قيمة فارغة';

                    return (
                      <div
                        key={colIdx}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px]">
                              {colIdx + 1}
                            </span>
                            العمود رقم ({colIdx + 1})
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={sampleVal}>
                            عينة: {sampleVal}
                          </span>
                        </div>

                        <select
                          value={currentMapping}
                          onChange={(e) => {
                            const val = e.target.value as ColumnFieldType;
                            setColumnMappings((prev) => {
                              const updated = [...prev];
                              updated[colIdx] = val;
                              return updated;
                            });
                          }}
                          className={`w-full p-2 text-xs font-bold rounded-lg border focus:outline-none focus:ring-2 cursor-pointer ${
                            currentMapping === 'name'
                              ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 focus:ring-emerald-500'
                              : currentMapping === 'ignore'
                              ? 'border-slate-300 bg-slate-50 text-slate-500 focus:ring-slate-400'
                              : 'border-blue-300 bg-white text-blue-900 focus:ring-blue-500'
                          }`}
                        >
                          {AVAILABLE_COLUMN_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* 3. Defaults & Automatic Sequential Code Generation Settings */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <FolderTree className="w-4 h-4 text-slate-600" />
                    <span>الخيارات الافتراضية لشجرة الحسابات والترقيم المسلسل:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Default Main Account selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        الحساب الرئيسي الافتراضي (للحسابات التي ليس لها حساب رئيسي محدد):
                      </label>
                      <select
                        value={defaultMainAccountCode}
                        onChange={(e) => setDefaultMainAccountCode(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                      >
                        {STANDARD_CHART_TREE.map((node) => (
                          <option key={node.code} value={node.code}>
                            {node.code} - {node.name} ({node.closing})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Auto sequential numbering toggle */}
                    <div className="flex flex-col justify-center space-y-1">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoGenerateCodes}
                          onChange={(e) => setAutoGenerateCodes(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span className="font-bold text-blue-900 text-xs">
                          توليد رمز الحساب تلقائياً مسلسل مشتق من رمز الحساب الرئيسي
                        </span>
                      </label>
                      <p className="text-[11px] text-slate-500 pr-6">
                        يبدأ التوليد مثلاً من كود ({selectedDefaultMainNode.code}0101) ويكمل تلقائياً بعد أعلى كود مسجل في دليلك الحالي دون تكرار أو مساس بالمدخلات السابقة.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Live Sample Table Preview */}
                <div>
                  <h5 className="text-xs font-bold text-slate-700 mb-2">
                    معاينة حية لتوزيع البيانات (أول 3 صفوف):
                  </h5>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="py-2 px-2.5 w-10 text-center">#</th>
                          {columnMappings.map((m, idx) => {
                            const opt = AVAILABLE_COLUMN_OPTIONS.find((o) => o.value === m);
                            return (
                              <th key={idx} className="py-2 px-3 border-r border-slate-200">
                                <span className={m === 'name' ? 'text-emerald-700' : m === 'ignore' ? 'text-slate-400' : 'text-blue-700'}>
                                  {opt?.label.replace(/📌|🔢|🏢|🏷️|📂|📞|📊|💰|📝|🚫/g, '').trim()}
                                </span>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRawData.lines.slice(hasHeaderRow ? 1 : 0, (hasHeaderRow ? 1 : 0) + 3).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 text-center text-slate-400 font-mono text-[11px]">
                              {rIdx + 1}
                            </td>
                            {columnMappings.map((m, cIdx) => (
                              <td
                                key={cIdx}
                                className={`py-2 px-3 border-r border-slate-100 truncate max-w-[180px] ${
                                  m === 'ignore' ? 'text-slate-300 line-through' : 'text-slate-800'
                                }`}
                              >
                                {row[cIdx] || (m === 'code' && autoGenerateCodes ? (
                                  <span className="text-[10px] text-emerald-600 font-mono font-bold bg-emerald-50 px-1 py-0.5 rounded">
                                    [يولد تلقائياً]
                                  </span>
                                ) : (
                                  '-'
                                ))}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveView('grid')}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl"
                  >
                    إلغاء والعودة للجدول
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyColumnMapping}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>تطبيق وتعبئة جدول الحسابات المالي</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-2xl">
                <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700 mb-1">
                  في انتظار لصق أو إدخال البيانات أعلاه
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  بمجرد لصق النصوص من الإكسيل، سيظهر لك شريط التحكم لتحديد أي عمود هو اسم الحساب، رقم الهاتف، الرصيد، إلخ.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================
              VIEW 2: THE MULTI-COLUMN INTERACTIVE TABLE GRID
              عمود لكل نقطة: رمز الحساب، اسم الحساب، الحساب الرئيسي، 
              رمز الحساب الرئيسي، نوع الحساب، رقم الهاتف، الحساب الختامي
             ======================================================== */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Action Bar Above Table */}
            <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="h-8 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة سطر حساب</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoSequenceAll}
                  className="h-8 px-3 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="توليد الأكواد المسلسلة تلقائياً لجميع الحسابات من شجرة الحسابات الرئيسية"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>توليد الأكواد المسلسلة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('mapping-wizard')}
                  className="h-8 px-3 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="فتح نافذة اللصق وتحديد ماهية الأعمدة"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>لصق جديد / تعيين الأعمدة</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="h-8 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="تحميل ملف إكسيل نموذجي بالأعمدة الثمانية"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">تحميل نموذج CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="h-8 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="تحميل دليل استرشادي جاهز"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>دليل تجريبي</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGridRows([])}
                  className="h-8 px-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="مسح كافة أسطر الجدول الحالية"
                >
                  <span>مسح الجدول</span>
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6 min-h-[260px]">
              {gridRows.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Building2 className="w-8 h-8 text-slate-400 mb-1.5" />
                  <h4 className="font-bold text-slate-800 text-sm mb-1">جدول الحسابات فارغ حالياً</h4>
                  <p className="text-xs text-slate-500 max-w-sm mb-3">
                    يمكنك لصق بياناتك من الإكسيل وتحديد أعمدتها، أو الضغط على "إضافة سطر حساب" لإدخال الحسابات يدوياً.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveView('mapping-wizard')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>لصق وتعيين الأعمدة</span>
                    </button>
                    <button
                      onClick={handleLoadDemo}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      تحميل دليل تجريبي
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-2xs bg-white">
                  <table className="w-full text-right text-xs border-collapse min-w-[950px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                        <th className="py-2.5 px-2 text-center w-10 border-l border-slate-200">#</th>

                        {/* 1. عمود رمز الحساب */}
                        <th className="py-2.5 px-3 border-l border-slate-200 w-36">
                          <div className="flex items-center justify-between">
                            <span>رمز الحساب</span>
                            <span className="text-[10px] text-blue-600 font-normal">مسلسل</span>
                          </div>
                        </th>

                        {/* 2. عمود اسم الحساب */}
                        <th className="py-2.5 px-3 border-l border-slate-200 min-w-[180px]">
                          <span>اسم الحساب المالي</span>
                          <span className="text-rose-500 mr-1">*</span>
                        </th>

                        {/* 3. عمود اسم الحساب الرئيسي */}
                        <th className="py-2.5 px-3 border-l border-slate-200 w-44">
                          <span>اسم الحساب الرئيسي</span>
                        </th>

                        {/* 4. عمود رمز الحساب الرئيسي */}
                        <th className="py-2.5 px-2.5 border-l border-slate-200 w-24 text-center">
                          <span>رمز الرئيسي</span>
                        </th>

                        {/* 5. عمود نوع الحساب */}
                        <th className="py-2.5 px-3 border-l border-slate-200 w-28">
                          <span>نوع الحساب</span>
                        </th>

                        {/* 6. عمود رقم الهاتف */}
                        <th className="py-2.5 px-3 border-l border-slate-200 w-32">
                          <span>رقم الهاتف</span>
                        </th>

                        {/* 7. عمود اسم الحساب الختامي */}
                        <th className="py-2.5 px-3 border-l border-slate-200 w-36">
                          <span>اسم الحساب الختامي</span>
                        </th>

                        {/* 8. الرصيد الافتتاحي */}
                        <th className="py-2.5 px-3 border-l border-slate-200 w-28 text-left">
                          <span>الرصيد الافتتاحي</span>
                        </th>

                        {/* 9. الإجراءات والبطاقة */}
                        <th className="py-2.5 px-2 text-center w-20">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {gridRows.map((row, idx) => {
                        const isNameEmpty = !row.name.trim();
                        return (
                          <tr
                            key={row.id}
                            className={`hover:bg-blue-50/30 transition-colors ${
                              isNameEmpty ? 'bg-rose-50/30' : ''
                            }`}
                          >
                            <td className="py-1.5 px-2 text-center text-slate-400 font-mono text-[11px] border-l border-slate-200">
                              {idx + 1}
                            </td>

                            {/* 1. رمز الحساب */}
                            <td className="py-1.5 px-2 border-l border-slate-200">
                              <div className="relative flex items-center">
                                <input
                                  type="text"
                                  dir="ltr"
                                  value={row.code}
                                  onChange={(e) => handleUpdateRow(row.id, 'code', e.target.value)}
                                  placeholder="120101"
                                  className="w-full pr-2 pl-6 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextCode = generateCodeFromMainAccount(
                                      row.mainAccountCode || '12',
                                      existingAccounts
                                    );
                                    handleUpdateRow(row.id, 'code', nextCode);
                                  }}
                                  className="absolute left-1.5 text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer"
                                  title="توليد كود تلقائي مسلسل لهذا السطر"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* 2. اسم الحساب */}
                            <td className="py-1.5 px-2 border-l border-slate-200">
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => handleUpdateRow(row.id, 'name', e.target.value)}
                                placeholder="اسم الحساب المالي..."
                                className={`w-full px-2.5 py-1 bg-white border rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 ${
                                  isNameEmpty
                                    ? 'border-rose-400 focus:ring-rose-500'
                                    : 'border-slate-300 focus:ring-blue-500'
                                }`}
                              />
                            </td>

                            {/* 3. اسم الحساب الرئيسي */}
                            <td className="py-1.5 px-2 border-l border-slate-200">
                              <select
                                value={row.mainAccount}
                                onChange={(e) => handleUpdateRow(row.id, 'mainAccount', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                              >
                                {STANDARD_CHART_TREE.map((m) => (
                                  <option key={m.code} value={m.name}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* 4. رمز الحساب الرئيسي */}
                            <td className="py-1.5 px-2 border-l border-slate-200">
                              <input
                                type="text"
                                dir="ltr"
                                value={row.mainAccountCode}
                                onChange={(e) => handleUpdateRow(row.id, 'mainAccountCode', e.target.value)}
                                placeholder="12"
                                className="w-full px-1.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-700 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>

                            {/* 5. نوع الحساب */}
                            <td className="py-1.5 px-2 border-l border-slate-200">
                              <select
                                value={row.type}
                                onChange={(e) => handleUpdateRow(row.id, 'type', e.target.value)}
                                className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                              >
                                <option value="عملاء">عملاء</option>
                                <option value="موردين">موردين</option>
                                <option value="صندوق / بنك">صندوق / بنك</option>
                                <option value="مصروفات">مصروفات</option>
                                <option value="إيرادات">إيرادات</option>
                                <option value="أصول">أصول أخرى</option>
                                <option value="خصوم">خصوم</option>
                              </select>
                            </td>

                            {/* 6. رقم الهاتف */}
                            <td className="py-1.5 px-2 border-l border-slate-200">
                              <input
                                type="tel"
                                dir="ltr"
                                value={row.phone}
                                onChange={(e) => handleUpdateRow(row.id, 'phone', e.target.value)}
                                placeholder="01012345678"
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>

                            {/* 7. اسم الحساب الختامي */}
                            <td className="py-1.5 px-2 border-l border-slate-200">
                              <select
                                value={row.closingAccount}
                                onChange={(e) => handleUpdateRow(row.id, 'closingAccount', e.target.value)}
                                className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                              >
                                <option value="الميزانية العمومية">الميزانية العمومية</option>
                                <option value="قائمة الدخل">قائمة الدخل</option>
                                <option value="أرباح وخسائر">أرباح وخسائر</option>
                                <option value="المتاجرة">المتاجرة</option>
                              </select>
                            </td>

                            {/* 8. الرصيد الافتتاحي */}
                            <td className="py-1.5 px-2 border-l border-slate-200">
                              <input
                                type="number"
                                step="0.01"
                                value={row.openingBalance}
                                onChange={(e) =>
                                  handleUpdateRow(row.id, 'openingBalance', parseFloat(e.target.value) || 0)
                                }
                                placeholder="0"
                                className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 text-left focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>

                            {/* 9. الإجراءات: حذف السطر ومعاينة بطاقة الحساب */}
                            <td className="py-1.5 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {onOpenAccountCard && (
                                  <button
                                    type="button"
                                    onClick={() => handlePreviewCard(row)}
                                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                    title="معاينة بطاقة هذا الحساب"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(row.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  title="حذف هذا السطر"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL FOOTER
           ======================================================== */}
        <div className="px-4 py-3 sm:px-6 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Strategy Selection */}
          <div className="flex items-center gap-4 text-xs">
            <span className="font-bold text-slate-700">طريقة التطبيق في الدليل:</span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="import-strategy"
                checked={importStrategy === 'merge'}
                onChange={() => setImportStrategy('merge')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-800 font-medium">
                دمج وتحديث الدليل الحالي (يحافظ على مدخلاتك السابقة)
              </span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="import-strategy"
                checked={importStrategy === 'replace'}
                onChange={() => setImportStrategy('replace')}
                className="text-rose-600 focus:ring-rose-500"
              />
              <span className="text-rose-700 font-medium">استبدال كامل الدليل</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleApplyImport}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                اعتماد واستيراد ({gridRows.filter((r) => r.name.trim()).length}) حساب للدليل
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
