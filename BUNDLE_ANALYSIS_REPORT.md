# 번들 분석 리포트

프로젝트의 초기 로딩 성능을 개선하기 위해 `@next/bundle-analyzer`를 사용하여 번들 사이즈를 분석한 결과입니다.

## 1. 가장 무거운 패키지 (Top 5)

| 패키지명 | Stat Size | 분석 결과 |
| :--- | :--- | :--- |
| **react-icons/fa** | ~1.6 MB | Font Awesome 아이콘 전체가 포함되어 번들 크기를 크게 증가시킴 |
| **framer-motion** | ~424 KB | 애니메이션 라이브러리로, 복잡한 컴포넌트에서 주로 사용됨 |
| **react-icons/fi** | ~292 KB | Feather 아이콘 세트 일부가 포함됨 |
| **next/dist** | ~700 KB | Next.js 프레임워크 핵심 라이브러리 |
| **react-dom** | ~545 KB | React DOM 라이브러리 |

## 2. 가장 무거운 컴포넌트 (Top 5)

| 컴포넌트명 | 경로 | Stat Size |
| :--- | :--- | :--- |
| **PlayerBar** | `src/components/layout/PlayerBar` | 15,096 B |
| **QueueSidebar** | `src/components/layout/QueueSidebar` | 10,703 B |
| **AddToPlaylistModal** | `src/components/modal/AddToPlaylistModal` | 3,603 B |
| **NavToggle** | `src/components/common/NavToggle` | 2,932 B |
| **TrackDropdown** | `src/components/common/TrackDropdown` | 2,792 B |

## 3. 주요 문제점 및 개선 방향

1.  **아이콘 라이브러리 최적화:** `react-icons/fa`와 `react-icons/fi`가 전체 번들의 상당 부분을 차지하고 있습니다. 필요한 아이콘만 개별적으로 임포트하거나, 트리 쉐이킹이 잘 작동하는지 확인이 필요합니다.
2.  **무거운 레이아웃 컴포넌트:** `PlayerBar`와 `QueueSidebar`는 초기 렌더링 시 항상 포함되지만, 특히 `QueueSidebar`나 `AddToPlaylistModal` 같은 요소는 사용자의 상호작용이 있을 때만 필요하므로 **지연 로딩(Lazy Loading)** 적용이 시급합니다.
3.  **Framer Motion:** 애니메이션이 필요한 시점에만 로드되도록 최적화가 가능합니다.

## 4. 최적화 계획

*   `QueueSidebar`, `AddToPlaylistModal` 등 상호작용 시에만 필요한 컴포넌트에 `next/dynamic`을 적용하여 초기 번들 크기를 줄입니다.
*   `PlayerBar` 내의 무거운 하위 컴포넌트들도 분리하여 지연 로딩을 검토합니다.

## 5. 추가 최적화 결과 (Framer Motion & 아이콘)

### Framer Motion 최적화
*   **LazyMotion 적용:** `framer-motion`의 모든 기능을 한꺼번에 로드하는 대신, `LazyMotion`과 `domMax`를 사용하여 필요한 시점에 애니메이션 기능을 로드하도록 개선했습니다.
*   **m 컴포넌트 사용:** `motion` 대신 가벼운 `m` 컴포넌트를 사용하여 초기 번들 크기를 줄였습니다.

### 아이콘 라이브러리 분석
*   `react-icons/fa`가 여전히 큰 비중을 차지하고 있습니다. 이는 라이브러리 구조상 트리 쉐이킹이 완벽하지 않을 때 발생하며, 향후 `lucide-react`와 같이 트리 쉐이킹이 더 우수한 라이브러리로 교체하는 것을 권장합니다.

## 6. 최종 결론
지연 로딩과 라이브러리 최적화를 통해 초기 로딩 시 사용자에게 전달되는 자바스크립트 양을 최적화했습니다. 특히 상호작용이 필요한 모달과 사이드바를 분리함으로써 첫 화면 렌더링 속도를 개선했습니다.
