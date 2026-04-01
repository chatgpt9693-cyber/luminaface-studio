import { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  useGLTF,
  OrbitControls,
  Environment,
  ContactShadows,
  Html,
  useProgress,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeFaceModel, formatZonesForCode } from '@/utils/analyzeModel';

// ─── Types ────────────────────────────────────────────────────────────────────
export type FaceZone =
  | 'forehead'
  | 'left_cheek'
  | 'right_cheek'
  | 'jawline'
  | 'neck';

// Legacy alias so existing pages don't break
export type { FaceZone as FaceZoneLegacy };

interface ZoneMeta {
  id: FaceZone;
  label: string;
  description: string;
  benefit: string;
  /** world-space position hint for the tooltip anchor */
  tipOffset: [number, number, number];
}

const ZONE_META: ZoneMeta[] = [
  { id: 'forehead',    label: 'Лоб',           description: 'Расслабление лобных мышц',        benefit: 'Разглаживание мимических морщин',   tipOffset: [0,  0.55, 0.18] },
  { id: 'left_cheek',  label: 'Левая скула',   description: 'Скуловой лифтинг',                benefit: 'Подтяжка и тонус кожи',             tipOffset: [-0.22, 0.1, 0.18] },
  { id: 'right_cheek', label: 'Правая скула',  description: 'Скуловой лифтинг',                benefit: 'Подтяжка и тонус кожи',             tipOffset: [ 0.22, 0.1, 0.18] },
  { id: 'jawline',     label: 'Челюсть',       description: 'Моделирование овала лица',        benefit: 'Чёткий контур и рельеф',            tipOffset: [0, -0.22, 0.16] },
  { id: 'neck',        label: 'Шея',           description: 'Лимфодренаж и детокс',            benefit: 'Выведение токсинов и отёков',       tipOffset: [0, -0.5, 0.12] },
];

// Rose-gold palette
const ROSE_GOLD  = new THREE.Color('#e8a598');
const IDLE_COLOR = new THREE.Color('#c9a0a0');

// ─── Loader overlay ───────────────────────────────────────────────────────────
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs text-primary font-medium">{Math.round(progress)}%</p>
      </div>
    </Html>
  );
}

// ─── Zone hit-mesh definitions ────────────────────────────────────────────────
// Each zone is a transparent ellipsoid placed over the face.
// Positions are in local space (will be scaled with the model group)
interface ZoneHit {
  id: FaceZone;
  pos: [number, number, number];
  scale: [number, number, number];
}

const ZONE_HITS: ZoneHit[] = [
  { id: 'forehead',    pos: [-0.01,  0.25, 0.27], scale: [0.95, 0.45, 0.40] },
  { id: 'left_cheek',  pos: [-0.14, -0.06, 0.28], scale: [0.42, 0.39, 0.35] }, // Слева (отрицательный X)
  { id: 'right_cheek', pos: [ 0.11, -0.05, 0.29], scale: [0.42, 0.39, 0.35] }, // Справа (положительный X)
  { id: 'jawline',     pos: [-0.00, -0.21, 0.34], scale: [0.81, 0.28, 0.28] },
  { id: 'neck',        pos: [-0.02, -0.40, 0.12], scale: [0.60, 0.49, 0.28] },
];

// ─── Massage wave effect ──────────────────────────────────────────────────────
interface WaveRingProps {
  position: [number, number, number];
  scale: [number, number, number];
  delay: number;
  isActive: boolean;
}

