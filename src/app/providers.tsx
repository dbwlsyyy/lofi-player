'use client';
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { LazyMotion, domMax } from "framer-motion";

export function NextAuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LazyMotion features={domMax} strict>
        {children}
      </LazyMotion>
    </SessionProvider>
  );
}
