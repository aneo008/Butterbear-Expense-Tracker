import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { Mood, Facing, ArmPose, defaultArmPose } from '../constants/mascotLayers';

// Built-in Animated only. useNativeDriver MUST be false (web requires it; can't
// mix drivers on one value). Hybrid model: body/feet via transforms, arms via
// drawn pose frames (armPose state) so a wave never detaches.
type SpringCfg = { stiffness: number; damping: number; mass: number; useNativeDriver: false };
const SOFT: SpringCfg = { stiffness: 90, damping: 14, mass: 1, useNativeDriver: false };
const SOFT_SLOW: SpringCfg = { stiffness: 60, damping: 13, mass: 1.1, useNativeDriver: false };

function spring(v: Animated.Value, toValue: number, cfg: SpringCfg = SOFT) {
  return Animated.spring(v, { toValue, ...cfg });
}
function timing(v: Animated.Value, toValue: number, duration: number, easing = Easing.inOut(Easing.sin)) {
  return Animated.timing(v, { toValue, duration, easing, useNativeDriver: false });
}

export type MascotAnim = {
  breath: Animated.Value;
  bodyRot: Animated.Value;   // degrees, torso+head lean (pivot: hip — feet stay planted)
  rootTY: Animated.Value;    // px, hop / dip (whole bear incl. feet leaves the ground)
  rootSX: Animated.Value;    // scaleX squash/stretch
  rootSY: Animated.Value;    // scaleY
  rootRotY: Animated.Value;  // 0..1 turn progress (scaleX flip for spin)
  headRot: Animated.Value;   // degrees, head extra (pivot: neck) — drag/overlap
  facing: Facing;
  shownMood: Mood;
  armPose: ArmPose;          // drawn arm frame
  celebrate: () => void;
};

