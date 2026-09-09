import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CloudUpload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Download,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Select } from '../components/ui/Select.js';
import { apiClient } from '../services/apiClient.js';
import { formatCurrency } from '../utils/currency.js';
import { useUserCurrency } from '../hooks/useUserCurrency.js';
import type { Account, ImportCsvResponse } from '@finance/shared-types';

export const ImportPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currency: userCurrency } = useUserCurrency();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [importResult, setImportResult] = useState<ImportCsvResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch accounts to populate dropdown
  const { data: accountsData, isLoading: isAccountsLoading } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await apiClient.accounts.list();
      const list = (res as any)?.accounts || (res as any)?.data?.accounts || res;
      return Array.isArray(list) ? list : [];
    },
  });

  const accounts = accountsData || [];

  // Set default account once loaded
  React.useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setImportResult(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.csv') && selected.type !== 'text/csv') {
      setErrorMessage('Please select a valid .csv file');
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read CSV file contents');
    };
    reader.readAsText(selected);
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setImportResult(null);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;

    if (!dropped.name.toLowerCase().endsWith('.csv') && dropped.type !== 'text/csv') {
      setErrorMessage('Please drop a valid .csv file');
      return;
    }

    setFile(dropped);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
    };
    reader.readAsText(dropped);
  };

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAccountId) {
        throw new Error('Please select a target account');
      }
      if (!fileContent.trim()) {
        throw new Error('CSV file is empty');
      }
      return await apiClient.import.importCsv({
        accountId: selectedAccountId,
        csvData: fileContent,
      });
    },
    onSuccess: (res: any) => {
      const result = res?.data || res;
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Failed to import CSV transactions'
      );
    },
  });

  const sampleCsvContent = `Date,Description,Category,Amount,Type
2026-09-01,Monthly Salary,Salary,75000,income
2026-09-02,Grocery Supermarket,Groceries,3450,expense
2026-09-05,Mutual Fund SIP,Mutual Funds,15000,investment
2026-09-06,Electricity Bill,Utilities,1200,expense`;

  const downloadSampleTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finance_tracker_sample_statement.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col pb-8">
      <AppHeader
        variant="nested"
        title="Import CSV"
        subtitle="Import your transaction data"
        backTo="/menu"
      />

      <div className="p-4 space-y-4">
        {/* Header Summary */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 bg-brand-primary rounded-full" />
            <h2 className="text-xl font-bold text-textDefault">Import Transactions</h2>
          </div>
          <p className="text-xs text-textMuted">
            Upload CSV statements to auto-record transactions.
          </p>
        </div>

        {/* Target Account Selector */}
        <Card padding="sm" className="bg-white border border-borderDefault shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-primary" />
            <label className="text-xs font-bold text-textDefault">Target Account</label>
          </div>

          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            disabled={isAccountsLoading}
            className="w-full p-2.5 bg-slate-50 border border-borderDefault rounded-xl text-xs font-semibold text-textDefault focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Target Account"
          >
            {accounts.length === 0 ? (
              <option value="">Add an account first</option>
            ) : (
              accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type}) · Balance: {formatCurrency(acc.currentBalance / 100, (acc as any).currency || userCurrency)}
                </option>
              ))
            )}
          </select>
        </Card>

        {/* CSV Dropzone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload CSV file. Browse or drag and drop statement file."
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
            file
              ? 'border-brand-primary bg-blue-50/40'
              : 'border-slate-300 hover:border-brand-primary hover:bg-slate-50/50 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-primary flex items-center justify-center mb-3 shadow-xs">
            <CloudUpload className="w-6 h-6" aria-hidden="true" />
          </div>

          {file ? (
            <div>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-textDefault">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>{file.name}</span>
              </div>
              <p className="text-[11px] text-textMuted mt-1">
                {(file.size / 1024).toFixed(1)} KB • Ready to import
              </p>
              <span className="inline-block mt-2 text-[11px] text-brand-primary font-semibold hover:underline">
                Click to replace file
              </span>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-textDefault">
                Tap to browse or drop CSV file here
              </p>
              <p className="text-[11px] text-textMuted mt-1">
                Standard format statement with headers (max 5 MB)
              </p>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Banner */}
        {importResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-xs font-bold">Import Completed</h4>
                <p className="text-[11px] text-emerald-700">Account balance and transactions updated.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-xl border border-emerald-100">
                <div className="font-mono text-base font-black text-emerald-700">
                  {importResult.importedCount}
                </div>
                <div className="text-[10px] text-textMuted">Imported</div>
              </div>

              <div className="p-2 bg-white rounded-xl border border-emerald-100">
                <div className="font-mono text-base font-black text-textMuted">
                  {importResult.skippedCount}
                </div>
                <div className="text-[10px] text-textMuted">Skipped</div>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 space-y-0.5">
                <span className="font-bold">Notices:</span>
                {importResult.errors.slice(0, 3).map((err, idx) => (
                  <p key={idx} className="truncate">• {err}</p>
                ))}
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              fullWidth
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/transactions')}
            >
              View Transactions
            </Button>
          </div>
        )}

        {/* Submit Action Button */}
        {!importResult && (
          <Button
            variant="primary"
            size="md"
            fullWidth
            isLoading={importMutation.isPending}
            disabled={!file || !selectedAccountId}
            onClick={() => importMutation.mutate()}
            icon={<CloudUpload className="w-4 h-4" />}
          >
            Import Transactions
          </Button>
        )}

        {/* Format Guide & Sample Structure */}
        <Card padding="sm" className="bg-white border border-borderDefault shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-primary" />
              <h4 className="text-xs font-bold text-textDefault">Expected CSV Column Format</h4>
            </div>

            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 p-0.5"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sample CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-borderDefault rounded-xl">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-50 text-textMuted font-bold border-b border-borderDefault">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Description</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderDefault font-mono text-textDefault">
                <tr>
                  <td className="p-2">2026-09-01</td>
                  <td className="p-2 font-sans">Monthly Salary</td>
                  <td className="p-2 font-sans">Salary</td>
                  <td className="p-2 text-emerald-600">75000</td>
                  <td className="p-2 font-sans text-emerald-600">income</td>
                </tr>
                <tr>
                  <td className="p-2">2026-09-02</td>
                  <td className="p-2 font-sans">Grocery Supermarket</td>
                  <td className="p-2 font-sans">Groceries</td>
                  <td className="p-2 text-rose-600">3450</td>
                  <td className="p-2 font-sans text-rose-600">expense</td>
                </tr>
                <tr>
                  <td className="p-2">2026-09-05</td>
                  <td className="p-2 font-sans">Mutual Fund SIP</td>
                  <td className="p-2 font-sans">Mutual Funds</td>
                  <td className="p-2 text-purple-600">15000</td>
                  <td className="p-2 font-sans text-purple-600">investment</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
