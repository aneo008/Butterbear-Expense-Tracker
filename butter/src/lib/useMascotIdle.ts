import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Mood } from '../constants/mascotSvgs';

// Built-in Animated only (web/native-safe, no worklets). We force
// useNativeDriver:false everywhere because (a) web requires it and (b) you must
// not mix native/non-native animations on the same Animated.Value.
const NO_NATIVE = { useNativeDriver: false };

type Vals = { rotZ: Animated.Value; transY: Animated.Value };
type Flourish = (v: Vals) => Animated.CompositeAnimation;

// --- individual flourishes (whole-body transforms) ---

// Sleepy "drowsy tip": slow heavy lean to one side, a quick catch back, a small
// overshoot, then a damped settle to upright. Randomized left/right.
const drowsyTip: Flourish = ({ rotZ }) => {
  const dir = Math.random() < 0.5 ? 1 : -1;
  return Animated.sequence([
    Animated.timing(rotZ, { toValue: 14 * dir, duration: 1500, easing: Easing.out(Easing.quad), ...NO_NATIVE }),
    Animated.timing(rotZ, { toValue: -4 * dir, duration: 240, easing: Easing.in(Easing.quad), ...NO_NATIVE }),
    Animated.timing(rotZ, { toValue: 2 * dir, duration: 220, easing: Easing.inOut(Easing.sin), ...NO_NATIVE }),
    Animated.timing(rotZ, { toValue: 0, duration: 320, easing: Easing.out(Easing.sin), ...NO_NATIVE }),
  ]);
};

// Gentle side-to-side sway.
const wobble: Flourish = ({ rotZ }) => {
  const dir = Math.random() < 0.5 ? 1 : -1;
  return Animated.sequence([
    Animated.timing(rotZ, { toValue: 4 * dir, duration: 320, easing: Easing.inOut(Easing.sin), ...NO_NATIVE }),
    Animated.timing(rotZ, { toValue: -3 * dir, duration: 360, easing: Easing.inOut(Easing.sin), ...NO_NATIVE }),
    Animated.timing(rotZ, { toValue: 2 * dir, duration: 300, easing: Easing.inOut(Easing.sin), ...NO_NATIVE }),
    Animated.timing(rotZ, { toValue: 0, duration: 300, easing: Easing.out(Easing.sin), ...NO_NATIVE }),
  ]);
};

// Curious head-tilt-and-hold.
const tilt: Flourish = ({ rotZ }) => {
  const dir = Math.random() < 0.5 ? 1 : -1;
  return Animated.sequence([
    Animated.timing(rotZ, { toValue: 6 * dir, duration: 400, easing: Easing.out(Easing.quad), ...NO_NATIVE }),
    Animated.delay(700),
    Animated.timing(rotZ, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.sin), ...NO_NATIVE }),
  ]);
};

// A small jump with a bouncy landing.
const hop: Flourish = ({ transY }) => {
  return Animated.sequence([
    Animated.timing(transY, { toValue: -16, duration: 180, easing: Easing.out(Easing.quad), ...NO_NATIVE }),
    Animated.timing(transY, { toValue: 0, duration: 300, easing: Easing.bounce, ...NO_NATIVE }),
  ]);
};

// --- per-mood flourish pools + cadence ---

const POOLS: Record<Mood, Flourish[]> = {
  sleepy: [drowsyTip],
  excited: [hop, hop, wobble], // weighted toward hops
  happy: [wobble, tilt, hop],
  content: [wobble, tilt],
  worried: [wobble],
  celebrating: [],
};

// [minDelay, maxDelay] ms between flourishes.
const CADENCE: Record<Mood, [number, number]> = {
  sleepy: [6000, 10000],
  excited: [3500, 6000],
  happy: [5000, 9000],
  content: [5500, 9500],
  worried: [6000, 10000],
  celebrating: [9999999, 9999999],
};

const BREATH_DUR: Record<Mood, number> = {
  sleepy: 2900,
  excited: 1500,
  happy: 2200,
  content: 2300,
  worried: 2400,
  celebrating: 2000,
};

export type IdleResult = {
  breathScaleY: Animated.AnimatedInterpolation<number>;
  breathTransY: Animated.AnimatedInterpolation<number>;
  rotZDeg: Animated.AnimatedInterpolation<string>;
  transY: Animated.Value;
};

/**
 * Drives Butter's idle motion: an always-on breathing loop (speed by mood) plus
 * a randomized scheduler that plays one mood-appropriate flourish at a time.
 * When `enabled` is false (e.g. during a celebration) flourishes pause and the
 * flourish transforms reset to neutral; breathing continues.
 */
export function useMascotIdle(mood: Mood, enabled: boolean): IdleResult {
  const breath = useRef(new Animated.Value(0)).current;
  const rotZ = useRef(new Animated.Value(0)).current;
  const transY = useRef(new Animated.Value(0)).current;

  // Breathing loop — restarts when mood (speed) changes.
  useEffect(() => {
    const dur = BREATH_DUR[mood];
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), ...NO_NATIVE }),
        Animated.timing(breath, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), ...NO_NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [mood, breath]);

  // Flourish scheduler.
  useEffect(() => {
    if (!enabled) {
      rotZ.setValue(0);
      transY.setValue(0);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let running: Animated.CompositeAnimation | null = null;
    const pool = POOLS[mood];
    const [min, max] = CADENCE[mood];

    const schedule = () => {
      const delay = min + Math.random() * (max - min);
      timer = setTimeout(() => {
        if (cancelled || pool.length === 0) return;
        const fn = pool[Math.floor(Math.random() * pool.length)];
        running = fn({ rotZ, transY });
        running.start(() => {
          if (!cancelled) schedule();
        });
      }, delay);
    };
    schedule();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      running?.stop?.();
      rotZ.setValue(0);
      transY.setValue(0);
    };
  }, [mood, enabled, rotZ, transY]);

  return {
    breathScaleY: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }),
    breathTransY: breath.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }),
    rotZDeg: rotZ.interpolate({ inputRange: [-20, 20], outputRange: ['-20deg', '20deg'] }),
    transY,
  };
}
