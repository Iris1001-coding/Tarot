import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Ring, Torus } from '@react-three/drei';
import * as THREE from 'three';

const Orb = () => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (sphereRef.current) {
      sphereRef.current.rotation.y = t * 0.2;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2.5;
      ringRef.current.rotation.y = t * 0.1;
      ringRef.current.rotation.z = t * 0.05;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.x = Math.PI / 1.8;
      outerRingRef.current.rotation.y = -t * 0.15;
    }
  });

  return (
    <group scale={1.2}>
      {/* Core Sphere */}
      <Sphere ref={sphereRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color="#4c1d95" // Deep purple
          emissive="#8b5cf6" // Violet glow
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.8}
          distort={0.4} // Swirling liquid effect
          speed={2}
        />
      </Sphere>

      {/* Inner Glowing Ring */}
      <Ring ref={ringRef} args={[1.4, 1.6, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#c084fc"
          emissive="#a855f7"
          emissiveIntensity={2}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </Ring>

      {/* Outer Orbit Ring */}
      <Torus ref={outerRingRef} args={[2.2, 0.05, 16, 100]} rotation={[Math.PI / 3, 0, 0]}>
        <meshStandardMaterial
          color="#38bdf8" // Light blue
          emissive="#0ea5e9"
          emissiveIntensity={1}
          transparent
          opacity={0.4}
        />
      </Torus>
      
      {/* Ambient Light for the scene */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} color="#a855f7" intensity={2} />
    </group>
  );
};

export const MysticOrb: React.FC = () => {
  return (
    <div className="w-48 h-48 relative">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Orb />
      </Canvas>
    </div>
  );
};
