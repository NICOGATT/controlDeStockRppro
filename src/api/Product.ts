import api from "./axiosConfig"; 

export const getProductos = async() => {
    try {
        const response = await api.get('/api/productos')
        return response.data
    } catch (error) {
        console.error("Error al obtener productos: ", error)
        throw error
    }
}