// components/FAB.tsx — botón flotante cámara, 56pt circular, fixed bottom-center
"use client";

import { motion } from "framer-motion";
import { Camera } from "lucide-react";

interface FABProps {
  onPress: () => void;
  ariaLabel?: string;
  className?: string;
}

export default function FAB({
  onPress,
  ariaLabel = "Escanear comida",
  className = "",
}: FABProps) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onPress}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={`fixed bottom-[88px] left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-white shadow-fab ${className}`}
    >
      <Camera className="h-6 w-6" />
    </motion.button>
  );
}