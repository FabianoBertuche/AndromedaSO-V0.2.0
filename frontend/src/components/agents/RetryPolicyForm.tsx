// frontend/src/components/agents/RetryPolicyForm.tsx
import React, { useState, useCallback } from 'react';
import { RotateCcw, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { FormSectionHeader } from './FormSectionHeader.js';
import type { RetryPolicy, BackoffStrategy } from '../../types/ui.js';

export type RetryPolicyFormProps = {
  value: RetryPolicy;
  onChange: (policy: RetryPolicy) => void;
  disabled?: boolean;
  className?: string;
};

const backoffStrategyLabels: Record<BackoffStrategy, string> = {
  fixed: 'Fixo',
  exponential: 'Exponencial',
  linear: 'Linear'
};

export function RetryPolicyForm({
  value,
  onChange,
  disabled = false,
  className
}: RetryPolicyFormProps) {
  const [newErrorCode, setNewErrorCode] = useState('');
  const isRetryDisabled = value.maxRetries === 0;

  const updateField = useCallback(<K extends keyof RetryPolicy>(
    field: K,
    fieldValue: RetryPolicy[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  }, [value, onChange]);

  const addRetryableError = () => {
    if (newErrorCode.trim() && !value.retryableErrors.includes(newErrorCode.trim())) {
      updateField('retryableErrors', [...value.retryableErrors, newErrorCode.trim()]);
      setNewErrorCode('');
    }
  };

  const removeRetryableError = (errorCode: string) => {
    updateField('retryableErrors', value.retryableErrors.filter(e => e !== errorCode));
  };

  const formatDelay = (ms: number): string => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(1)}s`;
    }
    return `${ms}ms`;
  };

  return (
    <div className={cn('rounded-lg border border-cyan-500/30 bg-slate-900/50 p-4', className)}>
      <FormSectionHeader
        title="Política de Retry"
        icon={RotateCcw}
        badge={value.maxRetries > 0 
          ? { text: `${value.maxRetries} tentativas`, variant: 'info' }
          : { text: 'Desativado', variant: 'warning' }
        }
      />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Max Retries */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cyan-300">
            Máximo de Tentativas
          </label>
          <input
            type="number"
            min={0}
            max={10}
            value={value.maxRetries}
            onChange={(e) => updateField('maxRetries', parseInt(e.target.value) || 0)}
            disabled={disabled}
            className="w-full rounded border border-cyan-500/30 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50"
          />
          <p className="text-xs text-slate-500">
            0 para desativar retry
          </p>
        </div>

        {/* Delay */}
        <div className={cn('space-y-1.5', isRetryDisabled && 'opacity-50')}>
          <label className="text-xs font-medium text-cyan-300">
            Delay entre Tentativas
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              step={100}
              value={value.delay}
              onChange={(e) => updateField('delay', parseInt(e.target.value) || 0)}
              disabled={disabled || isRetryDisabled}
              className="w-full rounded border border-cyan-500/30 bg-slate-800 px-3 py-2 pr-16 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              {formatDelay(value.delay)}
            </span>
          </div>
        </div>

        {/* Backoff Strategy */}
        <div className={cn('space-y-1.5', isRetryDisabled && 'opacity-50')}>
          <label className="text-xs font-medium text-cyan-300">
            Estratégia de Backoff
          </label>
          <select
            value={value.backoffStrategy}
            onChange={(e) => updateField('backoffStrategy', e.target.value as BackoffStrategy)}
            disabled={disabled || isRetryDisabled}
            className="w-full rounded border border-cyan-500/30 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50"
          >
            {(['fixed', 'exponential', 'linear'] as BackoffStrategy[]).map(strategy => (
              <option key={strategy} value={strategy}>
                {backoffStrategyLabels[strategy]}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        <div className={cn('flex items-end', isRetryDisabled && 'opacity-50')}>
          <div className="w-full rounded bg-slate-950/50 px-3 py-2 text-xs text-slate-400 font-mono">
            {!isRetryDisabled ? (
              <span>
                {value.maxRetries} tentativas com delay {formatDelay(value.delay)} ({value.backoffStrategy})
              </span>
            ) : (
              <span className="text-slate-600">Retry desativado</span>
            )}
          </div>
        </div>
      </div>

      {/* Retryable Errors */}
      <div className={cn('mt-4 pt-4 border-t border-cyan-500/20', isRetryDisabled && 'opacity-50')}>
        <label className="text-xs font-medium text-cyan-300">
          Erros Retryáveis
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {value.retryableErrors.map(errorCode => (
            <span
              key={errorCode}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-xs text-red-300"
            >
              {errorCode}
              <button
                onClick={() => removeRetryableError(errorCode)}
                disabled={disabled || isRetryDisabled}
                className="hover:text-red-200 disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          
          {/* Add new error */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newErrorCode}
              onChange={(e) => setNewErrorCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRetryableError()}
              disabled={disabled || isRetryDisabled}
              placeholder="Código do erro"
              className="w-32 rounded border border-cyan-500/30 bg-slate-800 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={addRetryableError}
              disabled={disabled || isRetryDisabled || !newErrorCode.trim()}
              className="rounded p-1 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        {value.retryableErrors.length === 0 && !isRetryDisabled && (
          <p className="mt-2 text-xs text-slate-500">
            Todos os erros serão retryáveis por padrão
          </p>
        )}
      </div>
    </div>
  );
}
