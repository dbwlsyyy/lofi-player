import axios from "axios";
import { usePlayerStore } from "@/store/usePlayerStore";
import { uiToast } from "@/lib/toasts";
import { signOut } from "next-auth/react";

const BASE_URL = "https://api.spotify.com/v1";

export function createSpotifyClient(accessToken: string) {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.response.use(
    (response) => {
      // 에러가 없는 정상적인 응답은 그냥 통과
      return response;
    },
    (error) => {
      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }

      if (error.response?.status === 401) {
        console.warn("스포티파이 세션이 만료되었습니다.");

        const store = usePlayerStore.getState();

        store.setIsPlaying(false);
        store.setPlayerInstance(null);

        uiToast.error("세션이 만료되었습니다. 다시 로그인해주세요.", "auth-401");

        signOut({ callbackUrl: "/home" });
      }

      // 401이 아닌 다른 에러이거나 401 처리가 끝난 후에는
      // 컴포넌트의 catch 블록에서 마저 처리할 수 있도록 에러를 다시 던져줌
      return Promise.reject(error);
    },
  );

  return instance;
}