export function useMascotAnimation(mood: Mood, enabledExternally = true): MascotAnim {
  const breath = useRef(new Animated.Value(0)).current;
  const bodyRot = useRef(new Animated.Value(0)).current;
  const rootTY = useRef(new Animated.Value(0)).current;
  const rootSX = useRef(new Animated.Value(1)).current;
  const rootSY = useRef(new Animated.Value(1)).current;
  const rootRotY = useRef(new Animated.Value(0)).current;
  const headRot = useRef(new Animated.Value(0)).current;

  const [facing, setFacing] = useState<Facing>('front');
  const [celebrating, setCelebrating] = useState(false);
  const [armPose, setArmPose] = useState<ArmPose>(defaultArmPose(mood));
  const busy = celebrating;
  const shownMood: Mood = celebrating ? 'celebrating' : mood;

  // keep arm at the mood's resting pose when not mid-gesture
  useEffect(() => { setArmPose(defaultArmPose(mood)); }, [mood]);

  // ---------- breathing ----------
  useEffect(() => {
    const dur = mood === 'excited' ? 1500 : mood === 'sleepy' ? 2900 : 2200;
    const loop = Animated.loop(
      Animated.sequence([timing(breath, 1, dur), timing(breath, 0, dur)])
    );
    loop.start();
    return () => loop.stop();
  }, [mood, breath]);

  const resetGesture = useCallback(() => {
    [bodyRot, rootTY, rootSX, rootSY, rootRotY, headRot].forEach(v => v.stopAnimation());
    bodyRot.setValue(0); rootTY.setValue(0); rootSX.setValue(1);
    rootSY.setValue(1); rootRotY.setValue(0); headRot.setValue(0);
    setFacing('front'); setArmPose(defaultArmPose(mood));
  }, [bodyRot, rootTY, rootSX, rootSY, rootRotY, headRot, mood]);

  // ---------- flourishes ----------

  // Drowsy tip: torso leans (feet planted), head drags. Body bends above hip.
  const drowsyTip = useCallback(() => {
    const dir = Math.random() < 0.5 ? 1 : -1;
    return Animated.parallel([
      Animated.sequence([
        timing(bodyRot, 11 * dir, 1400, Easing.out(Easing.quad)),
        spring(bodyRot, 0, SOFT_SLOW),
      ]),
      Animated.sequence([
        Animated.delay(180),
        timing(headRot, 6 * dir, 1300, Easing.out(Easing.quad)),
        spring(headRot, 0, { stiffness: 50, damping: 11, mass: 1, useNativeDriver: false }),
      ]),
    ]);
  }, [bodyRot, headRot]);

  // Hop with anticipation + volume-preserving squash/stretch.
  const hop = useCallback(() => {
    return Animated.sequence([
      Animated.parallel([timing(rootSY, 0.9, 160), timing(rootSX, 1.08, 160), timing(rootTY, 6, 160)]),
      Animated.parallel([
        timing(rootSY, 1.12, 150, Easing.out(Easing.quad)),
        timing(rootSX, 0.92, 150, Easing.out(Easing.quad)),
        timing(rootTY, -22, 150, Easing.out(Easing.quad)),
      ]),
      Animated.parallel([
        timing(rootSY, 0.92, 130, Easing.in(Easing.quad)),
        timing(rootSX, 1.07, 130, Easing.in(Easing.quad)),
        timing(rootTY, 4, 130, Easing.in(Easing.quad)),
      ]),
      Animated.parallel([spring(rootSY, 1), spring(rootSX, 1), spring(rootTY, 0)]),
    ]);
  }, [rootSX, rootSY, rootTY]);

  const sway = useCallback(() => {
    const dir = Math.random() < 0.5 ? 1 : -1;
    return Animated.parallel([
      Animated.sequence([spring(bodyRot, 4 * dir, SOFT), spring(bodyRot, 0, SOFT)]),
      Animated.sequence([Animated.delay(120), spring(headRot, 3 * dir, SOFT), spring(headRot, 0, SOFT)]),
    ]);
  }, [bodyRot, headRot]);

  // Happy "wave then giggle": swap drawn arm FRAMES (rest -> half -> up -> half
  // -> up ...) so the arm stays connected, then a body giggle. Manual orchestration.
  const waveGiggle = useCallback((): Animated.CompositeAnimation => {
    let stopped = false;
    const frames: Array<[ArmPose, number]> = [
      ['waveHalf', 140], ['waveUp', 200], ['waveHalf', 180],
      ['waveUp', 180], ['waveHalf', 180], ['rest', 140],
    ];
    return {
      start: (done?: (r: { finished: boolean }) => void) => {
        const finish = () => done?.({ finished: !stopped });
        let i = 0;
        const next = () => {
          if (stopped || i >= frames.length) {
            // giggle: two soft body bobs
            Animated.sequence([
              Animated.parallel([spring(rootSY, 1.05, SOFT), spring(rootSX, 0.97, SOFT)]),
              Animated.parallel([spring(rootSY, 0.98, SOFT), spring(rootSX, 1.02, SOFT)]),
              Animated.parallel([spring(rootSY, 1, SOFT), spring(rootSX, 1, SOFT)]),
            ]).start(() => finish());
            return;
          }
          const [pose, dur] = frames[i++];
          setArmPose(pose);
          setTimeout(next, dur);
        };
        next();
      },
      stop: () => { stopped = true; setArmPose(defaultArmPose(mood)); },
      reset: () => {},
    } as Animated.CompositeAnimation;
  }, [rootSX, rootSY, mood]);

  // Excited "turn around & shake bumbun": spin edge-on, swap to back, shimmy, spin back.
  const turnShake = useCallback((): Animated.CompositeAnimation => {
    let stopped = false;
    const half = (cb: () => void) =>
      timing(rootRotY, 1, 150, Easing.in(Easing.quad)).start(({ finished }) => {
        if (!finished || stopped) return;
        rootRotY.setValue(0);
        cb();
      });
    const shimmy = (dir: number) => timing(bodyRot, 5.5 * dir, 110, Easing.inOut(Easing.sin));
    return {
      start: (done?: (r: { finished: boolean }) => void) => {
        const finish = () => done?.({ finished: !stopped });
        Animated.sequence([
          Animated.parallel([timing(rootSY, 0.94, 150), timing(rootSX, 1.05, 150)]),
          Animated.parallel([timing(rootSY, 1, 120), timing(rootSX, 1, 120)]),
        ]).start(({ finished }) => {
          if (!finished || stopped) return finish();
          setFacing('back');
          half(() => {
            Animated.sequence([shimmy(1), shimmy(-1), shimmy(1), shimmy(-1), spring(bodyRot, 0, SOFT)])
              .start(({ finished: f2 }) => {
                if (!f2 || stopped) return finish();
                setFacing('front');
                half(finish);
              });
          });
        });
      },
      stop: () => { stopped = true; },
      reset: () => {},
    } as Animated.CompositeAnimation;
  }, [bodyRot, rootRotY, rootSX, rootSY]);

  const POOLS: Record<Mood, Array<() => Animated.CompositeAnimation>> = {
    sleepy: [drowsyTip],
    excited: [turnShake, hop, sway],
    happy: [waveGiggle, sway, hop],
    content: [sway, waveGiggle],
    worried: [sway],
    celebrating: [],
  };
  const CADENCE: Record<Mood, [number, number]> = {
    sleepy: [6000, 10000], excited: [3500, 6000], happy: [5000, 9000],
    content: [5500, 9500], worried: [6000, 10000], celebrating: [1e9, 1e9],
  };

  // ---------- idle scheduler ----------
  useEffect(() => {
    if (busy || !enabledExternally) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let running: Animated.CompositeAnimation | null = null;
    const pool = POOLS[mood];
    const [min, max] = CADENCE[mood];
    const schedule = () => {
      const delay = min + Math.random() * (max - min);
      timer = setTimeout(() => {
        if (cancelled || pool.length === 0) return;
        running = pool[Math.floor(Math.random() * pool.length)]();
        running.start(() => { if (!cancelled) schedule(); });
      }, delay);
    };
    schedule();
    return () => { cancelled = true; clearTimeout(timer); running?.stop?.(); resetGesture(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, busy, enabledExternally]);

  // ---------- celebration ----------
  const celebrate = useCallback(() => {
    setCelebrating(true);
    resetGesture();
    Animated.sequence([
      Animated.parallel([
        timing(rootSY, 1.14, 160, Easing.out(Easing.quad)),
        timing(rootSX, 0.9, 160, Easing.out(Easing.quad)),
        timing(rootTY, -20, 160, Easing.out(Easing.quad)),
      ]),
      Animated.parallel([timing(rootSY, 0.94, 140), timing(rootSX, 1.06, 140), timing(rootTY, 0, 140)]),
      Animated.parallel([spring(rootSY, 1.05, SOFT), spring(rootSX, 0.97, SOFT)]),
      Animated.parallel([spring(rootSY, 0.98, SOFT), spring(rootSX, 1.02, SOFT)]),
      Animated.parallel([spring(rootSY, 1, SOFT), spring(rootSX, 1, SOFT)]),
    ]).start(() => setCelebrating(false));
  }, [rootSX, rootSY, rootTY, resetGesture]);

  return { breath, bodyRot, rootTY, rootSX, rootSY, rootRotY, headRot, facing, shownMood, armPose, celebrate };
}
