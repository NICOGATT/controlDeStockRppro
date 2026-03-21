import React, {useEffect, useMemo, useState} from "react"; 
import {Alert, FlatList, Text, TextInput, TouchableOpacity,useWindowDimensions,View, StyleSheet, Pressable, Modal, Platform, ScrollView} from "react-native"; 
import { StockProducto } from "../types/StockProducto";
import { Product } from "../types/Product";
import { Cliente } from "../types/Cliente";
import { PedidoItem } from "../types/PedidoItem";
import { calcTotal, calcularSubtTotal, generarCodigoPedido } from "../utils/pedido";
import { PedidoDraft } from "../types/PedidoDraft";
import { apiFetch } from "../api/apiClient";
import { Direccion } from "../types/Direccion";
import { Prefactura } from "../types/Prefactura";
import { PrefacturaProducto } from "../types/PrefacturaProducto";



const formatMoney = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);

export default function ArmarPedidoScreen({navigation} : any) {
    const { width } = useWindowDimensions();
    const isSmall = width < 380;

    const [clientes, setClientes] = useState<Cliente[]>([]); 
    const [clientesSel, setClientesSel] = useState<Cliente>(); 

    const [modalCliente, setModalCliente] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState("");
    const [nuevoTel, setNuevoTel] = useState("");
    const [nuevoDir, setNuevoDir] = useState("");
    const [direccion, setDireccion] = useState<Direccion | null>(null);
    const [direccion2, setDireccion2] = useState<string>("")

    const [qVar, setQVar] = useState("");
    const [searchVarText, setSearchVarText] = useState("");
    const [variantes, setVariantes] = useState<StockProducto[]>([]);
    const [loadingVar, setLoadingVar] = useState(false);

    const [searchClienteText, setSearchClienteText] = useState("");
    const [searchClienteQuery, setSearchClienteQuery] = useState("");

    const handleSearchVar = () => {
        setQVar(searchVarText);
    };

    const handleSearchCliente = () => {
        setSearchClienteQuery(searchClienteText);
    };

    const [items, setItems] = useState<PedidoItem[]>([]);
    const total = useMemo(() => calcTotal(items), [items]);
    

    const draft : PedidoDraft = useMemo(() => ({
        codigo : generarCodigoPedido(), 
        fechaISO : new Date().toISOString(),
        cliente : clientesSel,
        direccion: direccion2 || "", 
        items, 
        total,
    }), [clientesSel, direccion, items, total]);

    const filteredClientes = useMemo(() => {
        if (!searchClienteQuery.trim()) return clientes;
        const q = searchClienteQuery.toLowerCase();
        return clientes.filter(c => 
            c.nombre.toLowerCase().includes(q) ||
            c.telefono?.toLowerCase().includes(q)
        );
    }, [clientes, searchClienteQuery]);

    const variantesFiltradas = useMemo(() => {
        if (!qVar.trim()) return variantes;
        const q = qVar.toLowerCase();
        return variantes.filter((sp) => {
            const prod = sp.producto?.nombre?.toLowerCase() ?? "";
            const col = sp.color?.nombre?.toLowerCase() ?? "";
            const tal = sp.talle?.nombre?.toLowerCase() ?? "";
            return prod.includes(q) || col.includes(q) || tal.includes(q)
        });
    }, [qVar, variantes]);

    const getVarMatchReason = (sp: StockProducto): string | null => {
        if (!qVar.trim()) return null;
        const q = qVar.toLowerCase();
        if (sp.producto?.nombre?.toLowerCase().includes(q)) {
            return `Nombre: ${sp.producto.nombre}`;
        }
        if (sp.color?.nombre?.toLowerCase().includes(q)) {
            return `Color: ${sp.color.nombre}`;
        }
        if (sp.talle?.nombre?.toLowerCase().includes(q)) {
            return `Talle: ${sp.talle.nombre}`;
        }
        return null;
    };

    async function loadClientes() {
        const res = await apiFetch<Cliente[]>('/api/clientes');
        //Adapta mapping segun tu backend
        const mapped : Cliente[] = res.map((c : any) => ({ 
            id : c.id, 
            nombre : c.nombre, 
            telefono : c.telefono,
            direccion : c.direccion
        })); 
        setClientes(mapped);
        if(!clientesSel && mapped.length > 0) setClientesSel(mapped[0]);
    }

    async function loadStockProductos() {
        try {
            setLoadingVar(true);
            const res = await getStockProductos();
            console.log("stockProductos API response:", res);
            const mapped : StockProducto[] = res.map((sp : any) => ({
                productoId : sp.producto?.id,
                talleId : sp.talle?.id, 
                colorId : sp.color?.id,
                stock : sp.stock ?? sp.cantidad,
                producto : sp.producto,
                precio : sp.precio, 
                talle : sp.talle,
                color : sp.color,
            }));
            setVariantes(mapped);
        } catch (e) {
            Alert.alert("Error", "No se pudieron cargar los productos");
        } finally {
            setLoadingVar(false);
        }
    }

    function getStockProductos() {
        return apiFetch<StockProducto[]>('/api/stockProductos');
    }

    function getStockProductoByProducto(productoId : number) {
        return apiFetch<StockProducto[]>(`/api/stockProductos?productoId=${productoId}`);
    }

    useEffect(() => {
        loadClientes();
        loadStockProductos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function addStockProductoToItems(sp : StockProducto) {
        //Si ya existe, incrementa en cantidad 
        setItems((prev) => {
            const idx = prev.findIndex((it) => it.productoId === sp.productoId && it.talleId === sp.talleId && it.colorId === sp.colorId);

            if(idx >= 0) {
                const current = prev[idx]; 
                const nextQty = current.cantidad + 1; 
                if (nextQty > sp.stock) {
                    Alert.alert('Sin stock', `Stock disponible: ${sp.stock}`)
                    return prev;
                }
                const updated = [...prev]; 
                updated[idx] = {
                    ...current, 
                    cantidad : nextQty, 
                    subtotal : calcularSubtTotal(current.precioUnitario, nextQty)
                }
                return updated;
            }

            if (sp.stock <= 0) {
                Alert.alert('Sin stock', 'No hay stock disponible para este producto');
                return prev;
            }

            const item : PedidoItem = {
                productoId : sp.productoId,
                talleId : sp.talleId,
                colorId : sp.colorId,
                nombreProducto : sp.producto?.nombre ?? `Producto ${sp.productoId}`,
                talleNombre : sp.talle?.nombre,
                colorNombre : sp.color?.nombre,
                cantidad : 1,
                precioUnitario : sp.precio ?? 0,
                subtotal : calcularSubtTotal(sp.precio ?? 0, 1)
            }

            return [...prev, item];
        })
    }

    function changeQty(productoId : string, talleId : number, colorId : number, nuevaCantidad : number) {
        setItems((prev) => {
            const idx = prev.findIndex((it) => it.productoId === productoId && it.talleId === talleId && it.colorId === colorId);
            if(idx < 0) return prev;
            const item = prev[idx];
            const sp = variantes.find((v) => v.productoId === productoId && v.talleId === talleId && v.colorId === colorId);
            const max = sp?.stock ?? Infinity;

            const nextQty = item.cantidad + nuevaCantidad;
            if (nextQty <= 0) {
                //remove
                const copy = [...prev];
                copy.splice(idx, 1);
                return copy;
            }
            if(nextQty > max) {
                Alert.alert('Sin stock', `Stock disponible: ${max}`);
                return prev;
            }

            const copy = [...prev];
            copy[idx] = {
                ...item, 
                cantidad : nextQty,
                subtotal : calcularSubtTotal(item.precioUnitario, nextQty)
            }
            return copy;
        })
    }

    async function crearCliente() {
        if (!nuevoNombre.trim()) {
            Alert.alert('Falta info', 'El nombre es requerido');
            return;
        }
        try {
            
            const res = await apiFetch<Cliente>('/api/clientes', {
                method : 'POST', 
                body : {
                    nombre : nuevoNombre.trim(),
                    telefono : nuevoTel.trim() || undefined,
                    direccion : nuevoDir.trim()
                }
            })
            
            const direcciones = await crearDireccion(res.id);
            const c : Cliente = {
                id : res.id,
                nombre : res.nombre,
                telefono : res.telefono,
                direccion : direcciones
            }

            setClientes((p) => [c, ...p]);
            setClientesSel(c);


            setNuevoNombre("");                                     
            setNuevoTel("");
            setModalCliente(false);
        } catch (err) {
            Alert.alert('Error', 'No se pudo crear el cliente');
        }
    }

    async function crearDireccion (clienteId : number) {
        if (!nuevoDir.trim()) {
            Alert.alert('Falta info', 'La direccion es requerida');
            return;
        }
        try {
            const res = await apiFetch<Direccion>('/api/direcciones', {
                method : 'POST', 
                body : {
                    direccion : nuevoDir.trim(),
                    clienteId : clienteId
                }
            })
            const d : Direccion= {
                id : res.id,
                direccion : res.direccion,
                clienteId : res.clienteId
            }
            setDireccion(d);
            setNuevoDir("");
            return d; 
        } catch (err) {
            Alert.alert('Error', 'No se pudo crear la direccion');
        }
    }

    async function getDireccionByClienteId(clienteId: number){
        return apiFetch<Direccion[]> (`/api/direcciones/cliente/${clienteId}`)
    }
    
    async function confirmarPedido() {
        if(!clientesSel){
            Alert.alert('Falta cliente', 'Selecciona un cliente para continuar');
            return; 
        }
        if(items.length === 0) {
            Alert.alert('Falta productos', 'Agrega al menos un producto para continuar');
            return;
        }

        const productosAgrupados = items.reduce((acc, item) => {
            const pid = item.productoId;
            if (!acc[pid]) {
                acc[pid] = [];
            }
            if (item.colorNombre && item.talleNombre) {
                acc[pid].push({
                    color: item.colorNombre,
                    talle: item.talleNombre,
                    cantidad: item.cantidad
                });
            }
            return acc;
        }, {} as Record<string, {color: string, talle: string, cantidad: number}[]>);

        try {
            for (const [productoId, coloresYTalles] of Object.entries(productosAgrupados)) {
                await apiFetch('/api/stockProductos/reduce-stock', {
                    method: "POST",
                    body: {
                        productoId: Number(productoId),
                        coloresYTalles
                    }
                });
            }
            Alert.alert('Éxito', 'Stock reducido correctamente');
            setItems([]);
            loadStockProductos();
        } catch (err) {
            Alert.alert('Error', 'No se pudo reducir el stock');
            console.log(err);
        }
    }

    async function goPrefactura() {
        if(!clientesSel){
            Alert.alert('Falta cliente', 'Selecciona un cliente para continuar');
            return; 
        }
        if(items.length === 0) {
            Alert.alert('Falta productos', 'Agrega al menos un producto para continuar');
            return;
        }

        const direcciones = await getDireccionByClienteId(clientesSel.id); 
        const direccionStr = direcciones?.[0]?.direccion || ""
        setDireccion2(direccionStr);

        const bodyPrefactura = {
            cliente: clientesSel.nombre.trim(),
            telefono: clientesSel.telefono?.trim() || "",
            // Usamos la propiedad direccion del objeto Direccion
            direccion: direccionStr 
        };
        try {
            console.log("BODY PREF:", bodyPrefactura);
            // 2. Intentamos crear la prefactura
            const prefactura = await apiFetch<Prefactura>('/api/preFacturas', {
                method: "POST",
                body: bodyPrefactura
            });

            // 3. SOLO SI recibimos una respuesta válida y un ID, seguimos con los productos
            if (prefactura && prefactura.id) {
                const productosPayload = items.map(it => ({
                    productoId: String(it.productoId),
                    talleId: Number(it.talleId),
                    colorId: Number(it.colorId),
                    cantidad: Math.floor(Number(it.cantidad))
                }));
                
                console.log("Enviando productos:", JSON.stringify({
                    preFacturaId: prefactura.id,
                    productos: productosPayload
                }, null, 2));
                
                const resProductos = await apiFetch<PrefacturaProducto>('/api/preFacturaProductos', {
                    method: "POST",
                    body: {
                        preFacturaId: prefactura.id,
                        productos: productosPayload
                    }
                });
                console.log("Response productos:", resProductos);
                navigation.navigate('Prefactura', { 
                    draft: { ...draft, direccion: direccionStr } 
                });
            } else {
                console.error("El servidor respondió pero no devolvió un ID de prefactura.");
            }

        } catch (err : any) {
            // Aquí verás el error real en la consola sin que se rompa la app
            console.log("STATUS:", err?.response?.status);
            console.log("DATA:", err?.response?.data);
            console.log("HEADERS:", err?.response?.headers);
            throw err;
        }
    }
    const columns = isSmall ? 1 : 2;
    return ( 
        <View style={{flex: 1}}>
        <ScrollView style = {{flex : 1, padding : 16}} contentContainerStyle={{paddingBottom: 120}} nestedScrollEnabled={true}>
            <Text style = {{fontSize : 18, fontWeight : "800", marginBottom: 10}}>Armar pedido</Text>
            {/* CLIENTE */}
            <View style = {styles.section}>
                <View style = {styles.rowBetween}>
                    <Text style = {styles.sectionTitle}>Cliente</Text>
                    <Pressable onPress = {() => setModalCliente(true)} style = {styles.btnGhost}>
                        <Text style = {styles.btnGhostText}>+ Agregar</Text>
                    </Pressable>
                </View>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInputCliente}
                        placeholder="Buscar cliente por nombre o telefono..."
                        value={searchClienteText}
                        onChangeText={setSearchClienteText}
                        onSubmitEditing={handleSearchCliente}
                        returnKeyType="search"
                    />
                    <Pressable style={styles.searchBtn} onPress={handleSearchCliente}>
                        <Text style={styles.searchBtnText}>🔍</Text>
                    </Pressable>
                </View>

                <Text style={styles.resultCount}>
                    {filteredClientes.length} cliente(s) encontrado(s)
                </Text>

                <FlatList
                    data = {filteredClientes}
                    keyExtractor={(c) => String(c.id)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle = {{gap : 8}}
                    renderItem={({item}) => {
                        const active = item.id === clientesSel?.id
                        return (
                            <Pressable
                            onPress={() => setClientesSel(item)}
                            style = {[styles.clientChip, active && styles.clientChipActive]}
                            >
                                <Text style = {[styles.clientChipText, active && styles.clientChipTextActive]}>{item.nombre}</Text>
                            </Pressable>
                        )
                    }}
                />
            </View>
            {/*Buscar */}
            <View style = {styles.section}>
                <Text style = {styles.sectionTitle}>Producto (Color + talle)</Text>
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInputCliente}
                        placeholder="Buscar por nombre, color o talle..."
                        value={searchVarText}
                        onChangeText={setSearchVarText}
                        onSubmitEditing={handleSearchVar}
                        returnKeyType="search"
                    />
                    <Pressable style={styles.searchBtn} onPress={handleSearchVar}>
                        <Text style={styles.searchBtnText}>🔍</Text>
                    </Pressable>
                </View>
                <Text style={styles.resultCount}>
                    {variantesFiltradas.length} producto(s) encontrado(s)
                </Text>
                <FlatList
                    data = {variantesFiltradas}
                    key = {columns}
                    numColumns={columns}
                    keyExtractor={(v) => {
                        return `${v.productoId}-${v.colorId}-${v.talleId}`;
                    }}
                    columnWrapperStyle = {columns > 1 ? {gap : 10} : undefined}
                    contentContainerStyle = {{gap : 10, paddingTop : 10}}
                    renderItem = {({item}) => {
                        const matchReason = getVarMatchReason(item);
                        const isHighlighted = qVar.trim() !== '';
                        return(
                            <Pressable
                                onPress = {() => addStockProductoToItems(item)}
                                style = {[styles.card, columns > 1 && {flex : 1}, isHighlighted && styles.cardHighlighted]}
                            >
                                {isHighlighted && matchReason && (
                                    <View style={styles.matchBadge}>
                                        <Text style={styles.matchBadgeText}>✓ {matchReason}</Text>
                                    </View>
                                )}
                                <Text style = {styles.cardTitle}>{item.producto?.nombre}</Text>
                                <Text style = {styles.muted}>{item.talle?.nombre} • {item.color?.nombre}</Text>
                                <Text style = {styles.muted}>Stock: {item.stock}</Text>
                                <Text style = {styles.price}>{formatMoney(item.precio ?? 0)}</Text> 
                                <Text style = {styles.tap}>Toca para agregar</Text>
                            </Pressable>
                        );
                    }}
                />
            </View>
            {/* Items del pedido */}
            <View style = {styles.section}>
                <Text style = {styles.sectionTitle}>Items del pedido</Text>
                {items.length === 0 ? (
                    <Text style = {styles.mutedItem}>No hay items agregados</Text>
                ): (
                    <FlatList
                        data = {items}
                        keyExtractor={(it) => `${it.productoId}-${it.talleId}-${it.colorId}`}
                        contentContainerStyle = {{gap : 10, paddingTop : 10}}
                        renderItem={({item}) => (
                            <View style = {styles.itemRow}>
                                <View style = {{flex : 1}}>
                                    <Text style = {styles.itemName}>{item.nombreProducto}</Text>
                                    <Text style = {styles.muted}>{item.colorNombre} • {item.talleNombre}</Text>
                                    <Text style = {styles.price}>{formatMoney(item.precioUnitario ?? 0)} c/u</Text>
                                </View>
                                <View style = {styles.qtyBox}>
                                    <Pressable onPress = {() => changeQty(item.productoId, item.talleId, item.colorId, -1)} style = {styles.qtyBtn}>
                                        <Text style = {styles.qtyBtnText}>-</Text>
                                    </Pressable>
                                    <Text style = {styles.qty}>{item.cantidad}</Text>
                                    <Pressable onPress = {() => changeQty(item.productoId, item.talleId, item.colorId, +1)} style = {styles.qtyBtn}>
                                        <Text style = {styles.qtyBtnText}>+</Text>
                                    </Pressable>
                                </View>

                                <View style = {{width : 110, alignItems : "flex-end"}}>
                                    <Text style = {styles.price}>{formatMoney(item.subtotal ?? 0)}</Text>
                                </View>
                            </View>
                        )}
                    />
                )}
            </View>

            {/* Modal nuevo cliente */}
            <Modal visible={modalCliente} transparent animationType = "fade" onRequestClose = {() => setModalCliente(false)}>
                <View style = {styles.modalBackdrop}>
                    <View style = {styles.modalCard}>
                        <Text style = {styles.modalTitle}>Agregar cliente</Text>
                        <TextInput value = {nuevoNombre} onChangeText={setNuevoNombre} placeholder="Nombre" style = {styles.input}/>                  
                        <TextInput value = {nuevoTel} onChangeText={setNuevoTel} placeholder="Telefono" style = {styles.input}/>                  
                        <TextInput value = {nuevoDir} onChangeText={setNuevoDir} placeholder="Direccion" style = {styles.input}/>     
                        <View style = {styles.rowBetween}>
                            <Pressable onPress={() => setModalCliente(false)} style = {styles.btnGhost}>
                                <Text style = {styles.btnGhostText}>Cancelar</Text>
                            </Pressable>

                            <Pressable onPress={crearCliente} style = {[styles.btn, styles.btnPrimary]}>
                                <Text style = {styles.btnText}>Guardar</Text>
                            </Pressable>
                        </View>

                        {Platform.OS === "android" ? <View style = {{height : 6}} /> : null}
                    </View>
                </View>
            </Modal>
        </ScrollView>

        <View style = {styles.footerFixed}>
            <View style = {styles.footerLeft}>
                <Text style = {styles.mutedFooter}>Total:</Text>
                <Text style = {{fontSize : 18, fontWeight : "800", color : "white"}}>{formatMoney(total)}</Text>
            </View>
            <View style = {styles.footerButtons}>
                <TouchableOpacity 
                    onPress={goPrefactura}
                    style = {styles.footerBtn}
                >
                    <Text style = {{color : "white", fontWeight : "800"}}>Prefactura</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={confirmarPedido}
                    style = {[styles.footerBtn, {backgroundColor : "#22c55e"}]}
                >
                    <Text style = {{color : "white", fontWeight : "800"}}>Confirmar</Text>
                </TouchableOpacity>
            </View>
        </View>
        </View>
    )
}  



const styles = StyleSheet.create({
    container: { flex: 1, padding: 14, backgroundColor: "#0b0b0d" },
    title: { fontSize: 22, fontWeight: "800", color: "white", marginBottom: 10 },

    section: { marginTop: 12 },
    sectionTitle: { color: "black", fontSize: 16, fontWeight: "700" },

    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

    input: {
        backgroundColor: "#15151a",
        borderWidth: 1,
        borderColor: "#2a2a33",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: "white",
        flex: 1,
    },

    btn: {
        backgroundColor: "#2a2a33",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        marginLeft: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    btnPrimary: { backgroundColor: "#3b82f6" },
    btnText: { color: "white", fontWeight: "700" },

    btnGhost: { paddingHorizontal: 10, paddingVertical: 8 },
    btnGhostText: { color: "#9aa4b2", fontWeight: "700" },

    clientChip: {
        backgroundColor: "#8f8f95",
        borderColor: "#2a2a33",
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
    },
    clientChipActive: { borderColor: "#3b82f6", backgroundColor: "black"},
    clientChipText: { color: "#cbd5e1", fontWeight: "700" },
    clientChipTextActive: { color: "white" },

    searchRow: { flexDirection: "row", marginTop: 10 },

    card: {
        backgroundColor: "#3F403F",
        borderWidth: 1,
        borderColor: "#2a2a33",
        borderRadius: 16,
        padding: 12,
    },
    cardTitle: { color: "white", fontWeight: "800" },
    muted: { color: "#CED0CE", marginTop: 2 },
    price: { color: "white", fontWeight: "800", marginTop: 6 },
    tap: { color: "#3b82f6", fontWeight: "700", marginTop: 10 },

    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#15151a",
        borderWidth: 1,
        borderColor: "#2a2a33",
        borderRadius: 16,
        padding: 12,
        gap: 10,
    },
    itemName: { color: "white", fontWeight: "800" },

    qtyBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#2a2a33",
        borderRadius: 14,
        overflow: "hidden",
    },
    qtyBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#1b1b22" },
    qtyBtnText: { color: "white", fontWeight: "900", fontSize: 16 },
    qty: { color: "white", fontWeight: "800", paddingHorizontal: 12 },

    subtotal: { color: "white", fontWeight: "900" },

    footer: {
        marginTop: "auto",
        paddingTop: 12,
        paddingBottom: 4,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
    },
    total: { color: "white", fontSize: 18, fontWeight: "900" },

    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 16 },
    modalCard: {
        backgroundColor: "#0f0f14",
        borderWidth: 1,
        borderColor: "#2a2a33",
        borderRadius: 18,
        padding: 14,
        gap: 10,
    },
    modalTitle: { color: "white", fontSize: 18, fontWeight: "900", marginBottom: 6 },
    mutedItem : {color : "black"},
    footerFixed: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#1a1a2e",
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#333",
    },
    footerLeft: {
        alignItems: "flex-start",
    },
    mutedFooter: { color: "#ccc", marginTop: 2 },
    footerButtons: {
        flexDirection: "row",
        gap: 10,
    },
    footerBtn: {
        backgroundColor: "#111",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    searchContainer: {
        flexDirection: "row",
        marginTop: 10,
        marginBottom: 10,
    },
    searchInputCliente: {
        flex: 1,
        backgroundColor: "#15151a",
        borderWidth: 1,
        borderColor: "#2a2a33",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: "white",
        fontSize: 14,
    },
    searchBtn: {
        backgroundColor: "#3b82f6",
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
        color: "#9aa4b2",
        fontSize: 12,
        marginBottom: 8,
    },
    cardHighlighted: {
        backgroundColor: "#3a3a2a",
        borderWidth: 2,
        borderColor: "#ffc107",
    },
    matchBadge: {
        backgroundColor: "#4caf50",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginBottom: 4,
        position: "absolute",
        top: 5,
        right: 5,
        zIndex: 1,
    },
    matchBadgeText: {
        color: "white",
        fontSize: 13,
        fontWeight: "bold",
    },
})