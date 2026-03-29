import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { formatMoney } from "../utils/pedido";
import { useRoute, useNavigation } from "@react-navigation/native";
import { PedidoDraft } from "../types/PedidoDraft";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { apiFetch } from "../api/apiClient";
import { StockProducto } from "../types/StockProducto";
import { colors } from "../theme/colors";

type RouteParams = { draft?: PedidoDraft; prefacturaId?: number };
type RootNav = any;

export function PrefacturaScreen({ navigation }: any) {
    const nav = useNavigation<RootNav>();
    const route = useRoute();
    const params = route.params as RouteParams;
    const { draft, prefacturaId } = params;

    const { width } = useWindowDimensions();
    const isSmall = width < 768;
    const isMobile = width < 768;

    const [prefacturaCompleta, setPrefacturaCompleta] = useState<any>();
    const [searchVarText, setSearchVarText] = useState("");
    const [variantes, setVariantes] = useState<StockProducto[]>([]);
    const [loadingVar, setLoadingVar] = useState(false);
    const [items, setItems] = useState<any[]>([]);

    const qVar = searchVarText;

    const handleSearchVar = () => {
        // La búsqueda se hace en tiempo real
    };

    const getVarMatchReason = (sp: StockProducto): string | null => {
        if (!qVar.trim()) return null;
        const query = qVar.toLowerCase();
        if (sp.producto?.nombre?.toLowerCase().includes(query)) {
            return `Nombre: ${sp.producto.nombre}`;
        }
        if (sp.color?.nombre?.toLowerCase().includes(query)) {
            return `Color: ${sp.color.nombre}`;
        }
        if (sp.talle?.nombre?.toLowerCase().includes(query)) {
            return `Talle: ${sp.talle.nombre}`;
        }
        return null;
    };

    useEffect(() => {
        if (prefacturaId) {
            loadPrefacturaData();
            loadStockProductos();
        }
    }, [prefacturaId]);

    useEffect(() => {
        if (prefacturaCompleta?.productos) {
            const stockMap = variantes.reduce((acc: any, sp: any) => {
                const key = `${sp.productoId}-${sp.talleId}-${sp.colorId}`;
                acc[key] = sp;
                return acc;
            }, {});

            const itemsConvertidos = prefacturaCompleta.productos.map((p: any, idx: number) => {
                const key = `${p.producto?.id}-${p.talle?.id}-${p.color?.id}`;
                const stockProducto = stockMap[key] || variantes.find(
                    (sp: any) => 
                        sp.productoId === p.producto?.id && 
                        sp.talleId === p.talle?.id && 
                        sp.colorId === p.color?.id
                );
                const precioUnitario = stockProducto?.producto?.precio || stockProducto?.precio || p.producto?.precio || 0;
                return {
                    _key: `${p.producto?.id || 'p'}-${p.talle?.id || idx}-${p.color?.id || idx}-${idx}`,
                    productoId: p.producto?.id || `producto-${idx}`,
                    talleId: p.talle?.id || idx,
                    colorId: p.color?.id || idx,
                    nombreProducto: p.producto?.nombre,
                    talleNombre: p.talle?.nombre,
                    colorNombre: p.color?.nombre,
                    cantidad: p.cantidad || 0,
                    precioUnitario: precioUnitario,
                    subtotal: (p.cantidad || 0) * precioUnitario
                };
            });
            setItems(itemsConvertidos);
        }
    }, [prefacturaCompleta, variantes]);

    async function loadStockProductos() {
        try {
            setLoadingVar(true);
            const res = await apiFetch<StockProducto[]>('/api/stockProductos');
            const mapped: StockProducto[] = res.map((sp: any) => ({
                productoId: sp.producto?.id,
                talleId: sp.talle?.id,
                colorId: sp.color?.id,
                stock: sp.stock ?? sp.cantidad,
                producto: sp.producto,
                precio: sp.precio,
                talle: sp.talle,
                color: sp.color,
            }));
            setVariantes(mapped);
        } catch (e) {
            Alert.alert("Error", "No se pudieron cargar los productos");
        } finally {
            setLoadingVar(false);
        }
    }

    const variantesFiltradas = useMemo(() => {
        const q = qVar.trim().toLowerCase();
        if (!q) return variantes;
        return variantes.filter((sp) => {
            const prod = sp.producto?.nombre?.toLowerCase() ?? "";
            const col = sp.color?.nombre?.toLowerCase() ?? "";
            const tal = sp.talle?.nombre?.toLowerCase() ?? "";
            return prod.includes(q) || col.includes(q) || tal.includes(q);
        });
    }, [qVar, variantes]);

    function addStockProductoToItems(sp: StockProducto) {
        setItems((prev) => {
            const idx = prev.findIndex((it) => it.productoId === sp.productoId && it.talleId === sp.talleId && it.colorId === sp.colorId);
            if (idx >= 0) {
                const current = prev[idx];
                const nextQty = current.cantidad + 1;
                if (nextQty > sp.stock) {
                    Alert.alert('Sin stock', `Stock disponible: ${sp.stock}`);
                    return prev;
                }
                const updated = [...prev];
                updated[idx] = { ...current, cantidad: nextQty, subtotal: current.precioUnitario * nextQty };
                return updated;
            }
            if (sp.stock <= 0) {
                Alert.alert('Sin stock', 'No hay stock disponible');
                return prev;
            }
            return [...prev, {
                productoId: sp.productoId,
                talleId: sp.talleId,
                colorId: sp.colorId,
                nombreProducto: sp.producto?.nombre,
                talleNombre: sp.talle?.nombre,
                colorNombre: sp.color?.nombre,
                cantidad: 1,
                precioUnitario: sp.precio ?? 0,
                subtotal: sp.precio ?? 0
            }];
        });
    }

    function changeQty(productoId: any, talleId: any, colorId: any, nuevaCantidad: number) {
        setItems((prev) => {
            const idx = prev.findIndex((it) => it.productoId === productoId && it.talleId === talleId && it.colorId === colorId);
            if (idx < 0) return prev;
            const item = prev[idx];
            const nextQty = item.cantidad + nuevaCantidad;
            if (nextQty <= 0) {
                const copy = [...prev];
                copy.splice(idx, 1);
                return copy;
            }
            const copy = [...prev];
            copy[idx] = { ...item, cantidad: nextQty, subtotal: item.precioUnitario * nextQty };
            return copy;
        });
    }

    async function loadPrefacturaData() {
        try {
            const data = await apiFetch<any>(`/api/preFacturaProductos/prefactura/${prefacturaId}`);
            setPrefacturaCompleta(data);
        } catch (e) {
            Alert.alert('Error', 'No se pudieron cargar los datos');
        }
    }

    const columns = isMobile ? 1 : 2;

    const fecha = useMemo(() => {
        if (draft?.fechaISO) {
            const d = new Date(draft.fechaISO);
            return d.toLocaleString("es-AR");
        }
        if (prefacturaCompleta?.fecha) {
            return new Date(prefacturaCompleta.fecha).toLocaleString("es-AR");
        }
        return "";
    }, [draft, prefacturaCompleta]);

    const itemsFinales = draft?.items || items;
    const cliente = draft?.cliente || prefacturaCompleta?.cliente;
    const direccion = draft?.direccion || prefacturaCompleta?.cliente?.direccion?.direccion;
    const codigo = draft?.codigo || `Prefactura #${prefacturaId}`;
    const total = draft?.total || itemsFinales.reduce((acc: number, it: any) => acc + (it.subtotal || it.cantidad * (it.precioUnitario || it.precio || 0)), 0);

    console.log("=== PREFACTURA SCREEN ===");
    console.log("draft:", JSON.stringify(draft, null, 2));
    console.log("prefacturaCompleta:", JSON.stringify(prefacturaCompleta, null, 2));
    console.log("clienteFinal:", JSON.stringify(cliente, null, 2));
    console.log("direccionFinal:", direccion);

    async function confirmarPedido() {
        if (!itemsFinales || itemsFinales.length === 0) {
            Alert.alert('Error', 'No hay productos para confirmar');
            return;
        }

        const productosAgrupados = itemsFinales.reduce((acc: Record<string, {color: string, talle: string, cantidad: number}[]>, item: any) => {
            const pid = item.producto?.id || item.productoId;
            if (!acc[pid]) {
                acc[pid] = [];
            }
            acc[pid].push({
                color: item.color?.nombre || item.colorNombre || "",
                talle: item.talle?.nombre || item.talleNombre || "",
                cantidad: Number(item.cantidad)
            });
            return acc;
        }, {});

        try {
            for (const [productoId, coloresYTalles] of Object.entries(productosAgrupados)) {
                await apiFetch('/api/stockProductos/reduce-stock', {
                    method: "POST",
                    body: {
                        productoId: String(productoId),
                        coloresYTalles
                    }
                });
            }
            Alert.alert('Éxito', 'Pedido confirmado y stock reducido');
            nav.navigate('PedidosScreen');
        } catch (err) {
            Alert.alert('Error', 'No se pudo confirmar el pedido');
        }
    }

    const compartirPdf = async () => {
        const html = `
            <html>
                <body style="font-family: sans-serif; padding: 20px;">
                    <h2>Prefactura / Remito</h2>
                    <p><b>Codigo:</b>${codigo}</p>
                    <p><b>Fecha:</b>${fecha}</p>
                    <h3>Cliente</h3>
                    <p><b>${cliente?.nombre ?? "-"}</b></p>
                    ${cliente?.telefono ? `<p>Tel: ${cliente.telefono}</p>`: ""}
                    ${direccion ? `<p>Dir: ${direccion}</p>`: ""}
                    <h3>Detalles</h3>
                    <table width="100%" border="1" cellPadding="6" style="border-collapse:collapse;">
                        <tr>
                            <th>Producto</th>
                            <th>Variante</th>
                            <th>Cant</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                        </tr>
                        ${itemsFinales.map((it: any) => `
                            <tr>
                                <td>${it.nombreProducto || it.producto?.nombre || "-"}</td>
                                <td>${it.colorNombre || it.color?.nombre || "-"} • ${it.talleNombre || it.talle?.nombre || "-"}</td>
                                <td style="text-align:center">${it.cantidad}</td>
                                <td style="text-align:right">${formatMoney(it.precioUnitario || it.precio || 0)}</td>
                                <td style="text-align:right">${formatMoney(it.subtotal || (it.cantidad * (it.precioUnitario || it.precio || 0)))}</td>
                            </tr>
                        `).join("")}
                    </table>
                    <h3 style="text-align:right">Total: ${formatMoney(total)}</h3>
                </body>
            </html>
        `;
        const {uri} = await Print.printToFileAsync({html});
        await Sharing.shareAsync(uri, {mimeType: "application/pdf"})
    }

    // HEADER para FlatList
    const ListHeader = () => (
        <View style={isMobile ? styles.headerMobile : styles.header}>
            <Text style={isMobile ? styles.titleMobile : styles.title}>Remito</Text>
            <Text style={styles.muted}>Código: {codigo}</Text>
            <Text style={styles.muted}>Fecha: {fecha}</Text>
            
            <View style={[styles.box, isMobile && styles.boxMobile]}>
                <Text style={styles.boxTitle}>Cliente</Text>
                <Text style={styles.textStrong}>{cliente?.nombre ?? "-"}</Text>
                {!!cliente?.telefono && (
                    <Text style={styles.muted}>Tel: {cliente.telefono}</Text>
                )}
                {direccion && (
                    <Text style={styles.muted}>Dir: {direccion}</Text>
                )}
            </View>

            {prefacturaId && (
                <View style={[styles.box, isMobile && styles.boxMobile]}>
                    <Text style={styles.boxTitle}>Agregar Productos</Text>
                    <View style={styles.searchRow}>
                        <TextInput
                            value={searchVarText}
                            onChangeText={setSearchVarText}
                            onSubmitEditing={handleSearchVar}
                            placeholder="Buscar por nombre, color o talle..."
                            placeholderTextColor="#666"
                            returnKeyType="search"
                            style={styles.searchInput}
                        />
                        <Pressable onPress={handleSearchVar} style={styles.searchBtn}>
                            <Text style={styles.searchBtnText}>🔍</Text>
                        </Pressable>
                    </View>
                    <Text style={styles.resultCount}>
                        {variantesFiltradas.length} producto(s) encontrado(s)
                    </Text>
                </View>
            )}

            {/* <View style={[styles.box, isMobile && styles.boxMobile]}>
                <Text style={styles.boxTitle}>Detalle</Text>
            </View> */}
        </View>
    );

    // PRODUCTO ITEM para FlatList
    const renderProducto = ({ item, index }: { item: any; index: number }) => {
        const matchReason = getVarMatchReason(item);
        const isHighlighted = qVar.trim() !== '';
        
        if (isSmall) {
            return (
                <View style={styles.productCardMobile}>
                    {isHighlighted && matchReason && (
                        <View style={styles.matchBadge}>
                            <Text style={styles.matchBadgeText}>✓ {matchReason}</Text>
                        </View>
                    )}
                    <Text style={styles.productNameMobile}>{item.producto?.nombre}</Text>
                    <Text style={styles.productDetail}>{item.color?.nombre} • {item.talle?.nombre}</Text>
                    <Text style={styles.productDetail}>Stock: {item.stock}</Text>
                    <Text style={styles.productPriceMobile}>{formatMoney(item.precio ?? 0)}</Text>
                    <Pressable style={styles.addButton} onPress={() => addStockProductoToItems(item)}>
                        <Text style={styles.addButtonText}>Agregar</Text>
                    </Pressable>
                </View>
            );
        }

        return (
            <Pressable
                style={[styles.productCard, index % 2 === 0 && styles.productCardLeft]}
                onPress={() => addStockProductoToItems(item)}
            >
                {isHighlighted && matchReason && (
                    <View style={styles.matchBadge}>
                        <Text style={styles.matchBadgeText}>✓ {matchReason}</Text>
                    </View>
                )}
                <Text style={styles.cardTitle}>{item.producto?.nombre}</Text>
                <Text style={styles.muted}>{item.talle?.nombre} • {item.color?.nombre}</Text>
                <Text style={styles.muted}>Stock: {item.stock}</Text>
                <Text style={styles.price}>{formatMoney(item.precio ?? 0)}</Text>
                <Text style={styles.tap}>Toca para agregar</Text>
            </Pressable>
        );
    };

    // ITEM de PEDIDO para FlatList
    const renderPedidoItem = ({ item, index }: { item: any; index: number }) => {
        const precio = item.precioUnitario || item.precio || 0;

        if (isSmall) {
            return (
                <View style={styles.pedidoCardMobile}>
                    <Text style={styles.pedidoProductName}>{item.nombreProducto || item.producto?.nombre || "-"}</Text>
                    <Text style={styles.pedidoVariant}>{item.colorNombre || item.color?.nombre || "-"} • {item.talleNombre || item.talle?.nombre || "-"}</Text>
                    
                    <View style={styles.pedidoQtyRow}>
                        <Text style={styles.pedidoLabel}>Cantidad:</Text>
                        <View style={styles.qtyControls}>
                            <Pressable style={styles.qtyBtn} onPress={() => changeQty(item.productoId, item.talleId, item.colorId, -1)}>
                                <Text style={styles.qtyBtnText}>-</Text>
                            </Pressable>
                            <Text style={styles.qtyValue}>{item.cantidad}</Text>
                            <Pressable style={styles.qtyBtn} onPress={() => changeQty(item.productoId, item.talleId, item.colorId, 1)}>
                                <Text style={styles.qtyBtnText}>+</Text>
                            </Pressable>
                        </View>
                    </View>
                    
                    <View style={styles.pedidoPrices}>
                        <Text style={styles.pedidoPriceLabel}>P.Unit: {formatMoney(precio)}</Text>
                        <Text style={styles.pedidoSubtotal}>Subtotal: {formatMoney(item.subtotal || item.cantidad * precio)}</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={[styles.pedidoRow, index % 2 === 0 && styles.pedidoRowAlt]}>
                <View style={styles.pedidoColProduct}>
                    <Text style={styles.pedidoText} numberOfLines={2}>{item.nombreProducto || item.producto?.nombre || "-"}</Text>
                </View>
                <View style={styles.pedidoColVariant}>
                    <Text style={styles.pedidoTextMuted} numberOfLines={2}>{item.colorNombre || item.color?.nombre || "-"} • {item.talleNombre || item.talle?.nombre || "-"}</Text>
                </View>
                <View style={styles.pedidoColQty}>
                    <Pressable style={styles.qtyBtnSmall} onPress={() => changeQty(item.productoId, item.talleId, item.colorId, -1)}>
                        <Text style={styles.qtyBtnTextSmall}>-</Text>
                    </Pressable>
                    <Text style={styles.qtyValueSmall}>{item.cantidad}</Text>
                    <Pressable style={styles.qtyBtnSmall} onPress={() => changeQty(item.productoId, item.talleId, item.colorId, 1)}>
                        <Text style={styles.qtyBtnTextSmall}>+</Text>
                    </Pressable>
                </View>
                <Text style={styles.pedidoPrice}>{formatMoney(precio)}</Text>
                <Text style={styles.pedidoSubtotalText}>{formatMoney(item.subtotal || item.cantidad * precio)}</Text>
            </View>
        );
    };

    // FOOTER
    const ListFooter = () => (
        <View style={isSmall ? styles.footerMobile : styles.footer}>
            <View style={styles.footerTotalRow}>
                <Text style={styles.footerTotalLabel}>Total</Text>
                <Text style={styles.footerTotalAmount}>{formatMoney(total)}</Text>
            </View>
            <View style={styles.footerButtonsRow}>
                <Pressable onPress={() => nav.goBack()} style={styles.btnSecondary}>
                    <Text style={styles.btnSecondaryText}>Volver</Text>
                </Pressable>
                <Pressable onPress={compartirPdf} style={styles.btnSecondary}>
                    <Text style={styles.btnSecondaryText}>Imprimir</Text>
                </Pressable>
                {prefacturaId && (
                    <Pressable onPress={confirmarPedido} style={styles.btnConfirm}>
                        <Text style={styles.btnConfirmText}>Confirmar</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );

    const allItems = [
        ...(prefacturaId ? variantesFiltradas.slice(0, 20).map((v, i) => ({ type: 'producto', data: v, key: `prod-${v.productoId}-${v.colorId}-${v.talleId}` })) : []),
        ...itemsFinales.map((it, i) => ({ type: 'pedido', data: it, key: `ped-${it.productoId}-${it.talleId}-${it.colorId}-${i}` }))
    ];

    const renderItem = ({ item }: { item: any }) => {
        if (item.type === 'producto') {
            return renderProducto({ item: item.data, index: 0 });
        }
        return renderPedidoItem({ item: item.data, index: 0 });
    };

    if (isSmall) {
        return (
            <View style={styles.container}>
                <FlatList
                    data={allItems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.key}
                    ListHeaderComponent={ListHeader}
                    ListFooterComponent={ListFooter}
                    contentContainerStyle={styles.scrollContentMobile}
                    showsVerticalScrollIndicator={true}
                    style={{flex: 1}}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView 
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Remito</Text>
                    <Text style={styles.muted}>Código: {codigo}</Text>
                    <Text style={styles.muted}>Fecha: {fecha}</Text>
                </View>

                <View style={styles.box}>
                    <Text style={styles.boxTitle}>Cliente</Text>
                    <Text style={styles.textStrong}>{cliente?.nombre ?? "-"}</Text>
                    {!!cliente?.telefono && (
                        <Text style={styles.muted}>Tel: {cliente.telefono}</Text>
                    )}
                    {direccion && (
                        <Text style={styles.muted}>Dir: {direccion}</Text>
                    )}
                </View>

                {prefacturaId && (
                    <View style={styles.box}>
                        <Text style={styles.boxTitle}>Agregar Productos</Text>
                        <View style={styles.searchRow}>
                            <TextInput
                                value={searchVarText}
                                onChangeText={setSearchVarText}
                                onSubmitEditing={handleSearchVar}
                                placeholder="Buscar por nombre, color o talle..."
                                placeholderTextColor="#666"
                                returnKeyType="search"
                                style={styles.searchInput}
                            />
                            <Pressable onPress={handleSearchVar} style={styles.searchBtn}>
                                <Text style={styles.searchBtnText}>🔍</Text>
                            </Pressable>
                        </View>
                        <Text style={styles.resultCount}>
                            {variantesFiltradas.length} producto(s) encontrado(s)
                        </Text>
                        <View style={styles.productGrid}>
                            {variantesFiltradas.slice(0, 20).map((item, index) => (
                                <View key={`${item.productoId}-${item.colorId}-${item.talleId}`}>
                                    {renderProducto({ item, index })}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.box}>
                    <Text style={styles.boxTitle}>Detalle</Text>
                    <View style={styles.tableHead}>
                        <Text style={[styles.th, { flex: 2}]}>Producto</Text>
                        <Text style={[styles.th, { flex: 1.5}]}>Variante</Text>
                        <Text style={[styles.th, { width: 100, textAlign: "center" }]}>Cant</Text>
                        <Text style={[styles.th, { width: 90, textAlign: "right" }]}>P.Unit</Text>
                        <Text style={[styles.th, { width: 100, textAlign: "right" }]}>Subtotal</Text>
                    </View>
                    <View style={styles.itemsContainer}>
                        {itemsFinales.map((item, index) => (
                            <View key={item._key || `${item.productoId}-${item.talleId}-${item.colorId}-${index}`}>
                                {renderPedidoItem({ item, index })}
                            </View>
                        ))}
                    </View>
                </View>

                <ListFooter />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundDark,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 18,
        paddingTop: 8,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 16,
    },
    headerMobile: {
        marginBottom: 16,
        paddingTop: 8,
        padding: 10
    },
    title: {
        color: colors.textInverse,
        fontSize: 22,
        fontWeight: "900",
    },
    titleMobile: {
        color: colors.textInverse,
        fontSize: 20,
        fontWeight: "900",
        marginBottom: 8,
    },
    muted: {
        color: colors.textLight,
        marginTop: 2,
        fontSize: 14,
    },
    box: {
        backgroundColor: colors.surfaceDark,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
    },
    boxMobile: {
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    boxTitle: {
        color: colors.textInverse,
        fontWeight: "900",
        marginBottom: 8,
        fontSize: 16,
    },
    textStrong: {
        color: colors.textInverse,
        fontWeight: "900",
        fontSize: 16,
    },
    searchRow: {
        flexDirection: "row",
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        backgroundColor: colors.surfaceDark,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        color: colors.textInverse,
        fontSize: 14,
    },
    searchBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingHorizontal: 14,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
    },
    searchBtnText: {
        fontSize: 18,
    },
    resultCount: {
        color: colors.textLight,
        fontSize: 12,
        marginBottom: 8,
    },
    productGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    productCard: {
        backgroundColor: colors.surfaceDark,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 16,
        padding: 12,
        width: "48%",
        position: "relative",
    },
    productCardLeft: {
        marginRight: "2%",
    },
    productCardMobile: {
        backgroundColor: colors.surfaceDark,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        position: "relative",
    },
    cardTitle: {
        color: colors.textInverse,
        fontWeight: "800",
        fontSize: 14,
        marginBottom: 4,
    },
    productNameMobile: {
        color: colors.textInverse,
        fontWeight: "800",
        fontSize: 16,
        marginBottom: 6,
    },
    productDetail: {
        color: colors.textLight,
        fontSize: 13,
        marginBottom: 2,
    },
    productPriceMobile: {
        color: colors.success,
        fontWeight: "800",
        fontSize: 18,
        marginTop: 8,
        marginBottom: 12,
    },
    price: {
        color: colors.textInverse,
        fontWeight: "800",
        marginTop: 6,
        fontSize: 14,
    },
    tap: {
        color: colors.primary,
        fontWeight: "700",
        marginTop: 10,
        fontSize: 12,
    },
    addButton: {
        backgroundColor: colors.success,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    addButtonText: {
        color: colors.textInverse,
        fontWeight: "800",
        fontSize: 14,
    },
    matchBadge: {
        backgroundColor: colors.success,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        position: "absolute",
        top: 8,
        right: 8,
        zIndex: 1,
    },
    matchBadgeText: {
        color: colors.textInverse,
        fontSize: 10,
        fontWeight: "bold",
    },
    tableHead: {
        flexDirection: "row",
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderDark,
    },
    th: {
        color: colors.textLight,
        fontWeight: "900",
        fontSize: 12,
    },
    pedidoRow: {
        flexDirection: "row",
        paddingVertical: 12,
        paddingHorizontal: 10,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: colors.borderDark,
    },
    pedidoRowAlt: {
        backgroundColor: colors.surfaceDark,
    },
    pedidoColProduct: {
        flex: 2,
    },
    pedidoColVariant: {
        flex: 1.5,
    },
    pedidoColQty: {
        width: 100,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    pedidoText: {
        color: colors.textInverse,
        fontWeight: "700",
        fontSize: 13,
    },
    pedidoTextMuted: {
        color: colors.textLight,
        fontWeight: "700",
        fontSize: 12,
    },
    pedidoPrice: {
        color: colors.textInverse,
        fontWeight: "700",
        fontSize: 13,
        width: 90,
        textAlign: "right",
    },
    pedidoSubtotalText: {
        color: colors.textInverse,
        fontWeight: "800",
        fontSize: 13,
        width: 100,
        textAlign: "right",
    },
    pedidoCardMobile: {
        backgroundColor: colors.surfaceDark,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
    },
    pedidoProductName: {
        color: colors.textInverse,
        fontWeight: "800",
        fontSize: 16,
        marginBottom: 4,
    },
    pedidoVariant: {
        color: colors.textLight,
        fontSize: 13,
        marginBottom: 12,
    },
    pedidoQtyRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    pedidoLabel: {
        color: colors.textLight,
        fontSize: 14,
    },
    qtyControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    qtyBtn: {
        backgroundColor: colors.primary,
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    qtyBtnText: {
        color: colors.textInverse,
        fontWeight: "900",
        fontSize: 20,
    },
    qtyValue: {
        color: colors.textInverse,
        fontWeight: "800",
        fontSize: 18,
        minWidth: 30,
        textAlign: "center",
    },
    qtyBtnSmall: {
        backgroundColor: colors.surfaceDark,
        width: 28,
        height: 28,
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
    },
    qtyBtnTextSmall: {
        color: colors.textInverse,
        fontWeight: "900",
        fontSize: 16,
    },
    qtyValueSmall: {
        color: colors.textInverse,
        fontWeight: "800",
        fontSize: 14,
        minWidth: 25,
        textAlign: "center",
    },
    pedidoPrices: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.borderDark,
    },
    pedidoPriceLabel: {
        color: colors.textLight,
        fontSize: 13,
    },
    pedidoSubtotal: {
        color: colors.success,
        fontWeight: "800",
        fontSize: 16,
    },
    footer: {
        backgroundColor: colors.surfaceDark,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderTopWidth: 2,
        borderTopColor: colors.primary,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginHorizontal: -14,
        marginBottom: -14,
        paddingBottom: 30,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    footerTotalRow: {
        marginBottom: 16,
    },
    footerTotalLabel: {
        color: colors.textLight,
        fontSize: 14,
        marginBottom: 4,
    },
    footerTotalAmount: {
        color: colors.textInverse,
        fontSize: 28,
        fontWeight: "900",
    },
    footerButtonsRow: {
        flexDirection: "row",
        gap: 10,
    },
    btnSecondary: {
        flex: 1,
        backgroundColor: colors.surfaceDark,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    btnSecondaryText: {
        color: colors.textLight,
        fontWeight: "700",
        fontSize: 14,
    },
    btnConfirm: {
        flex: 2,
        backgroundColor: colors.success,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    btnConfirmText: {
        color: colors.textInverse,
        fontWeight: "800",
        fontSize: 16,
    },
    footerMobile: {
        backgroundColor: colors.surfaceDark,
        paddingVertical : 16, 
        paddingHorizontal: 16,
        borderTopWidth: 2,
        borderTopColor: colors.primary,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,

    },
    scrollContentMobile: {
        paddingBottom: 150,
        paddingHorizontal: 0,
    },
    itemsContainer: {
        gap: 0,
    },
});
