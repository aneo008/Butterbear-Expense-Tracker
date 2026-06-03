import React, { useImperativeHandle, forwardRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Mood, getLayers, PIVOTS, VIEWBOX } from '../constants/mascotLayers';
import { useMascotAnimation } from '../lib/useMascotAnimation';

export type MascotHandle = { celebrate: () => void };

type Props = { mood: Mood; size?: number };

// Hybrid Butter. The whole bear shares hop (translateY) + squash/stretch + spin.
// The TORSO+HEAD+ARMS lean above the hip while the FEET stay planted (separate
// layer with no lean). Arms are drawn pose frames (no rotation = no detach).
const Mascot = forwardRef<MascotHandle, Props>(({ mood, size = 200 }, ref) => {
  const a = useMascotAnimation(mood);
  useImperativeHandle(ref, () => ({ celebrate: a.celebrate }), [a.celebrate]);

  const width = size;
  const height = size * (VIEWBOX.h / VIEWBOX.w);
  const sx = width / VIEWBOX.w;
  const sy = height / VIEWBOX.h;
  const layers = getLayers(a.shownMood, a.facing, a.armPose);

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
        <SvgXml xml={layers.feet} width="100%" height="100%" />
      </View>

      {/* lean group: arms, body, head */}
      <Animated.View style={[layer, leanTransform]}>
        <View style={layer}>
          <SvgXml xml={layers.leftArm} width="100%" height="100%" />
        </View>
        <View style={layer}>
          <SvgXml xml={layers.rightArm} width="100%" height="100%" />
        </View>
        <View style={layer}>
          <SvgXml xml={layers.body} width="100%" height="100%" />
        </View>
        {/* head leans a touch more than the torso (drag) */}
        <Animated.View
          style={[layer, { transformOrigin: `${neck.x}px ${neck.y}px`, transform: [{ rotateZ: headRotDeg as unknown as string }] }]}
        >
          <SvgXml xml={layers.head} width="100%" height="100%" />
        </Animated.View>
      </Animated.View>

      {/* decor never deforms */}
      <View style={layer} pointerEvents="none">
        <SvgXml xml={layers.decor} width="100%" height="100%" />
      </View>
    </Animated.View>
  );
});

Mascot.displayName = 'Mascot';
export default Mascot;
