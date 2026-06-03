import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { Mood, Facing } from '../constants/mascotLayers';

// Built-in Animated only. useNativeDriver MUST be false: web requires it, and we
// can't mix native/non-native drivers on one value. Spring gives the
// overshoot-and-settle that makes motion feel alive instead of mechanical.
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
  // raw animated values consumed by the component's layer transforms
  breath: Animated.Value;
  rootRot: Animated.Value;   // degrees, body lean (pivot: feet)
  rootTY: Animated.Value;    // px, hop / dip
  rootSX: Animated.Value;    // scaleX (squash/stretch)
  rootSY: Animated.Value;    // scaleY
  rootRotY: Animated.Value;  // 0..1 turn progress (drives scaleX flip for spin)
  headRot: Animated.Value;   // degrees, head (pivot: neck) — lags body for drag
  armRRot: Animated.Value;   // degrees, right arm (pivot: shoulder) — wave
  facing: Facing;            // front/back, swapped mid-spin
  shownMood: Mood;           // may differ from prop during celebration
  celebrate: () => void;
};

export function useMascotAnimation(mood: Mood, enabledExternally = true): MascotAnim {
  const breath = useRef(new Animated.Value(0)).current;
  const rootRot = useRef(new Animated.Value(0)).current;
  const rootTY = useRef(new Animated.Value(0)).current;
  const rootSX = useRef(new Animated.Value(1)).current;
  const rootSY = useRef(new Animated.Value(1)).current;
  const rootRotY = useRef(new Animated.Value(0)).current;
  const headRot = useRef(new Animated.Value(0)).current;
  const armRRot = useRef(new Animated.Value(0)).current;

  const [facing, setFacing] = useState<Facing>('front');
  const [celebrating, setCelebrating] = useState(false);
  const busy = celebrating; // pause idle while a big action plays
  const shownMood: Mood = celebrating ? 'celebrating' : mood;

  // ---------- breathing (always on; speed by mood) ----------
  useEffect(() => {
    const dur = mood === 'excited' ? 1500 : mood === 'sleepy' ? 2900 : 2200;
    const loop = Animated.loop(
      Animated.sequence([timing(breath, 1, dur), timing(breath, 0, dur)])
    );
    loop.start();
    return () => loop.stop();
  }, [mood, breath]);

  const resetGesture = useCallback(() => {
    rootRot.stopAnimation(); rootTY.stopAnimation(); rootSX.stopAnimation();
    rootSY.stopAnimation(); headRot.stopAnimation(); armRRot.stopAnimation();
    rootRotY.stopAnimation();
    rootRot.setValue(0); rootTY.setValue(0); rootSX.setValue(1);
    rootSY.setValue(1); headRot.setValue(0); armRRot.setValue(0); rootRotY.setValue(0);
    setFacing('front');
  }, [rootRot, rootTY, rootSX, rootSY, headRot, armRRot, rootRotY]);

  // ---------- flourishes (each returns a CompositeAnimation) ----------

  // Sleepy drowsy tip: body leans (slow), head DRAGS behind then catches up
  // (overlapping action), small overshoot, settle.
  const drowsyTip = useCallback(() => {
    const dir = Math.random() < 0.5 ? 1 : -1;
    return Animated.parallel([
      Animated.sequence([
        timing(rootRot, 13 * dir, 1400, Easing.out(Easing.quad)),
        spring(rootRot, 0, SOFT_SLOW),
      ]),
      Animated.sequence([
        // head lags: starts later, leans further (drag), then settles after body
        Animated.delay(180),
        timing(headRot, 7 * dir, 1300, Easing.out(Easing.quad)),
        spring(headRot, 0, { stiffness: 50, damping: 11, mass: 1, useNativeDriver: false }),
      ]),
    ]);
  }, [rootRot, headRot]);

  // Hop with anticipation + squash/stretch (volume preserved: SX up when SY down).
  const hop = useCallback(() => {
    return Animated.sequence([
      // anticipation: dip + squash
      Animated.parallel([
        timing(rootSY, 0.9, 160), timing(rootSX, 1.08, 160), timing(rootTY, 6, 160),
      ]),
      // launch: stretch up
      Animated.parallel([
        timing(rootSY, 1.12, 150, Easing.out(Easing.quad)),
        timing(rootSX, 0.92, 150, Easing.out(Easing.quad)),
        timing(rootTY, -22, 150, Easing.out(Easing.quad)),
      ]),
      // land: squash
      Animated.parallel([
        timing(rootSY, 0.92, 130, Easing.in(Easing.quad)),
        timing(rootSX, 1.07, 130, Easing.in(Easing.quad)),
        timing(rootTY, 4, 130, Easing.in(Easing.quad)),
      ]),
      // settle (spring back to neutral — overshoot/settle)
      Animated.parallel([spring(rootSY, 1), spring(rootSX, 1), spring(rootTY, 0)]),
    ]);
  }, [rootSX, rootSY, rootTY]);

  // Gentle sway with head drag.
  const sway = useCallback(() => {
    const dir = Math.random() < 0.5 ? 1 : -1;
    return Animated.parallel([
      Animated.sequence([spring(rootRot, 5 * dir, SOFT), spring(rootRot, 0, SOFT)]),
      Animated.sequence([Animated.delay(120), spring(headRot, 3 * dir, SOFT), spring(headRot, 0, SOFT)]),
    ]);
  }, [rootRot, headRot]);

  // Happy "wave then giggle": right arm raises (anticipation pull-back first),
  // waves a few times in an arc at the shoulder, then a whole-body giggle.
  const waveGiggle = useCallback(() => {
    return Animated.sequence([
      // anticipation: arm pulls slightly inward
      timing(armRRot, 8, 150, Easing.out(Easing.quad)),
      // raise + wave (arc rotations at the shoulder)
      timing(armRRot, -40, 220, Easing.out(Easing.quad)),
      timing(armRRot, -18, 180, Easing.inOut(Easing.sin)),
      timing(armRRot, -40, 180, Easing.inOut(Easing.sin)),
      timing(armRRot, -18, 180, Easing.inOut(Easing.sin)),
      spring(armRRot, 0, SOFT),
      // giggle: two soft body bobs (squash/stretch, volume kept)
      Animated.parallel([spring(rootSY, 1.05, SOFT), spring(rootSX, 0.97, SOFT)]),
      Animated.parallel([spring(rootSY, 0.98, SOFT), spring(rootSX, 1.02, SOFT)]),
      Animated.parallel([spring(rootSY, 1, SOFT), spring(rootSX, 1, SOFT)]),
    ]);
  }, [armRRot, rootSX, rootSY]);

  // Excited "turn around & shake bumbun". Orchestrated manually (not one
  // CompositeAnimation) so we can flip the art exactly when the bear is edge-on
  // (rootRotY at its peak = scaleX 0). Returns a {start,stop} that the scheduler
  // drives like any animation. rootRotY 0->1 maps to scaleX 1->0 in the view, so
  // a half-turn hides width; we swap facing at that instant, then open back up.
  const turnShake = useCallback((): Animated.CompositeAnimation => {
    let stopped = false;
    const half = (cb: () => void) =>
      timing(rootRotY, 1, 150, Easing.in(Easing.quad)).start(({ finished }) => {
        if (!finished || stopped) return;
        rootRotY.setValue(0); // now edge-on -> fully open with swapped art
        cb();
      });
    const shimmy = (dir: number) => timing(rootRot, 6.5 * dir, 110, Easing.inOut(Easing.sin));
    return {
      start: (done?: (r: { finished: boolean }) => void) => {
        const finish = () => done?.({ finished: !stopped });
        // anticipation
        Animated.sequence([
          Animated.parallel([timing(rootSY, 0.94, 150), timing(rootSX, 1.05, 150)]),
          Animated.parallel([timing(rootSY, 1, 120), timing(rootSX, 1, 120)]),
        ]).start(({ finished }) => {
          if (!finished || stopped) return finish();
          setFacing('back');
          half(() => {
            // hip shimmy showing the back
            Animated.sequence([shimmy(1), shimmy(-1), shimmy(1), shimmy(-1), spring(rootRot, 0, SOFT)])
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
  }, [rootRot, rootRotY, rootSX, rootSY]);

  const POOLS: Record<Mood, Array<() => Animated.CompositeAnimation>> = {
    sleepy: [drowsyTip],
    excited: [turnShake, hop, sway],
    happy: [waveGiggle, sway, hop],
    content: [sway],
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

  // ---------- celebration (imperative) ----------
  const celebrate = useCallback(() => {
    setCelebrating(true);
    resetGesture();
    // happy hop + a little giggle (double squash) then settle
    Animated.sequence([
      Animated.parallel([
        timing(rootSY, 1.14, 160, Easing.out(Easing.quad)),
        timing(rootSX, 0.9, 160, Easing.out(Easing.quad)),
        timing(rootTY, -20, 160, Easing.out(Easing.quad)),
      ]),
      Animated.parallel([
        timing(rootSY, 0.94, 140), timing(rootSX, 1.06, 140), timing(rootTY, 0, 140),
      ]),
      // giggle: two soft bobs
      Animated.parallel([spring(rootSY, 1.05, SOFT), spring(rootSX, 0.97, SOFT)]),
      Animated.parallel([spring(rootSY, 0.98, SOFT), spring(rootSX, 1.02, SOFT)]),
      Animated.parallel([spring(rootSY, 1, SOFT), spring(rootSX, 1, SOFT)]),
    ]).start(() => setCelebrating(false));
  }, [rootSX, rootSY, rootTY, resetGesture]);

  return { breath, rootRot, rootTY, rootSX, rootSY, rootRotY, headRot, armRRot, facing, shownMood, celebrate };
}
