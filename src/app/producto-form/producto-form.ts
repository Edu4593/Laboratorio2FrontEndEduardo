import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Categoria } from '../interfaces/categoria';
import { Producto } from '../interfaces/producto';
import { CategoriaService } from '../services/categoria';
import { ProductoService } from '../services/producto';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-producto-form',
  templateUrl: './producto-form.html',
})
export class ProductoForm implements OnInit {
  readonly id = input<string>();

  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly router = inject(Router);

  protected readonly esEdicion = computed(() => !!this.id());
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly guardando = signal(false);
  protected readonly mensajeError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoriaId: new FormControl<number | null>(null, Validators.required),
  });

  ngOnInit(): void {
    this.categoriaService.listar().subscribe({
      next: (categoriasObtenidas) => this.categorias.set(categoriasObtenidas),
      error: () => this.mensajeError.set('No se pudieron cargar las categorías.'),
    });

    const productoId = this.id();
    if (productoId) {
      this.productoService.obtener(Number(productoId)).subscribe({
        next: (producto) =>
          this.form.patchValue({
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: producto.precio,
            stock: producto.stock,
            categoriaId: producto.categoria?.id ?? null,
          }),
        error: () => this.mensajeError.set('No se pudo cargar el producto.'),
      });
    }
  }

  protected campoInvalido(campo: 'nombre' | 'precio' | 'stock' | 'categoriaId'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.mensajeError.set(null);

    const { categoriaId, ...resto } = this.form.getRawValue();
    const payload: Producto = { ...resto, categoria: { id: categoriaId as number } };

    const productoId = this.id();
    const peticion$ = productoId
      ? this.productoService.actualizar(Number(productoId), payload)
      : this.productoService.crear(payload);

    peticion$.subscribe({
      next: () => this.router.navigate(['/productos']),
      error: (err) => {
        this.guardando.set(false);
        this.mensajeError.set(
          err.status === 403
            ? 'No tienes permiso para realizar esta acción.'
            : 'No se pudo guardar el producto.',
        );
      },
    });
  }
}