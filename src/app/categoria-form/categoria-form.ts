import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoriaService } from '../services/categoria';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-categoria-form',
  templateUrl: './categoria-form.html',
})
export class CategoriaForm {
  readonly id = input<string>();

  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly categoriaService = inject(CategoriaService);
  private readonly router = inject(Router);

  protected readonly esEdicion = computed(() => !!this.id());
  protected readonly guardando = signal(false);
  protected readonly mensajeError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: [''],
  });

  ngOnInit(): void {
    const categoriaId = this.id();
    if (categoriaId) {
      this.categoriaService.obtener(Number(categoriaId)).subscribe({
        next: (categoria) => this.form.patchValue({ 
          nombre: categoria.nombre, 
          descripcion: categoria.descripcion 
        }),
        error: () => this.mensajeError.set('No se pudo cargar la categoría.'),
      });
    }
  }

  protected campoInvalido(campo: 'nombre'): boolean {
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

    const categoriaId = this.id();
    const payload = this.form.getRawValue();
    
    const request$ = categoriaId
      ? this.categoriaService.actualizar(Number(categoriaId), payload)
      : this.categoriaService.crear(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/categorias']),
      error: (err) => {
        this.guardando.set(false);
        this.mensajeError.set(
          err.status === 403
            ? 'No tienes permiso para realizar esta acción.'
            : 'No se pudo guardar la categoría.',
        );
      },
    });
  }
}

