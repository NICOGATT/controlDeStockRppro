import { View, TextInput,  Pressable, Text, StyleSheet} from "react-native";
import { use, useEffect, useState} from "react";
import { apiFetch } from "../api/apiClient";
import { ColorYTalle } from "../types/ColorYTalle";
import { TipoDePrenda } from "../types/TipoDePrenda";
import { Color } from "../types/Color";
import { Talle } from "../types/Talle";


export default function AddProductsScreen ({navigation} : any) {
    const [nombre, setNombre] = useState(""); 
    const [precio, setPrecio] = useState(""); 
    const [tipoDePrenda, setTipoDePrenda] = useState<TipoDePrenda | null>(null)
    
    const [colores, setColores] = useState<Color[]> ([]);
    const [talles, setTalles] = useState<Talle[]>([]);

    const [color, setColor] = useState<Color| null>(null); 
    const [talle, setTalle] = useState<Talle | null>(null); 
    const [cantidad, setCantidad] = useState("");
    
    const [colorSel, setColorSel] = useState('')
    const [talleSel, setTalleSel] = useState('')
    const [variantes, setVariantes] = useState<ColorYTalle[]> ([]);

    const nombreValido = nombre.trim().length > 0;

    const variantesValidas = variantes.length > 0; 
    
    const precioValido = !isNaN(Number(precio)) && Number(precio) > 0;


    const formValido = nombreValido && variantesValidas && precioValido;

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
            //1) Crear producto 
            await apiFetch<any>('/api/productos', {
                method : "POST", 
                body : {
                    nombre : nombre.trim(),
                    precio : Number(precio),
                    colorYTalle : variantes.map(v => ({
                        color : v.color.nombre, 
                        talle : v.talle.nombre, 
                        cantidad : Number(v.cantidad) 
                    })), 
                    tipoDePrenda : tipoDePrenda?.nombre ?? null //
                }
            })

            //2) Crear stock inicial (MVP con talle/color por defecto)
            // const pId = producto.id || producto

            // await Promise.all(
            //     variantes.map((v) => {
            //         apiFetch('/api/stockProductos', {
            //             method : "POST", 
            //             body : {
            //                 productoId : pId, 
            //                 talleId : v.talle.id,
            //                 colorId : v.color.id,
            //                 cantidad : v.cantidad
            //             }
            //         })
            //     })
            // )
            navigation.goBack();
        } catch (e : any) {
            console.log('Status : ', e?.response?.status);
            console.log('Data : ', JSON.stringify(e?.response?.data, null));
            console.log('Headers:', e?.response?.headers);
            throw e; 
        }
    }

    function agregarVariante(){
        const q = Number(cantidad);
        console.log('color: ', color);
        console.log('talle: ', talle);
        console.log('cantidad ', cantidad);
        if (!color || !talle) return;
        if(!Number.isFinite(q) || q <= 0) return;  

        setVariantes((prev) => {
            const idx = prev.findIndex((v) => v.color.id === color.id && v.talle.id === talle.id); 
            if (idx === -1){
                return [...prev, {color : color, talle : talle, cantidad : q}]
            }

            const copia = [...prev]; 
            copia[idx] = {...copia[idx], cantidad : copia[idx].cantidad + q};
            return copia
        })

        //Limpiar
        setColor(null); 
        setTalle(null); 
        setCantidad("");
    }

    return (
        <View style = {styles.container}>
            <Text style = {styles.title}>Agregar Producto</Text>
            {/* Nombre */}
            <View style ={{gap : 6}}>
                <Text style = {styles.label}>Nombre</Text>
                <TextInput 
                    placeholder="Ej : Remera"
                    value={nombre}
                    autoFocus
                    onChangeText={(text) => setNombre(text)}
                    style = {[styles.input, !nombreValido && styles.inputError]}
                />
            </View>
            
            {/* Precio */}
            <View style = {{gap : 6}}>
                <Text style = {styles.label}>Precio</Text>
                <TextInput
                    placeholder="Ej: 12000"
                    value={precio}
                    keyboardType="numeric"
                    onChangeText={setPrecio}
                    style = {[styles.input, !precioValido && styles.inputError]}
                />
            </View>

            <View  style = {styles.divider}/>
            
            <Text style = {styles.subtitle}>Variantes (Color + Talle + Cantidad)</Text>

            {/* Colores */}
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

            {/* Cantidad */}
            <View style = {{gap : 6}}>
                <Text style = {styles.label}>Cantidad (Stock)</Text>
                <TextInput
                    placeholder="Ej : 10"
                    keyboardType="numeric"
                    value={cantidad}
                    onChangeText={setCantidad}
                    style = {styles.cantidad}
                />
            </View>
            {/* Boton agregar variante */}
            <Pressable
                onPress={() => agregarVariante()}
                style = {styles.variante}
            >
                <Text style = {{color : "white", fontWeight : "700"}}>Agregar variante</Text>
            </Pressable>

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
                />
            </View>
            <Pressable onPress={handleSave} disabled = {!formValido} style = {[
                styles.button, 
                !formValido && styles.buttonDisabled
            ]}>
                <Text style={styles.buttonText}>Guardar</Text>
            </Pressable>
        </View>
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
        marginTop : 4
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
    }
})