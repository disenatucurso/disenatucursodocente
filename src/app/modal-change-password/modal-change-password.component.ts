import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';

@Component({
  selector: 'app-modal-change-password',
  templateUrl: './modal-change-password.component.html',
  styleUrls: ['./modal-change-password.component.css'],
})
export class ModalChangePasswordComponent implements OnInit {
  @Input() title: string = 'Cambiar Contraseña';
  @Input() body: string = '';

  @Input() urlServidor: string = '';  // Recibe la URL del servidor
  @Input() token: string = '';        // Recibe el token de autenticación

  currentPassword: string = '';
  newPassword: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private router: Router,
    public initialSchemaService: InitialSchemaLoaderService
  ) {}

  ngOnInit(): void {
    // Lógica si es necesario cargar algo al inicio
    if (!this.urlServidor || !this.token) {
      console.error('No se ha recibido la URL del servidor o el token.');
    }
  }

  togglePassword(inputFieldId: string) {
    const pwdInput = document.querySelector(`#${inputFieldId}`) as HTMLInputElement;
    pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
  }

  async changePassword(): Promise<void> {
    if (!this.currentPassword || !this.newPassword) {
      alert('Por favor, complete ambos campos.');
      return;
    }

    const requestBody = {
      oldPass: this.currentPassword,
      newPass: this.newPassword
    };

    const apiUrl = `${this.urlServidor}/api/cambiarPass`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        console.log(response)
        this.activeModal.close('Password changed');
      } else {
        console.log('Ha ocurrido un error:', response.status);
        alert('Error al cambiar la contraseña.');
      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      alert('Error al cambiar la contraseña.');
    }
  }

  reject() {
    this.activeModal.dismiss('Cancelar');
  }
}
