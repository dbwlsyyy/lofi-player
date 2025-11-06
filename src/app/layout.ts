import '@/app/globals.css';
import { NextAuthProvider } from './providers';

export const metadata = { title: 'Lofi Player', description: 'Spotify player' };

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
            <body>
                <NextAuthProvider>{children}</NextAuthProvider>
            </body>
        </html>
    );
}
