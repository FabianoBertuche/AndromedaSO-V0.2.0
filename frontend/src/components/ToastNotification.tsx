import { useEffect } from 'react';

interface ToastNotificationProps {
  message: string;
  onClose: () => void;
  durationMs?: number;
}

export function ToastNotification({ message, onClose, durationMs = 5000 }: ToastNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-start gap-2 rounded border border-red-500/70 bg-red-500/10 px-4 py-3 font-mono text-sm text-red-300 shadow-lg">
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-red-400 hover:text-red-200"
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  );
}
