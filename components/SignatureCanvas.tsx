import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Trash2, Edit3 } from 'lucide-react-native';
import Svg, { Path, G } from 'react-native-svg';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';

interface SignatureCanvasProps {
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

export default function SignatureCanvas({ 
  title, 
  onSignatureChange, 
  signature = '', 
  height = 150,
  width = screenWidth - 64,
  onDrawStart,
  onDrawEnd
}: SignatureCanvasProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const pathsRef = useRef<string[]>([]);
  const currentPathRef = useRef<Point[]>([]);

  // Initialize paths from signature prop
  useEffect(() => {
    if (signature) {
      const initialPaths = signature.split('|').filter(p => p);
      setPaths(initialPaths);
      pathsRef.current = initialPaths;
    }
  }, [signature]);

  const pointsToSvgPath = useCallback((points: Point[]): string => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    
    // Use quadratic bezier curves for smoother lines
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      path += ` Q ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}, ${xc.toFixed(2)} ${yc.toFixed(2)}`;
    }
    
    // Add the last point
    if (points.length > 1) {
      path += ` L ${points[points.length - 1].x.toFixed(2)} ${points[points.length - 1].y.toFixed(2)}`;
    }
    
    return path;
  }, []);

  const handleGestureEvent = useCallback((event: PanGestureHandlerGestureEvent) => {
    const { x, y } = event.nativeEvent;
    
    // Ensure coordinates are within bounds
    const boundedX = Math.max(0, Math.min(x, width));
    const boundedY = Math.max(0, Math.min(y, height));
    
    const newPoint = { x: boundedX, y: boundedY };
    const updatedPath = [...currentPathRef.current, newPoint];
    currentPathRef.current = updatedPath;
    setCurrentPath(updatedPath);
  }, [width, height]);

  const handleStateChange = useCallback((event: PanGestureHandlerGestureEvent) => {
    const { state } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      console.log('🎨 Drawing started');
      setIsDrawing(true);
      onDrawStart?.();
      
      const { x, y } = event.nativeEvent;
      const boundedX = Math.max(0, Math.min(x, width));
      const boundedY = Math.max(0, Math.min(y, height));
      
      currentPathRef.current = [{ x: boundedX, y: boundedY }];
      setCurrentPath([{ x: boundedX, y: boundedY }]);
    } else if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      console.log('✅ Drawing ended');
      setIsDrawing(false);
      onDrawEnd?.();
      
      // Save the path if it has enough points
      if (currentPathRef.current.length > 2) {
        const svgPath = pointsToSvgPath(currentPathRef.current);
        if (svgPath) {
          const newPaths = [...pathsRef.current, svgPath];
          pathsRef.current = newPaths;
          setPaths(newPaths);
          
          const signatureData = newPaths.join('|');
          onSignatureChange(signatureData);
          console.log('💾 Signature saved');
        }
      }
      
      currentPathRef.current = [];
      setCurrentPath([]);
    }
  }, [width, height, pointsToSvgPath, onSignatureChange, onDrawStart, onDrawEnd]);

  const clearSignature = useCallback(() => {
    setPaths([]);
    setCurrentPath([]);
    currentPathRef.current = [];
    pathsRef.current = [];
    onSignatureChange('');
  }, [onSignatureChange]);

  const hasSignature = paths.length > 0 || currentPath.length > 0;
  const currentSvgPath = pointsToSvgPath(currentPath);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Edit3 size={16} color="#0066CC" />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={[styles.signatureArea, { height, width }]}>
          <View style={styles.webFallback}>
            <Text style={styles.webFallbackText}>
              Touch signature not available on web.
              Please use mobile device for signature input.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
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
      
      <View style={[styles.signatureWrapper, { height, width }]}>
        <PanGestureHandler
          onGestureEvent={handleGestureEvent}
          onHandlerStateChange={handleStateChange}
          shouldCancelWhenOutside={false}
          minPointers={1}
          maxPointers={1}
        >
          <View 
            style={[
              styles.signatureArea, 
              { height, width },
              isDrawing && styles.signatureAreaActive
            ]}
          >
            <Svg 
              height={height} 
              width={width} 
              style={styles.svg}
            >
              <G>
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
              </G>
            </Svg>
            
            {!hasSignature && (
              <View style={styles.placeholder} pointerEvents="none">
                <Edit3 size={24} color="#CCC" />
                <Text style={styles.placeholderText}>Sign here with your finger</Text>
              </View>
            )}
          </View>
        </PanGestureHandler>
      </View>
      
      {hasSignature && (
        <View style={styles.signatureStatus}>
          <Text style={styles.signatureStatusText}>Signature captured</Text>
        </View>
      )}
    </GestureHandlerRootView>
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
  signatureWrapper: {
    position: 'relative',
  },
  signatureArea: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
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
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webFallbackText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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