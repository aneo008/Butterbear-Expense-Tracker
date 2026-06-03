import React, { useImperativeHandle, forwardRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Mood, getLayers, PIVOTS, VIEWBOX } from '../constants/mascotLayers';
import { EquippedMap } from '../constants/storeItems';
import { useMascotAnimation } from '../lib/useMascotAnimation';

export type MascotHandle = { celebrate: (big?: boolean) => void };

const EMPTY: EquippedMap = {};

type Props = {
  mood: Mood;
  size?: number;
  equipped?: EquippedMap;       // currently-worn cosmetics
  facingOverride?: 'front' | 'back'; // changing-room rotate control
};

// Hybrid Butter. The whole bear shares hop (translateY) + squash/stretch + spin.
// The TORSO+HEAD+ARMS lean above the hip while the FEET stay planted (separate
// layer with no lean). Arms are drawn pose frames (no rotation = no detach).
// Equipped items render as overlay layers: body garment under the arms (paws
// poke out), head/neck items over the head.
const Mascot = forwardRef<MascotHandle, Props>(({ mood, size = 200, equipped, facingOverride }, ref) => {
  const a = useMascotAnimation(mood);
  useImperativeHandle(ref, () => ({ celebrate: a.celebrate }), [a.celebrate]);

  const equip = equipped ?? EMPTY;
  const facing = facingOverride ?? a.facing;

  const width = size;
  const height = size * (VIEWBOX.h / VIEWBOX.w);
  const sx = width / VIEWBOX.w;
  const sy = height / VIEWBOX.h;
  const layers = getLayers(a.shownMood, facing, a.armPose, a.bodyPose, equip);
  // Per-layer keys so each SvgXml remounts only when ITS art changes (SvgXml
  // memoizes parsed xml and won't re-parse a changed string prop on its own).
  const feetKey = `feet-${facing}-${a.bodyPose}`;
  const armKey = `${facing}-${a.armPose}`;
  const headKey = `head-${a.shownMood}-${facing}-${equip.head ?? ''}-${equip.face ?? ''}`;
  const bodyKey = `body-${facing}`;
  const bodyItemKey = `bi-${facing}-${equip.body ?? ''}`;
  const neckKey = `neck-${facing}-${equip.neck ?? ''}`;
  const headItemKey = `hi-${facing}-${equip.head ?? ''}`;
  const heldKey = `held-${facing}-${equip.held ?? ''}`;
  const decorKey = `decor-${a.shownMood}-${facing}`;

  const breathSY = a.breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
  const breathSX = a.breath.interpolate({ inputRange: [0, 1], outputRange: [1, 0.992] });
  const breathTY = a.breath.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  const bodyRotDeg = a.bodyRot.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] });
  const headRotDeg = a.headRot.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] });
  const spinSX = a.rootRotY.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  // pivots in screen px
  const hip = { x: PIVOTS.hip.x * sx, y: PIVOTS.hip.y * sy };
  const neck = { x: PIVOTS.neck.x * sx, y: PIVOTS.neck.y * sy };

  const layer = StyleSheet.absoluteFillObject;

  // Root: hop + squash/stretch + spin (everything, incl. feet, shares this).
  const rootTransform = {
    transformOrigin: `${PIVOTS.feet.x * sx}px ${PIVOTS.feet.y * sy}px`,
    transform: [
      { translateY: breathTY as unknown as number },
      { translateY: a.rootTY as unknown as number },
      { scaleX: Animated.multiply(Animated.multiply(a.rootSX, breathSX), spinSX) as unknown as number },
      { scaleY: Animated.multiply(a.rootSY, breathSY) as unknown as number },
    ],
  };

  // Lean group: torso + arms + head bend above the hip. Feet are OUTSIDE this.
  const leanTransform = {
    transformOrigin: `${hip.x}px ${hip.y}px`,
    transform: [{ rotateZ: bodyRotDeg as unknown as string }],
  };

  return (
    <Animated.View style={[{ width, height }, rootTransform]}>
      {/* planted feet — share root motion but NOT the lean */}
      <View style={layer}>
        <SvgXml key={feetKey} xml={layers.feet} width="100%" height="100%" />
      </View>

      {/* lean group: body, garment, arms, head, items */}
      <Animated.View style={[layer, leanTransform]}>
        {/* base torso */}
        <View style={layer}>
          <SvgXml key={bodyKey} xml={layers.body} width="100%" height="100%" />
        </View>
        {/* body garment: over torso, UNDER the arms (paws poke out) */}
        <View style={layer}>
          <SvgXml key={bodyItemKey} xml={layers.bodyItem} width="100%" height="100%" />
        </View>
        {/* arms in front of the garment */}
        <View style={layer}>
          <SvgXml key={`la-${armKey}`} xml={layers.leftArm} width="100%" height="100%" />
        </View>
        <View style={layer}>
          <SvgXml key={`ra-${armKey}`} xml={layers.rightArm} width="100%" height="100%" />
        </View>
        {/* held item near the paw */}
        <View style={layer} pointerEvents="none">
          <SvgXml key={heldKey} xml={layers.held} width="100%" height="100%" />
        </View>
        {/* neck item sits over the body/head junction */}
        <View style={layer}>
          <SvgXml key={neckKey} xml={layers.neckItem} width="100%" height="100%" />
        </View>
        {/* head leans a touch more than the torso (drag); head items ride with it */}
        <Animated.View
          style={[layer, { transformOrigin: `${neck.x}px ${neck.y}px`, transform: [{ rotateZ: headRotDeg as unknown as string }] }]}
        >
          <SvgXml key={headKey} xml={layers.head} width="100%" height="100%" />
          <View style={layer}>
            <SvgXml key={headItemKey} xml={layers.headItem} width="100%" height="100%" />
          </View>
        </Animated.View>
      </Animated.View>

      {/* decor never deforms */}
      <View style={layer} pointerEvents="none">
        <SvgXml key={decorKey} xml={layers.decor} width="100%" height="100%" />
      </View>
    </Animated.View>
  );
});

Mascot.displayName = 'Mascot';
export default Mascot;
