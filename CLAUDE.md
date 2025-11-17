# CLAUDE.md - AI Assistant Guide for Virtual Try-On System

## Project Overview

**Project Name**: MediaPipe Virtual Try-On System
**Version**: 2.2.0
**Language**: JavaScript (ES6+ Modules)
**Architecture**: Client-side web application (no build process)
**Primary Function**: Real-time virtual clothing try-on using webcam, pose detection, and 3D rendering

### Purpose
This is an interactive web application that overlays 3D clothing models onto a user's body in real-time by tracking body landmarks using MediaPipe Pose and rendering with Three.js.

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **MediaPipe Pose** | Latest (CDN) | 33-point body landmark detection |
| **Three.js** | r150 | 3D rendering engine |
| **Vanilla JavaScript** | ES6+ | Modular application code |
| **HTML5 Canvas** | - | Webcam display & debug overlay |
| **CSS3** | - | Layer-based UI system |

**No bundler or build system** - Uses native ES6 modules loaded directly by the browser.

---

## Project Structure

```
virtual-try-on-js/
├── index.html                 # Main entry point
├── css/
│   └── styles.css             # UI styling with z-index layers
├── js/                        # ES6 modules
│   ├── main.js                # Application controller & render loop
│   ├── webcam.js              # Webcam capture manager
│   ├── pose-detector.js       # MediaPipe Pose wrapper
│   ├── renderer.js            # Three.js renderer & 3D models
│   ├── clothing-rigger.js     # Landmark-to-clothing mapping
│   └── utils.js               # Utility functions (FPS, lerp, etc.)
├── assets/                    # 3D model files
│   ├── tshirt.obj             # Primary clothing model (OBJ)
│   ├── pants.obj              # Pants model
│   └── *.gltf                 # Alternative GLTF models
├── blender_scripts/           # Blender Python scripts
│   └── create_tshirt.py       # Generate 3D clothing models
├── README.md                  # User documentation (Korean)
├── USAGE.md                   # Detailed usage guide
├── ALIGNMENT_FIX.md           # Coordinate system documentation
├── WEBCAM_FIX.md              # CSS layer architecture
└── CLAUDE.md                  # This file
```

---

## Architecture & Design Patterns

### Module System

The application uses **ES6 modules** with clear separation of concerns:

1. **main.js** - Application controller
   - Orchestrates all modules
   - Manages render loop with `requestAnimationFrame`
   - Handles UI events and state

2. **webcam.js** - Webcam management
   - `getUserMedia` API wrapper
   - Video stream lifecycle

3. **pose-detector.js** - Pose detection
   - MediaPipe Pose initialization
   - Landmark extraction (33 points)
   - Skeleton visualization for debug mode

4. **renderer.js** - 3D rendering
   - Three.js scene setup (PerspectiveCamera)
   - 3D model loading (OBJ/GLTF)
   - Procedural geometry generation (fallback)

5. **clothing-rigger.js** - Rigging system
   - MediaPipe → Three.js coordinate transformation
   - Body-to-clothing mapping
   - Smoothing & interpolation

6. **utils.js** - Helper functions
   - FPS calculator
   - Math utilities (lerp, distance, midpoint)
   - Debug logging

### Data Flow

```
User Webcam
    ↓
WebcamManager (webcam.js)
    ↓
PoseDetector (pose-detector.js) → MediaPipe Pose → 33 Landmarks
    ↓
ClothingRigger (clothing-rigger.js) → Transform coordinates
    ↓
ThreeRenderer (renderer.js) → Update 3D model position/rotation/scale
    ↓
Canvas (output) → Rendered frame
```

### Layer Architecture (Z-Index System)

The UI uses **CSS-based layering** (see WEBCAM_FIX.md):

```
Layer Stack (bottom → top):
┌─────────────────────────────┐
│  Webcam Video (z: 1)        │  ← Background (HTML <video>)
├─────────────────────────────┤
│  3D Canvas (z: 5)           │  ← Transparent overlay (Three.js)
├─────────────────────────────┤
│  Debug Canvas (z: 10)       │  ← Skeleton visualization
├─────────────────────────────┤
│  UI Controls (z: 100)       │  ← Buttons & info panel
└─────────────────────────────┘
```

