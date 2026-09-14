import React, { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({ length = 6, value, onChange, disabled = false }: OtpInputProps) {
  const [activeInput, setActiveInput] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!/^[0-9]*$/.test(val)) return;

    const newValue = value.split('');
    newValue[index] = val.substring(val.length - 1);
    const combinedValue = newValue.join('');
    
    onChange(combinedValue);

    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveInput(index + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveInput(index - 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    
    if (pastedData) {
      const newValue = value.split('');
      for (let i = 0; i < pastedData.length; i++) {
        newValue[i] = pastedData[i];
      }
      onChange(newValue.join(''));
      
      const nextFocus = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextFocus]?.focus();
      setActiveInput(nextFocus);
    }
  };

  return (
    <div className="flex justify-between gap-2 sm:gap-4">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleOtpChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={() => setActiveInput(index)}
          disabled={disabled}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg border 
            ${
              disabled 
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                : activeInput === index 
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white' 
                  : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            } transition-all duration-200`}
        />
      ))}
    </div>
  );
}
