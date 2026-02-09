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
import EditProductScreen from "./screens/EditProductScreen";
import { PrefacturaScreen } from './screens/PrefacturaScreen';
import BarcodeScanScreen from './components/BarcodeScanScreen';
import ScanScreen from './screens/ScanScreen';
import ArmarPedidoScreen from './screens/ArmarPedidoScreen';

export default function App() {
  const [products, setProducts] = useState<Product[]>([])

  const [hydrated, setHydrated] = useState(false); 

  const [movements, setMovements] = useState<Movement[]>([])

  const [nombre, setNombre] = useState(""); 

  const [stock, setStock] = useState(""); 
  
  const [precio, setPrecio] = useState(""); 

  const [stockDeseado, setStockDeseado] = useState("");

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
  function handleAddProduct(nombre : string, stock: string, stockDeseado: string, precio: string) {
    console.log("NOMBRE:", JSON.stringify(nombre));
    const nombreLimpio = nombre.trim(); 
    if(!nombreLimpio){
      alert("El nombre es obligatorio")
      return;     
    }

    const stockNumber = Number(stock)
    const stockDeseadoNumber = Number(stockDeseado)
    const precioNumber= Number(precio)

    if (Number.isNaN(stockNumber)  || Number.isNaN(precioNumber) || Number.isNaN(stockDeseadoNumber)) {
      alert("Stock y precio deben ser numeros validos")
      return;
    }
    const newProduct : Product = {
      id : Date.now(), 
      nombre : nombreLimpio, 
      cantidadInicial : stockNumber,
      stockDeseado : stockDeseadoNumber, 
      precio : precioNumber, 
    }

    setProducts((prev) => [newProduct, ...prev]); 
    //Limpiar el formulario
    setNombre(""); 
    setStock(""); 
    setStockDeseado("");
    setPrecio("");
  }

  {/*Se borra un solo producto */}
  function borrarProducto(id:number) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  {/*Actualizamos un producto */}
  function updateProduct(id : number, changes : {nombre : string, cantidadInicial : number, precio : number}) {
    const nombreLimpio = changes.nombre.trim();
    {/*Validacion minima */}
    if(!nombreLimpio){
      alert("El nombre es obligatorio");
      return false;     
    }

    if(Number.isNaN(changes.cantidadInicial) || changes.cantidadInicial < 0) {
      alert("Stock debe ser un numero valido");
      return false;
    }
    
    if(Number.isNaN(changes.precio) || changes.precio < 0) {
      alert("Precio debe ser un numero valido");
      return false;
    }

    {/*Producto actual */}
    const current = products.find((p) => p.id === id);
    if(!current) return false; 

    const oldStock = current.cantidadInicial; 
    const newStock = changes.cantidadInicial;
    const diff = newStock - oldStock;


    setProducts((prev) => 
      prev.map((p) => (p.id === id ? {...p, nombre : nombreLimpio, cantidadInicial : newStock, precio : changes.precio} : p)
    ));

    {/*Crear movimiento automatico */}
    if(diff !== 0) {
      createMovement({
        productId : current.id, 
        productName : current.nombre, 
        type : diff > 0 ? "ENTRADA" : "SALIDA", 
        cantidad : Math.abs(diff)
      })
    }
    return true;
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
        <Stack.Screen 
          name= "EditProduct"
          options = {{title : "Editar producto"}}
        >
          {props => (
            <EditProductScreen
              {...props}
              onUpdateProduct = {updateProduct}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name='Prefactura'
          component={PrefacturaScreen}
          options={{title : "Prefactura"}}
        />
        <Stack.Screen
          name = "BarcodeScanScreen"
          component={ScanScreen}
          options={{title : "Escaner"}}
        />
        <Stack.Screen
          name='PedidosScreen'
          component={ArmarPedidoScreen}
          options={{title : "Armar pedido"}}
        />
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


