import {StyleSheet, View, Text} from "react-native"; 

type ProductItemProps = {
    id : number,
    nombre : string; 
    cantidad: number; 
    cantidadVendida: number;
    precio : number;
}

export function ProductItem({nombre, cantidad, cantidadVendida, precio} : ProductItemProps) {
    return (
        <View style = {styles.container}>
            <Text>{nombre}</Text>
            <Text>{cantidad}</Text>
            <Text>{cantidadVendida}</Text>
            <Text>${precio}</Text>
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
        color : "gray"
    },
    cantidadVendida: {
        color: "green"
    }, 
    precio: {
        fontWeight: "bold"
    }, 
});
