import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { DesktopSidebar, DesktopHeader, FloatingActionButton } from '../Navigation';
import { colors } from '../../theme/colors';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const { isDesktop, isTablet } = useResponsive();

  if (isDesktop || isTablet) {
    return (
      <View style={styles.container}>
        <DesktopSidebar />
        <View style={styles.mainArea}>
          <DesktopHeader />
          <View style={styles.content}>
            {children}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mobileContainer}>
      {children}
      <FloatingActionButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.backgroundDark,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
});
