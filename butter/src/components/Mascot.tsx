import React, { useImperativeHandle, forwardRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Mood, getLayers, PIVOTS, VIEWBOX } from '../constants/mascotLayers';
import { useMascotAnimation } from '../lib/useMascotAnimation';

export type MascotHandle = { celebrate: () => void };

type Props = { mood: Mood; size?: number };

// Layered, jointed Butter. A root transform moves the whole bear together (so
// nothing detaches), while the head and right arm add their own pivoted rotation
// on top for overlapping action (drag) and the wave. Spring-based motion gives
// soft overshoot/settle; hops use volume-preserving squash & stretch.
const Mascot = forwardRef<MascotHandle, Props>(({ mood, size = 200 }, ref) => {
  const a = useMascotAnimation(mood);
  useImperativeHandle(ref, () => ({ celebrate: a.celebrate }), [a.celebrate]);

  const width = size;
  const height = size * (VIEWBOX.h / VIEWBOX.w);
  const sx = width / VIEWBOX.w; // viewBox px -> screen px
  const sy = height / VIEWBOX.h;
  const layers = getLayers(a.shownMood, a.facing);

  // Breathing: subtle scale + rise, plus a soft belly squash so it isn't rigid.
  const breathSY = a.breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
  const breathSX = a.breath.interpolate({ inputRange: [0, 1], outputRange: [1, 0.992] });
  const breathTY = a.breath.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  const rootRotDeg = a.rootRot.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] });
  // Spin: rootRotY 0->1 collapses width to 0 (edge-on), art swaps, opens back up.
  const spinSX = a.rootRotY.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const headRotDeg = a.headRot.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] });
  const armRotDeg = a.armRRot.interpolate({ inputRange: [-90, 90], outputRange: ['-90deg', '90deg'] });

  // Pivot origins in screen px (transformOrigin is relative to the view box).
  const feet = { x: PIVOTS.feet.x * sx, y: PIVOTS.feet.y * sy };
  const neck = { x: PIVOTS.neck.x * sx, y: PIVOTS.neck.y * sy };
  const rShoulder = { x: PIVOTS.rightShoulder.x * sx, y: PIVOTS.rightShoulder.y * sy };

  const layerStyle = StyleSheet.absoluteFillObject;

  return (
    <Animated.View
      style={{
        width,
        height,
        transformOrigin: `${feet.x}px ${feet.y}px`,
        transform: [
          { translateY: breathTY },
          { translateY: a.rootTY },
          { rotateZ: rootRotDeg },
          { scaleX: Animated.multiply(Animated.multiply(a.rootSX, breathSX), spinSX) },
          { scaleY: Animated.multiply(a.rootSY, breathSY) },
        ],
      }}
    >
      {/* body (back-most) */}
      <View style={layerStyle}>
        <SvgXml xml={layers.body} width="100%" height="100%" />
      </View>

      {/* left arm */}
      <View style={layerStyle}>
        <SvgXml xml={layers.leftArm} width="100%" height="100%" />
      </View>

      {/* right arm — pivots at the shoulder for the wave */}
      <Animated.View
        style={[layerStyle, { transformOrigin: `${rShoulder.x}px ${rShoulder.y}px`, transform: [{ rotateZ: armRotDeg }] }]}
      >
        <SvgXml xml={layers.rightArm} width="100%" height="100%" />
      </Animated.View>

      {/* head — pivots at the neck, lags the body for drag/overlap */}
      <Animated.View
        style={[layerStyle, { transformOrigin: `${neck.x}px ${neck.y}px`, transform: [{ rotateZ: headRotDeg }] }]}
      >
        <SvgXml xml={layers.head} width="100%" height="100%" />
      </Animated.View>

      {/* decor (Zzz / sparkles / confetti) — never deforms with the body */}
      <View style={layerStyle} pointerEvents="none">
        <SvgXml xml={layers.decor} width="100%" height="100%" />
      </View>
    </Animated.View>
  );
});

Mascot.displayName = 'Mascot';
export default Mascot;
