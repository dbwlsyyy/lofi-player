let sdkLoadPromise: Promise<void> | null = null;

export function loadSpotifySdk(): Promise<void> {
    if (sdkLoadPromise) return sdkLoadPromise;

    sdkLoadPromise = new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && window.Spotify) {
            resolve();
            return;
        }

        if (typeof window === 'undefined' || typeof document === 'undefined') {
            reject(new Error('Spotify SDK can only be loaded in the browser.'));
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;

        script.onload = () => {
            window.onSpotifyWebPlaybackSDKReady = () => {
                resolve();
            };
        };

        script.onerror = () => {
            reject(new Error('Failed to load Spotify Web Playback SDK'));
        };

        document.body.appendChild(script);
    });

    return sdkLoadPromise;
}
