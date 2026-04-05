import React from "react";
import { AlertCircle, X, Check } from "lucide-react";
import clsx from "clsx";

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Да, подтвердить", 
  cancelText = "Отмена",
  variant = "primary" // primary, danger
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div 
        className="card w-full max-w-md overflow-hidden shadow-2xl border-surface-400 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-surface-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx(
              "p-2 rounded-lg",
              variant === "danger" ? "bg-red-500/10 text-red-400" : "bg-[#C1F11D]/10 text-[#C1F11D]"
            )}>
              <AlertCircle size={20} />
            </div>
            <h3 className="font-bold text-white text-lg">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6 font-medium text-gray-300 leading-relaxed">
          {message}
        </div>

        <div className="px-6 py-4 bg-surface-300 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-surface-400 transition-all border border-transparent"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={clsx(
              "px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg",
              variant === "danger" 
                ? "bg-red-500 text-white hover:bg-red-600" 
                : "bg-[#C1F11D] text-black hover:bg-[#a8d619]"
            )}
          >
            {variant === "danger" ? <X size={16} /> : <Check size={16} />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
