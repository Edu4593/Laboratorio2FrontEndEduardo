import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ServicioAutenticacion } from '../services/auth';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(ServicioAutenticacion);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly registrado = this.route.snapshot.queryParamMap.has('registrado');

  protected readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.form.enable();
    this.error.set(null);
    this.form.disable()
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/productos';
        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(
          error.status === 401 || error.status === 400
            ? 'Usuario o contraseña incorrectos.'
            : 'No se pudo conectar con el servidor. Intenta de nuevo.',
        );
      },
    });
  }
}
