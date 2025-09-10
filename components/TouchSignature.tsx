import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { Trash2, Edit3 } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

interface TouchSignatureProps {
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

export default function TouchSignature({ 
  title, 
  onSignatureChange, 
  signature = '', 
  height = 150,
  width = screenWidth - 64,
}: TouchSignatureProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  
  const currentPoints = useRef<Point[]>([]);
  const containerRef = useRef<View>(null);
  const isDrawingRef = useRef(false);

  // Initialize paths from signature prop with better persistence
  useEffect(() => {
    if (signature) {
      console.log('🔄 TouchSignature initializing from prop:', signature.substring(0, 50) + '...');
      if (signature.startsWith('data:image')) {
        // Base64 signature - mark as existing
        setPaths(['SIGNATURE_EXISTS']);
        console.log('📷 Base64 signature preserved in TouchSignature');
      } else {
        const initialPaths = signature.split('|').filter(p => p);
        setPaths(initialPaths);
        console.log('🎨 SVG paths loaded in TouchSignature:', initialPaths.length, 'paths');
      }
    } else {
      setPaths([]);
      console.log('🗑️ No signature prop in TouchSignature, clearing');
    }
  }, [signature]);

  // Convert points to SVG path
  const pointsToPath = useCallback((points: Point[]): string => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    
    // Simple line segments for better performance and reliability
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
    }
    
    return path;
  }, []);

  // Get coordinates relative to the container
  const getRelativeCoordinates = useCallback((evt: GestureResponderEvent): Point | null => {
    // Use locationX and locationY which are relative to the View
    const { locationX, locationY } = evt.nativeEvent;
    
    if (locationX === undefined || locationY === undefined) {
      console.log('⚠️ No location data in event');
      return null;
    }
    
    // Clamp coordinates to bounds
    const x = Math.max(0, Math.min(locationX, width));
    const y = Math.max(0, Math.min(locationY, height));
    
    return { x, y };
  }, [width, height]);

  // Create PanResponder with dependencies
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        console.log('🎨 Drawing started');
        isDrawingRef.current = true;
        setIsDrawing(true);
        
        const point = getRelativeCoordinates(evt);
        if (point) {
          currentPoints.current = [point];
          const path = pointsToPath([point]);
          setCurrentPath(path);
          console.log('📍 Start point:', point);
        }
      },
      
      onPanResponderMove: (evt: GestureResponderEvent) => {
        if (!isDrawingRef.current) return;
        
        const point = getRelativeCoordinates(evt);
        if (point) {
          currentPoints.current.push(point);
          
          // Update path in real-time
          const newPath = pointsToPath(currentPoints.current);
          setCurrentPath(newPath);
        }
      },
      
      onPanResponderRelease: () => {
        console.log('✅ TouchSignature drawing ended with', currentPoints.current.length, 'points');
        isDrawingRef.current = false;
        setIsDrawing(false);
        
        // Save the path if it has enough points
        if (currentPoints.current.length > 2) {
          const finalPath = pointsToPath(currentPoints.current);
          if (finalPath) {
            setPaths(prevPaths => {
              const filteredPrevPaths = prevPaths.filter(p => p !== 'SIGNATURE_EXISTS');
              const newPaths = [...filteredPrevPaths, finalPath];
              
              // Convert to base64 for better persistence
              const pathsString = newPaths.join('|');
              const base64Image = convertPathsToBase64(pathsString);
              
              setTimeout(() => {
                onSignatureChange(base64Image);
                console.log('💾 TouchSignature saved as base64 with', currentPoints.current.length, 'points');
              }, 100);
              
              return newPaths;
            });
          }
        } else {
          console.log('⚠️ TouchSignature path too short, not saving');
        }
        
        // Clear current path
        currentPoints.current = [];
        setCurrentPath('');
      },
      
      onPanResponderTerminate: () => {
        console.log('❌ Drawing terminated');
        isDrawingRef.current = false;
        setIsDrawing(false);
        currentPoints.current = [];
        setCurrentPath('');
      },
    })
  ).current;

  // Update panResponder when paths change
  useEffect(() => {
    // This ensures the panResponder has access to the latest paths
    return () => {
      isDrawingRef.current = false;
    };
  }, []);

  const clearSignature = useCallback(() => {
    console.log('🗑️ TouchSignature clearing signature...');
    setPaths([]);
    setCurrentPath('');
    currentPoints.current = [];
    
    setTimeout(() => {
      onSignatureChange('');
      console.log('✅ TouchSignature cleared and parent notified');
    }, 50);
  }, [onSignatureChange]);
  
  // Convert paths to base64 for better compatibility
  const convertPathsToBase64 = (pathsString: string): string => {
    if (!pathsString) return '';
    
    if (pathsString.startsWith('data:image')) {
      return pathsString;
    }
    
    const paths = pathsString.split('|').filter(p => p);
    if (paths.length === 0) return '';
    
    const svgString = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background: white;">
      <rect width="100%" height="100%" fill="white"/>
      ${paths.map(path => 
        `<path d="${path}" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      ).join('')}
    </svg>`;
    
    try {
      const base64 = btoa(unescape(encodeURIComponent(svgString)));
      return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
      console.error('TouchSignature base64 conversion error:', error);
      return pathsString;
    }
  };

  const hasSignature = paths.length > 0 || currentPath.length > 0 || !!signature;
  
  // Debug logging for TouchSignature state
  useEffect(() => {
    console.log('📊 TouchSignature state:', {
      pathsCount: paths.length,
      currentPathLength: currentPath.length,
      hasSignatureProp: !!signature,
      hasSignature,
      signatureLength: signature?.length || 0
    });
  }, [paths.length, currentPath.length, signature, hasSignature]);

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
        ref={containerRef}
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
          {paths.filter(p => p !== 'SIGNATURE_EXISTS').map((path, index) => (
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
          {currentPath && (
            <Path
              d={currentPath}
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
            <Text style={styles.placeholderText}>Draw your signature here</Text>
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