# 사용 가이드 - MediaPipe 가상 의류 착용 시스템

## 🔧 주요 수정 사항

### 1. **캔버스 위치 동기화 수정** ✅
- 디버그 캔버스와 output 캔버스가 완벽히 겹치도록 수정
- CSS에서 `z-index: 10` 추가로 스켈레톤이 위에 표시됨
- 캔버스 크기 자동 동기화

### 2. **PerspectiveCamera로 변경** ✅ (진짜 3D)
- 기존: OrthographicCamera (평면적)
- 현재: **PerspectiveCamera** (입체적)
- FOV 50도로 자연스러운 원근감

### 3. **OBJ 로딩 개선** ✅
- 자동 중심점 계산
- 자동 스케일 조정
- Bounding Box 기반 최적화

### 4. **3가지 의상 모델 옵션** ✅

#### 옵션 A: OBJ 파일 (우선순위 1)
- `assets/tshirt.obj` 파일 사용
- 자동 로드 및 스케일 조정

#### 옵션 B: 진짜 3D 모델 (Fallback 1) ⭐ 추천
- **ExtrudeGeometry** 사용 (완전한 3D)
- Torus, Cylinder, Sphere 조합
- 7개 파트로 구성:
  - 몸통 (Extrude)
  - 목 (Torus)
  - 소매 2개 (Cylinder, 테이퍼)
  - 하완 2개 (Cylinder)
  - 어깨 패드 2개 (Sphere)

#### 옵션 C: 큐브 기반 모델 (Fallback 2)
- BoxGeometry 사용
- 10개 큐브 조합

---

## 🎮 실행 방법

### 1단계: 로컬 서버 실행

#### Windows
```bash
# PowerShell
cd C:\Users\m1ns2o\Desktop\mediapipe_js
python -m http.server 8080

# 또는
npx http-server -p 8080
```

#### Mac/Linux
```bash
cd ~/Desktop/mediapipe_js
python3 -m http.server 8080
```

### 2단계: 브라우저 접속
```
http://localhost:8080
```

### 3단계: 시작
1. "시작" 버튼 클릭
2. 웹캠 권한 허용
3. "디버그 모드" 체크박스 활성화

---

## 🎨 3D 모델 생성 방법

### 방법 1: Blender Python 스크립트 사용

```bash
# Blender 설치 후
blender --background --python blender_scripts/create_tshirt.py

# 또는 Blender GUI에서
# 1. Blender 열기
# 2. Scripting 탭
# 3. create_tshirt.py 열기
# 4. Run Script 클릭
```

생성된 파일을 `assets/tshirt.obj`로 복사

### 방법 2: 외부 3D 모델 사용

