import { Component, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal,NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';

interface Server {
  name: string;
  url: string;
}

@Component({
  selector: 'app-modal-login',
  templateUrl: './modal-login.component.html',
  styleUrls: ['./modal-login.component.css'],
})
export class ModalLoginComponent implements OnInit {
  @Input() tittle: string = '';
  @Input() body: string = '';
  @Input() inputDisclaimer: string[] = [];
  @Output() salida: string[] = [];
  servers: Server[] = [];

  constructor(
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private router: Router,
    public initialSchemaService: InitialSchemaLoaderService
  ) {}

  togglePassword() {
    const pwdInput = document.querySelector('.pwd') as HTMLInputElement;
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
    } else {
      pwdInput.type = 'password';
    }
  }

  urlServidor: string = '';
  urlServidorInvalid: boolean = false;

  async ngOnInit(): Promise<void> {
    let headers = new Headers();
    headers.append('Accept', 'application/json');

    try {
      const response = await fetch('http://localhost:' + this.initialSchemaService.puertoBackend + '/servers', {
        method: 'GET',
        headers: headers,
        mode: 'cors',
      });
      if (response.status === 200) {
        this.servers = await response.json();
        console.log('Servidores obtenidos exitosamente', this.servers);
      } else {
        console.log('Ha ocurrido un error, ', response.status);
      }
    } catch (e) {
      const alert = document.querySelector('ngb-alert');
      if (alert)
        alert.classList.add('show');
      console.error(e);
    }
  }

  async resolve(): Promise<void> {
    const userValue = (document.querySelector("#user") as HTMLInputElement)?.value;
    const passwordValue = (document.querySelector("#password") as HTMLInputElement)?.value;
    const urlServidorValue = (document.querySelector("#urlServidor") as HTMLInputElement)?.value;

    if (!userValue || !passwordValue || !urlServidorValue) {
      alert("Por favor, complete todos los campos.");
      return;
    } else {
      this.salida.push(userValue);
      this.salida.push(passwordValue);
      this.salida.push(urlServidorValue);
    }

    const serverExists = this.servers.some(server => server.url === urlServidorValue);

    if (!serverExists) {
      const serverName = await this.getNombre(urlServidorValue);
      if (serverName) {
        this.servers.push({ name: serverName, url: urlServidorValue });

        let headers = new Headers();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/json');
        try {
          const response = await fetch(`http://localhost:` + this.initialSchemaService.puertoBackend + `/servers`, {
            method: 'PUT',
            headers: headers,
            mode: 'cors',
            body: JSON.stringify({
              servers: this.servers,
            }),
          });
          if (response.status === 200)
            console.log('Servidores actualizados exitosamente');
          else console.log('Ha ocurrido un error, ', response.status);
        } catch (e) {
          console.error(e);
        }
      }
    }

    const requestBody = { username: userValue, password: passwordValue };
    const apiUrl = urlServidorValue + '/api/login';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const responseData = await response.json();
        const token = responseData.token;
        console.log('Login exitoso', token);
        this.activeModal.close({ token: token, urlServidorValue: urlServidorValue, username: userValue });
      } else {
        console.log('Ha ocurrido un error:', response.status);
        alert("Error al iniciar sesión.");
      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      alert("Error al iniciar sesión.");
    }
  }

  cargarServidorEnInput(url: string): void {
    const inputServidor = document.querySelector("#urlServidor") as HTMLInputElement;
    if (inputServidor) {
      inputServidor.value = url;
    }
  }

  async olvidoContrasenia(): Promise<void> {
    const userValue = (document.querySelector("#user") as HTMLInputElement)?.value;
    const urlServidorValue = (document.querySelector("#urlServidor") as HTMLInputElement)?.value;

    if (!userValue || !urlServidorValue) {
      alert("Por favor, ingrese su usuario y la URL del servidor.");
      return;
    } else {
      this.salida.push(userValue);
      this.salida.push(urlServidorValue);
    }

    const serverExists = this.servers.some(server => server.url === urlServidorValue);

    if (!serverExists) {
      const serverName = prompt("Ingrese el nombre del servidor:", "Servidor");
      if (serverName) {
        this.servers.push({ name: serverName, url: urlServidorValue });

        let headers = new Headers();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/json');
        try {
          const response = await fetch(`http://localhost:` + this.initialSchemaService.puertoBackend + `/servers`, {
            method: 'PUT',
            headers: headers,
            mode: 'cors',
            body: JSON.stringify({
              servers: this.servers,
            }),
          });
          if (response.status === 200)
            console.log('Servidores actualizados exitosamente');
          else console.log('Ha ocurrido un error, ', response.status);
        } catch (e) {
          console.error(e);
        }
      }
    }

    const requestBody = { username: userValue };
    const apiUrl = urlServidorValue + '/api/forgotPass';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        //const responseData = await response.json();
        //const token = responseData.token;
        console.log('Contraseña recuperada');
        this.activeModal.close({ token: "CUIDADO NULL", urlServidorValue: urlServidorValue });
      } else {
        console.log('Ha ocurrido un error:', response.status);
        alert("Error al recuperar la contraseña.");
      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      alert("Error al recuperar la contraseña.");
    }
  }

  async getNombre(urlServidor: string) {
    const apiUrl = `${urlServidor}/api/institucion`;

    console.log(apiUrl);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        var respuesta =  await response.json();
        return respuesta.nombre;
      } else {
        console.log('Ha ocurrido un error:', response.status);
        alert('Error en la búsqueda. Intente luego o consulte al administrador del sistema.');

      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      alert('Error en la búsqueda. Intente luego o consulte al administrador del sistema.');

    }
  }

  reject() {
    this.activeModal.dismiss('Cancelar');
  }
}
