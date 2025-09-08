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
} from "react-native";
import { X, User, AlertCircle, MapPin } from "lucide-react-native";

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
const BODY_WIDTH = screenWidth * 0.8;
const BODY_HEIGHT = screenHeight * 0.6;

const severityColors = {
  minor: '#FFC107',
  moderate: '#FF9800',
  severe: '#FF5722',
  critical: '#D32F2F',
};

const bodyParts = [
  { name: 'Head', x: 0.5, y: 0.08, width: 0.15, height: 0.1 },
  { name: 'Neck', x: 0.5, y: 0.15, width: 0.1, height: 0.05 },
  { name: 'Right Shoulder', x: 0.35, y: 0.2, width: 0.12, height: 0.08 },
  { name: 'Left Shoulder', x: 0.65, y: 0.2, width: 0.12, height: 0.08 },
  { name: 'Chest', x: 0.5, y: 0.28, width: 0.25, height: 0.15 },
  { name: 'Right Arm', x: 0.28, y: 0.35, width: 0.08, height: 0.2 },
  { name: 'Left Arm', x: 0.72, y: 0.35, width: 0.08, height: 0.2 },
  { name: 'Abdomen', x: 0.5, y: 0.42, width: 0.22, height: 0.12 },
  { name: 'Pelvis', x: 0.5, y: 0.52, width: 0.22, height: 0.08 },
  { name: 'Right Thigh', x: 0.42, y: 0.62, width: 0.1, height: 0.15 },
  { name: 'Left Thigh', x: 0.58, y: 0.62, width: 0.1, height: 0.15 },
  { name: 'Right Knee', x: 0.42, y: 0.75, width: 0.08, height: 0.05 },
  { name: 'Left Knee', x: 0.58, y: 0.75, width: 0.08, height: 0.05 },
  { name: 'Right Lower Leg', x: 0.42, y: 0.82, width: 0.08, height: 0.12 },
  { name: 'Left Lower Leg', x: 0.58, y: 0.82, width: 0.08, height: 0.12 },
  { name: 'Right Foot', x: 0.42, y: 0.94, width: 0.08, height: 0.05 },
  { name: 'Left Foot', x: 0.58, y: 0.94, width: 0.08, height: 0.05 },
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

    for (const part of bodyParts) {
      const leftBound = part.x - part.width / 2;
      const rightBound = part.x + part.width / 2;
      const topBound = part.y - part.height / 2;
      const bottomBound = part.y + part.height / 2;

      if (
        relativeX >= leftBound &&
        relativeX <= rightBound &&
        relativeY >= topBound &&
        relativeY <= bottomBound
      ) {
        return part.name;
      }
    }
    return 'Body';
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
            {/* Body SVG representation */}
            <View style={styles.bodyOutline}>
              {/* Head */}
              <View style={[styles.head]} />
              {/* Neck */}
              <View style={[styles.neck]} />
              {/* Torso */}
              <View style={[styles.torso]} />
              {/* Arms */}
              <View style={[styles.leftArm]} />
              <View style={[styles.rightArm]} />
              {/* Legs */}
              <View style={[styles.leftLeg]} />
              <View style={[styles.rightLeg]} />
            </View>

            {/* Injury markers */}
            {injuries.map((injury) => (
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
        <View style={styles.modalOverlay}>
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
        </View>
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
  bodyOutline: {
    flex: 1,
    position: 'relative',
  },
  head: {
    position: 'absolute',
    width: BODY_WIDTH * 0.15,
    height: BODY_HEIGHT * 0.1,
    backgroundColor: '#E8F4F8',
    borderRadius: BODY_WIDTH * 0.075,
    left: BODY_WIDTH * 0.425,
    top: BODY_HEIGHT * 0.03,
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  neck: {
    position: 'absolute',
    width: BODY_WIDTH * 0.08,
    height: BODY_HEIGHT * 0.05,
    backgroundColor: '#E8F4F8',
    left: BODY_WIDTH * 0.46,
    top: BODY_HEIGHT * 0.125,
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  torso: {
    position: 'absolute',
    width: BODY_WIDTH * 0.3,
    height: BODY_HEIGHT * 0.35,
    backgroundColor: '#E8F4F8',
    borderRadius: 20,
    left: BODY_WIDTH * 0.35,
    top: BODY_HEIGHT * 0.17,
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  leftArm: {
    position: 'absolute',
    width: BODY_WIDTH * 0.08,
    height: BODY_HEIGHT * 0.3,
    backgroundColor: '#E8F4F8',
    borderRadius: 20,
    left: BODY_WIDTH * 0.68,
    top: BODY_HEIGHT * 0.2,
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  rightArm: {
    position: 'absolute',
    width: BODY_WIDTH * 0.08,
    height: BODY_HEIGHT * 0.3,
    backgroundColor: '#E8F4F8',
    borderRadius: 20,
    left: BODY_WIDTH * 0.24,
    top: BODY_HEIGHT * 0.2,
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  leftLeg: {
    position: 'absolute',
    width: BODY_WIDTH * 0.1,
    height: BODY_HEIGHT * 0.4,
    backgroundColor: '#E8F4F8',
    borderRadius: 20,
    left: BODY_WIDTH * 0.53,
    top: BODY_HEIGHT * 0.52,
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  rightLeg: {
    position: 'absolute',
    width: BODY_WIDTH * 0.1,
    height: BODY_HEIGHT * 0.4,
    backgroundColor: '#E8F4F8',
    borderRadius: 20,
    left: BODY_WIDTH * 0.37,
    top: BODY_HEIGHT * 0.52,
    borderWidth: 2,
    borderColor: '#0066CC',
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