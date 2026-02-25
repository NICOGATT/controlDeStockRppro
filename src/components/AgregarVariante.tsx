import React, { useEffect, useState } from "react";
import { Color } from "../types/Color";
import { Product } from "../types/Product";
import { Talle } from "../types/Talle";
import { Alert, Modal, View, StyleSheet, TouchableOpacity, Text, TextInput} from "react-native";
import { apiFetch } from "../api/apiClient";
import { StockProducto } from "../types/StockProducto";

interface Props {
    visible : boolean; 
    producto : Product | null ; 
    colores : Color[]; 
    talles : Talle []; 
    onClose : () => void;
    onCreated : () => void ; //Refrescar la lista
}

export default function AgregarVariante({visible, producto, colores, talles, onClose, onCreated} : Props) {
    const [colorId, setColorId] = useState<number>(colores[0]?.id ?? 0);
    const [talleId, setTalleId] = useState<number>(talles[0]?.id ?? 0);
    const [stock, setStock] = useState<string>("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if(visible) {
            setColorId(colores[0]?.id ?? null);
            setTalleId(talles[0]?.id ?? null);
            setStock("0");
        }
    },[visible]);

    const stockNum = Number(stock); 
    const nombreColor = colores.find(c => c.id === colorId)?.nombre ?? "";
    const nombreTalle = talles.find(t => t.id === talleId)?.nombre ?? "";

    const onSave = async() => {
        if(!producto) return;
        if(!colorId || !talleId) {
            Alert.alert('Falta info', 'Ingresa un numero valido'); 
            return;
        }

        try {
            setSaving(true) ; 
            await apiFetch<StockProducto>('/api/stockProductos', {
                method : 'POST', 
                body : {
                    productoId : producto.id,
                    coloresYTalles : [
                        {
                            color : nombreColor, 
                            talle : nombreTalle,
                            cantidad : stockNum
                        }
                    ]
                }
            })
            onCreated(); 
            onClose(); 
        } catch (e : any) {
            Alert.alert('Error', e?.message ?? "No se pudo crear la variante");
        } finally {
            setSaving(false);
        }
    }; 

    if (!visible || !producto) return null;

    return ( 
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Agregar Variante •{producto.nombre}</Text>
                    {/* Aca usar Picker (o tu selector) */}
                    {/* Color */}
                    <Text>Color</Text>
                    {colores.map(c => (
                        <TouchableOpacity
                            key={c.id}
                            onPress={() => {
                                setColorId(c.id);
                            }}
                            style = {styles.boton}
                        >
                            <Text>{c.nombre}</Text>
                        </TouchableOpacity>
                    ))}
                    {/* Talle */}
                    <Text>Talle</Text>
                   {talles.map(t => (
                            <TouchableOpacity
                                key={t.id}
                                onPress={() => {
                                    setTalleId(t.id);
                                }}
                                style = {styles.boton}
                            >
                                <Text>{t.nombre}</Text>
                            </TouchableOpacity>
                            
                        ))
                    }
                    {/* Stock */}
                    <Text>Stock</Text>
                    <TextInput
                        keyboardType="numeric"
                        value = {stock}
                        onChangeText = {setStock}
                        placeholder="Cantidad en stock"
                        style = {styles.input}
                    />
                    <View style = {styles.buttonContainer}>
                        <TouchableOpacity onPress={onSave} disabled={saving} style = {styles.boton}>
                            <Text style = {styles.textButton}>{saving ? "Guardando..." : "Guardar"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} disabled={saving} style = {styles.boton}>
                            <Text style = {styles.textButton}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}






const styles = StyleSheet.create({
    modalContainer : {
        flex : 1, 
        backgroundColor : "rgba(0,0,0,0.4)", 
        justifyContent : "center",
        padding : 16
    }, 
    modalContent : {
        backgroundColor : "white",
        borderRadius : 16, 
        padding : 16
    }, 
    modalTitle : {
        fontSize : 18, 
        fontWeight : "700", 
        marginBottom : 12
    }, 
    input : {
        borderWidth : 1, 
        borderColor : "#ddd", 
        borderRadius : 10,
        padding : 10, 
        marginTop : 6
    }, 
    boton : {
        borderRadius : 10,
        backgroundColor : "#007bff",
        padding : 10, 
        marginTop : 12,
    }, 
    textButton : {
        fontWeight : "700"
    },
    buttonContainer : {
        flexDirection : "row", 
        justifyContent : "space-between", 
        gap : 12, 
        marginTop : 14
    }
})