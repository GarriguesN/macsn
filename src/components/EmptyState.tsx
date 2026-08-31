// components/EmptyState.tsx — icono 80pt + headline + subhead + CTA opcional

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-grouped-bg">
        <Icon className="h-10 w-10 text-label-tertiary" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="text-headline font-semibold text-label">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-subhead text-label-secondary">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}