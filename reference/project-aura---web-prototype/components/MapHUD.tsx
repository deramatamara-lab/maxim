
import React, { useEffect, useRef } from 'react';
import { ds } from '../constants';
import { Coordinates } from '../types';

interface MapHUDProps {
    driverLocation?: Coordinates | null;
    variant?: 'rider' | 'driver';
    isMoving?: boolean;
}

export const MapHUD: React.FC<MapHUDProps> = ({ driverLocation, variant = 'rider', isMoving = false }) => {
    // Refs for animation state (Physics & Transforms)
    const requestRef = useRef<number>(0);
    const offsetRef = useRef({ x: 0, y: 0 });
    const speedRef = useRef(0.2); // Current speed state
    const timeRef = useRef(0);
    
    // Direct DOM refs to bypass React Render Cycle for 60FPS
    const mapLayerRef = useRef<HTMLDivElement>(null);
    const streetLayerRef = useRef<SVGSVGElement>(null);
    const warpLayerRef = useRef<HTMLDivElement>(null);

    // Linear Interpolation for smooth acceleration
    const lerp = (start: number, end: number, factor: number) => {
        return start + (end - start) * factor;
    };

    const animate = () => {
        // 1. Calculate Target Speed (Physics)
        const targetSpeed = variant === 'driver' 
            ? (isMoving ? 8.0 : 0.0) 
            : 0.2; 

        speedRef.current = lerp(speedRef.current, targetSpeed, 0.04);

        // 2. Update Time & Position
        timeRef.current += 1;
        
        // Calculate drift vectors
        const sway = Math.sin(timeRef.current * 0.005) * (speedRef.current * 0.2);
        
        offsetRef.current.y += speedRef.current;
        offsetRef.current.x += sway;

        // 3. Direct DOM Updates
        const yPos = offsetRef.current.y % 80; // Increased grid size for deeper feel
        const xPos = offsetRef.current.x % 80;

        if (mapLayerRef.current) {
            mapLayerRef.current.style.transform = `translate(${xPos}px, ${yPos}px)`;
        }

        if (streetLayerRef.current) {
            const streetX = offsetRef.current.x * 0.5;
            const streetY = offsetRef.current.y * 0.5;
            streetLayerRef.current.style.transform = `scale(1.5) translate(${streetX % 200}px, ${streetY % 200}px)`;
        }

        if (warpLayerRef.current) {
            const speedRatio = Math.min(speedRef.current / 8.0, 1);
            warpLayerRef.current.style.opacity = speedRatio.toFixed(2);
        }
        
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [variant, isMoving]); 

    // Calculate Driver Position (Rider Mode Only)
    const userLat = 34.0522;
    const userLng = -118.2437;
    const SCALE = 80000;

    let driverStyle = { opacity: 0, transform: 'translate(0,0)' };
    
    if (driverLocation && variant === 'rider') {
        const dLat = driverLocation.lat - userLat;
        const dLng = driverLocation.lng - userLng;
        const x = dLng * SCALE; 
        const y = -dLat * SCALE;
        driverStyle = {
            opacity: 1,
            transform: `translate(${x}px, ${y}px)`
        };
    }

    return (
        <div className="absolute inset-0 z-0 bg-[#050607] overflow-hidden select-none">
            {/* Warp Speed Effect */}
            <div 
                ref={warpLayerRef}
                className="absolute inset-0 transition-opacity duration-300 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(0,245,255,0.15) 0%, transparent 70%)',
                    opacity: 0
                }}
            />

            {/* Dark Map Base Simulation (Infinite Grid) */}
            <div 
                ref={mapLayerRef}
                className="absolute inset-[-50%] w-[200%] h-[200%] opacity-30 will-change-transform pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #333 1.5px, transparent 1.5px)',
                    backgroundSize: '80px 80px', // Larger grid for depth
                }}
            />
            
            {/* Streets Simulation - Abstract Lines (Parallax Layer) */}
            <svg 
                ref={streetLayerRef}
                className="absolute inset-[-50%] w-[200%] h-[200%] opacity-20 pointer-events-none will-change-transform z-0" 
            >
                <path d="M-100,300 Q400,350 900,200 T1500,500" fill="none" stroke="#333" strokeWidth="20" />
                <path d="M200,-100 L400,900" fill="none" stroke="#333" strokeWidth="15" />
                <path d="M600,-100 L500,900" fill="none" stroke="#333" strokeWidth="15" />
                {/* Abstract Geometry */}
                <circle cx="800" cy="400" r="200" fill="none" stroke="#222" strokeWidth="5" />
                <path d="M0,0 L2000,2000" fill="none" stroke="#222" strokeWidth="40" opacity="0.5" />
            </svg>

            {/* Active Route Line - Rider Mode Only */}
            {!driverLocation && variant === 'rider' && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <defs>
                        <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={ds.colors.primary} stopOpacity="0" />
                            <stop offset="50%" stopColor={ds.colors.primary} stopOpacity="1" />
                            <stop offset="100%" stopColor={ds.colors.secondary} stopOpacity="1" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <path 
                        d="M180,600 Q400,350 800,200" 
                        fill="none" 
                        stroke="url(#routeGradient)" 
                        strokeWidth="4" 
                        strokeLinecap="round"
                        filter="url(#glow)"
                        className="animate-[dash_3s_linear_infinite]"
                        strokeDasharray="20,10"
                    />
                </svg>
            )}

            {/* DRIVER MARKER (Rider Mode) */}
            {variant === 'rider' && (
                <div 
                    className="absolute top-1/2 left-1/2 -ml-3 -mt-3 w-6 h-6 z-30 transition-transform duration-300 ease-linear"
                    style={driverStyle}
                >
                    <div className="relative w-full h-full bg-aura-primary text-black rounded-full flex items-center justify-center shadow-[0_0_15px_#00F5FF]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                    </div>
                    <div className="absolute inset-0 bg-aura-primary rounded-full animate-ping opacity-50" />
                </div>
            )}

            {/* Navigation Arrow (Driver Mode) */}
            {variant === 'driver' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                     <div className="relative">
                        {/* 3D-ish Arrow Shape */}
                        <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[32px] border-b-aura-primary filter drop-shadow-[0_0_15px_rgba(0,245,255,0.8)] relative z-10" />
                        {/* Engine Glow */}
                        <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-24 bg-aura-primary/30 rounded-full blur-xl transition-all duration-300 ${isMoving ? 'opacity-100 scale-110' : 'opacity-40 scale-90'}`} />
                     </div>
                </div>
            )}

            {/* User Location Pulse (Rider Mode) */}
            {variant === 'rider' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_white] relative z-20" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full animate-pulse z-10" />
                </div>
            )}

            {/* Vignette Overlay & Digital Noise */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#050607_90%)] pointer-events-none z-40" />
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-40 mix-blend-overlay" 
                 style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} 
            />
        </div>
    );
};
