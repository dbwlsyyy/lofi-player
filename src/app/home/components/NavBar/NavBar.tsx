"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiDisc, FiClipboard, FiMusic } from "react-icons/fi";
import styles from "./NavBar.module.css";

export default function NavBar() {
  const pathname = usePathname();

  const isHomeActive = pathname === "/home" || pathname === "/" || pathname.startsWith("/playlist");

  const isSearchActive = pathname === "/search";

  return (
    <nav className={styles.dockContainer}>
      <div className={styles.glassDock}>
        <Link
          href="/home"
          className={`${styles.navItem} ${isHomeActive ? styles.active : ""}`}
        >
          <div className={styles.iconWrapper}>
            <FiMusic size="2.4rem" />
          </div>
          <span className={styles.label}>My 플리</span>
        </Link>

        <div className={styles.divider} />

        <Link
          href="/search"
          className={`${styles.navItem} ${isSearchActive ? styles.active : ""}`}
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
