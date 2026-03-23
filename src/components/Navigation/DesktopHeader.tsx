import React from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { SearchIcon, PlusIcon, ScanIcon } from './Icons';

interface DesktopHeaderProps {
  title?: string;
  showSearch?: boolean;
  showQuickActions?: boolean;
  onSearch?: (query: string) => void;
}

export function DesktopHeader({
  title,
  showSearch = true,
  showQuickActions = true,
  onSearch,
}: DesktopHeaderProps) {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch?.(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.pageTitle}>{title || 'StockHub'}</Text>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchIcon}>
            <SearchIcon size={18} color={colors.textLight} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      )}

      {showQuickActions && (
        <View style={styles.rightSection}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => navigation.navigate('AddProduct')}
          >
            <PlusIcon size={18} />
            <Text style={styles.actionBtnText}>Agregar</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={() => navigation.navigate('ScanProduct')}
          >
            <ScanIcon size={18} />
            <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>Escanear</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: colors.surfaceDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  leftSection: {
    minWidth: 150,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textInverse,
  },
  searchContainer: {
    flex: 1,
    maxWidth: 500,
    height: 40,
    backgroundColor: colors.backgroundDark,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textInverse,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
  },
  actionBtnTextSecondary: {
    color: colors.textSecondary,
  },
});
