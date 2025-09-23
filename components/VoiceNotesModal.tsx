import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Mic, MicOff, X, FileText } from 'lucide-react-native';
import { usePCRStore } from '@/store/pcrStore';

interface VoiceNotesModalProps {
  visible: boolean;
  onClose: () => void;
  onTranscriptionComplete?: (transcription: string, analysis?: string) => void;
}

export function VoiceNotesModal({ visible, onClose, onTranscriptionComplete }: VoiceNotesModalProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<string>('');
  const { updateIncidentInfo } = usePCRStore();

  const handleStartRecording = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Voice recording is not available on web. Please use the mobile app.');
      return;
    }
    
    setIsRecording(true);
    // Simulate recording for now
    setTimeout(() => {
      setIsRecording(false);
      setIsProcessing(true);
      
      // Simulate processing
      setTimeout(() => {
        const mockTranscription = "Patient presents with chest pain and shortness of breath. Vital signs stable.";
        setTranscription(mockTranscription);
        setIsProcessing(false);
        
        if (onTranscriptionComplete) {
          onTranscriptionComplete(mockTranscription);
        }
      }, 2000);
    }, 3000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      const mockTranscription = "Recording stopped. Processing complete.";
      setTranscription(mockTranscription);
      setIsProcessing(false);
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(mockTranscription);
      }
    }, 1500);
  };

  const handleUseTranscription = () => {
    if (transcription) {
      updateIncidentInfo({ 
        additionalNotes: transcription 
      });
      Alert.alert('Success', 'Voice note added to additional notes');
      onClose();
    }
  };

  const handleClose = () => {
    setTranscription('');
    setIsRecording(false);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Voice Notes</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.recordingSection}>
            {!isRecording && !isProcessing && !transcription && (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={handleStartRecording}
              >
                <Mic size={32} color="#fff" />
                <Text style={styles.recordButtonText}>Start Recording</Text>
              </TouchableOpacity>
            )}

            {isRecording && (
              <TouchableOpacity
                style={[styles.recordButton, styles.recordingButton]}
                onPress={handleStopRecording}
              >
                <MicOff size={32} color="#fff" />
                <Text style={styles.recordButtonText}>Stop Recording</Text>
              </TouchableOpacity>
            )}

            {isProcessing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#0066CC" />
                <Text style={styles.processingText}>Processing voice note...</Text>
              </View>
            )}

            {transcription && (
              <View style={styles.transcriptionContainer}>
                <View style={styles.transcriptionHeader}>
                  <FileText size={20} color="#0066CC" />
                  <Text style={styles.transcriptionTitle}>Transcription</Text>
                </View>
                <Text style={styles.transcriptionText}>{transcription}</Text>
                
                <TouchableOpacity
                  style={styles.useButton}
                  onPress={handleUseTranscription}
                >
                  <Text style={styles.useButtonText}>Add to Notes</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  recordingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  recordButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  recordingButton: {
    backgroundColor: '#DC3545',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  transcriptionContainer: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  transcriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transcriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  transcriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 16,
  },
  useButton: {
    backgroundColor: '#28A745',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  useButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});