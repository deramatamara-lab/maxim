import { Audio, AVPlaybackSource } from 'expo-av';
import { useCallback, useEffect, useRef } from 'react';

export type SoundId = 'tapSoft' | 'powerUp' | 'success' | 'warning';
export type SoundEffect = 'click' | 'tapSoft' | 'powerUp' | 'success' | 'warning' | 'power';

const sources: Record<SoundId, AVPlaybackSource> = {
  tapSoft: require('../../assets/sounds/click.wav'),
  powerUp: require('../../assets/sounds/power.wav'),
  success: require('../../assets/sounds/click.wav'),
  warning: require('../../assets/sounds/power.wav'),
};

export function useSound() {
  const soundsRef = useRef<Partial<Record<SoundId, Audio.Sound>>>({});

  useEffect(() => {
    let isMounted = true;

    (async () => {
      for (const id of Object.keys(sources) as SoundId[]) {
        const { sound } = await Audio.Sound.createAsync(sources[id], {
          shouldPlay: false,
        });
        if (!isMounted) {
          await sound.unloadAsync();
          continue;
        }
        soundsRef.current[id] = sound;
      }
    })();

    return () => {
      isMounted = false;
      const current = soundsRef.current;
      soundsRef.current = {};
      Promise.all(
        (Object.values(current) as Audio.Sound[]).map((s) => s.unloadAsync()),
      ).catch(() => {});
    };
  }, []);

  const play = useCallback(async (id: SoundId | SoundEffect) => {
    // Map legacy effects to actual sound IDs
    let soundId: SoundId;
    if (id === 'click') soundId = 'tapSoft';
    else if (id === 'power') soundId = 'powerUp';
    else soundId = id as SoundId;
    
    const sound = soundsRef.current[soundId];
    if (!sound) return;
    try {
      await sound.replayAsync();
    } catch {
      // ignore playback issues
    }
  }, []);

  return { play };
}
