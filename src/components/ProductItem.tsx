import React, { useState } from "react";
import {StyleSheet, View, Text, TouchableOpacity, Pressable} from "react-native"; 
import { StockProducto } from "../types/StockProducto";
import { Product } from "../types/Product";
import { ColorYTalle } from "../types/ColorYTalle";
import { apiFetch } from "../api/apiClient";
import { formatMoney } from "../utils/pedido";
import { colors } from "../theme/colors";

interface ProductProps {
    producto : Product; 
    onAgregar : (variante : StockProducto) => void; 
    onQuitar : (variante : StockProducto) => void; 
    onDelete : () => void; 
    onAgregarVariante : (producto : Product) => void; 
    onGenerarQr? : (variante : StockProducto) => void; 
}

export function ProductItem({producto, onAgregar, onQuitar, onDelete, onAgregarVariante, onGenerarQr} : ProductProps) {
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
                    <View style={styles.varianteHeader}>
                        <View style={styles.varianteInfo}>
                            <Text style = {styles.varianteTexto}>{v.color?.nombre}</Text>
                            <Text style = {styles.varianteTexto}>Talle : {v.talle?.nombre} - Cantidad : {v.stock}</Text>
                            {v.precio != null && (
                                <Text style = {styles.varianteTexto}>{formatMoney(v.precio)}</Text>
                            ) }
                        </View>
                        {onGenerarQr && (
                            <TouchableOpacity onPress={() => onGenerarQr(v)} style = {styles.qrBoton}>
                                <Text style = {styles.qrBotonText}>📄 QR</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.varianteAcciones}>
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
        fontSize : 16,
        color: colors.textPrimary
    }, 
    cantidad : {
        color :  colors.textLight
    },
    cantidadVendida: {
        color: colors.success
    }, 
    precio: {
        fontWeight: "bold"
    }, 
    cantidad0 : {
        color: colors.error
    }, 
    boton:{
        padding: 5,
        width : 100, 
        borderRadius : 10,
        backgroundColor : colors.primary,
        marginBottom : 10,
    }, 
    botonDisabled: {
        padding : 5,
        width : 100, 
        borderRadius : 10, 
        backgroundColor : colors.disabledDark
    }, 
    textButton:{
        color : colors.textInverse
    }, 
    tipoDePrenda : {
        color : colors.textLight
    }, 
    varianteFila : {
        borderWidth : 1, 
        borderColor: colors.borderDark,
        borderRadius : 10, 
        padding : 10,
        backgroundColor: colors.surfaceDark
    }, 
    colorCirculo : {
        borderRadius : 10, 
        borderWidth : 1

    }, 
    varianteTexto : {
        fontSize : 12,
        color: colors.textSecondary,
        fontWeight : "700"
    }, 
    varianteHeader : {
        flexDirection : "row",
        justifyContent : "space-between",
        alignItems : "flex-start"
    },
    varianteInfo : {
        flex : 1
    },
    varianteAcciones : {
        flexDirection : "row",
        gap : 8,
        marginTop : 8
    },
    qrBoton : {
        backgroundColor : colors.info,
        paddingVertical : 6,
        paddingHorizontal : 12,
        borderRadius : 8
    },
    qrBotonText : {
        color : colors.textInverse,
        fontWeight : "700",
        fontSize : 12
    },
    productoid : {
        fontWeight : "700",
        color: colors.textSecondary
    }
});
