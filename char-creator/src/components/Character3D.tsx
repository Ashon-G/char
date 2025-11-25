import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sphere, Torus, Box } from '@react-three/drei';
import * as THREE from 'three';
import type { Mesh, Group } from 'three';

// Animated character placeholder - a stylized warrior figure
const CharacterModel: React.FC = () => {
  const groupRef = useRef<Group>(null);
  const helmetRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Gentle rotation
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.3;
    }

    if (helmetRef.current) {
      // Subtle helmet bob
      helmetRef.current.position.y = 1.5 + Math.sin(clock.getElapsedTime() * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Ambient glow */}
      <pointLight position={[0, 2, 0]} intensity={2} color="#4A9EFF" distance={5} />
      <pointLight position={[0, 0, 2]} intensity={1} color="#FFD700" distance={4} />

      {/* Helmet */}
      <Sphere ref={helmetRef} args={[0.35, 32, 32]} position={[0, 1.5, 0]}>
        <meshStandardMaterial
          color="#1E293B"
          metalness={0.9}
          roughness={0.2}
          emissive="#4A9EFF"
          emissiveIntensity={0.3}
        />
      </Sphere>

      {/* Visor glow */}
      <Sphere args={[0.15, 16, 16]} position={[0, 1.5, 0.3]}>
        <meshStandardMaterial
          color="#4A9EFF"
          emissive="#4A9EFF"
          emissiveIntensity={2}
          transparent
          opacity={0.8}
        />
      </Sphere>

      {/* Chest/Torso */}
      <Box args={[0.8, 1.2, 0.5]} position={[0, 0.5, 0]}>
        <meshStandardMaterial
          color="#334155"
          metalness={0.8}
          roughness={0.3}
          emissive="#9D5CFF"
          emissiveIntensity={0.1}
        />
      </Box>

      {/* Shoulder Pads */}
      <Sphere args={[0.25, 16, 16]} position={[-0.6, 1.0, 0]}>
        <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
      </Sphere>
      <Sphere args={[0.25, 16, 16]} position={[0.6, 1.0, 0]}>
        <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
      </Sphere>

      {/* Arms */}
      <Box args={[0.2, 0.8, 0.2]} position={[-0.6, 0.3, 0]}>
        <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.4} />
      </Box>
      <Box args={[0.2, 0.8, 0.2]} position={[0.6, 0.3, 0]}>
        <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.4} />
      </Box>

      {/* Waist/Belt */}
      <Torus args={[0.5, 0.08, 8, 24]} position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} />
      </Torus>

      {/* Legs */}
      <Box args={[0.3, 1.0, 0.3]} position={[-0.25, -0.8, 0]}>
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </Box>
      <Box args={[0.3, 1.0, 0.3]} position={[0.25, -0.8, 0]}>
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </Box>

      {/* Class Item - Cape/Mark */}
      <Box args={[0.6, 1.2, 0.05]} position={[0, 0.3, -0.3]} rotation={[0.2, 0, 0]}>
        <meshStandardMaterial
          color="#9D5CFF"
          metalness={0.3}
          roughness={0.7}
          side={THREE.DoubleSide}
          emissive="#9D5CFF"
          emissiveIntensity={0.2}
        />
      </Box>

      {/* Energy rings around character */}
      <Torus args={[1.2, 0.02, 8, 32]} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#4A9EFF"
          emissive="#4A9EFF"
          emissiveIntensity={1.5}
          transparent
          opacity={0.6}
        />
      </Torus>
    </group>
  );
};

interface Character3DProps {
  style?: any;
}

export const Character3D: React.FC<Character3DProps> = ({ style }) => {
  return (
    <Canvas style={style}>
      <PerspectiveCamera makeDefault position={[0, 1, 4]} fov={50} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
      <directionalLight position={[-5, 3, -5]} intensity={0.5} color="#4A9EFF" />

      {/* Character */}
      <CharacterModel />

      {/* Controls - disabled for auto-rotation */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        autoRotate={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2.5}
      />
    </Canvas>
  );
};
