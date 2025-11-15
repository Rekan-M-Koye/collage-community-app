import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppSettings } from '../context/AppSettingsContext';
import { spacing } from '../utils/responsive';

const FontScalingExample = () => {
  const { theme, fontSizes, getResponsiveFontSize } = useAppSettings();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Method 1: Using fontSizes Scale
        </Text>
        <Text style={[{ fontSize: fontSizes.xs, color: theme.text }]}>Extra Small Text (xs)</Text>
        <Text style={[{ fontSize: fontSizes.sm, color: theme.text }]}>Small Text (sm)</Text>
        <Text style={[{ fontSize: fontSizes.md, color: theme.text }]}>Medium Text (md)</Text>
        <Text style={[{ fontSize: fontSizes.base, color: theme.text }]}>Base Text (base)</Text>
        <Text style={[{ fontSize: fontSizes.lg, color: theme.text }]}>Large Text (lg)</Text>
        <Text style={[{ fontSize: fontSizes.xl, color: theme.text }]}>Extra Large Text (xl)</Text>
        <Text style={[{ fontSize: fontSizes.xxl, color: theme.text }]}>2X Large Text (xxl)</Text>
        <Text style={[{ fontSize: fontSizes.xxxl, color: theme.text }]}>3X Large Text (xxxl)</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Method 2: Using getResponsiveFontSize()
        </Text>
        <Text style={[{ fontSize: getResponsiveFontSize(12), color: theme.text }]}>
          Dynamic 12px text
        </Text>
        <Text style={[{ fontSize: getResponsiveFontSize(16), color: theme.text }]}>
          Dynamic 16px text
        </Text>
        <Text style={[{ fontSize: getResponsiveFontSize(20), color: theme.text }]}>
          Dynamic 20px text
        </Text>
        <Text style={[{ fontSize: getResponsiveFontSize(24), color: theme.text }]}>
          Dynamic 24px text
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Real-World Example: Post Card
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[{ fontSize: fontSizes.base, fontWeight: '600', color: theme.text }]}>
            John Doe
          </Text>
          <Text style={[{ fontSize: fontSizes.sm, color: theme.textSecondary, marginTop: 4 }]}>
            Computer Science • 2 hours ago
          </Text>
          <Text style={[{ fontSize: fontSizes.md, color: theme.text, marginTop: spacing.md }]}>
            This is a sample post using the new font scaling system. 
            The text will automatically adjust based on user preferences! 📱
          </Text>
          <View style={styles.actions}>
            <Text style={[{ fontSize: fontSizes.sm, color: theme.textSecondary }]}>
              👍 24 • 💬 5 • 📤 Share
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: spacing.md,
    fontSize: 18,
  },
  card: {
    padding: spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actions: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});

export default FontScalingExample;
