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

  it('renders with initials fallback when unknown institution is passed during SSR/initial render', () => {
    const html = renderToString(
      <AccountIcon institution="Unknown Credit Union" accountType="BANK" />
    );
    expect(html).toContain('data-testid="account-icon"');
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
