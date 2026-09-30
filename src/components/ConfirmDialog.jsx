import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action? This cannot be undone.',
  confirmText = 'Delete Record',
  cancelText = 'Cancel',
  variant = 'danger',
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            variant === 'danger'
              ? 'bg-rose-100 text-rose-600'
              : 'bg-amber-100 text-amber-600'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className={`px-4 py-2 rounded-lg text-white text-sm font-semibold shadow-sm transition ${
            variant === 'danger'
              ? 'bg-rose-600 hover:bg-rose-700'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
