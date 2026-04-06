import React, { useId, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import type { TooltipEntry } from '../../lib/tooltip-messages';

interface RichTooltipProps {
  entry?: TooltipEntry;
  children: React.ReactElement;
  widthClassName?: string;
}

export function RichTooltip({ entry, children, widthClassName = 'w-80' }: RichTooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const child = children as React.ReactElement<Record<string, unknown>>;
  const props = child.props;

  if (!entry) {
    return children;
  }

  const childProps: Record<string, unknown> = {
    onMouseEnter: composeHandlers(props.onMouseEnter as ((event: unknown) => void) | undefined, () => setOpen(true)),
    onMouseLeave: composeHandlers(props.onMouseLeave as ((event: unknown) => void) | undefined, () => setOpen(false)),
    onFocus: composeHandlers(props.onFocus as ((event: unknown) => void) | undefined, () => setOpen(true)),
    onBlur: composeHandlers(props.onBlur as ((event: unknown) => void) | undefined, () => setOpen(false)),
    onTouchStart: composeHandlers(props.onTouchStart as ((event: unknown) => void) | undefined, () => setOpen((current) => !current)),
    'aria-describedby': open ? tooltipId : props['aria-describedby'],
  };

  return (
    <span className="relative inline-flex max-w-full">
      {React.cloneElement(child, childProps)}
      {open ? <TooltipBubble id={tooltipId} entry={entry} widthClassName={widthClassName} /> : null}
    </span>
  );
}

interface TooltipIconProps {
  entry?: TooltipEntry;
  className?: string;
}

export function TooltipIcon({ entry, className = '' }: TooltipIconProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  if (!entry) {
    return null;
  }

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label={`Help: ${entry.label}`}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onTouchStart={() => setOpen((current) => !current)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open ? <TooltipBubble id={tooltipId} entry={entry} widthClassName="w-80" /> : null}
    </span>
  );
}

function TooltipBubble({ id, entry, widthClassName }: { id: string; entry: TooltipEntry; widthClassName: string }) {
  return (
    <div
      id={id}
      role="tooltip"
      className={`absolute left-0 top-full z-50 mt-2 max-w-[calc(100vw-2rem)] rounded-2xl border border-indigo-400/30 bg-slate-950/95 p-4 shadow-2xl shadow-slate-950/60 ${widthClassName}`}
    >
      <div className="text-sm font-semibold text-white">{entry.label}</div>
      {entry.details ? <div className="mt-2 text-sm leading-6 text-slate-200">{entry.details}</div> : null}
      {entry.whenToUse ? (
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs leading-5 text-slate-300">
          <span className="font-semibold text-slate-100">Quando usar:</span> {entry.whenToUse}
        </div>
      ) : null}
      {entry.example ? (
        <div className="mt-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-xs leading-5 text-indigo-100">
          <span className="font-semibold">Exemplo:</span> {entry.example}
        </div>
      ) : null}
    </div>
  );
}

function composeHandlers<T>(original: ((event: T) => void) | undefined, next: (event: T) => void) {
  return (event: T) => {
    original?.(event);
    next(event);
  };
}
