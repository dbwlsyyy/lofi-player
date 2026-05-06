import PlayerBar from "../components/layout/PlayerBar/PlayerBar";
import "./globals.css";
import SDKProvider from "../components/providers/SDKProvider";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import ToggleBtn from "@/components/layout/ToggleBtn/ToggleBtn";
import GlobalBackground from "@/components/layout/GlobalBackground/GlobalBackground";
import TopNav from "@/components/layout/TopNav/TopNav";
import PageWrapper from "@/components/layout/wrapper/PageWrapper";
import QueueSidebar from "@/components/layout/QueueSidebar/QueueSidebar";
import ReactQueryProvider from "@/components/providers/QueryProvider";
import { GlobalProviders } from "@/components/providers/GlobalProviders";

export const metadata = {
  title: "Lofi Player",
  description: "Lo-Fi 음악 감상 웹앱",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="preload"
          href="https://sdk.scdn.co/spotify-player.js"
          as="script"
        />
      </head>
      <body>
        <GlobalProviders>
          <ReactQueryProvider>
            <GlobalBackground />

            <SDKProvider />
            <TopNav />
            <PageWrapper>{children}</PageWrapper>
            <ToggleBtn />
            <Toaster position="top-center" />
            <QueueSidebar />
            <PlayerBar />
          </ReactQueryProvider>
        </GlobalProviders>
      </body>
    </html>
  );
}
