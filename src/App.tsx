import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import {ProductItem} from "./components/ProductItem"; 
import { useState } from 'react';
import {Product} from "./types/Product"; 
import { useEffect} from 'react';
import { loadProducts, saveProducts } from './storage/productsStorage';
import { Movement } from './types/Movement';
import { loadMovements, saveMovements } from './storage/movementStorage';

export default function App() {
  const [products, setProducts] = useState<Product[]>([
    {id : 1, nombre : "Delantal Black", cantidadInicial: 20, cantidadVendida : 10, precio : 28000}, 
    {id : 2, nombre : "Delantal Colurs", cantidadInicial: 20, cantidadVendida : 10, precio : 28000}, 
    {id : 3, nombre : "Delantal Cordura lisa", cantidadInicial: 10, cantidadVendida : 5, precio : 20000}, 
    {id : 4, nombre : "Delantal Cordura estampada", cantidadInicial: 10, cantidadVendida : 5, precio : 24000}, 
  ])

  const [hydrated, setHydrated] = useState(false); 

  const [movements, setMovements] = useState<Movement[]>([])

  useEffect(() => {
    async function init() {
      const storedProducts = await loadProducts(); 
      if(storedProducts) setProducts(storedProducts);
      const storedMovements = await loadMovements(); 
      if(storedMovements) setMovements(storedMovements); 
      setHydrated(true); 
    }
    init()
  }, []);
  
  useEffect(() => {
    if(!hydrated) return; 
    saveProducts(products);
  },[products, hydrated]);
  
  useEffect(() => {
    saveMovements(movements)
  },[movements]); 
  
  function createMovement (params: {
    productId: number; 
    productName: string;
    type: "ENTRADA" | "SALIDA";  
    cantidad : number
  }) {
    const movement : Movement = {
      id: `${Date.now()}-${Math.random()}`, 
      productId : params.productId, 
      productName : params.productName, 
      type : params.type, 
      cantidad: params.cantidad,
      createAt: new Date().toISOString()
    };
    setMovements((prev) => [movement, ...prev]); // Lo mas nuevo arriba
  }
  function agregarStock(id : number) {
    {/*1) Encontramos el producto actual (para saber el nombre)*/}
    const prod = products.find(p => p.id === id); 
    if (!prod) return;

    {/*2) Actualizamos el stock (OJO: MISMA PROPIEDAD que se usa en la UI)*/}
    setProducts((prev) => 
      prev.map((p) => 
        p.id === id ? {...p, cantidadInicial : p.cantidadInicial + 1} : p
      )
    );
    {/*3) Registramos el movimiento */}
    createMovement({
      productId : prod.id, 
      productName : prod.nombre, 
      type : "ENTRADA", 
      cantidad : 1
    })
  }
  
  function quitarStock(id : number) {
    setProducts((products) => 
      products.map((product) => {
        if (product.id !== id) return product; 
        if(product.cantidadInicial <= 0) return product; 
        const updated = {...product, cantidadInicial : product.cantidadInicial - 1};
        createMovement({
          productId : product.id, 
          productName : product.nombre, 
          type : "SALIDA", 
          cantidad : 1
        });
        return updated; 
      })
    )
  }

  return (
    <ScrollView style = {styles.container} contentContainerStyle = {styles.content}>
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
        <Text style = {styles.movimientos}>Movimientos</Text>
        <View style = {styles.movimientos}>
          {movements.length === 0 ? (
          <Text style={styles.movimientoEmpty}>No hay movimientos todavía</Text>
        ) : (
          movements.slice(0, 20).map((m) => (
            <View key={m.id} style={styles.movimientoItem}>
              <Text style={[styles.movimientoType, { color: m.type === "ENTRADA" ? "green" : "red" }]}>
                {m.type}
              </Text>
              <Text>{m.productName} (x{m.cantidad})</Text>
              <Text style={styles.movimientoDate}>{new Date(m.createAt).toLocaleString()}</Text>
            </View>
          ))
        )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    color: "white",
    textDecorationLine: "underline",
  },
  subtitle: {
    fontSize: 18,
    color: "white",
    marginTop: 10,
    marginBottom: 10,
  },
  productos: {
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    width: "100%", // CLAVE
  },
  movimientosTitle: {
    color: "white",
    marginTop: 20,
    fontSize: 18,
  },
  movimientos: {
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    width: "100%", // CLAVE
    marginTop: 10,
  },
  movimientoItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  movimientoType: {
    fontWeight: "bold",
  },
  movimientoDate: {
    color: "gray",
    fontSize: 12,
  },
  movimientoEmpty: {
    padding: 10,
    color: "gray",
  },
});


