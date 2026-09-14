import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminAppSettingsPage } from '../src/pages/AdminAppSettingsPage.js';
import { AdminEmailTemplatesTab } from '../src/components/admin/AdminEmailTemplatesTab.js';
import { MenuPage } from '../src/pages/MenuPage.js';
import { useAuthStore } from '../src/store/authStore.js';

function createTestQueryClient(initialData?: Array<[any[], any]> | Record<string, any>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  if (Array.isArray(initialData)) {
    initialData.forEach(([key, value]) => {
      queryClient.setQueryData(key, value);
    });
  } else if (initialData) {
    Object.entries(initialData).forEach(([key, value]) => {
      queryClient.setQueryData([key], value);
    });
  }

  return queryClient;
}

const mockTemplates = [
  {
    key: 'password_reset',
    name: 'Password Reset',
    subject: 'Reset your {{appName}} password',
    htmlContent: '<h1>Password Reset</h1><p>Hi {{firstName}}, click <a href="{{resetLink}}">here</a> to reset your password.</p>',
    textContent: 'Hi {{firstName}}, click here to reset: {{resetLink}}',
    variables: ['firstName', 'resetLink', 'appName', 'supportEmail'],
    description: 'Sent when a user requests a password reset link.',
  },
  {
    key: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to {{appName}}!',
    htmlContent: '<h1>Welcome, {{firstName}}!</h1><p>Thanks for joining {{appName}}.</p>',
    textContent: 'Welcome, {{firstName}}! Thanks for joining {{appName}}.',
    variables: ['firstName', 'appName', 'supportEmail'],
    description: 'Sent after successful account registration.',
  },
  {
    key: 'security_alert',
    name: 'Security Alert',
    subject: 'Security Alert: New sign-in detected',
    htmlContent: '<p>Hi {{firstName}}, new login from {{ipAddress}} using {{userAgent}}.</p>',
    textContent: 'Security alert: new login from {{ipAddress}}.',
    variables: ['firstName', 'ipAddress', 'userAgent', 'timestamp'],
    description: 'Sent when unusual sign-in activity is detected.',
  },
];

describe('Admin Settings Tabs & Email Templates Test Suite', () => {
  it('renders AdminAppSettingsPage with all 6 tab navigation pills', () => {
    useAuthStore.setState({
      user: {
        id: 'usr_admin',
        email: 'contact@imakshay.in',
        fullName: 'Akshay Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      isAuthenticated: true,
    });

    const qc = createTestQueryClient({
      'admin-app-settings': {
        sessionTimeoutMinutes: 60,
        maxFailedLoginAttempts: 5,
        smtpEnabled: true,
      },
      'admin-email-templates': mockTemplates,
    });

    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/admin/settings']}>
          <AdminAppSettingsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify all 6 tabs are rendered
    expect(html).toContain('General');
    expect(html).toContain('Security');
    expect(html).toContain('Email / SMTP');
    expect(html).toContain('Email Templates');
    expect(html).toContain('Financial');
    expect(html).toContain('Maintenance');

    // Verify admin profile header
    expect(html).toContain('Akshay Admin');
    expect(html).toContain('System Admin');
  });

  it('renders AdminEmailTemplatesTab with template switcher and editor elements', () => {
    const qc = createTestQueryClient({
      'admin-email-templates': mockTemplates,
    });

    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <AdminEmailTemplatesTab />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify template names in switcher
    expect(html).toContain('Password Reset');
    expect(html).toContain('Welcome Email');
    expect(html).toContain('Security Alert');

    // Verify variable chips
    expect(html).toContain('firstName');
    expect(html).toContain('resetLink');
    expect(html).toContain('appName');

    // Verify editor tabs and actions
    expect(html).toContain('HTML Body');
    expect(html).toContain('Plain Text');
    expect(html).toContain('Live Preview');
    expect(html).toContain('Save Template Changes');
  });

  it('renders MenuPage with Email Templates link when user is ADMIN', () => {
    useAuthStore.setState({
      user: {
        id: 'usr_admin',
        email: 'contact@imakshay.in',
        fullName: 'Akshay Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      isAuthenticated: true,
    });

    const qc = createTestQueryClient();
    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <MenuPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(html).toContain('Email Templates');
    expect(html).toContain('Manage outgoing transactional emails');
  });
});
