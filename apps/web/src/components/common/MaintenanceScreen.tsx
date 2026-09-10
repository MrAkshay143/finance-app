import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { useMaintenanceStore } from '../../store/maintenanceStore.js';
import { apiClient } from '../../services/apiClient.js';
import { useAuthStore } from '../../store/authStore.js';

export const MaintenanceScreen: React.FC = () => {
  const { message, clearMaintenance } = useMaintenanceStore();
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const handleRetry = async () => {
    setIsChecking(true);
    setStatusMessage(null);
    try {
      // Ping backend root health check
      const res = await apiClient.rawAxios.get('/healthz');
      if (res.status === 200) {
        // Now test if API is rejecting with MAINTENANCE_MODE
        try {
          await apiClient.rawAxios.get('/dashboard/fam');
          // If this succeeded, maintenance is OFF!
          clearMaintenance();
          window.location.reload();
          return;
        } catch (apiErr: any) {
          if (apiErr.response?.status === 503 && apiErr.response?.data?.error?.code === 'MAINTENANCE_MODE') {
            setStatusMessage('System maintenance is still in progress. Please check again shortly.');
            return;
          }
          // If other status (e.g. 401 unauthorized), maintenance is off
          clearMaintenance();
          window.location.reload();
          return;
        }
      }
      setStatusMessage('Platform updates are being applied. Please try again soon.');
    } catch {
      setStatusMessage('Server is currently updating. Please wait a moment.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-[#0B1528] to-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none animate-ambient-glow" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative z-10 flex flex-col items-center">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-300 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>System Update in Progress</span>
        </div>

        {/* Branded Icon Container */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-primary/20 via-blue-500/10 to-amber-500/20 border border-white/10 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-10 h-10 text-amber-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center">
            <RefreshCw className="w-3 h-3 text-brand-primary animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        {/* Title & Message */}
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          System Update in Progress
        </h1>

        <p className="text-sm text-slate-300/90 mt-3 leading-relaxed max-w-sm">
          {message || "We're performing a quick system update. Your accounts and data are completely safe."}
        </p>

        {/* Status check response feedback */}
        {statusMessage && (
          <div className="mt-4 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-xs text-amber-200 leading-tight">
            {statusMessage}
          </div>
        )}

        {/* Retry Button */}
        <button
          type="button"
          onClick={handleRetry}
          disabled={isChecking}
          className="mt-6 w-full py-3 px-4 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Checking status...' : 'Check Again'}</span>
        </button>

        {/* Support & Details */}
        <div className="mt-6 pt-6 border-t border-white/10 w-full flex flex-col items-center gap-3">
          <a
            href="mailto:support@imakshay.in"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Need assistance? support@imakshay.in</span>
          </a>

          {user?.role === 'ADMIN' && (
            <a
              href="/admin/settings"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:text-blue-300 transition-colors mt-1"
            >
              <span>Admin Console</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceScreen;
