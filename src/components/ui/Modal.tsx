// components/ui/Modal.tsx — modal genérico del mockup (escáner help, reset confirm)
"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Si true, bloquea el click-on-backdrop close */
  stopPropagation?: boolean;
  children: ReactNode;
  /** z-index del backdrop */
  zIndex?: number;
}

/**
 * Modal centrado, fondo semi-transparente.
 * Coincide 1:1 con el patrón del mockup: max-width 320px, padding 24px,
 * border-radius 20px, box-shadow 0 20px 60px rgba(0,0,0,0.3).
 */
export default function Modal({
  open,
  onClose,
  stopPropagation = true,
  children,
  zIndex = 400,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.55)", zIndex }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => stopPropagation && e.stopPropagation()}
            className="bg-white"
            style={{
              borderRadius: "20px",
              padding: "24px",
              width: "100%",
              maxWidth: "320px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}