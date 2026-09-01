// components/scanner/ScannerHelp.tsx — modal "Consejos para escanear"
"use client";

import Modal from "@/components/ui/Modal";
import PrimaryButton from "@/components/ui/PrimaryButton";

interface ScannerHelpProps {
  open: boolean;
  onClose: () => void;
}

export default function ScannerHelp({ open, onClose }: ScannerHelpProps) {
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
        Consejos para escanear
      </div>
      <ul
        style={{
          margin: "0 0 18px 0",
          paddingLeft: "20px",
          color: "#1a1a1a",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        <li>Encuadra todo el plato dentro del marco.</li>
        <li>Busca buena luz natural o activa la linterna.</li>
        <li>Mantén el teléfono paralelo a la mesa.</li>
        <li>Acerca más la cámara si la comida es pequeña.</li>
      </ul>
      <PrimaryButton onClick={onClose} ariaLabel="Cerrar ayuda">
        Entendido
      </PrimaryButton>
    </Modal>
  );
}