**Critical**: Never use Three.js videoPlane for background - use CSS positioning instead.

---

## Coordinate System

### MediaPipe → Three.js Transformation

**MediaPipe Coordinates** (normalized 0-1):
- `x`: 0 (left) → 1 (right)
- `y`: 0 (top) → 1 (bottom)
- `z`: 0 (near camera) → 1 (far from camera)

**Three.js Coordinates**:
- `x`: -1 (left) → +1 (right)
- `y`: -1 (bottom) → +1 (top)
- `z`: negative = toward camera, positive = away

**Transformation Formula** (clothing-rigger.js:114-116):
```javascript
const x = (mediapipe.x - 0.5) * 2;      // Center and scale
const y = -(mediapipe.y - 0.5) * 2;     // Invert Y axis
const z = -mediapipe.z * 2;              // Invert Z (camera direction)
```

**Important**: The `* 2` scaling factor expands the movement range for better visibility.

---

## Key Implementation Details

### 1. 3D Model Loading Strategy

**Priority order** (renderer.js:94-106):
1. **OBJ file** (`assets/tshirt.obj`) - Load with `THREE.OBJLoader`
2. **Fallback 1**: Procedural 3D geometry (`create3DTShirt()`)
3. **Fallback 2**: Simple cube-based model (`createSimpleClothing()`)

**Model Requirements**:
- Format: OBJ or GLTF
- Polygon count: < 5000 for performance
- Auto-scaled using bounding box (renderer.js:127-137)

### 2. 3D Model Orientation

**Critical Fix** (ALIGNMENT_FIX.md):
- ExtrudeGeometry faces wrong direction by default
- **Solution**: Apply 180° Y-axis rotation (renderer.js:257)
  ```javascript
  group.rotation.y = Math.PI;  // Face forward
  ```

### 3. Rigging System

**Body Parts Tracked**:
- Shoulders (landmarks 11, 12)
- Elbows (13, 14)
- Wrists (15, 16)
- Hips (23, 24)

**Rigging Components** (clothing-rigger.js):
1. **Position**: Center on shoulder midpoint
2. **Scale**: Adjust to body dimensions
   - Width: shoulder distance
   - Height: torso length (shoulder-to-hip)
3. **Sleeve Rotation**: Match arm angle
   - Calculate with `Math.atan2(dy, dx)`
   - Apply 90° correction for cylinder orientation

**Smoothing** (clothing-rigger.js:82-96):
- Uses linear interpolation (lerp)
- Smoothing factor: 0.3 (configurable)
- Prevents jittery movement

### 4. Rendering Loop

**Frame Pipeline** (main.js:165-224):
```javascript
async renderLoop() {
    1. Detect pose → get landmarks
    2. Update clothing rigging
    3. Render Three.js scene
    4. Draw debug skeleton (if enabled)
    5. Calculate & display FPS
    6. Schedule next frame
}
```

**Performance Target**: ≥30 FPS

---

## Development Workflow

### Running the Application

