import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '../../theme/colors';

interface SafariLoaderProps {
  text?: string;
}

export function SafariLoader({ text = 'Loading your safari...' }: SafariLoaderProps) {
  const bounceAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.8)).current;

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();

    // Bounce the emoji
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -14, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0,   duration: 400, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
        Animated.delay(200),
      ])
    ).start();

    // Dot animation
    const dotAnim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );

    dotAnim(dot1, 0).start();
    dotAnim(dot2, 200).start();
    dotAnim(dot3, 400).start();
  }, []);

  const dotStyle = (dot: Animated.Value) => ({
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.1] }) }],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <Animated.Text style={[styles.emoji, { transform: [{ translateY: bounceAnim }] }]}>
          🦁
        </Animated.Text>

        <Text style={styles.text}>{text}</Text>

        {/* Animated dots */}
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, dotStyle(dot)]} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  emoji:     { fontSize: 72, marginBottom: 24 },
  text:      { color: Colors.gray[500], fontSize: 15, marginBottom: 16 },
  dotsRow:   { flexDirection: 'row', gap: 8 },
  dot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
});
