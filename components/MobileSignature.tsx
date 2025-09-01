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

interface MobileSignatureProps {
  title: string;
  onSignatureChange: (signature: string) => void;
  signature?: string;
  height?: number;
  width?: number;
}

const { width: screenWidth } = Dimensions.get('window');

interface Point {
  x: number;
  y: number;
}

export default function MobileSignature({ 
  title, 
  onSignatureChange, 
  signature = '', 
  height = 150,
  width = screenWidth - 64,
}: MobileSignatureProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const svgRef = useRef<any>(null);
  const currentPathRef = useRef<Point[]>([]);
  const pathsRef = useRef<string[]>([]);

  // Initialize paths from signature prop
  useEffect(() => {
    if (signature) {
      const initialPaths = signature.split('|').filter(p => p);
      setPaths(initialPaths);
      pathsRef.current = initialPaths;
    }
  }, [signature]);

  // Convert points to SVG path
  const pointsToPath = useCallback((points: Point[]): string => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    
    // Use quadratic bezier curves for smoother lines
    if (points.length === 2) {
      path += ` L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
    } else {
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        path += ` Q ${points[i].x.toFixed(1)},${points[i].y.toFixed(1)} ${xc.toFixed(1)},${yc.toFixed(1)}`;
      }
      // Add the last point
      path += ` L ${points[points.length - 1].x.toFixed(1)} ${points[points.length - 1].y.toFixed(1)}`;
    }
    
    return path;
  }, []);

  const handleTouchStart = useCallback((event: any) => {
    console.log('🎨 Touch start');
    const touch = event.nativeEvent;
    
    // Get the touch coordinates relative to the SVG
    const point: Point = {
      x: Math.max(0, Math.min(touch.locationX, width)),
      y: Math.max(0, Math.min(touch.locationY, height))
    };
    
    setIsDrawing(true);
    currentPathRef.current = [point];
    setCurrentPath([point]);
    
    console.log('📍 Start point:', point);
  }, [width, height]);

  const handleTouchMove = useCallback((event: any) => {
    if (!isDrawing && currentPathRef.current.length === 0) return;
    
    const touch = event.nativeEvent;
    
    // Get the touch coordinates relative to the SVG
    const point: Point = {
      x: Math.max(0, Math.min(touch.locationX, width)),
      y: Math.max(0, Math.min(touch.locationY, height))
    };
    
    // Add point to current path
    currentPathRef.current = [...currentPathRef.current, point];
    setCurrentPath([...currentPathRef.current]);
  }, [isDrawing, width, height]);

  const handleTouchEnd = useCallback(() => {
    console.log('✅ Touch end with', currentPathRef.current.length, 'points');
    setIsDrawing(false);
    
    // Save the path if it has enough points
    if (currentPathRef.current.length > 2) {
      const finalPath = pointsToPath(currentPathRef.current);
      if (finalPath) {
        const newPaths = [...pathsRef.current, finalPath];
        pathsRef.current = newPaths;
        setPaths(newPaths);
        onSignatureChange(newPaths.join('|'));
        console.log('💾 Path saved');
      }
    }
    
    // Clear current path
    currentPathRef.current = [];
    setCurrentPath([]);
  }, [pointsToPath, onSignatureChange]);

  const clearSignature = useCallback(() => {
    setPaths([]);
    setCurrentPath([]);
    currentPathRef.current = [];
    pathsRef.current = [];
    onSignatureChange('');
    console.log('🗑️ Signature cleared');
  }, [onSignatureChange]);

  const hasSignature = paths.length > 0 || currentPath.length > 0;
  const currentSvgPath = pointsToPath(currentPath);

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
        style={[
          styles.signatureArea, 
          { height, width },
          isDrawing && styles.signatureAreaActive
        ]}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <Svg 
          ref={svgRef}
          height={height} 
          width={width} 
          style={styles.svg}
        >
          <G>
            {/* Render saved paths */}
            {paths.map((path, index) => (
              <Path
                key={`saved-${index}`}
                d={path}
                stroke="#1a1a1a"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            
            {/* Render current path being drawn */}
            {currentSvgPath && (
              <Path
                d={currentSvgPath}
                stroke="#0066CC"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </G>
        </Svg>
        
        {!hasSignature && (
          <View style={styles.placeholder} pointerEvents="none">
            <Edit3 size={24} color="#CCC" />
            <Text style={styles.placeholderText}>Touch here to sign</Text>
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
    borderStyle: 'solid',
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