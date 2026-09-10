import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  CloudDownload,
  FileSpreadsheet,
  FileCode,
  Receipt,
  Wallet,
  PieChart,
  Target,
  ShieldCheck,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { apiClient, getFriendlyErrorMessage } from '../services/apiClient.js';
import { toast } from '../store/toastStore.js';
import type { ExportUserDataResponse } from '@finance/shared-types';

export const ExportPage: React.FC = () => {
  const navigate = useNavigate();
  const [format, setFormat] = useState<'csv' | 'json'>('csv');

  // Mutation to trigger export download
  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.export.exportUserData({ format });
      return (res as any)?.data || res;
    },
    onSuccess: (data: any) => {
      try {
        let rawContent = '';
        if (typeof data === 'string') {
          rawContent = data;
        } else if (typeof data?.data?.data === 'string') {
          rawContent = data.data.data;
        } else if (typeof data?.data === 'string') {
          rawContent = data.data;
        } else if (data?.data?.data) {
          rawContent = JSON.stringify(data.data.data, null, 2);
        } else if (data?.data) {
          rawContent = JSON.stringify(data.data, null, 2);
        } else {
          rawContent = JSON.stringify(data, null, 2);
        }
        const mimeType =
          data?.data?.contentType ||
          data?.contentType ||
          (format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json');
        const filename =
          data?.data?.filename ||
          data?.filename ||
          `finance_tracker_export_${Date.now()}.${format}`;
        const blob = new Blob([rawContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`Export downloaded as ${format.toUpperCase()}`);
      } catch (err: any) {
        toast.error(getFriendlyErrorMessage(err, 'Failed to trigger browser download'));
      }
    },
    onError: (err: any) => {
      toast.error(getFriendlyErrorMessage(err, 'Failed to generate financial export'));
    },
  });

  const includedRecords = [
    {
      title: 'Transactions History',
      desc: 'Categorized transactions with dates and amounts.',
      icon: <Receipt className="w-4 h-4 text-brand-primary" />,
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Accounts & Balances',
      desc: 'Bank accounts, cards, and current balances.',
      icon: <Wallet className="w-4 h-4 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
    },
    {
      title: 'Budgets & Targets',
      desc: 'Category spending limits and targets.',
      icon: <PieChart className="w-4 h-4 text-purple-600" />,
      iconBg: 'bg-purple-50',
    },
    {
      title: 'Financial Goals',
      desc: 'Savings timelines and milestone progress.',
      icon: <Target className="w-4 h-4 text-amber-600" />,
      iconBg: 'bg-amber-50',
    },
  ];

  return (
    <div className="flex-1 flex flex-col pb-8">
      <AppHeader
        variant="nested"
        title="Export Data"
        subtitle="Download your data"
        backTo="/menu"
      />

      <div className="p-4 space-y-4">
        {/* Header summary */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 bg-brand-primary rounded-full" />
            <h2 className="text-xl font-bold text-textDefault">Data Export</h2>
          </div>
          <p className="text-xs text-textMuted">
            Export a full backup of your records anytime.
          </p>
        </div>

        {/* Compact Format Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-textDefault px-1">Select File Format</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                format === 'csv'
                  ? 'border-brand-primary bg-blue-50/80 shadow-xs ring-1 ring-brand-primary/20'
                  : 'border-borderDefault bg-white hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  format === 'csv' ? 'bg-brand-primary text-white' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-textDefault leading-tight truncate">CSV Spreadsheet</div>
                <p className="text-[10px] text-textMuted mt-0.5 leading-tight font-medium">.csv format</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat('json')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                format === 'json'
                  ? 'border-brand-primary bg-blue-50/80 shadow-xs ring-1 ring-brand-primary/20'
                  : 'border-borderDefault bg-white hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  format === 'json' ? 'bg-brand-primary text-white' : 'bg-purple-50 text-purple-600'
                }`}
              >
                <FileCode className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-textDefault leading-tight truncate">JSON Format</div>
                <p className="text-[10px] text-textMuted mt-0.5 leading-tight font-medium">.json format</p>
              </div>
            </button>
          </div>
        </div>

        {/* Included Data Scope */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            <h3 className="text-xs font-bold text-textDefault">Export Inclusions</h3>
          </div>

          <Card padding="none" className="bg-white border border-borderDefault shadow-xs divide-y divide-borderDefault overflow-hidden">
            {includedRecords.map((item) => (
              <div key={item.title} className="p-3.5 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-textDefault leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-textMuted leading-relaxed mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Download Button */}
        <Button
          variant="primary"
          size="md"
          fullWidth
          isLoading={exportMutation.isPending}
          icon={<CloudDownload className="w-4 h-4" />}
          onClick={() => exportMutation.mutate()}
        >
          Download {format.toUpperCase()} Export
        </Button>
      </div>
    </div>
  );
};