function WaveRing({ position, scale, delay, isActive }: WaveRingProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame(({ clock }) => {
    if (!meshRef.current || !matRef.current || !isActive) return;
    
    const t = (clock.getElapsedTime() - delay) * 2;
    if (t < 0) return;

    // Wave expands and fades out
    const progress = (t % 2) / 2; // 0 to 1, repeats every 2 seconds
    const expansion = 1 + progress * 0.2; // Grows from 1x to 1.2x (even smaller)
    const fade = 1 - progress; // Fades from 1 to 0

    meshRef.current.scale.set(
      scale[0] * expansion * 0.25, // Much smaller - 0.25x
      scale[1] * expansion * 0.25,
      scale[2] * 0.1 // Very flat ring
    );

    matRef.current.opacity = fade * 0.15; // Very transparent
    matRef.current.emissiveIntensity = fade * 0.3; // Minimal glow
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 32, 16]} />
      <meshStandardMaterial
        ref={matRef}
        color="#ffd4c8"
        emissive="#ffb8a8"
        transparent
        opacity={0}
        depthWrite={false}
        side={THREE.DoubleSide}
        roughness={0.3}
        metalness={0.2}
      />
    </mesh>
  );
}

// ─── Single zone hit-sphere with wave effect ──────────────────────────────────
interface ZoneMeshProps {
  hit: ZoneHit;
  isActive: boolean;
  isHovered: boolean;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onClick: () => void;
  debugMode?: boolean;
}

function ZoneMesh({ hit, isActive, onPointerEnter, onPointerLeave, onClick, debugMode }: ZoneMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef  = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame(() => {
    if (!matRef.current) return;

    if (debugMode) {
      // Debug mode: always visible with wireframe
      matRef.current.emissive.copy(ROSE_GOLD);
      matRef.current.emissiveIntensity = 0.5;
      matRef.current.opacity = 0.4;
      matRef.current.wireframe = true;
      return;
    }

    matRef.current.wireframe = false;

    // Always invisible - only wave effect is visible
    matRef.current.emissive.copy(IDLE_COLOR);
    matRef.current.emissiveIntensity = 0.0;
    matRef.current.opacity = 0.0;
  });

  return (
    <group>
      {/* Invisible hit area */}
      <mesh
        ref={meshRef}
        position={hit.pos}
        scale={hit.scale}
        onPointerEnter={(e) => { e.stopPropagation(); onPointerEnter(); }}
        onPointerLeave={(e) => { e.stopPropagation(); onPointerLeave(); }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial
          ref={matRef}
          color={ROSE_GOLD}
          transparent
          opacity={0}
          depthWrite={false}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Massage wave rings - single subtle wave */}
      {isActive && !debugMode && (
        <WaveRing position={hit.pos} scale={hit.scale} delay={0} isActive={isActive} />
      )}
    </group>
  );
}

// ─── GLB Face model ───────────────────────────────────────────────────────────
interface FaceGLBProps {
  activeZone: FaceZone | null;
  hoveredZone: FaceZone | null;
  onZoneHover: (z: FaceZone | null) => void;
  onZoneClick: (z: FaceZone) => void;
  debugMode?: boolean;
  onAnalyze?: (gltf: any) => void;
  calibrationMode?: boolean;
  onCalibrationClick?: (point: [number, number, number]) => void;
  calibrationData?: Record<string, [number, number, number]>;
}

