import { Component, inject, OnInit, signal } from '@angular/core';
import { Usuario } from '../interfaces/auth';
import { UsuarioService } from '../services/usuario';

@Component({
  selector: 'app-usuario-list',
  templateUrl: './usuario-list.html',
})
export class UsuarioList implements OnInit {
  private readonly usuarioService = inject(UsuarioService);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly mensajeError = signal<string | null>(null);

  ngOnInit(): void {
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: (err) => {
        this.mensajeError.set(
          err.status === 403
            ? 'No tienes permiso para ver los usuarios.'
            : 'No se pudieron cargar los usuarios.',
        );
        this.cargando.set(false);
      },
    });
  }
}