**Requirements**:
- Local web server (file:// protocol not supported)
- HTTPS or localhost (webcam permission)
- Modern browser with WebGL 2.0

**Start Server**:
```bash
# Python 3
python -m http.server 8080

# Node.js
npx http-server -p 8080
```

**Access**: http://localhost:8080

### Testing Checklist

1. Webcam displays in background (z: 1)
2. 3D clothing overlays correctly (z: 5)
3. Debug mode shows skeleton (z: 10)
4. Clothing follows body movement
5. FPS ≥ 30
6. No console errors

### Debug Mode

**Enable**: Check "디버그 모드" checkbox

**Visualization**:
- Green lines: body connections (skeleton)
- Red dots: 33 landmarks
- White numbers: landmark indices (11-28)

**Console Logs**:
```javascript
✅ 웹캠 초기화 완료
✅ MediaPipe Pose 초기화 완료
✅ Three.js 초기화 완료
✅ 비디오 배경 설정 완료 (CSS 방식)
✅ 진짜 3D 티셔츠 모델 생성 완료
```

---

## Common Tasks for AI Assistants

### Task 1: Adjust Clothing Position

**File**: `clothing-rigger.js:114-118`

```javascript
// Add offsets to fine-tune position
const x = (center.x - 0.5) * 2 + offsetX;
const y = -(center.y - 0.5) * 2 + offsetY;
const z = -center.z * 2 + offsetZ;
```

### Task 2: Change Clothing Color

**File**: `renderer.js:175` (for procedural models)

```javascript
const shirtMaterial = new THREE.MeshPhongMaterial({
    color: 0x4a90e2,  // Change this hex color
    transparent: true,
    opacity: 0.9,
});
```

### Task 3: Optimize Performance

**Options**:
1. **Reduce webcam resolution** (webcam.js:24-25):
   ```javascript
   width: { ideal: 640 },   // Lower from 1280
   height: { ideal: 480 },  // Lower from 720
   ```

2. **Simplify MediaPipe model** (pose-detector.js:27):
   ```javascript
   modelComplexity: 0,  // 0=Lite, 1=Full, 2=Heavy
   ```

3. **Reduce geometry segments** (renderer.js:213):
   ```javascript
   new THREE.CylinderGeometry(0.08, 0.06, 0.35, 8)  // Lower segment count
   ```

### Task 4: Add New Clothing Parts

**Steps**:
1. Create geometry in `renderer.js` (e.g., `createPants()`)
2. Add to scene with unique `name` property
3. Add rigging logic in `clothing-rigger.js`
4. Map to appropriate landmarks

**Example** (adding hat):
```javascript
// In renderer.js
const hatGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.1, 16);
const hat = new THREE.Mesh(hatGeometry, material);
hat.name = 'hat';
group.add(hat);

// In clothing-rigger.js
updateHat(clothingModel, landmarks[POSE_LANDMARKS.NOSE]);
```

### Task 5: Load Custom 3D Models

**File**: `main.js:99-106`

```javascript
try {
    await this.threeRenderer.loadOBJModel('assets/your-model.obj');
} catch (error) {
    // Fallback to procedural model
}
```

**Model Preparation**:
- Center pivot at origin
- Reasonable scale (~1 unit)
- Check normals (should face outward)
- Export from Blender using `blender_scripts/create_tshirt.py` as template

---

## Important Conventions

### Code Style

1. **ES6 Modules**: Use `import`/`export`, not CommonJS
2. **Class-based**: Each module exports a class
3. **JSDoc comments**: Document public methods
4. **Async/await**: For promise-based operations
5. **Naming**:
   - Classes: PascalCase (`WebcamManager`)
   - Methods: camelCase (`updateBodyPosition`)
   - Constants: UPPER_SNAKE_CASE (`POSE_LANDMARKS`)

### Error Handling

```javascript
try {
    // Operation
    console.log('✅ Success message');
} catch (error) {
    console.error('❌ Error message:', error);
    // Fallback or user notification
}
```

### Logging Format

```javascript
// Success
console.log('✅ Operation completed');

// Warning
console.warn('⚠️ Non-critical issue');

// Error
console.error('❌ Critical failure');

// Debug info
console.log('📊 Debug data:', object);
```

---

## Performance Considerations

### Bottlenecks

1. **MediaPipe Pose**: Most CPU-intensive
   - Runs on every frame
   - Use `modelComplexity: 1` (not 2)

2. **Three.js Rendering**: GPU-bound
   - Keep polygon count < 5000
   - Use single material when possible

3. **Coordinate Transformation**: Minimal impact
   - Already optimized with smoothing

### Optimization Checklist

- [ ] Webcam resolution ≤ 1280x720
- [ ] MediaPipe complexity = 1 (not 2)
- [ ] Clothing model < 5000 polygons
- [ ] Smoothing factor ≤ 0.3
- [ ] FPS counter shows ≥ 30

---

## Known Issues & Solutions

### Issue 1: Clothing Appears Sideways

**Cause**: ExtrudeGeometry default orientation
**Fix**: Apply Y-rotation (renderer.js:257)
**Reference**: ALIGNMENT_FIX.md

### Issue 2: Webcam Not Visible

**Cause**: Three.js videoPlane conflicts
**Fix**: Use CSS layers (styles.css:24-37)
**Reference**: WEBCAM_FIX.md

### Issue 3: Jittery Movement

**Cause**: No smoothing on landmarks
**Fix**: Increase smoothing factor (clothing-rigger.js:12)
```javascript
this.smoothingFactor = 0.5;  // Higher = smoother (but laggy)
```

### Issue 4: Sleeves Don't Match Arms

**Cause**: Incorrect coordinate transformation
**Fix**: Ensure 90° correction (clothing-rigger.js:257)
```javascript
sleeve.rotation.z = angle - Math.PI / 2;
```

---

## MediaPipe Pose Landmark Reference

**Key Indices** (pose-detector.js:185-219):

```javascript
NOSE: 0
LEFT_SHOULDER: 11
RIGHT_SHOULDER: 12
LEFT_ELBOW: 13
RIGHT_ELBOW: 14
LEFT_WRIST: 15
RIGHT_WRIST: 16
LEFT_HIP: 23
RIGHT_HIP: 24
LEFT_KNEE: 25
RIGHT_KNEE: 26
LEFT_ANKLE: 27
RIGHT_ANKLE: 28
```

**Total**: 33 landmarks (includes face, hands, feet)

---

## File Modification Guide

### When to Edit Each File

| File | Edit When... |
|------|-------------|
| `main.js` | Changing app flow, adding features, modifying render loop |
| `webcam.js` | Adjusting camera settings, resolution, constraints |
| `pose-detector.js` | Changing MediaPipe options, adding custom skeleton visualization |
| `renderer.js` | Creating new 3D models, adjusting materials, lighting |
| `clothing-rigger.js` | Modifying body-to-clothing mapping, rigging logic |
| `utils.js` | Adding math helpers, utilities |
| `styles.css` | Changing UI appearance, z-index layers |
| `index.html` | Adding UI elements, changing layout |

### Critical Lines to Preserve

1. **renderer.js:257** - Y-rotation for correct orientation
2. **clothing-rigger.js:114-116** - Coordinate transformation
3. **styles.css:36, 50, 64, 83, 149** - Z-index layering
4. **main.js:165-224** - Render loop structure

---

## Git Workflow

**Current Branch**: `claude/claude-md-mi2y39hqxea7r767-019pj6bb2s4xwbE342vw4tfZ`

**Commit Message Format**:
```
<type>: <description>

Examples:
feat: add pants rigging system
fix: correct sleeve rotation angle
docs: update CLAUDE.md with rigging details
perf: optimize coordinate transformation
```

**Before Committing**:
1. Test in browser
2. Check console for errors
3. Verify FPS ≥ 30
4. Test debug mode

---

## Testing Strategy

### Manual Testing

1. **Start Application**
   - Click "시작" button
   - Grant webcam permission
   - Verify video displays

2. **Movement Test**
   - Raise arms → sleeves should follow
   - Move left/right → clothing should track
   - Step closer/farther → clothing should scale

3. **Debug Test**
   - Enable debug checkbox
   - Verify skeleton aligns with body
   - Check landmark numbers visible

4. **Performance Test**
   - Monitor FPS counter
   - Should stay above 30 FPS
   - No visual stuttering

### Console Testing

Open DevTools Console and check for:
```javascript
window.app  // Should exist (global reference)
window.app.clothingRigger  // Access to modules
window.app.poseDetector.getLandmarks()  // Get current landmarks
```

---

## External Dependencies (CDN)

**MediaPipe** (index.html:40-43):
```html
@mediapipe/camera_utils
@mediapipe/control_utils
@mediapipe/drawing_utils
@mediapipe/pose
```

**Three.js** (index.html:46-48):
```html
three@0.150.0/build/three.min.js
three@0.150.0/examples/js/loaders/GLTFLoader.js
three@0.150.0/examples/js/loaders/OBJLoader.js
```

**No package.json** - All dependencies loaded via CDN.

---

## Future Enhancement Ideas

- [ ] Multiple clothing options (shirt selector UI)
- [ ] Pants rigging (hip-to-ankle tracking)
- [ ] Screenshot/recording functionality
- [ ] Hand gesture controls (MediaPipe Hands)
- [ ] Mobile optimization (touch controls)
- [ ] Multi-person detection
- [ ] Texture mapping (upload custom designs)
- [ ] Lighting controls

---

## Debugging Tips for AI Assistants

### Problem: Clothing not visible

**Check**:
1. Console for loading errors
2. `window.app.threeRenderer.clothingModel` exists
3. Material opacity > 0
4. Model scale not too small/large

### Problem: Coordinate mismatch

**Check**:
1. Transformation formula (clothing-rigger.js:114-116)
2. Y-axis inversion applied
3. Z-axis inverted for camera direction

### Problem: Poor performance

**Check**:
1. FPS counter value
2. Browser GPU acceleration enabled
3. Polygon count in models
4. MediaPipe modelComplexity setting

### Problem: Rotation incorrect

**Check**:
1. Sleeve rotation includes 90° correction
2. Model orientation (Y-rotation = Math.PI)
3. Angle calculation uses transformed coordinates

---

## Quick Reference: Important Numbers

| Setting | Value | Location | Purpose |
|---------|-------|----------|---------|
| Webcam resolution | 1280x720 | webcam.js:24-25 | Balance quality/performance |
| MediaPipe complexity | 1 | pose-detector.js:27 | AI model accuracy |
| Smoothing factor | 0.3 | clothing-rigger.js:12 | Movement smoothness |
| Camera FOV | 50° | renderer.js:29 | Perspective view |
| Camera position | (0,0,2) | renderer.js:34 | Distance from scene |
| Coordinate scale | * 2 | clothing-rigger.js:114-116 | Movement range |
| Sleeve rotation offset | -π/2 | clothing-rigger.js:257 | Cylinder alignment |
| Model Y-rotation | π (180°) | renderer.js:257 | Face forward |

---

## Contact & Documentation

**Primary Docs**:
- README.md - User guide (Korean)
- USAGE.md - Detailed usage
- ALIGNMENT_FIX.md - Coordinate system
- WEBCAM_FIX.md - Layer architecture

**External Resources**:
- [MediaPipe Pose](https://google.github.io/mediapipe/solutions/pose.html)
- [Three.js Docs](https://threejs.org/docs/)
- [WebGL Fundamentals](https://webglfundamentals.org/)

---

## Version History

**v2.2.0** (2025-11-17)
- Fixed 3D model alignment (Y-rotation)
- Corrected coordinate transformation
- Improved sleeve rigging accuracy

**v2.1.0** (2025-11-17)
- Fixed webcam display (CSS layers)
- Removed Three.js videoPlane
- Updated z-index system

**v2.0.0**
- Added procedural 3D geometry
- PerspectiveCamera implementation
- OBJ loading with auto-scaling

**v1.0.0**
- Initial release
- Phase 1-5 complete
- Basic rigging system

---

## AI Assistant Guidelines

When modifying this codebase:

1. **Preserve Architecture**: Don't change the modular ES6 structure
2. **Maintain Layers**: Keep z-index system intact
3. **Test Immediately**: Browser reload required for changes
4. **Check Console**: Verify success messages appear
5. **Document Changes**: Update CLAUDE.md if architecture changes
6. **Follow Patterns**: Match existing code style and conventions
7. **Validate Coordinates**: Test with debug mode enabled
8. **Monitor Performance**: Keep FPS ≥ 30

**Most Common Mistakes**:
- Forgetting Y-axis inversion
- Omitting 90° rotation correction
- Breaking z-index layering
- Using wrong coordinate space (MediaPipe vs Three.js)
- Not testing debug mode

---

**Last Updated**: 2025-11-17
**Maintained By**: AI Assistant (Claude Code)
**Project Status**: Active Development
