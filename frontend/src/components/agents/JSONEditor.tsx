// frontend/src/components/agents/JSONEditor.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Wand2, AlertCircle, Check } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import type { JSONSchema } from '../../types/ui.js';

export type JSONEditorProps = {
  value: object | string;
  onChange: (value: string, isValid: boolean, parsed?: object) => void;
  schema?: JSONSchema;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
};

export function JSONEditor({
  value,
  onChange,
  schema,
  label,
  placeholder = '{\n  "/\* Cole o JSON aqui */\n}',
  disabled = false,
  minHeight = '150px',
  className
}: JSONEditorProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Inicializar com valor formatado
  useEffect(() => {
    const initialText = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    setText(initialText);
    validateJson(initialText);
  }, []);

  const validateJson = useCallback((jsonText: string): boolean => {
    try {
      const parsed = JSON.parse(jsonText);
      
      // Validação de schema (se fornecido)
      if (schema) {
        const schemaErrors = validateSchema(parsed, schema);
        if (schemaErrors.length > 0) {
          setError(schemaErrors.join(', '));
          setIsValid(false);
          return false;
        }
      }
      
      setError(null);
      setIsValid(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON inválido');
      setIsValid(false);
      return false;
    }
  }, [schema]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    const valid = validateJson(newText);
    const parsed = valid ? JSON.parse(newText) : undefined;
    onChange(newText, valid, parsed);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(text);
      const formatted = JSON.stringify(parsed, null, 2);
      setText(formatted);
      setError(null);
      setIsValid(true);
      onChange(formatted, true, parsed);
    } catch (e) {
      // Mantém o erro atual se o JSON estiver inválido
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleFormat();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label e Ações */}
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-xs font-medium text-cyan-300">
            {label}
          </label>
        )}
        <div className="flex items-center gap-2">
          {isValid && !error && text && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Check className="h-3 w-3" />
              Válido
            </span>
          )}
          <button
            onClick={handleFormat}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50"
            title="Formatar JSON (Ctrl+Enter)"
          >
            <Wand2 className="h-3 w-3" />
            Formatar
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        spellCheck={false}
        className={cn(
          'w-full rounded-md border bg-slate-900 p-3 font-mono text-xs leading-relaxed',
          'resize-y focus:outline-none focus:ring-2',
          error
            ? 'border-red-500/50 focus:border-red-400 focus:ring-red-500/30 text-red-100'
            : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-500/50 text-slate-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{ minHeight }}
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span className="font-mono">{error}</span>
        </div>
      )}
    </div>
  );
}

// Função auxiliar de validação de schema (simplificada)
function validateSchema(data: unknown, schema: JSONSchema): string[] {
  const errors: string[] = [];
  
  if (schema.required) {
    if (typeof data !== 'object' || data === null) {
      errors.push('Dados devem ser um objeto');
    } else {
      const obj = data as Record<string, unknown>;
      for (const field of schema.required) {
        if (!(field in obj)) {
          errors.push(`Campo obrigatório ausente: "${field}"`);
        }
      }
    }
  }
  
  return errors;
}
