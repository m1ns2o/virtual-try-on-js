/**
 * 유틸리티 함수 모듈
 */

/**
 * FPS 계산기
 */
export class FPSCalculator {
    constructor() {
        this.frameTimes = [];
        this.maxSamples = 30;
    }

    /**
     * 현재 FPS 계산
     * @param {number} timestamp - 현재 타임스탬프
     * @returns {number} FPS 값
     */
    calculate(timestamp) {
        this.frameTimes.push(timestamp);

        // 최대 샘플 수 유지
        if (this.frameTimes.length > this.maxSamples) {
            this.frameTimes.shift();
        }

        if (this.frameTimes.length < 2) {
            return 0;
        }

        // 평균 프레임 시간 계산
        const totalTime = this.frameTimes[this.frameTimes.length - 1] - this.frameTimes[0];
        const avgFrameTime = totalTime / (this.frameTimes.length - 1);

        return Math.round(1000 / avgFrameTime);
    }

    reset() {
        this.frameTimes = [];
    }
}

/**
 * 선형 보간 (부드러운 애니메이션용)
 * @param {number} a - 시작 값
 * @param {number} b - 끝 값
 * @param {number} t - 보간 계수 (0-1)
 * @returns {number} 보간된 값
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * 값을 범위 내로 제한
 * @param {number} value - 입력 값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @returns {number} 제한된 값
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * 값을 정규화 (0-1)
 * @param {number} value - 입력 값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @returns {number} 정규화된 값
 */
export function normalize(value, min, max) {
    return (value - min) / (max - min);
}

/**
 * 두 점 사이의 거리 계산
 * @param {{x: number, y: number, z?: number}} p1 - 첫 번째 점
 * @param {{x: number, y: number, z?: number}} p2 - 두 번째 점
 * @returns {number} 거리
 */
export function distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = (p2.z || 0) - (p1.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 두 점의 중점 계산
 * @param {{x: number, y: number, z?: number}} p1 - 첫 번째 점
 * @param {{x: number, y: number, z?: number}} p2 - 두 번째 점
 * @returns {{x: number, y: number, z: number}} 중점
 */
export function midpoint(p1, p2) {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
        z: ((p1.z || 0) + (p2.z || 0)) / 2
    };
}

/**
 * 각도를 라디안으로 변환
 * @param {number} degrees - 각도
 * @returns {number} 라디안
 */
export function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * 라디안을 각도로 변환
 * @param {number} radians - 라디안
 * @returns {number} 각도
 */
export function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

/**
 * 디버그 로그 헬퍼
 * @param {string} tag - 태그
 * @param {string} message - 메시지
 * @param {any} data - 데이터
 */
export function debugLog(tag, message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    if (data) {
        console.log(`[${timestamp}] [${tag}] ${message}`, data);
    } else {
        console.log(`[${timestamp}] [${tag}] ${message}`);
    }
}
