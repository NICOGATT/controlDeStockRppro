import { View, TextInput, Pressable, Text, StyleSheet, ScrollView} from "react-native";
import { useEffect, useState} from "react";
import { apiFetch } from "../api/apiClient";
import { ColorYTalle } from "../types/ColorYTalle";
import { TipoDePrenda } from "../types/TipoDePrenda";
import { Color } from "../types/Color";
import { Talle } from "../types/Talle";
import { colors } from "../theme/colors";

export default function AddProductsScreen ({navigation}: any) {
    const [nombre, setNombre] = useState("");
    const [precio, setPrecio] = useState(""); 
    const [tipoDePrenda, setTipoDePrenda] = useState<TipoDePrenda | null>(null); 
    const [nroArticulo, setNroArticulo] = useState(""); 
    
    const [colores, setColores] = useState<Color[]>([]);
    const [talles, setTalles] = useState<Talle[]>([]);

    const [color, setColor] = useState<Color | null>(null); 
    const [talle, setTalle] = useState<Talle | null>(null); 
    const [cantidad, setCantidad] = useState("");
    
    const [variantes, setVariantes] = useState<ColorYTalle[]>([]);
    const [nombreColor, setNombreColor] = useState("");
    const [nombreTalle, setNombreTalle] = useState("");
    const [precioVariante, setPrecioVariante] = useState("");

    const nombreValido = nombre.trim().length > 0;
    const variantesValidas = variantes.length > 0; 
    const precioValido = !isNaN(Number(precio)) && Number(precio) > 0;
    const nroDeArticuloValido = nroArticulo.trim().length > 0; 
    const precioVarianteValido = variantes.every((v) => Number(v.precio) > 0); 
    const tieneTallesConPrecioPropio = variantes.some((v) => v.talle.nombre.trim().toLowerCase() !== "unico");
    const formValido = nombreValido && variantesValidas && nroDeArticuloValido && (tieneTallesConPrecioPropio ? precioVarianteValido : precio);

    useEffect(() => {
        (async () => {
            try {
                const coloresData = await apiFetch<Color[]>('/api/colores');
                const talleData = await apiFetch<Talle[]>('/api/talles');
                setColores(coloresData);
                setTalles(talleData);
            } catch (e) {
                console.log('Error cargando colores/talles', e);
            }
        })();
    }, []);

    async function handleSave() {
        if(!formValido) {
            console.log('Formulario no valido: ', {nombreValido, variantesValidas, precioValido});
            return; 
        };
        try {
            await apiFetch<any>('/api/productos', {
                method: "POST", 
                body: {
                    id: nroArticulo.trim(),
                    nombre: nombre.trim(),
                    colorYTalle: variantes.map(v => ({
                        color: v.color.nombre, 
                        talle: v.talle.nombre, 
                        cantidad: Number(v.cantidad), 
                        precio: v.precio ? Number(v.precio) : Number(precio)
                    })), 
                    tipoDePrenda: tipoDePrenda?.nombre ?? null
                }
            });
            navigation.goBack();
        } catch (e: any) {
            console.log('Status: ', e?.response?.status);
            console.log('Data: ', JSON.stringify(e?.response?.data, null));
            throw e; 
        }
    }

    async function agregarVariante(){
        const q = Number(cantidad);
        if(!Number.isFinite(q) || q <= 0) return;  

        try {
            let colorFinal: Color | null = color; 
            let talleFinal: Talle | null = talle; 

            if (!colorFinal && nombreColor.trim()) {
                colorFinal = await createColor(nombreColor); 
            }

            if(!talleFinal && nombreTalle.trim()){
                talleFinal = await createTalle(nombreTalle); 
            }

            if (!colorFinal || !talleFinal) {
                console.log('Falta color y talle'); 
                return ; 
            }

            setVariantes((prev) => {
                const idx = prev.findIndex((v) => v.color.id === colorFinal!.id && v.talle.id === talleFinal!.id);

                if (idx === -1) {
                    return [...prev, {color: colorFinal!, talle: talleFinal!, cantidad: q, precio: Number(precioVariante) || Number(precio)}];
                }
                
                const copia = [...prev]; 
                copia[idx] = {
                    ...copia[idx], 
                    cantidad: copia[idx].cantidad + q
                }; 
                return copia;
            });

            await cargarColores(); 
            await cargarTalles(); 

            setColor(null); 
            setTalle(null); 
            setCantidad("");
            setNombreColor(""); 
            setNombreTalle("");
        } catch (error) {
            console.log('Error agregando variante:', error); 
        }
    }

    async function createColor(nombre: string): Promise<Color> {
        return await apiFetch<Color>('/api/colores', {
            method: "POST", 
            body: {
                nombre: nombre.trim()
            }
        });
    }

    async function createTalle(nombre: string): Promise<Talle> {
        return await apiFetch<Talle>('/api/talles', {
            method: "POST", 
            body: {
                nombre: nombre.trim()
            }
        });
    }

    async function cargarColores() {
        try {
            const data = await apiFetch<Color[]>('/api/colores'); 
            setColores(data);
        } catch (error) {
            console.log('Error cargando colores', error);
        }
    }

    async function cargarTalles() {
        try {
            const data = await apiFetch<Talle[]>('/api/talles'); 
            setTalles(data);
        } catch (error) {
            console.log('Error cargando talles', error);
        }
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Agregar Producto</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Nro de articulo</Text>
                <TextInput
                    placeholder="Ej: RPPRO2025"
                    value={nroArticulo}
                    onChangeText={(text) => setNroArticulo(text)}
                    style={[styles.input, !nroDeArticuloValido && styles.inputError]}
                    placeholderTextColor={colors.textLight}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput 
                    placeholder="Ej: Remera"
                    value={nombre}
                    onChangeText={(text) => setNombre(text)}
                    style={[styles.input, !nombreValido && styles.inputError]}
                    placeholderTextColor={colors.textLight}
                />
            </View>
            
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Precio</Text>
                <TextInput
                    placeholder="Ej: 12000"
                    value={precio}
                    keyboardType="numeric"
                    onChangeText={setPrecio}
                    style={[styles.input, !precioValido && styles.inputError]}
                    placeholderTextColor={colors.textLight}
                />
            </View>

            <View style={styles.divider}/>
            
            <Text style={styles.subtitle}>Variantes (Color + Talle + Cantidad)</Text>
            
            <View style={styles.containerVariante}>
                <View style={styles.topRow}>
                    <View style={styles.box}>
                        <View style={styles.chipsContainer}>
                            <Text style={styles.label}>Color</Text>
                            <View style={styles.chipsRow}>
                                {colores.map((c) => {
                                    const select = color?.id === c.id; 
                                    return (
                                        <Pressable
                                            key={c.id}
                                            onPress={() => setColor(c)}
                                            style={[styles.chip, select && styles.chipSelected]}
                                        >
                                            <Text style={[styles.chipText, select && styles.chipTextSelected]}>{c.nombre}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.chipsContainer}>
                            <Text style={styles.label}>Talle</Text>
                            <View style={styles.chipsRow}>
                                {talles.map((t) => {
                                    const selected = talle?.id === t.id;
                                    return (
                                        <Pressable
                                            key={t.id}
                                            onPress={() => setTalle(t)}
                                            style={[styles.chip, selected && styles.chipSelected]}
                                        >
                                            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{t.nombre}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    </View>

                    <View style={styles.box}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nuevo Color</Text>
                            <TextInput
                                placeholder="Ej: Rojo, Azul..."
                                value={nombreColor}
                                onChangeText={setNombreColor}
                                style={styles.input}
                                placeholderTextColor={colors.textLight}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nuevo Talle</Text>
                            <TextInput
                                placeholder="Ej: L, XL..."
                                value={nombreTalle}
                                onChangeText={setNombreTalle}
                                style={styles.input}
                                placeholderTextColor={colors.textLight}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Precio específico</Text>
                            <TextInput
                                placeholder="Opcional"
                                value={precioVariante}
                                onChangeText={(text) => setPrecioVariante(text.replace(/[^0-9]/g, ""))}
                                keyboardType="numeric"
                                style={styles.input}
                                placeholderTextColor={colors.textLight}
                            />
                        </View>
                    </View>
                </View>
                <View style={styles.bottomRow}>
                    <TextInput
                        placeholder="Cantidad"
                        keyboardType="numeric"
                        value={cantidad}
                        onChangeText={setCantidad}
                        style={styles.cantidadInput}
                        placeholderTextColor={colors.textLight}
                    />
                    <Pressable onPress={agregarVariante} style={styles.varianteButton}>
                        <Text style={styles.varianteButtonText}>Agregar variante</Text>
                    </Pressable>
                </View>
            </View>

            <View style={styles.variantesList}>
                {variantes.length === 0 ? (
                    <Text style={styles.emptyText}>Todavía no agregaste variantes</Text>
                ) : (
                    variantes.map((v, i) => (
                        <View key={`${v.color.id}-${v.talle.id}-${i}`} style={styles.varianteItem}>
                            <Text style={styles.varianteItemText}>
                                {v.color.nombre} / {v.talle.nombre} - Cant: {v.cantidad} {v.precio ? `| $${v.precio}` : ''}
                            </Text>
                            <Pressable onPress={() => setVariantes((prev) => prev.filter((_, idx) => idx !== i))}>
                                <Text style={styles.quitarText}>Quitar</Text>
                            </Pressable>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Tipo de prenda</Text>
                <TextInput
                    placeholder="Ej: Remera / Buzo / Pantalón"
                    value={tipoDePrenda?.nombre || ""}
                    onChangeText={(texto) => {
                        setTipoDePrenda(texto ? { ...tipoDePrenda, nombre: texto } as TipoDePrenda : null);
                    }}
                    style={styles.input}
                    placeholderTextColor={colors.textLight}
                />
            </View>

            <Pressable 
                onPress={handleSave} 
                disabled={!formValido} 
                style={[styles.saveButton, !formValido && styles.saveButtonDisabled]}
            >
                <Text style={styles.saveButtonText}>Guardar</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundDark
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40
    },
    title: {
        fontWeight: "700",
        fontSize: 20,
        color: colors.textPrimary,
        marginBottom: 16
    },
    inputGroup: {
        marginBottom: 12
    },
    input: {
        borderWidth: 1, 
        borderColor: colors.borderDark, 
        padding: 12, 
        borderRadius: 8, 
        fontSize: 16,
        color: colors.textPrimary,
        backgroundColor: colors.surfaceDark
    },
    inputError: {
        borderColor: colors.error
    },
    label: {
        color: colors.textLight,
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 6
    },
    divider: {
        height: 1, 
        backgroundColor: colors.borderDark, 
        marginVertical: 16
    },
    subtitle: {
        fontSize: 16, 
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 12
    },
    containerVariante: {
        padding: 16, 
        gap: 16,
        backgroundColor: colors.surfaceDark,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.borderDark
    }, 
    topRow: {
        flexDirection: "row", 
        gap: 12
    },
    box: {
        flex: 1, 
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 12, 
        padding: 12, 
        gap: 12,
        backgroundColor: colors.backgroundDark
    }, 
    chipsContainer: {
        gap: 6
    },
    chipsRow: {
        flexDirection: "row", 
        flexWrap: "wrap", 
        gap: 8
    }, 
    chip: {
        paddingVertical: 6, 
        paddingHorizontal: 12, 
        borderRadius: 16, 
        borderWidth: 1,
        borderColor: colors.borderDark,
        backgroundColor: colors.surfaceDark
    },
    chipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    chipText: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: "500"
    },
    chipTextSelected: {
        color: colors.textInverse,
        fontWeight: "700"
    },
    bottomRow: {
        flexDirection: "row",
        gap: 12
    },
    cantidadInput: {
        flex: 1,
        borderWidth: 1, 
        borderColor: colors.borderDark, 
        borderRadius: 8, 
        padding: 12,
        fontSize: 16,
        color: colors.textPrimary,
        backgroundColor: colors.surfaceDark
    },
    varianteButton: {
        flex: 2,
        backgroundColor: colors.primary,
        padding: 12, 
        borderRadius: 8, 
        alignItems: "center", 
        justifyContent: "center"
    },
    varianteButtonText: {
        color: colors.textInverse, 
        fontWeight: "700",
        fontSize: 14
    },
    variantesList: {
        gap: 8,
        marginBottom: 16
    },
    emptyText: {
        color: colors.textLight,
        fontSize: 14,
        textAlign: "center",
        paddingVertical: 20
    },
    varianteItem: {
        borderWidth: 1, 
        borderRadius: 10, 
        padding: 12, 
        flexDirection: "row", 
        justifyContent: "space-between", 
        alignItems: "center",
        backgroundColor: colors.surfaceDark,
        borderColor: colors.borderDark
    }, 
    varianteItemText: {
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: "500"
    },
    quitarText: {
        color: colors.error, 
        fontWeight: "700",
        fontSize: 14
    },
    saveButton: {
        backgroundColor: colors.success, 
        padding: 16,
        borderRadius: 10, 
        alignItems: "center",
        marginTop: 8
    },
    saveButtonDisabled: {
        backgroundColor: colors.disabledDark,
    },
    saveButtonText: {
        color: colors.textInverse, 
        fontWeight: "800",
        fontSize: 16
    }
});
