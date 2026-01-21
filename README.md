
# 🎧 Lofi Spotify Web Player

Next.js와 Spotify Web API를 활용한 **몰입형 음악 스트리밍 웹 플레이어**입니다. 단순한 플레이어를 넘어 Spotify SDK와의 실시간 연동 및 감성적인 UI/UX를 목표로 제작되었습니다.

<br />

## 🛠 Tech Stack

* **Framework**: Next.js 14+ (App Router)
* **State Management**: Zustand (Global Player State)
* **API / SDK**: Spotify Web API & Web Playback SDK
* **Styling**: CSS Modules (Glassmorphism & Responsive Design)
* **Auth**: Next-Auth (Spotify Provider)

<br />

## ✨ Key Features

### 1. 전역 재생 시스템 (Global Player)

* **Real-time Sync**: 스토어(Zustand) 기반의 실시간 상태 동기화
* **Playback Control**: 재생/일시정지, 이전/다음 곡, 셔플 및 반복 재생 모드 등 기능
* **Queue Management**: 현재 재생 목록(Queue) 사이드바 및 상세 리스트 연동

### 2. 비주얼 릴렉스 모드 (Visual Relax Mode)
* **Atmospheric Shift**: 'Relax' 버튼 클릭 시 배경 비디오의 블러 및 명암이 실시간으로 조절되어 음악을 틀고 작업하기에 집중할 수 있는 환경 제공을 목표


### 3. 플레이리스트 관리 (Playlist Management)

* **CRUD**: 플레이리스트 이름 수정 및 트랙 삭제 기능 (Spotify 서버 실시간 반영)
* **Metadata**: 플레이리스트 내 곡 개수 및 총 재생 시간 자동 계산 유틸리티

### 4. 몰입형 상세 페이지 (Song Detail)

* **Dynamic Visuals**: 앨범 아트 기반의 블러 배경 및 오버레이 적용
* **Smooth UX**: 페이지 진입/이탈 애니메이션(Slide up/down) 및 재생 상태별 앨범 아트 트랜지션

<br />

## 🚀 Demo & Presentation

- 시연 영상: [ https://drive.google.com/file/d/1cmmQYXsAXm1wedzEEekXYjXBFxrjfGzn/view?usp=sharing ]

※ Note: 본 서비스는 Spotify API 권한 문제로 인해 개발자 대시보드에 등록된 사용자(스포티파이 프리미엄 결제 유저)만 모든 기능을 이용할 수 있습니다.

(영상 확인 시 로그인 없이 주요 기능을 빠르게 확인하실 수 있습니다. 위 첨부 링크를 통해 시연 영상 참고 부탁드리겠습니다.)

<br />

## 🚀 Getting Started

1. **환경 변수 설정**: `.env.local` 파일에 Spotify Developer Dashboard에서 발급받은 키를 입력합니다.
```text
SPOTIFY_CLIENT_ID=your_id
SPOTIFY_CLIENT_SECRET=your_secret
NEXTAUTH_SECRET=your_nextauth_secret

```


2. **의존성 설치**:
```bash
npm install

```


3. **개발 서버 실행**:
```bash
npm run dev

```

