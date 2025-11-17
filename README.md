# MediaPipe 가상 의류 착용 시스템
## Virtual Clothing Try-On System

웹캠 영상 위에 3D 의상을 실시간으로 리깅하여 오버레이하는 가상 의류 착용 데모

---

## 🎯 프로젝트 개요

MediaPipe Pose와 Three.js를 활용하여 사용자의 신체 움직임을 실시간으로 추적하고, 3D 의상 모델을 자연스럽게 오버레이하는 웹 기반 가상 피팅 시스템입니다.

### 주요 기능

✅ **실시간 포즈 검출** - MediaPipe Pose를 이용한 33개 신체 랜드마크 검출
✅ **3D 의상 렌더링** - Three.js 기반 3D 그래픽 렌더링
✅ **지능형 리깅** - 신체 움직임에 따른 의상 변형 및 추적
✅ **디버그 모드** - 스켈레톤 시각화로 랜드마크 확인
✅ **성능 모니터링** - 실시간 FPS 표시

---

## 🛠️ 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| **MediaPipe Pose** | Latest (CDN) | 신체 랜드마크 검출 |
| **Three.js** | r150 | 3D 렌더링 |
| **Vanilla JavaScript** | ES6+ | 모듈화된 코드 구조 |
| **HTML5 Canvas** | - | 웹캠 영상 및 디버그 표시 |

---

## 📁 프로젝트 구조

```
mediapipe_js/
├── index.html              # 메인 HTML 엔트리 포인트
├── css/
│   └── styles.css          # UI 스타일링
├── js/
│   ├── main.js             # 애플리케이션 컨트롤러
│   ├── webcam.js           # 웹캠 캡처 모듈
│   ├── pose-detector.js    # MediaPipe Pose 검출
│   ├── renderer.js         # Three.js 렌더러
│   ├── clothing-rigger.js  # 의상 리깅 시스템
│   └── utils.js            # 유틸리티 함수
└── README.md               # 프로젝트 문서
```

---

## 🚀 시작하기

### 1. 요구사항

- **웹 브라우저**: Chrome, Edge (WebGL 2.0 지원)
- **HTTPS 환경** 또는 **localhost** (웹캠 접근 권한 필요)
- **로컬 웹 서버** (파일 프로토콜 미지원)

### 2. 설치 및 실행

#### 방법 1: Python 간이 서버 (추천)

```bash
# Python 3 사용
cd mediapipe_js
python -m http.server 8000

# 브라우저에서 접속
http://localhost:8000
```

#### 방법 2: Node.js http-server

```bash
# http-server 설치
npm install -g http-server

# 서버 실행
cd mediapipe_js
http-server -p 8000

# 브라우저에서 접속
http://localhost:8000
```

#### 방법 3: VS Code Live Server

1. VS Code 확장: "Live Server" 설치
2. `index.html` 우클릭 → "Open with Live Server"

### 3. 사용 방법

1. 웹 페이지 접속
2. **"시작"** 버튼 클릭
3. 웹캠 권한 허용
4. 카메라 앞에서 자유롭게 움직이기
5. **디버그 모드** 체크박스를 활성화하여 스켈레톤 확인

---

## 🎮 조작 방법

| 컨트롤 | 설명 |
|--------|------|
| **시작 버튼** | 웹캠 및 포즈 검출 시작 |
| **중지 버튼** | 데모 중지 |
| **디버그 모드** | 스켈레톤 오버레이 표시/숨김 |

---

## 📊 구현 단계 (Phase 1-5)

### Phase 1: 웹캠 + MediaPipe 통합 ✅
- 웹캠 스트림 캡처
- MediaPipe Pose 초기화
- 랜드마크 검출

### Phase 2: Three.js 씬 구성 ✅
- 3D Scene, Camera, Renderer 설정
- 웹캠 영상 배경 적용

### Phase 3: 3D 의상 모델 로드 ✅
- 간단한 큐브 기반 의상 생성
- 몸통 + 소매 구조

### Phase 4: 기본 위치 동기화 ✅
- 어깨 랜드마크 중심점 계산
- 의상 위치 실시간 업데이트

### Phase 5: 리깅 시스템 ✅
- 신체 크기에 따른 스케일 조정
- 소매 회전 및 변형
- 부드러운 움직임 (lerp 보간)

---

## 🔍 디버그 모드

