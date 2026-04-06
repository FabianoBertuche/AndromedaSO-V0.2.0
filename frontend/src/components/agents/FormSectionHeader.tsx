// frontend/src/components/agents/FormSectionHeader.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info';

export type FormSectionHeaderProps = {
  title: string;
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant: BadgeVariant;
  };
  actions?: React.ReactNode;
  className?: string;
};

const badgeStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
};

export function FormSectionHeader({
  title,
  icon: Icon,
  badge,
  actions,
  className
}: FormSectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between pb-3 border-b border-cyan-500/20',
        className
      )}
    >
      {/* Left: Icon + Title + Badge */}
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-4 w-4 text-cyan-400" />
        )}
        <h3 className="text-sm font-semibold text-cyan-300">
          {title}
        </h3>
        {badge && (
          <span
            className={cn(
              'px-2 py-0.5 text-xs font-medium rounded border',
              badgeStyles[badge.variant]
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
