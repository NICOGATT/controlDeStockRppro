import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import {ProductItem} from "./components/ProductItem"

export default function App() {
  return (
    <View style = {styles.container}>
      <Text style = {styles.title}>Control de Stock RPPRO</Text>
      <Text style = {styles.subtitle}>Productos</Text>
      <View style = {styles.productos}>
        {products.map(product => (
          <ProductItem
            id={product.id}
            nombre={product.nombre}
            cantidad={product.cantidad}
            cantidadVendida={product.cantidadVendida}
            precio={product.precio}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex : 1,
    padding : 20,
    backgroundColor : "black",
    alignItems : "center",
  },
  title: {
    fontSize : 50, 
    color : "white",
     textDecorationLine : "underline"
  }, 
  subtitle: {
    fontSize : 20, 
    color: "white",
    padding : 20
  }, 
  productos: {
    backgroundColor : "white"
  }, 
  
});

const products = [
  {id : 1, nombre : "Delantal Black Sublimado con imâgenes de Mascotas.", cantidad : 20 , cantidadVendida: 10, precio : 28000}, 
  {id : 2, nombre : "Delantal Colours Sublimado con imàgenes de Mascotas.", cantidad : 20 , cantidadVendida: 5, precio : 28000}, 
  {id : 3, nombre : "Delantal Colours Sublimado con imàgenes de Mascotas.", cantidad : 10 , cantidadVendida: 5, precio : 20000}, 
  {id : 4, nombre : "Delantal Cordura estampada impermeable con bolsillo con cierre", cantidad : 10 , cantidadVendida: 5, precio : 24000}, 
]