무료 3D 모델 다운로드:
- [Sketchfab](https://sketchfab.com/3d-models/t-shirt)
- [Free3D](https://free3d.com/)
- [TurboSquid Free](https://www.turbosquid.com/Search/3D-Models/free/shirt)

**요구사항:**
- 형식: OBJ 또는 GLTF
- 폴리곤: < 5000
- 크기: 적당한 비율

### 방법 3: 코드에서 직접 생성 (현재 사용 중) ⭐

이미 구현됨! `renderer.js`의 `create3DTShirt()` 메서드

---

## 🐛 문제 해결

### 문제 1: 스켈레톤과 웹캠 위치가 안 맞음
**해결:** ✅ 이미 수정됨
- CSS에서 캔버스 위치 동기화
- 디버그 캔버스 `z-index: 10` 추가

### 문제 2: 의상이 2D처럼 보임
**해결:** ✅ 이미 수정됨
- PerspectiveCamera 사용
- ExtrudeGeometry로 진짜 3D 형태

### 문제 3: OBJ 파일이 너무 크거나 작음
**해결:** ✅ 자동 조정
- Bounding Box 계산
- 자동 스케일링
- `renderer.js:149-151` 참고

### 문제 4: 의상이 안 보임
**확인사항:**
1. Console에서 에러 확인 (F12)
2. 어느 모델이 로드되었는지 확인:
   ```
   ✅ OBJ 의상 모델 로드 완료  → OBJ 사용
   ✅ 진짜 3D 티셔츠 모델 생성  → Geometry 사용
   ```
3. 카메라 위치 조정 (renderer.js:34)

---

## ⚙️ 커스터마이징

### 1. 의상 색상 변경

**renderer.js:188** (3D 티셔츠)
```javascript
color: 0x4a90e2,  // 파란색
// 변경 예:
// 0xff0000  빨간색
// 0x00ff00  초록색
// 0xffff00  노란색
```

### 2. 카메라 FOV 조정

**renderer.js:29**
```javascript
this.camera = new THREE.PerspectiveCamera(
    50,  // FOV (낮을수록 망원, 높을수록 광각)
    aspect,
    0.1,
    1000
);
```

### 3. 의상 투명도 조정

**renderer.js:191**
```javascript
opacity: 0.9,  // 0.0 (투명) ~ 1.0 (불투명)
```

### 4. 리깅 민감도 조정

**clothing-rigger.js:13**
```javascript
this.smoothingFactor = 0.3;  // 0.1 (부드럽게) ~ 0.9 (빠르게)
```

---

## 📊 현재 구조

```
진짜 3D 티셔츠 (create3DTShirt)
├── 몸통 (ExtrudeGeometry) - 깊이 0.2, 베벨 있음
├── 목 (TorusGeometry) - 반지름 0.12
├── 왼쪽 소매 (CylinderGeometry) - 테이퍼 0.08→0.06
├── 오른쪽 소매 (CylinderGeometry)
├── 왼쪽 하완 (CylinderGeometry) - 테이퍼 0.06→0.05
├── 오른쪽 하완 (CylinderGeometry)
├── 왼쪽 어깨 (SphereGeometry) - 변형된 구
└── 오른쪽 어깨 (SphereGeometry)
```

---

## 🎯 성능 최적화

### 현재 설정
- PerspectiveCamera FOV: 50
- 폴리곤 수: ~1000 (진짜 3D 모델)
- 타겟 FPS: 30+

### 최적화 팁
1. **웹캠 해상도 낮추기** (webcam.js:19)
   ```javascript
   width: { ideal: 1280 },  // → 960 또는 640
   ```

2. **MediaPipe 모델 경량화** (pose-detector.js:25)
   ```javascript
   modelComplexity: 1,  // → 0 (Lite 모드)
   ```

3. **지오메트리 세그먼트 감소** (renderer.js)
   ```javascript
   new THREE.CylinderGeometry(0.08, 0.06, 0.35, 12)
   //                                           ↑↑
   //                                  12 → 8로 변경
   ```

---

## 🔬 디버그 모드 활용

### 스켈레톤 정보
- **초록색 선**: 신체 연결선
- **빨간색 점**: 33개 랜드마크
- **숫자**: 주요 포인트 인덱스

### 주요 랜드마크
```
11, 12: 어깨
13, 14: 팔꿈치
15, 16: 손목
23, 24: 엉덩이
```

### Console 로그 활용
```javascript
// renderer.js:156-160
console.log('📊 OBJ 모델 정보:', {
    size: size,      // 모델 크기
    center: center,  // 중심점
    scale: scale     // 적용된 스케일
});
```

---

## 📝 개발 로드맵

- [x] 캔버스 위치 동기화
- [x] PerspectiveCamera 적용
- [x] 진짜 3D 모델 생성
- [x] OBJ 자동 스케일링
- [x] Blender 스크립트 제공
- [ ] 다중 의상 선택 UI
- [ ] 텍스처 매핑
- [ ] 바지 동시 착용
- [ ] 손 제스처 인터랙션

---

## 🤝 문의

문제가 발생하면:
1. 브라우저 Console 확인 (F12)
2. FPS 확인 (우상단)
3. 디버그 모드로 랜드마크 확인

---

**마지막 업데이트:** 2025-11-17
**버전:** 2.0.0 (진짜 3D 지원)
