import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Check,
  Copy,
  Eye,
  Code,
  FileText,
  RefreshCw,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../ui/Button.js';
import { Skeleton } from '../ui/Skeleton.js';
import { apiClient, getFriendlyErrorMessage } from '../../services/apiClient.js';
import { toast } from '../../store/toastStore.js';
import type { EmailTemplate } from '@finance/shared-types';
import { useConfigStore } from '../../store/configStore.js';

export const AdminEmailTemplatesTab: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, isError, refetch } = useQuery<EmailTemplate[]>({
    queryKey: ['admin-email-templates'],
    queryFn: async () => {
      const res = await apiClient.admin.getEmailTemplates();
      return (res as any)?.data || res || [];
    },
  });

  const [selectedKey, setSelectedKey] = useState<string>('password_reset');
  const [subject, setSubject] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [textContent, setTextContent] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [editorMode, setEditorMode] = useState<'html' | 'text' | 'preview'>('html');

  // Load selected template into state
  useEffect(() => {
    if (templates && templates.length > 0) {
      const current = templates.find((t) => t.key === selectedKey) || templates[0];
      if (current) {
        setSelectedKey(current.key);
        setSubject(current.subject || '');
        setHtmlContent(current.htmlContent || '');
        setTextContent(current.textContent || '');
        setIsActive(current.isActive !== false);
      }
    }
  }, [templates, selectedKey]);

  const activeTemplate = templates.find((t) => t.key === selectedKey);

  // Mutation to save email template
  const updateMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.admin.updateEmailTemplate(selectedKey, {
        subject,
        htmlContent,
        textContent,
        isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] });
      toast.success(`Template "${activeTemplate?.name || selectedKey}" saved`);
    },
    onError: (err: any) => {
      toast.error(getFriendlyErrorMessage(err, 'Failed to update email template'));
    },
  });

  // Extract variables (array of strings or object)
  const availableVariables: string[] = Array.isArray(activeTemplate?.variables)
    ? activeTemplate.variables
    : ['firstName', 'appName', 'resetLink', 'ipAddress', 'userAgent'];

  const copyVariable = (varName: string) => {
    const placeholder = `{{${varName}}}`;
    navigator.clipboard.writeText(placeholder);
    toast.info(`Copied ${placeholder} to clipboard`);
  };

  // Generate live preview by substituting sample values
  const getSimulatedPreviewHtml = () => {
    let preview = htmlContent || '<p>No content</p>';
    const sampleValues: Record<string, string> = {
      firstName: 'Akshay',
      lastName: 'Mondal',
      appName: 'Finance Tracker Pro',
      resetLink: 'https://finance.imakshay.in/reset-password?token=sample-token-12345',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome on Windows 11 (Desktop)',
      timestamp: new Date().toLocaleString(),
      supportEmail: 'contact@imakshay.in',
    };

    Object.entries(sampleValues).forEach(([key, val]) => {
      preview = preview.split(`{{${key}}}`).join(val);
    });

    return preview;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-2">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || templates.length === 0) {
    return (
      <div className="bg-white border border-borderDefault rounded-2xl p-6 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-sm font-bold text-textDefault">Could not load email templates</h3>
        <p className="text-xs text-textMuted">
          Check your database connection or execute database seed to initialize transactional email templates.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-borderDefault rounded-2xl shadow-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-textDefault leading-tight">Transactional Email Templates</h2>
              <p className="text-xs text-textMuted mt-0.5 leading-tight">
                Customize outgoing emails for password resets, alerts, and user notifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={updateMutation.isPending}
              icon={<Check className="w-3.5 h-3.5" />}
              onClick={() => updateMutation.mutate()}
              className="text-xs whitespace-nowrap"
            >
              Save Template
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {templates.map((t) => {
            const isSelected = t.key === selectedKey;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelectedKey(t.key)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-textMuted hover:text-textDefault border-slate-200'
                }`}
              >
                <span>{t.name || t.key}</span>
                {t.isActive ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}
                    title="Active"
                  />
                ) : (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/60' : 'bg-slate-400'}`}
                    title="Inactive"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-borderDefault rounded-2xl shadow-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-borderDefault">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-textMuted">Template Key</span>
            <div className="text-sm font-bold text-textDefault flex items-center gap-2">
              <code>{selectedKey}</code>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isActive ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-textDefault cursor-pointer flex items-center gap-2">
              <span>Enable Template:</span>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive((prev) => !prev)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
                  isActive ? 'bg-brand-primary' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-textDefault flex items-center justify-between">
            <span>Email Subject</span>
            <span className="text-[10px] text-textMuted">Supports variable interpolation</span>
          </label>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-borderDefault bg-inputBg px-3 py-2 text-sm text-textDefault focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            placeholder="e.g. Reset your Finance Tracker password"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-textDefault flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>Available Dynamic Variables</span>
            </label>
            <span className="text-[10px] text-textMuted">Click to copy variable placeholder</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availableVariables.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => copyVariable(v)}
                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-brand-primary border border-blue-200 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors"
                title={`Click to copy {{${v}}}`}
              >
                <Copy className="w-3 h-3 text-blue-400" />
                <span>&#123;&#123;{v}&#125;&#125;</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-borderDefault">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setEditorMode('html')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  editorMode === 'html'
                    ? 'bg-white text-textDefault shadow-sm'
                    : 'text-textMuted hover:text-textDefault'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>HTML Body</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('text')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  editorMode === 'text'
                    ? 'bg-white text-textDefault shadow-sm'
                    : 'text-textMuted hover:text-textDefault'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Plain Text</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  editorMode === 'preview'
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-textMuted hover:text-textDefault'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
            </div>

            <span className="text-[11px] text-textMuted hidden sm:inline-block">
              {editorMode === 'preview' ? 'Simulated recipient preview' : 'Sanitized HTML without script tags'}
            </span>
          </div>

          {editorMode === 'html' && (
            <div className="space-y-1">
              <textarea
                rows={12}
                className="w-full font-mono text-xs leading-relaxed rounded-xl border border-borderDefault bg-slate-900 text-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 selection:bg-brand-primary selection:text-white"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="<!DOCTYPE html><html><body>...</body></html>"
              />
              <p className="text-[10px] text-textMuted">
                Full HTML formatting with inline CSS styles is supported. Script tags are automatically stripped for security.
              </p>
            </div>
          )}

          {editorMode === 'text' && (
            <div className="space-y-1">
              <textarea
                rows={10}
                className="w-full font-mono text-xs leading-relaxed rounded-xl border border-borderDefault bg-inputBg p-3 text-textDefault focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Fallback plain text content for legacy email clients..."
              />
              <p className="text-[10px] text-textMuted">
                Shown to email clients that do not support or block HTML email content.
              </p>
            </div>
          )}

          {editorMode === 'preview' && (
            <div className="border border-borderDefault rounded-xl overflow-hidden bg-slate-50 p-4">
              <div className="bg-white rounded-lg border border-slate-200 p-3 mb-3 shadow-xs">
                <div className="text-xs text-textMuted">
                  <span className="font-semibold text-textDefault">Subject:</span>{' '}
                  {subject ? (
                    <span>{subject}</span>
                  ) : (
                    <span className="italic text-slate-400">No subject specified</span>
                  )}
                </div>
                <div className="text-xs text-textMuted mt-1">
                  <span className="font-semibold text-textDefault">To:</span> recipient@domain.com
                </div>
              </div>

              <div
                className="prose prose-sm max-w-none bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
                dangerouslySetInnerHTML={{ __html: getSimulatedPreviewHtml() }}
              />
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-borderDefault flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTemplate) {
                setSubject(activeTemplate.subject || '');
                setHtmlContent(activeTemplate.htmlContent || '');
                setTextContent(activeTemplate.textContent || '');
                setIsActive(activeTemplate.isActive !== false);
                toast.info('Reverted unsaved template edits');
              }
            }}
          >
            Revert
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={updateMutation.isPending}
            icon={<Check className="w-3.5 h-3.5" />}
            onClick={() => updateMutation.mutate()}
          >
            Save Template Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
export default AdminEmailTemplatesTab;
