import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { textStyles } from '@/constants/fonts';
import { colors } from '@/constants/colors';

export default function QRScreen() {
  const [input, setInput] = useState<string>('');
  const [size, setSize] = useState<number>(220);
  const sanitized = useMemo(() => (input || '').trim(), [input]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>QR Code Generator</Text>
        <Text style={styles.subtitle}>Enter any text or URL to generate a QR</Text>

        <View style={styles.qrContainer}>
          {sanitized ? (
            <QRCode value={sanitized} size={size} backgroundColor={colors.background.primary} color={colors.text.primary} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Enter text to preview QR</Text>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          <Text style={styles.label}>Text / URL</Text>
          <TextInput
            style={styles.input}
            placeholder="exp://..., http(s)://..., or any text"
            value={input}
            onChangeText={setInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.sizeRow}>
            <TouchableOpacity style={[styles.sizeButton, size === 180 && styles.sizeButtonActive]} onPress={() => setSize(180)}>
              <Text style={[styles.sizeButtonText, size === 180 && styles.sizeButtonTextActive]}>Small</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sizeButton, size === 220 && styles.sizeButtonActive]} onPress={() => setSize(220)}>
              <Text style={[styles.sizeButtonText, size === 220 && styles.sizeButtonTextActive]}>Medium</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sizeButton, size === 280 && styles.sizeButtonActive]} onPress={() => setSize(280)}>
              <Text style={[styles.sizeButtonText, size === 280 && styles.sizeButtonTextActive]}>Large</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>Tip: Start your dev server with tunnel and paste the exp URL here.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  title: {
    ...textStyles.title2,
    color: colors.text.primary,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.subheadline,
    color: colors.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholder: {
    width: 220,
    height: 220,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  placeholderText: {
    color: colors.text.tertiary,
  },
  controls: {
    alignSelf: 'stretch',
    gap: 10,
  },
  label: {
    ...textStyles.labelText,
    color: colors.text.secondary,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    ...textStyles.inputText,
    backgroundColor: '#fff',
    minHeight: 44,
    color: colors.text.primary,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  sizeButtonActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  sizeButtonText: {
    ...textStyles.subheadline,
    color: colors.text.secondary,
  },
  sizeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
  },
});
