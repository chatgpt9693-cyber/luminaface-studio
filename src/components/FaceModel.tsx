import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export type FaceZone = 'forehead' | 'eyes' | 'cheeks' | 'jaw' | 'lymph' | 'lips';

interface FaceZoneData {
  id: FaceZone;
  label: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  description: string;
  color: string;
  glowColor: string;
}

const zones: FaceZoneData[] = [
  { id: 'forehead', label: 'Лоб', x: 200, y: 80, rx: 75, ry: 38, description: 'Снятие напряжения лобных мышц', color: 'hsl(340 45% 72% / 0.25)', glowColor: 'hsl(340, 45%, 72%)' },
  { id: 'eyes', label: 'Глаза', x: 200, y: 148, rx: 85, ry: 22, description: 'Круговые мышцы глаза', color: 'hsl(280 30% 70% / 0.25)', glowColor: 'hsl(280, 30%, 70%)' },
  { id: 'cheeks', label: 'Скулы', x: 200, y: 215, rx: 100, ry: 42, description: 'Скуловые мышцы, лифтинг', color: 'hsl(350 35% 75% / 0.25)', glowColor: 'hsl(350, 35%, 75%)' },
  { id: 'lips', label: 'Губы', x: 200, y: 280, rx: 55, ry: 22, description: 'Круговая мышца рта', color: 'hsl(340 45% 72% / 0.25)', glowColor: 'hsl(340, 45%, 72%)' },
  { id: 'jaw', label: 'Челюсть', x: 200, y: 325, rx: 80, ry: 30, description: 'Жевательные мышцы, контур', color: 'hsl(300 25% 65% / 0.25)', glowColor: 'hsl(300, 25%, 65%)' },
  { id: 'lymph', label: 'Лимфодренаж', x: 200, y: 375, rx: 65, ry: 22, description: 'Лимфатические пути шеи', color: 'hsl(180 35% 60% / 0.25)', glowColor: 'hsl(180, 35%, 60%)' },
];

interface Props {
  mode?: 'demo' | 'history';
  activeZones?: FaceZone[];
  onZoneClick?: (zone: FaceZone) => void;
  selectedZone?: FaceZone | null;
}

