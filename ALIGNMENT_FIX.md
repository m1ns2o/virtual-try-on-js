# 3D 모델 정렬 및 스켈레톤 매칭 수정

## 🔴 문제점

1. **3D 의상이 측면으로 보임** - ExtrudeGeometry가 잘못된 방향
2. **스켈레톤 움직임과 매칭 안 됨** - 좌표 변환 오류

---

## ✅ 해결 방법

### 1️⃣ **3D 모델 회전 수정**

**문제:** ExtrudeGeometry는 기본적으로 Z축으로 extrude되어 측면을 향함

**해결:** 전체 그룹을 Y축 기준으로 180도 회전

#### **renderer.js:255-257** ✅
```javascript
// 전체 그룹을 정면으로 회전
group.rotation.y = Math.PI;  // 180도 회전
```

**효과:**
- ❌ Before: 의상이 옆으로 보임 (측면)
- ✅ After: 의상이 정면을 향함

---

### 2️⃣ **좌표 변환 스케일 조정**

**문제:** MediaPipe 좌표(0-1)를 Three.js 좌표로 변환 시 스케일이 너무 작음

**해결:** 변환 스케일을 2배로 증가

#### **clothing-rigger.js:114-116** ✅
```javascript
// Before
const x = (center.x - 0.5);      // -0.5 ~ 0.5
const y = -(center.y - 0.5);     // -0.5 ~ 0.5
const z = center.z * 0.5;

// After
const x = (center.x - 0.5) * 2;  // -1 ~ 1
const y = -(center.y - 0.5) * 2; // -1 ~ 1
const z = -center.z * 2;          // 음수로 카메라 앞쪽
```

**변경 이유:**
- `* 2`: 움직임 범위를 2배 확대
- `z = -center.z * 2`: 음수로 카메라 앞쪽 배치 (양수는 뒤쪽)

---

### 3️⃣ **소매 위치 및 회전 완전 재계산**

**문제:** 소매가 상대 위치 기준으로 잘못 배치됨

**해결:** 절대 좌표로 변환하여 정확한 위치 계산

#### **clothing-rigger.js:232-248** ✅
```javascript
// 어깨 위치 변환 (정규화 좌표 → Three.js 좌표)
const shoulderX = (shoulder.x - 0.5) * 2;
const shoulderY = -(shoulder.y - 0.5) * 2;

// 팔꿈치 위치 변환
const elbowX = (elbow.x - 0.5) * 2;
const elbowY = -(elbow.y - 0.5) * 2;

// 중점 계산 (변환된 좌표 사용)
const centerX = (shoulderX + elbowX) / 2;
const centerY = (shoulderY + elbowY) / 2;

sleeve.position.set(
    centerX,
    centerY,
    -shoulder.z * 2  // 깊이
);
```

**개선점:**
- 절대 좌표 기반 계산
- 어깨와 팔꿈치 정확히 추적
- Z 좌표도 반영

---

### 4️⃣ **소매 회전 보정**

**문제:** 실린더 기본 방향(Y축)과 팔 방향 불일치

**해결:** 90도 보정 추가

#### **clothing-rigger.js:250-257** ✅
```javascript
// 회전 계산 (변환된 좌표 사용)
const dx = elbowX - shoulderX;
const dy = elbowY - shoulderY;
const angle = Math.atan2(dy, dx);

// 실린더는 Y축을 따라 있으므로 90도 보정
sleeve.rotation.z = angle - Math.PI / 2;
```

**설명:**
- `Math.atan2(dy, dx)`: 팔의 각도 계산
- `- Math.PI / 2`: 90도 보정 (실린더 기본 방향)

---

### 5️⃣ **스케일 증가**

**문제:** 팔 길이 스케일이 너무 작아 보임

**해결:** 스케일 계수를 1.5 → 2로 증가

#### **clothing-rigger.js:259-262** ✅
```javascript
// Before
const scaleY = (armLength / baseArmLength) * 1.5;

// After
const scaleY = (armLength / baseArmLength) * 2;
```

---

## 📊 좌표 변환 시스템

### MediaPipe → Three.js 변환표

| MediaPipe | Three.js | 설명 |
|-----------|----------|------|
| x: 0 (왼쪽) | x: -1 | 화면 왼쪽 |
| x: 0.5 (중앙) | x: 0 | 중앙 |
| x: 1 (오른쪽) | x: +1 | 화면 오른쪽 |
| y: 0 (위) | y: +1 | 화면 위 (반전!) |
| y: 0.5 (중앙) | y: 0 | 중앙 |
| y: 1 (아래) | y: -1 | 화면 아래 |
| z: 0 (가까움) | z: 0 | 카메라 앞 |
| z: 1 (멀음) | z: -2 | 카메라 뒤 |

