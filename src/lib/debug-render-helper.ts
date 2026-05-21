// debug-render-helper.ts
// Hilfsfunktionen zur Identifikation von Object-Render-Problemen

export const debugRenderValue = (value: any, context: string = 'unknown'): string => {
  if (value === null || value === undefined) {
    console.warn(`[DEBUG] ${context}: null/undefined value`);
    return '';
  }
  
  if (typeof value === 'object') {
    console.error(`[DEBUG] ${context}: OBJECT DETECTED!`, value);
    if (Array.isArray(value)) {
      console.error(`[DEBUG] ${context}: It's an array with length ${value.length}`);
      return `[Array:${value.length}]`;
    } else {
      console.error(`[DEBUG] ${context}: It's an object with keys:`, Object.keys(value));
      return JSON.stringify(value);
    }
  }
  
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  
  console.warn(`[DEBUG] ${context}: Unknown type ${typeof value}:`, value);
  return String(value);
};

export const safeRenderString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  if (typeof value === 'object') {
    // NEVER render objects directly in React
    return JSON.stringify(value);
  }
  return String(value);
};

export const safeRenderNumber = (value: any, defaultValue: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};
