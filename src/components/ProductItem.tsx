import { useState } from "react";
import {StyleSheet, View, Text} from "react-native"; 

type ProductItemProps = {
    key : number,
    nombre : string; 
    cantidadInicial: number; 
    cantidadVendida: number;
    precio : number;
    onAgregar : () => void; 
    onQuitar : () => void; 
}

export function ProductItem({nombre, cantidadInicial, cantidadVendida, precio, onAgregar, onQuitar} : ProductItemProps) {
    const disableQuitar = cantidadInicial === 0; 
    return (
        <View style = {styles.container}>
            <Text style = {styles.product}>{nombre}</Text>
            <Text style = {[styles.cantidad, cantidadInicial === 0 && styles.cantidad0]}>cantidad : {cantidadInicial < 5 ? "Stock bajo" :cantidadInicial}</Text>
            <Text style = {styles.cantidadVendida}>{cantidadVendida}</Text>
            <Text style = {styles.precio}>${precio}</Text>
            <Text onPress={onAgregar} > {"+Agregar"}</Text>
            <Text onPress={disableQuitar ? undefined : onQuitar} > {"-Quitar"}</Text>
        </View>
    )
}

const styles = StyleSheet.create ({
    container : {
        padding : 12, 
        borderBottomWidth : 1,
        backgroundColor : "white"
    },
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
    }
});
