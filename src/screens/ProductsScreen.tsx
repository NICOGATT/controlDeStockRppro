import { View, Text, Pressable, StyleSheet, TextInput, FlatList, ActivityIndicator } from "react-native";
import { ProductItem } from "../components/ProductItem";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useState, useCallback, useEffect } from "react";
import GenerarCodigoButton from "../components/BarcodeScanScreen";
import { apiFetch } from "../api/apiClient";
import { Product } from "../types/Product";
import { StockProducto } from "../types/StockProducto";
import AgregarVariante from "../components/AgregarVariante";
import { Color } from "../types/Color";
import { Talle } from "../types/Talle";
import { colors } from "../theme/colors";

// ============================================================================
// TIPOS
// ============================================================================
interface NavigationParams {
  scannedQrData?: string;
  productos?: Product[];
}

interface QrResult {
  producto: Product;
  stockProducto: StockProducto;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

/**
 * Menú de navegación rápido (horizontal scroll en mobile)
 */
function QuickMenu({ navigation }: { navigation: any }) {
  const menuItems = [
    { label: "Agregar", screen: "AddProduct", icon: "➕" },
    { label: "Movimientos", screen: "Movements", icon: "📊" },
    { label: "Armar pedido", screen: "PedidosScreen", icon: "🛒", params: { pedidoId: "pedido-123" } },
    { label: "Escanear", screen: "ScanProduct", icon: "📷" },
    { label: "Colores", screen: "Colores", icon: "🎨" },
    { label: "Talles", screen: "Talles", icon: "📏" },
    { label: "Prefacturas", screen: "Prefacturas", icon: "📋" },
  ];

  return (
    <View style={styles.menuContainer}>
      <FlatList
        horizontal
        data={menuItems}
        keyExtractor={(item, index) => `menu-${index}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.menuList}
        renderItem={({ item }) => (
          <Pressable
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen, item.params)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

/**
 * Barra de búsqueda
 */
function SearchBar({
  searchText,
  setSearchText,
  onSearch,
  total,
  filtered,
}: {
  searchText: string;
  setSearchText: (text: string) => void;
  onSearch: () => void;
  total: number;
  filtered: number;
}) {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por ID, nombre, color o talle..."
          placeholderTextColor={colors.textLight}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
        <Pressable style={styles.searchButton} onPress={onSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </Pressable>
      </View>
      <Text style={styles.resultCount}>
        {filtered === total 
          ? `${total} productos`
          : `${filtered} de ${total} productos`
        }
      </Text>
    </View>
  );
}

/**
 * Badge que muestra por qué coincidió la búsqueda
 */
function MatchBadge({ reason }: { reason: string }) {
  return (
    <View style={styles.matchBadge}>
      <Text style={styles.matchBadgeText}>{reason}</Text>
    </View>
  );
}

/**
 * Item individual de producto
 */
function ProductCard({
  producto,
  searchQuery,
  onMoverStock,
  onEliminar,
  onAgregarVariante,
  onGenerarQr,
  onEditar,
  navigation,
}: {
  producto: Product;
  searchQuery: string;
  onMoverStock: (variante: StockProducto, delta: number) => void;
  onEliminar: () => void;
  onAgregarVariante: () => void;
  onGenerarQr: (sp: StockProducto) => void;
  onEditar: () => void;
  navigation: any;
}) {
  const isHighlighted = searchQuery.trim() !== "";
  const matchReason = getMatchReason(producto, searchQuery);

  return (
    <View style={[styles.card, isHighlighted && styles.cardHighlighted]}>
      {/* Badge de coincidencia */}
      {isHighlighted && matchReason && (
        <MatchBadge reason={matchReason} />
      )}

      {/* Componente ProductItem */}
      <ProductItem
        producto={producto}
        onAgregar={(variante) => onMoverStock(variante, 1)}
        onQuitar={(variante) => onMoverStock(variante, -1)}
        onDelete={onEliminar}
        onAgregarVariante={onAgregarVariante}
        onGenerarQr={onGenerarQr}
      />

      {/* Acciones */}
      <View style={styles.actionsRow}>
        <Pressable style={styles.actionButton} onPress={onEditar}>
          <Text style={styles.actionText}>✏️ Editar</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Estado vacío cuando no hay productos
 */
function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{hasFilter ? "🔍" : "📦"}</Text>
      <Text style={styles.emptyTitle}>
        {hasFilter ? "Sin resultados" : "No hay productos"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {hasFilter 
          ? "No hay productos que coincidan con tu búsqueda"
          : "Comienza agregando tu primer producto"
        }
      </Text>
    </View>
  );
}

/**
 * Loading state
 */
function LoadingState() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Cargando productos...</Text>
    </View>
  );
}

// ============================================================================
// FUNCIONES UTILITARIAS
// ============================================================================

function getMatchReason(producto: Product, searchQuery: string): string | null {
  if (!searchQuery.trim()) return null;
  const query = searchQuery.toLowerCase();

  if (producto.id.toLowerCase().includes(query)) {
    return `ID: "${producto.id}"`;
  }
  if (producto.nombre.toLowerCase().includes(query)) {
    return `Nombre: "${producto.nombre}"`;
  }
  
  const matchingColor = producto.stockProductos?.find(
    (sp) => sp.color?.nombre?.toLowerCase().includes(query)
  );
  if (matchingColor?.color?.nombre) {
    return `Color: "${matchingColor.color.nombre}"`;
  }

  const matchingTalle = producto.stockProductos?.find(
    (sp) => sp.talle?.nombre?.toLowerCase().includes(query)
  );
  if (matchingTalle?.talle?.nombre) {
    return `Talle: "${matchingTalle.talle.nombre}"`;
  }

  return null;
}

function parseQrCode(data: string): { productoId: string; talleId: number; colorId: number } | null {
  const parts = data.trim().split(":");
  if (parts.length < 5 || parts[0] !== "rppro" || parts[1] !== "stock") {
    return null;
  }
  const productoId = parts[2];
  const talleId = Number(parts[3]);
  const colorId = Number(parts[4]);
  
  if ([talleId, colorId].some(Number.isNaN)) return null;
  return { productoId, talleId, colorId };
}

function findStockProducto(
  productos: Product[],
  productoId: string,
  talleId: number,
  colorId: number
): { producto: Product; stockProducto: StockProducto } | null {
  const producto = productos.find((p) => p.id === productoId);
  if (!producto?.stockProductos) return null;

  const stockProducto = producto.stockProductos.find(
    (sp) => sp.talleId === talleId && sp.colorId === colorId
  );
  if (!stockProducto) return null;

  return { producto, stockProducto };
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ProductsScreen({ navigation, route }: { navigation: any; route: any }) {
  // Estados
  const [productos, setProductos] = useState<Product[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [talles, setTalles] = useState<Talle[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Búsqueda
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modales
  const [showQR, setShowQR] = useState(false);
  const [qrProducto, setQrProducto] = useState<Product | null>(null);
  const [qrStockItem, setQrStockItem] = useState<StockProducto | null>(null);
  
  const [showAgregarVariante, setShowAgregarVariante] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Product | null>(null);

  // ============================================================================
  // FILTRADO
  // ============================================================================
  
  const filteredProductos = productos.filter((producto) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();

    if (producto.id.toLowerCase().includes(query)) return true;
    if (producto.nombre.toLowerCase().includes(query)) return true;
    
    const matchColor = producto.stockProductos?.some(
      (sp) => sp.color?.nombre?.toLowerCase().includes(query)
    );
    if (matchColor) return true;

    const matchTalle = producto.stockProductos?.some(
      (sp) => sp.talle?.nombre?.toLowerCase().includes(query)
    );
    if (matchTalle) return true;

    return false;
  });

  // ============================================================================
  // EFECTOS
  // ============================================================================

  const cargarDatos = useCallback(() => {
    setLoading(true);
    (async () => {
      try {
        const [prods, cols, tels] = await Promise.all([
          apiFetch<Product[]>('/api/productos'),
          apiFetch<Color[]>('/api/colores'),
          apiFetch<Talle[]>('/api/talles'),
        ]);
        setProductos(prods);
        setColores(cols);
        setTalles(tels);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useFocusEffect(cargarDatos);

  // Procesar QR escaneado
  useEffect(() => {
    const qrData = (route.params as NavigationParams)?.scannedQrData;
    if (!qrData || productos.length === 0) return;

    const parsed = parseQrCode(qrData);
    if (!parsed) return;

    const result = findStockProducto(
      productos,
      parsed.productoId,
      parsed.talleId,
      parsed.colorId
    );
    
    if (result) {
      setQrProducto(result.producto);
      setQrStockItem(result.stockProducto);
      setShowQR(true);
    }
    
    navigation.setParams({ scannedQrData: undefined });
  }, [productos, route.params, navigation]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSearch = () => {
    setSearchQuery(searchText);
  };

  const handleMoverStock = async (variante: StockProducto, productoId: string, delta: number) => {
    try {
      await apiFetch<StockProducto>('/api/stockProductos', {
        method: "PUT",
        body: {
          productoId,
          coloresYTalles: [{
            color: variante.color?.nombre,
            talle: variante.talle?.nombre,
            cantidad: variante.stock + delta
          }]
        }
      });
      await cargarDatos();
    } catch (error) {
      console.error('Error moviendo stock:', error);
    }
  };

  const handleEliminar = async (producto: Product) => {
    try {
      await apiFetch(`/api/productos/${producto.id}`, { method: "DELETE" });
      await cargarDatos();
    } catch (error) {
      console.error('Error eliminando producto:', error);
    }
  };

  const handleGenerarQr = (producto: Product, sp: StockProducto) => {
    setQrProducto(producto);
    setQrStockItem(sp);
    setShowQR(true);
  };

  const abrirAgregarVariante = (producto: Product) => {
    setProductoSeleccionado(producto);
    setShowAgregarVariante(true);
  };

  const cerrarAgregarVariante = () => {
    setProductoSeleccionado(null);
    setShowAgregarVariante(false);
  };

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <QuickMenu navigation={navigation} />
      <SearchBar
        searchText={searchText}
        setSearchText={setSearchText}
        onSearch={handleSearch}
        total={productos.length}
        filtered={filteredProductos.length}
      />
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      producto={item}
      searchQuery={searchQuery}
      onMoverStock={(variante, delta) => handleMoverStock(variante, item.id, delta)}
      onEliminar={() => handleEliminar(item)}
      onAgregarVariante={() => abrirAgregarVariante(item)}
      onGenerarQr={(sp) => handleGenerarQr(item, sp)}
      onEditar={() => navigation.navigate("EditProduct", { producto: item })}
      navigation={navigation}
    />
  );

  const renderEmpty = () => (
    <EmptyState hasFilter={searchQuery.trim() !== ""} />
  );

  // Loading
  if (loading) {
    return <LoadingState />;
  }

  // ============================================================================
  // RETURN PRINCIPAL
  // ============================================================================

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProductos}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Modales (fuera de FlatList para evitar problemas de renderizado) */}
      <AgregarVariante
        visible={showAgregarVariante}
        producto={productoSeleccionado}
        colores={colores}
        talles={talles}
        onClose={cerrarAgregarVariante}
        onCreated={cargarDatos}
      />

      <GenerarCodigoButton
        visible={showQR}
        stockItem={qrStockItem}
        producto={qrProducto}
        onClose={() => setShowQR(false)}
      />
    </View>
  );
}

// ============================================================================
// ESTILOS
// ============================================================================

const styles = StyleSheet.create({
  // Contenedor principal
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100, // Espacio para el tab bar
  },

  // Header (SearchBar + QuickMenu)
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  // Quick Menu (scroll horizontal)
  menuContainer: {
    marginBottom: 12,
  },
  menuList: {
    paddingRight: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceDark,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  menuIcon: {
    fontSize: 16,
  },
  menuLabel: {
    fontSize: 13,
    color: colors.textInverse,
    fontWeight: "500",
  },

  // Search Bar
  searchContainer: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textInverse,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonText: {
    fontSize: 18,
  },
  resultCount: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textLight,
  },

  // Card de producto
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.surfaceDark,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  cardHighlighted: {
    borderColor: colors.primary,
    borderWidth: 2,
  },

  // Badge de coincidencia
  matchBadge: {
    position: "absolute",
    top: -10,
    right: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  matchBadgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: "700",
  },

  // Acciones
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  actionButton: {
    backgroundColor: colors.backgroundDark,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },

  // Estados
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 16,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textInverse,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: "center",
  },
});
