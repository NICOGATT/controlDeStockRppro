import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  SectionList,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../../theme/colors';
import { Product } from '../../types/Product';
import { StockProducto } from '../../types/StockProducto';
import { apiFetch } from '../../api/apiClient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface QrSection {
  title: string;
  productoId: string;
  producto: Product;
  data: StockProducto[];
}

interface QrCardProps {
  stockItem: StockProducto;
  producto: Product;
  onPress: () => void;
}

function ColorIndicator({ color }: { color?: string }) {
  const colorMap: Record<string, string> = {
    rojo: '#E53935',
    azul: '#1E88E5',
    verde: '#43A047',
    amarillo: '#FDD835',
    negro: '#212121',
    blanco: '#FAFAFA',
    gris: '#757575',
    rosa: '#EC407A',
    naranja: '#FB8C00',
    morado: '#8E24AA',
    celeste: '#4FC3F7',
    beige: '#D7CCC8',
    marron: '#795548',
  };

  const bgColor = color ? (colorMap[color.toLowerCase()] || colors.textLight) : colors.textLight;

  return (
    <View style={[styles.colorIndicator, { backgroundColor: bgColor }]}>
      {color?.toLowerCase() === 'blanco' && (
        <View style={styles.colorBorder} />
      )}
    </View>
  );
}

