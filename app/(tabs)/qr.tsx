import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, useWindowDimensions, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Linking from 'expo-linking';
import { colors } from '@/constants/colors';
import { textStyles } from '@/constants/fonts';

export default function QRScreen() {
  const { width } = useWindowDimensions();
  const defaultUrl = useMemo(() => {
    try {
      // Create a universal link into the app's root
      return Linking.createURL('/');
    } catch {
      return 'hamad-epcr://';
    }
  }, []);

  const [value, setValue] = useState<string>(defaultUrl);
  const size = Math.min(width, 480) * (Platform.OS === 'web' ? 0.5 : 0.6);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Share App Link</Text>
        <Text style={styles.subtitle}>Scan to open this app</Text>

        <View style={styles.qrContainer}>
          <QRCode value={value || defaultUrl} size={Math.max(140, Math.floor(size))} backgroundColor="#FFFFFF" color="#000000" />
        </View>

        <Text style={styles.label}>QR Content</Text>
        <TextInput
          style={styles.input}
          value={value}
          placeholder="Enter text or URL to encode"
          onChangeText={setValue}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.helper}>Default uses the app deep link: {defaultUrl}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    ...textStyles.title3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.caption1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  qrContainer: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.separator.subtle,
    marginVertical: 8,
  },
  label: {
    ...textStyles.labelText,
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    ...textStyles.inputText,
    backgroundColor: '#fff',
    minHeight: 44,
    color: '#333',
  },
  helper: {
    ...textStyles.caption1,
    color: colors.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
  },
});
