"use client";

import { usePathname } from "next/navigation";
import { useUiStore } from "@/store/useUiStore";
import { ReactNode } from "react";

export default function PageWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isRelaxMode } = useUiStore();

  const isSongDetailPage = pathname.startsWith("/song/");
  const shouldRemovePadding = isRelaxMode || isSongDetailPage;

  return (
    <div
      style={
        {
          height: "100%",
          width: "100%",
          overflow: "hidden",
          "--player-padding": shouldRemovePadding ? "0px" : "12rem",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
