// frontend/src/components/agents/AuditMetadataDisplay.tsx
import React from 'react';
import { Clock, RefreshCw, User, Hash } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import type { AuditMetadata } from '../../types/ui.js';

export type AuditMetadataDisplayProps = {
  metadata: AuditMetadata;
  variant?: 'row' | 'badges' | 'compact';
  showVersion?: boolean;
  className?: string;
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return formatDate(dateString);
}

export function AuditMetadataDisplay({
  metadata,
  variant = 'row',
  showVersion = true,
  className
}: AuditMetadataDisplayProps) {
  const { createdAt, updatedAt, createdBy, updatedBy, version } = metadata;
  const hasBeenUpdated = createdAt !== updatedAt;

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 text-xs text-slate-500', className)}>
        <span title={`Criado em ${formatDate(createdAt)}`}>
          <Clock className="inline h-3 w-3 mr-1" />
          {formatRelative(createdAt)}
        </span>
        {hasBeenUpdated && (
          <span title={`Atualizado em ${formatDate(updatedAt)}`}>
            <RefreshCw className="inline h-3 w-3 mr-1" />
            {formatRelative(updatedAt)}
          </span>
        )}
        {showVersion && (
          <span>
            <Hash className="inline h-3 w-3 mr-1" />
            v{version}
          </span>
        )}
      </div>
    );
  }

  // Badges variant
  if (variant === 'badges') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          Criado: {formatDate(createdAt)}
        </span>
        {createdBy && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-400">
            <User className="h-3 w-3" />
            Por: {createdBy}
          </span>
        )}
        {hasBeenUpdated && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-900/30 border border-cyan-500/30 px-2.5 py-1 text-xs text-cyan-400">
            <RefreshCw className="h-3 w-3" />
            Atualizado: {formatDate(updatedAt)}
          </span>
        )}
        {showVersion && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-900/30 border border-green-500/30 px-2.5 py-1 text-xs text-green-400">
            <Hash className="h-3 w-3" />
            v{version}
          </span>
        )}
      </div>
    );
  }

  // Row variant (default)
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400', className)}>
      <div className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-slate-500" />
        <span>Criado: {formatDate(createdAt)}</span>
        {createdBy && (
          <span className="text-slate-500">por {createdBy}</span>
        )}
      </div>
      
      {hasBeenUpdated && (
        <div className="flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5 text-cyan-500/70" />
          <span>Atualizado: {formatDate(updatedAt)}</span>
          {updatedBy && updatedBy !== createdBy && (
            <span className="text-slate-500">por {updatedBy}</span>
          )}
        </div>
      )}
      
      {showVersion && (
        <div className="flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5 text-green-500/70" />
          <span className="text-green-400/80">v{version}</span>
        </div>
      )}
    </div>
  );
}
