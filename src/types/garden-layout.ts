/**
 * Typen für das Quadranten-Lageplan-System (v2.0)
 * Garten: 85m (W-O) × 43m (N-S)
 */

export type QuadrantId = 'NW' | 'NO' | 'SW' | 'SO';

/** N-S = Beete verlaufen Nord-Süd (bisherige Orientierung, W-Quadranten)
 *  W-O = Beete verlaufen West-Ost (neue Orientierung, O-Quadranten) */
export type BeetOrientierung = 'ns' | 'wo';

export interface WegConfig {
  /** Längsweg (vertikal, N-S verlaufend): Abstand seiner linken Kante von West in Metern */
  xPosition: number;
  xBreite: number;
  /** Querweg (horizontal, W-O verlaufend): Abstand seiner oberen Kante von Nord in Metern */
  yPosition: number;
  yBreite: number;
}

export interface RondeauConfig {
  /** Radius in Metern */
  radius: number;
  aktiv: boolean;
}

export interface QuadrantConfig {
  id: QuadrantId;
  orientierung: BeetOrientierung;
  /** Standard-Beetbreite (quer zur Beetrichtung) in Metern */
  standardBeetBreite: number;
  /** Abstand zwischen zwei Beeten in Metern */
  abstandZwischenBeeten: number;
}

/** Zuordnung eines bestehenden Beet-Datensatzes zu einer Position im Lageplan */
export interface BeetZuordnung {
  /** ID des BaseBed-Datensatzes */
  beetId: string;
  quadrant: QuadrantId;
  /** Laufende Nummer im Quadrant (1–15), bestimmt die Reihenfolge/Position */
  nummer: number;
  /** Optionaler Längen-Override in Metern (quer zur Beetrichtung bleibt standardBeetBreite) */
  beetLaenge?: number;
}

export interface GartenLayout {
  gartenBreite: number;  // W-O in Metern
  gartenHoehe: number;   // N-S in Metern
  weg: WegConfig;
  rondeau: RondeauConfig;
  quadranten: QuadrantConfig[];
  beetZuordnung: BeetZuordnung[];
}

export type GardenViewMode = 'classic' | 'quadrant';

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_GARTEN_LAYOUT: GartenLayout = {
  gartenBreite: 85,
  gartenHoehe:  43,
  weg: {
    xPosition: 41,   // Längsweg-Linke-Kante bei 41 m von W → mittig
    xBreite:    3,
    yPosition: 20,   // Querweg-Oberkante bei 20 m von N → mittig
    yBreite:    3,
  },
  rondeau: {
    radius: 3.5,
    aktiv:  true,
  },
  quadranten: [
    { id: 'NW', orientierung: 'ns', standardBeetBreite: 1.5, abstandZwischenBeeten: 0.5 },
    { id: 'NO', orientierung: 'wo', standardBeetBreite: 1.5, abstandZwischenBeeten: 0.5 },
    { id: 'SW', orientierung: 'ns', standardBeetBreite: 1.5, abstandZwischenBeeten: 0.5 },
    { id: 'SO', orientierung: 'wo', standardBeetBreite: 1.5, abstandZwischenBeeten: 0.5 },
  ],
  beetZuordnung: [],
};

// ─── Berechnungs-Hilfsfunktionen ─────────────────────────────────────────────

export const METER_TO_PX = 14; // 1 Meter = 14px → 85m × 14 = 1190px Breite

export function m2px(meters: number): number {
  return Math.round(meters * METER_TO_PX);
}

/** Pixelgenaue Grenzen eines Quadranten (in SVG-Koordinaten) */
export function getQuadrantBounds(
  qId: QuadrantId,
  layout: GartenLayout,
): { x: number; y: number; w: number; h: number } {
  const { xPosition, xBreite, yPosition, yBreite } = layout.weg;

  const leftW   = xPosition;                                 // W-Quadranten Breite
  const rightW  = layout.gartenBreite - xPosition - xBreite; // O-Quadranten Breite
  const topH    = yPosition;                                  // N-Quadranten Höhe
  const botH    = layout.gartenHoehe  - yPosition - yBreite; // S-Quadranten Höhe

  const origins: Record<QuadrantId, { x: number; y: number; w: number; h: number }> = {
    NW: { x: 0,                       y: 0,        w: leftW,  h: topH  },
    NO: { x: xPosition + xBreite,     y: 0,        w: rightW, h: topH  },
    SW: { x: 0,                       y: yPosition + yBreite, w: leftW,  h: botH  },
    SO: { x: xPosition + xBreite,     y: yPosition + yBreite, w: rightW, h: botH  },
  };

  const b = origins[qId];
  return { x: m2px(b.x), y: m2px(b.y), w: m2px(b.w), h: m2px(b.h) };
}

/** Rondeau-Mittelpunkt in SVG-Koordinaten */
export function getRondeauCenter(layout: GartenLayout): { cx: number; cy: number } {
  const { xPosition, xBreite, yPosition, yBreite } = layout.weg;
  return {
    cx: m2px(xPosition + xBreite / 2),
    cy: m2px(yPosition + yBreite / 2),
  };
}

/** SVG-Rechteck für ein Beet innerhalb seines Quadranten */
export function getBeetSvgRect(
  zuordnung: BeetZuordnung,
  layout: GartenLayout,
): { x: number; y: number; width: number; height: number } {
  const qCfg   = layout.quadranten.find(q => q.id === zuordnung.quadrant)!;
  const bounds = getQuadrantBounds(zuordnung.quadrant, layout);

  const beetBreite = qCfg.standardBeetBreite;
  const gapBreite  = qCfg.abstandZwischenBeeten;
  const schritt    = beetBreite + gapBreite; // Meter pro Beet-Slot

  // Nummer ist 1-basiert → Index 0-basiert
  const idx = Math.max(0, zuordnung.nummer - 1);

  if (qCfg.orientierung === 'ns') {
    // Beet läuft N-S (vertikal): Breite (W-O) = beetBreite, Höhe = Quadrant-Höhe
    const beetLaenge = zuordnung.beetLaenge ?? (bounds.h / METER_TO_PX);
    const offsetX    = idx * schritt;
    return {
      x:      bounds.x + m2px(offsetX),
      y:      bounds.y,
      width:  m2px(beetBreite),
      height: m2px(beetLaenge),
    };
  } else {
    // Beet läuft W-O (horizontal): Höhe (N-S) = beetBreite, Breite = Quadrant-Breite
    const beetLaenge = zuordnung.beetLaenge ?? (bounds.w / METER_TO_PX);
    const offsetY    = idx * schritt;
    return {
      x:      bounds.x,
      y:      bounds.y + m2px(offsetY),
      width:  m2px(beetLaenge),
      height: m2px(beetBreite),
    };
  }
}
