/**
 * 의상 리깅 시스템
 * MediaPipe 랜드마크를 3D 의상 모델에 매핑하여 변형
 */

import { POSE_LANDMARKS } from './pose-detector.js';
import { lerp, distance, midpoint } from './utils.js';

export class ClothingRigger {
    constructor() {
        this.previousLandmarks = null;
        this.smoothingFactor = 0.3; // 부드러운 움직임을 위한 보간 계수
        this.baseShoulderDistance = null; // 기준 어깨 너비
    }

    /**
     * 랜드마크와 의상 파트 매핑 정의
     */
    getRigMapping() {
        return {
            body: {
                position: ['center'], // 어깨 중심
                scale: ['shoulderWidth', 'torsoHeight']
            },
            leftSleeve: {
                position: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
                rotation: ['leftArmAngle']
            },
            rightSleeve: {
                position: [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
                rotation: ['rightArmAngle']
            }
        };
    }

    /**
     * 의상 포즈 업데이트 (메인 함수)
     * @param {Array} landmarks - MediaPipe 랜드마크 배열 (33개)
     * @param {THREE.Group} clothingModel - 의상 3D 모델
     * @param {number} canvasWidth - 캔버스 너비
     * @param {number} canvasHeight - 캔버스 높이
     */
    updateClothingPose(landmarks, clothingModel, canvasWidth, canvasHeight) {
        if (!landmarks || landmarks.length < 33 || !clothingModel) {
            return;
        }

        // 스무딩 적용
        const smoothedLandmarks = this.applySmoothingSmoothing(landmarks);

        // 주요 포인트 추출
        const leftShoulder = smoothedLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
        const rightShoulder = smoothedLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
        const leftHip = smoothedLandmarks[POSE_LANDMARKS.LEFT_HIP];
        const rightHip = smoothedLandmarks[POSE_LANDMARKS.RIGHT_HIP];
        const leftElbow = smoothedLandmarks[POSE_LANDMARKS.LEFT_ELBOW];
        const rightElbow = smoothedLandmarks[POSE_LANDMARKS.RIGHT_ELBOW];

        // 가시성 체크
        if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5) {
            return;
        }

        // 1. 전체 의상 위치 업데이트 (어깨 중심)
        this.updateBodyPosition(clothingModel, leftShoulder, rightShoulder, canvasWidth, canvasHeight);

        // 2. 의상 스케일 업데이트 (신체 크기에 맞춤)
        this.updateBodyScale(clothingModel, leftShoulder, rightShoulder, leftHip, rightHip);

        // 3. 소매 업데이트
        this.updateSleeves(clothingModel, smoothedLandmarks, canvasWidth, canvasHeight);

        // 이전 랜드마크 저장
        this.previousLandmarks = smoothedLandmarks;
    }

    /**
     * 랜드마크 스무딩 (부드러운 움직임)
     * @param {Array} landmarks
     * @returns {Array}
     */
    applySmoothingSmoothing(landmarks) {
        if (!this.previousLandmarks) {
            return landmarks;
        }

        return landmarks.map((landmark, index) => {
            const prev = this.previousLandmarks[index];
            return {
                x: lerp(prev.x, landmark.x, this.smoothingFactor),
                y: lerp(prev.y, landmark.y, this.smoothingFactor),
                z: lerp(prev.z, landmark.z, this.smoothingFactor),
                visibility: landmark.visibility
            };
        });
    }

    /**
     * 몸통 위치 업데이트
     * @param {THREE.Group} clothingModel
     * @param {Object} leftShoulder
     * @param {Object} rightShoulder
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     */
    updateBodyPosition(clothingModel, leftShoulder, rightShoulder, canvasWidth, canvasHeight) {
        // 어깨 중심점 계산
        const center = midpoint(leftShoulder, rightShoulder);

        // 정규화된 좌표 (0-1) -> Three.js 좌표
        // MediaPipe: x는 좌→우 (0-1), y는 위→아래 (0-1)
        // Three.js: x는 좌→우, y는 아래→위, z는 앞→뒤

        const x = (center.x - 0.5) * 2;      // -1 ~ 1 범위로 확대
        const y = -(center.y - 0.5) * 2;     // Y축 반전 및 확대
        const z = -center.z * 2;              // 깊이 (음수로 카메라 앞쪽)

        clothingModel.position.set(x, y, z);
    }

