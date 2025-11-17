/**
 * Three.js 렌더러 모듈
 * 3D 씬 설정 및 의상 모델 렌더링
 */

// Three.js 및 로더를 ES Module로 import (import map 사용)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export class ThreeRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clothingModel = null;
        this.videoTexture = null;
        this.videoPlane = null;
        this.debugCube = null;
        this.renderCount = 0;
    }

    /**
     * Three.js 초기화
     * @param {number} width - 캔버스 너비
     * @param {number} height - 캔버스 높이
     */
    initialize(width, height) {
        // Scene 생성
        this.scene = new THREE.Scene();

        // Camera 설정 (PerspectiveCamera - 실제 3D용)
        const aspect = width / height;
        this.camera = new THREE.PerspectiveCamera(
            50, // FOV
            aspect,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 2); // 카메라 위치

        // Renderer 설정
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0); // 투명 배경

        // 조명 설정
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 1, 1);
        this.scene.add(directionalLight);

        console.log('✅ Three.js 초기화 완료');
        console.log('📐 캔버스 크기:', {
            width,
            height,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            aspect
        });
        console.log('📷 카메라 위치:', this.camera.position);

        // 디버그: 간단한 테스트 큐브 추가 (렌더링 확인용)
        this.addDebugCube();
    }

    /**
     * 웹캠 영상을 배경으로 설정 (CSS로 처리하므로 비활성화)
     * @param {HTMLVideoElement} videoElement
     */
    setupVideoBackground(videoElement) {
        // CSS로 웹캠을 배경으로 표시하므로
        // Three.js에서는 투명한 오버레이만 렌더링
        console.log('✅ 비디오 배경 설정 완료 (CSS 방식)');
    }

    /**
     * 3D 의상 모델 로드
     * @param {string} modelPath - GLTF 모델 경로
     * @returns {Promise<void>}
     */
    async loadClothingModel(modelPath) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();

            loader.load(
                modelPath,
                (gltf) => {
                    this.clothingModel = gltf.scene;
                    this.clothingModel.scale.set(0.15, 0.15, 0.15);
                    this.clothingModel.position.set(0, 0, 0);
                    this.scene.add(this.clothingModel);

                    console.log('✅ 의상 모델 로드 완료:', modelPath);
                    resolve();
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    console.log(`로딩 중... ${percent.toFixed(0)}%`);
                },
                (error) => {
                    console.error('❌ 모델 로드 실패:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * OBJ 의상 모델 로드
     * @param {string} modelPath - OBJ 모델 경로
     * @returns {Promise<void>}
     */
    async loadOBJModel(modelPath) {
        return new Promise((resolve, reject) => {
            const loader = new OBJLoader();

            loader.load(
                modelPath,
                (object) => {
                    // OBJ 로드 성공
                    this.clothingModel = object;

                    // 기본 머티리얼 설정
                    this.clothingModel.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.material = new THREE.MeshPhongMaterial({
                                color: 0x4a90e2,
                                transparent: true,
                                opacity: 0.85,
                                side: THREE.DoubleSide
                            });
                        }
                    });

                    // 모델 중심점 계산
                    const box = new THREE.Box3().setFromObject(this.clothingModel);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());

                    // 중심점 이동
                    this.clothingModel.position.sub(center);

                    // 스케일 자동 조정 (크기에 맞게)
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 0.8 / maxDim; // 화면에 맞게 조정
                    this.clothingModel.scale.set(scale, scale, scale);

                    // 위치 조정
                    this.clothingModel.position.set(0, 0, 0);

                    console.log('📊 OBJ 모델 정보:', {
                        size: size,
                        center: center,
                        scale: scale
                    });

                    // OBJ 모델을 body로 이름 지정
                    this.clothingModel.name = 'body';

                    this.scene.add(this.clothingModel);

                    // OBJ 모델에는 파트 이름이 없으므로 동적으로 소매 추가
                    this.addDynamicSleevesToModel();

                    console.log('✅ OBJ 의상 모델 로드 완료:', modelPath);
                    console.log('📦 모델 정보:', {
                        childrenCount: this.clothingModel.children.length,
                        position: this.clothingModel.position,
                        scale: this.clothingModel.scale,
                        visible: this.clothingModel.visible,
                        inScene: this.scene.children.includes(this.clothingModel)
                    });
                    resolve();
                },
                (progress) => {
                    if (progress.total > 0) {
                        const percent = (progress.loaded / progress.total) * 100;
                        console.log(`OBJ 로딩 중... ${percent.toFixed(0)}%`);
                    }
                },
                (error) => {
                    console.error('❌ OBJ 모델 로드 실패:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * 진짜 3D 티셔츠 모델 생성 (Geometry 기반)
     */
    create3DTShirt() {
        const group = new THREE.Group();

        // 머티리얼
        const shirtMaterial = new THREE.MeshPhongMaterial({
            color: 0x4a90e2,
            transparent: true,
            opacity: 0.9,
            shininess: 50,
            side: THREE.DoubleSide
        });

        // 1. 몸통 (ExtrudeGeometry로 3D)
        const bodyShape = new THREE.Shape();
        bodyShape.moveTo(-0.3, -0.4);
        bodyShape.lineTo(0.3, -0.4);
        bodyShape.lineTo(0.3, 0.3);
        bodyShape.lineTo(-0.3, 0.3);
        bodyShape.lineTo(-0.3, -0.4);

        const extrudeSettings = {
            depth: 0.2,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 3
        };

        const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
        const body = new THREE.Mesh(bodyGeometry, shirtMaterial);
        body.position.z = -0.1; // 중앙 정렬
        body.name = 'body';
        group.add(body);

        // 2. 목 부분 (Torus)
        const neckGeometry = new THREE.TorusGeometry(0.12, 0.03, 8, 16);
        const neck = new THREE.Mesh(neckGeometry, shirtMaterial);
        neck.position.set(0, 0.3, 0);
        neck.rotation.x = Math.PI / 2;
        neck.name = 'neck';
        group.add(neck);

        // 3. 왼쪽 소매 (원통형 + 테이퍼)
        const leftSleeveGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.35, 12);
        const leftSleeve = new THREE.Mesh(leftSleeveGeometry, shirtMaterial);
        leftSleeve.position.set(-0.32, 0.05, 0);
        leftSleeve.rotation.z = Math.PI / 4; // 45도 기울임
        leftSleeve.name = 'leftSleeve';
        group.add(leftSleeve);

        // 4. 오른쪽 소매
        const rightSleeve = leftSleeve.clone();
        rightSleeve.position.set(0.32, 0.05, 0);
        rightSleeve.rotation.z = -Math.PI / 4;
        rightSleeve.name = 'rightSleeve';
        group.add(rightSleeve);

        // 5. 왼쪽 하완
        const leftForearmGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.3, 12);
        const leftForearm = new THREE.Mesh(leftForearmGeometry, shirtMaterial);
        leftForearm.position.set(-0.45, -0.2, 0);
        leftForearm.rotation.z = Math.PI / 6;
        leftForearm.name = 'leftForearm';
        group.add(leftForearm);

        // 6. 오른쪽 하완
        const rightForearm = leftForearm.clone();
        rightForearm.position.set(0.45, -0.2, 0);
        rightForearm.rotation.z = -Math.PI / 6;
        rightForearm.name = 'rightForearm';
        group.add(rightForearm);

        // 7. 어깨 패드 (구형)
        const shoulderGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const leftShoulder = new THREE.Mesh(shoulderGeometry, shirtMaterial);
        leftShoulder.position.set(-0.3, 0.2, 0);
        leftShoulder.scale.set(1, 0.8, 1.2);
        leftShoulder.name = 'leftShoulder';
        group.add(leftShoulder);

        const rightShoulder = leftShoulder.clone();
        rightShoulder.position.set(0.3, 0.2, 0);
        rightShoulder.name = 'rightShoulder';
        group.add(rightShoulder);

        // 전체 그룹을 정면으로 회전 (ExtrudeGeometry가 측면을 향하므로)
        // Y축을 기준으로 180도 회전하여 정면을 향하게 함
        group.rotation.y = Math.PI;

        this.clothingModel = group;
        this.scene.add(this.clothingModel);

        console.log('✅ 진짜 3D 티셔츠 모델 생성 완료 (Geometry 기반, 정면 향함)');
        console.log('📦 모델 정보:', {
            childrenCount: this.clothingModel.children.length,
            position: this.clothingModel.position,
            rotation: this.clothingModel.rotation,
            visible: this.clothingModel.visible,
            inScene: this.scene.children.includes(this.clothingModel)
        });
    }

    /**
     * 간단한 의상 모델 생성 (3D 큐브 기반)
     * OBJ 로드 실패 시 fallback으로 사용
     */
    createSimpleClothing() {
        // 셔츠 형태의 3D 큐브 기반 모델
        const group = new THREE.Group();

        // 메인 색상
        const shirtColor = 0x4a90e2;
        const accentColor = 0x3a7bc8;

        // 몸통 (메인 바디)
        const bodyGeometry = new THREE.BoxGeometry(0.35, 0.45, 0.18);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: shirtColor,
            transparent: true,
            opacity: 0.85,
            shininess: 30
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.name = 'body';
        group.add(body);

        // 목 부분
        const neckGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
        const neckMaterial = new THREE.MeshPhongMaterial({
            color: accentColor,
            transparent: true,
            opacity: 0.85
        });
        const neck = new THREE.Mesh(neckGeometry, neckMaterial);
        neck.position.set(0, 0.25, 0);
        neck.name = 'neck';
        group.add(neck);

        // 왼쪽 어깨
        const shoulderGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.16);
        const leftShoulder = new THREE.Mesh(shoulderGeometry, bodyMaterial);
        leftShoulder.position.set(-0.23, 0.18, 0);
        leftShoulder.name = 'leftShoulder';
        group.add(leftShoulder);

        // 오른쪽 어깨
        const rightShoulder = new THREE.Mesh(shoulderGeometry.clone(), bodyMaterial);
        rightShoulder.position.set(0.23, 0.18, 0);
        rightShoulder.name = 'rightShoulder';
        group.add(rightShoulder);

        // 왼쪽 소매 (상완)
        const leftSleeveGeometry = new THREE.BoxGeometry(0.11, 0.32, 0.11);
        const leftSleeveMaterial = new THREE.MeshPhongMaterial({
            color: shirtColor,
            transparent: true,
            opacity: 0.85,
            shininess: 30
        });
        const leftSleeve = new THREE.Mesh(leftSleeveGeometry, leftSleeveMaterial);
        leftSleeve.position.set(-0.23, -0.05, 0);
        leftSleeve.name = 'leftSleeve';
        group.add(leftSleeve);

        // 오른쪽 소매 (상완)
        const rightSleeve = new THREE.Mesh(leftSleeveGeometry.clone(), leftSleeveMaterial.clone());
        rightSleeve.position.set(0.23, -0.05, 0);
        rightSleeve.name = 'rightSleeve';
        group.add(rightSleeve);

        // 왼쪽 하완 (팔꿈치 아래)
        const leftForearmGeometry = new THREE.BoxGeometry(0.09, 0.25, 0.09);
        const leftForearm = new THREE.Mesh(leftForearmGeometry, leftSleeveMaterial.clone());
        leftForearm.position.set(-0.23, -0.30, 0);
        leftForearm.name = 'leftForearm';
        group.add(leftForearm);

        // 오른쪽 하완
        const rightForearm = new THREE.Mesh(leftForearmGeometry.clone(), leftSleeveMaterial.clone());
        rightForearm.position.set(0.23, -0.30, 0);
        rightForearm.name = 'rightForearm';
        group.add(rightForearm);

        // 하단 부분 (허리)
        const waistGeometry = new THREE.BoxGeometry(0.32, 0.08, 0.16);
        const waist = new THREE.Mesh(waistGeometry, bodyMaterial);
        waist.position.set(0, -0.26, 0);
        waist.name = 'waist';
        group.add(waist);

        // 와이어프레임 추가 (디버그/스타일용)
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            opacity: 0.1,
            transparent: true
        });
        const wireframe = new THREE.Mesh(bodyGeometry, wireframeMaterial);
        group.add(wireframe);

        this.clothingModel = group;
        this.scene.add(this.clothingModel);

        console.log('✅ 3D 큐브 기반 의상 모델 생성 완료 (향상된 버전)');
        console.log('📦 모델 정보:', {
            childrenCount: this.clothingModel.children.length,
            position: this.clothingModel.position,
            visible: this.clothingModel.visible,
            inScene: this.scene.children.includes(this.clothingModel)
        });
    }

    /**
     * 의상 모델 위치 업데이트
     * @param {number} x - X 좌표
     * @param {number} y - Y 좌표
     * @param {number} z - Z 좌표
     */
    updateClothingPosition(x, y, z = 0) {
        if (this.clothingModel) {
            this.clothingModel.position.set(x, y, z);
        }
    }

    /**
     * 의상 모델 회전 업데이트
     * @param {number} x - X축 회전 (라디안)
     * @param {number} y - Y축 회전
     * @param {number} z - Z축 회전
     */
    updateClothingRotation(x, y, z) {
        if (this.clothingModel) {
            this.clothingModel.rotation.set(x, y, z);
        }
    }

    /**
     * 의상 모델 스케일 업데이트
     * @param {number} x - X축 스케일
     * @param {number} y - Y축 스케일
     * @param {number} z - Z축 스케일
     */
    updateClothingScale(x, y, z) {
        if (this.clothingModel) {
            this.clothingModel.scale.set(x, y, z);
        }
    }

    /**
     * 의상 모델의 특정 파트 가져오기
     * @param {string} partName - 파트 이름
     * @returns {THREE.Object3D|null}
     */
    getClothingPart(partName) {
        if (this.clothingModel) {
            return this.clothingModel.getObjectByName(partName);
        }
        return null;
    }

    /**
     * 카메라 업데이트 (캔버스 크기 변경 시)
     * @param {number} width
     * @param {number} height
     */
    updateCamera(width, height) {
        const aspect = width / height;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * 렌더링
     */
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);

            // 디버그: 처음 몇 프레임만 로그 출력
            if (!this.renderCount) {
                this.renderCount = 0;
            }
            this.renderCount++;

            if (this.renderCount <= 3) {
                console.log(`🎬 렌더링 #${this.renderCount}:`, {
                    sceneChildren: this.scene.children.length,
                    canvasSize: `${this.canvas.width}x${this.canvas.height}`,
                    hasClothingModel: !!this.clothingModel
                });
            }
        } else {
            console.error('❌ 렌더링 실패: renderer, scene, camera 중 하나가 없음');
        }
    }

    /**
     * OBJ 모델에 동적 소매 추가
     * OBJ 파일은 파트 이름이 없으므로 팔 움직임을 추적할 수 있는 소매를 추가
     */
    addDynamicSleevesToModel() {
        if (!this.clothingModel) return;

        const sleeveMaterial = new THREE.MeshPhongMaterial({
            color: 0x4a90e2,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });

        // 왼쪽 소매 (상완: 어깨~팔꿈치)
        const leftSleeveGeometry = new THREE.CylinderGeometry(0.08, 0.07, 0.3, 12);
        const leftSleeve = new THREE.Mesh(leftSleeveGeometry, sleeveMaterial);
        leftSleeve.name = 'leftSleeve';
        leftSleeve.position.set(-0.3, 0, 0); // 초기 위치
        this.clothingModel.add(leftSleeve);

        // 오른쪽 소매 (상완: 어깨~팔꿈치)
        const rightSleeve = new THREE.Mesh(leftSleeveGeometry.clone(), sleeveMaterial.clone());
        rightSleeve.name = 'rightSleeve';
        rightSleeve.position.set(0.3, 0, 0);
        this.clothingModel.add(rightSleeve);

        // 왼쪽 하완 (팔꿈치~손목)
        const forearmGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.25, 12);
        const leftForearm = new THREE.Mesh(forearmGeometry, sleeveMaterial.clone());
        leftForearm.name = 'leftForearm';
        leftForearm.position.set(-0.45, -0.2, 0);
        this.clothingModel.add(leftForearm);

        // 오른쪽 하완
        const rightForearm = new THREE.Mesh(forearmGeometry.clone(), sleeveMaterial.clone());
        rightForearm.name = 'rightForearm';
        rightForearm.position.set(0.45, -0.2, 0);
        this.clothingModel.add(rightForearm);

        console.log('👕 동적 소매 추가 완료 (왼쪽/오른쪽 상완 + 하완)');
    }

    /**
     * 디버그: 테스트 큐브 추가 (렌더링 확인용)
     */
    addDebugCube() {
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        this.debugCube = new THREE.Mesh(geometry, material);
        this.debugCube.position.set(0.5, 0.5, 0);
        this.scene.add(this.debugCube);
        console.log('🔴 디버그 큐브 추가됨 (빨간색, 우측 상단)');
    }

    /**
     * 디버그 큐브 제거
     */
    removeDebugCube() {
        if (this.debugCube) {
            this.scene.remove(this.debugCube);
            this.debugCube.geometry.dispose();
            this.debugCube.material.dispose();
            this.debugCube = null;
            console.log('🔴 디버그 큐브 제거됨');
        }
    }

    /**
     * 리소스 정리
     */
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.videoTexture) {
            this.videoTexture.dispose();
        }
    }
}
