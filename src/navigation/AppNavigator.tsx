import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/colors';

function BackButton() {
  const navigation = useNavigation();
  return (
    <Pressable onPress={() => navigation.goBack()} style={{ padding: 8 }}>
      <Text style={{ fontSize: 24, color: colors.textInverse }}>←</Text>
    </Pressable>
  );
}

import ProductsScreen from '../screens/ProductsScreen';
import ArmarPedidoScreen from '../screens/ArmarPedidoScreen';
import PrefacturasScreen from '../screens/PrefacturasScreen';
import MovementsScreens from '../screens/MovementsScreens';
import AddProductsScreen from '../screens/AddProductsScreen';
import EditProductScreen from '../screens/EditProductScreen';
import { PrefacturaScreen } from '../screens/PrefacturaScreen';
import ScanScreen from '../screens/ScanScreen';
import ColoresScreen from '../screens/ColoresScreen';
import TallesScreen from '../screens/TallesScreen';
import { BackupScreen } from '../components/Backup';
import { SettingsScreen } from '../components/Settings';
import { QRListScreen } from '../components/QR';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================================================
// NAVIGATION BAR PARA DESKTOP (horizontal arriba)
// ============================================================================

interface NavItem {
  name: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: 'Products', label: 'Productos', icon: '📦' },
  { name: 'Pedido', label: 'Pedido', icon: '🛒' },
  { name: 'Prefacturas', label: 'Prefacturas', icon: '📋' },
  { name: 'Movimientos', label: 'Movimientos', icon: '📊' },
  { name: 'Settings', label: 'Configuración', icon: '⚙️' },
];

