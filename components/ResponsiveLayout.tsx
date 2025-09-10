import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { spacing, dimensions, getResponsiveValue, isTablet, isDesktop } from '@/utils/responsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: 'small' | 'medium' | 'large' | 'full';
  padding?: 'none' | 'small' | 'medium' | 'large';
  centered?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  maxWidth = 'medium',
  padding = 'medium',
  centered = true,
}) => {
  const containerStyle = [
    styles.container,
    {
      maxWidth: dimensions.containerWidth[maxWidth],
      paddingHorizontal: padding === 'none' ? 0 : 
                        padding === 'small' ? spacing.sm :
                        padding === 'medium' ? spacing.lg :
                        spacing.xl,
      alignSelf: centered ? 'center' : 'stretch',
      width: '100%',
    },
    style,
  ];

  return (
    <View style={containerStyle}>
      {React.Children.map(children, (child, index) => {
        if (typeof child === 'string' || typeof child === 'number') {
          return <Text key={`container-text-${index}`}>{child}</Text>;
        }
        return child;
      })}
    </View>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  style?: ViewStyle;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns,
  gap = spacing.md,
  style,
}) => {
  const responsiveColumns = columns || getResponsiveValue(1, 2, 3);
  
  const gridStyle = [
    styles.grid,
    {
      gap,
    },
    style,
  ];

  const childArray = React.Children.toArray(children);
  
  return (
    <View style={gridStyle}>
      {childArray.map((child, index) => {
        // Ensure child is a valid React element and not a text node
        if (typeof child === 'string' || typeof child === 'number') {
          return (
            <View
              key={index}
              style={[
                styles.gridItem,
                {
                  width: `${(100 / responsiveColumns) - (gap * (responsiveColumns - 1)) / responsiveColumns}%`,
                  marginBottom: gap,
                },
              ]}
            >
              <Text>{child}</Text>
            </View>
          );
        }
        
        return (
          <View
            key={index}
            style={[
              styles.gridItem,
              {
                width: `${(100 / responsiveColumns) - (gap * (responsiveColumns - 1)) / responsiveColumns}%`,
                marginBottom: gap,
              },
            ]}
          >
            {child as React.ReactElement}
          </View>
        );
      })}
    </View>
  );
};

interface ResponsiveRowProps {
  children: React.ReactNode;
  gap?: number;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
  style?: ViewStyle;
}

export const ResponsiveRow: React.FC<ResponsiveRowProps> = ({
  children,
  gap = spacing.md,
  align = 'center',
  justify = 'flex-start',
  wrap = false,
  style,
}) => {
  const rowStyle = [
    styles.row,
    {
      gap,
      alignItems: align,
      justifyContent: justify,
      flexWrap: wrap ? 'wrap' : 'nowrap',
    },
    style,
  ];

  return (
    <View style={rowStyle}>
      {React.Children.map(children, (child, index) => {
        if (typeof child === 'string' || typeof child === 'number') {
          return <Text key={`row-text-${index}`}>{child}</Text>;
        }
        return child;
      })}
    </View>
  );
};

interface ResponsiveColumnProps {
  children: React.ReactNode;
  gap?: number;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  style?: ViewStyle;
}

export const ResponsiveColumn: React.FC<ResponsiveColumnProps> = ({
  children,
  gap = spacing.md,
  align = 'stretch',
  justify = 'flex-start',
  style,
}) => {
  const columnStyle = [
    styles.column,
    {
      gap,
      alignItems: align,
      justifyContent: justify,
    },
    style,
  ];

  return (
    <View style={columnStyle}>
      {React.Children.map(children, (child, index) => {
        if (typeof child === 'string' || typeof child === 'number') {
          return <Text key={`col-text-${index}`}>{child}</Text>;
        }
        return child;
      })}
    </View>
  );
};

interface AdaptiveLayoutProps {
  children: React.ReactNode;
  mobileLayout: React.ReactNode;
  tabletLayout?: React.ReactNode;
  desktopLayout?: React.ReactNode;
}

export const AdaptiveLayout: React.FC<AdaptiveLayoutProps> = ({
  children,
  mobileLayout,
  tabletLayout,
  desktopLayout,
}) => {
  if (isDesktop() && desktopLayout) {
    return <>{desktopLayout}</>;
  }
  
  if (isTablet() && tabletLayout) {
    return <>{tabletLayout}</>;
  }
  
  return <>{mobileLayout}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    // Width is set dynamically
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
});

export default {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveRow,
  ResponsiveColumn,
  AdaptiveLayout,
};