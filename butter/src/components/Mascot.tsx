import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Easing, Platform } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { MASCOT_SVGS, Mood } from '../constants/mascotSvgs';

type Props = {
  mood: Mood;
  size?: number;
};

// Butter the bear. Renders the mood SVG and runs a gentle, always-on breathing
// loop (subtle vertical scale) using the built-in Animated API — identical on
// web and native, no worklets/babel config.
export default function Mascot({ mood, size = 200 }: Props) {
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  const scaleY = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  const translateY = breath.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  const height = size * (260 / 240);

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scaleY }, { translateY }] }]}>
      <View style={{ width: size, height }}>
        <SvgXml xml={MASCOT_SVGS[mood]} width="100%" height="100%" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
