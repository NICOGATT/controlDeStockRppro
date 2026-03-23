import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
};

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  
  const isMobile = width < BREAKPOINTS.MOBILE;
  const isTablet = width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.DESKTOP;
  const isDesktop = width >= BREAKPOINTS.DESKTOP;
  
  const deviceType: DeviceType = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile';
  
  return {
    width,
    height,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape: width > height,
    isPortrait: height > width,
    sidebarWidth: isDesktop ? 260 : isTablet ? 220 : 0,
    headerHeight: isDesktop ? 64 : isMobile ? 56 : 48,
  };
}