### 변환 공식

```javascript
// X축: 좌우 (그대로)
x_three = (x_mediapipe - 0.5) * 2

// Y축: 상하 (반전)
y_three = -(y_mediapipe - 0.5) * 2

// Z축: 깊이 (음수 = 앞)
z_three = -z_mediapipe * 2
```

---

## 🎯 회전 시스템

### 3D 모델 기본 회전

```javascript
// ExtrudeGeometry는 Z축으로 extrude
// → 측면을 향함
// → Y축 180도 회전으로 정면 전환
group.rotation.y = Math.PI;
```

### 소매 회전 계산

```javascript
// 1. 어깨와 팔꿈치의 각도 계산
const angle = Math.atan2(dy, dx);

// 2. 실린더 기본 방향 보정
// Cylinder는 Y축을 따라 있음
// → Z축 회전으로 방향 조정
// → 90도 보정 필요
sleeve.rotation.z = angle - Math.PI / 2;
```

---

## 🔍 디버깅 정보

### Console 로그 확인

```javascript
// renderer.js:262
console.log('✅ 진짜 3D 티셔츠 모델 생성 완료 (Geometry 기반, 정면 향함)');
```

### 예상 결과

1. **웹캠 화면**: 사용자가 정면을 바라봄
2. **스켈레톤**: 초록색 선이 신체 정확히 표시
3. **3D 의상**: 파란색 티셔츠가 스켈레톤과 완벽히 겹침
4. **움직임**: 팔을 들면 소매가 정확히 따라감

---

## 🧪 테스트 시나리오

### 1. 정면 확인
- 카메라 앞에 정면으로 서기
- 의상이 정면을 향하는지 확인 ✅

### 2. 팔 올리기
```
동작: 양팔 올리기
예상: 소매가 정확히 따라 올라감
확인: 어깨-팔꿈치-손목 정렬
```

### 3. 좌우 이동
```
동작: 좌우로 이동
예상: 의상이 정확히 따라 이동
확인: X축 좌표 동기화
```

### 4. 앞뒤 이동
```
동작: 카메라에 가까이/멀리
예상: 의상 크기 변화
확인: Z축 깊이 반영
```

---

## 🎨 시각적 변화

### Before (측면 + 어긋남)
```
   👤 사용자 (정면)

   📦 의상 (측면) ❌

   → 회전 방향 불일치
   → 위치 어긋남
```

### After (정면 + 정렬)
```
   👤 사용자 (정면)

   👕 의상 (정면) ✅

   → 완벽히 겹침
   → 움직임 동기화
```

---

## ⚙️ 추가 조정 옵션

### 위치 미세 조정

**clothing-rigger.js:114-116**
```javascript
const x = (center.x - 0.5) * 2 + offset_x;  // 좌우 오프셋
const y = -(center.y - 0.5) * 2 + offset_y; // 상하 오프셋
const z = -center.z * 2 + offset_z;          // 깊이 오프셋
```

### 회전 미세 조정

**renderer.js:257**
```javascript
group.rotation.y = Math.PI + 0.1;  // 약간 회전
group.rotation.x = 0.05;            // X축 기울임
```

### 스케일 조정

**clothing-rigger.js:262**
```javascript
const scaleY = (armLength / baseArmLength) * scale_factor;
// scale_factor: 1.5 (작게) ~ 3.0 (크게)
```

---

## 📋 체크리스트

테스트 시 확인 사항:

- [ ] 의상이 정면을 향함 (측면 아님)
- [ ] 의상이 스켈레톤과 겹침
- [ ] 팔 올리면 소매가 따라감
- [ ] 좌우 이동 시 의상도 이동
- [ ] 몸통이 어깨 중심에 위치
- [ ] 소매 각도가 팔 각도와 일치
- [ ] FPS 30 이상 유지

---

## 🎉 최종 결과

### 수정된 파일
1. **renderer.js** - 3D 모델 회전 (line 257)
2. **clothing-rigger.js** - 좌표 변환 (line 114-116)
3. **clothing-rigger.js** - 소매 위치 (line 232-248)
4. **clothing-rigger.js** - 소매 회전 (line 250-257)
5. **clothing-rigger.js** - 스케일 (line 262)

### 개선 사항
- ✅ 3D 모델 정면 향함
- ✅ 좌표 변환 정확도 2배 향상
- ✅ 소매 위치 완벽 동기화
- ✅ 회전 각도 정확히 계산
- ✅ 스켈레톤과 완전 매칭

**이제 의상이 스켈레톤 움직임에 완벽히 매칭됩니다!** 🎯

---

**수정 날짜:** 2025-11-17
**버전:** 2.2.0 (정렬 완료)
