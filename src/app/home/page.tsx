"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { fetchMe, fetchPlaylists } from "@/apis/userApi";
import styles from "./Home.module.css";
import Image from "next/image";
import { useUIStore } from "@/store/useUiStore";
import LoadingSpinner from "@/components/loading/LoadingSpinner/LoadingSpinner";
import NavToggle from "../../components/common/NavToggle/NavToggle";
import LoginHero from "./components/LoginHero/LoginHero";
import { SpotifyPlaylistItem, SpotifyUser } from "@/types/api";
import Link from "next/link";
import axios from "axios";

export default function HomePage() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  const { isRelaxMode } = useUIStore();

  const [me, setMe] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylistItem[]>([]);
  const [error, setError] = useState("");

  const handleLogin = () => {
    signIn("spotify", { callbackUrl: "/home" });
  };

  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();

    const initUserData = async () => {
      try {
        const [profile, list] = await Promise.all([
          fetchMe(accessToken, controller.signal),
          fetchPlaylists(accessToken, controller.signal),
        ]);

        setMe(profile);
        setPlaylists(list);
      } catch (e: any) {
        if (axios.isCancel(e)) return;
        if (e.response?.status === 401) {
          handleLogin();
        } else {
          setError("Spotify 데이터를 불러오는 중 오류가 발생했습니다.");
        }
      }
    };

    initUserData();
    return () => {
      controller.abort();
    };
  }, [accessToken]);

  if (status === "loading" || (status === "authenticated" && !me)) {
    return <LoadingSpinner />;
  }

  return (
    <main className={styles.container}>
      <div className={styles.contentWrapper}>
        {!isRelaxMode && (
          <>
            <NavToggle />

            <div className={styles.section}>
              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.loginHero}>{!me && <LoginHero onLogin={handleLogin} />}</div>

              {me && (
                <>
                  <div className={styles.playlistGrid}>
                    {playlists.map((pl) => (
                      <Link
                        key={pl.id}
                        href={`/playlist/${pl.id}?name=${encodeURIComponent(pl.name)}&img=${pl.images[0]?.url}`}
                        className={styles.playlistCard}
                      >
                        <div className={styles.imageWrapper}>
                          <Image
                            src={pl.images?.[0]?.url || "/default_playlist.png"}
                            alt={pl.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            className={styles.playlistImage}
                          />
                        </div>
                        <div className={styles.playlistInfo}>
                          <h4>{pl.name}</h4>
                          <p>{pl.tracks.total} Tracks</p>
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
