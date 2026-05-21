'use client';

import React, { useRef, useState } from 'react';
import {
  GartenLayout,
  BeetZuordnung,
  QuadrantId,
  METER_TO_PX,
  m2px,
  getQuadrantBounds,
  getRondeauCenter,
  getBeetSvgRect,
} from '@/types/garden-layout';
import type { Bed } from '@/lib/definitions';

// ─── Farben ────────────────────────────────────────────────────────────────────

const FARBEN = {
  gartenflaeche:  '#1e3a0f',
  weg:            '#c4b080',
  rondeau:        '#d4c090',
  beetFallback:   '#5a8a3c',
  beetRand:       '#ffffff30',
  tooltipBg:      'rgba(15,20,8,0.92)',
  quadrantLabel:  '#ffffff50',
};

const QUADRANT_LABEL_FONT = 18; // px im SVG-Koordinatensystem

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function svgW(layout: GartenLayout) { return m2px(layout.gartenBreite); }
function svgH(layout: GartenLayout) { return m2px(layout.gartenHoehe);  }

// ─── Props ────────────────────────────────────────────────────────────────────

interface GartenDraufsichtProps {
  layout: GartenLayout;
  beds: Bed[];
  onBedClick?: (bedId: string) => void;
}

interface TooltipState {
  svgX: number;
  svgY: number;
  beetId: string;
  label: string;
  sublabel: string;
  color: string;
}

// ─── Hauptkomponente ─────────────────────────────────────────────────────────

export default function GartenDraufsicht({ layout, beds, onBedClick }: GartenDraufsichtProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const w = svgW(layout);
  const h = svgH(layout);

  // Beet-Map für schnellen Zugriff
  const bedById = new Map<string, Bed>(beds.map(b => [b.id, b]));

  // Beete in die Quadranten aufteilen
  const zuordnungen = layout.beetZuordnung;

  // ── Event-Handler für Maus-Position (relativ zum SVG) ──
  function handleMouseEnter(
    e: React.MouseEvent<SVGRectElement>,
    zuordnung: BeetZuordnung,
    bed: Bed | undefined,
  ) {
    const rect = getBeetSvgRect(zuordnung, layout);
    // Tooltip rechts-oben der Beet-Mitte
    const tooltipX = rect.x + rect.width / 2;
    const tooltipY = rect.y;

    setTooltip({
      svgX: tooltipX,
      svgY: tooltipY,
      beetId: zuordnung.beetId,
      label: bed ? `Beet ${bed.bedNumber}: ${bed.name}` : `${zuordnung.quadrant}${zuordnung.nummer}`,
      sublabel: bed ? `${bed.type}  ${bed.width}m × ${bed.length}m` : '',
      color: bed?.color ?? FARBEN.beetFallback,
    });
  }

  return (
    <div className="relative w-full overflow-auto rounded border border-white/10">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        className="block max-w-full"
        style={{ background: FARBEN.gartenflaeche }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* ── Layer 1: Gartenboden ── */}
        <rect x={0} y={0} width={w} height={h} fill={FARBEN.gartenflaeche} />

        {/* ── Layer 2: Quadranten-Hintergrund-Markierung ── */}
        {(['NW', 'NO', 'SW', 'SO'] as QuadrantId[]).map(qId => {
          const b = getQuadrantBounds(qId, layout);
          return (
            <rect
              key={qId}
              x={b.x} y={b.y}
              width={b.w} height={b.h}
              fill="#253d15"
              stroke="none"
            />
          );
        })}

        {/* ── Layer 3: Wege ── */}
        {/* Längsweg (vertikal) */}
        <rect
          x={m2px(layout.weg.xPosition)}
          y={0}
          width={m2px(layout.weg.xBreite)}
          height={h}
          fill={FARBEN.weg}
        />
        {/* Querweg (horizontal) */}
        <rect
          x={0}
          y={m2px(layout.weg.yPosition)}
          width={w}
          height={m2px(layout.weg.yBreite)}
          fill={FARBEN.weg}
        />

        {/* ── Layer 4: Rondeau ── */}
        {layout.rondeau.aktiv && (() => {
          const { cx, cy } = getRondeauCenter(layout);
          const r = m2px(layout.rondeau.radius);
          return (
            <circle cx={cx} cy={cy} r={r} fill={FARBEN.rondeau} />
          );
        })()}

        {/* ── Layer 5: Beete ── */}
        {zuordnungen.map(z => {
          const bed = bedById.get(z.beetId);
          const rect = getBeetSvgRect(z, layout);
          const fill = bed?.color ?? FARBEN.beetFallback;

          return (
            <g key={z.beetId}>
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill={fill}
                stroke={FARBEN.beetRand}
                strokeWidth={1}
                rx={2}
                className="cursor-pointer"
                style={{ transition: 'opacity 0.15s' }}
                onMouseEnter={e => handleMouseEnter(e, z, bed)}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => onBedClick?.(z.beetId)}
              />
              {/* Beet-Beschriftung (Nummer) – nur bei ausreichender Größe) */}
              {rect.width >= 12 && rect.height >= 10 && (
                <text
                  x={rect.x + rect.width / 2}
                  y={rect.y + rect.height / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={Math.min(rect.width, rect.height) * 0.45}
                  fill="#fff"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {`${z.quadrant}${z.nummer}`}
                </text>
              )}
            </g>
          );
        })}

        {/* ── Layer 6: Quadranten-Label ── */}
        {(['NW', 'NO', 'SW', 'SO'] as QuadrantId[]).map(qId => {
          const b = getQuadrantBounds(qId, layout);
          return (
            <text
              key={`lbl-${qId}`}
              x={b.x + b.w / 2}
              y={b.y + b.h / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={QUADRANT_LABEL_FONT}
              fill={FARBEN.quadrantLabel}
              fontWeight="bold"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {qId}
            </text>
          );
        })}

        {/* ── Layer 7: Kompass-Rose (N-Zeiger) ── */}
        <g transform={`translate(${w - 30}, 24)`}>
          <polygon points="0,-12 5,0 0,-4 -5,0" fill="#fff" opacity={0.7} />
          <text x={0} y={8} textAnchor="middle" fontSize={9} fill="#fff" opacity={0.7} fontWeight="bold">N</text>
        </g>

        {/* ── Layer 8: Tooltip ── */}
        {tooltip && (
          <g transform={`translate(${tooltip.svgX + 6}, ${Math.max(0, tooltip.svgY - 48)})`}>
            <rect x={0} y={0} width={160} height={44} rx={4} fill={tooltip.color} opacity={0.95} />
            <text x={8} y={16} fontSize={10} fill="#fff" fontWeight="bold" style={{ pointerEvents: 'none' }}>
              {tooltip.label}
            </text>
            {tooltip.sublabel && (
              <text x={8} y={32} fontSize={9} fill="#ffffffc0" style={{ pointerEvents: 'none' }}>
                {tooltip.sublabel}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
