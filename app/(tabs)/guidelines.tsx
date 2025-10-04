import React from 'react';
import { ScrollView, View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '@/constants/colors';
import { textStyles } from '@/constants/fonts';

export default function GuidelinesScreen(): JSX.Element {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>iOS Guidelines & Procedures</Text>

      <Section title="Overview">
        <Paragraph>
          This screen summarizes the essential iOS usage guidelines and operating procedures for SOS ePCR.
          It reflects Apple's Human Interface Guidelines and our medical workflow requirements.
        </Paragraph>
      </Section>

      <Section title="Design & Accessibility">
        <Bullet>Uses iOS system font (-apple-system) and Apple typography scale</Bullet>
        <Bullet>iOS color system with dark mode support and proper contrast</Bullet>
        <Bullet>Respect safe areas and notches on all devices</Bullet>
        <Bullet>Minimum touch target size of 44pt for all interactive elements</Bullet>
        <Bullet>Supports Dynamic Type, VoiceOver, and Reduce Motion</Bullet>
      </Section>

      <Section title="Permissions & Privacy">
        <Paragraph>
          Grant the following permissions when prompted to ensure full functionality:
        </Paragraph>
        <Bullet>Camera: capture incident photos for documentation</Bullet>
        <Bullet>Microphone: record voice notes for patient care</Bullet>
        <Bullet>Location (While Using): record incident and transport locations</Bullet>
        <Bullet>Photo Library: attach images to reports as needed</Bullet>
        <Paragraph>
          You can review and adjust permissions at any time in Settings → SOS ePCR.
        </Paragraph>
      </Section>

      <Section title="Operational Procedures">
        <SubTitle>Starting a New PCR</SubTitle>
        <Bullet>Open the New PCR tab and enter required demographics first</Bullet>
        <Bullet>Capture photos only when safe and clinically appropriate</Bullet>
        <Bullet>Use voice notes for rapid documentation in high-acuity cases</Bullet>

        <SubTitle>Vitals & Monitoring</SubTitle>
        <Bullet>Enter vitals sequentially; auto-save reduces data loss on iOS</Bullet>
        <Bullet>Allow brief pauses after saving to ensure state updates</Bullet>

        <SubTitle>Transport & Summary</SubTitle>
        <Bullet>Confirm destination and transport mode before submission</Bullet>
        <Bullet>Review the summary for completeness and accuracy</Bullet>

        <SubTitle>Offline Use</SubTitle>
        <Bullet>App continues to function offline; sync resumes when online</Bullet>
        <Bullet>Do not force-quit during sync; keep the app in foreground</Bullet>

        <SubTitle>Logout</SubTitle>
        <Bullet>Use the Logout button in the header to securely exit</Bullet>
        <Bullet>Wait for the confirmation dialog before closing the app</Bullet>
      </Section>

      <Section title="Error Recovery (iOS)">
        <Bullet>If a screen becomes unresponsive, navigate back and retry</Bullet>
        <Bullet>On repeated errors, use the logout button, then sign in again</Bullet>
        <Bullet>Ensure iOS is updated to the latest supported version</Bullet>
      </Section>

      <Section title="Compliance Notes">
        <Bullet>App follows Apple Human Interface Guidelines for medical apps</Bullet>
        <Bullet>Colors, typography, spacing, and navigation are iOS-native</Bullet>
        <Bullet>All privacy strings and permissions are configured in app settings</Bullet>
      </Section>

      <View style={styles.footerSpace} />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SubTitle({ children }: { children: React.ReactNode }): JSX.Element {
  return <Text style={styles.subTitle}>{children}</Text>;
}

function Paragraph({ children }: { children: React.ReactNode }): JSX.Element {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletSymbol}>{Platform.OS === 'ios' ? '•' : '-'} </Text>
      <Text style={styles.bulletText}>{children}</Text>
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
    paddingBottom: 32,
  },
  pageTitle: {
    ...textStyles.title2,
    color: colors.text.primary,
    marginBottom: 12,
  },
  section: {
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderColor: colors.separator.opaque,
  },
  sectionTitle: {
    ...textStyles.headline,
    color: colors.text.primary,
    marginBottom: 8,
  },
  sectionBody: {
    gap: 6,
  },
  subTitle: {
    ...textStyles.callout,
    color: colors.text.secondary,
    marginTop: 4,
    marginBottom: 4,
  },
  paragraph: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletSymbol: {
    ...textStyles.body,
    color: colors.text.secondary,
    width: 18,
    lineHeight: textStyles.body.lineHeight,
  },
  bulletText: {
    ...textStyles.body,
    color: colors.text.secondary,
    flex: 1,
  },
  footerSpace: {
    height: 24,
  },
});
