import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error handled by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearAndReset = () => {
    try {
      localStorage.removeItem('acuora_daily_account_activity_logs_v3');
      localStorage.removeItem('acuora_daily_account_users_v3');
      localStorage.removeItem('acuora_daily_account_active_user_id_v3');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              حدث تنبيه أثناء معالجة البيانات
            </h2>
            <p className="text-xs text-slate-600 mb-6">
              تم احتواء المشكلة بنجاح للحفاظ على سلامة سجل الحركات والبيانات المالية.
            </p>
            <div className="space-y-2">
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحميل المنظومة</span>
              </button>
              <button
                onClick={this.handleClearAndReset}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-xs cursor-pointer border border-slate-300"
              >
                إعادة ضبط ذاكرة المتصفح المؤقتة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
