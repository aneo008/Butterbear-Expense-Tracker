import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Easing, Platform } from 'react-native';

// A few 🪙 arc from the mascot up toward the header coin counter, then fade.
// Purely decorative; the actual coin total updates via the store. Fires on every
// log (the small, always-on reward). `from`/`to` are screen coords.

type Props = {
  playKey: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  count?: number;
};

function Coin({ progress, from, to, delay }: { progress: Animated.Value; from: { x: number; y: number }; to: { x: number; y: number }; delay: number }) {
  // arc: x lerps straight; y lerps with an upward bow.
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [from.x, to.x] });
  const midY = Math.min(from.y, to.y) - 40;
  const translateY = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [from.y, midY, to.y] });
  const opacity = progress.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const scale = progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.4, 1, 0.7] });

  return (
    <Animated.View style={[styles.coin, { opacity, transform: [{ translateX }, { translateY }, { scale }] }]}>
      <Text style={styles.coinText}>🪙</Text>
    </Animated.View>
  );
}

export default function CoinFly({ playKey, from, to, count = 3 }: Props) {
  const progresses = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;
  const [visible, setVisible] = React.useState(false);

  useEffect(() => {
    if (!playKey) return;
    setVisible(true);
    const anims = progresses.map((p, i) => {
      p.setValue(0);
      return Animated.timing(p, {
        toValue: 1,
        duration: 700,
        delay: i * 90,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      });
    });
    Animated.parallel(anims).start(({ finished }) => {
      if (finished) setVisible(false);
    });
  }, [playKey, progresses]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {progresses.map((p, i) => (
        <Coin key={i} progress={p} from={from} to={to} delay={i * 90} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  coin: { position: 'absolute', left: 0, top: 0 },
  coinText: { fontSize: 22 },
});
