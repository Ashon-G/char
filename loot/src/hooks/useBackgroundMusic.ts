import { useEffect, useRef } from "react";
import { Audio } from "expo-av";

/**
 * Custom hook to manage background music playback
 * Automatically loads, plays, and loops background music at a lower volume
 */
export function useBackgroundMusic(audioSource: any, volume: number = 0.3) {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let isMounted = true;

    const setupBackgroundMusic = async () => {
      try {
        console.log("Setting up background music...");

        // Set audio mode to allow playing in silent mode
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        console.log("Audio mode set successfully");

        // Create and load the sound
        const { sound } = await Audio.Sound.createAsync(
          audioSource,
          {
            isLooping: true,
            volume: volume,
            shouldPlay: true,
          }
        );

        console.log("Background music loaded and playing at volume:", volume);

        if (isMounted) {
          soundRef.current = sound;

          // Get the status to confirm it's playing
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            console.log("Sound status - isPlaying:", status.isPlaying, "volume:", status.volume);
          }
        }
      } catch (error) {
        console.log("Failed to setup background music:", error);
      }
    };

    setupBackgroundMusic();

    // Cleanup function
    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.stopAsync().then(() => {
          soundRef.current?.unloadAsync();
          soundRef.current = null;
        });
      }
    };
  }, [audioSource, volume]);

  return soundRef;
}
