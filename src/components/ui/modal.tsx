"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, AlertTriangle } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  hasUnsavedChanges?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  hasUnsavedChanges = false,
}) => {
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);

  // Reset discard prompt when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setShowDiscardPrompt(false);
    }
  }, [isOpen]);

  const handleAttemptClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowDiscardPrompt(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleConfirmDiscard = () => {
    setShowDiscardPrompt(false);
    onClose();
  };

  const handleCancelDiscard = () => {
    setShowDiscardPrompt(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDiscardPrompt) {
          setShowDiscardPrompt(false);
        } else {
          handleAttemptClose();
        }
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleAttemptClose, showDiscardPrompt]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#242321]/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={handleAttemptClose}
      />

      {/* Modal Dialog Surface */}
      <div
        className={cn(
          "relative w-full bg-[#FFFEFC] rounded-2xl shadow-[0_20px_40px_-15px_rgba(36,35,33,0.12)] border border-[#EAE5DD] z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150",
          maxWidths[maxWidth]
        )}
      >
        {/* Unsaved Changes Warning Banner */}
        {showDiscardPrompt && (
          <div className="bg-[#FFF8F0] border-b border-[#EAE5DD] px-6 py-2.5 flex items-center justify-between text-xs text-[#242321] animate-in slide-in-from-top duration-150 z-20">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-[#C48436] shrink-0" />
              <span>You have unsaved changes. Discard and close?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCancelDiscard}
                className="px-2.5 py-1 text-xs font-semibold bg-[#FFFEFC] border border-[#EAE5DD] rounded-md text-[#242321] hover:bg-[#F5F2EC] cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-2.5 py-1 text-xs font-bold bg-[#B8594D] hover:bg-[#9E453A] text-white rounded-md cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {(title || description) && (
          <div className="px-6 py-4.5 border-b border-[#EAE5DD] flex items-start justify-between bg-[#F8F6F1]">
            <div>
              {title && <h3 className="text-base font-bold text-[#242321]">{title}</h3>}
              {description && <p className="text-xs text-[#77736C] mt-0.5">{description}</p>}
            </div>
            <button
              onClick={handleAttemptClose}
              className="p-1 rounded-lg text-[#77736C] hover:text-[#242321] hover:bg-[#F5F2EC] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto max-h-[80vh] text-[#242321]">{children}</div>
        {footer && (
          <div className="px-6 py-4 bg-[#F8F6F1]/80 border-t border-[#EAE5DD] flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

