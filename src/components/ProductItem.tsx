import React, { useState } from "react";
import {StyleSheet, View, Text, TouchableOpacity, Pressable} from "react-native"; 
import { StockProducto } from "../types/StockProducto";
import { Product } from "../types/Product";
import { ColorYTalle } from "../types/ColorYTalle";
import { apiFetch } from "../api/apiClient";
import { formatMoney } from "../utils/pedido";

interface ProductProps {
    producto : Product; 
    onAgregar : (variante : StockProducto) => void; 
    onQuitar : (variante : StockProducto) => void; 
    onDelete : () => void; 
    onAgregarVariante : (producto : Product) => void; 
}

export function ProductItem({producto, onAgregar, onQuitar, onDelete, onAgregarVariante} : ProductProps) {
    const stockTotal = (producto.stockProductos ?? []).reduce((acc, sp) => acc + sp.stock, 0); 

    const stockBajo = stockTotal <= 5
    const disableQuitar = stockTotal <= 0
    
    async function actualizarStock(
        productoId : string , 
        colorId : number, 
        talleId : number, 
        delta : number 
    ) {
        await apiFetch('/api/stockProductos', {
            method : "PUT", 
            body : {
                productoId, 
                colorId,
                talleId, 
                delta
            }
        })
    }
    return (
        <View>
            <Text style = {styles.productoid}>{producto.id}</Text>
            <Text style = {styles.product}>{`${producto.nombre}`}</Text>
            <Text style = {[styles.cantidad, stockBajo && styles.cantidad0]}>Stock : {stockBajo ? "Stock bajo" : `${stockTotal} unidades`}</Text>
            <Text style = {styles.tipoDePrenda}>{`${producto.tipoDePrenda.nombre}`}</Text>
            <TouchableOpacity onPress={() => onAgregarVariante(producto)} style = {styles.boton}>
                <Text style = {styles.textButton}>+ Agregar Variante</Text>
            </TouchableOpacity>

            {producto.stockProductos?.map((v, index) => (
                <View key={index} style = {styles.varianteFila}>
                    <Text style = {styles.varianteTexto}>{v.color?.nombre}</Text>
                    <Text style = {styles.varianteTexto}>Talle : {v.talle?.nombre} - Cantidad : {v.stock}</Text>
                    {v.precio != null && (
                        <Text style = {styles.varianteTexto}>{formatMoney(v.precio)}</Text>
                    ) }
                    {/* //Agregue el TouchableOpacity para que no me de error en telefono ya que no se puede poner un onPress en un texto */}
                    <TouchableOpacity onPress={() => onAgregar(v)} style = {styles.boton}>
                        <Text style = {styles.textButton}>+Agregar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => onQuitar(v)}
                        disabled={disableQuitar}
                        style={[styles.boton, styles.botonDisabled]}
                    >
                        <Text style ={styles.textButton}>-Quitar</Text>
                    </TouchableOpacity>
                </View>
            ))}
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
    }, 
    tipoDePrenda : {
        color : "gray"
    }, 
    varianteFila : {
        borderWidth : 1, 
        borderRadius : 10, 
        padding : 10
    }, 
    colorCirculo : {
        borderRadius : 10, 
        borderWidth : 1

    }, 
    varianteTexto : {
        fontSize : 12,
        backgroundColor : "gray",
        fontWeight : "700"
    }, 
    productoid : {
        fontWeight : "700"
    }
});
