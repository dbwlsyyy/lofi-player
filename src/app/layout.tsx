import PlayerBar from '../components/PlayerBar/PlayerBar';
import './globals.css';
import SDKProvider from './SDKProvider';
import { NextAuthProvider } from './providers';
import { ReactNode } from 'react';
import QueueSidebar from '@/components/QueueSidebar/QueueSidebar';
import { Toaster } from 'react-hot-toast';
import ToggleBtn from '@/components/ToggleBtn/ToggleBtn';
import GlobalBackground from '@/components/GlobalBackground/GlobalBackground'; // 추가

export const metadata = {
    title: 'Lofi Player',
    description: 'Lo-Fi 음악 감상 웹앱',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ko">
            <body>
                <NextAuthProvider>
                    <GlobalBackground />

                    <SDKProvider />
                    <ToggleBtn />

                    {children}

                    <Toaster position="top-center" />
                    <QueueSidebar />
                    <PlayerBar />
                </NextAuthProvider>
            </body>
        </html>
    );
}
