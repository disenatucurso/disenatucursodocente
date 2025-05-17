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

  showAlert: boolean = false;
  alertMessage: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private router: Router,
    public initialSchemaService: InitialSchemaLoaderService
  ) {}

  ngOnInit(): void {
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
      this.alertMessage = 'Por favor, complete ambos campos.';
      this.showAlert = true;
      this.scrollToTop();
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
        console.log(response);
        this.activeModal.close('Password changed');
      } else {
        console.log('Ha ocurrido un error:', response.status);
        this.alertMessage = 'Error al cambiar la contraseña.';
        this.showAlert = true;
        this.scrollToTop();
      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      this.alertMessage = 'Error al cambiar la contraseña.';
      this.showAlert = true;
      this.scrollToTop();
    }
  }

  reject() {
    this.activeModal.dismiss('Cancelar');
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
