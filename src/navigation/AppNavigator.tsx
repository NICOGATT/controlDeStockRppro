import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Pressable, Modal, ScrollView } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/colors';

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

import { ProductsIcon, PedidoIcon, PrefacturasIcon, MovimientosIcon, SettingsIcon } from '../components/Navigation/Icons';

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
  icon: React.ReactNode;
  label: string;
}

function TabIcon({ focused, icon, label }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      {icon}
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

function MobileTabs({ navigation }: { navigation: any }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const parentNavigation = navigation.getParent();

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
          tabBarStyle: styles.tabBar,
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
                icon={<ProductsIcon size={22} color={focused ? colors.primary : colors.textLight} />}
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
                icon={<PedidoIcon size={22} color={focused ? colors.primary : colors.textLight} />}
                label="Pedido"
              />
            ),
          }}
        />
        <Tab.Screen
          name="Prefacturas"
          component={PrefacturasScreen}
          options={{
            headerTitle: 'Prefacturas',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                icon={<PrefacturasIcon size={22} color={focused ? colors.primary : colors.textLight} />}
                label="Facturas"
              />
            ),
          }}
        />
        <Tab.Screen
          name="Movimientos"
          component={MovementsScreens}
          options={{
            headerTitle: 'Movimientos',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                icon={<MovimientosIcon size={22} color={focused ? colors.primary : colors.textLight} />}
                label="Movimientos"
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
                icon={<SettingsIcon size={22} color={focused ? colors.primary : colors.textLight} />}
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
          }}
        />
        <Stack.Screen
          name="EditProduct"
          component={EditProductScreen}
          options={{ title: 'Editar Producto' }}
        />
        <Stack.Screen
          name="Prefactura"
          component={PrefacturaScreen}
          options={{ title: 'Prefactura' }}
        />
        <Stack.Screen
          name="ScanProduct"
          component={ScanScreen}
          options={{
            title: 'Escanear',
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="Colores"
          component={ColoresScreen}
          options={{ title: 'Colores' }}
        />
        <Stack.Screen
          name="Talles"
          component={TallesScreen}
          options={{ title: 'Talles' }}
        />
        <Stack.Screen
          name="Backup"
          component={BackupScreen}
          options={{ title: 'Backups' }}
        />
        <Stack.Screen
          name="QRList"
          component={QRListScreen}
          options={{ title: 'Códigos QR' }}
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
