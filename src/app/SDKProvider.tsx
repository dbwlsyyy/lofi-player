"use client";

import { useSession } from "next-auth/react";
import { useSpotifyPlayerSync } from "@/hooks/useSpotifyPlayerSync";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useEffect } from "react";

export default function SDKProvider() {
  const { data: session } = useSession();

  const accessToken = session && typeof session === "object" ? session.accessToken : null;

  const setAccessToken = usePlayerStore((state) => state.setAccessToken);

  useEffect(() => {
    if (accessToken) {
      setAccessToken(accessToken);
    } else {
      setAccessToken(null); // 로그아웃 대비 초기화
    }
  }, [accessToken, setAccessToken]);

  useSpotifyPlayerSync(accessToken);

  return null;
}
