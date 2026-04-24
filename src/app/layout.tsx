import PlayerBar from "../components/layout/PlayerBar/PlayerBar";
import "./globals.css";
import SDKProvider from "./SDKProvider";
import { NextAuthProvider } from "./providers";
import { ReactNode } from "react";
import QueueSidebar from "@/components/layout/QueueSidebar/QueueSidebar";
import { Toaster } from "react-hot-toast";
import ToggleBtn from "@/components/layout/ToggleBtn/ToggleBtn";
import GlobalBackground from "@/components/layout/GlobalBackground/GlobalBackground";
import TopNav from "@/components/layout/TopNav/TopNav";

export const metadata = {
  title: "Lofi Player",
  description: "Lo-Fi 음악 감상 웹앱",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <NextAuthProvider>
          <GlobalBackground />

          <SDKProvider />
          <TopNav />
          {children}
          <ToggleBtn />
          <Toaster position="top-center" />
          <QueueSidebar />
          <PlayerBar />
        </NextAuthProvider>
      </body>
    </html>
  );
}
