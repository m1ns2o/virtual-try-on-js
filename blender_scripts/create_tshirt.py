"""
Blender Python Script: 간단한 3D 티셔츠 모델 생성 (Blender 4.5 호환)
실행 방법: Blender를 열고 Scripting 탭에서 이 스크립트를 실행
또는: blender --background --python create_tshirt_fixed.py
"""

import bpy
import bmesh
from mathutils import Vector
import os

# 기존 오브젝트 삭제
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def create_simple_tshirt():
    """간단한 큐브 기반 티셔츠 3D 모델 생성"""

    # 새 메시 생성
    mesh = bpy.data.meshes.new("TShirt_Mesh")
    obj = bpy.data.objects.new("TShirt", mesh)

    # 씬에 추가
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # BMesh로 정점 생성
    bm = bmesh.new()

    # 티셔츠 몸통 정점 (8개)
    body_vertices = [
        Vector((-0.3, -0.5, 0)),    # 0: 왼쪽 하단 앞
        Vector((0.3, -0.5, 0)),     # 1: 오른쪽 하단 앞
        Vector((0.3, 0.3, 0)),      # 2: 오른쪽 상단 앞
        Vector((-0.3, 0.3, 0)),     # 3: 왼쪽 상단 앞
        Vector((-0.3, -0.5, 0.2)),  # 4: 왼쪽 하단 뒤
        Vector((0.3, -0.5, 0.2)),   # 5: 오른쪽 하단 뒤
        Vector((0.3, 0.3, 0.2)),    # 6: 오른쪽 상단 뒤
        Vector((-0.3, 0.3, 0.2)),   # 7: 왼쪽 상단 뒤
    ]

    # 정점 추가
    verts = [bm.verts.new(v) for v in body_vertices]
    bm.verts.ensure_lookup_table()

    # 몸통 면 생성
    faces = [
        [verts[0], verts[1], verts[2], verts[3]],  # 앞면
        [verts[4], verts[5], verts[6], verts[7]],  # 뒷면
        [verts[0], verts[1], verts[5], verts[4]],  # 아래
        [verts[2], verts[3], verts[7], verts[6]],  # 위
        [verts[0], verts[3], verts[7], verts[4]],  # 왼쪽
        [verts[1], verts[2], verts[6], verts[5]],  # 오른쪽
    ]

    for face in faces:
        bm.faces.new(face)

    # 왼쪽 소매 추가
    left_sleeve_verts = [
        Vector((-0.3, 0.2, 0)),    # 어깨 연결부
        Vector((-0.5, -0.2, 0)),    # 소매 끝
        Vector((-0.5, -0.2, 0.15)),
        Vector((-0.3, 0.2, 0.15)),
    ]

    sleeve_verts_left = [bm.verts.new(v) for v in left_sleeve_verts]
    bm.faces.new(sleeve_verts_left)

    # 오른쪽 소매 추가
    right_sleeve_verts = [
        Vector((0.3, 0.2, 0)),
        Vector((0.5, -0.2, 0)),
        Vector((0.5, -0.2, 0.15)),
        Vector((0.3, 0.2, 0.15)),
    ]

    sleeve_verts_right = [bm.verts.new(v) for v in right_sleeve_verts]
    bm.faces.new(sleeve_verts_right)

    # 목 부분 (원형)
    neck_verts = []
    import math
    for i in range(8):
        angle = (i / 8.0) * 2 * math.pi
        x = math.cos(angle) * 0.1
        y = 0.3 + math.sin(angle) * 0.1
        neck_verts.append(bm.verts.new(Vector((x, y, 0.1))))

    # BMesh를 메시에 적용
    bm.to_mesh(mesh)
    bm.free()

    # Smooth shading
    bpy.ops.object.shade_smooth()

    # Subdivision surface modifier 추가 (부드럽게)
    modifier = obj.modifiers.new(name="Subsurf", type='SUBSURF')
    modifier.levels = 1
    modifier.render_levels = 2

    # 머티리얼 추가
    mat = bpy.data.materials.new(name="TShirt_Material")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.29, 0.56, 0.88, 1.0)  # 파란색
        bsdf.inputs['Roughness'].default_value = 0.5

    obj.data.materials.append(mat)

    return obj

