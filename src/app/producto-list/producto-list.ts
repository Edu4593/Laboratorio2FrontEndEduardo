import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Producto } from '../interfaces/producto';
import { ServicioAutenticacion } from '../services/auth';
import { ProductoService } from '../services/producto';

@Component({
  imports: [RouterLink, CurrencyPipe],
  selector: 'app-producto-list',
  templateUrl: './producto-list.html',
})
export class ProductoList implements OnInit {
  protected readonly servicioAutenticacion = inject(ServicioAutenticacion);
  private readonly productoService = inject(ProductoService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly mensajeError = signal<string | null>(null);

  ngOnInit(): void {
    this.obtenerProductos();
  }

  private obtenerProductos(): void {
    this.cargando.set(true);
    this.productoService.listar().subscribe({
      next: (productosObtenidos) => {
        this.productos.set(productosObtenidos);
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudieron cargar los productos.');
        this.cargando.set(false);
      },
    });
  }

  protected eliminarProducto(producto: Producto): void {
    if (!producto.id) return;
    if (!confirm(`¿Eliminar el producto "${producto.nombre}"?`)) return;

    this.mensajeError.set(null);
    this.productoService.eliminar(producto.id).subscribe({
      next: () => {
        this.productos.update((actuales) => actuales.filter((prod) => prod.id !== producto.id));
      },
      error: (err) => {
        this.mensajeError.set(
          err.status === 403
            ? 'No tienes permiso para eliminar productos.'
            : 'No se pudo eliminar el producto.',
        );
      },
    });
  }
}