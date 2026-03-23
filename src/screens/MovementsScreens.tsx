import {View, Text, Pressable, StyleSheet, Platform} from "react-native"; 
import { colors } from "../theme/colors";


export default function MovementsScreens({movements, onClear}: any) {
    return (
        <View style={styles.container}>
            <Pressable onPress = {onClear} style = {styles.deleteButton}>
                <Text style = {styles.deleteButtonText}>🗑️ Borrar Movimientos</Text>
            </Pressable>

            <View style = {styles.movimientos}>
                {movements.length === 0 ? (
                    <Text style = {styles.movimientoEmpty}> No hay movimientos registrados</Text>
                ):(
                    movements.map((m : any) => (
                        <View key={m.id} style = {styles.movimientosItem}>
                            <Text style  = {[styles.movimientoType, {color : m.type === "ENTRADA" ? colors.success : colors.error }]}>{m.type}</Text>
                            <Text style={styles.movimientoProduct}>{m.productName} - (x{m.cantidad})</Text>
                            <Text style = {styles.movimientoDate}>{new Date(m.createAt).toLocaleString()}</Text>
                        </View>
                    ))
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor : colors.backgroundDark,
        padding : 16, 
        width: "100%", 
        height: "100%",
        paddingBottom: 90
    }, 
    deleteButton : {
        backgroundColor : colors.error, 
        justifyContent : "center",
        alignItems : "center",
        padding : 10,
        borderRadius : 8,
        marginTop : 10,  
        width : Platform.OS === "web" ? "15%" : "50%"
    }, 
    deleteButtonText : {
        color : colors.textInverse,
        fontWeight : "bold"
    }, 
    movimientos : {
        borderRadius : 8, 
        overflow : "hidden",
        width : "100%",
        marginTop : 10
    }, 
    movimientoEmpty : {
        padding : 10, 
        color : colors.textInverse, 
        fontSize : 20
    }, 
    movimientosItem : {
        padding : 10, 
        borderBottomWidth : 1,
        borderColor : colors.border, 
        backgroundColor : colors.surface
    }, 
    movimientoType : {
        fontWeight : "bold"
    },
    movimientoProduct: {
        color: colors.textPrimary
    },
    movimientoDate : {
        color : colors.textLight,
        fontSize : 12
    }
})