import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import {ProductItem} from "./components/ProductItem"; 
import { useState } from 'react';
import {Product} from "./types/Product"; 
import { useEffect} from 'react';
import { loadProducts, saveProducts } from './storage/productsStorage';

export default function App() {
  const [products, setProducts] = useState<Product[]>([
    {id : 1, nombre : "Delantal Black", cantidadInicial: 20, cantidadVendida : 10, precio : 28000}, 
    {id : 2, nombre : "Delantal Colurs", cantidadInicial: 20, cantidadVendida : 10, precio : 28000}, 
    {id : 3, nombre : "Delantal Cordura lisa", cantidadInicial: 10, cantidadVendida : 5, precio : 20000}, 
    {id : 4, nombre : "Delantal Cordura estampada", cantidadInicial: 10, cantidadVendida : 5, precio : 24000}, 
  ])
  useEffect(() => {
    async function init() {
      const storedProducts = await loadProducts(); 
      if(storedProducts) {
        setProducts(storedProducts);
      }
    }
    init()
  }, []);

  useEffect(() => {
    saveProducts(products);
  },[products]);

  function agregarStock(id : number) {
    setProducts(products => 
      products.map(product => 
        product.id === id ? {...product, cantidadInicial : product.cantidadInicial + 1} : product
      )
    );
  }
  
  function quitarStock(id : number) {
    setProducts(products => 
      products.map(product => 
        product.id === id && product.cantidadInicial > 0 ? {...product, cantidadInicial : product.cantidadInicial - 1} : product
      )
    )
  }
  return (
    <View style = {styles.container}>
      <Text style = {styles.title}>Control de Stock RPPRO</Text>
      <Text style = {styles.subtitle}>Productos</Text>
      <View style = {styles.productos}>
        {products.map(product => (
          <ProductItem
            key={product.id}
            nombre={product.nombre}
            cantidadInicial={product.cantidadInicial}
            cantidadVendida={product.cantidadVendida}
            precio={product.precio}
            onAgregar={() => agregarStock(product.id)}
            onQuitar={() => quitarStock(product.id)}
          />
        )
        )};
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


