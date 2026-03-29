import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Linking, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { Backup, getBackups, restoreBackup, createBackup, downloadBackup } from '../../api/Backup';
import { ConfirmModal, SuccessModal, ErrorModal } from '../Common';

export function BackupScreen() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Modales
  const [showConfirmCreate, setShowConfirmCreate] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);

  const loadBackups = useCallback(async () => {
    try {
      const data = await getBackups();
      setBackups(data || []);
    } catch (error) {
      console.error('Error cargando backups:', error);
      showErrorModal('Error', 'No se pudieron cargar los backups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBackups();
  };

  const showErrorModal = (title: string, message: string) => {
    setErrorMessage(message);
    setShowError(true);
  };

  const handleCreateBackup = async () => {
    setShowConfirmCreate(false);
    try {
      setCreating(true);
      const result = await createBackup();
      setSuccessMessage(result.message);
      setShowSuccess(true);
      loadBackups();
    } catch (error: any) {
      console.error('Error creando backup:', error);
      const msg = error?.response?.data?.mensaje || error?.message || 'No se pudo crear el backup';
      showErrorModal('Error', msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (backup: Backup) => {
    try {
      const url = await downloadBackup(backup.nombre);
      if (url) {
        Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error descargando backup:', error);
      showErrorModal('Error', 'No se pudo descargar el backup');
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    
    setShowConfirmRestore(false);
    try {
      setRestoring(selectedBackup.nombre);
      const result = await restoreBackup({ archivo: selectedBackup.nombre });
      if (result.success) {
        setSuccessMessage('Backup restaurado correctamente');
        setShowSuccess(true);
      } else {
        showErrorModal('Error', result.message);
      }
    } catch (error) {
      console.error('Error restaurando backup:', error);
      showErrorModal('Error', 'No se pudo restaurar el backup');
    } finally {
      setRestoring(null);
      setSelectedBackup(null);
    }
  };

  const confirmRestore = (backup: Backup) => {
    setSelectedBackup(backup);
    setShowConfirmRestore(true);
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '-';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const renderBackupItem = ({ item }: { item: Backup }) => (
    <View style={styles.backupItem}>
      <View style={styles.backupInfo}>
        <Text style={styles.backupName}>{item.nombre}</Text>
        <View style={styles.backupMeta}>
          <Text style={styles.backupDate}>📅 {formatDate(item.fecha)}</Text>
          {item.tamano && (
            <Text style={styles.backupSize}>💾 {item.tamano}</Text>
          )}
        </View>
      </View>
      <View style={styles.backupActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.downloadButton]}
          onPress={() => handleDownload(item)}
        >
          <Text style={styles.actionIcon}>⬇️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.restoreButton]}
          onPress={() => confirmRestore(item)}
          disabled={restoring === item.nombre}
        >
          {restoring === item.nombre ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={styles.actionIcon}>🔄</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💾</Text>
      <Text style={styles.emptyTitle}>Sin backups</Text>
      <Text style={styles.emptySubtitle}>
        Los backups aparecerán aquí cuando se creen
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>💾 Gestión de Backups</Text>
          <Text style={styles.headerSubtitle}>
            Realiza copias de seguridad y restaura datos
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.createButton, creating && styles.createButtonDisabled]}
          onPress={() => setShowConfirmCreate(true)}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <>
              <Text style={styles.createButtonIcon}>➕</Text>
              <Text style={styles.createButtonText}>Generar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando backups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={backups}
        renderItem={renderBackupItem}
        keyExtractor={(item) => item.nombre}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Modal Confirmar Crear Backup */}
      <ConfirmModal
        visible={showConfirmCreate}
        title="Generar Backup"
        message="¿Quieres crear una copia de seguridad de la base de datos?"
        confirmText="Generar"
        confirmColor={colors.warning}
        onConfirm={handleCreateBackup}
        onCancel={() => setShowConfirmCreate(false)}
        loading={creating}
      />

      {/* Modal Confirmar Restaurar */}
      <ConfirmModal
        visible={showConfirmRestore}
        title="Restaurar Backup"
        message={`¿Estás seguro de restaurar "${selectedBackup?.nombre}"? Esta acción puede sobrescribir datos actuales.`}
        confirmText="Restaurar"
        confirmColor={colors.error}
        onConfirm={handleRestore}
        onCancel={() => {
          setShowConfirmRestore(false);
          setSelectedBackup(null);
        }}
        loading={restoring !== null}
      />

      {/* Modal Éxito */}
      <SuccessModal
        visible={showSuccess}
        title="Éxito"
        message={successMessage}
        onClose={() => setShowSuccess(false)}
      />

      {/* Modal Error */}
      <ErrorModal
        visible={showError}
        title="Error"
        message={errorMessage}
        onClose={() => setShowError(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textInverse,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonIcon: {
    fontSize: 16,
  },
  createButtonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  backupItem: {
    backgroundColor: colors.surfaceDark,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  backupInfo: {
    marginBottom: 12,
  },
  backupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
    marginBottom: 6,
  },
  backupMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  backupDate: {
    fontSize: 13,
    color: colors.textLight,
  },
  backupSize: {
    fontSize: 13,
    color: colors.textLight,
  },
  backupActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButton: {
    backgroundColor: colors.primary,
  },
  restoreButton: {
    backgroundColor: colors.info,
  },
  actionIcon: {
    fontSize: 22,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textInverse,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
  },
});
