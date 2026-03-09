// 모달 상태, 사이드바, 뷰 모드 등 uiStore 전용 타입

export interface UIState {
  isRelaxMode: boolean;
  toggleRelaxMode: () => void;

  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}
