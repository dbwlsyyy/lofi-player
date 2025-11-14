'use client';

import { usePlayerStore } from '@/store/usePlayerStore';

export default function DebugPlayerState() {
    const { deviceId, isReady, currentTrack, isPlaying } = usePlayerStore();

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 100,
                right: 30,
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                borderRadius: '8px',
                fontSize: '16px',
            }}
        >
            <p>
                <b>deviceId:</b> {deviceId || '없음'}
            </p>
            <p>
                <b>isReady:</b> {isReady ? 'true' : 'false'}
            </p>
            <p>
                <b>isPlaying:</b> {isPlaying ? '재생 중' : '정지'}
            </p>
            <p>
                <b>곡 제목:</b> {currentTrack?.name || '없음'}
            </p>
        </div>
    );
}
