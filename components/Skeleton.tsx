import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import { MotiView } from 'moti';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

export default function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  return (
    <MotiView
      transition={{
        type: 'timing',
        duration: 1000,
        loop: true,
      }}
      from={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E5EA',
  },
});
