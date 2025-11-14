export function loadSpotifySdk(): Promise<void> {
    if (typeof window !== 'undefined' && window._spotifySdkLoadPromise) {
        return window._spotifySdkLoadPromise;
    }

    const sdkLoadPromise = new Promise<void>((resolve, reject) => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            reject(new Error('Spotify SDK must run in a browser'));
            return;
        }

        if (window.Spotify) {
            resolve();
            return;
        }

        window.onSpotifyWebPlaybackSDKReady = () => {
            resolve();
        };

        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        script.defer = true;

        script.onerror = () => reject(new Error('Failed to load Spotify SDK'));

        document.body.appendChild(script);
    });

    window._spotifySdkLoadPromise = sdkLoadPromise;

    return sdkLoadPromise;
}
