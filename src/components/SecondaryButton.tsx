// components/SecondaryButton.tsx — tinted (texto primary sobre fondo primary translúcido)
"use client";

import { motion } from "framer-motion";
import { Loader2, type LucideIcon } from "lucide-react";

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export default function SecondaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
}: SecondaryButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onPress}
      disabled={disabled || loading}
      className={`flex h-[50px] w-full items-center justify-center gap-2 rounded-md bg-primary/10 text-headline font-semibold text-primary-dark disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : Icon ? (
        <Icon className="h-5 w-5" />
      ) : null}
      {title}
    </motion.button>
  );
}