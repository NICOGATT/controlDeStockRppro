import { useState } from "react";
import {StyleSheet, View, Text, TouchableOpacity, Pressable} from "react-native"; 

type ProductItemProps = {
    nombre : string; 
    cantidadInicial: number; 
    stockDeseado: number;
    precio : number;
    onAgregar : () => void; 
    onQuitar : () => void; 
    onDelete : () => void;
}

export function ProductItem({nombre, cantidadInicial, stockDeseado, precio, onAgregar, onQuitar, onDelete} : ProductItemProps) {
    const disableQuitar = cantidadInicial === 0; 
    return (
        <View>
            <Text style = {styles.product}>{`${nombre}`}</Text>
            <Text style = {[styles.cantidad, cantidadInicial === 0 && styles.cantidad0]}>cantidad : {cantidadInicial < 5 ? "Stock bajo" : `${cantidadInicial} unidades`}</Text>
            <Text style = {styles.cantidadVendida}>Stock deseado :  {stockDeseado}</Text>
            <Text style = {styles.precio}>${precio}</Text>
            {/* //Agregue el TouchableOpacity para que no me de error en telefono ya que no se puede poner un onPress en un texto */}
            <TouchableOpacity onPress={onAgregar} style = {styles.boton}>
                <Text style = {styles.textButton}>+Agregar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                onPress={onQuitar}
                disabled={disableQuitar}
                style={[styles.boton, disableQuitar && styles.botonDisabled]}
            >
                <Text style ={styles.textButton}>-Quitar</Text>
            </TouchableOpacity>
            <Pressable onPress = {onDelete}>
                <Text > 🗑️ Eliminar</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create ({
    product : {
        fontSize : 16
    }, 
    cantidad : {
        color :  "gray"
    },
    cantidadVendida: {
        color: "green"
    }, 
    precio: {
        fontWeight: "bold"
    }, 
    cantidad0 : {
        color: "red"
    }, 
    boton:{
        padding: 5,
        width : 100, 
        borderRadius : 10,
        backgroundColor : "blue",
        marginBottom : 10,
    }, 
    botonDisabled: {
        padding : 5,
        width : 100, 
        borderRadius : 10, 
        backgroundColor : "red"
    }, 
    textButton:{
        color : "white"
    }
});
