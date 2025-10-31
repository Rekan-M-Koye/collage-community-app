import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useAppSettingsSafe } from '../context/AppSettingsContext';

const { width, height } = Dimensions.get('window');

const AnimatedBackground = ({ particleCount = 35 }) => {
  const context = useAppSettingsSafe();
  const isDarkMode = context?.isDarkMode || false;
  const particles = useRef(
    Array.from({ length: particleCount }, (i) => {
      const startX = Math.random() * width;
      const startY = -50 - Math.random() * 100;
      return {
        translateX: useRef(new Animated.Value(startX)).current,
        translateY: useRef(new Animated.Value(startY)).current,
        opacity: useRef(new Animated.Value(Math.random() * 0.4 + 0.2)).current,
      };
    })
  ).current;

  useEffect(() => {
    const animations = particles.map((particle, index) => {
      const duration = 25000 + Math.random() * 15000;
      const delay = index * 300;
      const currentStartX = particle.translateX._value;
      const endX = currentStartX + (width * 0.3);
      
      const moveAnimation = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(particle.translateX, {
            toValue: endX,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateX, {
            toValue: currentStartX,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: -50 - Math.random() * 100,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

      const moveYAnimation = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(particle.translateY, {
            toValue: height + 100,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );

      const opacityAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.3 + 0.4,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.2 + 0.1,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ])
      );

      moveAnimation.start();
      moveYAnimation.start();
      opacityAnimation.start();

      return { moveAnimation, moveYAnimation, opacityAnimation };
    });

    return () => {
      animations.forEach(({ moveAnimation, moveYAnimation, opacityAnimation }) => {
        moveAnimation.stop();
        moveYAnimation.stop();
        opacityAnimation.stop();
      });
    };
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
              ],
              opacity: particle.opacity,
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 122, 255, 0.3)',
              shadowColor: isDarkMode ? '#fff' : '#007AFF',
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
});

export default AnimatedBackground;
