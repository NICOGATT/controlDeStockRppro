import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';

interface ConfigItemProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  color?: string;
}

function ConfigItem({ icon, title, description, onPress, color = colors.primary }: ConfigItemProps) {
  return (
    <TouchableOpacity style={styles.configItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.configContent}>
        <Text style={styles.configTitle}>{title}</Text>
        <Text style={styles.configDescription}>{description}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Configuración</Text>
        <Text style={styles.headerSubtitle}>
          Gestiona los ajustes y opciones de la aplicación
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INVENTARIO</Text>
        
        <ConfigItem
          icon="🎨"
          title="Colores"
          description="Administra los colores disponibles para productos"
          onPress={() => navigation.navigate('Colores')}
          color={colors.primary}
        />
        
        <ConfigItem
          icon="📏"
          title="Talles"
          description="Administra los talles disponibles para productos"
          onPress={() => navigation.navigate('Talles')}
          color={colors.info}
        />
        
        <ConfigItem
          icon="📄"
          title="Códigos QR"
          description="Ver y gestionar códigos QR de variantes"
          onPress={() => navigation.navigate('QRList')}
          color={colors.success}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DATOS</Text>
        
        <ConfigItem
          icon="💾"
          title="Backups"
          description="Realiza copias de seguridad y restaura datos"
          onPress={() => navigation.navigate('Backup')}
          color={colors.warning}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACERCA DE</Text>
        
        <View style={styles.aboutCard}>
          <Text style={styles.aboutLogo}>📦</Text>
          <Text style={styles.aboutName}>StockHub</Text>
          <Text style={styles.aboutVersion}>Versión 1.0.0</Text>
          <Text style={styles.aboutCopyright}>© 2024 RPPRO</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textInverse,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    paddingHorizontal: 20,
    paddingVertical: 8,
    letterSpacing: 1,
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDark,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 24,
  },
  configContent: {
    flex: 1,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
    marginBottom: 2,
  },
  configDescription: {
    fontSize: 13,
    color: colors.textLight,
  },
  arrow: {
    fontSize: 24,
    color: colors.textLight,
    marginLeft: 8,
  },
  aboutCard: {
    backgroundColor: colors.surfaceDark,
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: 'center',
  },
  aboutLogo: {
    fontSize: 48,
    marginBottom: 12,
  },
  aboutName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  aboutCopyright: {
    fontSize: 12,
    color: colors.textLight,
  },
});
