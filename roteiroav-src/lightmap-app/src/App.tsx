import { useEffect, useRef } from 'react';
import { useControls } from 'leva';
import { vec2 } from 'gl-matrix';
import { WebGLRenderer } from './renderer/WebGLRenderer';
import type { Light } from './renderer/WebGLRenderer';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const requestRef = useRef<number | undefined>(undefined);

  // Leva Controls for Lights
  const { l1_pos, l2_pos, l3_pos, l1_color, l2_color, l3_color, l1_int, l2_int, l3_int } = useControls('Lights', {
    l1_pos: { x: 0, y: 0 },
    l1_color: '#ff6633',
    l1_int: { value: 1.0, min: 0, max: 2 },
    l2_pos: { x: 300, y: 300 },
    l2_color: '#3399ff',
    l2_int: { value: 1.0, min: 0, max: 2 },
    l3_pos: { x: -400, y: 200 },
    l3_color: '#66ff66',
    l3_int: { value: 1.0, min: 0, max: 2 },
  });

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
  };

  useEffect(() => {
    const lights: Light[] = [
      { id: '1', position: vec2.fromValues(l1_pos.x, l1_pos.y), color: hexToRgb(l1_color), intensity: l1_int, range: 800 },
      { id: '2', position: vec2.fromValues(l2_pos.x, l2_pos.y), color: hexToRgb(l2_color), intensity: l2_int, range: 600 },
      { id: '3', position: vec2.fromValues(l3_pos.x, l3_pos.y), color: hexToRgb(l3_color), intensity: l3_int, range: 700 },
    ];
    rendererRef.current?.setLights(lights);
  }, [l1_pos, l2_pos, l3_pos, l1_color, l2_color, l3_color, l1_int, l2_int, l3_int]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Initialize renderer
    try {
        rendererRef.current = new WebGLRenderer(canvas);
    } catch (e) {
        console.error("WebGL Initialization failed", e);
        return;
    }

    const handleResize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      rendererRef.current?.resize(canvas.width, canvas.height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const handlePointerDown = (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (e.buttons === 1) {
        rendererRef.current?.camera.pan(-e.movementX, e.movementY);
      }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    canvas.addEventListener('pointerdown', handlePointerDown as any);
    canvas.addEventListener('pointermove', handlePointerMove as any);
    canvas.addEventListener('pointerup', handlePointerUp as any);

    const animate = (time: number) => {
      rendererRef.current?.render(time);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', handlePointerDown as any);
      canvas.removeEventListener('pointermove', handlePointerMove as any);
      canvas.removeEventListener('pointerup', handlePointerUp as any);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default App;
