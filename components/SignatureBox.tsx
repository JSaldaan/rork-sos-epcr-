import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { Trash2, Edit3 } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

interface SignatureBoxProps {
  title: string;
  onSignatureChange: (signature: string) => void;
  signature?: string;
  height?: number;
  width?: number;
  onDrawStart?: () => void;
  onDrawEnd?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

interface Point {
  x: number;
  y: number;
}

export default function SignatureBox({ 
  title, 
  onSignatureChange, 
  signature = '', 
  height = 150,
  width = screenWidth - 64,
  onDrawStart,
  onDrawEnd
}: SignatureBoxProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dimensions, setDimensions] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const currentPathRef = useRef<Point[]>([]);
  const pathsRef = useRef<string[]>([]);
  const viewRef = useRef<View>(null);

  // Initialize paths from signature prop
  useEffect(() => {
    if (signature) {
      const initialPaths = signature.split('|').filter(p => p);
      setPaths(initialPaths);
      pathsRef.current = initialPaths;
    }
  }, [signature]);

  // Convert points array to SVG path string
  const pointsToSvgPath = useCallback((points: Point[]): string => {
    if (points.length < 2) return '';
    
    let path = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i].x.toFixed(1)},${points[i].y.toFixed(1)}`;
    }
    
    return path;
  }, []);

  // Create PanResponder for handling touch events
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        console.log('🎨 Touch started');
        onDrawStart?.();
        setIsDrawing(true);
        
        const { locationX, locationY } = evt.nativeEvent;
        
        const point = {
          x: Math.max(0, Math.min(locationX, dimensions.width || width)),
          y: Math.max(0, Math.min(locationY, dimensions.height || height))
        };
        
        currentPathRef.current = [point];
        setCurrentPath([point]);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        
        const point = {
          x: Math.max(0, Math.min(locationX, dimensions.width || width)),
          y: Math.max(0, Math.min(locationY, dimensions.height || height))
        };
        
        const updatedPath = [...currentPathRef.current, point];
        currentPathRef.current = updatedPath;
        setCurrentPath(updatedPath);
      },
      onPanResponderRelease: () => {
        console.log('✅ Touch ended');
        onDrawEnd?.();
        setIsDrawing(false);
        
        if (currentPathRef.current.length > 3) {
          const svgPath = pointsToSvgPath(currentPathRef.current);
          if (svgPath) {
            const newPaths = [...pathsRef.current, svgPath];
            pathsRef.current = newPaths;
            setPaths(newPaths);
            onSignatureChange(newPaths.join('|'));
            console.log('💾 Signature saved with', currentPathRef.current.length, 'points');
          }
        }
        
        currentPathRef.current = [];
        setCurrentPath([]);
      },
      onPanResponderTerminate: () => {
        setIsDrawing(false);
        currentPathRef.current = [];
        setCurrentPath([]);
      },
    })
  ).current;

  // Update panResponder when dimensions change
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.measure((x, y, w, h, pageX, pageY) => {
        setDimensions({ x: pageX, y: pageY, width: w, height: h });
      });
    }
  }, [width, height]);

  const clearSignature = useCallback(() => {
    setPaths([]);
    setCurrentPath([]);
    currentPathRef.current = [];
    pathsRef.current = [];
    onSignatureChange('');
    console.log('🗑️ Signature cleared');
  }, [onSignatureChange]);

  const hasSignature = paths.length > 0 || currentPath.length > 0;
  const currentSvgPath = pointsToSvgPath(currentPath);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Edit3 size={16} color="#0066CC" />
        <Text style={styles.title}>{title}</Text>
        {hasSignature && (
          <TouchableOpacity onPress={clearSignature} style={styles.clearButton}>
            <Trash2 size={16} color="#DC3545" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View 
        ref={viewRef}
        style={[
          styles.signatureArea, 
          { height, width },
          isDrawing && styles.signatureAreaActive
        ]}
        {...panResponder.panHandlers}
      >
        <Svg 
          height={height} 
          width={width} 
          style={styles.svg}
          pointerEvents="none"
        >
          {paths.map((path, index) => (
            <Path
              key={`path-${index}`}
              d={path}
              stroke="#1a1a1a"
              strokeWidth="2.5"
              fill="transparent"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentSvgPath && (
            <Path
              d={currentSvgPath}
              stroke="#0066CC"
              strokeWidth="2.5"
              fill="transparent"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
        
        {!hasSignature && (
          <View style={styles.placeholder} pointerEvents="none">
            <Edit3 size={24} color="#CCC" />
            <Text style={styles.placeholderText}>Sign here with your finger</Text>
          </View>
        )}
      </View>
      
      {hasSignature && (
        <View style={styles.signatureStatus}>
          <Text style={styles.signatureStatusText}>Signature captured</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FFF5F5',
  },
  clearText: {
    color: '#DC3545',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  signatureArea: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
    position: 'relative',
    overflow: 'hidden',
  },
  signatureAreaActive: {
    borderColor: '#0066CC',
    backgroundColor: '#F0F7FF',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#CCC',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  signatureStatus: {
    marginTop: 8,
    alignItems: 'center',
  },
  signatureStatusText: {
    color: '#28A745',
    fontSize: 12,
    fontWeight: '500',
  },
});