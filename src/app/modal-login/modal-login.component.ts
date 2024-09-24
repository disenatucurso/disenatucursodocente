import { Component, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
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

  // Definir propiedades para usuario y contraseña
  usuario: string = '';
  password: string = '';

  urlServidor: string = '';
  urlServidorInvalid: boolean = false;


  constructor(
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private router: Router,
    public initialSchemaService: InitialSchemaLoaderService,
  ) {}

  togglePassword() {
    const pwdInput = document.querySelector('.pwd') as HTMLInputElement;
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
    } else {
      pwdInput.type = 'password';
    }
  }

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
    const userValue = this.usuario;
    const passwordValue = this.password;
    const urlServidorValue = this.urlServidor;

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
        this.salida.push(token);
        let servidorToken = {};
        servidorToken[urlServidorValue] = token;

        // Añadir el nuevo objeto al array
        let colTokenServidores = JSON.parse(sessionStorage.getItem('colTokenServidores') || '[]');
        colTokenServidores.push(servidorToken);

        sessionStorage.setItem('colTokenServidores', JSON.stringify(colTokenServidores));

        // this.globalDataService.setColTokenServidores([servidorToken]); // Actualiza colTokenServidores en el servicio
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


  async cargarServidorEnInput(event: any ,url: string): Promise<void> {
    this.urlServidor = url;
    const colTokenServidores = JSON.parse(sessionStorage.getItem('colTokenServidores') || '[]'); // json

    // Buscar el token asociado a la URL en colTokenServidores
    const tokenEntry = colTokenServidores.find(entry => Object.keys(entry)[0] === url);

    if (tokenEntry) {
      const token = tokenEntry[url]; // Obtener el token para la URL
      console.log(`Token encontrado para el servidor ${url}: ${token}`);

      const apiUrl = url + '/api/validarToken';

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          console.log('El servidor dice que es un token valido', response.status);
          //token valido
          this.activeModal.close({ token: token, urlServidorValue: url, username: '' });
        } else {
          console.log('Ha ocurrido un error:', response.status);
          // Eliminar el token del array
          const index = colTokenServidores.findIndex(entry => Object.keys(entry)[0] === url);
          if (index !== -1) {
              colTokenServidores.splice(index, 1); // Eliminar el token
              sessionStorage.setItem('colTokenServidores', JSON.stringify(colTokenServidores)); // Actualizar sessionStorage
              console.log('Token eliminado de colTokenServidores');
          }
        }
      } catch (e) {
        console.error(e);
      }


    } else {
      console.log(`El servidor ${url} no está registrado en colTokenServidores.`);
    }
  }

  async olvidoContrasenia(): Promise<void> {
    const userValue = this.usuario;
    const urlServidorValue = this.urlServidor;

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
        const respuesta =  await response.json();
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
