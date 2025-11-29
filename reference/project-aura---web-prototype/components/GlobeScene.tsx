
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls, QuadraticBezierLine, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Coordinates } from '../types';
import { ds } from '../constants';

// --- UTILS ---
const latLngToVector3 = (lat: number, lng: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
};

// Generate random arcs for "Network Traffic" simulation
const generateRandomArcs = (count: number, radius: number) => {
    const arcs = [];
    for (let i = 0; i < count; i++) {
        const startLat = (Math.random() - 0.5) * 160;
        const startLng = (Math.random() - 0.5) * 360;
        const endLat = (Math.random() - 0.5) * 160;
        const endLng = (Math.random() - 0.5) * 360;
        
        // Make sure points aren't too close
        if (Math.abs(startLat - endLat) < 20) continue;

        arcs.push({
            start: latLngToVector3(startLat, startLng, radius),
            end: latLngToVector3(endLat, endLng, radius),
            mid: latLngToVector3((startLat + endLat) / 2, (startLng + endLng) / 2, radius * (1.3 + Math.random() * 0.4)) // Higher arch
        });
    }
    return arcs;
};

// Generate random fleet vehicle locations
const generateFleetLocations = (count: number) => {
    const fleet = [];
    for (let i = 0; i < count; i++) {
        // Concentrate some around LA (approx lat 34, lng -118) for the demo feel
        const isLocal = Math.random() > 0.6;
        const lat = isLocal ? 34 + (Math.random() - 0.5) * 20 : (Math.random() - 0.5) * 150;
        const lng = isLocal ? -118 + (Math.random() - 0.5) * 20 : (Math.random() - 0.5) * 360;
        fleet.push({ lat, lng });
    }
    return fleet;
};

