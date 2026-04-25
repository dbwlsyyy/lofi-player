"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiDisc, FiMusic } from "react-icons/fi";
import styles from "./NavToggle.module.css";
import { useUiStore } from "@/store/useUiStore";

export default function NavToggle() {
  const pathname = usePathname();
  const { isRelaxMode } = useUiStore();

  if (isRelaxMode) return null;

  const isHomeActive = pathname === "/home" || pathname === "/" || pathname.startsWith("/playlist");

  const isDiggingActive = pathname === "/digging";

  return (
    <nav className={styles.dockContainer}>
      <div className={styles.glassDock}>
        <Link
          href="/home"
          className={`${styles.navItem} ${isHomeActive ? styles.active : ""}`}
          prefetch={true}
        >
          <div className={styles.iconWrapper}>
            <FiMusic size="2.4rem" />
          </div>
          <span className={styles.label}>My 플리</span>
        </Link>

        <div className={styles.divider} />

        <Link
          href="/digging"
          className={`${styles.navItem} ${isDiggingActive ? styles.active : ""}`}
          prefetch={true}
        >
          <div className={styles.iconWrapper}>
            <FiDisc size="2.4rem" />
          </div>
          <span className={styles.label}>Digging</span>
        </Link>
      </div>
    </nav>
  );
}