    /**
     * 몸통 스케일 업데이트
     * @param {THREE.Group} clothingModel
     * @param {Object} leftShoulder
     * @param {Object} rightShoulder
     * @param {Object} leftHip
     * @param {Object} rightHip
     */
    updateBodyScale(clothingModel, leftShoulder, rightShoulder, leftHip, rightHip) {
        // 어깨 너비 계산
        const shoulderWidth = distance(leftShoulder, rightShoulder);

        // 기준 어깨 너비 설정 (첫 프레임)
        if (!this.baseShoulderDistance) {
            this.baseShoulderDistance = shoulderWidth;
        }

        // 상대적 스케일 계산
        const scaleX = shoulderWidth / this.baseShoulderDistance;

        // 몸통 높이 계산
        const shoulderCenter = midpoint(leftShoulder, rightShoulder);
        const hipCenter = midpoint(leftHip, rightHip);
        const torsoHeight = distance(shoulderCenter, hipCenter);

        const baseTorsoHeight = this.baseShoulderDistance * 1.2; // 대략적인 비율
        const scaleY = torsoHeight / baseTorsoHeight;

        // 몸통 파트 스케일 적용
        const bodyPart = clothingModel.getObjectByName('body');
        if (bodyPart) {
            bodyPart.scale.set(scaleX * 1.5, scaleY * 1.2, 1);
        }
    }

    /**
     * 소매 업데이트
     * @param {THREE.Group} clothingModel
     * @param {Array} landmarks
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     */
    updateSleeves(clothingModel, landmarks, canvasWidth, canvasHeight) {
        // 왼쪽 소매 (상완)
        this.updateSleeve(
            clothingModel,
            'leftSleeve',
            landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
            landmarks[POSE_LANDMARKS.LEFT_ELBOW],
            canvasWidth,
            canvasHeight,
            -1 // 왼쪽
        );

        // 오른쪽 소매 (상완)
        this.updateSleeve(
            clothingModel,
            'rightSleeve',
            landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
            landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
            canvasWidth,
            canvasHeight,
            1 // 오른쪽
        );

        // 왼쪽 하완 (팔꿈치~손목)
        this.updateSleeve(
            clothingModel,
            'leftForearm',
            landmarks[POSE_LANDMARKS.LEFT_ELBOW],
            landmarks[POSE_LANDMARKS.LEFT_WRIST],
            canvasWidth,
            canvasHeight,
            -1
        );

        // 오른쪽 하완
        this.updateSleeve(
            clothingModel,
            'rightForearm',
            landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
            landmarks[POSE_LANDMARKS.RIGHT_WRIST],
            canvasWidth,
            canvasHeight,
            1
        );
    }

    /**
     * 개별 소매 업데이트
     * @param {THREE.Group} clothingModel
     * @param {string} sleeveName
     * @param {Object} shoulder
     * @param {Object} elbow
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     * @param {number} side - -1 (왼쪽) 또는 1 (오른쪽)
     */
    updateSleeve(clothingModel, sleeveName, shoulder, elbow, canvasWidth, canvasHeight, side) {
        const sleeve = clothingModel.getObjectByName(sleeveName);
        if (!sleeve || shoulder.visibility < 0.5 || elbow.visibility < 0.5) {
            return;
        }

        // 소매 중점 위치 계산 (정규화된 좌표)
        const sleeveCenter = {
            x: (shoulder.x + elbow.x) / 2,
            y: (shoulder.y + elbow.y) / 2,
            z: (shoulder.z + elbow.z) / 2
        };

        // 어깨 위치 변환
        const shoulderX = (shoulder.x - 0.5) * 2;
        const shoulderY = -(shoulder.y - 0.5) * 2;

        // 팔꿈치 위치 변환
        const elbowX = (elbow.x - 0.5) * 2;
        const elbowY = -(elbow.y - 0.5) * 2;

        // 중점 계산
        const centerX = (shoulderX + elbowX) / 2;
        const centerY = (shoulderY + elbowY) / 2;

        sleeve.position.set(
            centerX,
            centerY,
            -shoulder.z * 2
        );

        // 회전 계산 (팔의 각도) - 변환된 좌표 사용
        const dx = elbowX - shoulderX;
        const dy = elbowY - shoulderY;
        const angle = Math.atan2(dy, dx);

        // 실린더는 기본적으로 Y축을 따라 있으므로
        // Z축 회전으로 팔 방향 조정
        sleeve.rotation.z = angle - Math.PI / 2; // 90도 보정

        // 길이에 따른 스케일 조정
        const armLength = distance(shoulder, elbow);
        const baseArmLength = this.baseShoulderDistance || 0.2;
        const scaleY = (armLength / baseArmLength) * 2; // 스케일 증가

        sleeve.scale.set(1, scaleY, 1);
    }

    /**
     * 관절 각도 계산
     * @param {Object} p1 - 첫 번째 점
     * @param {Object} p2 - 중심 점 (관절)
     * @param {Object} p3 - 세 번째 점
     * @returns {number} 각도 (라디안)
     */
    calculateJointAngle(p1, p2, p3) {
        const v1 = {
            x: p1.x - p2.x,
            y: p1.y - p2.y
        };

        const v2 = {
            x: p3.x - p2.x,
            y: p3.y - p2.y
        };

        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

        return Math.acos(dot / (mag1 * mag2));
    }

    /**
     * 리깅 리셋
     */
    reset() {
        this.previousLandmarks = null;
        this.baseShoulderDistance = null;
    }
}
