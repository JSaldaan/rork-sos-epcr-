import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X, User, AlertCircle, MapPin } from "lucide-react-native";
import Svg, { Path, Circle, G, Ellipse, Line, Rect } from "react-native-svg";

interface InjuryPoint {
  id: string;
  x: number;
  y: number;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  bodyPart: string;
}

interface TraumaBodyDiagramProps {
  visible: boolean;
  onClose: () => void;
  onSave: (injuries: InjuryPoint[]) => void;
  existingInjuries?: InjuryPoint[];
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const BODY_WIDTH = Math.min(screenWidth * 0.85, 350);
const BODY_HEIGHT = Math.min(screenHeight * 0.55, 450);

const severityColors = {
  minor: '#FFC107',
  moderate: '#FF9800',
  severe: '#FF5722',
  critical: '#D32F2F',
};

// Anatomical body regions with precise coordinates
const bodyRegions = [
  // Head and Neck
  { name: 'Head', x: 0.5, y: 0.08, width: 0.12, height: 0.09 },
  { name: 'Face', x: 0.5, y: 0.075, width: 0.1, height: 0.06 },
  { name: 'Neck', x: 0.5, y: 0.135, width: 0.08, height: 0.04 },
  
  // Upper Body
  { name: 'Right Shoulder', x: 0.37, y: 0.19, width: 0.1, height: 0.06 },
  { name: 'Left Shoulder', x: 0.63, y: 0.19, width: 0.1, height: 0.06 },
  { name: 'Right Clavicle', x: 0.42, y: 0.175, width: 0.08, height: 0.03 },
  { name: 'Left Clavicle', x: 0.58, y: 0.175, width: 0.08, height: 0.03 },
  { name: 'Chest (Thorax)', x: 0.5, y: 0.25, width: 0.22, height: 0.12 },
  { name: 'Right Upper Arm', x: 0.31, y: 0.28, width: 0.06, height: 0.12 },
  { name: 'Left Upper Arm', x: 0.69, y: 0.28, width: 0.06, height: 0.12 },
  { name: 'Right Elbow', x: 0.31, y: 0.38, width: 0.05, height: 0.04 },
  { name: 'Left Elbow', x: 0.69, y: 0.38, width: 0.05, height: 0.04 },
  { name: 'Right Forearm', x: 0.29, y: 0.44, width: 0.05, height: 0.1 },
  { name: 'Left Forearm', x: 0.71, y: 0.44, width: 0.05, height: 0.1 },
  { name: 'Right Wrist', x: 0.28, y: 0.52, width: 0.04, height: 0.03 },
  { name: 'Left Wrist', x: 0.72, y: 0.52, width: 0.04, height: 0.03 },
  { name: 'Right Hand', x: 0.27, y: 0.56, width: 0.04, height: 0.05 },
  { name: 'Left Hand', x: 0.73, y: 0.56, width: 0.04, height: 0.05 },
  
  // Core
  { name: 'Upper Abdomen', x: 0.5, y: 0.36, width: 0.2, height: 0.08 },
  { name: 'Lower Abdomen', x: 0.5, y: 0.43, width: 0.19, height: 0.08 },
  { name: 'Pelvis', x: 0.5, y: 0.5, width: 0.2, height: 0.06 },
  { name: 'Right Hip', x: 0.43, y: 0.53, width: 0.08, height: 0.06 },
  { name: 'Left Hip', x: 0.57, y: 0.53, width: 0.08, height: 0.06 },
  
  // Lower Body
  { name: 'Right Thigh', x: 0.43, y: 0.62, width: 0.08, height: 0.14 },
  { name: 'Left Thigh', x: 0.57, y: 0.62, width: 0.08, height: 0.14 },
  { name: 'Right Knee', x: 0.43, y: 0.74, width: 0.06, height: 0.04 },
  { name: 'Left Knee', x: 0.57, y: 0.74, width: 0.06, height: 0.04 },
  { name: 'Right Shin', x: 0.43, y: 0.82, width: 0.06, height: 0.12 },
  { name: 'Left Shin', x: 0.57, y: 0.82, width: 0.06, height: 0.12 },
  { name: 'Right Ankle', x: 0.43, y: 0.92, width: 0.05, height: 0.03 },
  { name: 'Left Ankle', x: 0.57, y: 0.92, width: 0.05, height: 0.03 },
  { name: 'Right Foot', x: 0.43, y: 0.96, width: 0.06, height: 0.04 },
  { name: 'Left Foot', x: 0.57, y: 0.96, width: 0.06, height: 0.04 },
];

export default function TraumaBodyDiagram({
  visible,
  onClose,
  onSave,
  existingInjuries = [],
}: TraumaBodyDiagramProps) {
  const [injuries, setInjuries] = useState<InjuryPoint[]>(existingInjuries);
  const [selectedInjury, setSelectedInjury] = useState<InjuryPoint | null>(null);
  const [showAddInjuryModal, setShowAddInjuryModal] = useState(false);
  const [newInjuryPosition, setNewInjuryPosition] = useState<{ x: number; y: number } | null>(null);
  const [injuryDescription, setInjuryDescription] = useState('');
  const [injurySeverity, setInjurySeverity] = useState<InjuryPoint['severity']>('moderate');

  const getBodyPartFromPosition = useCallback((x: number, y: number) => {
    const relativeX = x / BODY_WIDTH;
    const relativeY = y / BODY_HEIGHT;

    // Find the body part that contains the touch point
    let selectedPart = 'Unspecified Location';
    let minDistance = Infinity;

    for (const region of bodyRegions) {
      const leftBound = region.x - region.width / 2;
      const rightBound = region.x + region.width / 2;
      const topBound = region.y - region.height / 2;
      const bottomBound = region.y + region.height / 2;

      const isWithinBounds = (
        relativeX >= leftBound &&
        relativeX <= rightBound &&
        relativeY >= topBound &&
        relativeY <= bottomBound
      );

      if (isWithinBounds) {
        // Calculate distance to center for precision
        const distance = Math.sqrt(
          Math.pow(relativeX - region.x, 2) + Math.pow(relativeY - region.y, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          selectedPart = region.name;
        }
      }
    }

    return selectedPart;
  }, []);

  const handleBodyPress = useCallback((event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const bodyPart = getBodyPartFromPosition(locationX, locationY);
    
    setNewInjuryPosition({ x: locationX, y: locationY });
    setShowAddInjuryModal(true);
  }, [getBodyPartFromPosition]);

  const handleAddInjury = useCallback(() => {
    if (!newInjuryPosition || !injuryDescription.trim()) {
      Alert.alert('Error', 'Please provide a description for the injury');
      return;
    }

    const bodyPart = getBodyPartFromPosition(newInjuryPosition.x, newInjuryPosition.y);
    const newInjury: InjuryPoint = {
      id: Date.now().toString(),
      x: newInjuryPosition.x,
      y: newInjuryPosition.y,
      description: injuryDescription,
      severity: injurySeverity,
      bodyPart,
    };

    setInjuries([...injuries, newInjury]);
    setShowAddInjuryModal(false);
    setInjuryDescription('');
    setNewInjuryPosition(null);
  }, [newInjuryPosition, injuryDescription, injurySeverity, injuries, getBodyPartFromPosition]);

  const handleDeleteInjury = useCallback((id: string) => {
    Alert.alert(
      'Delete Injury',
      'Are you sure you want to remove this injury marker?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setInjuries(injuries.filter(injury => injury.id !== id));
            setSelectedInjury(null);
          },
        },
      ]
    );
  }, [injuries]);

  const handleSave = useCallback(() => {
    onSave(injuries);
    onClose();
  }, [injuries, onSave, onClose]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Injuries',
      'Are you sure you want to remove all injury markers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setInjuries([]);
            setSelectedInjury(null);
          },
        },
      ]
    );
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <AlertCircle size={24} color="#DC3545" />
            <Text style={styles.headerTitle}>Trauma Body Diagram</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <Text style={styles.instructions}>
          Tap on the body diagram to mark injury locations
        </Text>

        <View style={styles.bodyContainer}>
          <TouchableOpacity
            style={styles.bodyDiagram}
            onPress={handleBodyPress}
            activeOpacity={1}
          >
            {/* Professional Medical Body Diagram */}
            <Svg
              width={BODY_WIDTH}
              height={BODY_HEIGHT}
              viewBox="0 0 200 400"
              style={styles.svgBody}
            >
              <G>
                {/* Head */}
                <Ellipse cx="100" cy="30" rx="22" ry="26" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" />
                
                {/* Facial Features */}
                <Circle cx="92" cy="26" r="2" fill="#718096" />
                <Circle cx="108" cy="26" r="2" fill="#718096" />
                <Path d="M 100 30 L 100 35" stroke="#718096" strokeWidth="1" />
                <Path d="M 94 38 Q 100 40 106 38" stroke="#718096" strokeWidth="1" fill="none" />
                
                {/* Ears */}
                <Ellipse cx="78" cy="30" rx="4" ry="8" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1" />
                <Ellipse cx="122" cy="30" rx="4" ry="8" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1" />
                
                {/* Neck */}
                <Rect x="92" y="52" width="16" height="18" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" rx="2" />
                
                {/* Shoulders and Clavicles */}
                <Path d="M 70 70 Q 85 68 92 70" fill="none" stroke="#4A5568" strokeWidth="1.5" />
                <Path d="M 108 70 Q 115 68 130 70" fill="none" stroke="#4A5568" strokeWidth="1.5" />
                <Circle cx="70" cy="72" r="8" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" />
                <Circle cx="130" cy="72" r="8" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" />
                
                {/* Torso - Chest */}
                <Path d="M 75 75 L 75 140 Q 75 150 80 155 L 85 160 L 85 165 Q 85 170 90 170 L 110 170 Q 115 170 115 165 L 115 160 L 120 155 Q 125 150 125 140 L 125 75"
                      fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" />
                
                {/* Chest Details - Ribs indication */}
                <Path d="M 80 85 Q 100 82 120 85" stroke="#E2E8F0" strokeWidth="0.5" fill="none" />
                <Path d="M 80 95 Q 100 92 120 95" stroke="#E2E8F0" strokeWidth="0.5" fill="none" />
                <Path d="M 80 105 Q 100 102 120 105" stroke="#E2E8F0" strokeWidth="0.5" fill="none" />
                
                {/* Abdomen muscles indication */}
                <Line x1="100" y1="120" x2="100" y2="160" stroke="#E2E8F0" strokeWidth="0.5" />
                <Path d="M 85 125 L 115 125" stroke="#E2E8F0" strokeWidth="0.5" />
                <Path d="M 85 140 L 115 140" stroke="#E2E8F0" strokeWidth="0.5" />
                
                {/* Arms */}
                {/* Right Arm */}
                <Path d="M 70 78 L 65 100 L 62 130 L 60 155" fill="none" stroke="#4A5568" strokeWidth="1.5" />
                <Path d="M 60 155 L 58 180 L 56 200 L 55 220" fill="none" stroke="#4A5568" strokeWidth="1.5" />
                <Circle cx="60" cy="155" r="5" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" />
                <Ellipse cx="55" cy="225" rx="8" ry="12" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" />
                
                {/* Left Arm */}
                <Path d="M 130 78 L 135 100 L 138 130 L 140 155" fill="none" stroke="#4A5568" strokeWidth="1.5" />
                <Path d="M 140 155 L 142 180 L 144 200 L 145 220" fill="none" stroke="#4A5568" strokeWidth="1.5" />
                <Circle cx="140" cy="155" r="5" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" />
                <Ellipse cx="145" cy="225" rx="8" ry="12" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" />
                
                {/* Pelvis */}
                <Path d="M 85 165 Q 85 175 90 180 L 95 185 Q 100 188 100 195"
                      fill="none" stroke="#4A5568" strokeWidth="1.5" />
                <Path d="M 115 165 Q 115 175 110 180 L 105 185 Q 100 188 100 195"
                      fill="none" stroke="#4A5568" strokeWidth="1.5" />
                
                {/* Legs */}
                {/* Right Leg */}
                <Path d="M 90 180 L 88 220 L 86 260 L 85 290" fill="none" stroke="#4A5568" strokeWidth="1.5" />
                <Circle cx="85" cy="290" r="6" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" />
                <Path d="M 85 296 L 84 330 L 83 360" fill="none" stroke="#4A5568" strokeWidth="1.5" />
                <Ellipse cx="83" cy="365" rx="5" ry="3" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" />
                <Path d="M 78 365 L 78 375 L 88 375 L 88 365" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" />
                
                {/* Left Leg */}
                <Path d="M 110 180 L 112 220 L 114 260 L 115 290" fill="none" stroke="#4A5568" strokeWidth="1.5" />
                <Circle cx="115" cy="290" r="6" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" />
                <Path d="M 115 296 L 116 330 L 117 360" fill="none" stroke="#4A5568" strokeWidth="1.5" />
                <Ellipse cx="117" cy="365" rx="5" ry="3" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" />
                <Path d="M 112 365 L 112 375 L 122 375 L 122 365" fill="#FFF5F0" stroke="#4A5568" strokeWidth="1.5" />
                
                {/* Muscle groups for reference */}
                {/* Biceps */}
                <Ellipse cx="65" cy="110" rx="6" ry="12" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
                <Ellipse cx="135" cy="110" rx="6" ry="12" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
                
                {/* Quadriceps */}
                <Ellipse cx="88" cy="240" rx="8" ry="20" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
                <Ellipse cx="112" cy="240" rx="8" ry="20" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
              </G>
            </Svg>

            {/* Injury markers */}
            {injuries.map((injury) => {
              // Convert injury coordinates to match SVG viewBox
              const svgX = (injury.x / BODY_WIDTH) * 200;
              const svgY = (injury.y / BODY_HEIGHT) * 400;
              
              return (
                <TouchableOpacity
                  key={injury.id}
                  style={[
                    styles.injuryMarker,
                    {
                      left: injury.x - 12,
                      top: injury.y - 12,
                      backgroundColor: severityColors[injury.severity],
                    },
                  ]}
                  onPress={() => setSelectedInjury(injury)}
                >
                  <MapPin size={16} color="#fff" />
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Severity Levels:</Text>
            <View style={styles.legendItems}>
              {Object.entries(severityColors).map(([severity, color]) => (
                <View key={severity} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Injury List */}
        <View style={styles.injuryListContainer}>
          <View style={styles.injuryListHeader}>
            <Text style={styles.injuryListTitle}>Marked Injuries ({injuries.length})</Text>
            {injuries.length > 0 && (
              <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView style={styles.injuryList} showsVerticalScrollIndicator={false}>
            {injuries.length === 0 ? (
              <Text style={styles.noInjuriesText}>No injuries marked yet</Text>
            ) : (
              injuries.map((injury) => (
                <TouchableOpacity
                  key={injury.id}
                  style={styles.injuryItem}
                  onPress={() => setSelectedInjury(injury)}
                >
                  <View style={styles.injuryItemLeft}>
                    <View
                      style={[
                        styles.injuryItemSeverity,
                        { backgroundColor: severityColors[injury.severity] },
                      ]}
                    />
                    <View style={styles.injuryItemInfo}>
                      <Text style={styles.injuryItemBodyPart}>{injury.bodyPart}</Text>
                      <Text style={styles.injuryItemDescription}>{injury.description}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteInjury(injury.id)}
                    style={styles.deleteButton}
                  >
                    <X size={18} color="#DC3545" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Injuries</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Injury Modal */}
      <Modal
        visible={showAddInjuryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddInjuryModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Injury Details</Text>
            
            <Text style={styles.modalLabel}>Body Part:</Text>
            <Text style={styles.modalBodyPart}>
              {newInjuryPosition ? getBodyPartFromPosition(newInjuryPosition.x, newInjuryPosition.y) : ''}
            </Text>

            <Text style={styles.modalLabel}>Description:</Text>
            <TextInput
              style={styles.modalInput}
              value={injuryDescription}
              onChangeText={setInjuryDescription}
              placeholder="e.g., Laceration, Fracture, Contusion"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.modalLabel}>Severity:</Text>
            <View style={styles.severityButtons}>
              {(['minor', 'moderate', 'severe', 'critical'] as const).map((sev) => (
                <TouchableOpacity
                  key={sev}
                  style={[
                    styles.severityButton,
                    injurySeverity === sev && styles.severityButtonActive,
                    { borderColor: severityColors[sev] },
                    injurySeverity === sev && { backgroundColor: severityColors[sev] },
                  ]}
                  onPress={() => setInjurySeverity(sev)}
                >
                  <Text
                    style={[
                      styles.severityButtonText,
                      injurySeverity === sev && styles.severityButtonTextActive,
                    ]}
                  >
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowAddInjuryModal(false);
                  setInjuryDescription('');
                  setNewInjuryPosition(null);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={handleAddInjury}
              >
                <Text style={styles.modalAddButtonText}>Add Injury</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Selected Injury Details Modal */}
      {selectedInjury && (
        <Modal
          visible={!!selectedInjury}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedInjury(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedInjury(null)}
          >
            <View style={styles.selectedInjuryModal}>
              <View style={styles.selectedInjuryHeader}>
                <Text style={styles.selectedInjuryTitle}>{selectedInjury.bodyPart}</Text>
                <View
                  style={[
                    styles.selectedInjurySeverity,
                    { backgroundColor: severityColors[selectedInjury.severity] },
                  ]}
                >
                  <Text style={styles.selectedInjurySeverityText}>
                    {selectedInjury.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.selectedInjuryDescription}>{selectedInjury.description}</Text>
              <TouchableOpacity
                style={styles.selectedInjuryDelete}
                onPress={() => handleDeleteInjury(selectedInjury.id)}
              >
                <Text style={styles.selectedInjuryDeleteText}>Delete Injury</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
  },
  instructions: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginVertical: 12,
  },
  bodyContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bodyDiagram: {
    width: BODY_WIDTH,
    height: BODY_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  svgBody: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  injuryMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  legend: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: BODY_WIDTH,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  injuryListContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 16,
  },
  injuryListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  injuryListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#DC3545',
    fontSize: 12,
    fontWeight: '500',
  },
  injuryList: {
    flex: 1,
  },
  noInjuriesText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
  },
  injuryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  injuryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  injuryItemSeverity: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  injuryItemInfo: {
    flex: 1,
  },
  injuryItemBodyPart: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  injuryItemDescription: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6C757D',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
  },
  modalBodyPart: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  severityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
  },
  severityButtonActive: {
    borderWidth: 2,
  },
  severityButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  severityButtonTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: '#0066CC',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalAddButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedInjuryModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 350,
  },
  selectedInjuryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedInjuryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  selectedInjurySeverity: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedInjurySeverityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedInjuryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  selectedInjuryDelete: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedInjuryDeleteText: {
    color: '#DC3545',
    fontSize: 14,
    fontWeight: '600',
  },
});