// --- SHADERS ---
const AtmosphereShaderMaterial = {
    uniforms: {
        c: { value: 0.7 },
        p: { value: 5.0 },
        glowColor: { value: new THREE.Color(ds.colors.primary) },
        viewVector: { value: new THREE.Vector3() }
    },
    vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
            vec3 vNormal = normalize(normalMatrix * normal);
            vec3 vNormel = normalize(normalMatrix * viewVector);
            intensity = pow(0.55 - dot(vNormal, vNormel), 4.0);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
            vec3 glow = glowColor * intensity;
            gl_FragColor = vec4(glow, 1.0);
        }
    `,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
};

// --- COMPONENTS ---

// Technical HUD Ring
const TechRing: React.FC<{ radius: number; speed?: number; axis?: 'x' | 'y' | 'z'; opacity?: number; dashed?: boolean }> = ({ 
    radius, 
    speed = 0.02, 
    axis = 'y', 
    opacity = 0.15,
    dashed = false
}) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            if (axis === 'x') ref.current.rotation.x += delta * speed;
            if (axis === 'y') ref.current.rotation.y += delta * speed;
            if (axis === 'z') ref.current.rotation.z += delta * speed;
        }
    });

    return (
        <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius, radius + 0.02, 64]} />
            <meshBasicMaterial 
                color={ds.colors.primary} 
                transparent 
                opacity={opacity} 
                side={THREE.DoubleSide} 
                toneMapped={false}
            />
        </mesh>
    );
};

// Animated Data Packet along Arc
const AnimatedArc: React.FC<{ start: THREE.Vector3, end: THREE.Vector3, mid: THREE.Vector3, delay: number }> = ({ start, end, mid, delay }) => {
    const [active, setActive] = useState(false);
    
    useEffect(() => {
        const timer = setTimeout(() => setActive(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    if (!active) return null;

    return (
        <QuadraticBezierLine 
            start={start} 
            end={end} 
            mid={mid} 
            color={ds.colors.primaryAccent} 
            lineWidth={1} 
            transparent 
            opacity={0.4}
        />
    );
};

// Vehicle Marker Component for Fleet Visualization
const VehicleMarker: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
    const groupRef = useRef<THREE.Group>(null);
    // Radius slightly above earth surface (1.48 surface + epsilon)
    const position = useMemo(() => latLngToVector3(lat, lng, 1.505), [lat, lng]);
    const offset = useMemo(() => Math.random() * 100, []);

    useFrame((state) => {
        if (groupRef.current) {
            // Pulse animation
            const t = state.clock.elapsedTime * 2 + offset;
            const scale = 0.8 + Math.sin(t) * 0.3;
            groupRef.current.scale.set(scale, scale, scale);
            
            // Look at center to align with surface normal (z-axis points to center)
            groupRef.current.lookAt(new THREE.Vector3(0,0,0));
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {/* Vehicle Dot (Diamond) */}
            <mesh rotation={[Math.PI/4, Math.PI/4, 0]}>
                <octahedronGeometry args={[0.015, 0]} />
                <meshBasicMaterial color={ds.colors.secondary} toneMapped={false} />
            </mesh>
            {/* Pulse Ring */}
            <mesh rotation={[0, 0, 0]}>
                <ringGeometry args={[0.025, 0.03, 16]} />
                <meshBasicMaterial color={ds.colors.secondary} transparent opacity={0.4} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
        </group>
    );
};

const HolographicEarth: React.FC<{ isZoomed: boolean }> = ({ isZoomed }) => {
    const groupRef = useRef<THREE.Group>(null);
    const atmosphereRef = useRef<THREE.Mesh>(null);
    const arcs = useMemo(() => generateRandomArcs(25, 1.48), []);
    const fleet = useMemo(() => generateFleetLocations(50), []);
    
    useFrame((state) => {
        const { camera } = state;
        
        // Update atmosphere shader view vector
        if (atmosphereRef.current) {
            const material = atmosphereRef.current.material as THREE.ShaderMaterial;
            // Use subVectors on the existing Vector3 instance
            material.uniforms.viewVector.value.subVectors(camera.position, atmosphereRef.current.position);
        }
        
        // Idle Rotation
        if (groupRef.current && !isZoomed) {
             groupRef.current.rotation.y += 0.0008;
        }
    });

    return (
        <group ref={groupRef}>
            {/* 1. Black Glossy Core (Ocean) */}
            <mesh>
                <sphereGeometry args={[1.48, 64, 64]} />
                <meshStandardMaterial 
                    color="#000000"
                    roughness={0.1}
                    metalness={0.9}
                    emissive="#000510"
                    emissiveIntensity={0.2}
                />
            </mesh>

            {/* 2. Wireframe Grid (Terrain) */}
            <mesh>
                <sphereGeometry args={[1.5, 48, 48]} />
                <meshBasicMaterial 
                    color={ds.colors.primary}
                    wireframe
                    transparent
                    opacity={0.08}
                />
            </mesh>

            {/* 3. Outer Atmosphere Glow (Shader) */}
            <mesh ref={atmosphereRef} scale={[1.2, 1.2, 1.2]}>
                <sphereGeometry args={[1.5, 64, 64]} />
                <shaderMaterial args={[AtmosphereShaderMaterial]} />
            </mesh>
            
            {/* 4. HUD Orbital Rings */}
            <TechRing radius={2.0} speed={0.02} axis="y" opacity={0.1} />
            <TechRing radius={2.1} speed={-0.03} axis="y" opacity={0.05} />
            <TechRing radius={2.8} speed={0.01} axis="x" opacity={0.05} />
            
            {/* 5. Network Traffic Arcs */}
            <group>
                {arcs.map((arc, i) => (
                    <AnimatedArc key={i} start={arc.start} end={arc.end} mid={arc.mid} delay={i * 200} />
                ))}
            </group>

            {/* 6. Active Fleet Markers */}
            <group>
                {fleet.map((loc, i) => (
                    <VehicleMarker key={`veh-${i}`} lat={loc.lat} lng={loc.lng} />
                ))}
            </group>
        </group>
    );
};

const CameraController: React.FC<{ target: Coordinates | null; isZoomed: boolean }> = ({ target, isZoomed }) => {
    const { camera } = useThree();
    const controlsRef = useRef<any>(null);

    useFrame((state, delta) => {
        if (controlsRef.current) {
            controlsRef.current.update();
            
            // FLIGHT MODE: Interpolate to target
            if (target && isZoomed) {
                 const targetPos = latLngToVector3(target.lat, target.lng, 3.0);
                 
                 // Smooth camera flight
                 camera.position.lerp(targetPos, delta * 2.0);
                 
                 // Look at center to keep earth in view, but drift slightly to target
                 controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), delta * 2.0);
            }
        }
    });

    return (
        <OrbitControls 
            ref={controlsRef}
            enablePan={false}
            enableZoom={!isZoomed} 
            minDistance={2.5} 
            maxDistance={9}   
            autoRotate={!isZoomed} 
            autoRotateSpeed={0.5}
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={0.5}
        />
    );
};

const LocationMarker: React.FC<{ target: Coordinates }> = ({ target }) => {
    const pos = useMemo(() => latLngToVector3(target.lat, target.lng, 1.55), [target]);
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.lookAt(new THREE.Vector3(0,0,0));
            // Pulse scale
            const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
            groupRef.current.scale.set(scale, scale, scale);
        }
    });
    
    return (
        <group ref={groupRef} position={pos}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.03, 0.05, 32]} />
                <meshBasicMaterial color={ds.colors.danger} side={THREE.DoubleSide} transparent opacity={0.9} />
            </mesh>
            <mesh position={[0, 0, -0.2]}>
                 <cylinderGeometry args={[0.002, 0.002, 0.4, 8]} />
                 <meshBasicMaterial color={ds.colors.danger} transparent opacity={0.5} />
            </mesh>
            <pointLight distance={1} intensity={3} color={ds.colors.danger} />
        </group>
    );
};

export const GlobeScene: React.FC<{ targetCoordinates: Coordinates | null; isZoomed: boolean }> = ({ targetCoordinates, isZoomed }) => {
    return (
        <div className="absolute inset-0 z-0 bg-black select-none transition-opacity duration-1000">
            <Canvas camera={{ position: [0, 2, 6.5], fov: 35 }} dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
                <fog attach="fog" args={['#050607', 6, 20]} />
                <ambientLight intensity={0.2} />
                
                {/* Cinematic Lighting Setup */}
                <pointLight position={[15, 15, 15]} intensity={1.5} color="#4488ff" />
                <pointLight position={[-10, -5, -10]} intensity={1} color={ds.colors.primary} />
                <pointLight position={[0, -10, 5]} intensity={0.5} color="#ff00ff" />
                
                {/* Background Stars & Floating Data Particles */}
                <Stars radius={100} depth={50} count={6000} factor={4} saturation={0} fade speed={0.5} />
                <Float speed={2} rotationIntensity={1} floatIntensity={2}>
                    <Sparkles count={150} scale={5} size={1.5} speed={0.3} opacity={0.4} color={ds.colors.primary} />
                </Float>
                
                <HolographicEarth isZoomed={isZoomed} />
                
                {targetCoordinates && <LocationMarker target={targetCoordinates} />}
                
                <CameraController target={targetCoordinates} isZoomed={isZoomed} />
            </Canvas>
            
            {/* Vignette & Grain Overlay for HUD feel */}
            <div className="absolute inset-0 pointer-events-none z-10" 
                 style={{ 
                     background: 'radial-gradient(circle at center, transparent 30%, #050607 100%)',
                 }} 
            />
            {/* Scanline Texture */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-10" 
                 style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)' }} 
            />
        </div>
    );
};
