import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import {
  ProductsIcon,
  PedidoIcon,
  PrefacturasIcon,
  MovimientosIcon,
} from '../components/Navigation';

import ProductsScreen from '../screens/ProductsScreen';
import ArmarPedidoScreen from '../screens/ArmarPedidoScreen';
import PrefacturasScreen from '../screens/PrefacturasScreen';
import MovementsScreens from '../screens/MovementsScreens';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabIconProps {
  focused: boolean;
  icon: React.ReactNode;
  label: string;
}

function TabIcon({ focused, icon, label }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
        {icon}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={<ProductsIcon size={24} color={focused ? colors.primary : colors.textLight} />}
              label="Productos"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Pedido"
        component={ArmarPedidoScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={<PedidoIcon size={24} color={focused ? colors.primary : colors.textLight} />}
              label="Pedido"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Prefacturas"
        component={PrefacturasScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={<PrefacturasIcon size={24} color={focused ? colors.primary : colors.textLight} />}
              label="Prefacturas"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Movimientos"
        component={MovementsScreens}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={<MovimientosIcon size={24} color={focused ? colors.primary : colors.textLight} />}
              label="Movimientos"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrapper: {
    width: 48,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  iconWrapperActive: {
    backgroundColor: colors.primary + '20',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textLight,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
