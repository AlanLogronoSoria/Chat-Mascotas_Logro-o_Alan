import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../src/shared/design/theme';
import { Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

interface ParticleMetadata {
  id: number;
  x: number;
  startY: number;
  endY: number;
  size: number;
  delay: number;
  color: string;
}

interface ParticleItemProps {
  progress: Animated.SharedValue<number>;
  metadata: ParticleMetadata;
}

// Particle rendering component to adhere to hook rules
function ParticleItem({ progress, metadata }: ParticleItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    // Current progress offset by delay (0.0 - 1.0 cycle)
    const p = (progress.value + metadata.delay) % 1.0;
    
    // Position translation
    const currentY = metadata.startY - (metadata.startY - metadata.endY) * p;
    
    // Opacity fade in / out
    let opacity = 0;
    if (p < 0.15) {
      opacity = p / 0.15;
    } else if (p > 0.75) {
      opacity = (1.0 - p) / 0.25;
    } else {
      opacity = 1.0;
    }

    return {
      opacity: opacity,
      transform: [{ translateY: currentY - metadata.startY }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: metadata.x,
          top: metadata.startY,
          width: metadata.size,
          height: metadata.size,
          borderRadius: metadata.size / 2,
          backgroundColor: metadata.color,
          shadowColor: metadata.color,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);
  const progressClock = useSharedValue(0);

  // Generate particle metadata once
  const particles = useMemo<ParticleMetadata[]>(() => {
    return Array.from({ length: 12 }).map((_, index) => ({
      id: index,
      x: Math.random() * width,
      startY: height + 20,
      endY: Math.random() * (height * 0.2),
      size: Math.random() * 6 + 4,
      delay: index * 0.08, // Spread delay
      color: index % 2 === 0 ? colors.neonBlue : colors.neonPurple,
    }));
  }, []);

  useEffect(() => {
    // 1. Logo scale and opacity fade in
    logoScale.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.back(1.5)),
    });
    logoOpacity.value = withTiming(1, { duration: 800 });

    // 2. Text fade in
    textOpacity.value = withTiming(1, { duration: 1400 });

    // 3. Start particle animation clock loop
    progressClock.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.linear }),
      -1,
      false
    );

    // 4. Fade out screen and complete
    const timer = setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: 600 }, (isFinished) => {
        if (isFinished) {
          runOnJS(onAnimationComplete)();
        }
      });
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={['#070B14', '#0B1326', '#02050B']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient background glows */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      {/* Floating particles */}
      {particles.map((p) => (
        <ParticleItem key={p.id} progress={progressClock} metadata={p} />
      ))}

      <View style={styles.content}>
        <Animated.View style={[styles.logoOutline, logoStyle]}>
          <LinearGradient
            colors={[colors.secondary, '#6A0DAD']}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Sparkles size={48} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={styles.appName}>PetAdopt</Text>
          <Text style={styles.tagline}>FUTURE OF ANIMAL CARE</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070B14',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowTop: {
    position: 'absolute',
    top: height * 0.15,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    filter: 'blur(60px)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: height * 0.15,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(208, 188, 255, 0.12)',
    filter: 'blur(60px)',
  },
  logoOutline: {
    width: 110,
    height: 110,
    borderRadius: 36,
    padding: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: colors.neonBlue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 240, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    letterSpacing: 4,
    marginTop: 8,
  },
  particle: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 3,
  },
});
