import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

import ProductsScreen from '../screens/ProductsScreen';
import ArmarPedidoScreen from '../screens/ArmarPedidoScreen';
import PrefacturasScreen from '../screens/PrefacturasScreen';
import MovementsScreens from '../screens/MovementsScreens';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabConfig {
  name: keyof MainTabParamList;
  component: React.ComponentType<any>;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const tabs: TabConfig[] = [
  {
    name: 'Products',
    component: ProductsScreen,
    label: 'Productos',
    activeIcon: 'cube',
    inactiveIcon: 'cube-outline',
  },
  {
    name: 'Pedido',
    component: ArmarPedidoScreen,
    label: 'Pedido',
    activeIcon: 'cart',
    inactiveIcon: 'cart-outline',
  },
  {
    name: 'Prefacturas',
    component: PrefacturasScreen,
    label: 'Facturas',
    activeIcon: 'document-text',
    inactiveIcon: 'document-text-outline',
  },
  {
    name: 'Movimientos',
    component: MovementsScreens,
    label: 'Mov.',
    activeIcon: 'stats-chart',
    inactiveIcon: 'stats-chart-outline',
  },
];

interface TabIconProps {
  focused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  badgeCount?: number;
}

function TabIcon({ focused, iconName, label, badgeCount }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
        <Ionicons
          name={focused ? iconName : `${iconName}-outline` as keyof typeof Ionicons.glyphMap}
          size={22}
          color={focused ? colors.primary : colors.textLight}
        />
        {badgeCount !== undefined && badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          paddingBottom: insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 28 : 14),
          height: insets.bottom > 0 ? 64 + insets.bottom : (Platform.OS === 'ios' ? 84 : 70),
        },
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                iconName={tab.activeIcon}
                label={tab.label}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 84 : 70,
    backgroundColor: colors.surfaceDark,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
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
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
