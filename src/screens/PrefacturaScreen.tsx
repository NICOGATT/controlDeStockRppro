// screens/PrefacturaProductoScreen.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { formatMoney } from "../utils/pedido";
import { useRoute, useNavigation } from "@react-navigation/native";
import { PedidoDraft } from "../types/PedidoDraft";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

type RouteParams = { draft: PedidoDraft };
type RootNav = any;

export function PrefacturaScreen({ navigation }: any) {
    const nav = useNavigation<RootNav>();
    const route = useRoute();
    const { draft } = route.params as RouteParams;

    const { width } = useWindowDimensions();
    const compact = width < 380;
    const fecha = useMemo(() => {
        const d = new Date(draft.fechaISO);
        return d.toLocaleString("es-AR");
    }, [draft.fechaISO]);

    console.log("DRAFT:", draft);

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
                    <p><b>Codigo:</b>${draft.codigo}</p>
                    <p><b>Fecha:</b>${fecha}</p>

                    <h3>Cliente</h3>
                    <p><b>${draft.cliente?.nombre ?? "-"}</b></p>
                    ${draft.cliente?.telefono ? `<p>Tel : ${draft.cliente.telefono}</p>`: ""}
                    ${draft.direccion ? `<p>Dir : ${draft.direccion}</p>`: ""}
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
                        ${draft.items.map(it => `
                            <tr>
                                <td>${it.productoId}</td>
                                <td>${it.nombreProducto}</td>
                                <td>${it.colorNombre} • ${it.talleNombre}</td>
                                <td style="text-align:center">${it.cantidad}</td>
                                <td style="text-align:right">${it.precioUnitario}</td>
                                <td style="text-align:right">${formatMoney(it.subtotal)}</td>
                            </tr>
                        `).join("")}
                    </table>
                    <h3 style="text-align:right">Total: ${formatMoney(draft.total)}</h3>
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
            <Text style={styles.muted}>Código: {draft.codigo}</Text>
            <Text style={styles.muted}>Fecha: {fecha}</Text>
        </View>

        <View style={styles.box}>
            <Text style={styles.boxTitle}>Cliente</Text>
            <Text style={styles.textStrong}>{draft.cliente?.nombre ?? "-"}</Text>
            {!!draft.cliente?.telefono && (
                <Text style={styles.muted}>Tel: {draft.cliente.telefono}</Text>
            )}
            {draft.direccion && (
                <Text style={styles.muted}>Dir: {draft.direccion}</Text>
            )}
        </View>

        <View style={styles.box}>
            <Text style={styles.boxTitle}>Detalle</Text>

            <View style={[styles.tableHead, compact && { paddingHorizontal: 8 }]}>
                <Text style={[styles.th, { flex: 2}]}>Producto</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Variante</Text>
                <Text style={[styles.th, { width: 42, textAlign: "center" }]}>
                    Cant
                </Text>
                <Text style={[styles.th, {width : 110, textAlign: "right"}]}>Precio Unitario</Text>
                <Text style={[styles.th, { width: 90, textAlign: "right" }]}>
                    Subtotal
                </Text>
            </View>

            <FlatList
                data={draft.items}
                keyExtractor={(it) =>
                    `${it.productoId} - ${it.talleId} - ${it.colorId}`
                }
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                renderItem={({ item }) => (
                    <View style={[styles.row, compact && { paddingHorizontal: 8 }]}>
                        <Text style={[styles.td, { flex: 2 }]} numberOfLines={2}>
                            {item.nombreProducto}
                        </Text>
                        <Text style={[styles.tdMuted, { flex:1.5}]} numberOfLines={2}>
                            {item.colorNombre} • {item.talleNombre}
                        </Text>
                        <Text style={[styles.td, {width : 42, textAlign : "center"}]}>
                            {item.cantidad}
                        </Text>
                        <Text style = {[styles.td, {width : 110, textAlign: "right"}]}>
                            {formatMoney(item.precioUnitario)}
                        </Text>
                        <Text style={[styles.td, { width: 90, textAlign: "right" }]}>
                            {formatMoney(item.subtotal)}
                        </Text>
                    </View>
                )}
            />
        </View>

        <View style={styles.footer}>
                <View>
                    <Text style={styles.muted}>Total</Text>
                    <Text style={styles.total}>{formatMoney(draft.total)}</Text>
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
});
