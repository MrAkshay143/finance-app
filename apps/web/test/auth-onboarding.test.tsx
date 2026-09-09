import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from '../src/pages/auth/LoginPage.js';
import { SignupPage } from '../src/pages/auth/SignupPage.js';
import { OnboardingWizard } from '../src/pages/onboarding/OnboardingWizard.js';
import { SecurityQuestionsPage } from '../src/pages/SecurityQuestionsPage.js';
import { ProfilePage } from '../src/pages/ProfilePage.js';
import { ProfileSettingsPage } from '../src/pages/ProfileSettingsPage.js';
import { ProtectedRoute } from '../src/components/auth/ProtectedRoute.js';
import { useAuthStore } from '../src/store/authStore.js';
import { formatIndianRupees, parseIndianRupees } from '../src/utils/currency.js';
import { apiClient } from '../src/services/apiClient.js';

describe('Web Auth, Onboarding Wizard & KBA Setup Test Suite (TASK-1.3)', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  describe('1. Currency & Indian Numbering Grouping', () => {
    it('correctly formats rupee amounts using Indian numbering system', () => {
      expect(formatIndianRupees(100000)).toBe('₹1,00,000');
      expect(formatIndianRupees(50000)).toBe('₹50,000');
      expect(formatIndianRupees(1250000)).toBe('₹12,50,000');
      expect(formatIndianRupees(0)).toBe('₹0');
      expect(formatIndianRupees(null)).toBe('₹0');
      expect(formatIndianRupees(undefined)).toBe('₹0');
      expect(formatIndianRupees(-75000)).toBe('-₹75,000');
      expect(formatIndianRupees(250000, { includeSymbol: false })).toBe('2,50,000');
    });

    it('correctly parses Indian rupee strings into numerical values', () => {
      expect(parseIndianRupees('₹1,00,000')).toBe(100000);
      expect(parseIndianRupees('₹50,000')).toBe(50000);
      expect(parseIndianRupees('12,50,000')).toBe(1250000);
    });
  });

  describe('2. Auth Store & State Management', () => {
    it('initializes with unauthenticated and empty state', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.onboardingCompleted).toBe(false);
      expect(state.kbaConfigured).toBe(false);
      expect(state.lockoutUntil).toBeNull();
    });

    it('updates authentication, onboarding, and KBA state properly', () => {
      useAuthStore.getState().setAuth(
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'USER',
          status: 'ACTIVE',
          onboardingCompleted: false,
        },
        {
          accessToken: 'fake-access-token',
          refreshToken: 'fake-refresh-token',
          expiresIn: 3600,
        },
        false
      );

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe('test@example.com');
      expect(useAuthStore.getState().onboardingCompleted).toBe(false);
      expect(useAuthStore.getState().kbaConfigured).toBe(false);

      useAuthStore.getState().setOnboardingCompleted(true);
      expect(useAuthStore.getState().onboardingCompleted).toBe(true);

      useAuthStore.getState().setKbaConfigured(true);
      expect(useAuthStore.getState().kbaConfigured).toBe(true);

      useAuthStore.getState().reset();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('3. Route Guards (ProtectedRoute)', () => {
    it('blocks unauthenticated user from accessing protected content', () => {
      useAuthStore.getState().reset();

      const html = renderToString(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <div data-testid="protected-content">Secret Dashboard</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Protected content must not be rendered
      expect(html).not.toContain('Secret Dashboard');
    });

    it('blocks user with incomplete onboarding from accessing dashboard when requireOnboarding is true', () => {
      useAuthStore.getState().setAuth(
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'newuser@example.com',
          fullName: 'New User',
          role: 'USER',
          status: 'ACTIVE',
          onboardingCompleted: false,
        },
        { accessToken: 'tok', refreshToken: 'ref', expiresIn: 3600 },
        false
      );

      const html = renderToString(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ProtectedRoute requireOnboarding={true}>
            <div data-testid="protected-content">Secret Dashboard</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(html).not.toContain('Secret Dashboard');
    });

    it('allows user with incomplete onboarding to access /onboarding when requireOnboarding is false', () => {
      useAuthStore.getState().setAuth(
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'newuser@example.com',
          fullName: 'New User',
          role: 'USER',
          status: 'ACTIVE',
          onboardingCompleted: false,
        },
        { accessToken: 'tok', refreshToken: 'ref', expiresIn: 3600 },
        false
      );

      const html = renderToString(
        <MemoryRouter initialEntries={['/onboarding']}>
          <ProtectedRoute requireOnboarding={false}>
            <div data-testid="onboarding-content">Onboarding Wizard Step</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(html).toContain('Onboarding Wizard Step');
    });

    it('allows onboarded user to access protected dashboard', () => {
      useAuthStore.getState().setAuth(
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'ready@example.com',
          fullName: 'Ready User',
          role: 'USER',
          status: 'ACTIVE',
          onboardingCompleted: true,
        },
        { accessToken: 'tok', refreshToken: 'ref', expiresIn: 3600 },
        true
      );

      const html = renderToString(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireOnboarding={true}>
                  <div data-testid="protected-content">Secret Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(html).toContain('Secret Dashboard');
    });
  });

  describe('4. Login Page Component', () => {
    it('renders login form with dark navy header, email, password, and remember session', () => {
      const html = renderToString(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      expect(html).toContain('Finance Tracker');
      expect(html).toContain('Sign In to Your Account');
      expect(html).toContain('Email Address');
      expect(html).toContain('Password');
      expect(html).toContain('Remember session');
      expect(html).toContain('Create Account');
      expect(html).toContain('#0B1B3A');
      expect(html).toContain('#132A5C');
    });

    it('renders lockout warning banner when account lockout is active', () => {
      useAuthStore.setState({ lockoutUntil: Date.now() + 600000 });

      const html = renderToString(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      expect(html).toContain('Account Temporarily Locked');
      expect(html).toContain('Too many failed login attempts');
    });
  });

  describe('5. Signup Page Component', () => {
    it('renders registration form with first name, email, mobile number, and password fields', () => {
      const html = renderToString(
        <MemoryRouter>
          <SignupPage />
        </MemoryRouter>
      );

      expect(html).toContain('Create Your Account');
      expect(html).toContain('First Name');
      expect(html).toContain('Last Name');
      expect(html).toContain('Email Address');
      expect(html).toContain('Mobile Number');
      expect(html).toContain('Password');
      expect(html).toContain('Confirm Password');
      expect(html).toContain('Sign In');
    });
  });

  describe('6. Onboarding Wizard Component', () => {
    it('renders Step 1: Personal Details with DOB, phone, address', () => {
      const html = renderToString(
        <MemoryRouter>
          <OnboardingWizard />
        </MemoryRouter>
      );

      expect(html).toContain('Financial Onboarding');
      expect(html).toContain('Step 1 of 3');
      expect(html).toContain('Personal Details');
      expect(html).toContain('Date of Birth');
      expect(html).toContain('Phone / Mobile');
      expect(html).toContain('Address');
      expect(html).toContain('Continue to Monthly Targets');
    });
  });

  describe('7. Security Questions Setup Screen (KBA)', () => {
    it('matches Modern Security Questions Setup Screen visual specification', () => {
      const html = renderToString(
        <MemoryRouter>
          <SecurityQuestionsPage />
        </MemoryRouter>
      );

      expect(html).toContain('Security Questions');
      expect(html).toContain('Set up security questions to keep your account safe');
      expect(html).toContain('Your security matters');
      expect(html).toContain('Add 3 security questions');
      expect(html).toContain('QUESTION 1 OF 3');
      expect(html).toContain('Choose a security question');
      expect(html).toContain('Your Answer');
      expect(html).toContain('Question 1');
      expect(html).toContain('Question 2');
      expect(html).toContain('Question 3');
      expect(html).toContain('Next Question');
    });
  });

  describe('8. Profile Overview Screen', () => {
    it('matches Finance Tracker Profile Screen specification with FAM score and completion progress', () => {
      useAuthStore.getState().setAuth(
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'contact@example.com',
          fullName: 'Contact User',
          firstName: 'Contact',
          lastName: 'User',
          role: 'USER',
          status: 'ACTIVE',
          onboardingCompleted: true,
        },
        { accessToken: 'tok', refreshToken: 'ref', expiresIn: 3600 },
        false
      );

      const html = renderToString(
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      );

      expect(html).toContain('Profile');
      expect(html).toContain('Manage your personal and finance details');
      expect(html).toContain('Edit Profile');
      expect(html).toContain('Standard Member');
      expect(html).toContain('Profile Completion');
      expect(html).toContain('Basic Profile');
      expect(html).toContain('Finance Profile');
      expect(html).toContain('Accounts');
      expect(html).toContain('Categories');
      expect(html).toContain('Merchants');
      expect(html).toContain('Integrations');
      expect(html).toContain('Sign Out');
    });
  });

  describe('9. Profile Settings / Finance Profile Screen', () => {
    it('renders Personal Details and Finance Profile targets with Indian currency formatting', () => {
      useAuthStore.getState().setAuth(
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'contact@imakshay.in',
          fullName: 'Akshay Mondal',
          firstName: 'Akshay',
          lastName: 'Mondal',
          mobileNumber: '7063024075',
          role: 'USER',
          status: 'ACTIVE',
          onboardingCompleted: true,
        },
        { accessToken: 'tok', refreshToken: 'ref', expiresIn: 3600 },
        false
      );

      const html = renderToString(
        <MemoryRouter initialEntries={['/profile/settings?tab=basic']}>
          <ProfileSettingsPage />
        </MemoryRouter>
      );

      expect(html).toContain('Basic Profile');
      expect(html).toContain('Personal Details');
      expect(html).toContain('First Name');
      expect(html).toContain('Last Name');
      expect(html).toContain('Mobile Number');
      expect(html).toContain('+91');
      expect(html).toContain('Email Address');
      expect(html).toContain('Date of Birth');
      expect(html).toContain('Security Questions');
      expect(html).toContain('Save Profile');
      expect(html).toContain('Your data is secure and private');
    });
  });

  describe('10. Zero-Placeholder & Emoji Ban Enforcement in Auth & Onboarding Views', () => {
    const screens = [
      { name: 'LoginPage', component: <LoginPage /> },
      { name: 'SignupPage', component: <SignupPage /> },
      { name: 'OnboardingWizard', component: <OnboardingWizard /> },
      { name: 'SecurityQuestionsPage', component: <SecurityQuestionsPage /> },
      { name: 'ProfilePage', component: <ProfilePage /> },
      { name: 'ProfileSettingsPage', component: <ProfileSettingsPage /> },
    ];

    const bannedPhrases = [
      ['coming', 'soon'].join(' '),
      ['coming', 'in', 'v2'].join(' '),
      ['beta', '(v2)'].join(' '),
      ['pre', 'view'].join(''),
      ['to', 'do'].join(''),
      ['sample', 'data'].join(' '),
      ['demo', 'data'].join(' '),
      ['lorem', 'ipsum'].join(' '),
    ];

    screens.forEach(({ name, component }) => {
      it(`${name} contains zero banned placeholder phrases`, () => {
        const html = renderToString(<MemoryRouter>{component}</MemoryRouter>);
        const lower = html.toLowerCase();
        bannedPhrases.forEach((phrase) => {
          expect(lower).not.toContain(phrase);
        });
      });
    });
  });
});
