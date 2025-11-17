# 웹캠 화면 표시 문제 해결

## 🔴 문제
웹캠 화면이 아예 보이지 않고 3D 렌더링만 표시됨

## 🔍 원인 분석
1. **HTML**: 웹캠 비디오가 `display: none`으로 숨겨져 있음
2. **Three.js**: videoPlane이 PerspectiveCamera와 호환되지 않는 위치/크기로 설정됨
3. **렌더링 방식**: 3D가 웹캠을 가리는 구조

## ✅ 해결 방법

### **새로운 구조: CSS 레이어 방식**
```
레이어 구조 (아래 → 위):
┌─────────────────────────────┐
│  웹캠 비디오 (z-index: 1)   │  ← 배경
├─────────────────────────────┤
│  3D 캔버스 (z-index: 5)     │  ← 투명 오버레이
├─────────────────────────────┤
│  디버그 캔버스 (z-index: 10)│  ← 스켈레톤
├─────────────────────────────┤
│  UI 컨트롤 (z-index: 100)   │  ← 버튼/정보
└─────────────────────────────┘
```

---

## 📝 변경 사항

### 1. **index.html** (Line 12)
**변경 전:**
```html
<video id="webcam" autoplay playsinline style="display: none;"></video>
```

**변경 후:**
```html
<video id="webcam" autoplay playsinline></video>
```
→ 웹캠을 화면에 표시

---

### 2. **css/styles.css** (Line 24-51)

**추가: 웹캠 비디오 스타일**
```css
/* 웹캠 비디오 (배경) */
#webcam {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: auto;
    height: auto;
    max-width: 90vw;
    max-height: 90vh;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 1;  /* 가장 아래 */
}
```

**변경: Three.js 캔버스 (투명 오버레이)**
```css
#output-canvas {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: auto;
    height: auto;
    max-width: 90vw;
    max-height: 90vh;
    pointer-events: none;  /* 클릭 이벤트 통과 */
    z-index: 5;  /* 웹캠 위 */
}
```

**추가: UI z-index**
```css
.controls {
    z-index: 100;  /* 최상단 */
}

.info-panel {
    z-index: 100;  /* 최상단 */
}
```

---

### 3. **js/renderer.js** (Line 61-65)

**변경: setupVideoBackground() 비활성화**
```javascript
setupVideoBackground(videoElement) {
    // CSS로 웹캠을 배경으로 표시하므로
    // Three.js에서는 투명한 오버레이만 렌더링
    console.log('✅ 비디오 배경 설정 완료 (CSS 방식)');
}
```
→ videoPlane 제거, CSS 방식 사용

**기존 투명 설정 유지** (Line 44)
```javascript
this.renderer.setClearColor(0x000000, 0);  // 투명 배경
```

---

## 🎯 작동 원리

### Before (문제 상황)
```
Three.js가 videoPlane으로 웹캠 렌더링 시도
→ PerspectiveCamera와 호환성 문제
→ videoPlane 위치/크기 오류
→ 웹캠 화면 안 보임
```

### After (해결)
```
1. 웹캠을 CSS로 배경에 표시 (HTML <video>)
2. Three.js는 투명한 3D만 렌더링
3. 디버그 캔버스는 그 위에 스켈레톤 표시
4. UI는 최상단
```

---

## 🧪 테스트 방법

### 1. 서버 실행
```bash
python -m http.server 8080
```

### 2. 브라우저 접속
```
http://localhost:8080
```

### 3. 확인 사항
✅ **웹캠 화면이 보임** (배경)
✅ **3D 의상이 그 위에 표시됨** (투명 오버레이)
✅ **디버그 모드에서 스켈레톤 표시** (초록색 선)
✅ **UI 버튼이 잘 작동함** (클릭 가능)

### 4. Console 로그
```
✅ 웹캠 초기화 완료
✅ Three.js 초기화 완료
✅ 비디오 배경 설정 완료 (CSS 방식)  ← 새로운 메시지
✅ 진짜 3D 티셔츠 모델 생성 완료
```

---

## 📊 레이어 순서 (z-index)

| 요소 | z-index | 설명 |
|------|---------|------|
| 웹캠 비디오 | 1 | 배경 |
| 3D 캔버스 | 5 | 투명 오버레이 |
| 디버그 캔버스 | 10 | 스켈레톤 표시 |
| UI 컨트롤 | 100 | 버튼 |
| 정보 패널 | 100 | FPS/상태 |

---

## 🔧 추가 조정

### 웹캠 크기 조정
**css/styles.css:31-32**
```css
max-width: 90vw;  /* 화면 너비의 90% */
max-height: 90vh; /* 화면 높이의 90% */
```

### 3D 투명도 조정
**js/renderer.js:194** (create3DTShirt)
```javascript
opacity: 0.9,  // 0.0 (투명) ~ 1.0 (불투명)
```

### 배경 색상 변경
**css/styles.css:9** (body)
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
/* 웹캠 주변 배경색 */
```

---

## ❓ FAQ

### Q1: 웹캠이 여전히 안 보여요
**A:** Console에서 에러 확인:
```javascript
// 웹캠 권한 거부
Error: 웹캠에 접근할 수 없습니다

// 해결: 브라우저 설정 → 카메라 권한 허용
```

### Q2: 3D가 웹캠 뒤에 있어요
**A:** z-index 확인:
```css
#output-canvas { z-index: 5; }  /* 1보다 커야 함 */
```

### Q3: 디버그 캔버스가 안 보여요
**A:** 체크박스 확인:
```javascript
// index.html:28
<input type="checkbox" id="debug-mode">
```
→ 체크해야 표시됨

### Q4: 웹캠과 3D 크기가 안 맞아요
**A:** main.js에서 캔버스 크기 동기화 확인:
```javascript
// main.js:109-112
this.outputCanvas.width = videoSize.width;
this.outputCanvas.height = videoSize.height;
this.debugCanvas.width = videoSize.width;
this.debugCanvas.height = videoSize.height;
```

---

## 🎉 최종 결과

### 화면 구성
```
┌─────────────────────────────────────┐
│        [정보 패널: FPS/상태]        │ z:100
│                                     │
│   ┌─────────────────────────┐      │
│   │                         │      │
│   │   웹캠 (배경)           │ z:1  │
│   │   + 3D 의상 (투명)      │ z:5  │
│   │   + 스켈레톤 (디버그)   │ z:10 │
│   │                         │      │
│   └─────────────────────────┘      │
│                                     │
│    [시작] [중지] [디버그모드]       │ z:100
└─────────────────────────────────────┘
```

**이제 웹캠 화면이 제대로 보입니다!** ✅

---

**수정 날짜:** 2025-11-17
**수정자:** Claude Code
**버전:** 2.1.0
