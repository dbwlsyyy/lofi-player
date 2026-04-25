"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { FiHome, FiLogOut } from "react-icons/fi";
import styles from "./TopNav.module.css";
import { useUiStore } from "@/store/useUiStore";

export default function TopNav() {
  const pathname = usePathname();
  const { isRelaxMode } = useUiStore();

  const { status } = useSession();

  if (status !== "authenticated") return null;
  if (isRelaxMode) return null;

  return (
    <div className={styles.navContainer}>
      <Link
        href="/home"
        className={styles.iconBtn}
        title="홈으로"
        prefetch={true}
      >
        <FiHome />
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className={styles.iconBtn}
        title="로그아웃"
      >
        <FiLogOut />
      </button>
    </div>
  );
}
