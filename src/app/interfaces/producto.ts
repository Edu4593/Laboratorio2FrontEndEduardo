export interface Producto {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  /** El API recibe y devuelve la categoría como objeto: { id } (ver pruebas HTTP). */
  categoria: { id: number; nombre?: string } | null;
}
