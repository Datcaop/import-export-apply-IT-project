'use client';

import { type ReactNode, useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, children, footer, width = '560px' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="border-none rounded-[10px] p-0 text-text bg-surface shadow-[0_12px_40px_rgba(27,39,51,0.25)] backdrop:bg-[rgba(27,39,51,0.45)] focus:outline-none"
      style={{ width, maxWidth: 'calc(100vw - 32px)' }}
      onClose={onClose}
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === ref.current) onClose();
      }}
    >
      {/* Head */}
      <div className="flex items-center justify-between px-5 py-[18px] border-b border-border">
        <h2 className="m-0 text-base font-semibold text-text">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-alt text-text-muted cursor-pointer border-none bg-transparent text-lg"
          aria-label="Đóng"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="flex justify-end gap-2.5 px-5 py-3.5 border-t border-border bg-surface-alt rounded-b-[10px]">
          {footer}
        </div>
      )}
    </dialog>
  );
}
