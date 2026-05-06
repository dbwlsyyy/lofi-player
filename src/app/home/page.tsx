"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { fetchMe, fetchMyPlaylistList } from "@/apis/userApi";
import styles from "./Home.module.css";
import Image from "next/image";
import { useUiStore } from "@/store/useUiStore";
import LoadingSpinner from "@/components/loading/LoadingSpinner/LoadingSpinner";
import NavToggle from "../../components/common/NavToggle/NavToggle";
import LoginHero from "./components/LoginHero/LoginHero";
import { User, Playlist } from "@/types/domainTypes";
import Link from "next/link";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { usePlayerStore } from "@/store/usePlayerStore";
import ErrorUi from "@/components/common/ErrorUi/ErrorUi";
import LoadingDots from "@/components/loading/LoadingDots/LoadingDots";

export default function HomePage() {
  const accessToken = usePlayerStore((state) => state.accessToken);
  const { isRelaxMode } = useUiStore();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: ({ signal }) => fetchMe(accessToken!, signal),
    enabled: !!accessToken,
    staleTime: Infinity,
  });

  const {
    data: playlists,
    status,
    error,
    fetchStatus,
  } = useQuery({
    queryKey: ["myPlaylists"],
    queryFn: ({ signal }) => fetchMyPlaylistList(accessToken!, signal),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
  });

  const handleLogin = () => {
    signIn("spotify", { callbackUrl: "/home" });
  };

  const isInitialLoading = status === "pending" && fetchStatus === "fetching";
  const isAuthLoading = !!accessToken && !me;

  if (isInitialLoading || (!!accessToken && isAuthLoading && !isRelaxMode)) {
    return (
      <div className={styles.loading}>
        <LoadingDots />
      </div>
    );
  }

  if (error || !playlists) {
    return (
      <div className={styles.loading}>
        <ErrorUi error={error} />
      </div>
    );
  }
  return (
    <main className={styles.container}>
      <div className={styles.contentWrapper}>
        {!isRelaxMode && (
          <>
            <NavToggle />

            <div className={styles.section}>
              <div className={styles.loginHero}>{!me && <LoginHero onLogin={handleLogin} />}</div>
              {me && (
                <>
                  <div className={styles.playlistGrid}>
                    {playlists.map((pl) => (
                      <Link
                        key={pl.id}
                        href={`/playlist/${pl.id}?name=${encodeURIComponent(pl.name)}&img=${pl.image}`}
                        className={styles.playlistCard}
                      >
                        <div className={styles.imageWrapper}>
                          <Image
                            src={pl.image || "/default_playlist.png"}
                            alt={pl.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            className={styles.playlistImage}
                          />
                        </div>
                        <div className={styles.playlistInfo}>
                          <h4>{pl.name}</h4>
                          <p>{pl.tracksTotal} Tracks</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