function FaceGLB({ activeZone, hoveredZone, onZoneHover, onZoneClick, debugMode, onAnalyze, calibrationMode, onCalibrationClick, calibrationData }: FaceGLBProps) {
  const groupRef  = useRef<THREE.Group>(null!);
  const { scene } = useGLTF('/models/face.glb');

  // Clone so we don't mutate the cached scene
  const cloned = useRef<THREE.Group | null>(null);
  if (!cloned.current) {
    cloned.current = scene.clone(true);
  }

  // Expose analysis on mount
  useEffect(() => {
    if (onAnalyze) {
      onAnalyze({ scene: cloned.current });
    }
  }, [onAnalyze]);

  // Collect morph-target meshes for blendshape animation
  const morphMeshes = useRef<THREE.Mesh[]>([]);
  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
    cloned.current!.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.isMesh) {
        // Nice skin material - prevent bloom glow
        if (m.material) {
          const mat = (m.material as THREE.MeshStandardMaterial);
          mat.roughness  = 0.75;
          mat.metalness  = 0.02;
          mat.envMapIntensity = 0.8;
          mat.emissive = new THREE.Color(0x000000); // No emission
          mat.emissiveIntensity = 0;
        }
        if (m.morphTargetInfluences?.length) meshes.push(m);
      }
    });
    morphMeshes.current = meshes;
  }, []);

  // Gentle idle rotation + blendshape pulse
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Removed idle sway - keep model centered
    // if (groupRef.current) {
    //   groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.06;
    // }

    // Soft skin-pulse on active zone
    morphMeshes.current.forEach((m) => {
      if (!m.morphTargetInfluences) return;
      if (activeZone) {
        m.morphTargetInfluences[0] = 0.04 + Math.sin(t * 2.8) * 0.03;
      } else {
        m.morphTargetInfluences[0] = THREE.MathUtils.lerp(
          m.morphTargetInfluences[0], 0, 0.05
        );
      }
    });
  });

  return (
    <group ref={groupRef} rotation={[0, 0, 0]}>
      {/* The actual face mesh - scaled */}
      <primitive 
        object={cloned.current} 
        scale={3.5}
        onClick={(e: any) => {
          if (calibrationMode && onCalibrationClick) {
            e.stopPropagation();
            const point = e.point;
            console.log('🖱️ Click registered at:', { 
              x: point.x.toFixed(2), 
              y: point.y.toFixed(2), 
              z: point.z.toFixed(2) 
            });
            onCalibrationClick([point.x, point.y, point.z]);
          }
        }}
      />

      {/* Invisible hit zones - disabled during calibration */}
      {!calibrationMode && ZONE_HITS.map((hit) => (
        <ZoneMesh
          key={hit.id}
          hit={hit}
          isActive={activeZone === hit.id}
          onPointerEnter={() => onZoneHover(hit.id)}
          onPointerLeave={() => onZoneHover(null)}
          onClick={() => onZoneClick(hit.id)}
          debugMode={debugMode}
        />
      ))}

      {/* Calibration markers - green spheres for completed zones */}
      {calibrationMode && Object.entries(calibrationData).map(([zoneId, pos]) => (
        <mesh key={zoneId} position={pos}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial 
            color="#00ff00" 
            emissive="#00ff00"
            emissiveIntensity={0.8}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// Preload
useGLTF.preload('/models/face.glb');

// ─── Zone description panel (below canvas) ────────────────────────────────────
interface ZoneDescriptionProps {
  zone: ZoneMeta | null;
  isMobile: boolean;
}
function ZoneDescription({ zone, isMobile }: ZoneDescriptionProps) {
  return (
    <div className="mt-4">
      {zone ? (
        <motion.div
          key={zone.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="rounded-2xl border border-primary/30 p-4"
          style={{
            background: 'linear-gradient(135deg, hsl(340 45% 72% / 0.08), hsl(280 30% 70% / 0.05))',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">✨</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-primary mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                {zone.label}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{zone.description}</p>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 inline-flex">
                <span className="text-primary text-sm">💎</span>
                <p className="text-xs text-primary font-medium">{zone.benefit}</p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-2xl border border-border/50 p-4 text-center"
          style={{
            background: 'linear-gradient(135deg, hsl(280 20% 100% / 0.03), hsl(280 20% 100% / 0.01))',
            backdropFilter: 'blur(16px)',
          }}
        >
          <p className="text-sm text-muted-foreground">
            ✨ Нажмите на зону для подробной информации
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Zone legend ──────────────────────────────────────────────────────────────
interface LegendProps {
  activeZone: FaceZone | null;
  onSelect: (z: FaceZone | null) => void;
  isMobile: boolean;
}
function ZoneLegend({ activeZone, onSelect, isMobile }: LegendProps) {
  if (isMobile) {
    // Horizontal scrollable legend for mobile
    return (
      <div className="absolute bottom-16 left-0 right-0 z-10 px-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {ZONE_META.map((z) => (
            <button
              key={z.id}
              onClick={() => onSelect(activeZone === z.id ? null : z.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeZone === z.id
                  ? 'bg-primary/25 border border-primary/50 text-primary shadow-lg shadow-primary/20'
                  : 'bg-secondary/60 border border-border/40 text-muted-foreground'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                activeZone === z.id ? 'bg-primary shadow-[0_0_6px_hsl(340_45%_72%)]' : 'bg-muted-foreground/40'
              }`} />
              {z.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Vertical legend for desktop
  return (
    <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10 pointer-events-auto">
      {ZONE_META.map((z) => (
        <button
          key={z.id}
          onClick={() => onSelect(activeZone === z.id ? null : z.id)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeZone === z.id
              ? 'bg-primary/25 border border-primary/50 text-primary shadow-lg shadow-primary/20'
              : 'bg-secondary/40 border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground'
          }`}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            activeZone === z.id ? 'bg-primary shadow-[0_0_6px_hsl(340_45%_72%)]' : 'bg-muted-foreground/40'
          }`} />
          {z.label}
        </button>
      ))}
    </div>
  );
}

// ─── Public props ─────────────────────────────────────────────────────────────
interface FaceModelProps {
  /** 'demo' = all zones interactive, 'history' = only activeZones highlighted */
  mode?: 'demo' | 'history';
  activeZones?: FaceZone[];
  selectedZone?: FaceZone | null;
  onZoneClick?: (zone: FaceZone) => void;
  /** Height in pixels (ignored on mobile, uses aspect ratio) */
  height?: number;
  showLegend?: boolean;
  /** Custom className for container */
  className?: string;
  /** Debug mode: show zone wireframes */
  debugMode?: boolean;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function FaceModel({
  mode = 'demo',
  activeZones,
  selectedZone,
  onZoneClick,
  height = 420,
  showLegend = true,
  className = '',
  debugMode = false,
}: FaceModelProps) {
  const [hoveredZone, setHoveredZone] = useState<FaceZone | null>(null);
  const [clickedZone, setClickedZone] = useState<FaceZone | null>(selectedZone ?? null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDebug, setIsDebug] = useState(debugMode);
  const [analyzing, setAnalyzing] = useState(false);
  const [modelData, setModelData] = useState<any>(null);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibrationData, setCalibrationData] = useState<Record<string, [number, number, number]>>({});
  const [currentCalibrationZone, setCurrentCalibrationZone] = useState<FaceZone | null>(null);

  const zoneOrder: FaceZone[] = ['forehead', 'left_cheek', 'right_cheek', 'jawline', 'neck'];

  // Analyze model and log optimal zones
  const handleAnalyze = useCallback(() => {
    if (!modelData) {
      alert('⏳ Модель ещё загружается...');
      return;
    }
    
    setAnalyzing(true);
    try {
      const analysis = analyzeFaceModel(modelData);
      const code = formatZonesForCode(analysis.zones);
      
      console.log('═══════════════════════════════════════');
      console.log('📊 FACE MODEL ANALYSIS');
      console.log('═══════════════════════════════════════');
      console.log('Model Size:', analysis.size.toArray());
      console.log('Model Center:', analysis.center.toArray());
      console.log('Mesh Count:', analysis.meshCount);
      console.log('\n📋 Copy this to FaceModel.tsx:\n');
      console.log(code);
      console.log('\n═══════════════════════════════════════');
      
      alert('✅ Анализ завершён! Смотри консоль (F12) для результатов.');
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      alert('❌ Ошибка анализа. Смотри консоль.');
    } finally {
      setAnalyzing(false);
    }
  }, [modelData]);

  // Start calibration mode
  const handleStartCalibration = useCallback(() => {
    setCalibrationMode(true);
    setCalibrationData({});
    setCurrentCalibrationZone(zoneOrder[0]);
    setIsDebug(false);
  }, []);

  // Handle click during calibration
  const handleCalibrationClick = useCallback((point: [number, number, number]) => {
    if (!currentCalibrationZone) {
      console.warn('⚠️ No current calibration zone');
      return;
    }

    const zoneName = ZONE_META.find(z => z.id === currentCalibrationZone)?.label || currentCalibrationZone;
    console.log(`✅ Calibrated "${zoneName}" (${currentCalibrationZone}):`, {
      x: point[0].toFixed(2),
      y: point[1].toFixed(2),
      z: point[2].toFixed(2)
    });

    const newData = { ...calibrationData, [currentCalibrationZone]: point };
    setCalibrationData(newData);

    const currentIndex = zoneOrder.indexOf(currentCalibrationZone);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < zoneOrder.length) {
      // Move to next zone
      const nextZone = zoneOrder[nextIndex];
      const nextZoneName = ZONE_META.find(z => z.id === nextZone)?.label || nextZone;
      console.log(`➡️ Next zone: "${nextZoneName}" (${nextZone}) - ${nextIndex + 1}/${zoneOrder.length}`);
      setCurrentCalibrationZone(nextZone);
    } else {
      // Calibration complete
      console.log('🎉 Calibration complete! All zones marked.');
      finishCalibration(newData);
    }
  }, [currentCalibrationZone, calibrationData]);

  // Finish calibration and generate code
  const finishCalibration = useCallback((data: Record<string, [number, number, number]>) => {
    const zones = zoneOrder.map(id => {
      const pos = data[id] || [0, 0, 0];
      // Use default scales from current ZONE_HITS
      const currentZone = ZONE_HITS.find(z => z.id === id);
      const scale = currentZone?.scale || [0.1, 0.1, 0.1];
      return `  { id: '${id}', pos: [${pos.map(v => v.toFixed(2)).join(', ')}], scale: [${scale.map(v => v.toFixed(2)).join(', ')}] },`;
    });

    const code = `const ZONE_HITS: ZoneHit[] = [\n${zones.join('\n')}\n];`;
    
    console.log('═══════════════════════════════════════');
    console.log('🎯 CALIBRATION COMPLETE');
    console.log('═══════════════════════════════════════');
    console.log('\n📋 Copy this to FaceModel.tsx:\n');
    console.log(code);
    console.log('\n═══════════════════════════════════════');

    alert('✅ Калибровка завершена! Смотри консоль (F12) для кода.');
    setCalibrationMode(false);
    setCurrentCalibrationZone(null);
  }, []);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync debug mode
  useEffect(() => { setIsDebug(debugMode); }, [debugMode]);

  // Sync external selectedZone
  useEffect(() => { setClickedZone(selectedZone ?? null); }, [selectedZone]);

  const handleClick = useCallback((z: FaceZone) => {
    const next = clickedZone === z ? null : z;
    setClickedZone(next);
    onZoneClick?.(z);
  }, [clickedZone, onZoneClick]);

  const handleLegendSelect = useCallback((z: FaceZone | null) => {
    const next = clickedZone === z ? null : z;
    setClickedZone(next);
    if (z) onZoneClick?.(z);
  }, [clickedZone, onZoneClick]);

  // In history mode: show clicked zone if set, otherwise show first from activeZones
  // In demo mode: show clicked zone
  const effectiveActive = mode === 'history' && activeZones && !clickedZone
    ? activeZones[0] ?? null
    : clickedZone;

  const tooltipMeta = hoveredZone
    ? ZONE_META.find(z => z.id === hoveredZone) ?? null
    : (clickedZone ? ZONE_META.find(z => z.id === clickedZone) ?? null : null);

  return (
    <div className={`relative select-none w-full ${className}`}>
      {/* 3D Canvas container */}
      <div 
        className="relative"
        style={isMobile ? { aspectRatio: '3/4', maxHeight: '70vh' } : { height }}
      >
        {/* Legend */}
        {showLegend && (
          <ZoneLegend
            activeZone={effectiveActive}
            onSelect={handleLegendSelect}
            isMobile={isMobile}
          />
        )}

        {/* Mode badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
            {mode === 'demo' ? '✦ Интерактивно' : '📍 История'}
          </span>
        </div>

        {/* Calibration UI - compact top-right panel */}
        {calibrationMode && currentCalibrationZone && (
          <div className="absolute top-16 right-3 z-20 w-64">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="rounded-2xl border border-primary/30 p-4 backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, hsl(340 45% 72% / 0.15), hsl(280 30% 70% / 0.1))',
              boxShadow: '0 8px 32px -8px hsl(340 45% 72% / 0.3)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-primary mb-0.5">
                  🎯 Калибровка
                </h3>
                <p className="text-xs text-muted-foreground">
                  Кликни по зоне
                </p>
              </div>
              <button
                onClick={() => {
                  setCalibrationMode(false);
                  setCurrentCalibrationZone(null);
                  setCalibrationData({});
                  document.body.style.cursor = 'default';
                }}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center mb-3 p-2.5 rounded-xl bg-primary/15 border border-primary/25">
              <span className="text-base font-bold text-primary block">
                {ZONE_META.find(z => z.id === currentCalibrationZone)?.label}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {Object.keys(calibrationData).length + 1} / {zoneOrder.length}
              </p>
            </div>
            
            {/* Progress indicators */}
            <div className="grid grid-cols-5 gap-1.5">
              {zoneOrder.map(id => (
                <div
                  key={id}
                  className={`h-1.5 rounded-full transition-all ${
                    calibrationData[id]
                      ? 'bg-green-500'
                      : id === currentCalibrationZone
                      ? 'bg-primary animate-pulse'
                      : 'bg-secondary/50'
                  }`}
                  title={ZONE_META.find(z => z.id === id)?.label}
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* 3-D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 1.6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, isMobile ? 1.5 : 2]}
        style={{ 
          borderRadius: 16, 
          width: '100%', 
          height: '100%',
          cursor: calibrationMode ? 'crosshair' : 'default'
        }}
      >
        {/* Lighting - softer, less intense */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 3, 2]} intensity={0.8} />
        <directionalLight position={[-2, 1, 1]} intensity={0.3} color="#f0e0e0" />
        <pointLight position={[0, 1.5, 1]} intensity={0.3} color="#f5e5e5" />

        {/* Environment for skin reflections */}
        <Environment preset="studio" />

        <Suspense fallback={<Loader />}>
          <FaceGLB
            activeZone={effectiveActive}
            hoveredZone={hoveredZone}
            onZoneHover={setHoveredZone}
            onZoneClick={handleClick}
            debugMode={isDebug}
            onAnalyze={setModelData}
            calibrationMode={calibrationMode}
            onCalibrationClick={handleCalibrationClick}
            calibrationData={calibrationData}
          />

          {/* Soft shadow under chin */}
          <ContactShadows
            position={[0, -2.2, 0]}
            opacity={0.35}
            scale={2.5}
            blur={2.5}
            far={2}
            color="#c08080"
          />
        </Suspense>

        {/* Post-processing - reduced bloom */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.85}
            luminanceSmoothing={0.95}
            intensity={effectiveActive ? 0.8 : 0.2}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.4} darkness={0.4} />
        </EffectComposer>

        {/* Orbit controls — limited range, zoom enabled */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.2}
          maxDistance={2.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI * 0.72}
          minAzimuthAngle={-Math.PI / 3}
          maxAzimuthAngle={Math.PI / 3}
          dampingFactor={0.08}
          enableDamping
          zoomSpeed={0.6}
        />
      </Canvas>
      </div>

      {/* Zone description panel - below canvas */}
      <AnimatePresence mode="wait">
        <ZoneDescription zone={tooltipMeta} isMobile={isMobile} />
      </AnimatePresence>
    </div>
  );
}
