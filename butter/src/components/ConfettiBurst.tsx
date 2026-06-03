import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Easing, Platform } from 'react-native';

// A contained confetti pop around the mascot. ~22 particles spawn at the centre,
// arc outward + up, spin, then fall with gravity and fade. Built-in Animated
// (useNativeDriver:false for web). Renders only while `playKey` is truthy and a
// burst is in flight; self-clears after the animation.

type Props = {
  playKey: number; // bump to trigger a burst; 0 = idle
  size?: number;   // diameter of the burst area
};

const COLORS = ['#F5C45E', '#F4A6A0', '#A8D8C8', '#E8A87C', '#ECB13F', '#C4A8D8'];
const COUNT = 22;

type Particle = {
  angle: number;
  dist: number;
  rise: number;
  color: string;
  shape: 'rect' | 'circle';
  rot: number;
  delay: number;
  size: number;
};

function makeParticles(): Particle[] {
  return Array.from({ length: COUNT }, () => {
    const angle = Math.random() * Math.PI * 2;
    return {
      angle,
      dist: 60 + Math.random() * 60,
      rise: 30 + Math.random() * 50,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() < 0.5 ? 'rect' : 'circle',
      rot: (Math.random() - 0.5) * 720,
      delay: Math.random() * 80,
      size: 7 + Math.random() * 5,
    };
  });
}

function Piece({ p, progress, center }: { p: Particle; progress: Animated.Value; center: number }) {
  // x drifts outward; y goes up then falls (gravity) via a custom interpolation.
  const dx = Math.cos(p.angle) * p.dist;
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const translateY = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, -p.rise, p.dist * 0.6], // up, then fall below origin
  });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] });
  const opacity = progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: center,
        top: center,
        width: p.size,
        height: p.shape === 'rect' ? p.size * 0.6 : p.size,
        backgroundColor: p.color,
        borderRadius: p.shape === 'circle' ? p.size : 2,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate }],
      }}
    />
  );
}

export default function ConfettiBurst({ playKey, size = 220 }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const particlesRef = useRef<Particle[]>(makeParticles());
  const [visible, setVisible] = React.useState(false);

  useEffect(() => {
    if (!playKey) return;
    particlesRef.current = makeParticles();
    setVisible(true);
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 1300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (finished) setVisible(false);
    });
  }, [playKey, progress]);

  if (!visible) return null;
  const center = size / 2;

  return (
    <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
      {particlesRef.current.map((p, i) => (
        <Piece key={i} p={p} progress={progress} center={center} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
