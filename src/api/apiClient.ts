import api from "./axiosConfig";
import { AxiosRequestConfig, AxiosResponse } from "axios";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; 

interface ApiFetchOption<B = unknown> {
    method? : HttpMethod;   //Metodo HTTP (default : GET)
    body? : B;              //Datos que envias al backend
    params? : Record<string, unknown>;      //Query params (?key=value)
    config? : AxiosRequestConfig;           //Config extra de axios de la necesito
}

export async function apiFetch<T, B = unknown> (
    endPoint : string, 
    options : ApiFetchOption<B> = {}
) : Promise<T> {
    const {method = "GET", body} = options; 

    const response : AxiosResponse<T> = await api({
        url : endPoint, 
        method, 
        data : body
    })

    return response.data
}