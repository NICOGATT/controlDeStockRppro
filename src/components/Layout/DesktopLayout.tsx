import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { DesktopSidebar, DesktopHeader, FloatingActionButton } from '../Navigation';
import { colors } from '../../theme/colors';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const { isDesktop, isTablet, sidebarWidth } = useResponsive();

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
    <View style={styles.containerMobile}>
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
  containerMobile: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
});
