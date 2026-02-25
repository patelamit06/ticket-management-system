'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { inputClass as baseInputClass } from '@/lib/input-styles';

const inputClass = `${baseInputClass} pr-10`;

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  inputClassName?: string;
};

export function PasswordInput({ inputClassName, className, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className={className ? `relative ${className}` : 'relative'}>
      <input
        type={show ? 'text' : 'password'}
        className={inputClassName ? `${inputClassName} pr-10` : inputClass}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
