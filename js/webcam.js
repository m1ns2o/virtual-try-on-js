/**
 * 웹캠 캡처 모듈
 * 웹캠 스트림을 획득하고 video 엘리먼트에 연결
 */

export class WebcamManager {
    constructor(videoElement) {
        this.video = videoElement;
        this.stream = null;
    }

    /**
     * 웹캠 초기화 및 시작
     * @returns {Promise<void>}
     */
    async setupCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('이 브라우저는 웹캠을 지원하지 않습니다.');
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false
            });

            this.video.srcObject = this.stream;

            // 비디오 메타데이터가 로드될 때까지 대기
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    resolve();
                };
            });

            await this.video.play();

            console.log('✅ 웹캠 초기화 완료:', {
                width: this.video.videoWidth,
                height: this.video.videoHeight
            });

        } catch (error) {
            console.error('❌ 웹캠 접근 실패:', error);
            throw new Error('웹캠에 접근할 수 없습니다. 권한을 확인해주세요.');
        }
    }

    /**
     * 비디오 엘리먼트 반환
     * @returns {HTMLVideoElement}
     */
    getVideoElement() {
        return this.video;
    }

    /**
     * 비디오 크기 반환
     * @returns {{width: number, height: number}}
     */
    getVideoSize() {
        return {
            width: this.video.videoWidth,
            height: this.video.videoHeight
        };
    }

    /**
     * 웹캠 중지
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            console.log('🛑 웹캠 중지');
        }
    }
}
