import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { useAvatarStore } from '../state/avatarStore';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as THREE from 'three';

interface RPMAvatarModelProps {
  glbUrl: string;
  rotationX: number;
  rotationY: number;
}

// Animation loader component - loads the animation GLB separately
const AnimationLoader: React.FC<{ onLoad: (animations: THREE.AnimationClip[]) => void }> = ({ onLoad }) => {
  const animationUrl = 'https://raw.githubusercontent.com/readyplayerme/animation-library/master/masculine/glb/idle/M_Standing_Idle_Variations_003.glb';

  const { animations } = useGLTF(animationUrl);

  useEffect(() => {
    if (animations && animations.length > 0) {
      console.log('[RPMCharacter3D] Animation loaded successfully:', animations.length, 'clips');
      onLoad(animations);
    }
  }, [animations, onLoad]);

  return null;
};

const RPMAvatarModel: React.FC<RPMAvatarModelProps> = ({ glbUrl, rotationX, rotationY }) => {
  const { scene } = useGLTF(glbUrl);
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  const [animationLoaded, setAnimationLoaded] = useState(false);
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // Scale and position the model - slightly smaller to avoid cutoff
    scene.scale.set(4.5, 4.5, 4.5);
    scene.position.set(0, -4.2, 0);
  }, [scene]);

  // Apply parallax rotation based on drag gestures
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y = rotationY;
      modelRef.current.rotation.x = rotationX * 0.3; // Reduced multiplier for subtle tilt
    }
  });

  // Callback when animation is loaded
  const handleAnimationLoad = useRef((animations: THREE.AnimationClip[]) => {
    try {
      console.log('[RPMCharacter3D] Applying animation to avatar...');

      // Create animation mixer for the avatar scene
      if (!mixer.current) {
        mixer.current = new THREE.AnimationMixer(scene);
      }

      // Get the first animation from the loaded GLB
      const idleClip = animations[0];

      // Create and play the animation action
      const action = mixer.current.clipAction(idleClip);
      action.play();

      setAnimationLoaded(true);
      console.log('[RPMCharacter3D] Idle animation is now playing');
    } catch (error) {
      console.log('[RPMCharacter3D] Failed to apply animation:', error);
    }
  }).current;

  // Update animation mixer every frame
  useFrame((state, delta) => {
    if (mixer.current && animationLoaded) {
      mixer.current.update(delta);
    }
  });

  useEffect(() => {
    return () => {
      // Cleanup mixer on unmount
      if (mixer.current) {
        mixer.current.stopAllAction();
        mixer.current = null;
      }
    };
  }, []);

  return (
    <group ref={modelRef}>
      <primitive object={scene} />
      <AnimationLoader onLoad={handleAnimationLoad} />
    </group>
  );
};

interface RPMCharacter3DProps {
  style?: any;
}

export const RPMCharacter3D: React.FC<RPMCharacter3DProps> = ({ style }) => {
  const currentAvatarGlbUrl = useAvatarStore(state => state.currentAvatarGlbUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Shared values for parallax rotation
  const rotationX = useSharedValue(0);
  const rotationY = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  useEffect(() => {
    if (currentAvatarGlbUrl) {
      setLoading(true);
      setError(false);
      // Preload the GLB
      fetch(currentAvatarGlbUrl)
        .then(() => setLoading(false))
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    }
  }, [currentAvatarGlbUrl]);

  // Pan gesture for dragging the avatar with position-based parallax
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';

      // Get the absolute position of the touch
      const touchX = e.absoluteX;
      const touchY = e.absoluteY;

      // Calculate position relative to screen center (normalized -1 to 1)
      const screenWidth = 400; // Approximate, will be close enough for effect
      const screenHeight = 800;
      const centerX = screenWidth / 2;
      const centerY = screenHeight / 2;

      const normalizedX = (touchX - centerX) / centerX;
      const normalizedY = (touchY - centerY) / centerY;

      // Parallax speed multiplier (similar to speed=30 in the jQuery code)
      const speed = 30;

      // Calculate rotation based on normalized position
      // Horizontal position controls Y rotation (left/right spin)
      const targetRotationY = normalizedX * (speed * 0.01);

      // Vertical position controls X rotation (up/down tilt)
      const targetRotationX = -normalizedY * (speed * 0.005);

      // Apply smooth spring animation to rotation
      rotationY.value = withSpring(targetRotationY, {
        damping: 20,
        stiffness: 150,
      });

      rotationX.value = withSpring(targetRotationX, {
        damping: 20,
        stiffness: 150,
      });

      // Calculate parallax offset for the character (more subtle than rotation)
      const percentX = ((touchX / screenWidth) * speed) - (speed / 0.75);
      const percentY = ((touchY / screenHeight) * speed) - (speed / 0.6);

      const offsetMultiplier = 0.3; // Scale down the offset
      offsetX.value = withSpring(-percentX * offsetMultiplier, {
        damping: 20,
        stiffness: 120,
      });
      offsetY.value = withSpring(-percentY * offsetMultiplier, {
        damping: 20,
        stiffness: 120,
      });
    })
    .onEnd(() => {
      'worklet';
      // Spring back to center when released
      rotationY.value = withSpring(0, { damping: 20, stiffness: 100 });
      rotationX.value = withSpring(0, { damping: 20, stiffness: 100 });
      offsetX.value = withSpring(0, { damping: 20, stiffness: 100 });
      offsetY.value = withSpring(0, { damping: 20, stiffness: 100 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
    ],
  }));

  if (!currentAvatarGlbUrl) {
    return null;
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#4A9EFF" />
      </View>
    );
  }

  if (error) {
    return null;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[style, animatedStyle]}>
        <Canvas style={{ width: '100%', height: '100%' }}>
          {/* Camera positioned even further back to accommodate the much larger avatar */}
          <PerspectiveCamera makeDefault position={[0, 0, 9]} fov={50} />

          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
          <directionalLight position={[-5, 3, -5]} intensity={0.5} color="#4A9EFF" />
          <pointLight position={[0, 2, 0]} intensity={0.8} color="#FFD700" distance={5} />

          {/* Avatar Model with parallax rotation */}
          <RPMAvatarModel
            glbUrl={currentAvatarGlbUrl}
            rotationX={rotationX.value}
            rotationY={rotationY.value}
          />
        </Canvas>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
