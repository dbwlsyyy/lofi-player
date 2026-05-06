"use client";

import { FiSearch, FiX } from "react-icons/fi";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  clearSearch: () => void;
  placeholder: string;
}

export default function SearchBar({ query, setQuery, clearSearch, placeholder }: SearchBarProps) {
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
        <FiX
          className={styles.clearIcon}
          onClick={clearSearch}
        />
      </div>
    </div>
  );
}
