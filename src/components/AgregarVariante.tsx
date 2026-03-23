import React, { useEffect, useState } from "react";
import { Color } from "../types/Color";
import { Product } from "../types/Product";
import { Talle } from "../types/Talle";
import { Alert, Modal, View, StyleSheet, TouchableOpacity, Text, TextInput, ScrollView} from "react-native";
import { apiFetch } from "../api/apiClient";
import { StockProducto } from "../types/StockProducto";
import { colors } from "../theme/colors";

interface Props {
    visible : boolean; 
    producto : Product | null ; 
    colores : Color[]; 
    talles : Talle []; 
    onClose : () => void;
    onCreated : () => void ;
}

export default function AgregarVariante({visible, producto, colores, talles, onClose, onCreated} : Props) {
    const [colorId, setColorId] = useState<number | null>(null);
    const [talleId, setTalleId] = useState<number | null>(null);
    const [stock, setStock] = useState<string>("");
    const [precio, setPrecio] = useState<string>("");
    const [nuevoColor, setNuevoColor] = useState<string>("");
    const [nuevoTalle, setNuevoTalle] = useState<string>("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if(visible) {
            setColorId(null);
            setTalleId(null);
            setStock("");
            setPrecio("");
            setNuevoColor("");
            setNuevoTalle("");
        }
    },[visible]);

    const handleSave = async () => {
        if (!producto) return;

        let colorFinal: string | null = null;
        let talleFinal: string | null = null;
        let colorIdFinal: number | null = colorId;
        let talleIdFinal: number | null = talleId;

        try {
            if (nuevoColor.trim() && !colorId) {
                const res = await apiFetch<Color>('/api/colores', {
                    method: 'POST',
                    body: { nombre: nuevoColor.trim() }
                });
                colorFinal = res.nombre;
                colorIdFinal = res.id;
            } else if (colorId) {
                colorFinal = colores.find(c => c.id === colorId)?.nombre || null;
            }

            if (nuevoTalle.trim() && !talleId) {
                const res = await apiFetch<Talle>('/api/talles', {
                    method: 'POST',
                    body: { nombre: nuevoTalle.trim() }
                });
                talleFinal = res.nombre;
                talleIdFinal = res.id;
            } else if (talleId) {
                talleFinal = talles.find(t => t.id === talleId)?.nombre || null;
            }

            if (!colorFinal || !talleIdFinal) {
                Alert.alert('Falta info', 'Selecciona o crea color y talle');
                return;
            }

            const stockNum = Number(stock);
            const precioNum = Number(precio);

            setSaving(true);

            await apiFetch<StockProducto>('/api/stockProductos', {
                method: 'POST',
                body: {
                    productoId: producto.id,
                    coloresYTalles: [
                        {
                            color: colorFinal,
                            talle: talleFinal,
                            cantidad: stockNum,
                            precio: precioNum
                        }
                    ]
                }
            });

            Alert.alert('Éxito', 'Variante guardada');
            onCreated();
            onClose();
        } catch (e: any) {
            Alert.alert('Error', e?.message || "No se pudo crear la variante");
        } finally {
            setSaving(false);
        }
    };

    if (!visible || !producto) return null;

    return ( 
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalContainer}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Agregar Variante • {producto.nombre}</Text>

                        <View style={styles.twoColumns}>
                            <View style={styles.column}>
                                <Text style={styles.sectionTitle}>Existentes</Text>
                                
                                <View style={styles.chipsContainer}>
                                    <Text style={styles.label}>Color</Text>
                                    <View style={styles.chipsRow}>
                                        {colores.map(c => (
                                            <TouchableOpacity
                                                key={c.id}
                                                onPress={() => {
                                                    setColorId(c.id);
                                                    setNuevoColor("");
                                                }}
                                                style={[styles.chip, colorId === c.id && styles.chipSelected]}
                                            >
                                                <Text style={[styles.chipText, colorId === c.id && styles.chipTextSelected]}>
                                                    {c.nombre}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.chipsContainer}>
                                    <Text style={styles.label}>Talle</Text>
                                    <View style={styles.chipsRow}>
                                        {talles.map(t => (
                                            <TouchableOpacity
                                                key={t.id}
                                                onPress={() => {
                                                    setTalleId(t.id);
                                                    setNuevoTalle("");
                                                }}
                                                style={[styles.chip, talleId === t.id && styles.chipSelected]}
                                            >
                                                <Text style={[styles.chipText, talleId === t.id && styles.chipTextSelected]}>
                                                    {t.nombre}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            <View style={styles.column}>
                                <Text style={styles.sectionTitle}>Nuevos</Text>
                                
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Nuevo Color</Text>
                                    <TextInput
                                        value={nuevoColor}
                                        onChangeText={(text) => {
                                            setNuevoColor(text);
                                            if (text.trim()) setColorId(null);
                                        }}
                                        placeholder="Ej: Rojo, Azul..."
                                        style={styles.input}
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Nuevo Talle</Text>
                                    <TextInput
                                        value={nuevoTalle}
                                        onChangeText={(text) => {
                                            setNuevoTalle(text);
                                            if (text.trim()) setTalleId(null);
                                        }}
                                        placeholder="Ej: L, XL..."
                                        style={styles.input}
                                        placeholderTextColor="#999"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputsRow}>
                            <View style={styles.inputHalf}>
                                <Text style={styles.label}>Stock</Text>
                                <TextInput
                                    keyboardType="numeric"
                                    value={stock}
                                    onChangeText={setStock}
                                    placeholder="Cantidad"
                                    style={styles.input}
                                    placeholderTextColor="#999"
                                />
                            </View>
                            <View style={styles.inputHalf}>
                                <Text style={styles.label}>Precio</Text>
                                <TextInput
                                    keyboardType="numeric"
                                    value={precio}
                                    onChangeText={(text) => setPrecio(text.replace(/[^0-9]/g, ""))}
                                    placeholder="Precio"
                                    style={styles.input}
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity onPress={onClose} disabled={saving} style={[styles.button, styles.buttonCancel]}>
                                <Text style={styles.buttonTextCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.button, styles.buttonSave]}>
                                <Text style={styles.buttonText}>{saving ? "Guardando..." : "Guardar"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1, 
        backgroundColor: colors.overlay, 
        justifyContent: "center",
        padding: 16
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center"
    },
    modalContent: {
        backgroundColor: colors.surfaceDark,
        borderRadius: 16, 
        padding: 16,
        borderWidth: 1,
        borderColor: colors.borderDark
    },
    modalTitle: {
        fontSize: 18, 
        fontWeight: "700", 
        marginBottom: 16,
        textAlign: "center",
        color: colors.textPrimary
    },
    twoColumns: {
        flexDirection: "row",
        gap: 12
    },
    column: {
        flex: 1,
        gap: 12
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.textLight,
        marginBottom: 4
    },
    chipsContainer: {
        gap: 4
    },
    chipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6
    },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: colors.backgroundDark,
        borderWidth: 1,
        borderColor: colors.borderDark
    },
    chipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    chipText: {
        fontSize: 12,
        color: colors.textPrimary
    },
    chipTextSelected: {
        color: colors.textInverse,
        fontWeight: "700"
    },
    inputContainer: {
        gap: 4
    },
    label: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textLight
    },
    input: {
        borderWidth: 1, 
        borderColor: colors.borderDark, 
        borderRadius: 8,
        padding: 10, 
        fontSize: 14,
        color: colors.textPrimary,
        backgroundColor: colors.backgroundDark
    },
    inputsRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 16
    },
    inputHalf: {
        flex: 1,
        gap: 4
    },
    buttonContainer: {
        flexDirection: "row", 
        justifyContent: "space-between", 
        gap: 12, 
        marginTop: 20
    },
    button: {
        flex: 1,
        padding: 14, 
        borderRadius: 10,
        alignItems: "center"
    },
    buttonCancel: {
        backgroundColor: colors.backgroundDark,
        borderWidth: 1,
        borderColor: colors.borderDark
    },
    buttonSave: {
        backgroundColor: colors.primary
    },
    buttonText: {
        color: colors.textInverse,
        fontWeight: "700",
        fontSize: 16
    },
    buttonTextCancel: {
        color: colors.textLight,
        fontWeight: "700",
        fontSize: 16
    }
});
