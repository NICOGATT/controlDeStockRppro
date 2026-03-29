import React, {useEffect, useMemo, useState} from "react"; 
import {Alert, FlatList, Text, TextInput, TouchableOpacity,useWindowDimensions,View, StyleSheet, Pressable, Modal, Platform, ScrollView, ActivityIndicator} from "react-native"; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { colors } from "../theme/colors";
import { useResponsive } from "../hooks/useResponsive";



const formatMoney = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);

const colorMap: Record<string, string> = {
    rojo: '#E53935', azul: '#1E88E5', verde: '#43A047', amarillo: '#FDD835',
    negro: '#212121', blanco: '#FAFAFA', gris: '#757575', rosa: '#EC407A',
    naranja: '#FB8C00', morado: '#8E24AA', celeste: '#4FC3F7', beige: '#D7CCC8',
    marron: '#795548', violeta: '#7B1FA2', dorado: '#FFD700', plateado: '#C0C0C0',
};

const getColorHex = (colorName?: string): string => {
    return colorName ? (colorMap[colorName.toLowerCase()] || colors.textLight) : colors.textLight;
};

export default function ArmarPedidoScreen({navigation} : any) {
    const { width } = useWindowDimensions();
    const { isMobile } = useResponsive();
    const insets = useSafeAreaInsets();
    const isSmall = width < 380;

    const [clientes, setClientes] = useState<Cliente[]>([]); 
    const [clientesSel, setClientesSel] = useState<Cliente>(); 

    const [modalCliente, setModalCliente] = useState(false);
    const [loadingCliente, setLoadingCliente] = useState(false);
    
    const [nuevoNombre, setNuevoNombre] = useState("");
    const [nuevoTel, setNuevoTel] = useState("");
    const [nuevoCuit, setNuevoCuit] = useState("");
    const [nuevoEmail, setNuevoEmail] = useState("");
    const [nuevoEmpresa, setNuevoEmpresa] = useState("");
    const [nuevaCondicion, setNuevaCondicion] = useState("");
    const [nuevoDir, setNuevoDir] = useState("");
    const [nuevoCP, setNuevoCP] = useState("");
    const [nuevaCiudad, setNuevaCiudad] = useState("");
    const [nuevaProvincia, setNuevaProvincia] = useState("");
    
    const [direccion, setDireccion] = useState<Direccion | null>(null);
    const [direccion2, setDireccion2] = useState<string>("")
    
    const condicionesTributarias = [
        "Consumidor Final",
        "Responsable Inscripto",
        "Monotributista",
        "Exento",
        "No Responsable"
    ];

    const toNull = (value: string) => {
        const trimmed = value.trim();
        return trimmed ? trimmed : undefined;
    };

    const buildClienteBody = () => {
        const body: Record<string, any> = {
            nombre: nuevoNombre.trim(),
        };
        
        const tel = toNull(nuevoTel);
        if (tel !== undefined) body.telefono = tel;
        
        const c = toNull(nuevoCuit);
        if (c !== undefined) body.cuit = c;
        
        const e = toNull(nuevoEmail);
        if (e !== undefined) body.email = e;
        
        const emp = toNull(nuevoEmpresa);
        if (emp !== undefined) body.nombreEmpresa = emp;
        
        if (nuevaCondicion) body.condicionTributaria = nuevaCondicion;
        
        return body;
    };

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
            c.nombre?.toLowerCase().includes(q) ||
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
        try {
            const res = await apiFetch<Cliente[]>('/api/clientes');
            console.log("=== LOAD CLIENTES ===");
            console.log("API Response:", JSON.stringify(res, null, 2));
            const mapped : Cliente[] = res.map((c : any) => ({ 
                id : c.id, 
                nombre : c.nombre, 
                telefono : c.telefono,
                cuit : c.cuit, 
                email : c.email, 
                nombreEmpresa : c.nombreEmpresa, 
                condicionTributaria: c.condicionTributaria, 
                direccion : c.direccion
            })); 
            console.log("Mapped:", JSON.stringify(mapped, null, 2));
            setClientes(mapped);
            if(!clientesSel && mapped.length > 0) setClientesSel(mapped[0]);
        } catch (err: any) {
            console.error("Error loadClientes:", err);
            console.error("Response:", err.response?.data);
        }
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
            setLoadingCliente(true);
            
            const body = buildClienteBody();
            console.log("CLIENTE BODY:", JSON.stringify(body, null, 2));
            
            const res = await apiFetch<Cliente>('/api/clientes', {
                method : 'POST', 
                body : body
            });
            
            let direccionCreada: Direccion | undefined;
            
            if (nuevoDir.trim()) {
                direccionCreada = await crearDireccion(res.id);
            }
            
            const c : Cliente = {
                id : res.id,
                nombre : res.nombre,
                telefono : res.telefono,
                cuit : res.cuit, 
                email : res.email, 
                nombreEmpresa : res.nombreEmpresa, 
                condicionTributaria : res.condicionTributaria, 
                direccion : direccionCreada
            }

            setClientes((p) => [c, ...p]);
            setClientesSel(c);

            resetFormCliente();
            setModalCliente(false);
        } catch (err: any) {
            console.error("Error crearCliente:", err);
            console.error("Response:", err.response?.data);
            const msg = err.response?.data?.message || err.response?.data?.error || 'No se pudo crear el cliente';
            Alert.alert('Error', msg);
        } finally {
            setLoadingCliente(false);
        }
    }

    function resetFormCliente() {
        setNuevoNombre("");                                    
        setNuevoTel("");
        setNuevoCuit("");
        setNuevoEmail("");
        setNuevoEmpresa("");
        setNuevaCondicion("");
        setNuevoDir("");
        setNuevoCP("");
        setNuevaCiudad("");
        setNuevaProvincia("");
    }

    async function crearDireccion(clienteId: number) {
        if (!nuevoDir.trim()) {
            return undefined;
        }
        try {
            const res = await apiFetch<Direccion>('/api/direcciones', {
                method: 'POST', 
                body: {
                    direccion: nuevoDir.trim(),
                    clienteId: clienteId, 
                    codigoPostal: toNull(nuevoCP),
                    provincia: toNull(nuevaProvincia)
                }
            });
            const d: Direccion = {
                id: res.id,
                direccion: res.direccion,
                clienteId: res.clienteId,
                codigoPostal: res.codigoPostal,
                provincia: res.provincia
            };
            setDireccion(d);
            return d; 
        } catch (err) {
            Alert.alert('Error', 'No se pudo crear la dirección');
            return undefined;
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
            cliente: clientesSel.nombre?.trim() || null,
            telefono: clientesSel.telefono?.trim() || null,
            email: clientesSel.email?.trim() || null,
            nombreEmpresa: clientesSel.nombreEmpresa?.trim() || null,
            condicionTributaria: clientesSel.condicionTributaria || null,
            direccion: direccionStr || null,
            codigoPostal: direcciones?.[0]?.codigoPostal || null,
            provincia: direcciones?.[0]?.provincia || null,
        };
        try {
            console.log("=== GO PREFACTURA ===");
            console.log("clientesSel:", JSON.stringify(clientesSel, null, 2));
            console.log("direccionStr:", direccionStr);
            console.log("BODY PREF:", JSON.stringify(bodyPrefactura, null, 2));
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
                    draft: { 
                        codigo: generarCodigoPedido(), 
                        fechaISO: new Date().toISOString(),
                        cliente: clientesSel,
                        direccion: direccionStr || "", 
                        items, 
                        total,
                    } 
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
        <View style={[styles.screenContainer, isMobile && { paddingBottom: 80 }]}>
        <ScrollView style = {styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style = {styles.screenTitle}>Armar pedido</Text>
            
            {/* CLIENTE */}
            <View style = {styles.section}>
                <View style = {styles.rowBetween}>
                    <Text style = {styles.sectionTitle}>Cliente</Text>
                    <Pressable onPress = {() => setModalCliente(true)} style = {styles.btnAddSmall}>
                        <Text style = {styles.btnAddSmallText}>+ Agregar</Text>
                    </Pressable>
                </View>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar cliente..."
                        placeholderTextColor={colors.textLight}
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
                    {filteredClientes.length} cliente(s)
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                    {filteredClientes.map((cliente) => {
                        const active = cliente.id === clientesSel?.id;
                        return (
                            <Pressable
                                key={String(cliente.id)}
                                onPress={() => setClientesSel(cliente)}
                                style={[styles.chip, active && styles.chipActive]}
                            >
                                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                    {cliente.nombre}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>
            
            {/* Productos */}
            <View style = {styles.section}>
                <Text style = {styles.sectionTitle}>Buscar producto</Text>
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Nombre, color o talle..."
                        placeholderTextColor={colors.textLight}
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
                    {variantesFiltradas.length} producto(s)
                </Text>
                
                <View style={styles.gridContainer}>
                    {variantesFiltradas.map((item) => {
                        const matchReason = getVarMatchReason(item);
                        const isHighlighted = qVar.trim() !== '';
                        return (
                            <Pressable
                                key={`${item.productoId}-${item.colorId}-${item.talleId}`}
                                onPress={() => addStockProductoToItems(item)}
                                style={[styles.productCard, isHighlighted && styles.productCardHighlighted]}
                            >
                                {isHighlighted && matchReason && (
                                    <View style={styles.matchBadge}>
                                        <Text style={styles.matchBadgeText}>✓ {matchReason}</Text>
                                    </View>
                                )}
                                <Text style={styles.productName}>{item.producto?.nombre}</Text>
                                <View style={styles.productMeta}>
                                    <View style={[styles.colorDot, { backgroundColor: getColorHex(item.color?.nombre) }]} />
                                    <Text style={styles.productVariant}>
                                        {item.color?.nombre} • {item.talle?.nombre}
                                    </Text>
                                </View>
                                <View style={styles.productFooter}>
                                    <View>
                                        <Text style={styles.productStock}>Stock: {item.stock}</Text>
                                        <Text style={styles.productPrice}>{formatMoney(item.precio ?? 0)}</Text>
                                    </View>
                                    <View style={styles.addButton}>
                                        <Text style={styles.addButtonText}>+</Text>
                                    </View>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
            
            {/* Items del pedido */}
            <View style = {styles.section}>
                <Text style = {styles.sectionTitle}>Items del pedido ({items.length})</Text>
                {items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🛒</Text>
                        <Text style={styles.emptyText}>No hay items agregados</Text>
                        <Text style={styles.emptyHint}>Buscá y tocá un producto para agregarlo</Text>
                    </View>
                ): (
                    <View style={styles.itemsList}>
                        {items.map((item) => (
                            <View key={`${item.productoId}-${item.talleId}-${item.colorId}`} style = {styles.orderItem}>
                                <View style = {styles.orderItemInfo}>
                                    <Text style = {styles.orderItemName}>{item.nombreProducto}</Text>
                                    <Text style = {styles.orderItemVariant}>
                                        {item.colorNombre} • {item.talleNombre}
                                    </Text>
                                    <Text style = {styles.orderItemPrice}>
                                        {formatMoney(item.precioUnitario ?? 0)} c/u
                                    </Text>
                                </View>
                                <View style = {styles.orderItemQty}>
                                    <Pressable 
                                        onPress={() => changeQty(item.productoId, item.talleId, item.colorId, -1)} 
                                        style={styles.qtyBtn}
                                    >
                                        <Text style={styles.qtyBtnText}>-</Text>
                                    </Pressable>
                                    <Text style={styles.qtyValue}>{item.cantidad}</Text>
                                    <Pressable 
                                        onPress={() => changeQty(item.productoId, item.talleId, item.colorId, +1)} 
                                        style={styles.qtyBtn}
                                    >
                                        <Text style={styles.qtyBtnText}>+</Text>
                                    </Pressable>
                                </View>
                                <Text style={styles.orderItemSubtotal}>
                                    {formatMoney(item.subtotal ?? 0)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Modal nuevo cliente */}
            <Modal visible={modalCliente} transparent animationType="slide" onRequestClose={() => setModalCliente(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>👤 Nuevo Cliente</Text>
                                <TouchableOpacity onPress={() => { resetFormCliente(); setModalCliente(false); }} style={styles.modalCloseBtn}>
                                    <Text style={styles.modalCloseText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <Text style={styles.sectionLabel}>DATOS PERSONALES</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Nombre *</Text>
                                <TextInput 
                                    value={nuevoNombre} 
                                    onChangeText={setNuevoNombre} 
                                    placeholder="Nombre completo"
                                    placeholderTextColor={colors.textLight}
                                    style={styles.inputField}
                                />
                            </View>
                            
                            <View style={styles.inputRow}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Teléfono</Text>
                                    <TextInput 
                                        value={nuevoTel} 
                                        onChangeText={setNuevoTel} 
                                        placeholder="Ej: 11-1234-5678"
                                        placeholderTextColor={colors.textLight}
                                        style={styles.inputField}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>CUIT / DNI</Text>
                                    <TextInput 
                                        value={nuevoCuit} 
                                        onChangeText={setNuevoCuit} 
                                        placeholder="Ej: 20-12345678-9"
                                        placeholderTextColor={colors.textLight}
                                        style={styles.inputField}
                                    />
                                </View>
                            </View>
                            
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <TextInput 
                                    value={nuevoEmail} 
                                    onChangeText={setNuevoEmail} 
                                    placeholder="cliente@ejemplo.com"
                                    placeholderTextColor={colors.textLight}
                                    style={styles.inputField}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            
                            <View style={styles.inputRow}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Empresa</Text>
                                    <TextInput 
                                        value={nuevoEmpresa} 
                                        onChangeText={setNuevoEmpresa} 
                                        placeholder="Nombre de empresa"
                                        placeholderTextColor={colors.textLight}
                                        style={styles.inputField}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Condición</Text>
                                    <View style={styles.pickerContainer}>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            {condicionesTributarias.map((cond) => (
                                                <TouchableOpacity
                                                    key={cond}
                                                    onPress={() => setNuevaCondicion(cond)}
                                                    style={[styles.condChip, nuevaCondicion === cond && styles.condChipActive]}
                                                >
                                                    <Text style={[styles.condChipText, nuevaCondicion === cond && styles.condChipTextActive]}>
                                                        {cond}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </View>
                            </View>
                            
                            <Text style={styles.sectionLabel}>DIRECCIÓN</Text>
                            
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Dirección</Text>
                                <TextInput 
                                    value={nuevoDir} 
                                    onChangeText={setNuevoDir} 
                                    placeholder="Calle, número, piso, depto..."
                                    placeholderTextColor={colors.textLight}
                                    style={styles.inputField}
                                />
                            </View>
                            
                            <View style={styles.inputRow}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Código Postal</Text>
                                    <TextInput 
                                        value={nuevoCP} 
                                        onChangeText={setNuevoCP} 
                                        placeholder="Ej: C1001"
                                        placeholderTextColor={colors.textLight}
                                        style={styles.inputField}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Ciudad</Text>
                                    <TextInput 
                                        value={nuevaCiudad} 
                                        onChangeText={setNuevaCiudad} 
                                        placeholder="Ciudad"
                                        placeholderTextColor={colors.textLight}
                                        style={styles.inputField}
                                    />
                                </View>
                            </View>
                            
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Provincia</Text>
                                <TextInput 
                                    value={nuevaProvincia} 
                                    onChangeText={setNuevaProvincia} 
                                    placeholder="Provincia"
                                    placeholderTextColor={colors.textLight}
                                    style={styles.inputField}
                                />
                            </View>
                            
                            <View style={styles.modalActions}>
                                <TouchableOpacity 
                                    onPress={() => { resetFormCliente(); setModalCliente(false); }} 
                                    style={styles.cancelButton}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    onPress={crearCliente} 
                                    style={[styles.saveButton, loadingCliente && styles.saveButtonDisabled]}
                                    disabled={loadingCliente}
                                >
                                    {loadingCliente ? (
                                        <ActivityIndicator size="small" color={colors.textInverse} />
                                    ) : (
                                        <Text style={styles.saveButtonText}>💾 Guardar Cliente</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScrollView>

        <View style={isMobile ? [styles.footerFixed, { bottom: insets.bottom > 0 ? 60 + insets.bottom : 80 }] : [styles.footerFixed, { bottom: 0 }]}>
            <View style={styles.footerContent}>
                <View style={styles.totalSection}>
                    <Text style={styles.cartIcon}>🛒</Text>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>{formatMoney(total)}</Text>
                </View>
                <View style={styles.actionsContainer}>
                    <TouchableOpacity 
                        onPress={goPrefactura}
                        style={styles.prefacturaBtn}
                    >
                        <Text style={styles.prefacturaBtnText}>Prefactura</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={confirmarPedido}
                        style={styles.confirmarBtn}
                    >
                        <Text style={styles.confirmarBtnText}>Confirmar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
        </View>
    )
}  



const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: colors.backgroundDark, paddingBottom: 60 },
    title: { fontSize: 22, fontWeight: "800", color: colors.textInverse, marginBottom: 10 },

    section: { marginTop: 12 },
    sectionTitle: { color: colors.textInverse, fontSize: 16, fontWeight: "700" },

    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

    input: {
        backgroundColor: colors.surfaceDark,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: colors.textInverse,
        flex: 1,
    },

    btn: {
        backgroundColor: colors.surfaceDark,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        marginLeft: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    btnPrimary: { backgroundColor: colors.primary },
    btnText: { color: colors.textInverse, fontWeight: "700" },

    btnGhost: { paddingHorizontal: 10, paddingVertical: 8 },
    btnGhostText: { color: colors.textLight, fontWeight: "700" },

    clientChip: {
        backgroundColor: colors.surfaceDark,
        borderColor: colors.borderDark,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
    },
    clientChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    clientChipText: { color: colors.textInverse, fontWeight: "700" },
    clientChipTextActive: { color: colors.textInverse },

    searchRow: { flexDirection: "row", marginTop: 10 },

    card: {
        backgroundColor: colors.surfaceDark,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 16,
        padding: 12,
    },
    cardTitle: { color: colors.textInverse, fontWeight: "800" },
    muted: { color: colors.textLight, marginTop: 2 },
    price: { color: colors.primary, fontWeight: "800", marginTop: 6 },
    tap: { color: colors.primary, fontWeight: "700", marginTop: 10 },

    qtyBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 14,
        overflow: "hidden",
    },
    subtotal: { color: colors.textInverse, fontWeight: "900" },

    footer: {
        marginTop: "auto",
        paddingTop: 12,
        paddingBottom: 4,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
    },
    total: { color: colors.textInverse, fontSize: 18, fontWeight: "900" },

    modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", padding: 16 },
    modalCard: {
        backgroundColor: colors.backgroundDark,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 18,
        padding: 14,
        gap: 10,
    },
    modalTitle: { color: colors.textInverse, fontSize: 18, fontWeight: "900", marginBottom: 6 },
    mutedItem : {color: colors.textSecondary},
    footerFixed: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surfaceDark,
        borderTopWidth: 1,
        borderTopColor: colors.borderDark,
        zIndex: 1,
    },
    footerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    totalSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    cartIcon: {
        fontSize: 18,
    },
    totalLabel: {
        fontSize: 13,
        fontWeight: "500",
        color: colors.textLight,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.textInverse,
    },
    actionsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    prefacturaBtn: {
        backgroundColor: "transparent",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.borderDark,
    },
    prefacturaBtnText: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: "600",
    },
    confirmarBtn: {
        backgroundColor: colors.success,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 80,
        alignItems: "center",
    },
    confirmarBtnText: {
        color: colors.textInverse,
        fontSize: 13,
        fontWeight: "700",
    },
    searchContainer: {
        flexDirection: "row",
        marginTop: 10,
        marginBottom: 10,
    },
    searchInputCliente: {
        flex: 1,
        backgroundColor: colors.surfaceDark,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 12,
        paddingHorizontal: 12,
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
    cardHighlighted: {
        backgroundColor: colors.surfaceDark,
        borderWidth: 2,
        borderColor: colors.warning,
    },
    matchBadge: {
        backgroundColor: colors.success,
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
        color: colors.textInverse,
        fontSize: 13,
        fontWeight: "bold",
    },
    
    // Modal Cliente Mejorado
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: colors.surfaceDark,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalContent: {
        padding: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.backgroundDark,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseText: {
        color: colors.textLight,
        fontSize: 16,
    },
    sectionLabel: {
        color: colors.textLight,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 8,
    },
    inputGroup: {
        marginBottom: 12,
    },
    inputLabel: {
        color: colors.textLight,
        fontSize: 12,
        marginBottom: 6,
        fontWeight: '500',
    },
    inputField: {
        backgroundColor: colors.backgroundDark,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: colors.textInverse,
        fontSize: 15,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 12,
    },
    pickerContainer: {
        backgroundColor: colors.backgroundDark,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 10,
        padding: 8,
    },
    condChip: {
        backgroundColor: colors.surfaceDark,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.borderDark,
    },
    condChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    condChipText: {
        color: colors.textLight,
        fontSize: 12,
        fontWeight: '600',
    },
    condChipTextActive: {
        color: colors.textInverse,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: colors.backgroundDark,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: colors.textLight,
        fontSize: 15,
        fontWeight: '600',
    },
    saveButton: {
        flex: 2,
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: colors.textInverse,
        fontSize: 15,
        fontWeight: '700',
    },
    
    // Pantalla principal
    screenContainer: {
        flex: 1,
        backgroundColor: colors.backgroundDark,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textInverse,
        marginBottom: 20,
    },
    
    // Search
    searchInput: {
        flex: 1,
        backgroundColor: colors.surfaceDark,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: colors.textInverse,
        fontSize: 15,
    },
    
    // Chips de cliente
    horizontalList: {
        gap: 10,
        paddingVertical: 8,
    },
    chip: {
        backgroundColor: colors.surfaceDark,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.borderDark,
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        color: colors.textInverse,
        fontWeight: '600',
        fontSize: 14,
    },
    chipTextActive: {
        color: colors.textInverse,
    },
    
    // Botón agregar pequeño
    btnAddSmall: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    btnAddSmallText: {
        color: colors.textInverse,
        fontWeight: '700',
        fontSize: 12,
    },
    
    // Grid de productos
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    productCard: {
        width: '48%',
        backgroundColor: colors.surfaceDark,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.borderDark,
    },
    productCardHighlighted: {
        borderColor: colors.warning,
        borderWidth: 2,
    },
    productName: {
        color: colors.textInverse,
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 8,
    },
    productMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 6,
    },
    colorDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    productVariant: {
        color: colors.textLight,
        fontSize: 13,
    },
    productFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    productStock: {
        color: colors.textLight,
        fontSize: 11,
    },
    productPrice: {
        color: colors.primary,
        fontWeight: '800',
        fontSize: 16,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: colors.textInverse,
        fontSize: 20,
        fontWeight: 'bold',
    },
    
    // Empty state
    emptyState: {
        backgroundColor: colors.surfaceDark,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        color: colors.textInverse,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    emptyHint: {
        color: colors.textLight,
        fontSize: 13,
    },
    
    // Items del pedido
    itemsList: {
        gap: 10,
    },
    orderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceDark,
        borderRadius: 14,
        padding: 14,
        gap: 12,
    },
    orderItemInfo: {
        flex: 1,
    },
    orderItemName: {
        color: colors.textInverse,
        fontWeight: '700',
        fontSize: 14,
    },
    orderItemVariant: {
        color: colors.textLight,
        fontSize: 12,
        marginTop: 2,
    },
    orderItemPrice: {
        color: colors.textLight,
        fontSize: 12,
        marginTop: 2,
    },
    orderItemQty: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundDark,
        borderRadius: 10,
        overflow: 'hidden',
    },
    qtyBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyBtnText: {
        color: colors.textInverse,
        fontSize: 18,
        fontWeight: 'bold',
    },
    qtyValue: {
        color: colors.textInverse,
        fontWeight: '700',
        fontSize: 14,
        paddingHorizontal: 8,
        minWidth: 30,
        textAlign: 'center',
    },
    orderItemSubtotal: {
        color: colors.primary,
        fontWeight: '800',
        fontSize: 15,
        minWidth: 80,
        textAlign: 'right',
    },
})