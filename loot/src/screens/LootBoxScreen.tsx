import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import WebView from "react-native-webview";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

import type { RootStackScreenProps } from "@/navigation/types";

type Props = RootStackScreenProps<"LootBox">;

export default function LootBoxScreen({}: Props) {
  const [isAnimating, setIsAnimating] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // God rays animation values
  const ray1Rotation = useRef(new Animated.Value(0)).current;
  const ray2Rotation = useRef(new Animated.Value(0)).current;
  const ray3Rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start continuous rotation animations for god rays
    const createRotationAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        })
      );
    };

    // Start all three ray animations with different speeds
    createRotationAnimation(ray1Rotation, 60000).start(); // 60 seconds
    createRotationAnimation(ray2Rotation, 80000).start(); // 80 seconds
    createRotationAnimation(ray3Rotation, 100000).start(); // 100 seconds
  }, []);

  const handleOpenLootBox = async () => {
    if (isAnimating) return;

    setIsAnimating(true);

    // Trigger haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Trigger built-in animation in WebView immediately
    webViewRef.current?.injectJavaScript(`
      window.triggerBuiltInAnimation();
      true;
    `);

    // Play snap sound effect
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/snap.wav'),
          { shouldPlay: true, volume: 0.8 }
        );
        soundRef.current = sound;

        // Clean up sound after it finishes playing
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
            soundRef.current = null;
          }
        });
      } catch (error) {
        console.log("Failed to play sound effect:", error);
      }
    })();

    // Reset animation state after the animation completes (6 seconds)
    setTimeout(() => {
      setIsAnimating(false);
      // Reset the WebView animation state
      webViewRef.current?.injectJavaScript(`
        window.resetAnimation();
        true;
      `);
    }, 6000);
  };

  const handleWebViewMessage = (event: any) => {
    const message = event.nativeEvent.data;
    if (message === 'MODEL_CLICKED') {
      handleOpenLootBox();
    }
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: transparent;
        }
        #canvas {
          width: 100%;
          height: 100%;
          display: block;
          touch-action: auto;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <canvas id="canvas"></canvas>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>

      <script>
        let scene, camera, renderer, lootBox, mixer, particles, isAnimating = false;
        let clock = new THREE.Clock();
        let raycaster, mouse;
        let initialLootBoxPosition, initialLootBoxRotation, initialLootBoxScale;
        let auraBall, auraBallInitialY;

        function init() {
          // Scene setup
          scene = new THREE.Scene();
          scene.background = null;

          // Camera (zoomed out slightly)
          camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
          camera.position.set(0, 2.5, 6);
          camera.lookAt(0, 1, 0);

          // Renderer
          const canvas = document.getElementById('canvas');
          renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true
          });
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          renderer.outputEncoding = THREE.sRGBEncoding;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.2;

          // Lights
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
          scene.add(ambientLight);

          const spotLight = new THREE.SpotLight(0xffd700, 1.5);
          spotLight.position.set(0, 10, 5);
          spotLight.castShadow = true;
          scene.add(spotLight);

          const pointLight1 = new THREE.PointLight(0x9d4edd, 0.8);
          pointLight1.position.set(-5, 3, -3);
          scene.add(pointLight1);

          const pointLight2 = new THREE.PointLight(0x00d9ff, 0.8);
          pointLight2.position.set(5, 3, -3);
          scene.add(pointLight2);

          // Create floor grid
          const gridSize = 20;
          const gridDivisions = 40;
          const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
          gridHelper.position.y = -0.01; // Slightly below the model
          gridHelper.material.opacity = 0.3;
          gridHelper.material.transparent = true;
          scene.add(gridHelper);

          // Raycaster for click detection
          raycaster = new THREE.Raycaster();
          mouse = new THREE.Vector2();

          // Create particles (initially hidden)
          createParticles();

          // Create aura ball
          createAuraBall();

          // Load model with animations
          const loader = new THREE.GLTFLoader();
          loader.load(
            'https://ashon-g.github.io/arcadia-next-assets/loot_box.glb',
            function(gltf) {
              lootBox = gltf.scene;
              lootBox.position.set(0, 0, 0);

              // Scale the model to fit nicely
              const box = new THREE.Box3().setFromObject(lootBox);
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              const scale = 2 / maxDim;
              lootBox.scale.set(scale, scale, scale);

              // Center the model
              const center = box.getCenter(new THREE.Vector3());
              lootBox.position.sub(center.multiplyScalar(scale));
              lootBox.position.y = 0;

              scene.add(lootBox);

              // Store initial transform values to prevent drift
              initialLootBoxPosition = lootBox.position.clone();
              initialLootBoxRotation = lootBox.rotation.clone();
              initialLootBoxScale = lootBox.scale.clone();

              // Setup animation mixer if model has animations
              if (gltf.animations && gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(lootBox);
                // Store all animations for later use
                gltf.animations.forEach((clip) => {
                  const action = mixer.clipAction(clip);
                  action.setLoop(THREE.LoopOnce);
                  action.clampWhenFinished = true;
                });
              }
            },
            undefined,
            function(error) {
              console.error('Error loading model:', error);
            }
          );

          // Handle resize
          window.addEventListener('resize', onResize);

          // Add click/touch listener for model interaction
          canvas.addEventListener('click', onCanvasClick);
          canvas.addEventListener('touchend', onCanvasClick);

          animate();
        }

        function createCircleTexture() {
          const canvas = document.createElement('canvas');
          canvas.width = 32;
          canvas.height = 32;
          const ctx = canvas.getContext('2d');

          const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 32, 32);

          const texture = new THREE.CanvasTexture(canvas);
          return texture;
        }

        function createParticles() {
          const particleCount = 200;
          const geometry = new THREE.BufferGeometry();
          const positions = [];
          const colors = [];
          const sizes = [];
          const velocities = [];

          for (let i = 0; i < particleCount; i++) {
            // Position particles in a sphere around the loot box
            const radius = 1.5 + Math.random() * 0.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta) + 0.5;
            const z = radius * Math.cos(phi);

            positions.push(x, y, z);

            // Light blue color for all particles
            const color = new THREE.Color(0xadd8e6); // Light blue
            colors.push(color.r, color.g, color.b);

            // Random sizes (tinier particles)
            sizes.push(0.01 + Math.random() * 0.01);

            // Store velocity for gentle floating animation
            velocities.push(
              (Math.random() - 0.5) * 0.2,
              Math.random() * 0.1 + 0.05, // Gentle upward drift
              (Math.random() - 0.5) * 0.2
            );
          }

          geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
          geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

          // Store velocities as user data
          geometry.userData.velocities = velocities;
          geometry.userData.originalPositions = [...positions];
          geometry.userData.time = 0;

          const material = new THREE.PointsMaterial({
            size: 0.03,
            vertexColors: true,
            transparent: true,
            opacity: 0.6, // Always visible
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            map: createCircleTexture(), // Make particles circular
            alphaTest: 0.01
          });

          particles = new THREE.Points(geometry, material);
          scene.add(particles);
        }

        function createAuraBall() {
          // Load the magical orb model
          const loader = new THREE.GLTFLoader();
          loader.load(
            'https://ashon-g.github.io/arcadia-next-assets/magical_orb.glb',
            function(gltf) {
              auraBall = gltf.scene;
              auraBall.position.set(0, 0.3, 0); // Position inside the loot box

              // Scale the orb way bigger
              const box = new THREE.Box3().setFromObject(auraBall);
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              const scale = 2.0 / maxDim; // Increased from 1.2 to 2.0 for way bigger size
              auraBall.scale.set(scale, scale, scale);

              // Center the orb
              const center = box.getCenter(new THREE.Vector3());
              auraBall.position.sub(center.multiplyScalar(scale));
              auraBall.position.y = 0.3;

              // Apply white with silver metallic accents to all materials in the orb
              auraBall.traverse((child) => {
                if (child.isMesh && child.material) {
                  // White base with silver metallic finish
                  child.material.color = new THREE.Color(0xffffff); // Pure white base
                  child.material.emissive = new THREE.Color(0xe0e0e0); // Soft white glow
                  child.material.emissiveIntensity = 1.5;
                  child.material.metalness = 0.95; // Very metallic for silver look
                  child.material.roughness = 0.15; // Very smooth and reflective
                  child.material.needsUpdate = true;
                }
              });

              // Add central white glow light (localized to orb only)
              const centralLight = new THREE.PointLight(0xffffff, 8.0, 2.5);
              centralLight.position.set(0, 0, 0);
              auraBall.add(centralLight);

              // Add surrounding point lights for dramatic white/silver effect (localized)
              const lightColors = [
                { color: 0xffffff, intensity: 4.5 }, // Pure white
                { color: 0xe8e8e8, intensity: 4.0 }, // Soft white
                { color: 0xc0c0c0, intensity: 4.0 }, // Silver
                { color: 0xffffff, intensity: 4.5 }, // Pure white
                { color: 0xd3d3d3, intensity: 3.5 }, // Light silver
                { color: 0xffffff, intensity: 4.0 }, // Pure white
              ];

              const lightPositions = [
                { x: 0.5, y: 0, z: 0 },      // Right
                { x: -0.5, y: 0, z: 0 },     // Left
                { x: 0, y: 0.5, z: 0 },      // Top
                { x: 0, y: -0.5, z: 0 },     // Bottom
                { x: 0, y: 0, z: 0.5 },      // Front
                { x: 0, y: 0, z: -0.5 },     // Back
              ];

              lightPositions.forEach((pos, i) => {
                const light = new THREE.PointLight(
                  lightColors[i].color,
                  lightColors[i].intensity,
                  2.0  // Short distance - only affects orb
                );
                light.position.set(pos.x, pos.y, pos.z);
                auraBall.add(light);
              });

              scene.add(auraBall);
              auraBallInitialY = auraBall.position.y;
            },
            undefined,
            function(error) {
              console.error('Error loading magical orb:', error);
            }
          );
        }

        function onResize() {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function onCanvasClick(event) {
          event.preventDefault();

          // Calculate mouse position in normalized device coordinates
          const rect = renderer.domElement.getBoundingClientRect();
          const x = event.clientX || (event.changedTouches && event.changedTouches[0].clientX);
          const y = event.clientY || (event.changedTouches && event.changedTouches[0].clientY);

          mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

          // Update the raycaster
          raycaster.setFromCamera(mouse, camera);

          // Check if loot box is clicked
          if (lootBox) {
            const intersects = raycaster.intersectObject(lootBox, true);
            if (intersects.length > 0) {
              // Send message to React Native
              window.ReactNativeWebView?.postMessage('MODEL_CLICKED');
            }
          }
        }

        function animate() {
          requestAnimationFrame(animate);
          const delta = clock.getDelta();

          // Update animation mixer if it exists
          if (mixer) {
            mixer.update(delta);
          }

          // Lock model transform to prevent drift from animations
          if (lootBox && initialLootBoxPosition && initialLootBoxRotation && initialLootBoxScale) {
            lootBox.position.copy(initialLootBoxPosition);
            lootBox.rotation.copy(initialLootBoxRotation);
            lootBox.scale.copy(initialLootBoxScale);
          }

          // Continuously animate particles with gentle floating
          if (particles) {
            const positions = particles.geometry.attributes.position.array;
            const originalPositions = particles.geometry.userData.originalPositions;
            const velocities = particles.geometry.userData.velocities;
            particles.geometry.userData.time += delta;
            const time = particles.geometry.userData.time;

            for (let i = 0; i < positions.length; i += 3) {
              const idx = i / 3;

              // Gentle floating motion with sine wave
              const offsetX = Math.sin(time + idx * 0.1) * 0.1;
              const offsetY = Math.sin(time * 0.5 + idx * 0.15) * 0.1;
              const offsetZ = Math.cos(time + idx * 0.1) * 0.1;

              positions[i] = originalPositions[i] + offsetX;
              positions[i + 1] = originalPositions[i + 1] + offsetY;
              positions[i + 2] = originalPositions[i + 2] + offsetZ;
            }

            particles.geometry.attributes.position.needsUpdate = true;

            // Slow rotation
            particles.rotation.y += 0.001;
          }

          // Animate aura ball with gentle hovering and rotation when not animating
          if (auraBall && !isAnimating) {
            const time = clock.getElapsedTime();
            auraBall.position.y = auraBallInitialY + Math.sin(time * 2) * 0.08;

            // Gentle rotation on Y axis
            auraBall.rotation.y += 0.01;
          }

          // Model stays completely static when not animating
          // No idle animation

          renderer.render(scene, camera);
        }

        window.triggerBuiltInAnimation = function() {
          if (isAnimating || !lootBox) return;
          isAnimating = true;

          // Play built-in animation if available
          if (mixer) {
            mixer._actions.forEach(action => {
              action.reset();
              action.play();
            });
          }

          // Particle burst animation (enhance existing particles)
          const startTime = Date.now();
          const duration = 6000;
          const originalOpacity = particles.material.opacity;
          const auraBallStartY = auraBall.position.y;

          function animateEffects() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Enhance particles during animation
            const positions = particles.geometry.attributes.position.array;
            const originalPositions = particles.geometry.userData.originalPositions;
            const velocities = particles.geometry.userData.velocities;

            for (let i = 0; i < positions.length; i += 3) {
              const idx = i / 3;
              const time = particles.geometry.userData.time;

              // Add burst motion on top of existing floating
              const burstX = velocities[i] * progress * 1.5;
              const burstY = velocities[i + 1] * progress * 1.5;
              const burstZ = velocities[i + 2] * progress * 1.5;

              // Combine floating and burst
              const floatX = Math.sin(time + idx * 0.1) * 0.1;
              const floatY = Math.sin(time * 0.5 + idx * 0.15) * 0.1;
              const floatZ = Math.cos(time + idx * 0.1) * 0.1;

              positions[i] = originalPositions[i] + floatX + burstX;
              positions[i + 1] = originalPositions[i + 1] + floatY + burstY;
              positions[i + 2] = originalPositions[i + 2] + floatZ + burstZ;
            }

            particles.geometry.attributes.position.needsUpdate = true;

            // Brighten particles during animation
            if (progress < 0.15) {
              particles.material.opacity = originalOpacity + (1 - originalOpacity) * (progress / 0.15);
            } else if (progress > 0.85) {
              particles.material.opacity = originalOpacity + (1 - originalOpacity) * ((1 - progress) / 0.15);
            } else {
              particles.material.opacity = 1.0;
            }

            // Faster rotation during animation
            particles.rotation.y += 0.02;

            // Animate aura ball floating upward (delayed by 2 seconds)
            if (auraBall) {
              const delayDuration = 2000; // 2 seconds delay
              const floatDuration = duration - delayDuration; // Remaining time for float

              if (elapsed >= delayDuration) {
                // Calculate progress for just the float animation
                const floatElapsed = elapsed - delayDuration;
                const floatProgress = Math.min(floatElapsed / floatDuration, 1);

                // Float upward with easing
                const easeProgress = 1 - Math.pow(1 - floatProgress, 3); // ease-out cubic
                auraBall.position.y = auraBallStartY + easeProgress * 5; // Float 5 units up

                // Fade out all materials and lights as it goes up
                auraBall.traverse((child) => {
                  if (child.material) {
                    // Store original opacity if not already stored
                    if (child.userData.originalOpacity === undefined) {
                      child.userData.originalOpacity = child.material.opacity !== undefined ? child.material.opacity : 1;
                    }
                    if (child.material.transparent !== undefined) {
                      child.material.transparent = true;
                    }
                    child.material.opacity = child.userData.originalOpacity * (1 - floatProgress);
                  } else if (child.intensity !== undefined) {
                    // Fade the glow light
                    if (child.userData.originalIntensity === undefined) {
                      child.userData.originalIntensity = child.intensity;
                    }
                    child.intensity = child.userData.originalIntensity * (1 - floatProgress);
                  }
                });
              }
            }

            if (progress < 1) {
              requestAnimationFrame(animateEffects);
            } else {
              // Return to normal opacity
              particles.material.opacity = originalOpacity;
              setTimeout(() => {
                isAnimating = false;
              }, 200);
            }
          }

          animateEffects();
        };

        window.resetAnimation = function() {
          isAnimating = false;

          // Reset animation mixer
          if (mixer) {
            mixer.stopAllAction();
            mixer._actions.forEach(action => {
              action.reset();
            });
          }

          // Reset lootBox to exact initial state
          if (lootBox && initialLootBoxPosition && initialLootBoxRotation && initialLootBoxScale) {
            lootBox.position.copy(initialLootBoxPosition);
            lootBox.rotation.copy(initialLootBoxRotation);
            lootBox.scale.copy(initialLootBoxScale);
          }

          // Reset particles to floating state (don't hide them)
          const positions = particles.geometry.attributes.position.array;
          const originalPositions = particles.geometry.userData.originalPositions;

          for (let i = 0; i < positions.length; i++) {
            positions[i] = originalPositions[i];
          }

          particles.geometry.attributes.position.needsUpdate = true;
          particles.material.opacity = 0.6; // Keep them visible
          // Note: rotation continues from animate() loop

          // Reset aura ball
          if (auraBall) {
            auraBall.position.y = auraBallInitialY;

            // Reset all children (for the point light and any other children)
            auraBall.traverse((child) => {
              if (child.material) {
                if (child.userData.originalOpacity !== undefined) {
                  child.material.opacity = child.userData.originalOpacity;
                }
              } else if (child.intensity !== undefined && child.userData.originalIntensity !== undefined) {
                child.intensity = child.userData.originalIntensity;
              }
            });
          }
        };

        init();
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={StyleSheet.absoluteFill}
      />

      {/* God rays - very faint and slow */}
      <View style={styles.godRaysContainer}>
        <Animated.View
          style={[
            styles.godRay,
            {
              transform: [
                {
                  rotate: ray1Rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.15)', 'transparent', 'rgba(255, 255, 255, 0.08)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.ray1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.godRay,
            {
              transform: [
                {
                  rotate: ray2Rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['120deg', '480deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.12)', 'transparent', 'rgba(255, 255, 255, 0.06)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.ray2}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.godRay,
            {
              transform: [
                {
                  rotate: ray3Rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['240deg', '600deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.13)', 'transparent', 'rgba(255, 255, 255, 0.07)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.ray3}
          />
        </Animated.View>
      </View>

      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        scalesPageToFit={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleWebViewMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  godRaysContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 1,
    pointerEvents: 'none',
  },
  godRay: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ray1: {
    width: 150,
    height: '100%',
  },
  ray2: {
    width: 120,
    height: '100%',
  },
  ray3: {
    width: 180,
    height: '100%',
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
    zIndex: 2,
  },
});
