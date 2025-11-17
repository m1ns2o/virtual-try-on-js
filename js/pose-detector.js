/**
 * MediaPipe Pose 검출 모듈
 * 신체 랜드마크를 검출하고 관리
 */

export class PoseDetector {
    constructor() {
        this.pose = null;
        this.currentLandmarks = null;
        this.onResultsCallback = null;
    }

    /**
     * MediaPipe Pose 초기화
     * @returns {Promise<void>}
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            try {
                this.pose = new Pose({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                    }
                });

                this.pose.setOptions({
                    modelComplexity: 1, // 0: Lite, 1: Full, 2: Heavy
                    smoothLandmarks: true,
                    enableSegmentation: false,
                    smoothSegmentation: false,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                this.pose.onResults((results) => this.handleResults(results));

                console.log('✅ MediaPipe Pose 초기화 완료');
                resolve();
            } catch (error) {
                console.error('❌ MediaPipe Pose 초기화 실패:', error);
                reject(error);
            }
        });
    }

    /**
     * 포즈 검출 결과 처리
     * @param {Object} results - MediaPipe 결과
     */
    handleResults(results) {
        if (results.poseLandmarks) {
            this.currentLandmarks = results.poseLandmarks;
        } else {
            this.currentLandmarks = null;
        }

        // 콜백 호출
        if (this.onResultsCallback) {
            this.onResultsCallback(results);
        }
    }

    /**
     * 비디오 프레임에서 포즈 검출
     * @param {HTMLVideoElement} videoElement
     * @returns {Promise<void>}
     */
    async detectPose(videoElement) {
        if (this.pose) {
            await this.pose.send({ image: videoElement });
        }
    }

    /**
     * 현재 랜드마크 반환
     * @returns {Array|null} 33개 랜드마크 배열 또는 null
     */
    getLandmarks() {
        return this.currentLandmarks;
    }

    /**
     * 특정 랜드마크 가져오기
     * @param {number} index - 랜드마크 인덱스
     * @returns {Object|null} {x, y, z, visibility}
     */
    getLandmark(index) {
        if (this.currentLandmarks && this.currentLandmarks[index]) {
            return this.currentLandmarks[index];
        }
        return null;
    }

    /**
     * 결과 콜백 설정
     * @param {Function} callback
     */
    setOnResultsCallback(callback) {
        this.onResultsCallback = callback;
    }

    /**
     * 스켈레톤 그리기 (디버그용)
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width - 캔버스 너비
     * @param {number} height - 캔버스 높이
     */
    drawSkeleton(ctx, width, height) {
        if (!this.currentLandmarks) return;

        // 캔버스 초기화
        ctx.clearRect(0, 0, width, height);

        // 연결선 정의 (MediaPipe Pose 스켈레톤)
        const connections = [
            // 몸통
            [11, 12], // 어깨
            [11, 23], // 왼쪽 어깨-엉덩이
            [12, 24], // 오른쪽 어깨-엉덩이
            [23, 24], // 엉덩이

            // 왼팔
            [11, 13], // 어깨-팔꿈치
            [13, 15], // 팔꿈치-손목

            // 오른팔
            [12, 14],
            [14, 16],

            // 왼다리
            [23, 25], // 엉덩이-무릎
            [25, 27], // 무릎-발목

            // 오른다리
            [24, 26],
            [26, 28],

            // 얼굴 (선택적)
            [0, 1], [1, 2], [2, 3], [3, 7],
            [0, 4], [4, 5], [5, 6], [6, 8]
        ];

        // 연결선 그리기
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;

        connections.forEach(([startIdx, endIdx]) => {
            const start = this.currentLandmarks[startIdx];
            const end = this.currentLandmarks[endIdx];

            if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
                ctx.beginPath();
                ctx.moveTo(start.x * width, start.y * height);
                ctx.lineTo(end.x * width, end.y * height);
                ctx.stroke();
            }
        });

        // 랜드마크 점 그리기
        this.currentLandmarks.forEach((landmark, index) => {
            if (landmark.visibility > 0.5) {
                const x = landmark.x * width;
                const y = landmark.y * height;

                // 점
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fill();

                // 인덱스 번호 (선택적)
                if (index >= 11 && index <= 28) { // 주요 포인트만
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '10px Arial';
                    ctx.fillText(index.toString(), x + 8, y - 8);
                }
            }
        });
    }
}

/**
 * MediaPipe Pose 랜드마크 인덱스 상수
 */
export const POSE_LANDMARKS = {
    NOSE: 0,
    LEFT_EYE_INNER: 1,
    LEFT_EYE: 2,
    LEFT_EYE_OUTER: 3,
    RIGHT_EYE_INNER: 4,
    RIGHT_EYE: 5,
    RIGHT_EYE_OUTER: 6,
    LEFT_EAR: 7,
    RIGHT_EAR: 8,
    MOUTH_LEFT: 9,
    MOUTH_RIGHT: 10,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_PINKY: 17,
    RIGHT_PINKY: 18,
    LEFT_INDEX: 19,
    RIGHT_INDEX: 20,
    LEFT_THUMB: 21,
    RIGHT_THUMB: 22,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
    LEFT_HEEL: 29,
    RIGHT_HEEL: 30,
    LEFT_FOOT_INDEX: 31,
    RIGHT_FOOT_INDEX: 32
};
