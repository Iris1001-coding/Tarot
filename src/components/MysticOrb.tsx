import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Torus } from '@react-three/drei';
import * as THREE from 'three';

// ── Glowing inner crystal core ──────────────────────────────────────────────
const CrystalCore: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.x = t * 0.18;
      ref.current.rotation.y = t * 0.25;
      ref.current.rotation.z = t * 0.12;
    }
    if (glowRef.current) {
      const pulse = 0.92 + Math.sin(t * 1.8) * 0.08;
      glowRef.current.scale.setScalar(pulse);
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.5 + Math.sin(t * 2.2) * 0.3;
    }
  });

  return (
    <group>
      {/* Outer transparent icosahedron */}
      <mesh ref={ref}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#1a0a3e"
          emissive="#6d28d9"
          emissiveIntensity={0.4}
          transparent
          opacity={0.35}
          wireframe={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe overlay — golden edges */}
      <mesh rotation={[0.3, 0.6, 0.1]}>
        <icosahedronGeometry args={[1.01, 0]} />
        <meshBasicMaterial
          color="#d4a017"
          wireframe
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* Glowing inner sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.52, 32, 32]} />
        <meshStandardMaterial
          color="#7c3aed"
          emissive="#a855f7"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Tiny bright core */}
      <mesh>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color="#fef3c7"
          emissive="#fbbf24"
          emissiveIntensity={3}
          transparent
          opacity={0.95}
        />
      </mesh>
    </group>
  );
};

// ── Sacred geometry outer ring (Eye of Providence shape) ────────────────────
const SacredRing: React.FC<{
  innerR: number;
  outerR: number;
  tilt: [number, number, number];
  speed: number;
  color: string;
  opacity?: number;
}> = ({ innerR, outerR, tilt, speed, color, opacity = 0.6 }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed;
  });
  return (
    <mesh ref={ref} rotation={tilt}>
      <ringGeometry args={[innerR, outerR, 64]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
};

// ── Orbiting rune particles ─────────────────────────────────────────────────
const RuneOrbit: React.FC<{
  radius: number;
  tilt: [number, number, number];
  speed: number;
  color: string;
  count: number;
}> = ({ radius, tilt, speed, color, count }) => {
  const groupRef = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      arr[i * 3]     = Math.cos(a) * radius;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.04;
      arr[i * 3 + 2] = Math.sin(a) * radius;
    }
    return arr;
  }, [radius, count]);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * speed;
  });

  return (
    <group ref={groupRef} rotation={tilt}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.055} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
      </points>
    </group>
  );
};

// ── Triangular sacred lines (Star of David / Seal of Solomon) ───────────────
const SacredTriangle: React.FC<{ reversed?: boolean; speed: number }> = ({ reversed = false, speed }) => {
  const ref = useRef<THREE.Line>(null);
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 3; i++) {
      const a = (i / 3) * Math.PI * 2 + (reversed ? Math.PI / 3 : 0);
      pts.push(new THREE.Vector3(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0));
    }
    return pts;
  }, [reversed]);

  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed;
  });

  return (
    <line ref={ref as any} geometry={geo}>
      <lineBasicMaterial color={reversed ? '#a78bfa' : '#fbbf24'} transparent opacity={0.35} />
    </line>
  );
};

// ── Torus knot accent ───────────────────────────────────────────────────────
const AccentTorus: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.x = t * 0.09;
      ref.current.rotation.y = t * 0.13;
    }
  });
  return (
    <Torus ref={ref} args={[1.62, 0.022, 12, 100]} rotation={[Math.PI / 2.5, 0, 0]}>
      <meshStandardMaterial
        color="#fde68a"
        emissive="#d97706"
        emissiveIntensity={1.8}
        transparent
        opacity={0.45}
      />
    </Torus>
  );
};

// ── Scene ───────────────────────────────────────────────────────────────────
const OrbScene: React.FC = () => (
  <group scale={0.96}>
    <CrystalCore />

    {/* Sacred triangles (Star of Solomon) */}
    <SacredTriangle reversed={false} speed={ 0.12} />
    <SacredTriangle reversed={true}  speed={-0.09} />

    {/* Glowing rings at different tilts */}
    <SacredRing innerR={1.18} outerR={1.26} tilt={[Math.PI/2, 0, 0]}        speed={ 0.14} color="#fbbf24" opacity={0.55} />
    <SacredRing innerR={1.42} outerR={1.48} tilt={[Math.PI/4, 0.3, 0]}      speed={-0.10} color="#a78bfa" opacity={0.50} />

    {/* Outer torus accent */}
    <AccentTorus />

    {/* Runic particle orbits */}
    <RuneOrbit radius={1.55} tilt={[0.25, 0, 0.1]}   speed={ 0.30} color="#fbbf24" count={52} />
    <RuneOrbit radius={1.90} tilt={[1.05, 0.4, 0.5]}  speed={-0.20} color="#c4b5fd" count={38} />

    {/* Lights */}
    <ambientLight intensity={0.3} />
    <pointLight position={[ 5,  5,  5]} intensity={2.5} color="#fff7ed" />
    <pointLight position={[-5, -5, -5]} intensity={3.2} color="#7c3aed" />
    <pointLight position={[ 0,  4,  0]} intensity={1.8} color="#fbbf24" />
    <pointLight position={[ 3, -3,  3]} intensity={1.0} color="#fde68a" />
  </group>
);

export const MysticOrb: React.FC = () => (
  <div className="w-56 h-56 relative">
    <Canvas camera={{ position: [0, 0, 4.8], fov: 44 }}>
      <OrbScene />
    </Canvas>
  </div>
);
