"use client"

import { useState } from "react";
import { useLightMapStore } from "../store/useLightMapStore";
import { X, Copy, Trash2, Settings, Edit2, Hammer, ChevronRight } from "lucide-react";
import { mToStr } from "../utils/catalog";

export function PropertiesView() {
    const { 
        selection, objects, walls, updateObject, updateWall, 
        deleteSelected, duplicateSelected
    } = useLightMapStore();

    const id = selection[0];
    const obj = objects.find(o => o.id === id);
    const wall = walls.find(w => w.id === id);

    if (!obj && !wall) {
        return (
            <div className="py-12 text-center text-[var(--macos-text-secondary)]">
                <Settings className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-[10px] uppercase tracking-widest opacity-50">Select an item to view properties</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {obj && <ObjProps obj={obj} update={(u: any) => updateObject(obj.id, u)} />}
            {wall && <WallProps wall={wall} update={(u: any) => updateWall(wall.id, u)} />}
            
            <div className="pt-6 border-t border-white/5 flex gap-2">
                <button 
                    onClick={duplicateSelected}
                    className="flex-1 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 text-xs font-semibold transition-all active:scale-95 border border-white/5"
                >
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                </button>
                <button 
                    onClick={deleteSelected}
                    className="flex-1 h-9 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center gap-2 text-xs font-semibold transition-all active:scale-95 border border-red-500/10"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
            </div>
        </div>
    );
}

// ----- Property Sub-components -----

function ObjProps({ obj, update }: { obj: any; update: (u: any) => void }) {
    const p = obj.properties || {};

    const updateProp = (k: string, v: any) => {
        update({ properties: { ...p, [k]: v } });
    };

    return (
        <div className="space-y-6">
            {obj.type === 'camera' && (
                <Section title="Optics">
                    <Row label="Type">
                        <select 
                            value={p.lensType || 'Prime'} 
                            onChange={(e) => {
                                const type = e.target.value;
                                let updates: any = { lensType: type };
                                if (type === 'Eyefish') {
                                    updates.focalLength = Math.max(6.5, Math.min(17, p.focalLength || 12));
                                } else if (type.includes('Zoom')) {
                                    updates.minFocal = p.minFocal || 24;
                                    updates.maxFocal = p.maxFocal || 70;
                                    updates.focalLength = p.focalLength || 35;
                                }
                                update({ properties: { ...p, ...updates } });
                            }}
                            className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 focus:border-[var(--macos-selected)]/50 focus:bg-black/40 outline-none transition-all text-xs font-mono text-[var(--macos-text)] appearance-none"
                        >
                            <option value="Prime">Prime</option>
                            <option value="Zoom">Zoom</option>
                            <option value="Prime Anamorphic">Prime Anamorphic</option>
                            <option value="Zoom Anamorphic">Zoom Anamorphic</option>
                            <option value="Eyefish">Eyefish</option>
                        </select>
                    </Row>

                    {p.lensType?.includes('Zoom') && (
                        <>
                            <Row label="Preset">
                                <select 
                                    value="" 
                                    onChange={(e) => {
                                        const [min, max, label] = JSON.parse(e.target.value);
                                        update({ properties: { ...p, minFocal: min, maxFocal: max, lensModel: label, focalLength: min } });
                                    }}
                                    className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 focus:border-[var(--macos-selected)]/50 focus:bg-black/40 outline-none transition-all text-[10px] font-mono text-[var(--macos-text)] appearance-none"
                                >
                                    <option value="" disabled>Select famous lens...</option>
                                    <option value={JSON.stringify([24, 70, "Canon 24-70mm f/2.8"])}>Canon 24-70mm f/2.8</option>
                                    <option value={JSON.stringify([24, 105, "Sony 24-105mm f/4"])}>Sony 24-105mm f/4</option>
                                    <option value={JSON.stringify([18, 35, "Sigma 18-35mm f/1.8"])}>Sigma 18-35mm f/1.8</option>
                                    <option value={JSON.stringify([14, 24, "Nikon 14-24mm f/2.8"])}>Nikon 14-24mm f/2.8</option>
                                    <option value={JSON.stringify([70, 200, "Sony 70-200mm f/2.8"])}>Sony 70-200mm f/2.8</option>
                                    <option value={JSON.stringify([18, 80, "Arri Alura 18-80mm"])}>Arri Alura 18-80mm</option>
                                    <option value={JSON.stringify([24, 290, "Angenieux 24-290mm"])}>Angenieux 24-290mm</option>
                                </select>
                            </Row>
                            <Row label="Range(mm)">
                                <div className="flex items-center gap-1">
                                    <Input type="number" val={p.minFocal} onChange={(v) => updateProp('minFocal', v)} />
                                    <span className="text-[10px] opacity-30">to</span>
                                    <Input type="number" val={p.maxFocal} onChange={(v) => updateProp('maxFocal', v)} />
                                </div>
                            </Row>
                            <Row label={`Focal: ${p.focalLength}mm`}>
                                <input 
                                    type="range" 
                                    min={p.minFocal || 24} 
                                    max={p.maxFocal || 70} 
                                    value={p.focalLength || 35} 
                                    onChange={(e) => updateProp('focalLength', Number(e.target.value))}
                                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[var(--macos-selected)]"
                                />
                            </Row>
                        </>
                    )}

                    {(p.lensType === 'Prime' || p.lensType === 'Prime Anamorphic') && (
                        <Row label="Focal(mm)"><Input type="number" val={p.focalLength || 35} onChange={(v: any) => updateProp('focalLength', v)} /></Row>
                    )}

                    {p.lensType === 'Eyefish' && (
                        <Row label="Focal(mm)">
                            <div className="space-y-1">
                                <Input 
                                    type="number" 
                                    val={p.focalLength || 12} 
                                    onChange={(v: any) => updateProp('focalLength', Math.max(6.5, Math.min(17, v)))} 
                                />
                                <div className="text-[9px] text-[var(--macos-selected)] opacity-50 uppercase tracking-tighter">Limit: 6.5mm - 17mm</div>
                            </div>
                        </Row>
                    )}
                    
                    <Row label="FPS"><Input type="number" val={p.frameRate || 24} onChange={(v: any) => updateProp('frameRate', v)} /></Row>
                </Section>
            )}

            <Section title="Style">
                <Row label="Name"><Input type="text" val={obj.label || ''} onChange={(v: any) => update({ label: v })} /></Row>
                <Row label="Tint">
                    <input type="color" value={obj.color || '#3a3d4a'} onChange={(e) => update({ color: e.target.value })} className="w-8 h-7 rounded cursor-pointer bg-transparent border-none p-0" />
                </Row>
                {obj.subtype === 'sofa' && (
                    <Row label="Modelo">
                        <select 
                            value={p.model || 'sofa3'} 
                            onChange={(e) => {
                                const m = e.target.value;
                                const w = m === 'poltrona' ? 0.85 : m === 'sofa2' ? 1.5 : 2.0;
                                const h = 0.85;
                                update({ width: w, height: h, properties: { ...p, model: m } });
                            }}
                            className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 focus:border-[var(--macos-selected)]/50 focus:bg-black/40 outline-none transition-all text-xs font-mono text-[var(--macos-text)] appearance-none"
                        >
                            <option value="poltrona">Armchair (0.85m x 0.85m)</option>
                            <option value="sofa2">Sofa 2-seat (1.50m x 0.85m)</option>
                            <option value="sofa3">Sofa 3-seat (2.00m x 0.85m)</option>
                        </select>
                    </Row>
                )}
                {obj.subtype === 'char-male' && (
                    <Row label="Ator">
                        <select 
                            value={p.model || 'man_main'} 
                            onChange={(e) => update({ properties: { ...p, model: e.target.value } })}
                            className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 focus:border-[var(--macos-selected)]/50 focus:bg-black/40 outline-none transition-all text-xs font-mono text-[var(--macos-text)] appearance-none"
                        >
                            <option value="man_main">Main</option>
                            <option value="man_business">Business</option>
                            <option value="man_coffee">Coffee</option>
                        </select>
                    </Row>
                )}
                {obj.subtype === 'char-female' && (
                    <Row label="Atriz">
                        <select 
                            value={p.model || 'woman_main'} 
                            onChange={(e) => update({ properties: { ...p, model: e.target.value } })}
                            className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 focus:border-[var(--macos-selected)]/50 focus:bg-black/40 outline-none transition-all text-xs font-mono text-[var(--macos-text)] appearance-none"
                        >
                            <option value="woman_main">Main</option>
                            <option value="woman_main2">Alternate</option>
                            <option value="woman_business">Business</option>
                        </select>
                    </Row>
                )}
                {obj.subtype === 'piano' && (
                    <Row label="Modelo">
                        <select 
                            value={p.model || 'piano01'} 
                            onChange={(e) => update({ properties: { ...p, model: e.target.value } })}
                            className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 focus:border-[var(--macos-selected)]/50 focus:bg-black/40 outline-none transition-all text-xs font-mono text-[var(--macos-text)] appearance-none"
                        >
                            <option value="piano01">Grand Piano</option>
                        </select>
                    </Row>
                )}
                {obj.subtype === 'spot' && (
                    <Row label="Modelo">
                        <select
                            value={p.spotModel || 'reflector'}
                            onChange={(e) => {
                                const m = e.target.value;
                                let s = 0.3;
                                if (m === 'dome') s = 0.45;
                                if (m === 'lantern') s = 0.35;
                                update({ width: s, height: s, properties: { ...p, spotModel: m } });
                            }}
                            className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 outline-none transition-all text-xs font-mono text-[var(--macos-text)] appearance-none"
                        >
                            <option value="reflector">Reflector</option>
                            <option value="dome">Dome</option>
                            <option value="lantern">Lantern</option>
                        </select>
                    </Row>
                )}
            </Section>

            {obj.width !== undefined && (
                <Section title="Dimensions (m)">
                    <Row label="Width"><Input type="number" val={obj.width} onChange={(v: any) => update({ width: v })} step={0.1} /></Row>
                    <Row label="Height"><Input type="number" val={obj.height} onChange={(v: any) => update({ height: v })} step={0.1} /></Row>
                </Section>
            )}

            <Section title="Coordinates" collapsible defaultOpen={false}>
                <Row label="X"><Input type="number" val={obj.x} onChange={(v: any) => update({ x: v })} step={0.1} /></Row>
                <Row label="Y"><Input type="number" val={obj.y} onChange={(v: any) => update({ y: v })} step={0.1} /></Row>
                <Row label="Angle(°)"><Input type="number" val={obj.rotation} onChange={(v: any) => update({ rotation: v })} step={5} /></Row>
            </Section>



            {obj.type === 'light' && obj.subtype !== 'sun' && (
                <Section title="VFX Settings">
                    <Row label="Potência(W)">
                        <Input type="number" val={p.powerW ?? 100} onChange={(v: any) => updateProp('powerW', v)} step={10} />
                    </Row>
                    <Row label={`Uso (%)`}>
                        <div className="flex items-center gap-2">
                             <input type="range" min="0" max="100" value={p.intensity ?? 80} onChange={(e) => updateProp('intensity', Number(e.target.value))} className="flex-1 h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[var(--macos-selected)]" />
                             <span className="text-[10px] w-8 text-right font-mono">{p.intensity ?? 80}%</span>
                        </div>
                    </Row>
                    <Row label={`Temp.`}>
                         <div className="flex items-center gap-2">
                            <input type="range" min="2000" max="10000" step="100" value={p.colorTemp || 5600} onChange={(e) => updateProp('colorTemp', Number(e.target.value))} className="flex-1 h-1.5 bg-[#111318] rounded-lg appearance-none cursor-pointer accent-[#4a9eff]" />
                            <span className="text-[10px] w-12 text-right font-mono">{p.colorTemp || 5600}K</span>
                         </div>
                    </Row>
                    {p.coneAngle !== undefined && <Row label="Beam(°)"><Input type="number" val={p.coneAngle} onChange={(v: any) => updateProp('coneAngle', v)} /></Row>}
                    {p.range !== undefined && <Row label="Dropoff(m)"><Input type="number" val={p.range} onChange={(v: any) => updateProp('range', v)} step={0.5} /></Row>}
                    {p.radius !== undefined && <Row label="Area(m)"><Input type="number" val={p.radius} onChange={(v: any) => updateProp('radius', v)} step={0.5} /></Row>}
                </Section>
            )}

            {obj.type === 'light' && obj.subtype === 'sun' && (() => {
                const az = p.azimuth ?? 180;
                const compassPoints = ['N','NE','L','SE','S','SO','O','NO'];
                const idx = Math.round(az / 45) % 8;
                const compassLabel = compassPoints[(idx + 8) % 8];
                return (
                    <Section title="Global Illum.">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-[#555] uppercase tracking-tighter">Direção do Sol</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-[#ffdd44]">{compassLabel}</span>
                                    <span className="text-[10px] font-mono text-[var(--macos-text-secondary)]">{az}°</span>
                                </div>
                            </div>
                            <input
                                type="range" min={0} max={359} step={1}
                                value={az}
                                onChange={(e) => updateProp('azimuth', Number(e.target.value))}
                                className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[#ffdd44]"
                            />
                            <div className="flex justify-between text-[8px] text-[#444] px-0.5 mt-1 select-none">
                                {compassPoints.map(c => <span key={c}>{c}</span>)}
                            </div>
                        </div>
                    </Section>
                );
            })()}
        </div>
    );
}

function WallProps({ wall, update }: { wall: any; update: (u: any) => void }) {
    const { updateWallOpening, deleteWallOpening } = useLightMapStore();

    const len = (wall.points || []).reduce((acc: number, p: any, i: number, arr: any[]) => {
        if (i === 0) return 0;
        return acc + Math.sqrt(Math.pow(p.x - arr[i-1].x, 2) + Math.pow(p.y - arr[i-1].y, 2));
    }, 0);

    return (
        <div className="space-y-6">
            <Section title="Structure">
                <Row label="Width(m)"><Input type="number" val={wall.thickness} onChange={(v: any) => update({ thickness: v })} step={0.05} /></Row>
                <Row label="Height(m)"><Input type="number" val={wall.height} onChange={(v: any) => update({ height: v })} step={0.1} /></Row>
                <Row label="Paint">
                    <input type="color" value={wall.color || '#3a3d4a'} onChange={(e) => update({ color: e.target.value })} className="w-8 h-7 rounded cursor-pointer bg-transparent border-none p-0" />
                </Row>
                <Row label="Length"><span className="text-[#888] font-mono">{mToStr(len)}</span></Row>
            </Section>

            {wall.openings && wall.openings.length > 0 && (
                <Section title="Openings">
                    <div className="space-y-4">
                        {wall.openings.map((op: any) => (
                            <div key={op.id} className="p-2 rounded-lg bg-black/20 border border-white/5 space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold uppercase text-[var(--macos-selected)]">{op.type} (Seg {op.segmentIndex + 1})</span>
                                    <button 
                                        onClick={() => deleteWallOpening(wall.id, op.id)}
                                        className="p-1 hover:text-red-400 text-white/20 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                                <Row label="Pos.">
                                    <input 
                                        type="range" min="0" max="1" step="0.01" value={op.t} 
                                        onChange={(e) => updateWallOpening(wall.id, op.id, { t: Number(e.target.value) })}
                                        className="w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[var(--macos-selected)]"
                                    />
                                </Row>
                                <Row label="Width(m)">
                                    <Input 
                                        type="number" val={op.width} 
                                        onChange={(v: any) => updateWallOpening(wall.id, op.id, { width: v })} 
                                        step={0.1}
                                    />
                                </Row>
                                {op.type === 'door' && (
                                    <div className="flex gap-2 pt-2 border-t border-white/5 mt-2">
                                        <button onClick={() => updateWallOpening(wall.id, op.id, { flipSide: !op.flipSide })} className={`flex-1 h-7 text-[10px] rounded border transition-colors ${op.flipSide ? 'bg-[var(--macos-selected)]/40 border-[var(--macos-selected)] text-white' : 'bg-black/20 border-white/10 text-white/50 hover:text-white'}`}>In / Out</button>
                                        <button onClick={() => updateWallOpening(wall.id, op.id, { flipSwing: !op.flipSwing })} className={`flex-1 h-7 text-[10px] rounded border transition-colors ${op.flipSwing ? 'bg-[var(--macos-selected)]/40 border-[var(--macos-selected)] text-white' : 'bg-black/20 border-white/10 text-white/50 hover:text-white'}`}>L / R</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
}

// ----- UI Helpers -----

function Section({ title, children, collapsible = false, defaultOpen = true }: any) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="space-y-2">
            <button
                onClick={() => collapsible && setOpen((o: boolean) => !o)}
                className={`flex items-center gap-1 w-full text-left ${collapsible ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            >
                {collapsible && (
                    <ChevronRight className={`w-3 h-3 text-[var(--macos-selected)]/50 transition-transform ${open ? 'rotate-90' : ''}`} />
                )}
                <h4 className="text-[10px] uppercase font-bold text-[var(--macos-selected)]/50 tracking-[0.2em]">{title}</h4>
            </button>
            {(!collapsible || open) && <div className="space-y-2">{children}</div>}
        </div>
    );
}

function Row({ label, children }: any) {
    return (
        <div className="flex items-center gap-3">
            <label className="text-[10px] font-medium text-[#555] w-16 text-right shrink-0 uppercase tracking-tighter">{label}</label>
            <div className="flex-1 text-sm">{children}</div>
        </div>
    );
}

function Input({ type, val, onChange, step }: { type: string, val: any, onChange: (v: any) => void, step?: number }) {
    return (
        <input 
            type={type} 
            value={val ?? ''} 
            step={step}
            onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? 0 : Number(e.target.value)) : e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 focus:border-[var(--macos-selected)]/50 focus:bg-black/40 outline-none transition-all text-xs font-mono text-[var(--macos-text)]"
        />
    );
}
