import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { DesktopMenuBar } from './components/DesktopMenuBar';
import { QuickActionBar } from './components/QuickActionBar';
import { DesktopStatusBar } from './components/DesktopStatusBar';
import { TransactionsTable } from './components/TransactionsTable';
import { TransactionModal } from './components/TransactionModal';
import { AddAccountModal } from './components/AddAccountModal';
import { AccountStatementView } from './components/AccountStatementView';
import { UserActivityLogModal } from './components/UserActivityLogModal';
import { UserManagementModal } from './components/UserManagementModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { PrintReportView } from './components/PrintReportView';
import { StatementSheetModal } from './components/StatementSheetModal';
import { MonthlyCashFlowChart } from './components/MonthlyCashFlowChart';
import { ChartOfAccountsModal } from './components/ChartOfAccountsModal';
import { ImportAccountsModal } from './components/ImportAccountsModal';
import { AccountCardModal } from './components/AccountCardModal';
import { LoginScreen } from './components/LoginScreen';
import { PermissionModalAlert, PermissionNotice } from './components/PermissionModalAlert';
import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_ACCOUNTS, 
  INITIAL_USERS,
  INITIAL_ACTIVITY_LOGS,
  REPORT_META 
} from './data/initialData';
import { 
  Transaction, 
  AuditLogEntry, 
  Account, 
  ActiveAppTab, 
  AppUser, 
  UserActivityLog, 
  UserActionType, 
  ActivityWindowType 
} from './types';
import { exportToCSV, format12HourTime, formatCurrency } from './utils/formatters';
import { CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import { useFirebase } from './context/FirebaseContext';
import {
  saveTransactionToFirestore,
  deleteTransactionFromFirestore,
  saveAccountToFirestore,
  deleteAccountFromFirestore,
  saveActivityLogToFirestore,
  subscribeToTransactions,
  subscribeToAccounts,
  subscribeToActivityLogs,
  subscribeToUsers,
  saveUserToFirestore,
  deleteUserFromFirestore,
  seedInitialFirestoreData,
} from './services/firestoreService';

const STORAGE_KEYS = {
  TRANSACTIONS: 'acuora_daily_account_transactions_v2',
  AUDIT_LOGS: 'acuora_daily_account_audit_logs_v2',
  ACCOUNTS: 'acuora_daily_account_accounts_v2',
  USERS: 'acuora_daily_account_users_v3',
  ACTIVITY_LOGS: 'acuora_daily_account_activity_logs_v3',
  ACTIVE_USER_ID: 'acuora_daily_account_active_user_id_v3',
};

// Helper function to guarantee data integrity between amount fields and movement type
export const normalizeTransaction = (tx: Transaction): Transaction => {
  const pay = Number(tx.payment) || 0;
  const rec = Number(tx.receipt) || 0;
  let effType = tx.type;
  if (pay > 0 && rec === 0) {
    effType = 'دفع';
  } else if (rec > 0 && pay === 0) {
    effType = 'قبض';
  }
  return {
    ...tx,
    receipt: rec,
    payment: pay,
    type: effType || 'قبض',
    movementBalance: effType === 'دفع' ? Math.abs(pay) : -Math.abs(rec),
  };
};

export default function App() {
  const { firebaseUser, isFirestoreConnected } = useFirebase();

  // Navigation tab state (Separating Daily Movements from Account Statements)
  const [activeTab, setActiveTab] = useState<ActiveAppTab>('daily_movement');

  // Initialize transactions state (adhering strictly to chronological date and serial ordering)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeTransaction).sort((a, b) => {
            const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
            if (dateDiff !== 0) return dateDiff;
            return a.id - b.id;
          });
        }
      }
    } catch {
      // ignore
    }
    return [...INITIAL_TRANSACTIONS].map(normalizeTransaction).sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.id - b.id;
    });
  });

  // Initialize accounts state
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_ACCOUNTS;
  });

  // Initialize users state
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_USERS;
  });

  // Current active user
  const [currentActiveUser, setCurrentActiveUser] = useState<AppUser>(() => {
    try {
      const savedUserId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
      if (savedUserId && Array.isArray(users)) {
        const found = users.find((u) => u && u.id === savedUserId);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return (users && users[0]) || INITIAL_USERS[0];
  });

  // Active session status (Login Screen vs Main Desktop Dashboard)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const savedLogin = localStorage.getItem('ACUORA_IS_LOGGED_IN');
      return savedLogin === 'true';
    } catch {
      return false;
    }
  });

  // Central User Activity Logs state
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number): UserActivityLog => ({
            id: item?.id ? String(item.id) : `act-init-${idx + 1}`,
            sequence: typeof item?.sequence === 'number' ? item.sequence : idx + 1,
            date: item?.date ? String(item.date) : '2026-09-02',
            time: item?.time ? String(item.time) : '12:00 م',
            username: item?.username ? String(item.username) : (item?.author ? String(item.author) : 'moustafa.acuora.soft.egypt'),
            action: (item?.action || (item?.actionType === 'إنشاء' ? 'إضافة' : item?.actionType) || 'إضافة') as UserActionType,
            window: (item?.window || 'إضافة حركة') as ActivityWindowType,
            recordId: item?.recordId != null ? String(item.recordId) : (item?.transactionId != null ? String(item.transactionId) : String(idx + 1)),
            beforeValue: item?.beforeValue != null ? String(item.beforeValue) : (item?.oldValue != null ? String(item.oldValue) : 'لا يوجد'),
            afterValue: item?.afterValue != null ? String(item.afterValue) : (item?.newValue != null ? String(item.newValue) : (item?.rawAuditText ? String(item.rawAuditText) : 'تم توثيق الإجراء')),
          }));
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_ACTIVITY_LOGS;
  });

  // Legacy audit logs state kept for compatibility
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isChartOfAccountsModalOpen, setIsChartOfAccountsModalOpen] = useState(false);
  const [isImportAccountsModalOpen, setIsImportAccountsModalOpen] = useState(false);
  const [isAccountCardModalOpen, setIsAccountCardModalOpen] = useState(false);
  const [accountCardTargetId, setAccountCardTargetId] = useState<string | undefined>(undefined);
  const [accountCardTargetName, setAccountCardTargetName] = useState<string | undefined>(undefined);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [defaultTxAccountName, setDefaultTxAccountName] = useState<string | undefined>(undefined);
  const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementAccountName, setStatementAccountName] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [highlightedTxId, setHighlightedTxId] = useState<number | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [permissionNotice, setPermissionNotice] = useState<PermissionNotice | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch {
      // ignore
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch {
      // ignore
    }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, currentActiveUser.id);
    } catch {
      // ignore
    }
  }, [currentActiveUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));
    } catch {
      // ignore
    }
  }, [activityLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
    } catch {
      // ignore
    }
  }, [auditLogs]);

  // Real-time synchronization with Firebase Firestore collections (onSnapshot live listener)
  useEffect(() => {
    let isSubscribed = true;

    // 1. Live subscription to Firestore 'transactions' collection using onSnapshot
    const unsubTx = subscribeToTransactions(
      (cloudTx) => {
        if (!isSubscribed) return;
        if (cloudTx && cloudTx.length > 0) {
          setTransactions(cloudTx.map(normalizeTransaction));
        } else {
          // If the Firestore collection is empty on first run, seed existing data into Firestore
          seedInitialFirestoreData(transactions, accounts, activityLogs);
        }
      },
      (err) => console.warn('[Firestore] Transactions onSnapshot status:', err)
    );

    // 2. Live subscription to Firestore 'accounts' collection
    const unsubAcc = subscribeToAccounts(
      (cloudAcc) => {
        if (!isSubscribed) return;
        if (cloudAcc && cloudAcc.length > 0) {
          setAccounts(cloudAcc);
        }
      },
      (err) => console.warn('[Firestore] Accounts onSnapshot status:', err)
    );

    // 3. Live subscription to Firestore 'activity_logs' collection
    const unsubLogs = subscribeToActivityLogs(
      (cloudLogs) => {
        if (!isSubscribed) return;
        if (cloudLogs && cloudLogs.length > 0) {
          setActivityLogs(cloudLogs);
        }
      },
      (err) => console.warn('[Firestore] Activity logs onSnapshot status:', err)
    );

    // 4. Live subscription to Firestore 'users' collection
    const unsubUsers = subscribeToUsers(
      (cloudUsers) => {
        if (!isSubscribed) return;
        if (cloudUsers && cloudUsers.length > 0) {
          setUsers(cloudUsers);
          // Keep current active user in sync with updated permissions/credentials from Firestore
          setCurrentActiveUser((prev) => {
            const matched = cloudUsers.find((u) => u.id === prev.id);
            return matched || prev;
          });
        } else {
          // If Firestore users collection is empty, seed initial users
          seedInitialFirestoreData(transactions, accounts, activityLogs, users);
        }
      },
      (err) => console.warn('[Firestore] Users onSnapshot status:', err)
    );

    return () => {
      isSubscribed = false;
      unsubTx();
      unsubAcc();
      unsubLogs();
      unsubUsers();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Trigger prominent centered modal alert for permission denial
  const triggerPermissionNotice = (
    actionName: string,
    targetResource: string,
    requiredRoleOrPerm?: string,
    details?: string
  ) => {
    setPermissionNotice({
      actionName,
      targetResource,
      requiredRoleOrPerm: requiredRoleOrPerm || 'صلاحية وصول معتمدة',
      userFullName: currentActiveUser.fullName,
      userRole: currentActiveUser.role,
      details: details || `تم رفض الإجراء تلقائياً لعدم توفر الصلاحية الكافية لحساب المستخدم "${currentActiveUser.fullName}" في مصفوفة الصلاحيات المعتمدة للمنظومة.`
    });
  };

  // Central User Activity Logger
  const logUserActivity = (
    action: UserActionType,
    window: ActivityWindowType,
    recordId: string | number,
    beforeValue: string,
    afterValue: string,
    customUsername?: string
  ) => {
    const nextSeq = Array.isArray(activityLogs) && activityLogs.length > 0
      ? Math.max(...activityLogs.map((l) => (typeof l?.sequence === 'number' ? l.sequence : 0))) + 1
      : 1;
    const newLog: UserActivityLog = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sequence: nextSeq,
      date: '2026-09-02',
      time: format12HourTime(),
      username: customUsername || (currentActiveUser && currentActiveUser.username) || REPORT_META.defaultCreator,
      action,
      window,
      recordId,
      beforeValue: beforeValue != null ? String(beforeValue) : 'لا يوجد',
      afterValue: afterValue != null ? String(afterValue) : 'تم توثيق الإجراء',
    };
    setActivityLogs((prev) => [newLog, ...(Array.isArray(prev) ? prev : [])]);
    saveActivityLogToFirestore(newLog).catch((err) =>
      console.warn('[Firestore] Failed saving activity log to Firestore:', err)
    );
    return newLog;
  };

  // Next available ID
  const nextId = transactions.length > 0 ? Math.max(...transactions.map((t) => t.id)) + 1 : 1;

  // Save Transaction (Add or Edit) with strict chronological and serial ordering
  const handleSaveTransaction = (savedTx: Transaction, isNew: boolean, changesLog?: string[]) => {
    // Ensure we are viewing the daily movements table where the new/edited transaction lives
    setActiveTab('daily_movement');
    const normalizedTx = normalizeTransaction(savedTx);

    if (isNew) {
      setTransactions((prev) => {
        const updated = [...prev, normalizedTx];
        return updated.sort((a, b) => {
          const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return a.id - b.id;
        });
      });

      // Save directly to Firestore collection 'transactions' via setDoc SDK
      saveTransactionToFirestore(normalizedTx).catch((err) =>
        console.warn('[Firestore] Failed saving transaction to Firestore:', err)
      );

      // If this account doesn't exist in registered accounts, auto-register it
      if (normalizedTx.accountName && !accounts.some((a) => a.name === normalizedTx.accountName)) {
        const newAcc: Account = {
          id: `acc-${Date.now()}`,
          name: normalizedTx.accountName,
          type: 'عملاء',
          mainAccount: normalizedTx.mainAccount || 'العملاء',
          closingAccount: normalizedTx.closingAccount || 'ميزانية',
          openingBalance: 0,
          createdAt: '2026-09-02',
        };
        setAccounts((prev) => [newAcc, ...prev]);
        saveAccountToFirestore(newAcc).catch((err) =>
          console.warn('[Firestore] Failed saving new account to Firestore:', err)
        );
      }

      // Add to User Activity Log
      logUserActivity(
        'إضافة',
        'إضافة حركة',
        normalizedTx.id,
        'لا يوجد (سجل جديد)',
        `${normalizedTx.accountName} | ${normalizedTx.type}: ${formatCurrency(normalizedTx.receipt || normalizedTx.payment)} | بيان: ${normalizedTx.description}`
      );

      // Legacy audit entry
      const creationLog: AuditLogEntry = {
        id: `audit-${Date.now()}`,
        transactionId: normalizedTx.id,
        updatedAt: '2026-09-02 16:30',
        author: currentActiveUser.username,
        rawAuditText: `${currentActiveUser.username}: إنشاء قيد جديد رقم (${normalizedTx.id}) لحساب [${normalizedTx.accountName}] بقيمة ${normalizedTx.receipt || normalizedTx.payment} ج.م`,
        actionType: 'إنشاء',
        field: 'قيد جديد',
        newValue: `${normalizedTx.accountName} - ${normalizedTx.type}`,
      };
      setAuditLogs((prev) => [creationLog, ...prev]);
      showToast(`تمت إضافة الحركة رقم (${normalizedTx.id}) بنجاح وإدراجها بدقة وفق تسلسل التاريخ والمسلسل`);

      // Close modal and highlight row in table instantly
      setIsModalOpen(false);
      setTransactionToEdit(null);
      setDefaultTxAccountName(undefined);
      setHighlightedTxId(normalizedTx.id);
      setTimeout(() => {
        const el = document.getElementById(`transaction-row-${normalizedTx.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      setTimeout(() => setHighlightedTxId(null), 4000);
    } else {
      const oldTx = transactions.find((t) => Number(t.id) === Number(normalizedTx.id));
      setTransactions((prev) => {
        const updated = prev.map((t) => (Number(t.id) === Number(normalizedTx.id) ? normalizedTx : t));
        return updated.sort((a, b) => {
          const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return Number(a.id) - Number(b.id);
        });
      });

      // Save updated transaction to Firestore collection 'transactions' via setDoc SDK
      saveTransactionToFirestore(normalizedTx).catch((err) =>
        console.warn('[Firestore] Failed updating transaction in Firestore:', err)
      );

      // Add to User Activity Log
      const beforeStr = oldTx
        ? `${oldTx.accountName} | ${oldTx.type}: ${formatCurrency(oldTx.receipt || oldTx.payment)} | بيان: ${oldTx.description}`
        : 'القيمة السابقة';
      const afterStr = `${normalizedTx.accountName} | ${normalizedTx.type}: ${formatCurrency(normalizedTx.receipt || normalizedTx.payment)} | بيان: ${normalizedTx.description}`;

      logUserActivity(
        'تعديل',
        'إضافة حركة',
        normalizedTx.id,
        changesLog && changesLog.length > 0 ? changesLog.join(' | ') : beforeStr,
        afterStr
      );

      // Legacy audit log entries
      if (changesLog && changesLog.length > 0) {
        const newLogs: AuditLogEntry[] = changesLog.map((change, idx) => ({
          id: `audit-${Date.now()}-${idx}`,
          transactionId: normalizedTx.id,
          updatedAt: '2026-09-02 16:35',
          author: currentActiveUser.username,
          rawAuditText: `${currentActiveUser.username}: ${change}`,
          actionType: 'تعديل',
        }));
        setAuditLogs((prev) => [...newLogs, ...prev]);
      }
      showToast(`تم حفظ تعديل الحركة رقم (${normalizedTx.id}) وتحديث الترتيب الزمني والتسلسلي فورياً`);

      // Close modal and highlight row in table
      setIsModalOpen(false);
      setTransactionToEdit(null);
      setDefaultTxAccountName(undefined);
      setHighlightedTxId(normalizedTx.id);
      setTimeout(() => {
        const el = document.getElementById(`transaction-row-${normalizedTx.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      setTimeout(() => setHighlightedTxId(null), 4000);
    }
  };

  // Re-sequence transactions chronologically according to date (1, 2, 3...)
  const handleResequenceTransactions = () => {
    if (transactions.length === 0) return;
    const confirmed = safeConfirm(
      'هل ترغب في إعادة ترقيم مسلسل جميع القيود بالتتابع (1، 2، 3...) وفقاً للترتيب الزمني للتاريخ؟\nسيتم تحديث المسلسل وسجلات التدقيق المالي تلقائياً.'
    );
    if (!confirmed) return;

    const sorted = [...transactions].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.id - b.id;
    });

    const idMap = new Map<number, number>();
    const resequenced = sorted.map((t, idx) => {
      const newId = idx + 1;
      idMap.set(t.id, newId);
      return { ...t, id: newId };
    });

    // Update audit logs
    setAuditLogs((prev) =>
      prev.map((log) => {
        if (log.transactionId && idMap.has(log.transactionId)) {
          return { ...log, transactionId: idMap.get(log.transactionId)! };
        }
        return log;
      })
    );

    setTransactions(resequenced);
    // Sync resequenced transactions to Firestore collection 'transactions'
    resequenced.forEach((t) => {
      saveTransactionToFirestore(t).catch((err) =>
        console.warn('[Firestore] Failed syncing resequenced transaction:', err)
      );
    });

    logUserActivity(
      'تعديل',
      'إضافة حركة',
      'الكل',
      `إجمالي القيود: ${transactions.length}`,
      'إعادة تسلسل القيود زمنياً بالتتابع 1..N'
    );

    showToast('تمت إعادة ترقيم مسلسل الحركات وترتيبها زمنياً بنجاح');
  };

  // Save New Account
  const handleSaveAccount = (newAccount: Account) => {
    setAccounts((prev) => [newAccount, ...prev]);
    // Save account to Firestore collection 'accounts'
    saveAccountToFirestore(newAccount).catch((err) =>
      console.warn('[Firestore] Failed saving account to Firestore:', err)
    );

    // Record in User Activity Log
    logUserActivity(
      'إضافة',
      'إضافة حساب',
      newAccount.id,
      'لا يوجد (حساب جديد)',
      `اسم: ${newAccount.name} | تصنيف: ${newAccount.type} | هاتف: ${newAccount.phone || 'غير مسجل'}`
    );

    showToast(`تمت إضافة الحساب "${newAccount.name}" بنجاح وتسجيل الإجراء في سجل النشاط`);
  };

  // Request Delete Transaction (Opens safe confirmation dialog)
  const handleRequestDeleteTransaction = (id: number) => {
    if (!checkPermission('transaction', 'delete')) {
      triggerPermissionNotice(
        'حذف القيد المالي',
        'دفتر اليومية',
        'صلاحية الحذف',
        'عفواً، حسابك الحالي لا يمتلك صلاحية حذف القيود المالية.'
      );
      return;
    }
    const tx = transactions.find((t) => t.id === id);
    if (tx) {
      setTxToDelete(tx);
    }
  };

  // Execute Confirmed Delete Transaction
  const handleConfirmDeleteTransaction = (id: number) => {
    const tx = transactions.find((t) => Number(t.id) === Number(id));
    if (!tx) return;

    setTransactions((prev) => prev.filter((t) => Number(t.id) !== Number(id)));
    // Delete from Firestore collection 'transactions' via deleteDoc SDK
    deleteTransactionFromFirestore(id).catch((err) =>
      console.warn('[Firestore] Failed deleting transaction from Firestore:', err)
    );

    // User Activity Log for deletion
    logUserActivity(
      'حذف',
      'إضافة حركة',
      id,
      `${tx.accountName} | ${tx.type}: ${formatCurrency(tx.receipt || tx.payment)} | بيان: ${tx.description}`,
      'تم حذف القيد المالي نهائياً'
    );

    // Legacy audit log for deletion
    const deletionLog: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      transactionId: id,
      updatedAt: '2026-09-02 16:40',
      author: currentActiveUser.username,
      rawAuditText: `${currentActiveUser.username}: حذف القيد رقم (${id}) الخاص بـ [${tx.accountName}]`,
      actionType: 'حذف',
      oldValue: `${tx.accountName} (${tx.receipt || tx.payment} ج.م)`,
      newValue: 'محذوف',
    };
    setAuditLogs((prev) => [deletionLog, ...prev]);
    showToast(`تم حذف الحركة رقم (${id}) بنجاح وتوثيق الحذف في سجل تدقيق ونشاط المستخدمين`);
    setTxToDelete(null);
  };

  // Print Voucher handler
  const handlePrintVoucher = (tx: Transaction) => {
    logUserActivity(
      'طباعة',
      'إضافة حركة',
      tx.id,
      'معاينة السند المالي',
      `طباعة سند ${tx.type} رسمي بقيمة ${formatCurrency(tx.receipt || tx.payment)} لحساب [${tx.accountName}]`
    );
  };

  // User Authentication & Session Handlers
  const handleLogin = (user: AppUser) => {
    const updatedUser: AppUser = {
      ...user,
      lastLogin: new Date().toLocaleString('ar-EG'),
    };
    setCurrentActiveUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setIsLoggedIn(true);
    try {
      localStorage.setItem('ACUORA_IS_LOGGED_IN', 'true');
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, user.id);
    } catch {
      // ignore
    }

    logUserActivity(
      'دخول',
      'تسجيل الدخول',
      user.id,
      'تسجيل دخول',
      `تسجيل دخول ناجح إلى النظام (${user.role})`,
      user.username
    );

    showToast(`مرحباً بك: ${user.fullName} (${user.role})`);
  };

  const handleLogout = () => {
    logUserActivity(
      'خروج',
      'تسجيل الدخول',
      currentActiveUser.id,
      'جلسة نشطة',
      'تسجيل خروج من النظام',
      currentActiveUser.username
    );
    setIsLoggedIn(false);
    try {
      localStorage.removeItem('ACUORA_IS_LOGGED_IN');
    } catch {
      // ignore
    }
    showToast('تم تسجيل الخروج بنجاح.');
  };

  // Permission validator according to active user's roles and permissions
  const checkPermission = (
    module: 'transaction' | 'account' | 'userManagement' | 'activityLog',
    action: 'view' | 'add' | 'edit' | 'delete' | 'print' | 'export'
  ): boolean => {
    if (currentActiveUser.role === 'مدير نظام') return true;
    const perms = currentActiveUser.permissions as any;
    if (perms?.[module]?.[action] === false) {
      return false;
    }
    return true;
  };

  // User Management Actions
  const handleAddUser = (newUser: AppUser) => {
    setUsers((prev) => [newUser, ...prev]);
    saveUserToFirestore(newUser).catch((err) =>
      console.warn('[Firestore] Failed saving user to Firestore:', err)
    );
    logUserActivity(
      'إضافة',
      'إدارة المستخدمين',
      newUser.id,
      'لا يوجد (مستخدم جديد)',
      `مستخدم: ${newUser.fullName} (${newUser.username}) | دور: ${newUser.role} | حالة: ${newUser.status}`
    );
    showToast(`تمت إضافة المستخدم "${newUser.fullName}" بنجاح`);
  };

  const handleUpdateUser = (updatedUser: AppUser, oldUser: AppUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    saveUserToFirestore(updatedUser).catch((err) =>
      console.warn('[Firestore] Failed updating user in Firestore:', err)
    );
    if (updatedUser.id === currentActiveUser.id) {
      setCurrentActiveUser(updatedUser);
    }
    logUserActivity(
      'تعديل',
      'إدارة المستخدمين',
      updatedUser.id,
      `دور: ${oldUser.role} | حالة: ${oldUser.status}`,
      `دور: ${updatedUser.role} | حالة: ${updatedUser.status}`
    );
    showToast(`تم تحديث بيانات المستخدم "${updatedUser.fullName}" بنجاح`);
  };

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteUserFromFirestore(userId).catch((err) =>
      console.warn('[Firestore] Failed deleting user from Firestore:', err)
    );
    logUserActivity(
      'حذف',
      'إدارة المستخدمين',
      userId,
      `مستخدم: ${targetUser.fullName} (${targetUser.username}) | دور: ${targetUser.role}`,
      'تم حذف حساب المستخدم'
    );
    showToast(`تم حذف حساب المستخدم "${targetUser.fullName}"`);
  };

  const handleSwitchActiveUser = (newUser: AppUser) => {
    const oldUsername = currentActiveUser.username;
    logUserActivity('خروج', 'إدارة المستخدمين', currentActiveUser.id, 'جلسة نشطة', 'تسجيل خروج من النظام', oldUsername);
    logUserActivity('دخول', 'إدارة المستخدمين', newUser.id, 'غير متصل', `تسجيل دخول ناجح للمنظومة (${newUser.role})`, newUser.username);
    setCurrentActiveUser(newUser);
    setIsLoggedIn(true);
    try {
      localStorage.setItem('ACUORA_IS_LOGGED_IN', 'true');
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, newUser.id);
    } catch {
      // ignore
    }
    showToast(`تم التبديل بنجاح إلى المستخدم: ${newUser.fullName} (${newUser.role})`);
  };

  // Edit Click Handler
  const handleEditClick = (transaction: Transaction) => {
    if (!checkPermission('transaction', 'edit')) {
      triggerPermissionNotice(
        'تعديل القيد المالي',
        'دفتر اليومية',
        'صلاحية التعديل',
        `عفواً، حسابك لا يملك صلاحية تعديل القيد رقم (${transaction.id}).`
      );
      return;
    }
    setTransactionToEdit(transaction);
    setDefaultTxAccountName(transaction.accountName);
    setIsModalOpen(true);
  };

  // Add Transaction Handler with Permission check
  const handleOpenAddTransaction = (defaultAccount?: string) => {
    if (!checkPermission('transaction', 'add')) {
      triggerPermissionNotice(
        'إضافة قيد مالي',
        'دفتر اليومية',
        'صلاحية الإضافة',
        'عفواً، حسابك الحالي لا يمتلك صلاحية إضافة قيود مالية جديدة.'
      );
      return;
    }
    setTransactionToEdit(null);
    setDefaultTxAccountName(defaultAccount);
    setIsModalOpen(true);
  };

  // Add Account Handler with Permission check
  const handleOpenAddAccount = () => {
    if (!checkPermission('account', 'add')) {
      triggerPermissionNotice(
        'إضافة حساب جديد',
        'دليل الحسابات',
        'صلاحية الحسابات',
        'عفواً، حسابك لا يمتلك صلاحية إنشاء حسابات مالية جديدة.'
      );
      return;
    }
    setIsAddAccountModalOpen(true);
  };

  // Open User Management with Permission check
  const handleOpenUserManagement = () => {
    if (!checkPermission('userManagement', 'view')) {
      triggerPermissionNotice(
        'إدارة المستخدمين',
        'إدارة النظام',
        'مدير نظام',
        'عفواً، إدارة المستخدمين وصلاحيات الدخول مقتصرة على مدير النظام فقط.'
      );
      return;
    }
    setIsUserManagementModalOpen(true);
  };

  // View User Activity Log for transaction handler
  const handleViewAudit = (txId: number) => {
    setIsActivityLogModalOpen(true);
  };

  // Open Statement Sheet Modal
  const handleOpenStatementSheet = (accountName?: string) => {
    // If explicitly clicked on an account, prefill it; otherwise leave empty and ready for selection
    const validAccount = accountName && accountName !== 'ALL' ? accountName : '';
    setStatementAccountName(validAccount);
    setIsStatementModalOpen(true);
  };

  // Handle Import Chart of Accounts
  const handleImportAccounts = (importedAccounts: Account[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setAccounts(importedAccounts);
    } else {
      // Merge: Update existing accounts with matched name or code, append new accounts
      setAccounts((prev) => {
        const merged = [...prev];
        importedAccounts.forEach((newAcc) => {
          const existingIdx = merged.findIndex(
            (a) =>
              a.name.trim().toLowerCase() === newAcc.name.trim().toLowerCase() ||
              (a.code && newAcc.code && a.code === newAcc.code)
          );
          if (existingIdx !== -1) {
            merged[existingIdx] = { ...merged[existingIdx], ...newAcc, id: merged[existingIdx].id };
          } else {
            merged.push(newAcc);
          }
        });
        return merged;
      });
    }

    // Log Activity
    logUserActivity(
      'إضافة',
      'إضافة حساب',
      `imp-${Date.now()}`,
      `دليل الحسابات السابق (${accounts.length} حساب)`,
      `استيراد (${importedAccounts.length}) حساب مالي ${
        mode === 'replace' ? 'واستبدال الدليل بالكامل' : 'ودمجها مع الدليل الحالي'
      }`
    );

    showToast(`تم استيراد (${importedAccounts.length}) حساب بنجاح إلى دليل الحسابات`);
  };

  // Account Card Handlers
  const handleOpenAccountCard = (accountOrName?: Account | string) => {
    if (accountOrName) {
      if (typeof accountOrName === 'string') {
        setAccountCardTargetName(accountOrName);
        setAccountCardTargetId(undefined);
      } else {
        setAccountCardTargetId(accountOrName.id);
        setAccountCardTargetName(accountOrName.name);
      }
    } else {
      setAccountCardTargetId(undefined);
      setAccountCardTargetName(undefined);
    }
    setIsAccountCardModalOpen(true);
  };

  const handleSaveAccountFromCard = (savedAccount: Account, isNew: boolean) => {
    if (firebaseUser) {
      saveAccountToFirestore(savedAccount).catch((err) =>
        console.warn('Failed saving account card to Firestore:', err)
      );
    }
    if (isNew) {
      setAccounts((prev) => [...prev, savedAccount]);
      logUserActivity(
        'إضافة',
        'إضافة حساب',
        savedAccount.id,
        '-',
        `بطاقة حساب جديدة: ${savedAccount.name} | كود: ${savedAccount.code || 'بدون'} | رئيسي: ${savedAccount.mainAccount || '-'}`
      );
      showToast(`تم إنشاء وحفظ بطاقة الحساب "${savedAccount.name}" بنجاح`);
    } else {
      setAccounts((prev) => prev.map((a) => (a.id === savedAccount.id ? savedAccount : a)));
      logUserActivity(
        'تعديل',
        'إضافة حساب',
        savedAccount.id,
        'بيانات سابقة',
        `تحديث بطاقة الحساب: ${savedAccount.name} | كود: ${savedAccount.code || 'بدون'}`
      );
      showToast(`تم تحديث بيانات بطاقة الحساب "${savedAccount.name}" بنجاح`);
    }
  };

  const handleDeleteAccountFromCard = (accountToDelete: Account) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountToDelete.id));
    if (firebaseUser) {
      deleteAccountFromFirestore(accountToDelete.id).catch((err) =>
        console.warn('Failed deleting account from Firestore:', err)
      );
    }
    logUserActivity(
      'حذف',
      'إضافة حساب',
      accountToDelete.id,
      accountToDelete.name,
      'تم حذف بطاقة الحساب نهائياً من الدليل'
    );
    showToast(`تم حذف بطاقة الحساب "${accountToDelete.name}" من الدليل`);
  };

  const safeConfirm = (msg: string): boolean => {
    try {
      return window.confirm(msg);
    } catch {
      return true;
    }
  };

  // Reset to original document data
  const handleResetData = () => {
    const confirmReset = safeConfirm(
      'هل أنت متأكد من رغبتك في استعادة البيانات الأصلية للوثيقة؟ سيتم مسح أي تعديلات غير محفوظة.'
    );
    if (confirmReset) {
      setTransactions(INITIAL_TRANSACTIONS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setAccounts(INITIAL_ACCOUNTS);
      setUsers(INITIAL_USERS);
      setActivityLogs(INITIAL_ACTIVITY_LOGS);
      setCurrentActiveUser(INITIAL_USERS[0]);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
      localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
      showToast('تمت استعادة البيانات الأصلية للوثيقة بنجاح');
    }
  };

  // Export all transactions to CSV
  const handleExportCSV = () => {
    exportToCSV(transactions, `بيان_حركة_الحساب_اليومية_${REPORT_META.reportDate}`);
    showToast('تم تصدير ملف الإكسيل (CSV) بنجاح');
  };

  // Print report - Opens Print Preview Modal and enables direct printing
  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  // Calculate system-wide totals for DesktopStatusBar
  const systemTotals = useMemo(() => {
    return transactions.reduce(
      (acc, curr) => {
        acc.receipts += curr.receipt || 0;
        acc.payments += curr.payment || 0;
        acc.balance += curr.movementBalance || 0;
        return acc;
      },
      { receipts: 0, payments: 0, balance: 0 }
    );
  }, [transactions]);

  // If not logged in, render the Login Screen
  if (!isLoggedIn) {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-10 left-5 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 no-print">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        <LoginScreen
          users={users}
          onLogin={handleLogin}
          lastUserId={currentActiveUser?.id}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#edf3f8] via-[#f0f5fa] to-[#e6eef6] text-[#0f2d52] flex flex-col selection:bg-[#0078d4] selection:text-white overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 left-5 z-50 flex items-center gap-2 bg-[#0f2d52] text-white text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-xl border border-[#1b4379] animate-in fade-in slide-in-from-bottom-2 no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Header with Navigation & Title */}
      <Header
        currentUser={currentActiveUser}
        onLogout={handleLogout}
        onOpenUserManagement={handleOpenUserManagement}
      />

      {/* Desktop Application Menu Bar (شريط القوائم المكتبي) */}
      <DesktopMenuBar
        onAddTransaction={() => handleOpenAddTransaction()}
        onAddAccount={handleOpenAddAccount}
        onOpenChartOfAccounts={() => setIsChartOfAccountsModalOpen(true)}
        onOpenAccountCard={() => handleOpenAccountCard()}
        onOpenImportAccounts={() => {
          if (currentActiveUser.role !== 'مدير نظام') {
            triggerPermissionNotice(
              'استيراد الحسابات',
              'دليل الحسابات',
              'مدير نظام',
              'عفواً، استيراد دليل الحسابات من ملف خارجي مقتصر على مدير النظام فقط.'
            );
            return;
          }
          setIsImportAccountsModalOpen(true);
        }}
        onOpenStatementSheet={() => handleOpenStatementSheet()}
        onOpenUserActivityLogs={() => setIsActivityLogModalOpen(true)}
        onOpenUserManagement={handleOpenUserManagement}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
        onResetData={handleResetData}
        onLogout={handleLogout}
        currentUser={currentActiveUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-3 sm:px-5 lg:px-6 py-3 sm:py-4 space-y-4">
        {/* Quick Actions Command Bar (أزرار العمليات المصغرة في صف واحد + حقل البحث عن العمليات) */}
        <QuickActionBar
          onAddTransaction={() => handleOpenAddTransaction()}
          onAddAccount={handleOpenAddAccount}
          onOpenChartOfAccounts={() => setIsChartOfAccountsModalOpen(true)}
          onOpenStatementSheet={() => handleOpenStatementSheet()}
          onOpenUserActivityLogs={() => setIsActivityLogModalOpen(true)}
          onOpenUserManagement={handleOpenUserManagement}
          activityCount={activityLogs.length}
          onPrint={handlePrint}
          onExportCSV={handleExportCSV}
          onOpenImportAccounts={() => {
            if (currentActiveUser.role !== 'مدير نظام') {
              triggerPermissionNotice(
                'استيراد الحسابات',
                'دليل الحسابات',
                'مدير نظام',
                'عفواً، استيراد دليل الحسابات من ملف خارجي مقتصر على مدير النظام فقط.'
              );
              return;
            }
            setIsImportAccountsModalOpen(true);
          }}
          onNavigateToDailyMovements={() => setActiveTab('daily_movement')}
          onNavigateToFinancialAnalysis={() => {
            setActiveTab('daily_movement');
            window.scrollTo({ top: 180, behavior: 'smooth' });
          }}
          onResetData={handleResetData}
        />

        {/* View 1: الحركة اليومية (Daily Movements Workspace) */}
        {activeTab === 'daily_movement' ? (
          <div className="space-y-6">
            {/* Section: Monthly Cash Flow Analytics Chart (Recharts) */}
            <MonthlyCashFlowChart
              transactions={transactions}
              onSelectTransaction={(txId) => {
                setHighlightedTxId(txId);
                setTimeout(() => {
                  const el = document.getElementById(`transaction-row-${txId}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 150);
                setTimeout(() => setHighlightedTxId(null), 4000);
              }}
            />

            {/* Section I: Full Table */}
            <TransactionsTable
              transactions={transactions}
              onEditTransaction={handleEditClick}
              onDeleteTransaction={handleRequestDeleteTransaction}
              onViewAudit={handleViewAudit}
              onOpenStatementSheet={handleOpenStatementSheet}
              highlightedTxId={highlightedTxId}
              onResequenceTransactions={handleResequenceTransactions}
            />
          </div>
        ) : (
          /* View 2: كشف الحساب (Dedicated Account Statement & Ledger Workspace) */
          <AccountStatementView
            transactions={transactions}
            accounts={accounts}
            onAddTransactionForAccount={(accName) => {
              setTransactionToEdit(null);
              setDefaultTxAccountName(accName);
              setIsModalOpen(true);
            }}
            onOpenAddAccountModal={() => setIsAddAccountModalOpen(true)}
            onPrint={handlePrint}
            onBackToDailyMovements={() => setActiveTab('daily_movement')}
          />
        )}
      </main>

      {/* Desktop Application Bottom Status Bar (شريط الحالة المكتبي السفلي) */}
      <DesktopStatusBar
        totalReceipts={systemTotals.receipts}
        totalPayments={systemTotals.payments}
        totalBalance={systemTotals.balance}
        transactionsCount={transactions.length}
        accountsCount={accounts.length}
        currentUser={currentActiveUser}
        onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
      />

      {/* Printable Output View (visible only during window.print()) */}
      <PrintReportView transactions={transactions} auditLogs={auditLogs} />

      {/* Add / Edit Transaction Modal (نافذة إضافة حركة) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTransactionToEdit(null);
          setDefaultTxAccountName(undefined);
        }}
        onSave={handleSaveTransaction}
        onDelete={checkPermission('transaction', 'delete') ? handleConfirmDeleteTransaction : undefined}
        transactions={transactions}
        transactionToEdit={transactionToEdit}
        nextId={nextId}
        accounts={accounts}
        defaultAccountName={defaultTxAccountName}
        onPrintVoucher={handlePrintVoucher}
        onAddNewAccount={() => {
          setIsModalOpen(false);
          handleOpenAddAccount();
        }}
      />

      {/* Add Account Modal (نافذة إضافة حساب) */}
      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        onSave={handleSaveAccount}
        existingAccounts={accounts}
      />

      {/* User Activity Log Modal (سجل نشاط المستخدمين) */}
      <UserActivityLogModal
        isOpen={isActivityLogModalOpen}
        onClose={() => setIsActivityLogModalOpen(false)}
        activityLogs={activityLogs}
        users={users}
      />

      {/* User Management Modal (نافذة إدارة المستخدمين) */}
      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        users={users}
        currentActiveUser={currentActiveUser}
        onSwitchActiveUser={handleSwitchActiveUser}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* Statement Sheet / Quick Account Ledger Modal */}
      <StatementSheetModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        transactions={transactions}
        accounts={accounts}
        initialAccount={statementAccountName}
      />

      {/* Print Preview & Direct Print Modal */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={transactions}
        auditLogs={auditLogs}
      />

      {/* Chart of Accounts Modal (دليل الحسابات المالي العام) */}
      <ChartOfAccountsModal
        isOpen={isChartOfAccountsModalOpen}
        onClose={() => setIsChartOfAccountsModalOpen(false)}
        accounts={accounts}
        transactions={transactions}
        mode="manage"
        onOpenAddAccountModal={() => {
          setIsChartOfAccountsModalOpen(false);
          setIsAddAccountModalOpen(true);
        }}
        onOpenAccountCard={(acc) => {
          handleOpenAccountCard(acc);
        }}
        onOpenImportModal={() => {
          setIsImportAccountsModalOpen(true);
        }}
        onOpenStatementSheet={(accName) => {
          setIsChartOfAccountsModalOpen(false);
          handleOpenStatementSheet(accName);
        }}
      />

      {/* Import Chart of Accounts Modal (نافذة استيراد دليل الحسابات) */}
      <ImportAccountsModal
        isOpen={isImportAccountsModalOpen}
        onClose={() => setIsImportAccountsModalOpen(false)}
        onImportAccounts={handleImportAccounts}
        existingAccounts={accounts}
        onOpenAccountCard={(acc) => {
          handleOpenAccountCard(acc);
        }}
      />

      {/* Account Card Modal (بطاقة الحساب مع شريط علوي ثابت وتنقل وأسهم وترقيم تلقائي) */}
      <AccountCardModal
        isOpen={isAccountCardModalOpen}
        onClose={() => {
          setIsAccountCardModalOpen(false);
          setAccountCardTargetId(undefined);
          setAccountCardTargetName(undefined);
        }}
        onSaveAccount={handleSaveAccountFromCard}
        onDeleteAccount={handleDeleteAccountFromCard}
        accounts={accounts}
        transactions={transactions}
        initialAccountId={accountCardTargetId}
        initialAccountName={accountCardTargetName}
      />

      {/* Delete Transaction Confirmation Dialog (نافذة تأكيد حذف القيد المالي) */}
      {txToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none"
          dir="rtl"
        >
          <div 
            className="bg-[#f0f6fc] rounded-xl shadow-2xl max-w-md w-full border border-[#bcd2e8] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#bcd2e8] flex items-center gap-3 bg-rose-50/70">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0f2d52]">تأكيد حذف القيد المالي</h3>
                <p className="text-xs text-[#55789e] font-mono-numbers">حركة رقم ({txToDelete.id}) - سند {txToDelete.type}</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-3.5 text-sm text-[#1e3a5f]">
              <p className="font-medium text-[#0f2d52]">
                هل أنت متأكد من رغبتك في حذف هذا القيد المالي نهائياً من قيود اليومية؟
              </p>

              {/* Transaction Summary Box */}
              <div className="p-3 bg-white rounded-lg border border-[#bcd2e8] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#55789e]">اسم الحساب:</span>
                  <strong className="text-[#0f2d52] font-bold">{txToDelete.accountName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#55789e]">نوع وقيمة الحركة:</span>
                  <strong className={txToDelete.receipt > 0 ? 'text-emerald-700 font-mono-numbers font-bold' : 'text-amber-700 font-mono-numbers font-bold'}>
                    سند {txToDelete.type} بقيمة {(txToDelete.receipt || txToDelete.payment).toLocaleString('en-US')} ج.م
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#55789e]">البيان:</span>
                  <span className="text-[#1e3a5f] truncate max-w-[200px] sm:max-w-[240px] font-medium" title={txToDelete.description}>
                    {txToDelete.description}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#bcd2e8] text-[11px] text-[#55789e] font-mono-numbers">
                  <span>تاريخ القيد: {txToDelete.date}</span>
                  <span>منشئ القيد: {txToDelete.createdBy?.split(' ')[0] || currentActiveUser.username}</span>
                </div>
              </div>

              {/* Safety notice */}
              <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200/80 text-rose-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>تنبيه الرقابة المالية والتدقيق:</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  سيتم حذف القيد من جدول اليومية العامة وتحديث أرصدة الحساب فورياً، مع توثيق اسم المستخدم وتفاصيل القيد المحذوف بدقة في سجل نشاط وتدقيق المستخدمين لضمان الرقابة والشفافية.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 sm:p-4 bg-[#e6eef6] border-t border-[#bcd2e8] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-white border border-[#bcd2e8] text-[#0f2d52] hover:bg-[#eaf2fb] transition-colors cursor-pointer shadow-2xs"
              >
                إلغاء الأمر
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteTransaction(txToDelete.id)}
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، تأكيد حذف القيد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Centered Permission Alert Modal */}
      <PermissionModalAlert
        notice={permissionNotice}
        onClose={() => setPermissionNotice(null)}
      />
    </div>
  );
}

