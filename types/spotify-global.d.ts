declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: typeof Spotify;
    _spotifySdkLoadPromise?: Promise<void>;
  }
}

export {};
