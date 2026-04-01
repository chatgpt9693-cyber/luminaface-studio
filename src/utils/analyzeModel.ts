import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * Analyzes a face GLB model and calculates optimal zone positions
 * based on actual mesh geometry and bounding boxes
 */
export function analyzeFaceModel(gltf: GLTF) {
  const scene = gltf.scene;
  
  // Calculate overall bounding box
  const bbox = new THREE.Box3().setFromObject(scene);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  bbox.getCenter(center);
  bbox.getSize(size);

  console.log('📦 Model Bounding Box:', {
    min: bbox.min.toArray(),
    max: bbox.max.toArray(),
    center: center.toArray(),
    size: size.toArray(),
  });

  // Find all meshes
  const meshes: THREE.Mesh[] = [];
  scene.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      meshes.push(obj as THREE.Mesh);
    }
  });

  console.log(`🎭 Found ${meshes.length} meshes`);

  // Calculate face zones based on Y-axis distribution
  const height = size.y;
  const width = size.x;
  const depth = size.z;

  // Typical face proportions (from center)
  const zones = {
    forehead: {
      pos: [0, center.y + height * 0.30, center.z + depth * 0.15] as [number, number, number],
      scale: [width * 0.35, height * 0.12, depth * 0.12] as [number, number, number],
    },
    eye_area: {
      pos: [0, center.y + height * 0.10, center.z + depth * 0.18] as [number, number, number],
      scale: [width * 0.45, height * 0.08, depth * 0.10] as [number, number, number],
    },
    left_cheek: {
      pos: [center.x - width * 0.25, center.y - height * 0.05, center.z + depth * 0.16] as [number, number, number],
      scale: [width * 0.18, height * 0.12, depth * 0.12] as [number, number, number],
    },
    right_cheek: {
      pos: [center.x + width * 0.25, center.y - height * 0.05, center.z + depth * 0.16] as [number, number, number],
      scale: [width * 0.18, height * 0.12, depth * 0.12] as [number, number, number],
    },
    jawline: {
      pos: [0, center.y - height * 0.25, center.z + depth * 0.14] as [number, number, number],
      scale: [width * 0.35, height * 0.08, depth * 0.10] as [number, number, number],
    },
    neck: {
      pos: [0, center.y - height * 0.45, center.z + depth * 0.08] as [number, number, number],
      scale: [width * 0.25, height * 0.15, depth * 0.10] as [number, number, number],
    },
  };

  console.log('🎯 Calculated Zone Positions:', zones);

  return {
    bbox,
    center,
    size,
    zones,
    meshCount: meshes.length,
  };
}

/**
 * Formats zone data for copy-paste into FaceModel.tsx
 */
export function formatZonesForCode(zones: ReturnType<typeof analyzeFaceModel>['zones']) {
  const lines = Object.entries(zones).map(([id, data]) => {
    const pos = data.pos.map(v => v.toFixed(2)).join(', ');
    const scale = data.scale.map(v => v.toFixed(2)).join(', ');
    return `  { id: '${id}', pos: [${pos}], scale: [${scale}] },`;
  });

  return `const ZONE_HITS: ZoneHit[] = [\n${lines.join('\n')}\n];`;
}