디버그 모드를 활성화하면 다음 정보를 시각화합니다:

- 🟢 **초록색 선**: 신체 연결선 (스켈레톤)
- 🔴 **빨간색 점**: 33개 랜드마크
- 🔢 **숫자**: 주요 랜드마크 인덱스 (11-28)

### 주요 랜드마크 인덱스

| 인덱스 | 신체 부위 |
|--------|-----------|
| 11, 12 | 어깨 (좌, 우) |
| 13, 14 | 팔꿈치 (좌, 우) |
| 15, 16 | 손목 (좌, 우) |
| 23, 24 | 엉덩이 (좌, 우) |
| 25, 26 | 무릎 (좌, 우) |

---

## ⚙️ 성능 최적화

### 목표 성능 지표

- **FPS**: ≥ 30fps
- **Latency**: < 100ms
- **메모리**: < 500MB

### 최적화 팁

1. **브라우저 하드웨어 가속 활성화**
   - Chrome: `chrome://flags` → GPU 가속 ON

2. **웹캠 해상도 조정** (js/webcam.js:19-21)
   ```javascript
   video: {
       width: { ideal: 1280 },  // 낮추면 성능 향상
       height: { ideal: 720 }
   }
   ```

3. **MediaPipe 모델 복잡도 조정** (js/pose-detector.js:25)
   ```javascript
   modelComplexity: 1  // 0: Lite, 1: Full, 2: Heavy
   ```

---

## 🧩 모듈 설명

### webcam.js
웹캠 스트림 획득 및 관리

**주요 메서드:**
- `setupCamera()`: 웹캠 초기화
- `getVideoSize()`: 비디오 해상도 반환
- `stop()`: 웹캠 중지

### pose-detector.js
MediaPipe Pose 기반 신체 랜드마크 검출

**주요 메서드:**
- `initialize()`: MediaPipe 초기화
- `detectPose(video)`: 포즈 검출
- `drawSkeleton(ctx, width, height)`: 디버그 시각화

### renderer.js
Three.js 3D 렌더링 파이프라인

**주요 메서드:**
- `initialize(w, h)`: Scene/Camera/Renderer 설정
- `createSimpleClothing()`: 간단한 의상 모델 생성
- `render()`: 프레임 렌더링

### clothing-rigger.js
신체 랜드마크와 의상 모델 매핑 및 변형

**주요 메서드:**
- `updateClothingPose(landmarks, model, w, h)`: 의상 포즈 업데이트
- `updateBodyScale()`: 신체 크기 기반 스케일 조정
- `updateSleeves()`: 소매 회전 및 변형

### utils.js
범용 유틸리티 함수

**주요 함수:**
- `FPSCalculator`: FPS 계산기
- `lerp(a, b, t)`: 선형 보간
- `distance(p1, p2)`: 두 점 간 거리
- `midpoint(p1, p2)`: 중점 계산

---

## 🐛 문제 해결

### 웹캠이 작동하지 않음
- 브라우저 설정에서 카메라 권한 확인
- HTTPS 또는 localhost 환경인지 확인
- 다른 앱에서 웹캠을 사용 중인지 확인

### FPS가 낮음 (< 20fps)
- 웹캠 해상도를 낮춤 (720p → 480p)
- MediaPipe `modelComplexity`를 0으로 변경
- 다른 탭/프로그램 종료

### 의상이 제대로 따라오지 않음
- 조명이 충분한 환경에서 테스트
- 카메라에서 1.5~2m 거리 유지
- 전신이 화면에 들어오도록 위치 조정

---

## 🔮 향후 개선 사항

- [ ] GLTF 형식의 실제 의상 모델 지원
- [ ] 다양한 의상 선택 UI
- [ ] 의상 색상/텍스처 변경 기능
- [ ] 손 제스처를 통한 의상 교체
- [ ] 스크린샷/녹화 기능
- [ ] 모바일 브라우저 최적화
- [ ] 복수 인물 동시 검출

---

## 📄 라이선스

이 프로젝트는 교육 및 연구 목적으로 제작되었습니다.

---

## 🙏 참고 자료

- [MediaPipe Pose](https://google.github.io/mediapipe/solutions/pose.html)
- [Three.js Documentation](https://threejs.org/docs/)
- [WebGL Fundamentals](https://webglfundamentals.org/)

---

**제작일**: 2025
**버전**: 1.0.0 (Phase 1-5 완료)
