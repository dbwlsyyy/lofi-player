"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { fetchMe, fetchPlaylists } from "@/apis/userApi";
import styles from "./Home.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/useUiStore";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import NavToggle from "./components/NavToggle/NavToggle";
import LoginHero from "./components/LoginHero/LoginHero";
import { SpotifyPlaylistItem, SpotifyUser } from "@/types/api";

export default function HomePage() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const router = useRouter();

  const { isRelaxMode } = useUIStore();

  const [me, setMe] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylistItem[]>([]);
  const [error, setError] = useState("");

  const handleLogin = () => {
    signIn("spotify", { callbackUrl: "/home" });
  };

  useEffect(() => {
    if (!accessToken) return;

    (async () => {
      try {
        const [profile, list] = await Promise.all([
          fetchMe(accessToken),
          fetchPlaylists(accessToken),
        ]);
        setMe(profile);
        setPlaylists(list);
      } catch (e: any) {
        if (e.response?.status === 401) {
          handleLogin();
        } else {
          setError("Spotify 데이터를 불러오는 중 오류가 발생했습니다.");
        }
      }
    })();
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

              <div className={styles.loginHero}>
                {!me && <LoginHero onLogin={handleLogin} />}
              </div>

              {me && (
                <>
                  <div className={styles.playlistGrid}>
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        className={styles.playlistCard}
                        onClick={() =>
                          router.push(
                            `/playlist/${pl.id}?name=${encodeURIComponent(pl.name)}&img=${pl.images[0]?.url}`,
                          )
                        }
                      >
                        <div className={styles.imageWrapper}>
                          <Image
                            src={pl.images?.[0]?.url || "/default_playlist.png"}
                            alt={pl.name}
                            fill
                            className={styles.playlistImage}
                          />
                        </div>
                        <div className={styles.playlistInfo}>
                          <h4>{pl.name}</h4>
                          <p>{pl.tracks.total} Tracks</p>
                        </div>
                      </div>
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
