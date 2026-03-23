import { apiFetch } from './apiClient';

export interface Backup {
  id: string;
  nombre: string;
  fecha: string;
  tamano: string;
  ruta: string;
}

export async function getBackups(): Promise<Backup[]> {
  const response = await apiFetch<Backup[] | { backups: Backup[] }>('/api/backups');
  
  // Normalizar respuesta (puede venir como array directo o como { backups: [...] })
  if (Array.isArray(response)) {
    return response;
  }
  return response.backups || [];
}

export async function createBackup(): Promise<{ success: boolean; message: string; archivo?: string }> {
  const response = await apiFetch<{ mensaje: string; archivo: string; tamaño?: string; fecha?: string }>('/api/backups', {
    method: 'POST',
  });
  
  // Normalizar respuesta del backend
  return {
    success: true,
    message: response.mensaje || 'Backup creado exitosamente',
    archivo: response.archivo,
  };
}

export async function downloadBackup(archivo: string): Promise<string> {
  return apiFetch<string>(`/api/backups/${archivo}`);
}

export async function restoreBackup(data: { archivo: string }): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/api/backups/restore/data', {
    method: 'POST',
    body: data,
  });
}
