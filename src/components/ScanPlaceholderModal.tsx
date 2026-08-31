// components/ScanPlaceholderModal.tsx — modal del FAB (scan real es ticket #2)
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, X } from "lucide-react";
import PrimaryButton from "@/components/PrimaryButton";

interface ScanPlaceholderModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ScanPlaceholderModal({
  open,
  onClose,
}: ScanPlaceholderModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-t-lg bg-surface p-6 pb-safe shadow-lg"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Escanear comida"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-title-3 font-semibold text-label">
                Escanear
              </h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-grouped-bg text-label-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3 py-6">
              <Camera
                className="h-10 w-10 text-label-tertiary"
                strokeWidth={1.5}
              />
              <p className="max-w-[280px] text-center text-subhead text-label-secondary">
                El escaneo con foto llega en la próxima actualización.
              </p>
            </div>
            <PrimaryButton title="Entendido" onPress={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}