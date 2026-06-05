import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, Platform, TextStyle, StyleProp } from 'react-native';

// Single-line text that gently ping-pongs side-to-side ONLY when it's too wide to
// fit, so a long item name stays fully readable. When it fits, it's a plain
// static single-line label. Built-in Animated (useNativeDriver:false), web-safe.
//
// Overflow is measured off an invisible, clamped copy: on web its DOM node
// reports scrollWidth (full text) vs clientWidth (visible) reliably — absolutely
// positioned RN text gets clamped to its container, so we can't measure that way.
// The visible copy is sized to the full width (no ellipsis) and translated.
// Native gracefully degrades to a clamped single line (real names never overflow
// now that the name owns its own row).

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  speed?: number; // px per second of travel
};

export default function MarqueeText({ text, style, speed = 28 }: Props) {
  const measureRef = useRef<Text>(null);
  const [natural, setNatural] = useState(0);
  const [container, setContainer] = useState(0);
  const tx = useRef(new Animated.Value(0)).current;

  const distance = Math.max(0, natural - container);
  const animating = distance > 1;

  const measure = () => {
    const node = measureRef.current as unknown as { scrollWidth?: number; clientWidth?: number } | null;
    if (Platform.OS === 'web' && node && node.scrollWidth != null) {
      setNatural(node.scrollWidth);
      setContainer(node.clientWidth ?? 0);
    }
  };

  useEffect(() => { measure(); }, [text]);

  useEffect(() => {
    tx.stopAnimation();
    tx.setValue(0);
    if (!animating) return;

    const travelMs = Math.max(600, (distance / speed) * 1000);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),                                                          // pause at the start
        Animated.timing(tx, { toValue: -distance, duration: travelMs, useNativeDriver: false }),
        Animated.delay(900),                                                          // pause at the end
        Animated.timing(tx, { toValue: 0, duration: travelMs, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animating, distance, speed, tx]);

  return (
    <View style={styles.clip}>
      {/* invisible clamped copy — gives the row its height + reliable measurement */}
      <Text ref={measureRef} numberOfLines={1} onLayout={measure} style={[style, styles.measure]}>{text}</Text>
      {/* visible copy — absolute; when overflowing it's sized to full width and slides */}
      <Animated.Text
        numberOfLines={1}
        style={[
          style,
          styles.floating,
          animating ? { width: natural, transform: [{ translateX: tx }] } : null,
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', alignSelf: 'stretch' },
  measure: { opacity: 0 },
  floating: { position: 'absolute', left: 0, top: 0 },
});
