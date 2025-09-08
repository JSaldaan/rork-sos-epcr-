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

// Anatomically precise body regions with medical terminology
const bodyRegions = [
  // CRANIUM AND FACIAL REGION
  { name: 'Cranium (Skull)', x: 0.5, y: 0.065, width: 0.25, height: 0.08 },
  { name: 'Frontal Region (Forehead)', x: 0.5, y: 0.055, width: 0.2, height: 0.04 },
  { name: 'Orbital Region (Eyes)', x: 0.45, y: 0.08, width: 0.04, height: 0.02 },
  { name: 'Orbital Region (Eyes)', x: 0.55, y: 0.08, width: 0.04, height: 0.02 },
  { name: 'Nasal Region (Nose)', x: 0.5, y: 0.095, width: 0.03, height: 0.025 },
  { name: 'Oral Region (Mouth)', x: 0.5, y: 0.11, width: 0.06, height: 0.02 },
  { name: 'Mandibular Region (Jaw)', x: 0.5, y: 0.12, width: 0.12, height: 0.03 },
  { name: 'Temporal Region', x: 0.375, y: 0.075, width: 0.05, height: 0.06 },
  { name: 'Temporal Region', x: 0.625, y: 0.075, width: 0.05, height: 0.06 },
  
  // CERVICAL REGION
  { name: 'Cervical Spine (C1-C7)', x: 0.5, y: 0.155, width: 0.06, height: 0.05 },
  { name: 'Anterior Neck', x: 0.5, y: 0.155, width: 0.08, height: 0.05 },
  { name: 'Right Sternocleidomastoid', x: 0.44, y: 0.16, width: 0.04, height: 0.04 },
  { name: 'Left Sternocleidomastoid', x: 0.56, y: 0.16, width: 0.04, height: 0.04 },
  
  // SHOULDER GIRDLE
  { name: 'Right Clavicle', x: 0.41, y: 0.18, width: 0.11, height: 0.02 },
  { name: 'Left Clavicle', x: 0.59, y: 0.18, width: 0.11, height: 0.02 },
  { name: 'Right Acromion', x: 0.36, y: 0.185, width: 0.04, height: 0.04 },
  { name: 'Left Acromion', x: 0.64, y: 0.185, width: 0.04, height: 0.04 },
  { name: 'Right Scapula', x: 0.375, y: 0.24, width: 0.06, height: 0.1 },
  { name: 'Left Scapula', x: 0.625, y: 0.24, width: 0.06, height: 0.1 },
  
  // THORACIC REGION
  { name: 'Sternum', x: 0.5, y: 0.26, width: 0.02, height: 0.11 },
  { name: 'Right Thorax (Chest)', x: 0.44, y: 0.26, width: 0.12, height: 0.15 },
  { name: 'Left Thorax (Chest)', x: 0.56, y: 0.26, width: 0.12, height: 0.15 },
  { name: 'Right Pectoral Region', x: 0.43, y: 0.22, width: 0.08, height: 0.06 },
  { name: 'Left Pectoral Region', x: 0.57, y: 0.22, width: 0.08, height: 0.06 },
  { name: 'Xiphoid Process', x: 0.5, y: 0.318, width: 0.015, height: 0.015 },
  
  // ABDOMINAL REGION
  { name: 'Epigastric Region', x: 0.5, y: 0.39, width: 0.12, height: 0.06 },
  { name: 'Right Hypochondriac', x: 0.41, y: 0.39, width: 0.08, height: 0.06 },
  { name: 'Left Hypochondriac', x: 0.59, y: 0.39, width: 0.08, height: 0.06 },
  { name: 'Umbilical Region', x: 0.5, y: 0.425, width: 0.12, height: 0.06 },
  { name: 'Right Lumbar Region', x: 0.41, y: 0.425, width: 0.08, height: 0.06 },
  { name: 'Left Lumbar Region', x: 0.59, y: 0.425, width: 0.08, height: 0.06 },
  { name: 'Hypogastric Region', x: 0.5, y: 0.46, width: 0.12, height: 0.06 },
  { name: 'Right Iliac Fossa', x: 0.41, y: 0.46, width: 0.08, height: 0.06 },
  { name: 'Left Iliac Fossa', x: 0.59, y: 0.46, width: 0.08, height: 0.06 },
  
  // PELVIC REGION
  { name: 'Pelvis', x: 0.5, y: 0.51, width: 0.17, height: 0.08 },
  { name: 'Right Iliac Crest', x: 0.425, y: 0.5, width: 0.06, height: 0.03 },
  { name: 'Left Iliac Crest', x: 0.575, y: 0.5, width: 0.06, height: 0.03 },
  { name: 'Right Hip Joint', x: 0.44, y: 0.54, width: 0.04, height: 0.04 },
  { name: 'Left Hip Joint', x: 0.56, y: 0.54, width: 0.04, height: 0.04 },
  
  // UPPER EXTREMITIES
  { name: 'Right Deltoid', x: 0.36, y: 0.21, width: 0.08, height: 0.06 },
  { name: 'Left Deltoid', x: 0.64, y: 0.21, width: 0.08, height: 0.06 },
  { name: 'Right Humerus', x: 0.325, y: 0.275, width: 0.04, height: 0.09 },
  { name: 'Left Humerus', x: 0.675, y: 0.275, width: 0.04, height: 0.09 },
  { name: 'Right Bicep', x: 0.325, y: 0.3, width: 0.03, height: 0.075 },
  { name: 'Left Bicep', x: 0.675, y: 0.3, width: 0.03, height: 0.075 },
  { name: 'Right Elbow Joint', x: 0.29, y: 0.388, width: 0.05, height: 0.05 },
  { name: 'Left Elbow Joint', x: 0.71, y: 0.388, width: 0.05, height: 0.05 },
  { name: 'Right Radius', x: 0.275, y: 0.475, width: 0.025, height: 0.1 },
  { name: 'Right Ulna', x: 0.31, y: 0.475, width: 0.025, height: 0.1 },
  { name: 'Left Radius', x: 0.69, y: 0.475, width: 0.025, height: 0.1 },
  { name: 'Left Ulna', x: 0.725, y: 0.475, width: 0.025, height: 0.1 },
  { name: 'Right Wrist', x: 0.295, y: 0.595, width: 0.04, height: 0.015 },
  { name: 'Left Wrist', x: 0.705, y: 0.595, width: 0.04, height: 0.015 },
  { name: 'Right Hand', x: 0.295, y: 0.635, width: 0.04, height: 0.065 },
  { name: 'Left Hand', x: 0.705, y: 0.635, width: 0.04, height: 0.065 },
  
  // LOWER EXTREMITIES
  { name: 'Right Femur', x: 0.425, y: 0.625, width: 0.05, height: 0.125 },
  { name: 'Left Femur', x: 0.575, y: 0.625, width: 0.05, height: 0.125 },
  { name: 'Right Quadriceps', x: 0.425, y: 0.625, width: 0.06, height: 0.11 },
  { name: 'Left Quadriceps', x: 0.575, y: 0.625, width: 0.06, height: 0.11 },
  { name: 'Right Patella (Kneecap)', x: 0.41, y: 0.725, width: 0.03, height: 0.04 },
  { name: 'Left Patella (Kneecap)', x: 0.59, y: 0.725, width: 0.03, height: 0.04 },
  { name: 'Right Knee Joint', x: 0.41, y: 0.725, width: 0.06, height: 0.06 },
  { name: 'Left Knee Joint', x: 0.59, y: 0.725, width: 0.06, height: 0.06 },
  { name: 'Right Tibia', x: 0.41, y: 0.8, width: 0.03, height: 0.1 },
  { name: 'Right Fibula', x: 0.43, y: 0.8, width: 0.02, height: 0.1 },
  { name: 'Left Tibia', x: 0.59, y: 0.8, width: 0.03, height: 0.1 },
  { name: 'Left Fibula', x: 0.57, y: 0.8, width: 0.02, height: 0.1 },
  { name: 'Right Gastrocnemius (Calf)', x: 0.41, y: 0.8, width: 0.04, height: 0.075 },
  { name: 'Left Gastrocnemius (Calf)', x: 0.59, y: 0.8, width: 0.04, height: 0.075 },
  { name: 'Right Ankle Joint', x: 0.41, y: 0.888, width: 0.04, height: 0.04 },
  { name: 'Left Ankle Joint', x: 0.59, y: 0.888, width: 0.04, height: 0.04 },
  { name: 'Right Foot', x: 0.41, y: 0.94, width: 0.08, height: 0.065 },
  { name: 'Left Foot', x: 0.59, y: 0.94, width: 0.08, height: 0.065 },
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
            {/* Anatomically Accurate Medical Body Diagram */}
            <Svg
              width={BODY_WIDTH}
              height={BODY_HEIGHT}
              viewBox="0 0 200 400"
              style={styles.svgBody}
            >
              <G>
                {/* CRANIUM AND HEAD */}
                {/* Skull outline */}
                <Path d="M 78 15 Q 100 8 122 15 Q 128 20 128 30 Q 128 40 125 45 Q 120 50 115 52 L 85 52 Q 80 50 75 45 Q 72 40 72 30 Q 72 20 78 15 Z" 
                      fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.2" />
                
                {/* Temporal bones */}
                <Path d="M 75 25 Q 70 30 70 35 Q 70 40 75 42" fill="none" stroke="#4A5568" strokeWidth="0.8" />
                <Path d="M 125 25 Q 130 30 130 35 Q 130 40 125 42" fill="none" stroke="#4A5568" strokeWidth="0.8" />
                
                {/* Facial bones structure */}
                <Path d="M 85 35 L 85 45 Q 85 48 88 48 L 112 48 Q 115 48 115 45 L 115 35" 
                      fill="#FFF8F0" stroke="#4A5568" strokeWidth="1" />
                
                {/* Mandible (jaw) */}
                <Path d="M 88 48 Q 100 52 112 48" fill="none" stroke="#2D3748" strokeWidth="1.2" />
                
                {/* Eye sockets (orbital cavities) */}
                <Ellipse cx="90" cy="32" rx="6" ry="4" fill="none" stroke="#718096" strokeWidth="0.8" />
                <Ellipse cx="110" cy="32" rx="6" ry="4" fill="none" stroke="#718096" strokeWidth="0.8" />
                
                {/* Nasal cavity */}
                <Path d="M 98 35 L 98 42 M 102 35 L 102 42 M 96 40 L 104 40" stroke="#718096" strokeWidth="0.6" />
                
                {/* CERVICAL SPINE AND NECK */}
                <Rect x="94" y="52" width="12" height="20" fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.2" rx="2" />
                
                {/* Cervical vertebrae indication */}
                <Line x1="100" y1="55" x2="100" y2="70" stroke="#E2E8F0" strokeWidth="0.6" />
                <Circle cx="100" cy="58" r="1" fill="#E2E8F0" />
                <Circle cx="100" cy="63" r="1" fill="#E2E8F0" />
                <Circle cx="100" cy="68" r="1" fill="#E2E8F0" />
                
                {/* Sternocleidomastoid muscles */}
                <Path d="M 94 60 Q 88 65 85 72" fill="none" stroke="#CBD5E0" strokeWidth="1" />
                <Path d="M 106 60 Q 112 65 115 72" fill="none" stroke="#CBD5E0" strokeWidth="1" />
                
                {/* SHOULDER GIRDLE */}
                {/* Clavicles (collar bones) */}
                <Path d="M 72 72 Q 85 68 94 70" fill="none" stroke="#2D3748" strokeWidth="1.5" />
                <Path d="M 106 70 Q 115 68 128 72" fill="none" stroke="#2D3748" strokeWidth="1.5" />
                
                {/* Acromion processes */}
                <Circle cx="72" cy="74" r="4" fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.2" />
                <Circle cx="128" cy="74" r="4" fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.2" />
                
                {/* Scapulae (shoulder blades) outline */}
                <Path d="M 75 75 L 82 85 L 82 105 L 75 115 L 70 110 L 70 80 Z" 
                      fill="none" stroke="#CBD5E0" strokeWidth="0.8" />
                <Path d="M 125 75 L 118 85 L 118 105 L 125 115 L 130 110 L 130 80 Z" 
                      fill="none" stroke="#CBD5E0" strokeWidth="0.8" />
                
                {/* THORACIC CAVITY */}
                {/* Ribcage outline */}
                <Path d="M 78 78 Q 75 85 75 95 L 75 125 Q 75 135 80 140 L 85 145 Q 90 148 95 150 L 105 150 Q 110 148 115 145 L 120 140 Q 125 135 125 125 L 125 95 Q 125 85 122 78"
                      fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.5" />
                
                {/* Individual ribs */}
                <Path d="M 80 85 Q 100 82 120 85" stroke="#CBD5E0" strokeWidth="0.8" fill="none" />
                <Path d="M 79 92 Q 100 89 121 92" stroke="#CBD5E0" strokeWidth="0.8" fill="none" />
                <Path d="M 78 99 Q 100 96 122 99" stroke="#CBD5E0" strokeWidth="0.8" fill="none" />
                <Path d="M 77 106 Q 100 103 123 106" stroke="#CBD5E0" strokeWidth="0.8" fill="none" />
                <Path d="M 78 113 Q 100 110 122 113" stroke="#CBD5E0" strokeWidth="0.8" fill="none" />
                <Path d="M 79 120 Q 100 117 121 120" stroke="#CBD5E0" strokeWidth="0.8" fill="none" />
                
                {/* Sternum */}
                <Rect x="98" y="82" width="4" height="45" fill="none" stroke="#4A5568" strokeWidth="1" rx="1" />
                
                {/* Heart outline */}
                <Path d="M 92 95 Q 88 92 88 98 Q 88 104 92 108 Q 96 112 100 115 Q 104 112 108 108 Q 112 104 112 98 Q 112 92 108 95 Q 104 92 100 95 Q 96 92 92 95 Z" 
                      fill="none" stroke="#E53E3E" strokeWidth="0.8" strokeDasharray="2,1" />
                
                {/* Lungs outline */}
                <Ellipse cx="88" cy="105" rx="12" ry="18" fill="none" stroke="#3182CE" strokeWidth="0.8" strokeDasharray="2,1" />
                <Ellipse cx="112" cy="105" rx="12" ry="18" fill="none" stroke="#3182CE" strokeWidth="0.8" strokeDasharray="2,1" />
                
                {/* ABDOMINAL CAVITY */}
                <Path d="M 85 145 Q 80 150 80 160 L 80 180 Q 80 190 85 195 L 90 200 Q 95 202 100 202 Q 105 202 110 200 L 115 195 Q 120 190 120 180 L 120 160 Q 120 150 115 145"
                      fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.5" />
                
                {/* Rectus abdominis (six-pack) */}
                <Line x1="100" y1="150" x2="100" y2="195" stroke="#CBD5E0" strokeWidth="0.8" />
                <Path d="M 88 158 L 112 158" stroke="#CBD5E0" strokeWidth="0.6" />
                <Path d="M 88 168 L 112 168" stroke="#CBD5E0" strokeWidth="0.6" />
                <Path d="M 88 178 L 112 178" stroke="#CBD5E0" strokeWidth="0.6" />
                <Path d="M 88 188 L 112 188" stroke="#CBD5E0" strokeWidth="0.6" />
                
                {/* Liver outline */}
                <Path d="M 102 152 Q 118 150 118 165 Q 118 175 110 178 Q 102 180 102 170 Z" 
                      fill="none" stroke="#D69E2E" strokeWidth="0.8" strokeDasharray="2,1" />
                
                {/* Stomach outline */}
                <Path d="M 85 155 Q 82 160 85 168 Q 88 175 95 175 Q 98 172 98 165 Q 98 158 95 155 Q 90 152 85 155 Z" 
                      fill="none" stroke="#38A169" strokeWidth="0.8" strokeDasharray="2,1" />
                
                {/* PELVIC GIRDLE */}
                <Path d="M 85 195 Q 82 205 85 215 L 90 220 Q 95 222 100 222 Q 105 222 110 220 L 115 215 Q 118 205 115 195"
                      fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.5" />
                
                {/* Iliac crests */}
                <Path d="M 85 200 Q 80 205 80 210" fill="none" stroke="#4A5568" strokeWidth="1" />
                <Path d="M 115 200 Q 120 205 120 210" fill="none" stroke="#4A5568" strokeWidth="1" />
                
                {/* Hip joints */}
                <Circle cx="88" cy="215" r="4" fill="none" stroke="#4A5568" strokeWidth="1" />
                <Circle cx="112" cy="215" r="4" fill="none" stroke="#4A5568" strokeWidth="1" />
                
                {/* UPPER EXTREMITIES */}
                {/* Right arm */}
                <Path d="M 72 78 Q 68 85 65 95 L 62 125 Q 60 140 58 155" fill="none" stroke="#2D3748" strokeWidth="1.8" />
                
                {/* Right humerus */}
                <Ellipse cx="65" cy="110" rx="4" ry="18" fill="none" stroke="#CBD5E0" strokeWidth="0.8" />
                
                {/* Right elbow joint */}
                <Circle cx="58" cy="155" r="5" fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.2" />
                
                {/* Right forearm (radius and ulna) */}
                <Path d="M 58 160 Q 56 175 54 190 L 52 210 Q 50 225 48 240" fill="none" stroke="#2D3748" strokeWidth="1.5" />
                <Path d="M 58 160 Q 60 175 62 190 L 64 210 Q 66 225 68 240" fill="none" stroke="#CBD5E0" strokeWidth="0.8" />
                
                {/* Right wrist */}
                <Rect x="55" y="238" width="8" height="6" fill="#FFF8F0" stroke="#2D3748" strokeWidth="1" rx="2" />
                
                {/* Right hand */}
                <Path d="M 55 244 L 55 260 Q 55 265 58 265 L 60 265 Q 63 265 63 260 L 63 244"
                      fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.2" />
                
                {/* Right fingers */}
                <Path d="M 56 265 L 56 272 M 58 265 L 58 274 M 60 265 L 60 274 M 62 265 L 62 272" 
                      stroke="#2D3748" strokeWidth="0.8" />
                
                {/* Left arm */}
                <Path d="M 128 78 Q 132 85 135 95 L 138 125 Q 140 140 142 155" fill="none" stroke="#2D3748" strokeWidth="1.8" />
                
                {/* Left humerus */}
                <Ellipse cx="135" cy="110" rx="4" ry="18" fill="none" stroke="#CBD5E0" strokeWidth="0.8" />
                
                {/* Left elbow joint */}
                <Circle cx="142" cy="155" r="5" fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.2" />
                
                {/* Left forearm (radius and ulna) */}
                <Path d="M 142 160 Q 144 175 146 190 L 148 210 Q 150 225 152 240" fill="none" stroke="#2D3748" strokeWidth="1.5" />
                <Path d="M 142 160 Q 140 175 138 190 L 136 210 Q 134 225 132 240" fill="none" stroke="#CBD5E0" strokeWidth="0.8" />
                
                {/* Left wrist */}
                <Rect x="137" y="238" width="8" height="6" fill="#FFF8F0" stroke="#2D3748" strokeWidth="1" rx="2" />
                
                {/* Left hand */}
                <Path d="M 145 244 L 145 260 Q 145 265 142 265 L 140 265 Q 137 265 137 260 L 137 244"
                      fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.2" />
                
                {/* Left fingers */}
                <Path d="M 144 265 L 144 272 M 142 265 L 142 274 M 140 265 L 140 274 M 138 265 L 138 272" 
                      stroke="#2D3748" strokeWidth="0.8" />
                
                {/* LOWER EXTREMITIES */}
                {/* Right leg */}
                <Path d="M 88 220 Q 86 240 84 260 L 82 290" fill="none" stroke="#2D3748" strokeWidth="1.8" />
                
                {/* Right femur */}
                <Ellipse cx="85" cy="250" rx="5" ry="25" fill="none" stroke="#CBD5E0" strokeWidth="0.8" />
                
                {/* Right knee joint */}
                <Circle cx="82" cy="290" r="6" fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.2" />
                
                {/* Right tibia and fibula */}
                <Path d="M 82 296 Q 80 315 78 335 L 76 355" fill="none" stroke="#2D3748" strokeWidth="1.5" />
                <Path d="M 82 296 Q 84 315 86 335 L 88 355" fill="none" stroke="#CBD5E0" strokeWidth="0.8" />
                
                {/* Right ankle */}
                <Circle cx="82" cy="355" r="4" fill="#FFF8F0" stroke="#2D3748" strokeWidth="1" />
                
                {/* Right foot */}
                <Path d="M 76 355 Q 70 360 70 365 L 70 375 Q 70 380 75 380 L 90 380 Q 95 380 95 375 L 95 365 Q 95 360 90 355"
                      fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.2" />
                
                {/* Right toes */}
                <Path d="M 75 380 L 75 385 M 78 380 L 78 387 M 81 380 L 81 387 M 84 380 L 84 387 M 87 380 L 87 385" 
                      stroke="#2D3748" strokeWidth="0.8" />
                
                {/* Left leg */}
                <Path d="M 112 220 Q 114 240 116 260 L 118 290" fill="none" stroke="#2D3748" strokeWidth="1.8" />
                
                {/* Left femur */}
                <Ellipse cx="115" cy="250" rx="5" ry="25" fill="none" stroke="#CBD5E0" strokeWidth="0.8" />
                
                {/* Left knee joint */}
                <Circle cx="118" cy="290" r="6" fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.2" />
                
                {/* Left tibia and fibula */}
                <Path d="M 118 296 Q 120 315 122 335 L 124 355" fill="none" stroke="#2D3748" strokeWidth="1.5" />
                <Path d="M 118 296 Q 116 315 114 335 L 112 355" fill="none" stroke="#CBD5E0" strokeWidth="0.8" />
                
                {/* Left ankle */}
                <Circle cx="118" cy="355" r="4" fill="#FFF8F0" stroke="#2D3748" strokeWidth="1" />
                
                {/* Left foot */}
                <Path d="M 124 355 Q 130 360 130 365 L 130 375 Q 130 380 125 380 L 110 380 Q 105 380 105 375 L 105 365 Q 105 360 110 355"
                      fill="#FFF8F0" stroke="#2D3748" strokeWidth="1.2" />
                
                {/* Left toes */}
                <Path d="M 125 380 L 125 385 M 122 380 L 122 387 M 119 380 L 119 387 M 116 380 L 116 387 M 113 380 L 113 385" 
                      stroke="#2D3748" strokeWidth="0.8" />
                
                {/* MAJOR MUSCLE GROUPS */}
                {/* Deltoids */}
                <Ellipse cx="72" cy="85" rx="8" ry="12" fill="none" stroke="#E2E8F0" strokeWidth="0.6" strokeDasharray="1,1" />
                <Ellipse cx="128" cy="85" rx="8" ry="12" fill="none" stroke="#E2E8F0" strokeWidth="0.6" strokeDasharray="1,1" />
                
                {/* Pectorals */}
                <Path d="M 85 88 Q 95 85 100 88 Q 105 85 115 88 Q 112 95 100 98 Q 88 95 85 88" 
                      fill="none" stroke="#E2E8F0" strokeWidth="0.6" strokeDasharray="1,1" />
                
                {/* Biceps */}
                <Ellipse cx="65" cy="120" rx="3" ry="15" fill="none" stroke="#E2E8F0" strokeWidth="0.6" strokeDasharray="1,1" />
                <Ellipse cx="135" cy="120" rx="3" ry="15" fill="none" stroke="#E2E8F0" strokeWidth="0.6" strokeDasharray="1,1" />
                
                {/* Quadriceps */}
                <Ellipse cx="85" cy="250" rx="6" ry="22" fill="none" stroke="#E2E8F0" strokeWidth="0.6" strokeDasharray="1,1" />
                <Ellipse cx="115" cy="250" rx="6" ry="22" fill="none" stroke="#E2E8F0" strokeWidth="0.6" strokeDasharray="1,1" />
                
                {/* Gastrocnemius (calf muscles) */}
                <Ellipse cx="82" cy="320" rx="4" ry="15" fill="none" stroke="#E2E8F0" strokeWidth="0.6" strokeDasharray="1,1" />
                <Ellipse cx="118" cy="320" rx="4" ry="15" fill="none" stroke="#E2E8F0" strokeWidth="0.6" strokeDasharray="1,1" />
                
                {/* ANATOMICAL LANDMARKS */}
                {/* Xiphoid process */}
                <Circle cx="100" cy="127" r="1.5" fill="#4A5568" />
                
                {/* Umbilicus (navel) */}
                <Circle cx="100" cy="170" r="2" fill="none" stroke="#4A5568" strokeWidth="0.8" />
                
                {/* Anterior superior iliac spines */}
                <Circle cx="85" cy="200" r="1" fill="#4A5568" />
                <Circle cx="115" cy="200" r="1" fill="#4A5568" />
                
                {/* Patellae (kneecaps) */}
                <Ellipse cx="82" cy="290" rx="3" ry="4" fill="none" stroke="#4A5568" strokeWidth="0.8" />
                <Ellipse cx="118" cy="290" rx="3" ry="4" fill="none" stroke="#4A5568" strokeWidth="0.8" />
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