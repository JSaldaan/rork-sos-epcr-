import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { textStyles } from '@/constants/fonts';
import { colors } from '@/constants/colors';
import { clearAllAuthData } from '@/utils/auth';

export default function LegalAndSupportScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const [sectionPositions, setSectionPositions] = useState<Record<string, number>>({});
  const { section } = useLocalSearchParams<{ section?: string }>();

  const handleRecordPosition = useCallback((key: string, y: number) => {
    setSectionPositions(prev => ({ ...prev, [key]: y }));
  }, []);

  useEffect(() => {
    if (!section) return;
    const key = String(section).toLowerCase();
    const y = sectionPositions[key];
    if (typeof y === 'number') {
      setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 150);
    }
  }, [section, sectionPositions]);

  const handleEraseLocalData = useCallback(() => {
    Alert.alert(
      'Erase Local Data',
      'This removes all locally stored data on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllAuthData();
              Alert.alert('Completed', 'All local data was removed.');
              router.replace('/login');
            } catch {
              Alert.alert('Error', 'Unable to erase local data. Please try again.');
            }
          }
        }
      ]
    );
  }, []);

  const supportEmail = useMemo(() => 'support@rork.com', []);

  return (
    <View style={styles.container}>
      <ScrollView ref={ref => (scrollRef.current = ref)} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Legal & Support</Text>
        <Text style={styles.subtitle}>Privacy Policy • Terms of Use • Account Deletion</Text>

        <View onLayout={e => handleRecordPosition('privacy', e.nativeEvent.layout.y)} style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We respect your privacy. This app stores Patient Care Report data locally on the device for
            operational use and does not transmit data to external servers unless you explicitly export or share it.
            Access to media (camera, microphone, location, photos) is used solely for documenting patient care.
          </Text>
          <Text style={styles.paragraph}>
            You can erase all local data at any time using the control below. If your organization integrates with
            a backend system, their privacy policy governs any data synchronized to their systems.
          </Text>
        </View>

        <View onLayout={e => handleRecordPosition('terms', e.nativeEvent.layout.y)} style={styles.section}>
          <Text style={styles.sectionTitle}>Terms of Use</Text>
          <Text style={styles.paragraph}>
            This app is intended for professional medical documentation by authorized staff. You agree to use the app
            in accordance with applicable laws, facility policies, and patient privacy regulations. Do not include
            sensitive data beyond what is necessary for patient care documentation.
          </Text>
          <Text style={styles.paragraph}>
            The app is provided “as is” without warranties. Your organization is responsible for configuring access,
            retention, and export policies that meet local requirements.
          </Text>
        </View>

        <View onLayout={e => handleRecordPosition('deletion', e.nativeEvent.layout.y)} style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Data Deletion</Text>
          <Text style={styles.paragraph}>
            If your account is managed by your organization, contact your administrator to deactivate your access.
            To remove data stored on this device, use the control below.
          </Text>
          <TouchableOpacity style={styles.eraseButton} onPress={handleEraseLocalData}>
            <Text style={styles.eraseButtonText}>Erase All Local Data on This Device</Text>
          </TouchableOpacity>
          <Text style={styles.paragraph}>
            To request deletion of organization-managed or cloud-hosted data related to your account, email support:
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${supportEmail}?subject=Account Deletion Request`)}
            style={styles.linkButton}
          >
            <Text style={styles.linkButtonText}>Email Support ({supportEmail})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.paragraph}>For questions or assistance, contact support below.</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${supportEmail}?subject=Support Request`)}
            style={styles.linkButton}
          >
            <Text style={styles.linkButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    ...textStyles.title2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.caption1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.separator.subtle,
  },
  sectionTitle: {
    ...textStyles.headline,
    color: colors.text.primary,
    marginBottom: 8,
  },
  paragraph: {
    ...textStyles.body,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  eraseButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  eraseButtonText: {
    ...textStyles.buttonText,
    color: '#fff',
  },
  linkButton: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignSelf: 'flex-start',
  },
  linkButtonText: {
    ...textStyles.buttonText,
    color: '#1D4ED8',
  },
  footerSpace: {
    height: 24,
  },
});
