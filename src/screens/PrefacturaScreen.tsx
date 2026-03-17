import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Alert,
  TextInput,
} from "react-native";
import { formatMoney } from "../utils/pedido";
import { useRoute, useNavigation } from "@react-navigation/native";
import { PedidoDraft } from "../types/PedidoDraft";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { apiFetch } from "../api/apiClient";
import { StockProducto } from "../types/StockProducto";
import { PrefacturaProducto } from "../types/PrefacturaProducto";

type RouteParams = { draft?: PedidoDraft; prefacturaId?: number };
type RootNav = any;

export function PrefacturaScreen({ navigation }: any) {
    const nav = useNavigation<RootNav>();
    const route = useRoute();
    const params = route.params as RouteParams;
    const { draft, prefacturaId } = params;

    const { width } = useWindowDimensions();
    const isSmall = width < 380;

    const [prefacturaCompleta, setPrefacturaCompleta] = useState<any>();
    const [qVar, setQVar] = useState("");
    const [variantes, setVariantes] = useState<StockProducto[]>([]);
    const [loadingVar, setLoadingVar] = useState(false);
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        if (prefacturaId) {
            loadPrefacturaData();
        }
    }, [prefacturaId]);

    useEffect(() => {
        if (prefacturaCompleta?.productos) {
            const itemsConvertidos = prefacturaCompleta.productos.map((p: any) => ({
                productoId: p.producto?.id,
                talleId: p.talle?.id,
                colorId: p.color?.id,
                nombreProducto: p.producto?.nombre,
                talleNombre: p.talle?.nombre,
                colorNombre: p.color?.nombre,
                cantidad: p.cantidad,
                precioUnitario: p.producto?.precio,
                subtotal: p.cantidad * (p.producto?.precio || 0)
            }));
            setItems(itemsConvertidos);
        }
    }, [prefacturaCompleta]);

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
                subtotal: sp.producto?.precio ?? 0
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
            console.log("Prefactura completa:", data);
            setPrefacturaCompleta(data);
        } catch (e) {
            console.log("Error loading:", e);
            Alert.alert('Error', 'No se pudieron cargar los datos');
        }
    }

    const columns = isSmall ? 1 : 2;
    const compact = width < 380;

    const fecha = useMemo(() => {
        if (draft?.fechaISO) {
            const d = new Date(draft.fechaISO);
            return d.toLocaleString("es-AR");
        }
        if (prefacturaCompleta?.fechaISO) {
            return new Date(prefacturaCompleta.fechaISO).toLocaleString("es-AR");
        }
        return "";
    }, [draft, prefacturaCompleta]);

    const itemsFinales = draft?.items || items;
    const cliente = draft?.cliente || prefacturaCompleta?.cliente;
    const direccion = draft?.direccion || prefacturaCompleta?.cliente?.direccion?.direccion;
    const codigo = draft?.codigo || `Prefactura #${prefacturaId}`;
    const total = draft?.total || itemsFinales.reduce((acc: number, it: any) => acc + (it.subtotal || it.cantidad * (it.precioUnitario || it.producto?.precio || 0)), 0);

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
            console.log(err);
        }
    }

    const compartirPdf = async () => {
        const html = `
            <html>
                <head>
                    <style>
                        @media print{
                            .no-print{display : none; }
                        }
                    </style>
                </head>
                <body style = "font-family: sans-serif; padding : 20px;">
                    <h2>Prefactura / Remito</h2>
                    <p><b>Codigo:</b>${codigo}</p>
                    <p><b>Fecha:</b>${fecha}</p>

                    <h3>Cliente</h3>
                    <p><b>${cliente?.nombre ?? "-"}</b></p>
                    ${cliente?.telefono ? `<p>Tel : ${cliente.telefono}</p>`: ""}
                    ${direccion ? `<p>Dir : ${direccion}</p>`: ""}
                    <h3>Detalles</h3>
                    <table width="100%" border="1" cellPadding="6" style="border-collapse:collapse;">
                        <tr>
                            <th>Codigo</th>
                            <th>Producto</th>
                            <th>Variante</th>
                            <th>Cant</th>
                            <th>Precio unitario</th>
                            <th>Subtotal</th>
                        </tr>
                        ${itemsFinales.map((it: any) => `
                            <tr>
                                <td>${it.productoId}</td>
                                <td>${it.nombreProducto || it.producto?.nombre || "-"}</td>
                                <td>${it.colorNombre || it.color?.nombre || "-"} • ${it.talleNombre || it.talle?.nombre || "-"}</td>
                                <td style="text-align:center">${it.cantidad}</td>
                                <td style="text-align:right">${it.precioUnitario || it.producto?.precio || 0}</td>
                                <td style="text-align:right">${formatMoney(it.subtotal || (it.cantidad * (it.precioUnitario || it.producto?.precio || 0)))}</td>
                            </tr>
                        `).join("")}
                    </table>
                    <h3 style="text-align:right">Total: ${formatMoney(total)}</h3>
                </body>
            </html>
        `;

        const {uri} = await Print.printToFileAsync({html});
        await Sharing.shareAsync(uri, {mimeType : "application/pdf"})
    }

    return (
    <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>Prefactura / Remito</Text>
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
                <View style={{flexDirection: 'row', gap: 8, marginBottom: 10}}>
                    <TextInput
                        value={qVar}
                        onChangeText={setQVar}
                        placeholder="Buscar producto..."
                        placeholderTextColor="#666"
                        style={{flex: 1, backgroundColor: '#2a2a33', borderRadius: 8, padding: 8, color: 'white'}}
                    />
                    <Pressable onPress={loadStockProductos} style={{backgroundColor: '#3b82f6', padding: 10, borderRadius: 8}}>
                        <Text style={{color: 'white', fontWeight: '700'}}>{loadingVar ? "..." : "Buscar"}</Text>
                    </Pressable>
                </View>
                <FlatList
                    data={variantesFiltradas.slice(0, 10)}
                    key={columns}
                    numColumns={columns}
                    keyExtractor={(v) => `${v.productoId}-${v.colorId}-${v.talleId}`}
                    columnWrapperStyle={columns > 1 ? {gap: 10} : undefined}
                    contentContainerStyle={{gap: 10, paddingTop: 5}}
                    renderItem={({item}) => (
                        <Pressable
                            onPress={() => addStockProductoToItems(item)}
                            style={[styles.card, columns > 1 && {flex: 1}]}
                        >
                            <Text style={styles.cardTitle}>{item.producto?.nombre}</Text>
                            <Text style={styles.muted}>{item.talle?.nombre} • {item.color?.nombre}</Text>
                            <Text style={styles.muted}>Stock: {item.stock}</Text>
                            <Text style={styles.price}>{formatMoney(item.producto?.precio ?? 0)}</Text>
                            <Text style={styles.tap}>Toca para agregar</Text>
                        </Pressable>
                    )}
                />
            </View>
        )}

        <View style={styles.box}>
            <Text style={styles.boxTitle}>Detalle</Text>

            <View style={[styles.tableHead, compact && { paddingHorizontal: 8 }]}>
                <Text style={[styles.th, { flex: 2}]}>Producto</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Variante</Text>
                <Text style={[styles.th, { width: 42, textAlign: "center" }]}>
                    Cant
                </Text>
                <Text style={[styles.th, { width: 70, textAlign: "right" }]}>
                    P.Unit
                </Text>
                <Text style={[styles.th, {width : 80, textAlign: "right"}]}>
                    Subtotal
                </Text>
            </View>

            <FlatList
                data={itemsFinales}
                keyExtractor={(it: any) =>
                    `${it.producto?.id || it.productoId} - ${it.talle?.id || it.talleId} - ${it.color?.id || it.colorId}`
                }
                ListEmptyComponent={<Text style={styles.muted}>No hay productos agregados</Text>}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                renderItem={({ item }: { item: any }) => {
                    const precio = item.precioUnitario || item.producto?.precio || 0;
                    return (
                    <View style={[styles.row, compact && { paddingHorizontal: 8 }]}>
                        <View style={{flex: 2}}>
                            <Text style={[styles.td]} numberOfLines={2}>
                                {item.nombreProducto || item.producto?.nombre || "-"}
                            </Text>
                        </View>
                        <View style={{flex: 1.5}}>
                            <Text style={styles.tdMuted} numberOfLines={2}>
                                {item.colorNombre || item.color?.nombre || "-"} • {item.talleNombre || item.talle?.nombre || "-"}
                            </Text>
                        </View>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                            <Pressable 
                                onPress={() => changeQty(item.productoId, item.talleId, item.colorId, -1)}
                                style={{backgroundColor: '#2a2a33', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6}}
                            >
                                <Text style={{color: 'white', fontWeight: '900'}}>-</Text>
                            </Pressable>
                            <Text style={[styles.td, {width: 30, textAlign: 'center'}]}>{item.cantidad}</Text>
                            <Pressable 
                                onPress={() => changeQty(item.productoId, item.talleId, item.colorId, 1)}
                                style={{backgroundColor: '#2a2a33', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6}}
                            >
                                <Text style={{color: 'white', fontWeight: '900'}}>+</Text>
                            </Pressable>
                        </View>
                        <Text style={[styles.td, {width: 70, textAlign: "right"}]}>
                            {formatMoney(precio)}
                        </Text>
                        <Text style = {[styles.td, {width : 80, textAlign: "right"}]}>
                            {formatMoney(item.subtotal || item.cantidad * precio)}
                        </Text>
                    </View>
                )}}
            />
        </View>

        <View style={styles.footer}>
            <View>
                <Text style={styles.muted}>Total</Text>
                <Text style={styles.total}>{formatMoney(total)}</Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={() => nav.goBack()} style={styles.btnGhost}>
                    <Text style={styles.btnGhostText}>Volver</Text>
                </Pressable>

                <Pressable
                    onPress={compartirPdf}
                    style={[styles.btn, styles.btnPrimary]}
                >
                    <Text style={styles.btnText}>Imprimir/Compartir</Text>
                </Pressable>

                {prefacturaId && (
                    <Pressable
                        onPress={confirmarPedido}
                        style={[styles.btn, { backgroundColor: "#22c55e" }]}
                    >
                        <Text style={styles.btnText}>Confirmar</Text>
                    </Pressable>
                )}
            </View>
        </View>
    </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 14, backgroundColor: "#0b0b0d" },
    header: { marginBottom: 12 },
    title: { color: "white", fontSize: 22, fontWeight: "900" },
    muted: { color: "#9aa4b2", marginTop: 2 },

    box: {
        backgroundColor: "#15151a",
        borderWidth: 1,
        borderColor: "#2a2a33",
        borderRadius: 16,
        padding: 12,
        marginTop: 10,
    },
    boxTitle: { color: "white", fontWeight: "900", marginBottom: 8 },
    textStrong: { color: "white", fontWeight: "900", fontSize: 16 },

    tableHead: {
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    th: { color: "#cbd5e1", fontWeight: "900" },
    row: {
        flexDirection: "row",
        paddingVertical: 10,
        paddingHorizontal: 10,
        alignItems: "center",
    },
    td: { color: "white", fontWeight: "700" },
    tdMuted: { color: "#9aa4b2", fontWeight: "700" },
    sep: { height: 1, backgroundColor: "#2a2a33" },

    footer: {
        marginTop: "auto",
        paddingTop: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
    },
    total: { color: "white", fontSize: 18, fontWeight: "900" },

    btn: {
        backgroundColor: "#2a2a33",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    btnPrimary: { backgroundColor: "#3b82f6" },
    btnText: { color: "white", fontWeight: "800" },
    btnGhost: { paddingHorizontal: 10, paddingVertical: 10 },
    btnGhostText: { color: "#9aa4b2", fontWeight: "800" },

    card: {
        backgroundColor: "#3F403F",
        borderWidth: 1,
        borderColor: "#2a2a33",
        borderRadius: 16,
        padding: 12,
    },
    cardTitle: { color: "white", fontWeight: "800" },
    price: { color: "white", fontWeight: "800", marginTop: 6 },
    tap: { color: "#3b82f6", fontWeight: "700", marginTop: 10 },
});
