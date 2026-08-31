// components/ScanPendingBanner.tsx — aviso de scans pendientes de sincronizar

import { Upload } from "lucide-react";

export default function ScanPendingBanner({ count }: { count: number }) {
  return (
    <div className="mt-4 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-footnote font-medium text-primary-dark">
      <Upload className="h-4 w-4 shrink-0" />
      {count === 1
        ? "1 comida pendiente de sincronizar"
        : `${count} comidas pendientes de sincronizar`}
    </div>
  );
}