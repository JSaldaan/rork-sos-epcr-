import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { X, Check, AlertCircle } from 'lucide-react-native';
import SignatureBox from './SignatureBox';

interface SignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  title: string;
  initialSignature?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SignatureModal({
  visible,
  onClose,
  onSave,
  title,
  initialSignature = '',
}: SignatureModalProps) {
  const [signature, setSignature] = React.useState(initialSignature);
  
  // Update signature when modal opens with initial value
  React.useEffect(() => {
    if (visible) {
      setSignature(initialSignature);
      console.log('📝 SignatureModal opened with initial signature:', !!initialSignature);
    }
  }, [visible, initialSignature]);

  const handleSave = () => {
    if (signature) {
      console.log('💾 Saving signature from modal:', signature.substring(0, 50) + '...');
      // Convert SVG paths to base64 image for better compatibility
      const base64Image = convertSignatureToBase64(signature);
      onSave(base64Image);
      setSignature('');
      console.log('✅ Signature saved and modal will close');
    } else {
      Alert.alert(
        'No Signature',
        'Please draw a signature before saving.',
        [{ text: 'OK' }]
      );
    }
  };

  const convertSignatureToBase64 = (pathsString: string): string => {
    if (!pathsString) return '';
    
    // If already base64, return as is
    if (pathsString.startsWith('data:image')) {
      return pathsString;
    }
    
    const paths = pathsString.split('|').filter(p => p);
    if (paths.length === 0) return '';
    
    // Create SVG with paths
    const svgString = `<svg width="${screenWidth - 80}" height="200" viewBox="0 0 ${screenWidth - 80} 200" xmlns="http://www.w3.org/2000/svg" style="background: white;">
      <rect width="100%" height="100%" fill="white"/>
      ${paths.map(path => 
        `<path d="${path}" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      ).join('')}
    </svg>`;
    
    // Convert to base64
    try {
      const base64 = btoa(unescape(encodeURIComponent(svgString)));
      return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
      console.error('Error converting signature to base64:', error);
      return pathsString; // Return original if conversion fails
    }
  };

  const handleClose = () => {
    if (signature && signature !== initialSignature) {
      Alert.alert(
        'Unsaved Changes',
        'You have an unsaved signature. Do you want to discard it?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setSignature('');
              onClose();
            }
          }
        ]
      );
    } else {
      setSignature('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {!signature && (
              <View style={styles.instructionBox}>
                <AlertCircle size={16} color="#0066CC" />
                <Text style={styles.instructionText}>
                  Draw your signature in the area below using your finger or stylus
                </Text>
              </View>
            )}
            <SignatureBox
              title="Draw your signature below"
              onSignatureChange={(newSignature) => {
                console.log('📝 Signature changed in modal:', !!newSignature);
                setSignature(newSignature);
              }}
              signature={signature}
              height={200}
              width={screenWidth - 80}
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                !signature && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!signature}
            >
              <Check size={20} color={signature ? "#fff" : "#999"} />
              <Text style={[styles.saveButtonText, !signature && styles.saveButtonTextDisabled]}>
                {signature ? 'Save Signature' : 'Draw Signature First'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: screenWidth - 40,
    maxHeight: screenHeight * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#0066CC',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#0066CC',
    marginLeft: 8,
    lineHeight: 18,
  },
});