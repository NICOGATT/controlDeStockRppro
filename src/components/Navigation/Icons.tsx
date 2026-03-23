import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface IconProps {
  size?: number;
  color?: string;
}

export const ProductsIcon = ({ size = 24, color = colors.textInverse }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📦</Text>
);

export const PedidoIcon = ({ size = 24, color = colors.textInverse }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🛒</Text>
);

export const PrefacturasIcon = ({ size = 24, color = colors.textInverse }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📋</Text>
);

export const MovimientosIcon = ({ size = 24, color = colors.textInverse }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📊</Text>
);

export const SettingsIcon = ({ size = 24, color = colors.textInverse }: IconProps) => (
  <Text style={{ fontSize: size, color }}>⚙️</Text>
);

export const ColoresIcon = ({ size = 24, color = colors.textInverse }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🎨</Text>
);

export const TallesIcon = ({ size = 24, color = colors.textInverse }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📏</Text>
);

export const ConfigIcon = ({ size = 24, color = colors.textInverse }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🔧</Text>
);

export const PlusIcon = ({ size = 24, color = colors.textInverse }: IconProps) => (
  <Text style={{ fontSize: size, color }}>➕</Text>
);

export const ScanIcon = ({ size = 24, color = colors.textInverse }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📷</Text>
);

export const SearchIcon = ({ size = 24, color = colors.textInverse }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🔍</Text>
);

export const UserIcon = ({ size = 24, color = colors.textInverse }: IconProps) => (
  <Text style={{ fontSize: size, color }}>👤</Text>
);

export const MenuIcon = ({ size = 24, color = colors.textInverse }: IconProps) => (
  <Text style={{ fontSize: size, color }}>☰</Text>
);

export const HomeIcon = ({ size = 24, color = colors.textInverse }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🏠</Text>
);
