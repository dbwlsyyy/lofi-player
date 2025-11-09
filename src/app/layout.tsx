import './globals.css';
import { NextAuthProvider } from './providers';
import { ReactNode } from 'react';

export const metadata = { title: 'Lofi Player', description: 'Spotify player' };

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ko">
            <body>
                <NextAuthProvider>{children}</NextAuthProvider>
            </body>
        </html>
    );
}
