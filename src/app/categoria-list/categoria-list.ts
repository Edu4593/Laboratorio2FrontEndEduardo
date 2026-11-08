import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Categoria } from '../interfaces/categoria';
import { ServicioAutenticacion } from '../services/auth';
import { CategoriaService } from '../services/categoria';

@Component({
  imports: [RouterLink],
  selector: 'app-categoria-list',
  templateUrl: './categoria-list.html',
})
export class CategoriaList implements OnInit {
  protected readonly authService = inject(ServicioAutenticacion);
  private readonly categoriaService = inject(CategoriaService);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly mensajeError = signal<string | null>(null);

  ngOnInit(): void {
    this.obtenerCategorias();
  }

  private obtenerCategorias(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);
    
    this.categoriaService.listar().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudieron cargar las categorías.');
        this.cargando.set(false);
      },
    });
  }

  protected eliminarCategoria(categoria: Categoria): void {
    if (!categoria.id) return;
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;

    this.mensajeError.set(null);
    
    this.categoriaService.eliminar(categoria.id).subscribe({
      next: () => {
        this.categorias.update((actuales) => actuales.filter((cat) => cat.id !== categoria.id));
      },
      error: (err) => {
        this.mensajeError.set(
          err.status === 403
            ? 'No tienes permiso para eliminar categorías.'
            : 'No se pudo eliminar. Verifica que no tenga productos asociados.',
        );
      },
    });
  }
}
