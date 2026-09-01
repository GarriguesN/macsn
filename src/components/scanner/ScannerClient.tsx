// components/scanner/ScannerClient.tsx — wrapper para usar Scanner como página /scanner
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Scanner from "@/components/scanner/Scanner";
import ScannedMealDetail from "@/components/meals/ScannedMealDetail";
import BottomNav from "@/components/nav/BottomNav";
import type { ScanResult, MealType } from "@/types";

export default function ScannerClient() {
  const router = useRouter();
  const [scannedOpen, setScannedOpen] = useState(false);
  const [pendingScan, setPendingScan] = useState<{
    scan: ScanResult;
    mealType: MealType;
  } | null>(null);

  return (
    <>
      <Scanner
        open={true}
        onClose={() => router.back()}
        defaultMealType={inferMealType()}
        onCaptured={(scan, mealType) => {
          setPendingScan({ scan, mealType });
          setScannedOpen(true);
        }}
      />
      <ScannedMealDetail
        open={scannedOpen}
        onClose={() => {
          setScannedOpen(false);
          setPendingScan(null);
          router.push("/");
        }}
        draft={pendingScan?.scan ?? null}
        defaultMealType={pendingScan?.mealType ?? "lunch"}
      />
      <BottomNav />
    </>
  );
}

/** Sugiere tipo de comida según la hora del día */
function inferMealType(): MealType {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}