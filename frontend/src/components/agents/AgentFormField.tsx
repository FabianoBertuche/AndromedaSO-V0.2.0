import { useState, useCallback } from 'react';
import type { FieldMetadata } from '../../constants/agentCanonicalFields.js';

export interface AgentFormFieldProps {
  field: FieldMetadata;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

function ChipInput({ values, onChange, disabled, placeholder }: ChipInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.trim()) {
      event.preventDefault();
      const newValue = inputValue.trim();
      if (!values.includes(newValue)) {
        onChange([...values, newValue]);
      }
      setInputValue('');
    } else if (event.key === 'Backspace' && !inputValue && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }, [inputValue, values, onChange]);

  const removeChip = useCallback((index: number) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    onChange(newValues);
  }, [values, onChange]);

  return (
    <div
      className={`mt-1 flex min-h-[2.5rem] flex-wrap items-center gap-2 rounded border border-slate-700 bg-slate-950/70 px-2 py-1 ${disabled ? 'opacity-50' : ''}`}
    >
      {values.map((val, index) => (
        <span
          key={`${val}-${index}`}
          className="flex items-center gap-1 rounded bg-cyan-500/20 px-2 py-1 text-sm text-cyan-100"
        >
          {val}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeChip(index)}
              className="ml-1 text-cyan-300 hover:text-cyan-100 focus:outline-none"
              aria-label={`Remove ${val}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder || 'Add item...'}
        className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none min-w-[120px] py-1"
      />
    </div>
  );
}

export function AgentFormField({ field, value, onChange, disabled }: AgentFormFieldProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const baseInputClass = 'mt-1 w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50';

  const renderField = () => {
    switch (field.type) {
      case 'string':
        return (
          <input
            type="text"
            id={field.name}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={field.required ? 'Required' : 'Optional'}
            className={baseInputClass}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            id={field.name}
            value={(value as number) ?? ''}
            onChange={(e) => {
              const numValue = e.target.value === '' ? null : Number(e.target.value);
              onChange(numValue);
            }}
            disabled={disabled}
            placeholder={field.required ? 'Required' : 'Optional'}
            className={baseInputClass}
          />
        );

      case 'boolean':
        return (
          <label className="mt-1 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              id={field.name}
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950/70 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950 disabled:opacity-50"
            />
            <span className="text-slate-300 text-sm">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );

      case 'enum':
        return (
          <select
            id={field.name}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          >
            <option value="" disabled>
              Select...
            </option>
            {field.enumValues?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'array':
        return (
          <ChipInput
            values={Array.isArray(value) ? (value as string[]) : []}
            onChange={onChange}
            disabled={disabled}
            placeholder="Press Enter to add"
          />
        );

      case 'object':
      case 'json':
        return (
          <textarea
            id={field.name}
            value={
              typeof value === 'object' && value !== null
                ? JSON.stringify(value, null, 2)
                : (value as string) || ''
            }
            onChange={(e) => {
              const textValue = e.target.value;
              try {
                // Try to parse as JSON
                const parsed = JSON.parse(textValue);
                onChange(parsed);
              } catch {
                // If not valid JSON, store as string
                onChange(textValue);
              }
            }}
            disabled={disabled}
            placeholder={field.type === 'json' ? '{"key": "value"}' : 'Enter JSON...'}
            className={`${baseInputClass} min-h-[120px] font-mono text-sm`}
            rows={6}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            id={field.name}
            value={
              value instanceof Date
                ? value.toISOString().slice(0, 16)
                : (value as string) || ''
            }
            onChange={(e) => {
              const dateValue = e.target.value;
              onChange(dateValue ? new Date(dateValue) : null);
            }}
            disabled={disabled}
            className={baseInputClass}
          />
        );

      default:
        return (
          <input
            type="text"
            id={field.name}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <label
          htmlFor={field.name}
          className="text-sm font-medium text-slate-200"
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
        >
          {field.name}
          {field.required && <span className="ml-1 text-cyan-400">*</span>}
        </label>

        {/* Tooltip */}
        {tooltipVisible && (
          <div className="relative">
            <div className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded border border-cyan-500/30 bg-slate-900/95 p-2 text-xs text-slate-200 shadow-lg backdrop-blur-sm">
              <p className="font-medium text-cyan-300">{field.description}</p>
              <div className="mt-1 border-t border-slate-700 pt-1">
                <span className="text-slate-400">Type: </span>
                <span className="text-emerald-400">{field.type}</span>
              </div>
              {field.default !== undefined && field.default !== null && (
                <div>
                  <span className="text-slate-400">Default: </span>
                  <span className="text-amber-400">
                    {typeof field.default === 'object'
                      ? JSON.stringify(field.default)
                      : String(field.default)}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 left-4 -mb-1 h-2 w-2 rotate-45 border-b border-r border-cyan-500/30 bg-slate-900/95" />
          </div>
        )}
      </div>

      {renderField()}

      {/* Static description below field */}
      <p className="text-xs text-slate-500">{field.description}</p>
    </div>
  );
}