function QrCard({ stockItem, producto, onPress }: QrCardProps) {
  const sp = stockItem as any;
  const productoId = stockItem.productoId ?? sp.producto_id ?? producto.id;
  const talleId = stockItem.talleId ?? sp.talle_id ?? 0;
  const colorId = stockItem.colorId ?? sp.color_id ?? 0;
  const qrData = `rppro:stock:${productoId}:${talleId}:${colorId}`;
  const colorNombre = stockItem.color?.nombre || `Color #${colorId}`;
  const talleNombre = stockItem.talle?.nombre || `Talle #${talleId}`;

  return (
    <TouchableOpacity style={styles.qrCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.qrCardLeft}>
        <ColorIndicator color={stockItem.color?.nombre} />
        <View style={styles.qrCardInfo}>
          <Text style={styles.variantName} numberOfLines={1}>
            {colorNombre}
          </Text>
          <View style={styles.variantMeta}>
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>Talle</Text>
              <Text style={styles.metaValue}>{talleNombre}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>Stock</Text>
              <Text style={[styles.metaValue, stockItem.stock <= 3 && styles.stockLow]}>
                {stockItem.stock}
              </Text>
            </View>
          </View>
          {stockItem.precio != null && (
            <Text style={styles.variantPrice}>
              ${stockItem.precio.toLocaleString('es-AR')}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.qrCardRight}>
        <View style={styles.qrThumbnail}>
          <QRCode value={qrData} size={60} color="#000000" backgroundColor="#FFFFFF" />
        </View>
        <Text style={styles.viewQrText}>Ver QR</Text>
      </View>
    </TouchableOpacity>
  );
}

function ProductHeader({ producto }: { producto: Product }) {
  const totalStock = (producto.stockProductos || []).reduce((acc, sp) => acc + sp.stock, 0);

  return (
    <View style={styles.productHeader}>
      <View style={styles.productHeaderInfo}>
        <Text style={styles.productName}>{producto.nombre}</Text>
        <Text style={styles.productMeta}>
          {producto.tipoDePrenda?.nombre || ''} • {producto.id}
        </Text>
      </View>
      <View style={styles.stockBadge}>
        <Text style={styles.stockBadgeText}>{totalStock} uds</Text>
      </View>
    </View>
  );
}

const SearchHeader = React.memo(function SearchHeader({ 
  searchText, 
  onSearchTextChange, 
  onSearchSubmit, 
  onClear,
  productCount, 
  qrCount 
}: { 
  searchText: string; 
  onSearchTextChange: (text: string) => void; 
  onSearchSubmit: () => void;
  onClear: () => void;
  productCount: number; 
  qrCount: number;
}) {
  return (
    <View style={styles.listHeader}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por producto, color o talle..."
          placeholderTextColor={colors.textLight}
          value={searchText}
          onChangeText={onSearchTextChange}
          onSubmitEditing={onSearchSubmit}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={onClear}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {productCount} productos • {qrCount} códigos QR
        </Text>
      </View>
    </View>
  );
});

interface QrViewerModalProps {
  visible: boolean;
  producto: Product | null;
  stockItem: StockProducto | null;
  onClose: () => void;
}

function QrViewerModal({ visible, producto, stockItem, onClose }: QrViewerModalProps) {
  const qrRef = React.useRef<any>(null);
  const [loading, setLoading] = useState(false);

  if (!stockItem || !producto) return null;

  const sp = stockItem as any;
  const productoId = stockItem.productoId ?? sp.producto_id ?? producto.id;
  const talleId = stockItem.talleId ?? sp.talle_id ?? 0;
  const colorId = stockItem.colorId ?? sp.color_id ?? 0;
  const qrData = `rppro:stock:${productoId}:${talleId}:${colorId}`;

  const handleDownloadPdf = async () => {
    try {
      setLoading(true);
      if (!qrRef.current?.toDataURL) {
        Alert.alert('Error', 'No pude obtener la imagen del QR.');
        return;
      }

      const qrDataUrl: string = await new Promise((resolve) => {
        qrRef.current.toDataURL((base64: string) => {
          resolve(`data:image/png;base64,${base64}`);
        });
      });

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { 
                font-family: 'Segoe UI', Arial, sans-serif; 
                padding: 24px; 
                background: #f5f5f5;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              .card { 
                background: white; 
                border-radius: 16px; 
                padding: 24px; 
                width: 340px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              }
              .header { 
                display: flex; 
                align-items: flex-start; 
                margin-bottom: 20px;
                gap: 12px;
              }
              .color-dot {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                flex-shrink: 0;
              }
              .product-info { flex: 1; }
              .title { 
                font-size: 18px; 
                font-weight: 700; 
                color: #1a1a1a;
                margin-bottom: 4px;
              }
              .sku { 
                font-size: 12px; 
                color: #666;
              }
              .divider {
                height: 1px;
                background: #eee;
                margin: 16px 0;
              }
              .variant-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                margin-bottom: 20px;
              }
              .variant-item {
                background: #f8f8f8;
                border-radius: 8px;
                padding: 12px;
                text-align: center;
              }
              .variant-label {
                font-size: 10px;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
              }
              .variant-value {
                font-size: 16px;
                font-weight: 600;
                color: #1a1a1a;
              }
              .qr-container {
                text-align: center;
                padding: 20px;
                background: #f8f8f8;
                border-radius: 12px;
                margin-bottom: 16px;
              }
              .qr-title {
                font-size: 12px;
                color: #666;
                margin-bottom: 12px;
              }
              .id-text {
                font-size: 11px;
                color: #999;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <div class="color-dot" style="background-color: ${stockItem.color?.nombre?.toLowerCase() || '#ccc'}"></div>
                <div class="product-info">
                  <p class="title">${producto.nombre}</p>
                  <p class="sku">SKU: ${producto.id}</p>
                </div>
              </div>
              <div class="variant-grid">
                <div class="variant-item">
                  <p class="variant-label">Color</p>
                  <p class="variant-value">${stockItem.color?.nombre || '-'}</p>
                </div>
                <div class="variant-item">
                  <p class="variant-label">Talle</p>
                  <p class="variant-value">${stockItem.talle?.nombre || '-'}</p>
                </div>
                <div class="variant-item">
                  <p class="variant-label">Stock</p>
                  <p class="variant-value">${stockItem.stock}</p>
                </div>
              </div>
              <div class="qr-container">
                <p class="qr-title">Código QR</p>
                <img src="${qrDataUrl}" width="180" height="180" />
              </div>
              <p class="id-text">ID: ${qrData}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        await Print.printAsync({ uri });
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo generar el PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <ScrollView contentContainerStyle={modalStyles.scrollContent}>
          <View style={modalStyles.container}>
            <View style={modalStyles.header}>
              <View style={modalStyles.headerLeft}>
                <ColorIndicator color={stockItem.color?.nombre || ''} />
                <View>
                  <Text style={modalStyles.productName}>{producto.nombre}</Text>
                  <Text style={modalStyles.productId}>SKU: {producto.id}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
                <Text style={modalStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={modalStyles.variantInfo}>
              <View style={modalStyles.variantItem}>
                <Text style={modalStyles.variantLabel}>Color</Text>
                <Text style={modalStyles.variantValue}>{stockItem.color?.nombre || `ID: ${colorId}`}</Text>
              </View>
              <View style={modalStyles.variantItem}>
                <Text style={modalStyles.variantLabel}>Talle</Text>
                <Text style={modalStyles.variantValue}>{stockItem.talle?.nombre || `ID: ${talleId}`}</Text>
              </View>
              <View style={modalStyles.variantItem}>
                <Text style={modalStyles.variantLabel}>Stock</Text>
                <Text style={[modalStyles.variantValue, stockItem.stock <= 3 && modalStyles.stockLow]}>
                  {stockItem.stock}
                </Text>
              </View>
              {stockItem.precio != null && (
                <View style={modalStyles.variantItem}>
                  <Text style={modalStyles.variantLabel}>Precio</Text>
                  <Text style={modalStyles.variantValue}>${stockItem.precio.toLocaleString('es-AR')}</Text>
                </View>
              )}
            </View>

            <View style={modalStyles.qrContainer}>
              <QRCode
                value={qrData}
                size={200}
                color="#000000"
                backgroundColor="#FFFFFF"
                getRef={(c) => (qrRef.current = c)}
              />
            </View>

            <Text style={modalStyles.qrId}>ID: {qrData}</Text>

            <TouchableOpacity
              style={modalStyles.printButton}
              onPress={handleDownloadPdf}
              disabled={loading}
            >
              <Text style={modalStyles.printButtonText}>
                {loading ? 'Generando...' : '📄 Descargar / Imprimir PDF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={modalStyles.cancelButton}>
              <Text style={modalStyles.cancelButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export function QRListScreen({ navigation }: { navigation?: any }) {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedProducto, setSelectedProducto] = useState<Product | null>(null);
  const [selectedStockItem, setSelectedStockItem] = useState<StockProducto | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const prods = await apiFetch<Product[]>('/api/productos');
      setProductos(prods || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = () => {
    setSearchQuery(searchText);
  };

  const sections = useMemo((): QrSection[] => {
    let filtered = productos;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = productos.filter((p) => {
        if (p.id.toLowerCase().includes(query)) return true;
        if (p.nombre.toLowerCase().includes(query)) return true;
        return p.stockProductos?.some(
          (sp) =>
            sp.color?.nombre?.toLowerCase().includes(query) ||
            sp.talle?.nombre?.toLowerCase().includes(query)
        );
      });
    }

    return filtered
      .filter((p) => p.stockProductos && p.stockProductos.length > 0)
      .map((p) => ({
        title: p.nombre,
        productoId: p.id,
        producto: p,
        data: p.stockProductos || [],
      }));
  }, [productos, searchQuery]);

  const handleQrPress = (producto: Product, stockItem: StockProducto) => {
    setSelectedProducto(producto);
    setSelectedStockItem(stockItem);
    setShowQrModal(true);
  };

  const totalQrs = sections.reduce((acc, s) => acc + s.data.length, 0);

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    setSearchQuery('');
  }, []);

  const renderSectionHeader = ({ section }: { section: QrSection }) => (
    <ProductHeader producto={section.producto} />
  );

  const renderItem = ({ item, section }: { item: StockProducto; section: QrSection }) => (
    <QrCard
      stockItem={item}
      producto={section.producto}
      onPress={() => handleQrPress(section.producto, item)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📄</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Sin resultados' : 'Sin códigos QR'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'No hay variantes que coincidan con tu búsqueda'
          : 'Agrega productos con variantes para ver sus códigos QR'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando códigos QR...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchHeader
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onSearchSubmit={handleSearch}
        onClear={handleClearSearch}
        productCount={sections.length}
        qrCount={totalQrs}
      />
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item, index) => `${item.productoId ?? 'na'}-${item.colorId ?? 'na'}-${item.talleId ?? 'na'}-${index}`}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
      />

      <QrViewerModal
        visible={showQrModal}
        producto={selectedProducto}
        stockItem={selectedStockItem}
        onClose={() => setShowQrModal(false)}
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
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 16,
  },
  listHeader: {
    padding: 16,
    paddingTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textInverse,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textLight,
    padding: 4,
  },
  statsRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statsText: {
    color: colors.textLight,
    fontSize: 13,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.backgroundDark,
  },
  productHeaderInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textInverse,
    marginBottom: 2,
  },
  productMeta: {
    fontSize: 12,
    color: colors.textLight,
  },
  stockBadge: {
    backgroundColor: colors.primary + '25',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  qrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDark,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  qrCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorBorder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.borderDark,
  },
  qrCardInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textInverse,
    marginBottom: 4,
  },
  variantMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaChip: {
    backgroundColor: colors.backgroundDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaLabel: {
    fontSize: 9,
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textInverse,
  },
  stockLow: {
    color: colors.error,
  },
  variantPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
    marginTop: 4,
  },
  qrCardRight: {
    alignItems: 'center',
    marginLeft: 12,
  },
  qrThumbnail: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 8,
  },
  viewQrText: {
    fontSize: 10,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  separator: {
    height: 8,
  },
  sectionSeparator: {
    height: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textInverse,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textInverse,
  },
  productId: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 18,
    color: colors.textLight,
  },
  variantInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  variantItem: {
    backgroundColor: colors.backgroundDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  variantLabel: {
    fontSize: 10,
    color: colors.textLight,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  variantValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textInverse,
  },
  stockLow: {
    color: colors.error,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  qrId: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  printButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  printButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textLight,
    fontSize: 14,
  },
});
