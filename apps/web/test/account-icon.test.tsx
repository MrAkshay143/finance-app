import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AccountIcon } from '../src/components/AccountIcon.js';

describe('AccountIcon Component', () => {
  it('renders default semantic icon when no institution is provided', () => {
    const html = renderToString(
      <AccountIcon accountType="BANK" />
    );
    expect(html).toContain('data-testid="account-icon"');
    // Default bank renders lucide landmark SVG
    expect(html).toContain('<svg');
  });

  it('renders dynamic real icon fallback as per account type when unknown institution is passed', () => {
    // Bank account fallback
    const bankHtml = renderToString(
      <AccountIcon institution="hymannnn.com" accountType="BANK" />
    );
    expect(bankHtml).toContain('data-testid="account-icon"');
    expect(bankHtml).toContain('data-testid="account-type-fallback"');
    expect(bankHtml).toContain('bg-blue-50');

    // Credit card fallback
    const cardHtml = renderToString(
      <AccountIcon institution="hymannnn.com" accountType="CREDIT_CARD" />
    );
    expect(cardHtml).toContain('data-testid="account-type-fallback"');
    expect(cardHtml).toContain('bg-purple-50');

    // Investment fallback
    const invHtml = renderToString(
      <AccountIcon institution="hymannnn.com" accountType="INVESTMENT" />
    );
    expect(invHtml).toContain('data-testid="account-type-fallback"');
    expect(invHtml).toContain('bg-emerald-50');

    // Wallet fallback
    const walletHtml = renderToString(
      <AccountIcon institution="hymannnn.com" accountType="WALLET" />
    );
    expect(walletHtml).toContain('data-testid="account-type-fallback"');
    expect(walletHtml).toContain('bg-amber-50');

    // Cash fallback
    const cashHtml = renderToString(
      <AccountIcon institution="hymannnn.com" accountType="CASH" />
    );
    expect(cashHtml).toContain('data-testid="account-type-fallback"');
    expect(cashHtml).toContain('bg-teal-50');

    // Loan fallback
    const loanHtml = renderToString(
      <AccountIcon institution="hymannnn.com" accountType="LOAN" />
    );
    expect(loanHtml).toContain('data-testid="account-type-fallback"');
    expect(loanHtml).toContain('bg-rose-50');
  });

  it('renders card network overlay badge for credit card with known prefix', () => {
    // Visa prefix 4111
    const html = renderToString(
      <AccountIcon
        institution="HDFC Bank"
        accountType="CREDIT_CARD"
        cardNetworkPrefix="4111"
      />
    );
    expect(html).toContain('data-testid="card-network-badge"');
    expect(html).toContain('title="Network: Visa"');
    expect(html).toContain('VISA');
  });

  it('renders Mastercard badge for credit card with 5200 prefix', () => {
    const html = renderToString(
      <AccountIcon
        institution="ICICI Bank"
        accountType="CREDIT_CARD"
        cardNetworkPrefix="5200"
      />
    );
    expect(html).toContain('data-testid="card-network-badge"');
    expect(html).toContain('title="Network: Mastercard"');
  });

  it('renders RuPay badge for credit card with 6071 prefix', () => {
    const html = renderToString(
      <AccountIcon
        institution="SBI"
        accountType="CREDIT_CARD"
        cardNetworkPrefix="6071"
      />
    );
    expect(html).toContain('data-testid="card-network-badge"');
    expect(html).toContain('title="Network: RuPay"');
  });

  it('does NOT render card network badge for non-credit-card accounts', () => {
    const html = renderToString(
      <AccountIcon
        institution="HDFC Bank"
        accountType="BANK"
        cardNetworkPrefix="4111"
      />
    );
    expect(html).not.toContain('data-testid="card-network-badge"');
  });
});
