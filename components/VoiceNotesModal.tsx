import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { Mic, MicOff, X, Wand2, FileText, Clock } from 'lucide-react-native';
import { usePCRStore } from '@/store/pcrStore';

interface VoiceNotesModalProps {
  visible: boolean;
  onClose: () => void;
  onTranscriptionComplete?: (transcription: string, analysis?: string) => void;
}

interface TranscriptionResponse {
  text: string;
  language: string;
}

interface AIAnalysisResponse {
  completion: string;
}

export function VoiceNotesModal({ visible, onClose, onTranscriptionComplete }: VoiceNotesModalProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const { updateIncidentInfo, incidentInfo } = usePCRStore();

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(pulse);
      };
      pulse();
      
      // Start duration counter
      const startTime = Date.now();
      durationInterval.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [isRecording, pulseAnim]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        // Web permissions are handled by getUserMedia
        return true;
      } else {
        const { status } = await Audio.requestPermissionsAsync();
        return status === 'granted';
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Microphone permission is required to record voice notes.');
        return;
      }

      setRecordingDuration(0);
      setTranscription('');
      setAiAnalysis('');

      if (Platform.OS === 'web') {
        // Web recording using MediaRecorder
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = () => {
          setAudioChunks(chunks);
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setMediaRecorder(recorder);
      } else {
        // Mobile recording using expo-av
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        setRecording(newRecording);
      }

      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);

      if (Platform.OS === 'web') {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          // Wait for the chunks to be available
          await new Promise(resolve => {
            if (mediaRecorder) {
              mediaRecorder.onstop = () => resolve(undefined);
            }
          });
        }
      } else {
        if (recording) {
          await recording.stopAndUnloadAsync();
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        }
      }

      console.log('Recording stopped, processing...');
      await processRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
      setIsProcessing(false);
    }
  };

  const processRecording = async () => {
    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        if (audioChunks.length === 0) {
          throw new Error('No audio data recorded');
        }
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        formData.append('audio', audioBlob, 'recording.wav');
      } else {
        if (!recording) {
          throw new Error('No recording available');
        }
        
        const uri = recording.getURI();
        if (!uri) {
          throw new Error('Recording URI not available');
        }

        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        const audioFile = {
          uri,
          name: `recording.${fileType}`,
          type: `audio/${fileType}`,
        } as any;

        formData.append('audio', audioFile);
      }

      // Send to speech-to-text API
      console.log('Sending audio for transcription...');
      const sttResponse = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!sttResponse.ok) {
        throw new Error(`STT API error: ${sttResponse.status}`);
      }

      const sttResult: TranscriptionResponse = await sttResponse.json();
      console.log('Transcription received:', sttResult.text);
      setTranscription(sttResult.text);

      // Analyze with AI for medical insights
      if (sttResult.text.trim()) {
        await analyzeWithAI(sttResult.text);
      }

      setIsProcessing(false);
    } catch (error) {
      console.error('Processing failed:', error);
      Alert.alert('Processing Error', 'Failed to process recording. Please try again.');
      setIsProcessing(false);
    }
  };

  const analyzeWithAI = async (text: string) => {
    try {
      setIsAnalyzing(true);
      console.log('Analyzing transcription with AI...');

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a medical AI assistant helping paramedics analyze voice notes from patient encounters. 
              
Analyze the following voice note and provide:
1. Key medical findings and observations
2. Suggested provisional diagnosis considerations
3. Important vital signs or symptoms mentioned
4. Treatment recommendations or protocols to consider
5. Any critical information that should be highlighted

Format your response in clear, organized sections. Be concise but thorough. Focus on actionable medical insights.`
            },
            {
              role: 'user',
              content: `Please analyze this paramedic voice note: "${text}"`
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const result: AIAnalysisResponse = await response.json();
      console.log('AI analysis received');
      setAiAnalysis(result.completion);
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAiAnalysis('AI analysis unavailable. Please review the transcription manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyToReport = useCallback(() => {
    if (transcription.trim()) {
      // Add the voice note to additional notes
      const timestamp = new Date().toLocaleString();
      const voiceNote = `\n\n--- Voice Note (${timestamp}) ---\n${transcription}`;
      
      updateIncidentInfo({
        additionalNotes: (incidentInfo.additionalNotes || '') + voiceNote
      });

      if (onTranscriptionComplete) {
        onTranscriptionComplete(transcription, aiAnalysis);
      }

      Alert.alert(
        'Voice Note Added',
        'Your voice note has been added to the Additional Notes section of the report.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  }, [transcription, aiAnalysis, updateIncidentInfo, onTranscriptionComplete, onClose]);

  const handleClose = useCallback(() => {
    if (isRecording) {
      Alert.alert(
        'Recording in Progress',
        'Stop recording before closing?',
        [
          { text: 'Continue Recording', style: 'cancel' },
          { text: 'Stop & Close', onPress: () => stopRecording().then(onClose) }
        ]
      );
    } else {
      onClose();
    }
  }, [isRecording, onClose, stopRecording]);

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
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Recording Controls */}
          <View style={styles.recordingSection}>
            <View style={styles.recordingControls}>
              {isRecording ? (
                <View style={styles.durationContainer}>
                  <Clock size={16} color="#DC3545" />
                  <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
                </View>
              ) : null}
              
              <Animated.View style={[styles.recordButton, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity
                  style={[
                    styles.micButton,
                    isRecording && styles.micButtonActive,
                    (isProcessing || isAnalyzing) && styles.micButtonDisabled
                  ]}
                  onPress={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing || isAnalyzing}
                >
                  {isProcessing || isAnalyzing ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : isRecording ? (
                    <MicOff size={32} color="#fff" />
                  ) : (
                    <Mic size={32} color="#fff" />
                  )}
                </TouchableOpacity>
              </Animated.View>
              
              <Text style={styles.recordingInstructions}>
                {isProcessing
                  ? 'Processing recording...'
                  : isAnalyzing
                  ? 'Analyzing with AI...'
                  : isRecording
                  ? 'Tap to stop recording'
                  : 'Tap to start recording'}
              </Text>
            </View>
          </View>

          {/* Transcription Results */}
          {transcription && (
            <View style={styles.resultSection}>
              <View style={styles.sectionHeader}>
                <FileText size={20} color="#0066CC" />
                <Text style={styles.sectionTitle}>Transcription</Text>
              </View>
              <View style={styles.transcriptionContainer}>
                <Text style={styles.transcriptionText}>{transcription}</Text>
              </View>
            </View>
          )}

          {/* AI Analysis */}
          {aiAnalysis && (
            <View style={styles.resultSection}>
              <View style={styles.sectionHeader}>
                <Wand2 size={20} color="#28A745" />
                <Text style={styles.sectionTitle}>AI Medical Analysis</Text>
              </View>
              <View style={styles.analysisContainer}>
                <Text style={styles.analysisText}>{aiAnalysis}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          {transcription && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyToReport}
              >
                <Text style={styles.applyButtonText}>Add to Report</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
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
  },
  recordingSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordingControls: {
    alignItems: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF5F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  durationText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#DC3545',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  recordButton: {
    marginBottom: 16,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: '#DC3545',
  },
  micButtonDisabled: {
    backgroundColor: '#999',
  },
  recordingInstructions: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  resultSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  transcriptionContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  transcriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  analysisContainer: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
  },
  analysisText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  actionButtons: {
    margin: 16,
    marginTop: 0,
  },
  applyButton: {
    backgroundColor: '#28A745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});