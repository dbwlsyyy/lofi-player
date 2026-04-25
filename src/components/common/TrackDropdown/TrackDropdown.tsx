import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import styles from "./TrackDropdown.module.css";

interface TrackDropdownProps {
  onPlayNext?: () => void;
  onRemove?: () => void;
  onSavePlaylist?: () => void;
  type: "digging" | "queue";
}

export default function TrackDropdown({
  onPlayNext,
  onRemove,
  onSavePlaylist,
  type,
}: TrackDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 메뉴 바깥 클릭 시 닫히게
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleAction = (e: React.MouseEvent, action?: () => void) => {
    e.stopPropagation();
    setIsOpen(false);
    if (action) action(); // 전달받은 함수 실행
  };

  return (
    <div
      className={styles.dropdownContainer}
      ref={dropdownRef}
    >
      <button
        className={styles.kebabBtn}
        onClick={toggleDropdown}
      >
        <FiMoreVertical size={20} />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {/* 디깅 페이지에서만 보이는 메뉴 */}
          {type === "digging" && onPlayNext && (
            <button
              onClick={(e) => handleAction(e, onPlayNext)}
              className={styles.primaryBtn}
            >
              다음곡으로 재생
            </button>
          )}

          {/* 공통 메뉴 */}
          {onSavePlaylist && (
            <button onClick={(e) => handleAction(e, onSavePlaylist)}>플레이리스트에 저장</button>
          )}

          {/* 큐 사이드바에서만 보이는 메뉴 */}
          {type === "queue" && onRemove && (
            <button
              onClick={(e) => handleAction(e, onRemove)}
              className={styles.deleteBtn}
            >
              재생목록에서 삭제
            </button>
          )}
        </div>
      )}
    </div>
  );
}
