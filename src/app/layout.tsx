import PlayerBar from './components/PlayerBar/PlayerBar';
import './globals.css';
import { NextAuthProvider } from './providers';
import { ReactNode } from 'react';

export const metadata = {
    title: 'Lofi Player',
    description: 'Lo-Fi 음악 감상 웹앱',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ko">
            <body>
                <NextAuthProvider>
                    {children}
                    <PlayerBar />
                </NextAuthProvider>
            </body>
        </html>
    );
}
