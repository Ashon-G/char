# Mystical Loot Box - 3D Interactive Experience

A stunning 3D interactive loot box app built with Expo and React Native, featuring built-in GLB animations, snap sound effects, and bubble aura visuals.

## Features

- **3D Loot Box Model**: Interactive 3D model loaded from https://ashon-g.github.io/arcadia-next-assets/loot_box.glb
- **Magical Orb**: 3D magical orb model loaded from https://ashon-g.github.io/arcadia-next-assets/magical_orb.glb that hovers inside the loot box
- **Direct Model Interaction**: Tap directly on the 3D model to trigger animation
- **Static Display**: Model stays completely static when not activated (no idle animation)
- **Built-in Animation**: Tapping the model triggers the GLB model's built-in animation
- **Magical Orb**: Hovering 3D orb with golden glow floats inside the loot box and rises upward when activated
- **Ambient Particles**: 200 tiny light blue particles continuously float around the model
- **Particle Burst**: Particles brighten and burst outward when animation triggers
- **Snap Sound Effect**: Quick snap sound plays when animation is triggered
- **Background Music**: Looping shrine background music plays automatically at 30% volume
- **Haptic Feedback**: Heavy impact feedback on opening
- **Clean UI**: No overlays or buttons - just the 3D model and gradient background

## Design

**Visual Style:**
- Background: Deep cosmic gradient (#0f0c29 → #302b63 → #24243e)
- Magical Orb: Much larger 3D GLB model with brilliant white and silver metallic finish
  - Pure white base color (#ffffff)
  - Soft white emissive glow (#e0e0e0 with intensity 1.5)
  - Very high metalness (0.95) for silver metallic look
  - Very smooth and reflective (0.15 roughness)
  - Central white point light (intensity 10.0)
  - 6 surrounding point lights with white/silver tones positioned all around
  - 2 spotlights (top and front) for additional dramatic lighting
  - Gently rotates and hovers inside the loot box
- Particles: 200 tinier light blue circular particles (#add8e6) that continuously float around the model
- Particle appearance: Soft circular glow with gradient falloff for smooth edges
- Ambient animation: Gentle sine wave motion creating a floating effect
- Minimalist UI: No text or buttons, model is the only interactive element

**Inspiration:**
Drawing from premium mobile games like Clash Royale, Hearthstone, and Genshin Impact loot box experiences, combined with a cosmic sci-fi aesthetic.

## Tech Stack

- **Expo SDK 53** with React Native 0.76.7
- **Three.js** for 3D rendering via WebView
- **Expo AV** for audio playback (sound effects and background music)
- **Expo Linear Gradient** for beautiful backgrounds
- **Expo Haptics** for tactile feedback
- **NativeWind** for styling

## Project Structure

```
/home/user/workspace/
├── src/
│   ├── screens/
│   │   └── LootBoxScreen.tsx       # Main 3D loot box screen
│   ├── hooks/
│   │   └── useBackgroundMusic.ts   # Background music hook
│   ├── navigation/
│   │   ├── RootNavigator.tsx       # Single screen navigation
│   │   └── types.ts                # Navigation types
│   ├── lib/
│   │   ├── queryClient.ts          # React Query setup
│   │   └── ...
│   └── utils/
│       └── cn.ts                   # Tailwind merge utility
├── assets/
│   ├── shrine.mpeg                 # Background music
│   └── sounds/
│       └── snap.wav                # Snap sound effect for animation
├── App.tsx                         # App entry point
└── README.md                       # This file
```

## How It Works

1. **Background Music**: Shrine music automatically loads and plays on loop at 30% volume when the app starts
2. **3D Rendering**: Uses Three.js in a WebView to render the GLB model with proper lighting and camera setup
3. **Click Detection**: Uses Three.js Raycaster to detect when the user taps on the 3D model
4. **WebView Bridge**: Sends messages from WebView to React Native when model is clicked
5. **Instant Animation**: Animation starts immediately when model is tapped (non-blocking)
6. **Built-in Animations**: GLTFLoader loads model animations and AnimationMixer plays them
7. **Transform Lock**: Model position, rotation, and scale are locked to prevent drift from animations
8. **Particle System**: 200 tiny particles created using Three.js Points with random colors and velocities
9. **Sound Playback**: Snap sound effect plays instantly when animation triggers
10. **Auto-Reset**: Animation and particles automatically reset after 3 seconds, ready for next tap
11. **State Management**: Local React state prevents multiple simultaneous animations

## Animation Details

- **Idle**:
  - Model is completely static (no movement)
  - Magical orb hovers inside the model with gentle sine wave bobbing
  - Orb rotates gently on Y axis with golden point light glow
  - 200 tinier light blue circular particles continuously float around the model
  - Gentle sine wave motion with slow rotation
  - Particles have soft gradient edges for smooth circular appearance
  - Always visible at 60% opacity
- **Activation**:
  - Triggers GLB model's built-in animation if available
  - Magical orb floats upward (5 units) after 2 seconds with ease-out cubic motion
  - Orb fades out as it rises and disappears by the end
  - Particle burst effect:
    - Particles brighten to 100% opacity
    - Burst outward in random directions
    - Faster rotation speed
    - Smooth transition back to idle state
  - Snap sound effect plays instantly when animation triggers

## Future Enhancements

- Add reward reveal system
- Multiple loot box types with different rarities
- 3D reward items that pop out
- Collection system to track opened boxes
