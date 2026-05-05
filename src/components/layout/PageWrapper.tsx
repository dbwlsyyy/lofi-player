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
      style={{
        // 조건에 따라 하단 패딩 동적 적용
        paddingBottom: shouldRemovePadding ? "0" : "12rem",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
