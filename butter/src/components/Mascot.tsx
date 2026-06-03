import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Animated, View, StyleSheet, Easing, Platform } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { MASCOT_SVGS, Mood } from '../constants/mascotSvgs';
import { useMascotIdle } from '../lib/useMascotIdle';

const NO_NATIVE = { useNativeDriver: false };

export type MascotHandle = {
  celebrate: () => void;
};

type Props = {
  mood: Mood;
  size?: number;
};

// Butter the bear. Renders the current mood SVG, runs the idle animation system
// (breathing + mood-flavored flourishes via useMascotIdle), and can play a
// one-shot celebration burst on demand (celebrating pose + pop, then settle).
const Mascot = forwardRef<MascotHandle, Props>(({ mood, size = 200 }, ref) => {
  const [celebrating, setCelebrating] = useState(false);
  const pop = useRef(new Animated.Value(0)).current;

  // Idle pauses while the celebration plays.
  const idle = useMascotIdle(mood, !celebrating);

  const celebrate = useCallback(() => {
    setCelebrating(true);
    pop.setValue(0);
    Animated.sequence([
      Animated.timing(pop, { toValue: 1, duration: 220, easing: Easing.out(Easing.back(2)), ...NO_NATIVE }),
      Animated.delay(900),
      Animated.timing(pop, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), ...NO_NATIVE }),
    ]).start(() => setCelebrating(false));
  }, [pop]);

  useImperativeHandle(ref, () => ({ celebrate }), [celebrate]);

  const shown: Mood = celebrating ? 'celebrating' : mood;
  const height = size * (260 / 240);

  // Pop scale during celebration (a little bounce up to 1.12).
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  // Foot-anchored rotation: translate the pivot to the base, rotate, translate
  // back — so flourishes tip the bear from his feet, not spin around center.
  const halfH = height / 2;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          transform: [
            { translateY: idle.breathTransY },
            { translateY: idle.transY },
            { scaleY: idle.breathScaleY },
            { scale: popScale },
            // foot-anchored rotate
            { translateY: halfH },
            { rotateZ: idle.rotZDeg },
            { translateY: -halfH },
          ],
        },
      ]}
    >
      <View style={{ width: size, height }}>
        <SvgXml xml={MASCOT_SVGS[shown]} width="100%" height="100%" />
      </View>
    </Animated.View>
  );
});

Mascot.displayName = 'Mascot';
export default Mascot;

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
