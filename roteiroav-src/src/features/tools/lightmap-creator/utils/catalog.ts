import { BaseObject } from "../store/useLightMapStore";

type CatalogItem = Omit<BaseObject, "id" | "x" | "y">;

export const CATALOG: Record<string, CatalogItem> = {
  'desk': { type: 'prop', subtype: 'desk', width: 1.4, height: 0.7, color: '#4a3d2a', label: 'Desk' },
  'dining-table': { type: 'prop', subtype: 'dining-table', width: 1.8, height: 0.9, color: '#5a4a3a', label: 'Dining Table' },
  'chair': { type: 'prop', subtype: 'chair', width: 0.5, height: 0.5, color: '#4a4a4a', label: 'Chair' },
  'mesa': { type: 'prop', subtype: 'mesa', width: 1.4, height: 0.7, color: '#4a3d2a', label: 'Mesa', borderRadius: 0, opacity: 1 },
  'sofa': { type: 'prop', subtype: 'sofa', width: 2.0, height: 0.85, color: '#4a5a6a', label: 'Sofa', properties: { model: 'sofa3' } },
  'bed-single': { type: 'prop', subtype: 'bed-single', width: 0.9, height: 2.0, color: '#5a5a7a', label: 'Bed (Single)' },
  'bed-double': { type: 'prop', subtype: 'bed-double', width: 1.6, height: 2.0, color: '#5a5a7a', label: 'Bed (Double)' },
  'tv': { type: 'prop', subtype: 'tv', width: 1.2, height: 0.1, color: '#222', label: 'TV' },
  'shelf': { type: 'prop', subtype: 'shelf', width: 1.0, height: 0.3, color: '#4a3d2a', label: 'Shelf' },
  'lamp-table': { type: 'prop', subtype: 'lamp-table', width: 0.3, height: 0.3, color: '#6a6a5a', label: 'Table Lamp' },
  // Animals
  'cat': { type: 'character', subtype: 'cat', width: 0.5, height: 0.35, color: '#c2956b', label: 'Gato' },
  'dog': { type: 'character', subtype: 'dog', width: 0.7, height: 0.45, color: '#a07850', label: 'Cachorro' },
  // Vehicles
  'car': { type: 'prop', subtype: 'car', width: 4.5, height: 1.8, color: '#4a6a9a', label: 'Carro' },
  'truck': { type: 'prop', subtype: 'truck', width: 8.0, height: 2.5, color: '#5a5a5a', label: 'Caminhão' },
  'bicycle': { type: 'prop', subtype: 'bicycle', width: 1.8, height: 0.6, color: '#6a8a5a', label: 'Bicicleta' },
  'motorcycle': { type: 'prop', subtype: 'motorcycle', width: 2.2, height: 0.8, color: '#8a6a5a', label: 'Moto' },
  // Music
  'guitar': { type: 'prop', subtype: 'guitar', width: 0.4, height: 1.2, color: '#8b6914', label: 'Guitarra' },
  'drum': { type: 'prop', subtype: 'drum', width: 1.5, height: 1.5, color: '#5a4a3a', label: 'Bateria' },
  'piano': { type: 'prop', subtype: 'piano', width: 1.6, height: 1.4, color: '#111', label: 'Piano', properties: { model: 'piano01' } },
  'char-male': { type: 'character', subtype: 'char-male', width: 0.5, height: 0.3, color: '#5a7abf', label: 'Ator', properties: { model: 'man_main' } },
  'char-female': { type: 'character', subtype: 'char-female', width: 0.5, height: 0.3, color: '#bf5a7a', label: 'Atriz', properties: { model: 'woman_main' } },
  'char-child': { type: 'character', subtype: 'char-child', width: 0.35, height: 0.25, color: '#7abf5a', label: 'Child' },
  'camera': { type: 'camera', subtype: 'camera', width: 0.6, height: 0.4, color: '#ff4455', label: 'CAM A', properties: { lensType: 'Prime', focalLength: 35, frameRate: 24, aperture: 'T2.8', notes: '' } },
  'light-bulb': { type: 'light', subtype: 'bulb', width: 0.3, height: 0.3, color: '#f0a500', label: 'Bulb', properties: { powerW: 100, intensity: 80, colorTemp: 5600, radius: 2, model: '', notes: '' } },
  'light-spot': { type: 'light', subtype: 'spot', width: 0.3, height: 0.3, color: '#f0a500', label: 'Spot', properties: { powerW: 500, intensity: 80, colorTemp: 5600, coneAngle: 35, range: 3, spotModel: 'reflector', notes: '' } },
  'light-panel': { type: 'light', subtype: 'panel', width: 0.6, height: 0.3, color: '#ccddff', label: 'Panel', properties: { powerW: 300, intensity: 70, colorTemp: 5600, panelW: 0.6, range: 2, model: '', notes: '' } },
  'light-sun': { type: 'light', subtype: 'sun', width: 0.4, height: 0.4, color: '#ffdd44', label: 'Sun', properties: { intensity: 100, azimuth: 180, elevation: 45 } }
};

export function kelvinToHex(K: number) {
    K = Math.max(1000, Math.min(40000, K)) / 100;
    let r, g, b;
    if (K <= 66) { r = 255; g = Math.max(0, Math.min(255, 99.47 * Math.log(K) - 161.12)); } 
    else { r = Math.max(0, Math.min(255, 329.7 * Math.pow(K - 60, -0.13))); g = Math.max(0, Math.min(255, 288.12 * Math.pow(K - 60, -0.08))); }
    if (K >= 66) b = 255; 
    else if (K <= 19) b = 0; 
    else b = Math.max(0, Math.min(255, 138.52 * Math.log(K - 10) - 305.04));
    return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('');
}

export function hexToRgba(hex: string, a: number) { 
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16); 
    return `rgba(${r},${g},${b},${a})`; 
}

export function fovFromFocal(fl: number) { 
    return 2 * Math.atan(36 / (2 * fl)) * 180 / Math.PI; 
}

export function generateId(prefix: string) {
    return prefix + Math.random().toString(36).substr(2, 9);
}

export function mToStr(m: number) { 
    const cm = Math.round(Math.abs(m) * 100); 
    return `${Math.floor(cm/100)}m ${(cm%100).toString().padStart(2,'0')}cm`; 
}
