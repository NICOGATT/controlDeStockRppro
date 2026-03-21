import { View, TextInput,  Pressable, Text, StyleSheet, ScrollView} from "react-native";
import { use, useEffect, useState} from "react";
import { apiFetch } from "../api/apiClient";
import { ColorYTalle } from "../types/ColorYTalle";
import { TipoDePrenda } from "../types/TipoDePrenda";
import { Color } from "../types/Color";
import { Talle } from "../types/Talle";


export default function AddProductsScreen ({navigation} : any) {
    const [nombre, setNombre] = useState("");
    const [precio, setPrecio] = useState(""); 
    const [tipoDePrenda, setTipoDePrenda] = useState<TipoDePrenda | null>(null); 
    const [nroArticulo, setNroArticulo] = useState(""); 
    
    const [colores, setColores] = useState<Color[]> ([]);
    const [talles, setTalles] = useState<Talle[]>([]);

    const [color, setColor] = useState<Color| null>(null); 
    const [talle, setTalle] = useState<Talle | null>(null); 
    const [cantidad, setCantidad] = useState("");
    
    const [variantes, setVariantes] = useState<ColorYTalle[]> ([]);
    const [nombreColor, setNombreColor] = useState("");
    const [nombreTalle, setNombreTalle] = useState("");
    const [precioVariante, setPrecioVariante] = useState("");

    const nombreValido = nombre.trim().length > 0;

    const variantesValidas = variantes.length > 0; 
    
    const precioValido = !isNaN(Number(precio)) && Number(precio) > 0;

    const nroDeArticuloValido = nroArticulo.trim().length > 0; 

    const precioVarianteValido = variantes.every((v) => Number(v.precio) > 0); 

    const tieneTallesConPrecioPropio = variantes.some((v) => v.talle.nombre.trim().toLowerCase() !== "unico")

    const formValido = nombreValido && variantesValidas && nroDeArticuloValido && (tieneTallesConPrecioPropio ? precioVarianteValido : precio);


    useEffect(() => {
        (async () => {
            try {
                const coloresData = await apiFetch<Color[]>('/api/colores')
                const talleData = await apiFetch<Talle[]>('/api/talles')
                console.log('¿Es array de colores?', Array.isArray(coloresData), coloresData);
                console.log('¿Es array de talles?', Array.isArray(talleData), talleData);
                setColores(coloresData);
                setTalles(talleData);
            } catch (e) {
                console.log('Error cargando colores/talles', e)
            }
        })();
    }, [])

    async function handleSave() {
        if(!formValido) {
            console.log('Formulario no valido: ', {nombreValido, variantesValidas, precioValido})
            return; 
        };
        try {
            console.log('Enviando producto...')
            //1) Crear producto 
            const response = await apiFetch<any>('/api/productos', {
                method : "POST", 
                body : {
                    id : nroArticulo.trim(),
                    nombre : nombre.trim(),
                    colorYTalle : variantes.map(v => ({
                        color : v.color.nombre, 
                        talle : v.talle.nombre, 
                        cantidad : Number(v.cantidad), 
                        precio : v.precio ? Number(v.precio) : Number(precio)
                    })), 
                    tipoDePrenda : tipoDePrenda?.nombre ?? null //
                }
            }); 
            console.log("OK:", response.data())
            navigation.goBack();
        } catch (e : any) {
            console.log('Status : ', e?.response?.status);
            console.log('Data : ', JSON.stringify(e?.response?.data, null));
            console.log('Headers:', e?.response?.headers);
            throw e; 
        }
    }

    async function agregarVariante(){
        const q = Number(cantidad);
        const precioFinal = precioVariante ? Number(precioVariante) : null; 
        console.log('color: ', color);
        console.log('talle: ', talle);
        console.log('cantidad ', cantidad);
        if(!Number.isFinite(q) || q <= 0) return;  
        

       try {
        let colorFinal : Color | null = color; 
        let talleFinal : Talle | null = talle; 
        // Si no selecciono color, pero escribio uno 
        if (!colorFinal && nombreColor.trim()) {
            colorFinal = await createColor(nombreColor); 
        }

        if(!talleFinal && nombreTalle.trim()){
            talleFinal = await createTalle(nombreTalle); 
        }

        if (!colorFinal || !talleFinal) {
            console.log ('Falta color y talle'); 
            return ; 
        }

        setVariantes((prev) => {
            const idx = prev.findIndex((v) => v.color.id === colorFinal!.id && v.talle.id === talleFinal!.id)

            if (idx === -1) {
                return [...prev, {color : colorFinal!, talle : talleFinal!, cantidad : q, precio : precioFinal}]
            }
            
            const copia = [...prev]; 
            copia[idx] = {
                ...copia[idx], 
                cantidad : copia[idx].cantidad + q
            }; 
            return copia
        })

        //Refrescar Catalogo pos si se crearon nuevos
        await cargarColores(); 
        await cargarTalles() ; 

        //Limpiar
        setColor(null); 
        setTalle(null); 
        setCantidad("");
        setNombreColor(""); 
        setNombreTalle("");
       } catch (error) {
        console.log('Error agregando variante:', error); 
       }

    }

    async function createColor(nombre : string) : Promise<Color>{
        return await apiFetch<Color>('/api/colores', {
            method :  "POST", 
            body : {
                nombre : nombre.trim()
            }
        })
    }

    async function createTalle (nombre : string) : Promise <Talle> {
        return await apiFetch<Talle>('/api/talles', {
            method : "POST", 
            body : {
                nombre : nombre.trim()
            }
        })
    }

    async function cargarColores() {
        try {
            const data = await apiFetch<Color[]>('/api/colores'); 
            setColores(data)
        } catch (error) {
            console.log('Error cargando colores', error)
        }
    }
    async function cargarTalles() {
        try {
            const data = await apiFetch<Talle[]>('/api/talles'); 
            setTalles(data)
        } catch (error) {
            console.log('Error cargando talles', error)
        }
    }

    return (
        <ScrollView style = {styles.container} contentContainerStyle={{paddingBottom: 20}} nestedScrollEnabled={true}>
            <Text style = {styles.title}>Agregar Producto</Text>
            {/* Numero de articulo */}
            <View style = {{gap : 6}}>
                <Text style = {styles.label}>Nro de articulo</Text>
                <TextInput
                    placeholder="Ej : RPPRO2025"
                    value={nroArticulo}
                    autoFocus
                    onChangeText={(text) => setNroArticulo(text)}
                    style = {[styles.input, !nroDeArticuloValido && styles.inputError]}
                />
            </View>
            {/* Nombre */}
            <View style ={{gap : 6}}>
                <Text style = {styles.label}>Nombre</Text>
                <TextInput 
                    placeholder="Ej : Remera"
                    value={nombre}
                    onChangeText={(text) => setNombre(text)}
                    style = {[styles.input, !nombreValido && styles.inputError]}
                />
            </View>
            

            <View  style = {styles.divider}/>
            
            <Text style = {styles.subtitle}>Variantes (Color + Talle + Cantidad)</Text>
            
            <View style = {styles.containerVariante}>
                <View style = {styles.topRow}>
                    <View style = {styles.box}>
                        <View style = {{gap : 6}}>
                            <Text style = {styles.label}>Color {colores?.length}</Text>
                            <View style = {styles.chipsRow}>
                                {colores.map((c) => {
                                    const select = color?.id === c.id; 
                                    return (
                                        <Pressable
                                            key={c.id}
                                            onPress={() => setColor(c)}
                                            style = {[styles.select, {backgroundColor : select ? "#111" : "transparent"}]}
                                        >
                                            <Text style = {{color : select ? "white" : "black", fontWeight : select ? "700" : "400"}}>{c.nombre}</Text>
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>
                        {/* Talle */}
                        <View style = {{gap: 6}}>
                            <Text style = {styles.label}>Talle</Text>
                            <View style = {styles.chipsRow}>
                                {talles.map((t) => {
                                    const selected = talle?.id === t.id
                                    return (
                                        <Pressable
                                            key={t.id}
                                            onPress={() => setTalle(t)}
                                            style = {[styles.select, {backgroundColor : selected ? "#111" : "transparent"}]}
                                        >
                                            <Text style = {{color : selected ? "white" : "black", fontWeight : selected ? "700" : "400"}}>{t.nombre}</Text>
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>
                    </View>

                    {/* Bloque inputs */}
                    <View style = {styles.box} >
                        <Text>Nuevo color</Text>
                        <TextInput
                            placeholder="Ej: Rojo, Azul, etc..."
                            value={nombreColor}
                            onChangeText = {setNombreColor}
                            style = {styles.input}
                        />
                        <Text>Nuevo talle</Text>
                        <TextInput
                            placeholder="Ej: L,XL,..."
                            value={nombreTalle}
                            onChangeText={setNombreTalle}
                            style = {styles.input}
                        />
                        <Text>Precio</Text>
                        <TextInput
                            placeholder="Ej: 27000, 25000, ..."
                            value = {precioVariante}
                            onChangeText={(text) => setPrecioVariante(text.replace(/[^0-9]/g, ""))}
                            keyboardType="numeric"
                            style = {styles.input}
                        />
                    </View>
                </View>
                <View style = {styles.bottomRow}>
                    <TextInput
                        placeholder="Ej : 10"
                        keyboardType="numeric"
                        value={cantidad}
                        onChangeText={setCantidad}
                        style = {styles.cantidad}
                    />
                    <Pressable
                        onPress={() => agregarVariante()}
                        style = {styles.variante}
                    >
                        <Text style = {{color : "white", fontWeight : "700"}}>Agregar variante</Text>
                    </Pressable>
                </View>
            </View>
            {/* Lista de variantes */}
            <View style = {{gap : 8, marginTop: 6}}>
                {variantes.length === 0 ? (
                    <Text style = {{opacity : 0.7}}>Todavia no agregaste variantes</Text>
                ) : (
                    variantes.map ((v, i) => (
                        <View
                            key={`${v.color.id}-${v.talle.id}`}
                            style = {styles.listaVariantes}
                        >
                            <Text>{v.color.nombre} / {v.talle.nombre} - {v.cantidad}</Text>
                            <Pressable
                                onPress={() => 
                                    setVariantes((prev) => prev.filter((_, idx) => idx !== i))
                                }
                            >
                                <Text style = {styles.quitarText}>Quitar</Text>
                            </Pressable>
                        </View>
                    ))
                )}
            </View>
            {/* Tipo de prenda */}
            <View style = {{gap : 6}}>
                <Text style = {styles.label}>Tipo de prenda</Text>
                <TextInput
                    placeholder="Ej : Remera / Buzo / Pantalon"
                    value={tipoDePrenda?.nombre}
                    onChangeText={(texto) => {
                        setTipoDePrenda(texto ? {...tipoDePrenda, nombre : texto} as TipoDePrenda : null)
                    }}
                    style = {styles.input}
                />
            </View>
            <Pressable onPress={handleSave} disabled = {!formValido} style = {[
                styles.button, 
                !formValido && styles.buttonDisabled
            ]}>
                <Text style={styles.buttonText}>Guardar</Text>
            </Pressable>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container : {
        padding : 16
    }, 
    input : {
        borderWidth : 1, 
        borderColor : "#ccc", 
        padding : 10, 
        marginBottom : 12,
        borderRadius : 6, 
        backgroundColor : "white"
    }, 
    inputError : {
        borderColor : "red"
    }, 
    button : {
        backgroundColor : "#4CAF50", 
        padding : 12,
        borderRadius : 6, 
        alignItems : "center"
    },
    buttonDisabled : {
        backgroundColor : "#999",
    },
    buttonText : {
        color : "white", 
        fontWeight : "bold"
    }, 
    title : {
        fontWeight : "bold",
        fontSize : 16
    }, 
    label : {
        color : "gray"
    },
    divider : {
        height : 1, 
        backgroundColor : "#ddd", 
        marginVertical : 10
    },
    subtitle : {
        fontSize : 16, 
        fontWeight : "700"
    },
    chipsRow : {
        flexDirection : "row", 
        flexWrap : "wrap", 
        gap : 8
    }, 
    select : {
        paddingVertical : 6, 
        paddingHorizontal : 10, 
        borderRadius : 999, 
        borderWidth : 1,
    },
    cantidad : {
        borderWidth : 1, 
        borderRadius : 10, 
        padding : 10
    },
    variante : {
        backgroundColor : "#111",
        padding : 12, 
        borderRadius : 10, 
        alignItems : "center", 
        marginTop : 4,
        justifyContent: "center"
    },
    listaVariantes : {
        borderWidth : 1, 
        borderRadius : 10, 
        padding : 10, 
        flexDirection : "row", 
        justifyContent : "space-between", 
        alignItems : "center"
    }, 
    quitarText : {
        color : "white", 
        fontWeight : "700"
    }, 
    containerVariante : {
        padding : 16, 
        gap : 16
    }, 
    topRow : {
        flexDirection : "row", 
        gap : 12
    },
    box : {
        flex : 1, 
        borderWidth : 1, 
        borderColor: "#ddd",
        borderRadius : 16, 
        padding: 12, 
        gap : 8
    }, 
    bottomRow: {
        flexDirection: "row",
        gap: 12
    }
})