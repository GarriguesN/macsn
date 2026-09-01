// components/scanner/ResetConfirm.tsx — modal "¿Restablecer onboarding?"
"use client";

import Modal from "@/components/ui/Modal";

interface ResetConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ResetConfirm({
  open,
  onClose,
  onConfirm,
}: ResetConfirmProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div
        style={{
          fontSize: "18px",
          fontWeight: 800,
          color: "#1a1a1a",
          marginBottom: "12px",
        }}
      >
        ¿Restablecer onboarding?
      </div>
      <p
        style={{
          margin: "0 0 20px 0",
          color: "#1a1a1a",
          fontSize: "14px",
          lineHeight: 1.5,
        }}
      >
        Se borrarán todos tus datos locales (perfil, objetivos, historial) y
        volverás a la pantalla de bienvenida. Esta acción no se puede deshacer.
      </p>
      <div className="flex" style={{ gap: "8px" }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancelar reset"
          className="btn-mockup flex-1 cursor-pointer border-0 rounded-xl"
          style={{
            padding: "14px",
            background: "#f5f5f5",
            color: "#1a1a1a",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          aria-label="Confirmar reset"
          className="btn-mockup flex-1 cursor-pointer border-0 rounded-xl"
          style={{
            padding: "14px",
            background: "#e81e3a",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Sí, restablecer
        </button>
      </div>
    </Modal>
  );
}