function DesktopTopNav({ currentRoute, onNavigate, onAddProduct }: { 
  currentRoute: string; 
  onNavigate: (route: string) => void;
  onAddProduct: () => void;
}) {
  return (
    <View style={styles.desktopNav}>
      <View style={styles.desktopNavLeft}>
        <Text style={styles.desktopLogo}>📦</Text>
        <Text style={styles.desktopLogoText}>StockHub</Text>
      </View>
      
      <View style={styles.desktopNavCenter}>
        {navItems.map((item) => (
          <Pressable
            key={item.name}
            style={[
              styles.desktopNavItem,
              currentRoute === item.name && styles.desktopNavItemActive,
            ]}
            onPress={() => onNavigate(item.name)}
          >
            <Text style={styles.desktopNavIcon}>{item.icon}</Text>
            <Text
              style={[
                styles.desktopNavLabel,
                currentRoute === item.name && styles.desktopNavLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      
      <View style={styles.desktopNavRight}>
        <Pressable style={styles.quickAction} onPress={onAddProduct}>
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={styles.quickActionText}>Agregar</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================================
// TABS PARA MOBILE (bottom tabs)
// ============================================================================

interface TabIconProps {
  focused: boolean;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  label: string;
}

function TabIcon({ focused, activeIcon, inactiveIcon, label }: TabIconProps) {
  return (
    <View style={stylesMobile.tabItem}>
      <View style={[stylesMobile.iconContainer, focused && stylesMobile.iconContainerActive]}>
        <Ionicons
          name={focused ? activeIcon : inactiveIcon}
          size={22}
          color={focused ? colors.primary : colors.textLight}
        />
      </View>
      <Text style={[stylesMobile.tabLabel, focused && stylesMobile.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function MobileTabs({ navigation }: { navigation: any }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const parentNavigation = navigation.getParent();
  const insets = useSafeAreaInsets();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => setMenuVisible(true)} style={styles.menuButton}>
          <Text style={styles.menuButtonText}>☰</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const handleNavigate = (screen: string) => {
    setMenuVisible(false);
    if (parentNavigation) {
      parentNavigation.navigate(screen);
    }
  };

  return (
    <>
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)} />
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuLogo}>⚙️</Text>
              <Text style={styles.menuTitle}>Configuración</Text>
              <Pressable onPress={() => setMenuVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>
            
            <ScrollView style={styles.menuContent}>
              <Text style={styles.menuSection}>NAVEGACIÓN</Text>
              
              <Pressable 
                style={styles.menuItem}
                onPress={() => handleNavigate('Products')}
              >
                <Text style={styles.menuIcon}>📦</Text>
                <Text style={styles.menuLabel}>Productos</Text>
              </Pressable>
              
              <Pressable 
                style={styles.menuItem}
                onPress={() => handleNavigate('Colores')}
              >
                <Text style={styles.menuIcon}>🎨</Text>
                <Text style={styles.menuLabel}>Colores</Text>
              </Pressable>
              
              <Pressable 
                style={styles.menuItem}
                onPress={() => handleNavigate('Talles')}
              >
                <Text style={styles.menuIcon}>📏</Text>
                <Text style={styles.menuLabel}>Talles</Text>
              </Pressable>
              
              <Pressable 
                style={styles.menuItem}
                onPress={() => handleNavigate('Backup')}
              >
                <Text style={styles.menuIcon}>💾</Text>
                <Text style={styles.menuLabel}>Backups</Text>
              </Pressable>
              
              <Pressable 
                style={styles.menuItem}
                onPress={() => handleNavigate('QRList')}
              >
                <Text style={styles.menuIcon}>📄</Text>
                <Text style={styles.menuLabel}>Códigos QR</Text>
              </Pressable>
            </ScrollView>
            
            <View style={styles.menuFooter}>
              <Text style={styles.footerText}>StockHub v1.0.0</Text>
            </View>
          </View>
        </View>
      </Modal>
      
      <Tab.Navigator
        id="MainTabs"
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.surfaceDark },
          headerTintColor: colors.textInverse,
          headerTitleStyle: { fontWeight: '600' },
          tabBarStyle: {
            ...stylesMobile.tabBar,
            paddingBottom: insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 28 : 40),
            height: insets.bottom > 0 ? 60 + insets.bottom : (Platform.OS === 'ios' ? 84 : 80),
          },
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Products"
          component={ProductsScreen}
          options={{
            headerTitle: 'Productos',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                activeIcon="cube"
                inactiveIcon="cube-outline"
                label="Productos"
              />
            ),
          }}
        />
        <Tab.Screen
          name="Pedido"
          component={ArmarPedidoScreen}
          options={{
            headerTitle: 'Armar Pedido',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                activeIcon="cart"
                inactiveIcon="cart-outline"
                label="Pedido"
              />
            ),
          }}
        />
        <Tab.Screen
          name="Prefacturas"
          component={PrefacturasScreen}
          options={{
            headerTitle: 'Facturas',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                activeIcon="document-text"
                inactiveIcon="document-text-outline"
                label="Facturas"
              />
            ),
          }}
        />
        <Tab.Screen
          name="Movimientos"
          component={MovementsScreens}
          options={{
            headerTitle: 'Mov.',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                activeIcon="stats-chart"
                inactiveIcon="stats-chart-outline"
                label="Mov."
              />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerTitle: 'Configuración',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                activeIcon="settings"
                inactiveIcon="settings-outline"
                label="Config"
              />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
}

// ============================================================================
// NAVEGADOR PRINCIPAL CON LAYOUT ADAPTATIVO
// ============================================================================

function MainTabsWrapper({ navigation }: { navigation: any }) {
  const { isDesktop, isTablet } = useResponsive();
  
  if (isDesktop || isTablet) {
    return <DesktopLayout />;
  }
  return <MobileTabs navigation={navigation} />;
}

function DesktopLayout() {
  const navigation = useNavigation<any>();
  const [currentRoute, setCurrentRoute] = useState('Products');
  
  const handleAddProduct = () => {
    navigation.navigate('AddProduct');
  };
  
  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
  };
  
  const renderContent = () => {
    const nav = navigation as any;
    switch (currentRoute) {
      case 'Products':
        return <ProductsScreen navigation={nav} route={{}} />;
      case 'Pedido':
        return <ArmarPedidoScreen navigation={nav} route={{}} />;
      case 'Prefacturas':
        return <PrefacturasScreen />;
      case 'Movimientos':
        return <MovementsScreens movements={[]} onClear={() => {}} />;
      case 'Settings':
        return <SettingsScreen />;
      default:
        return <ProductsScreen navigation={nav} route={{}} />;
    }
  };
  
  return (
    <View style={styles.desktopContainer}>
      <DesktopTopNav 
        currentRoute={currentRoute} 
        onNavigate={handleNavigate}
        onAddProduct={handleAddProduct}
      />
      <View style={styles.desktopContent}>
        {renderContent()}
      </View>
    </View>
  );
}

// ============================================================================
// APP NAVIGATOR
// ============================================================================

export function AppNavigator() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={colors.surfaceDark} />
      <Stack.Navigator
        id="RootStack"
        screenOptions={{
          headerStyle: { backgroundColor: colors.surfaceDark },
          headerTintColor: colors.textInverse,
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabsWrapper}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddProduct"
          component={AddProductsScreen}
          options={{
            title: 'Agregar Producto',
            presentation: 'modal',
            headerLeft: () => <BackButton />,
          }}
        />
        <Stack.Screen
          name="EditProduct"
          component={EditProductScreen}
          options={{ title: 'Editar Producto', headerLeft: () => <BackButton /> }}
        />
        <Stack.Screen
          name="Prefactura"
          component={PrefacturaScreen}
          options={{ title: 'Prefactura', headerLeft: () => <BackButton /> }}
        />
        <Stack.Screen
          name="ScanProduct"
          component={ScanScreen}
          options={{
            title: 'Escanear',
            presentation: 'fullScreenModal',
            headerLeft: () => <BackButton />,
          }}
        />
        <Stack.Screen
          name="Colores"
          component={ColoresScreen}
          options={{ title: 'Colores', headerLeft: () => <BackButton /> }}
        />
        <Stack.Screen
          name="Talles"
          component={TallesScreen}
          options={{ title: 'Talles', headerLeft: () => <BackButton /> }}
        />
        <Stack.Screen
          name="Backup"
          component={BackupScreen}
          options={{ title: 'Backups', headerLeft: () => <BackButton /> }}
        />
        <Stack.Screen
          name="QRList"
          component={QRListScreen}
          options={{ title: 'Códigos QR', headerLeft: () => <BackButton /> }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ============================================================================
// ESTILOS
// ============================================================================

const styles = StyleSheet.create({
  // Desktop Navigation
  desktopContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  desktopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDark,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  desktopNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 32,
  },
  desktopLogo: {
    fontSize: 28,
  },
  desktopLogoText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 10,
  },
  desktopNavCenter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  desktopNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  desktopNavItemActive: {
    backgroundColor: colors.primary + '20',
  },
  desktopNavIcon: {
    fontSize: 18,
  },
  desktopNavLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
  },
  desktopNavLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  desktopNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  backupAction: {
    backgroundColor: colors.warning,
  },
  quickActionIcon: {
    fontSize: 16,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
  },
  desktopContent: {
    flex: 1,
  },

  // Mobile Tab Bar
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: colors.surfaceDark,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textLight,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Menu Hamburguesa
  menuButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuButtonText: {
    fontSize: 24,
    color: colors.textInverse,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    width: 280,
    backgroundColor: colors.surfaceDark,
    height: '100%',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  menuLogo: {
    fontSize: 28,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textInverse,
    marginLeft: 12,
    flex: 1,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 18,
    color: colors.textLight,
  },
  menuContent: {
    flex: 1,
    paddingTop: 16,
  },
  menuSection: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
    paddingHorizontal: 20,
    paddingVertical: 8,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  menuFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  footerText: {
    color: colors.textLight,
    fontSize: 12,
    textAlign: 'center',
  },
});

const stylesMobile = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 84 : 70,
    backgroundColor: colors.surfaceDark,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 40,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    maxWidth: 80,
  },
  iconContainer: {
    width: 40,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  iconContainerActive: {
    backgroundColor: colors.primary + '15',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textLight,
    marginTop: 4,
    maxWidth: 72,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
