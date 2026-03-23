import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import {
  ProductsIcon,
  PedidoIcon,
  PrefacturasIcon,
  MovimientosIcon,
  ColoresIcon,
  TallesIcon,
  ConfigIcon,
  PlusIcon,
  ScanIcon,
} from './Icons';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  name: string;
  label: string;
  icon: React.ReactNode;
  type: 'main' | 'settings';
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { name: 'Products', label: 'Productos', icon: <ProductsIcon />, type: 'main' },
  { name: 'Pedido', label: 'Pedido', icon: <PedidoIcon />, type: 'main' },
  { name: 'Prefacturas', label: 'Prefacturas', icon: <PrefacturasIcon />, type: 'main' },
  { name: 'Movimientos', label: 'Movimientos', icon: <MovimientosIcon />, type: 'main' },
];

const settingsNavItems: NavItem[] = [
  { name: 'Colores', label: 'Colores', icon: <ColoresIcon />, type: 'settings' },
  { name: 'Talles', label: 'Talles', icon: <TallesIcon />, type: 'settings' },
  { name: 'Configuracion', label: 'Configuración', icon: <ConfigIcon />, type: 'settings' },
];

export function DesktopSidebar({ isOpen = true, onClose }: SidebarProps) {
  const navigation = useNavigation<any>();
  
  const getActiveRoute = () => {
    const state = navigation.getState();
    const mainState = state?.routes?.find((r: any) => r.name === 'Main')?.state;
    const tabState = mainState?.routes?.find((r: any) => r.name === 'MainTabs')?.state;
    return tabState?.routes?.[tabState.index]?.name || 'Products';
  };

  const activeRoute = getActiveRoute();

  const handleNavigate = (routeName: string) => {
    if (['Products', 'Pedido', 'Prefacturas', 'Movimientos'].includes(routeName)) {
      navigation.navigate('Main', {
        screen: 'MainTabs',
        params: { screen: routeName },
      });
    } else {
      navigation.navigate(routeName as any);
    }
  };

  const handleQuickAction = (action: 'AddProduct' | 'ScanProduct') => {
    navigation.navigate(action);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>📦</Text>
          <Text style={styles.logoLabel}>StockHub</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Pressable 
          style={styles.quickActionBtn}
          onPress={() => handleQuickAction('AddProduct')}
        >
          <PlusIcon size={18} />
          <Text style={styles.quickActionText}>Agregar Producto</Text>
        </Pressable>
        <Pressable 
          style={styles.quickActionBtn}
          onPress={() => handleQuickAction('ScanProduct')}
        >
          <ScanIcon size={18} />
          <Text style={styles.quickActionText}>Escanear QR</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.navSection} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>PRINCIPAL</Text>
        {mainNavItems.map((item) => (
          <Pressable
            key={item.name}
            style={[
              styles.navItem,
              activeRoute === item.name && styles.navItemActive,
            ]}
            onPress={() => handleNavigate(item.name)}
          >
            <View style={styles.navItemIcon}>{item.icon}</View>
            <Text style={[
              styles.navItemLabel,
              activeRoute === item.name && styles.navItemLabelActive,
            ]}>
              {item.label}
            </Text>
            {item.badge !== undefined && item.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </Pressable>
        ))}

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>CONFIGURACIÓN</Text>
        {settingsNavItems.map((item) => (
          <Pressable
            key={item.name}
            style={[
              styles.navItem,
              styles.navItemSettings,
              activeRoute === item.name && styles.navItemActive,
            ]}
            onPress={() => handleNavigate(item.name)}
          >
            <View style={styles.navItemIcon}>{item.icon}</View>
            <Text style={[
              styles.navItemLabel,
              activeRoute === item.name && styles.navItemLabelActive,
            ]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>N</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>Nicolas</Text>
            <Text style={styles.userRole}>Administrador</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    height: '100%',
    backgroundColor: colors.surfaceDark,
    borderRightWidth: 1,
    borderRightColor: colors.borderDark,
    flexDirection: 'column',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 28,
  },
  logoLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  quickActions: {
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  quickActionText: {
    color: colors.textInverse,
    fontWeight: '600',
    fontSize: 14,
  },
  navSection: {
    flex: 1,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
    paddingHorizontal: 20,
    paddingVertical: 8,
    letterSpacing: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  navItemSettings: {
    opacity: 0.8,
  },
  navItemActive: {
    backgroundColor: colors.primary + '20',
  },
  navItemIcon: {
    width: 24,
    alignItems: 'center',
  },
  navItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    flex: 1,
  },
  navItemLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderDark,
    marginVertical: 16,
    marginHorizontal: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
  },
  userRole: {
    fontSize: 12,
    color: colors.textLight,
  },
});
