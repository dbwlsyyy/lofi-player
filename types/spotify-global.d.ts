declare global {
    interface Window {
        onSpotifyWebPlaybackSDKReady?: () => void;
        Spotify?: any;
        _spotifySdkLoadPromise?: Promise<void>;
    }
}

export {};
