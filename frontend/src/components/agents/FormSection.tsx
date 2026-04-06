// frontend/src/components/agents/FormSection.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import type { ValidationError } from '../../types/ui.js';

export type FormSectionProps = {
  title: string;
  description?: string;
  error?: ValidationError;
  children: React.ReactNode;
  className?: string;
};

export function FormSection({
  title,
  description,
  error,
  children,
  className
}: FormSectionProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        'bg-slate-900/50',
        error
          ? 'border-red-500/50 bg-red-950/10'
          : 'border-cyan-500/30',
        className
      )}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-cyan-300">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {children}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error.message}</span>
        </div>
      )}
    </div>
  );
}
