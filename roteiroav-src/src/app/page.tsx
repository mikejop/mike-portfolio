"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const setCurrentApp = useAppStore((state) => state.setCurrentApp);

  useEffect(() => {
    setCurrentApp(null);
    router.replace("/tools/script-editor/");
  }, [setCurrentApp, router]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl gap-4">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 text-2xl font-black tracking-tight mb-2 animate-pulse">
          AV
        </div>
        <div className="flex items-center justify-center gap-3 text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>Carregando Roteiro AV...</span>
        </div>
      </div>
    </div>
  );
}
