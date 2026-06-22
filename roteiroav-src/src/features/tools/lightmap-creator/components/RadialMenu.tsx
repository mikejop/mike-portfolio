"use client"

import { useState, useRef, useEffect } from "react";
import { useLightMapStore } from "../store/useLightMapStore";
import { 
    MousePointer2, Hammer, Move, Menu,
    DoorOpen, Grid2x2, BrickWall,
    User, Cat, Dog,
    Video, Lightbulb, Sun,
    Sofa, Tv, BookOpen, Utensils, Music, Briefcase,
    Bed, Table, Lamp,
    Car, Truck, Bike, Gauge,
    Guitar, Drum, Package
} from "lucide-react";
import { IconSpotLight, IconBulb, IconLEDPanel, IconWoman, IconMan } from "./CustomIcons";

export function RadialMenu() {
    const { tool, setTool, radialMenu } = useLightMapStore();
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [activeSub, setActiveSub] = useState<string | null>(null);
    const [activeSubSub, setActiveSubSub] = useState<string | null>(null);

    const subTimeout = useRef<any>(null);
    const subSubTimeout = useRef<any>(null);

    const openSub = (id: string) => {
        clearTimeout(subTimeout.current);
        setActiveSub(id);
        if (id !== 'props') {
            clearTimeout(subSubTimeout.current);
            setActiveSubSub(null);
        }
    };
    const closeSub = () => {
        clearTimeout(subTimeout.current);
        subTimeout.current = setTimeout(() => {
            setActiveSub(null);
            setActiveSubSub(null);
        }, 200);
    };
    const openSubSub = (id: string) => {
        clearTimeout(subSubTimeout.current);
        clearTimeout(subTimeout.current);
        setActiveSubSub(id);
    };
    const closeSubSub = () => {
        clearTimeout(subSubTimeout.current);
        subSubTimeout.current = setTimeout(() => setActiveSubSub(null), 200);
    };

    const posCurrent = useRef({ x: radialMenu.x, y: radialMenu.y });
    const dragStart = useRef({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);
    const clickIsDrag = useRef(false);

    useEffect(() => {
        if (!dragging && menuRef.current) {
            menuRef.current.style.transform = `translate(${radialMenu.x}px, ${radialMenu.y}px)`;
        }
    }, [radialMenu.x, radialMenu.y, dragging]);

    const onPointerDown = (e: React.PointerEvent) => {
        setDragging(true);
        clickIsDrag.current = false;
        dragStart.current = { x: e.clientX - posCurrent.current.x, y: e.clientY - posCurrent.current.y };
        e.currentTarget.setPointerCapture(e.pointerId);

        const handleMove = (ev: PointerEvent) => {
            clickIsDrag.current = true;
            const HALF = 24;
            const rawX = ev.clientX - dragStart.current.x;
            const rawY = ev.clientY - dragStart.current.y;
            const clampedX = Math.max(HALF, Math.min(window.innerWidth - HALF, rawX));
            const clampedY = Math.max(HALF, Math.min(window.innerHeight - HALF, rawY));
            posCurrent.current = { x: clampedX, y: clampedY };
            if (menuRef.current) menuRef.current.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
        };
        const handleUp = () => {
            setDragging(false);
            useLightMapStore.setState({ radialMenu: { ...useLightMapStore.getState().radialMenu, x: posCurrent.current.x, y: posCurrent.current.y } });
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };
        window.addEventListener('pointermove', handleMove, { passive: false });
        window.addEventListener('pointerup', handleUp);
    };

    const toggleMenu = () => {
        if (!clickIsDrag.current) {
            setIsExpanded(prev => {
                if (prev) { setActiveSub(null); setActiveSubSub(null); }
                return !prev;
            });
        }
    };

    const onAdd = (key: string) => {
        setTool(`add-${key}`);
        setIsExpanded(false);
        setActiveSub(null);
        setActiveSubSub(null);
    };

    // Props sub-categories config (i=2, total=6, baseAngle=30°)
    const propCategories = [
        { id: 'sala',       label: 'Sala',       icon: Sofa,     angleOffset: -65 },
        { id: 'cozinha',    label: 'Cozinha',    icon: Utensils, angleOffset: -35 },
        { id: 'quarto',     label: 'Quarto',     icon: Bed,      angleOffset: -5  },
        { id: 'escritorio', label: 'Escritório', icon: Briefcase,angleOffset: 25  },
        { id: 'musica',     label: 'Música',     icon: Music,    angleOffset: 55  },
        { id: 'veiculos',   label: 'Veículos',   icon: Car,      angleOffset: 85  },
    ];

    const propItems: Record<string, { key: string; label: string; icon: any; angleOffset: number }[]> = {
        sala: [
            { key: 'sofa',       label: 'Sofá',         icon: Sofa,     angleOffset: -80 },
            { key: 'mesa',       label: 'Mesa',         icon: Table,    angleOffset: -65 },
            { key: 'tv',         label: 'TV',           icon: Tv,       angleOffset: -50 },
            { key: 'shelf',      label: 'Estante',      icon: BookOpen, angleOffset: -35 },
            { key: 'lamp-table', label: 'Abajur',       icon: Lamp,     angleOffset: -20 },
        ],
        cozinha: [
            { key: 'dining-table', label: 'Mesa',     icon: Table,    angleOffset: -50 },
            { key: 'chair',        label: 'Cadeira',  icon: Package,  angleOffset: -30 },
        ],
        quarto: [
            { key: 'bed-single', label: 'Cama Single', icon: Bed, angleOffset: -15 },
            { key: 'bed-double', label: 'Cama Casal',  icon: Bed, angleOffset: 10  },
        ],
        escritorio: [
            { key: 'desk',  label: 'Mesa',    icon: Table,    angleOffset: 15 },
            { key: 'chair', label: 'Cadeira', icon: Package,  angleOffset: 40 },
        ],
        musica: [
            { key: 'guitar', label: 'Guitarra', icon: Guitar, angleOffset: 40 },
            { key: 'drum', label: 'Bateria', icon: Drum, angleOffset: 20 },
            { key: 'piano', label: 'Piano', icon: Music, angleOffset: 45 },
        ],
        veiculos: [
            { key: 'car',        label: 'Carro',      icon: Car,   angleOffset: 70  },
            { key: 'truck',      label: 'Caminhão',   icon: Truck, angleOffset: 90  },
            { key: 'bicycle',    label: 'Bicicleta',  icon: Bike,  angleOffset: 110 },
            { key: 'motorcycle', label: 'Moto',       icon: Gauge, angleOffset: 130 },
        ],
    };

    return (
        <div 
            ref={menuRef}
            className={`absolute z-[100] left-0 top-0 transition-opacity duration-200 opacity-100 pointer-events-auto`}
        >
            {/* Center Handle */}
            <div 
                onPointerDown={onPointerDown}
                onClick={toggleMenu}
                className={`absolute -translate-x-1/2 -translate-y-1/2 bg-[var(--macos-sidebar)] rounded-full border border-white/10 shadow-2xl flex items-center justify-center cursor-move text-[var(--macos-text-secondary)] hover:text-white transition-all z-20 
                    ${isExpanded ? 'w-14 h-14' : 'w-12 h-12 shadow-blue-500/20 text-white bg-[var(--macos-selected)]/80'}
                    ${dragging ? 'scale-90 bg-white/10' : ''}`}
                title={isExpanded ? "Arraste para mover, clique para minimizar" : "Arraste para mover, clique para expandir"}
            >
                {isExpanded ? <Move className="w-6 h-6 pointer-events-none" /> : <Menu className="w-5 h-5 pointer-events-none" />}
            </div>

            {/* Main Nodes */}
            <div className={`absolute inset-0 transition-all duration-300 ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>

                {/* 1. Select */}
                <RadialNode i={0} total={6} r={70} active={tool === 'select'} onClick={() => setTool('select')} icon={MousePointer2} title="Select (V)" />

                {/* 2. Build */}
                <RadialNode i={1} total={6} r={70} active={['wall','window','door'].includes(tool)} onPointerEnter={() => openSub('build')} onPointerLeave={closeSub} icon={Hammer} title="Construção" />
                {activeSub === 'build' && (<>
                    <RadialNode i={1} total={6} angleOffset={-25} r={120} active={tool === 'wall'} onClick={() => setTool('wall')} onPointerEnter={() => openSub('build')} onPointerLeave={closeSub} icon={BrickWall} title="Parede (W)" />
                    <RadialNode i={1} total={6} angleOffset={0}   r={120} active={tool === 'door'} onClick={() => setTool('door')} onPointerEnter={() => openSub('build')} onPointerLeave={closeSub} icon={DoorOpen} title="Porta" />
                    <RadialNode i={1} total={6} angleOffset={25}  r={120} active={tool === 'window'} onClick={() => setTool('window')} onPointerEnter={() => openSub('build')} onPointerLeave={closeSub} icon={Grid2x2} title="Janela" />
                </>)}

                {/* 3. Props — shows room categories */}
                <RadialNode i={2} total={6} r={70} active={activeSub === 'props'} onPointerEnter={() => openSub('props')} onPointerLeave={closeSub} icon={Package} title="Props" />
                {activeSub === 'props' && (<>
                    {propCategories.map(cat => (
                        <RadialNode
                            key={cat.id}
                            i={2} total={6} r={128} angleOffset={cat.angleOffset}
                            active={activeSubSub === cat.id}
                            onPointerEnter={() => { openSub('props'); openSubSub(cat.id); }}
                            onPointerLeave={closeSubSub}
                            icon={cat.icon} title={cat.label}
                        />
                    ))}
                    {/* Level-3: items in the active sub-category */}
                    {activeSubSub && propItems[activeSubSub]?.map(item => (
                        <RadialNode
                            key={item.key + '_' + item.angleOffset}
                            i={2} total={6} r={200} angleOffset={item.angleOffset}
                            onClick={() => onAdd(item.key)}
                            onPointerEnter={() => { openSub('props'); openSubSub(activeSubSub); }}
                            onPointerLeave={closeSubSub}
                            icon={item.icon} title={item.label}
                            size="sm"
                        />
                    ))}
                </>)}

                {/* 4. Characters */}
                <RadialNode i={3} total={6} r={70} onPointerEnter={() => openSub('chars')} onPointerLeave={closeSub} icon={User} title="Personagens" />
                {activeSub === 'chars' && (<>
                    <RadialNode i={3} total={6} angleOffset={-25} r={120} onClick={() => onAdd('char-male')} customIcon={<IconMan className="w-5 h-5 pointer-events-none" style={{ color: '#60a5fa' }} />} title="Ator ♂" />
                    <RadialNode i={3} total={6} angleOffset={0}   r={120} onClick={() => onAdd('char-female')} onPointerEnter={() => openSub('chars')} onPointerLeave={closeSub} customIcon={<IconWoman className="w-5 h-5 pointer-events-none" style={{ color: '#f472b6' }} />} title="Atriz ♀" />
                    <RadialNode i={3} total={6} angleOffset={25}  r={120} onClick={() => onAdd('cat')}         onPointerEnter={() => openSub('chars')} onPointerLeave={closeSub} icon={Cat}      title="Gato"   iconColor="#f59e0b" />
                    <RadialNode i={3} total={6} angleOffset={50}  r={120} onClick={() => onAdd('dog')}         onPointerEnter={() => openSub('chars')} onPointerLeave={closeSub} icon={Dog}      title="Cachorro" iconColor="#a78bfa" />
                </>)}

                {/* 5. Lights */}
                <RadialNode i={4} total={6} r={70} onPointerEnter={() => openSub('lights')} onPointerLeave={closeSub} icon={Lightbulb} title="Iluminação" />
                {activeSub === 'lights' && (<>
                    <RadialNode i={4} total={6} angleOffset={-30} r={120} onClick={() => onAdd('light-sun')}   onPointerEnter={() => openSub('lights')} onPointerLeave={closeSub} icon={Sun}       title="Sol" />
                    <RadialNode i={4} total={6} angleOffset={-10} r={125} onClick={() => onAdd('light-bulb')}  onPointerEnter={() => openSub('lights')} onPointerLeave={closeSub} customIcon={<IconBulb className="w-5 h-5 pointer-events-none" style={{ color: '#fde68a' }} />} title="Omni" />
                    <RadialNode i={4} total={6} angleOffset={10}  r={125} onClick={() => onAdd('light-spot')}  onPointerEnter={() => openSub('lights')} onPointerLeave={closeSub} customIcon={<IconSpotLight className="w-5 h-5 pointer-events-none" style={{ color: '#fcd34d' }} />} title="Spot" />
                    <RadialNode i={4} total={6} angleOffset={30}  r={120} onClick={() => onAdd('light-panel')} onPointerEnter={() => openSub('lights')} onPointerLeave={closeSub} customIcon={<IconLEDPanel className="w-5 h-5 pointer-events-none" style={{ color: '#6ee7b7' }} />} title="Painel LED" />
                </>)}

                {/* 6. Camera */}
                <RadialNode i={5} total={6} r={70} onClick={() => onAdd('camera')} icon={Video} title="Câmera" />
            </div>
        </div>
    );
}

// ----- Helper component for positioning radial nodes -----
function RadialNode({ i, total, r, angleOffset = 0, active = false, onClick, onPointerEnter, onPointerLeave, icon: Icon, customIcon, title, iconColor, size = 'md' }: {
    i: number; total: number; r: number; angleOffset?: number;
    active?: boolean; onClick?: () => void;
    onPointerEnter?: () => void; onPointerLeave?: () => void;
    icon?: any; customIcon?: React.ReactNode; title: string; iconColor?: string; size?: 'md' | 'sm';
}) {
    const baseAngle = (i * (360 / total) - 90) + angleOffset;
    const rad = baseAngle * (Math.PI / 180);
    const x = Math.cos(rad) * r;
    const y = Math.sin(rad) * r;

    return (
        <button
            onClick={onClick}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            title={title}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl border border-white/5
                ${size === 'sm' ? 'w-9 h-9' : 'w-11 h-11'}
                ${active
                    ? 'bg-[var(--macos-selected)] text-white scale-110 ring-2 ring-blue-500/50'
                    : 'bg-[var(--macos-sidebar)] text-[var(--macos-text-secondary)] hover:bg-white/10 hover:text-white hover:scale-110'
                }`}
            style={{ 
                left: x, top: y,
                animation: 'fade-in 0.15s ease-out backwards'
            }}
        >
            {customIcon ?? (
                Icon && <Icon
                    className={`pointer-events-none ${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`}
                    style={iconColor ? { color: iconColor } : undefined}
                />
            )}
        </button>
    );
}
