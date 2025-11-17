/**
 * 메인 애플리케이션 모듈
 * 모든 모듈을 통합하고 렌더링 루프 관리
 */

import { WebcamManager } from './webcam.js';
import { PoseDetector } from './pose-detector.js';
import { ThreeRenderer } from './renderer.js';
import { ClothingRigger } from './clothing-rigger.js';
import { FPSCalculator, debugLog } from './utils.js';

class VirtualClothingApp {
    constructor() {
        // DOM 요소
        this.videoElement = document.getElementById('webcam');
        this.outputCanvas = document.getElementById('output-canvas');
        this.debugCanvas = document.getElementById('debug-canvas');
        this.startBtn = document.getElementById('start-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.debugModeCheckbox = document.getElementById('debug-mode');
        this.fpsValueElement = document.getElementById('fps-value');
        this.statusValueElement = document.getElementById('status-value');

        // 모듈 인스턴스
        this.webcamManager = null;
        this.poseDetector = null;
        this.threeRenderer = null;
        this.clothingRigger = null;
        this.fpsCalculator = null;

        // 상태
        this.isRunning = false;
        this.animationFrameId = null;
        this.debugMode = false;

        // 초기화
        this.init();
    }

    /**
     * 초기화
     */
    init() {
        // 모듈 인스턴스 생성
        this.webcamManager = new WebcamManager(this.videoElement);
        this.poseDetector = new PoseDetector();
        this.threeRenderer = new ThreeRenderer(this.outputCanvas);
        this.clothingRigger = new ClothingRigger();
        this.fpsCalculator = new FPSCalculator();

        // 이벤트 리스너
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.debugModeCheckbox.addEventListener('change', (e) => {
            this.debugMode = e.target.checked;
            this.debugCanvas.classList.toggle('active', this.debugMode);
        });

        // 창 크기 변경 이벤트
        window.addEventListener('resize', () => this.handleResize());

        debugLog('APP', '애플리케이션 초기화 완료');
        this.updateStatus('대기 중');
    }

    /**
     * 데모 시작
     */
    async start() {
        if (this.isRunning) return;

        try {
            this.updateStatus('초기화 중...');
            this.startBtn.disabled = true;
            this.startBtn.classList.add('loading');

            // 1. 웹캠 시작
            debugLog('APP', '웹캠 초기화 시작');
            await this.webcamManager.setupCamera();

            const videoSize = this.webcamManager.getVideoSize();
            debugLog('APP', '웹캠 크기:', videoSize);

            // 2. MediaPipe Pose 초기화
            debugLog('APP', 'MediaPipe Pose 초기화 시작');
            this.updateStatus('AI 모델 로딩 중...');
            await this.poseDetector.initialize();

            // 3. Three.js 렌더러 초기화
            debugLog('APP', 'Three.js 초기화 시작');
            this.threeRenderer.initialize(videoSize.width, videoSize.height);
            this.threeRenderer.setupVideoBackground(this.videoElement);

            // 4. 의상 모델 로드 (OBJ 시도 -> 실패시 간단한 모델)
            debugLog('APP', '의상 모델 로드 시작');
            this.updateStatus('3D 의상 로딩 중...');

            try {
                // OBJ 파일 로드 시도
                await this.threeRenderer.loadOBJModel('assets/tshirt.obj');
                debugLog('APP', 'OBJ 의상 모델 로드 성공');
            } catch (error) {
                console.warn('⚠️ OBJ 로드 실패, 진짜 3D 티셔츠 모델로 대체:', error.message);
                this.threeRenderer.create3DTShirt(); // 진짜 3D 모델 사용
                debugLog('APP', '3D Geometry 기반 티셔츠 생성 완료');
            }

            // 5. 캔버스 크기 설정
            this.outputCanvas.width = videoSize.width;
            this.outputCanvas.height = videoSize.height;
            this.debugCanvas.width = videoSize.width;
            this.debugCanvas.height = videoSize.height;

            // 6. 렌더링 루프 시작
            this.isRunning = true;
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.startBtn.classList.remove('loading');

            this.updateStatus('실행 중');
            debugLog('APP', '렌더링 루프 시작');
            this.renderLoop();

        } catch (error) {
            console.error('❌ 시작 실패:', error);
            alert(`시작 실패: ${error.message}`);
            this.updateStatus('오류 발생');
            this.startBtn.disabled = false;
            this.startBtn.classList.remove('loading');
        }
    }

    /**
     * 데모 중지
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;

        // 애니메이션 프레임 취소
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // 웹캠 중지
        this.webcamManager.stop();

        // UI 업데이트
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.updateStatus('중지됨');
        this.fpsValueElement.textContent = '0';

        // 리깅 리셋
        this.clothingRigger.reset();

        debugLog('APP', '데모 중지');
    }

    /**
     * 메인 렌더링 루프
     */
    async renderLoop() {
        if (!this.isRunning) return;

        const timestamp = performance.now();

        try {
            // 1. MediaPipe 포즈 검출
            await this.poseDetector.detectPose(this.videoElement);
            const landmarks = this.poseDetector.getLandmarks();

            // 2. 의상 리깅 업데이트
            if (landmarks && this.threeRenderer.clothingModel) {
                const videoSize = this.webcamManager.getVideoSize();
                this.clothingRigger.updateClothingPose(
                    landmarks,
                    this.threeRenderer.clothingModel,
                    videoSize.width,
                    videoSize.height
                );
            }

            // 3. Three.js 렌더링
            this.threeRenderer.render();

            // 4. 디버그 모드: 스켈레톤 그리기
            if (this.debugMode && landmarks) {
                const ctx = this.debugCanvas.getContext('2d');
                this.poseDetector.drawSkeleton(
                    ctx,
                    this.debugCanvas.width,
                    this.debugCanvas.height
                );
            } else if (!this.debugMode) {
                // 디버그 모드 OFF 시 캔버스 클리어
                const ctx = this.debugCanvas.getContext('2d');
                ctx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
            }

            // 5. FPS 업데이트
            const fps = this.fpsCalculator.calculate(timestamp);
            if (fps > 0) {
                this.fpsValueElement.textContent = fps;

                // FPS 색상 표시
                if (fps >= 30) {
                    this.fpsValueElement.style.color = '#4ade80'; // 녹색
                } else if (fps >= 20) {
                    this.fpsValueElement.style.color = '#fbbf24'; // 노란색
                } else {
                    this.fpsValueElement.style.color = '#ef4444'; // 빨간색
                }
            }

        } catch (error) {
            console.error('❌ 렌더링 오류:', error);
        }

        // 다음 프레임 예약
        this.animationFrameId = requestAnimationFrame(() => this.renderLoop());
    }

    /**
     * 창 크기 변경 처리
     */
    handleResize() {
        if (!this.isRunning) return;

        const videoSize = this.webcamManager.getVideoSize();
        this.threeRenderer.updateCamera(videoSize.width, videoSize.height);

        debugLog('APP', '캔버스 크기 조정:', videoSize);
    }

    /**
     * 상태 업데이트
     * @param {string} status
     */
    updateStatus(status) {
        this.statusValueElement.textContent = status;
    }
}

// DOM 로드 후 앱 시작
window.addEventListener('DOMContentLoaded', () => {
    const app = new VirtualClothingApp();
    window.app = app; // 디버깅용

    console.log(`
    ╔═══════════════════════════════════════════════╗
    ║   MediaPipe 가상 의류 착용 시스템            ║
    ║   Virtual Clothing Try-On System              ║
    ╠═══════════════════════════════════════════════╣
    ║   Phase 1-5 구현 완료                         ║
    ║   - 웹캠 캡처                                 ║
    ║   - MediaPipe Pose 검출                       ║
    ║   - Three.js 3D 렌더링                        ║
    ║   - 의상 리깅 시스템                          ║
    ║   - 디버그 모드 (스켈레톤 표시)              ║
    ╠═══════════════════════════════════════════════╣
    ║   시작 버튼을 눌러 데모를 시작하세요!        ║
    ╚═══════════════════════════════════════════════╝
    `);
});