def create_detailed_tshirt():
    """더 정교한 티셔츠 모델 (메시 기반)"""

    # Cube로 시작
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "TShirt_Detailed"

    # Edit 모드로 전환
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')

    # 스케일 조정
    bpy.ops.transform.resize(value=(0.35, 0.5, 0.2))

    # Subdivision
    bpy.ops.mesh.subdivide(number_cuts=2)

    # Object 모드로 전환
    bpy.ops.object.mode_set(mode='OBJECT')

    # Subdivision modifier
    modifier = obj.modifiers.new(name="Subsurf", type='SUBSURF')
    modifier.levels = 2
    modifier.render_levels = 3

    # Smooth
    bpy.ops.object.shade_smooth()

    # 소매 추가 (왼쪽)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=8,
        radius=0.08,
        depth=0.35,
        location=(-0.35, 0.1, 0),
        rotation=(0, 1.57, 0)  # 90도 회전
    )
    left_sleeve = bpy.context.active_object
    left_sleeve.name = "LeftSleeve"

    # 소매 추가 (오른쪽)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=8,
        radius=0.08,
        depth=0.35,
        location=(0.35, 0.1, 0),
        rotation=(0, 1.57, 0)
    )
    right_sleeve = bpy.context.active_object
    right_sleeve.name = "RightSleeve"

    # 모든 파트 선택하여 하나로 병합
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    left_sleeve.select_set(True)
    right_sleeve.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.object.join()

    # 머티리얼
    mat = bpy.data.materials.new(name="TShirt_Material_Detailed")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.29, 0.56, 0.88, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.4
        bsdf.inputs['Metallic'].default_value = 0.1

    obj.data.materials.append(mat)

    return obj

# 모델 생성 (원하는 버전 선택)
print("🎨 티셔츠 3D 모델 생성 중...")

# 간단한 버전 또는 상세 버전 선택
USE_DETAILED = True

if USE_DETAILED:
    tshirt = create_detailed_tshirt()
    print("✅ 상세 티셔츠 모델 생성 완료")
else:
    tshirt = create_simple_tshirt()
    print("✅ 간단한 티셔츠 모델 생성 완료")

# 카메라와 조명 추가
bpy.ops.object.camera_add(location=(0, -3, 1))
camera = bpy.context.active_object

bpy.ops.object.light_add(type='SUN', location=(2, 2, 5))
light = bpy.context.active_object

# 씬 설정
bpy.context.scene.camera = camera

# ===== 🔧 Blender 4.5 호환 OBJ 내보내기 =====

# 현재 작업 디렉토리 기준 절대 경로 설정
output_filename = "tshirt_generated.obj"
output_path = os.path.abspath(output_filename)

print(f"📁 내보내기 경로: {output_path}")

try:
    # Blender 4.x에서는 bpy.ops.wm.obj_export() 사용
    # 주요 매개변수:
    # - filepath: 파일 경로
    # - export_selected_objects: False = 모든 오브젝트 내보내기
    # - export_materials: True = 머티리얼 정보 포함
    # - export_triangulated_mesh: False = 삼각형 변환 안 함
    # - export_normals: True = 법선 벡터 포함
    # - export_uv: True = UV 좌표 포함
    
    bpy.ops.wm.obj_export(
        filepath=output_path,
        export_selected_objects=False,  # 모든 오브젝트 내보내기
        export_materials=True,
        export_triangulated_mesh=False,
        export_normals=True,
        export_uv=True,
        path_mode='AUTO'
    )
    
    print(f"💾 OBJ 파일 저장 완료: {output_path}")
    print(f"📝 생성된 파일:")
    print(f"   - {output_filename}")
    print(f"   - {output_filename.replace('.obj', '.mtl')} (머티리얼 파일)")
    print("\n✨ 사용법: 이 파일을 Three.js 또는 다른 3D 뷰어에서 불러오세요!")
    
except AttributeError as e:
    print(f"❌ OBJ 내보내기 실패: {e}")
    print("⚠️  Blender 버전을 확인하세요. Blender 4.0 이상이 필요합니다.")
    print(f"   현재 Blender 버전: {bpy.app.version_string}")
    
except Exception as e:
    print(f"❌ 예상치 못한 오류: {e}")

print("\n🎉 스크립트 실행 완료!")