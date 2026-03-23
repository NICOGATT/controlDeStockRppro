import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { PlusIcon, ScanIcon } from './Icons';

interface FABAction {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions?: FABAction[];
}

export function FloatingActionButton({ actions }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigation = useNavigation<any>();
  
  const defaultActions: FABAction[] = actions || [
    {
      label: 'Agregar Producto',
      icon: <PlusIcon size={24} color={colors.textInverse} />,
      onPress: () => {
        setIsOpen(false);
        navigation.navigate('AddProduct');
      },
      color: colors.primary,
    },
    {
      label: 'Escanear QR',
      icon: <ScanIcon size={24} color={colors.textInverse} />,
      onPress: () => {
        setIsOpen(false);
        navigation.navigate('ScanProduct');
      },
      color: colors.info,
    },
  ];

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleActionPress = (action: FABAction) => {
    action.onPress();
  };

  return (
    <>
      {isOpen && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setIsOpen(false)}
        />
      )}

      <View style={styles.container}>
        {isOpen && (
          <View style={styles.actionsContainer}>
            {defaultActions.map((action, index) => (
              <Pressable
                key={index}
                style={[styles.actionButton, { backgroundColor: action.color || colors.primary }]}
                onPress={() => handleActionPress(action)}
              >
                <View style={styles.actionIcon}>{action.icon}</View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          style={[styles.fab, isOpen && styles.fabActive]}
          onPress={handleToggle}
        >
          <Animated.View
            style={[
              styles.fabIcon,
              isOpen && styles.fabIconRotated,
            ]}
          >
            <Text style={styles.fabIconText}>+</Text>
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
  container: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 101,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  actionIcon: {
    width: 24,
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabActive: {
    backgroundColor: colors.error,
  },
  fabIcon: {
    transform: [{ rotate: '0deg' }],
  },
  fabIconRotated: {
    transform: [{ rotate: '45deg' }],
  },
  fabIconText: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.textInverse,
    marginTop: -2,
  },
});
