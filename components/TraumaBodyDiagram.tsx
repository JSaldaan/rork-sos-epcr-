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
  Image,
} from "react-native";
import { X, User, AlertCircle, MapPin, RotateCw } from "lucide-react-native";

interface InjuryPoint {
  id: string;
  x: number;
  y: number;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  bodyPart: string;
  view: 'front' | 'back';
}

interface TraumaBodyDiagramProps {
  visible: boolean;
  onClose: () => void;
  onSave: (injuries: InjuryPoint[]) => void;
  existingInjuries?: InjuryPoint[];
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const BODY_WIDTH = Math.min(screenWidth * 0.7, 280);
const BODY_HEIGHT = Math.min(screenHeight * 0.5, 420);

// Professional medical body diagram images
const BODY_IMAGES = {
  front: 'https://r2-pub.rork.com/generated-images/66ec4228-df93-40ba-9a2e-5c65c27920c9.png',
  back: 'https://r2-pub.rork.com/generated-images/2ef9ee05-5dfa-4ad4-b0e9-533ff4ebaf77.png',
};

const severityColors = {
  minor: '#FFC107',
  moderate: '#FF9800',
  severe: '#FF5722',
  critical: '#D32F2F',
};

// Anatomically precise body regions for front view
const frontBodyRegions = [
  // CRANIUM AND FACIAL REGION
  { name: 'Cranium (Skull)', x: 0.5, y: 0.065, width: 0.25, height: 0.08 },
  { name: 'Frontal Region (Forehead)', x: 0.5, y: 0.055, width: 0.2, height: 0.04 },
  { name: 'Right Orbital Region', x: 0.45, y: 0.08, width: 0.04, height: 0.02 },
  { name: 'Left Orbital Region', x: 0.55, y: 0.08, width: 0.04, height: 0.02 },
  { name: 'Nasal Region', x: 0.5, y: 0.095, width: 0.03, height: 0.025 },
  { name: 'Oral Region', x: 0.5, y: 0.11, width: 0.06, height: 0.02 },
  { name: 'Mandibular Region', x: 0.5, y: 0.12, width: 0.12, height: 0.03 },
  { name: 'Right Temporal Region', x: 0.375, y: 0.075, width: 0.05, height: 0.06 },
  { name: 'Left Temporal Region', x: 0.625, y: 0.075, width: 0.05, height: 0.06 },
  
  // CERVICAL REGION
  { name: 'Cervical Spine', x: 0.5, y: 0.155, width: 0.06, height: 0.05 },
  { name: 'Anterior Neck', x: 0.5, y: 0.155, width: 0.08, height: 0.05 },
  
  // SHOULDER GIRDLE
  { name: 'Right Shoulder', x: 0.36, y: 0.185, width: 0.08, height: 0.06 },
  { name: 'Left Shoulder', x: 0.64, y: 0.185, width: 0.08, height: 0.06 },
  
  // THORACIC REGION
  { name: 'Sternum', x: 0.5, y: 0.26, width: 0.02, height: 0.11 },
  { name: 'Right Chest', x: 0.44, y: 0.26, width: 0.12, height: 0.15 },
  { name: 'Left Chest', x: 0.56, y: 0.26, width: 0.12, height: 0.15 },
  
  // ABDOMINAL REGION
  { name: 'Epigastric Region', x: 0.5, y: 0.39, width: 0.12, height: 0.06 },
  { name: 'Right Hypochondriac', x: 0.41, y: 0.39, width: 0.08, height: 0.06 },
  { name: 'Left Hypochondriac', x: 0.59, y: 0.39, width: 0.08, height: 0.06 },
  { name: 'Umbilical Region', x: 0.5, y: 0.425, width: 0.12, height: 0.06 },
  { name: 'Right Lumbar', x: 0.41, y: 0.425, width: 0.08, height: 0.06 },
  { name: 'Left Lumbar', x: 0.59, y: 0.425, width: 0.08, height: 0.06 },
  { name: 'Hypogastric Region', x: 0.5, y: 0.46, width: 0.12, height: 0.06 },
  { name: 'Right Iliac Fossa', x: 0.41, y: 0.46, width: 0.08, height: 0.06 },
  { name: 'Left Iliac Fossa', x: 0.59, y: 0.46, width: 0.08, height: 0.06 },
  
  // PELVIC REGION
  { name: 'Pelvis', x: 0.5, y: 0.51, width: 0.17, height: 0.08 },
  
  // UPPER EXTREMITIES
  { name: 'Right Upper Arm', x: 0.325, y: 0.275, width: 0.04, height: 0.09 },
  { name: 'Left Upper Arm', x: 0.675, y: 0.275, width: 0.04, height: 0.09 },
  { name: 'Right Elbow', x: 0.29, y: 0.388, width: 0.05, height: 0.05 },
  { name: 'Left Elbow', x: 0.71, y: 0.388, width: 0.05, height: 0.05 },
  { name: 'Right Forearm', x: 0.295, y: 0.475, width: 0.04, height: 0.12 },
  { name: 'Left Forearm', x: 0.705, y: 0.475, width: 0.04, height: 0.12 },
  { name: 'Right Wrist', x: 0.295, y: 0.595, width: 0.04, height: 0.015 },
  { name: 'Left Wrist', x: 0.705, y: 0.595, width: 0.04, height: 0.015 },
  { name: 'Right Hand', x: 0.295, y: 0.635, width: 0.04, height: 0.065 },
  { name: 'Left Hand', x: 0.705, y: 0.635, width: 0.04, height: 0.065 },
  
  // LOWER EXTREMITIES
  { name: 'Right Thigh', x: 0.425, y: 0.625, width: 0.06, height: 0.125 },
  { name: 'Left Thigh', x: 0.575, y: 0.625, width: 0.06, height: 0.125 },
  { name: 'Right Knee', x: 0.41, y: 0.725, width: 0.06, height: 0.06 },
  { name: 'Left Knee', x: 0.59, y: 0.725, width: 0.06, height: 0.06 },
  { name: 'Right Lower Leg', x: 0.41, y: 0.82, width: 0.05, height: 0.1 },
  { name: 'Left Lower Leg', x: 0.59, y: 0.82, width: 0.05, height: 0.1 },
  { name: 'Right Ankle', x: 0.41, y: 0.888, width: 0.04, height: 0.04 },
  { name: 'Left Ankle', x: 0.59, y: 0.888, width: 0.04, height: 0.04 },
  { name: 'Right Foot', x: 0.41, y: 0.94, width: 0.08, height: 0.065 },
  { name: 'Left Foot', x: 0.59, y: 0.94, width: 0.08, height: 0.065 },
];

// Anatomically precise body regions for back view
const backBodyRegions = [
  // POSTERIOR HEAD AND NECK
  { name: 'Occipital Region', x: 0.5, y: 0.055, width: 0.22, height: 0.06 },
  { name: 'Posterior Neck', x: 0.5, y: 0.14, width: 0.1, height: 0.06 },
  { name: 'Cervical Spine', x: 0.5, y: 0.155, width: 0.04, height: 0.05 },
  
  // POSTERIOR SHOULDER REGION
  { name: 'Right Scapular Region', x: 0.38, y: 0.24, width: 0.1, height: 0.12 },
  { name: 'Left Scapular Region', x: 0.62, y: 0.24, width: 0.1, height: 0.12 },
  { name: 'Right Posterior Shoulder', x: 0.34, y: 0.21, width: 0.08, height: 0.06 },
  { name: 'Left Posterior Shoulder', x: 0.66, y: 0.21, width: 0.08, height: 0.06 },
  
  // POSTERIOR THORAX
  { name: 'Thoracic Spine', x: 0.5, y: 0.31, width: 0.04, height: 0.16 },
  { name: 'Right Posterior Thorax', x: 0.42, y: 0.31, width: 0.14, height: 0.16 },
  { name: 'Left Posterior Thorax', x: 0.58, y: 0.31, width: 0.14, height: 0.16 },
  
  // LUMBAR REGION
  { name: 'Lumbar Spine', x: 0.5, y: 0.45, width: 0.04, height: 0.08 },
  { name: 'Right Lumbar Region', x: 0.42, y: 0.45, width: 0.12, height: 0.08 },
  { name: 'Left Lumbar Region', x: 0.58, y: 0.45, width: 0.12, height: 0.08 },
  
  // SACRAL AND GLUTEAL REGION
  { name: 'Sacrum', x: 0.5, y: 0.52, width: 0.06, height: 0.04 },
  { name: 'Right Gluteal Region', x: 0.43, y: 0.55, width: 0.1, height: 0.08 },
  { name: 'Left Gluteal Region', x: 0.57, y: 0.55, width: 0.1, height: 0.08 },
  
  // POSTERIOR UPPER EXTREMITIES
  { name: 'Right Posterior Arm', x: 0.325, y: 0.3, width: 0.04, height: 0.12 },
  { name: 'Left Posterior Arm', x: 0.675, y: 0.3, width: 0.04, height: 0.12 },
  { name: 'Right Posterior Elbow', x: 0.29, y: 0.388, width: 0.05, height: 0.05 },
  { name: 'Left Posterior Elbow', x: 0.71, y: 0.388, width: 0.05, height: 0.05 },
  { name: 'Right Posterior Forearm', x: 0.295, y: 0.475, width: 0.04, height: 0.12 },
  { name: 'Left Posterior Forearm', x: 0.705, y: 0.475, width: 0.04, height: 0.12 },
  
  // POSTERIOR LOWER EXTREMITIES
  { name: 'Right Posterior Thigh', x: 0.425, y: 0.65, width: 0.06, height: 0.14 },
  { name: 'Left Posterior Thigh', x: 0.575, y: 0.65, width: 0.06, height: 0.14 },
  { name: 'Right Popliteal Fossa', x: 0.41, y: 0.73, width: 0.05, height: 0.04 },
  { name: 'Left Popliteal Fossa', x: 0.59, y: 0.73, width: 0.05, height: 0.04 },
  { name: 'Right Calf', x: 0.41, y: 0.82, width: 0.05, height: 0.1 },
  { name: 'Left Calf', x: 0.59, y: 0.82, width: 0.05, height: 0.1 },
  { name: 'Right Achilles', x: 0.41, y: 0.89, width: 0.03, height: 0.03 },
  { name: 'Left Achilles', x: 0.59, y: 0.89, width: 0.03, height: 0.03 },
  { name: 'Right Heel', x: 0.41, y: 0.95, width: 0.06, height: 0.04 },
  { name: 'Left Heel', x: 0.59, y: 0.95, width: 0.06, height: 0.04 },
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
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');

  const getBodyPartFromPosition = useCallback((x: number, y: number, view: 'front' | 'back') => {
    const relativeX = x / BODY_WIDTH;
    const relativeY = y / BODY_HEIGHT;

    // Select appropriate body regions based on view
    const bodyRegions = view === 'front' ? frontBodyRegions : backBodyRegions;

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
    
    setNewInjuryPosition({ x: locationX, y: locationY });
    setShowAddInjuryModal(true);
  }, []);

  const handleAddInjury = useCallback(() => {
    if (!newInjuryPosition || !injuryDescription.trim()) {
      Alert.alert('Error', 'Please provide a description for the injury');
      return;
    }

    const bodyPart = getBodyPartFromPosition(newInjuryPosition.x, newInjuryPosition.y, currentView);
    const newInjury: InjuryPoint = {
      id: Date.now().toString(),
      x: newInjuryPosition.x,
      y: newInjuryPosition.y,
      description: injuryDescription,
      severity: injurySeverity,
      bodyPart,
      view: currentView,
    };

    setInjuries([...injuries, newInjury]);
    setShowAddInjuryModal(false);
    setInjuryDescription('');
    setNewInjuryPosition(null);
  }, [newInjuryPosition, injuryDescription, injurySeverity, injuries, currentView, getBodyPartFromPosition]);

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

  // Filter injuries for current view
  const currentViewInjuries = injuries.filter(injury => injury.view === currentView);

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

        <View style={styles.viewToggleContainer}>
          <Text style={styles.instructions}>
            Tap on the body diagram to mark injury locations
          </Text>
          <TouchableOpacity
            style={styles.viewToggleButton}
            onPress={() => setCurrentView(currentView === 'front' ? 'back' : 'front')}
          >
            <RotateCw size={18} color="#0066CC" />
            <Text style={styles.viewToggleText}>
              {currentView === 'front' ? 'Show Back' : 'Show Front'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bodyContainer}>
          <View style={styles.viewIndicator}>
            <Text style={styles.viewIndicatorText}>
              {currentView === 'front' ? 'ANTERIOR VIEW' : 'POSTERIOR VIEW'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bodyDiagram}
            onPress={handleBodyPress}
            activeOpacity={1}
          >
            {/* Professional Medical Body Diagram */}
            <Image
              source={{ uri: BODY_IMAGES[currentView] }}
              style={styles.bodyImage}
              resizeMode="contain"
            />

            {/* Injury markers for current view */}
            {currentViewInjuries.map((injury) => (
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
            ))}
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
                      <Text style={styles.injuryItemBodyPart}>
                        {injury.bodyPart} ({injury.view === 'front' ? 'Front' : 'Back'})
                      </Text>
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
              {newInjuryPosition ? getBodyPartFromPosition(newInjuryPosition.x, newInjuryPosition.y, currentView) : ''}
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
              <Text style={styles.selectedInjuryView}>
                View: {selectedInjury.view === 'front' ? 'Anterior' : 'Posterior'}
              </Text>
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
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  instructions: {
    flex: 1,
    color: '#666',
    fontSize: 14,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  viewToggleText: {
    color: '#0066CC',
    fontSize: 14,
    fontWeight: '500',
  },
  bodyContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  viewIndicator: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  viewIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
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
    overflow: 'hidden',
  },
  bodyImage: {
    width: '100%',
    height: '100%',
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
    marginBottom: 8,
  },
  selectedInjuryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
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
  selectedInjuryView: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
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