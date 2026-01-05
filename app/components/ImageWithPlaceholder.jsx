import React, { useState, useRef, useEffect } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import { useAppSettings } from '../context/AppSettingsContext';

const ImageWithPlaceholder = ({ 
  source, 
  style, 
  resizeMode = 'cover',
  ...props 
}) => {
  const { isDarkMode } = useAppSettings();
  const [isLoading, setIsLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isLoading, pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const placeholderColor = isDarkMode 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.08)';

  return (
    <View style={style}>
      {isLoading && (
        <Animated.View 
          style={[
            StyleSheet.absoluteFill, 
            styles.placeholder,
            { backgroundColor: placeholderColor, opacity }
          ]} 
        />
      )}
      <Image
        source={source}
        style={[style, styles.image]}
        resizeMode={resizeMode}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default ImageWithPlaceholder;