export default function FaceModel({ mode = 'demo', activeZones, onZoneClick, selectedZone }: Props) {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [hoveredZone, setHoveredZone] = useState<FaceZone | null>(null);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; opacity: number }[]>([]);
  const particleTimerRef = useRef<NodeJS.Timeout>();

  // Animate particles on active zones
  useEffect(() => {
    const spawnParticle = () => {
      const activeZoneList = activeZones || zones.map(z => z.id);
      const zone = zones[Math.floor(Math.random() * activeZoneList.length)];
      if (!zone) return;

      const p = {
        id: Date.now() + Math.random(),
        x: zone.x + (Math.random() - 0.5) * zone.rx * 1.5,
        y: zone.y + (Math.random() - 0.5) * zone.ry * 2,
        opacity: 1,
      };
      setParticles(prev => [...prev.slice(-15), p]);

      setTimeout(() => {
        setParticles(prev => prev.filter(pp => pp.id !== p.id));
      }, 2000);
    };

    particleTimerRef.current = setInterval(spawnParticle, 400);
    return () => clearInterval(particleTimerRef.current);
  }, [activeZones]);

  const isZoneActive = (zoneId: FaceZone) => {
    if (mode === 'history' && activeZones) return activeZones.includes(zoneId);
    return true;
  };

  const getZoneOpacity = (zone: FaceZoneData) => {
    if (hoveredZone === zone.id || selectedZone === zone.id) return 0.85;
    if (mode === 'history' && activeZones && !activeZones.includes(zone.id)) return 0.08;
    return 0.35;
  };

  const tooltip = hoveredZone ? zones.find(z => z.id === hoveredZone) : null;

  return (
    <div className="relative select-none">
      <svg
        ref={canvasRef}
        viewBox="0 0 400 460"
        width="100%"
        style={{ maxHeight: 420 }}
        className="overflow-visible"
      >
        <defs>
          {zones.map(z => (
            <filter key={z.id} id={`glow-${z.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          <filter id="face-glow">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Face silhouette */}
        <g opacity="0.9">
          {/* Head shape */}
          <ellipse cx="200" cy="200" rx="130" ry="155" fill="hsl(30 20% 18%)" stroke="hsl(340 30% 72% / 0.2)" strokeWidth="1" />
          {/* Neck */}
          <rect x="168" y="340" width="64" height="70" rx="8" fill="hsl(30 20% 18%)" />
          {/* Chin bottom */}
          <ellipse cx="200" cy="340" rx="52" ry="18" fill="hsl(30 20% 18%)" />
          {/* Face highlight */}
          <ellipse cx="185" cy="180" rx="60" ry="90" fill="hsl(340 30% 72% / 0.03)" />
        </g>

        {/* Facial features */}
        <g>
          {/* Eyebrows */}
          <path d="M148 130 Q168 122 190 125" stroke="hsl(30 15% 40%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M210 125 Q232 122 252 130" stroke="hsl(30 15% 40%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Eyes */}
          <ellipse cx="168" cy="148" rx="20" ry="10" fill="hsl(220 30% 12%)" stroke="hsl(30 20% 50%)" strokeWidth="1" />
          <ellipse cx="232" cy="148" rx="20" ry="10" fill="hsl(220 30% 12%)" stroke="hsl(30 20% 50%)" strokeWidth="1" />
          <circle cx="172" cy="147" r="6" fill="hsl(220 50% 25%)" />
          <circle cx="236" cy="147" r="6" fill="hsl(220 50% 25%)" />
          <circle cx="174" cy="145" r="2" fill="hsl(0 0% 90% / 0.6)" />
          <circle cx="238" cy="145" r="2" fill="hsl(0 0% 90% / 0.6)" />
          {/* Nose */}
          <path d="M200 165 L192 195 Q200 200 208 195 Z" fill="hsl(30 15% 22%)" stroke="hsl(30 20% 35%)" strokeWidth="1" />
          {/* Lips */}
          <path d="M178 278 Q192 272 200 273 Q208 272 222 278 Q212 290 200 291 Q188 290 178 278Z" fill="hsl(340 45% 45%)" />
          <path d="M180 278 Q200 268 220 278" stroke="hsl(340 30% 60%)" strokeWidth="1" fill="none" strokeLinecap="round" />
          {/* Cheekbones highlight */}
          <ellipse cx="155" cy="215" rx="22" ry="14" fill="hsl(340 45% 72% / 0.08)" />
          <ellipse cx="245" cy="215" rx="22" ry="14" fill="hsl(340 45% 72% / 0.08)" />
          {/* Ears */}
          <ellipse cx="72" cy="210" rx="16" ry="24" fill="hsl(30 20% 17%)" stroke="hsl(30 20% 28%)" strokeWidth="1" />
          <ellipse cx="328" cy="210" rx="16" ry="24" fill="hsl(30 20% 17%)" stroke="hsl(30 20% 28%)" strokeWidth="1" />
          {/* Hair hint */}
          <path d="M75 140 Q100 50 200 45 Q300 50 325 140" fill="hsl(30 15% 14%)" stroke="none" />
        </g>

        {/* Clickable zones */}
        {zones.map(zone => (
          <g
            key={zone.id}
            style={{ cursor: isZoneActive(zone.id) ? 'pointer' : 'default' }}
            onClick={() => isZoneActive(zone.id) && onZoneClick?.(zone.id)}
            onMouseEnter={() => setHoveredZone(zone.id)}
            onMouseLeave={() => setHoveredZone(null)}
          >
            <ellipse
              cx={zone.x}
              cy={zone.y}
              rx={zone.rx}
              ry={zone.ry}
              fill={zone.color}
              stroke={zone.glowColor}
              strokeWidth={hoveredZone === zone.id || selectedZone === zone.id ? 1.5 : 0.5}
              opacity={getZoneOpacity(zone)}
              filter={hoveredZone === zone.id || selectedZone === zone.id ? `url(#glow-${zone.id})` : undefined}
              style={{ transition: 'all 0.3s ease' }}
            />
            {/* Zone label */}
            {(hoveredZone === zone.id || selectedZone === zone.id) && (
              <text
                x={zone.x}
                y={zone.y + 4}
                textAnchor="middle"
                fontSize="11"
                fill={zone.glowColor}
                fontWeight="500"
                fontFamily="Inter, sans-serif"
                style={{ pointerEvents: 'none' }}
              >
                {zone.label}
              </text>
            )}
          </g>
        ))}

        {/* Glowing particles */}
        {particles.map(p => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r="2"
            fill="hsl(340, 45%, 82%)"
            opacity={p.opacity * 0.6}
            style={{ animation: 'float 2s ease-out forwards' }}
          />
        ))}

        {/* Lymphatic flow lines (when lymph zone active) */}
        {(mode === 'demo' || (activeZones && activeZones.includes('lymph'))) && (
          <g opacity="0.25">
            <path d="M145 340 Q120 380 100 420" stroke="hsl(180, 35%, 60%)" strokeWidth="1.5" fill="none" strokeDasharray="4 4" />
            <path d="M255 340 Q280 380 300 420" stroke="hsl(180, 35%, 60%)" strokeWidth="1.5" fill="none" strokeDasharray="4 4" />
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 glass-card px-3 py-2 text-center pointer-events-none"
          style={{ minWidth: 180 }}
        >
          <p className="text-xs font-semibold text-primary">{tooltip.label}</p>
          <p className="text-xs text-muted-foreground">{tooltip.description}</p>
        </motion.div>
      )}

      {/* Mode badge */}
      <div className="absolute top-2 right-2">
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          {mode === 'demo' ? '✦ Демо' : '📍 История'}
        </span>
      </div>
    </div>
  );
}
