import React from 'react';
import {
  Receipt,
  ReceiptIndianRupee,
  ReceiptEuro,
  ReceiptPoundSterling,
  ReceiptJapaneseYen,
  ReceiptRussianRuble,
  ReceiptSwissFranc,
  ReceiptText,
  type LucideProps,
} from 'lucide-react';
import { getCurrencySymbol } from '../../utils/currency.js';

export interface CurrencyReceiptIconProps extends LucideProps {
  currency?: string;
}

export const CurrencyReceiptIcon: React.FC<CurrencyReceiptIconProps> = ({
  currency = 'INR',
  className = 'w-7 h-7 stroke-[1.8]',
  ...props
}) => {
  const code = (currency || 'INR').toUpperCase();

  switch (code) {
    case 'INR':
      return <ReceiptIndianRupee className={className} aria-hidden="true" {...props} />;
    case 'EUR':
      return <ReceiptEuro className={className} aria-hidden="true" {...props} />;
    case 'GBP':
      return <ReceiptPoundSterling className={className} aria-hidden="true" {...props} />;
    case 'JPY':
      return <ReceiptJapaneseYen className={className} aria-hidden="true" {...props} />;
    case 'RUB':
      return <ReceiptRussianRuble className={className} aria-hidden="true" {...props} />;
    case 'CHF':
      return <ReceiptSwissFranc className={className} aria-hidden="true" {...props} />;
    case 'USD':
    case 'CAD':
    case 'AUD':
    case 'SGD':
      return <Receipt className={className} aria-hidden="true" {...props} />;
    case 'AED':
      return (
        <div className="relative inline-flex items-center justify-center">
          <ReceiptText className={className} aria-hidden="true" {...props} />
          <span className="absolute text-[9px] font-black tracking-tighter text-brand-primary select-none pointer-events-none">
            {getCurrencySymbol('AED')}
          </span>
        </div>
      );
    default:
      return <ReceiptText className={className} aria-hidden="true" {...props} />;
  }
};
