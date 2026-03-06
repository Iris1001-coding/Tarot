import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import * as random from 'maath/random/dist/maath-random.esm';

interface StarLayerProps {
  count?: number;
  radius?: number;
  color?: string;
  size?: number;
  speedX?: number;
  speedY?: number;
}

const StarLayer: React.FC<StarLayerProps> = ({
  count = 3000,
  radius = 1.2,
  color = '#a78bfa',
  size = 0.002,
  speedX = -0.1,
  speedY = -0.067,
}) => {
  const ref = useRef<any>();
  const [sphere] = useState(() => random.inSphere(new Float32Array(count * 3), { radius }));

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta * speedX;
      ref.current.rotation.y -= delta * speedY;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={color}
          size={size}
          sizeAttenuation
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

/** Dense nebula-like cluster at a fixed position */
const NebulaCluster: React.FC<{
  position: [number, number, number];
  color: string;
  count: number;
  spread?: number;
}> = ({ position, color, count, spread = 0.35 }) => {
  const ref = useRef<any>();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * spread;
      arr[i * 3 + 1] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    return arr;
  }, [count, spread]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.04;
  });

  return (
    <group ref={ref} position={position}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.005}
          sizeAttenuation
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

/** Shooting stars that streak across the scene periodically */
const ShootingStars: React.FC = () => {
  const pointsRef = useRef<any>();
  const NUM = 6;

  const shooters = useMemo(() =>
    Array.from({ length: NUM }, (_, i) => ({
      startPos: new THREE.Vector3(
        (Math.random() - 0.5) * 2.2,
        0.4 + Math.random() * 0.6,
        (Math.random() - 0.5) * 0.4,
      ),
      dir: new THREE.Vector3(
        -(Math.random() * 0.5 + 0.3),
        -(Math.random() * 0.25 + 0.05),
        0,
      ).normalize(),
      speed: Math.random() * 0.25 + 0.15,
      phase: (i / NUM) * Math.PI * 2,
      period: Math.random() * 5 + 7, // 7-12 s cycle
    })),
    [],
  );

  const positions = useMemo(() => new Float32Array(NUM * 3), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < NUM; i++) {
      const s = shooters[i];
      const progress = ((t * s.speed + s.phase) % s.period) / s.period;
      if (progress < 0.25) {
        const tp = progress / 0.25;
        const pos = s.startPos.clone().addScaledVector(s.dir, tp * 1.8);
        positions[i * 3]     = pos.x;
        positions[i * 3 + 1] = pos.y;
        positions[i * 3 + 2] = pos.z;
      } else {
        positions[i * 3] = positions[i * 3 + 1] = positions[i * 3 + 2] = 999;
      }
    }
    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={NUM} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#fff9e0"
        size={0.01}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </points>
  );
};

export const StarField3D: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 1] }}>
        {/* Main violet star field */}
        <StarLayer count={2800} radius={1.2} color="#c4b5fd" size={0.0022} speedX={0.09} speedY={0.062} />
        {/* Warm gold sparse stars */}
        <StarLayer count={450}  radius={0.9} color="#fbbf24" size={0.004}  speedX={0.06} speedY={0.04} />
        {/* Faint cool-white distant stars */}
        <StarLayer count={1800} radius={1.5} color="#e0e7ff" size={0.0013} speedX={0.12} speedY={0.08} />
        {/* Deep rose accent stars */}
        <StarLayer count={300}  radius={1.1} color="#f9a8d4" size={0.003}  speedX={0.07} speedY={0.05} />

        {/* Nebula clusters */}
        <NebulaCluster position={[-0.35, 0.25, -0.5]}  color="#7c3aed" count={350} spread={0.4} />
        <NebulaCluster position={[ 0.42, -0.28, -0.35]} color="#0e7490" count={220} spread={0.3} />
        <NebulaCluster position={[-0.12, -0.45, -0.45]} color="#9333ea" count={280} spread={0.35} />
        <NebulaCluster position={[ 0.30,  0.40, -0.60]} color="#be185d" count={180} spread={0.28} />

        {/* Shooting stars */}
        <ShootingStars />
      </Canvas>
    </div>
  );
};
