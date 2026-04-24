"use client";

import { FiSearch } from "react-icons/fi";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  placeholder: string;
}

export default function SearchBar({ query, setQuery, placeholder }: SearchBarProps) {
  return (
    <div className={styles.searchHeader}>
      <div className={styles.searchBoxMinimal}>
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>
    </div>
  );
}
