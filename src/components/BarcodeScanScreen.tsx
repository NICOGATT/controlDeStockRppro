import React, { useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

{/* */}
export default function GenerarCodigoButton({
    visible, 
    producto, 
    onClose
} : {
    visible : boolean; 
    producto : {id : number; nombre : string} | null; 
    onClose : () => void
}) {
    if(!producto) return null; 

    const payload = `rppro:product:${producto.id}`
    
    return (
        <Modal visible = {visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style = {{flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent : "center", alignItems : "center"}}>
                <View style = {{backgroundColor : "white", padding : 20, borderRadius : 12, width : 300, alignItems : "center"}}>
                    <Text style = {{fontWeight : "800", marginBottom : 10}}>{producto.nombre}</Text>
                    <QRCode value = {payload} size={220}/>
                    <TouchableOpacity onPress={onClose} style = {{marginTop : 14}}>
                        <Text style = {{fontWeight : "800"}}>Cerrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}