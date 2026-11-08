import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ROLES_REGISTRO } from '../interfaces/auth';
import { ServicioAutenticacion } from '../services/auth';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-registro',
  templateUrl: './registro.html',
})
export class Registro {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly servicioAutenticacion = inject(ServicioAutenticacion);
  private readonly router = inject(Router);

  protected readonly roles = ROLES_REGISTRO;
  protected readonly guardando = signal(false);
  protected readonly mensajeError = signal<string | null>(null);

  
  protected readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['', [Validators.required]],
  });

  
  protected campoInvalido(campo: 'username' | 'password' | 'role'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  protected registrarUsuario(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.mensajeError.set(null);
    this.form.disable(); 

    const { username, password, role } = this.form.getRawValue();

    this.servicioAutenticacion.registrarCuenta({ username, password, role }).subscribe({
      next: () => {
        // Al login con un aviso de éxito
        this.router.navigate(['/login'], { queryParams: { registrado: 1 } });
      },
      error: (err) => {
        this.guardando.set(false);
        this.form.enable(); // Volvemos a habilitar si hay error
        
        this.mensajeError.set(
          err.status === 409 || err.status === 400
            ? 'El nombre de usuario ya está en uso.'
            : 'No se pudo registrar el usuario. Intenta de nuevo.',
        );
      },
    });
  }
}