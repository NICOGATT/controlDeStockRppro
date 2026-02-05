import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Alert, Button, Platform, TextInput, Pressable } from 'react-native';
import {ProductItem} from "./components/ProductItem"; 
import { useState } from 'react';
import {Product} from "./types/Product"; 
import { useEffect} from 'react';
import { loadProducts, saveProducts } from './storage/productsStorage';
import { Movement } from './types/Movement';
import { deleteMovement, loadMovements, saveMovements } from './storage/movementStorage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MovementsScreens from "./screens/MovementsScreens";
import AddProductsScreen from "./screens/AddProductsScreen";
import ProductsScreen from "./screens/ProductsScreen";

export default function App() {
  const [products, setProducts] = useState<Product[]>([])

  const [hydrated, setHydrated] = useState(false); 

  const [movements, setMovements] = useState<Movement[]>([])

  const [nombre, setNombre] = useState(""); 

  const [stock, setStock] = useState(""); 
  
  const [precio, setPrecio] = useState(""); 

  const Stack = createNativeStackNavigator();

  {/*Recargamos los productos y los movimientos al iniciar la app*/}
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
  
  {/*Creamos los moviemientos*/}
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

  {/*Agregamos stock que vendria ser una entrada del producto*/}
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
  
  {/*Quitamos el stock que vendria ser una salida del producto */}
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

  {/*Borramos todos los moviemientos del AsyncStorage */}
  async function borrarTodoMovimientos(setMovements : any) {
    const success = await deleteMovement(); 
    if(success) {
      setMovements([]); 
      decisionDePlataforma();
    } else {
      if(Platform.OS === "web") {
        alert("❌ No se pudo borrar");
      } else {
        Alert.alert("❌", "No se pudo borrar");
      };
    };
  };

  {/*Creamos otra funcion para mayor legibilidad */}
  function decisionDePlataforma() {
    if(Platform.OS === "web") {
      alert("✅ Historial borrado");
    } else {
      Alert.alert("✅", "Historial borrado")
    }
  }

  {/*Quitamos todos los movimientos del historial y llamamos a la borrarTodosMovimientos(setMovement: any) */}
  function quitarMovimientos() {
    if(Platform.OS === "web") {
      const ok = window.confirm(
        "¿Borrar todos los movimientos? Esto no afectara al stock actual"
      ); 
      if(ok) borrarTodoMovimientos(setMovements); 
      return;
    }
    Alert.alert(
      "Confirmar", 
      "¿Borrar todos los movimientos? Esto no afectara el stock actual",
      [
        {text : "Cancelar", style : "cancel"},
        {
          text : "Borrar todo", 
          style : "destructive", 
          onPress : () => borrarTodoMovimientos(setMovements)
        }
      ]
    );
  }

  {/*Agregamos un producto a mano  */}
  function handleAddProduct(nombre : string, stock: string, precio: string) {
    console.log("NOMBRE:", JSON.stringify(nombre));
    const nombreLimpio = nombre.trim(); 
    if(!nombreLimpio){
      alert("El nombre es obligatorio")
      return;     
    }

    const stockNumber = Number(stock)
    const precioNumber= Number(precio)

    if (Number.isNaN(stockNumber)  || Number.isNaN(precioNumber)) {
      alert("Stock y precio deben ser numeros validos")
      return;
    }
    const newProduct : Product = {
      id : Date.now(), 
      nombre : nombreLimpio, 
      cantidadInicial : stockNumber,
      cantidadVendida : 0, 
      precio : precioNumber
    }

    setProducts((prev) => [newProduct, ...prev]); 
    //Limpiar el formulario
    setNombre(""); 
    setStock(""); 
    setPrecio("");
  }

  {/*Se borra un solo producto */}
  function borrarProducto(id:number) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name = "Productos"
          options = {{headerShown : false}}
        >
          {props => (
            <ProductsScreen
              {...props}
              products = {products}
              agregarStock = {agregarStock}
              quitarStock = {quitarStock}
              borrarProducto = {borrarProducto}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name = "AddProduct"
          options = {{title : "Agregar producto"}}
        >
          {props =>(
            <AddProductsScreen
              {...props}
              onAddProduct = {handleAddProduct}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name = "Movements"
          options = {{title : "Movimientos"}}
        >
          {props => (
            <MovementsScreens
              {...props}
              movements = {movements}
              onClear = {quitarMovimientos}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#20a4f3",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    color: "#f6f7f8",
    textDecorationLine: "underline",
  },
  subtitle: {
    fontSize: 18,
    color: "#f6f7f8",
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
    color: "#f6f7f8",
    marginTop: 20,
    fontSize: 18,
  },
  movimientos: {
    borderRadius: 8,
    overflow: "hidden",
    width: "100%", // CLAVE
    marginTop: 10,
  },
  movimientoItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    backgroundColor : "#f6f7f8"
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
    color: "#f6f7f8",
    fontSize : 20,
  },
  deleteContainer: {
    flex : 1, 
    justifyContent : "space-around",
    flexDirection : "row",  
  }, 
  form : {
    backgroundColor : "#f6f7f8",
    padding : 12, 
    borderRadius : 8, 
    marginBottom : 20  
  }, 
  input : {
    borderWidth : 1,
    borderColor : "#ccc", 
    padding : 8, 
    marginBottom : 10, 
    borderRadius : 4
  }, 
  button : {
    backgroundColor : "#2ec4b6", 
    padding : 12, 
    borderRadius : 6, 
    alignItems : "center"
  }, 
  buttonText : {
    color : "white", 
    fontWeight : "bold"
  }, 
  emptyText : {
    color : "#f6f7f8", 
    fontStyle : "italic",
    fontSize : 20
  }, 
  deleteButton : {
    backgroundColor : "#011627", 
    justifyContent : "center",
    alignItems : "center",
    padding : 10,
    borderRadius : 8,
    marginTop : 10  
  }, 
  deleteButtonText : {
    color : "white",
    fontWeight : "bold"
  }
});


