"use client";

import { useSession } from "next-auth/react";
import { useSpotifyPlayerSync } from "@/hooks/useSpotifyPlayerSync";

export default function SDKProvider() {
  const { data: session } = useSession();

  const accessToken = session && typeof session === "object" ? session.accessToken : null;

  useSpotifyPlayerSync(accessToken);

  return null;
}
