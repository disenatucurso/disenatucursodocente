import { Component, Input, OnInit, Output, ViewChild, TemplateRef } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';

interface Server {
  name: string;
  url: string;
  isValid?: boolean;
}
// Definimos una interfaz para el objeto de token de servidor
interface ServerToken {
  [url: string]: string;
}

@Component({
  selector: 'app-modal-login',
  templateUrl: './modal-login.component.html',
  styleUrls: ['./modal-login.component.css'],
})
export class ModalLoginComponent implements OnInit {
  @Input() tittle: string = '';
  @ViewChild('loginFormModal') loginFormModal!: TemplateRef<any>;
  @ViewChild('errorModal') errorModal!: TemplateRef<any>;

  servers: Server[] = [];
  showAddServerForm: boolean = false;
  newServerUrl: string = '';
  selectedServer: Server | null = null;

  usuario: string = '';
  password: string = '';
  showPassword: boolean = false;

  constructor(
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private router: Router,
    public initialSchemaService: InitialSchemaLoaderService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch('http://localhost:' + this.initialSchemaService.puertoBackend + '/servers');
      if (response.ok) {
        this.servers = await response.json();
        for(let server of this.servers){
          let tokenAlmacenado=this.getServerToken(server.url);
          if(tokenAlmacenado!== null){
            let tokenValido = await this.validarJWTToken(tokenAlmacenado,server.url);
            if(tokenValido){
              server.isValid=true;
            }
            else{
              this.removeServerToken(server.url);
            }
          }
        }
        console.log(this.servers);
        console.log('Servidores obtenidos exitosamente', this.servers);
      } else {
        console.log('Ha ocurrido un error, ', response.status);
      }
    } catch (e) {
      console.error(e);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async addNewServer() {
    if (this.newServerUrl) {
      let newServerName = await this.callServerForName(this.newServerUrl);
      if(newServerName!==null){
        const existingServer = this.servers.find(server => server.url === this.newServerUrl);
        if(!existingServer){
          const newServer: Server = {
            name: newServerName,
            url: this.newServerUrl,
            isValid: false
          };        
          const serversCopy = JSON.parse(JSON.stringify(this.servers));
          serversCopy.push(newServer);

          try {
            const response = await fetch(`http://localhost:${this.initialSchemaService.puertoBackend}/servers`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ servers: serversCopy }),
            });
            
            if (response.ok) {
              console.log('Servidor agregado exitosamente');
              this.showAddServerForm = false;
              this.newServerUrl = '';
              this.servers.push(newServer);
            } else {
              console.log('Ha ocurrido un error al agregar el servidorr', response.status);
              this.modalService.open(this.errorModal);
            }
          } catch (e) {
            this.modalService.open(this.errorModal);
            console.error(e);
          }
        }
      }
      else{
        this.modalService.open(this.errorModal);
      }
    }
  }

  loginToServer(server: Server) {
    this.selectedServer = server;
    this.modalService.open(this.loginFormModal);
  }
  accessToServer(server:Server){
    this.selectedServer = server;
    this.resolverModalOK();
  }

  resolverModalOK(){
    let token =  this.getServerToken(this.selectedServer!.url)
    this.activeModal.close({ token: token, urlServidorValue: this.selectedServer!.url, username: '' });
  }

  async loginToSelectedServer() {
    if (!this.selectedServer) return;

    const requestBody = { username: this.usuario, password: this.password };
    const apiUrl = this.selectedServer.url + '/api/login';

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
        //url: string, token: string
        this.addServerToken(this.selectedServer.url,token);
        /*let colTokenServidores = JSON.parse(sessionStorage.getItem('colTokenServidores') || '[]');
        colTokenServidores.push({ [this.selectedServer.url]: token });
        sessionStorage.setItem('colTokenServidores', JSON.stringify(colTokenServidores));*/

        this.selectedServer.isValid = true;
        this.modalService.dismissAll();
        console.log('Login exitoso', token);
        this.resolverModalOK();
      } else {
        console.log('Ha ocurrido un error:', response.status);
        alert("Error al iniciar sesión.");
      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      alert("Error al iniciar sesión.");
    }
  }

  async olvidoContrasenia() {
    if (!this.selectedServer || !this.usuario) {
      alert("Por favor, ingrese su usuario.");
      return;
    }

    const requestBody = { username: this.usuario };
    const apiUrl = this.selectedServer.url + '/api/forgotPass';

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
        alert("Se ha enviado un correo con instrucciones para recuperar su contraseña.");
      } else {
        console.log('Ha ocurrido un error:', response.status);
        alert("Error al recuperar la contraseña.");
      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      alert("Error al recuperar la contraseña.");
    }
  }

  resolve() {
    console.log("resolve generico");
    /*if (this.selectedServer) {
      this.activeModal.close({ urlServidorValue: this.selectedServer.url });
    }*/
  }

  reject() {
    this.activeModal.dismiss('Cancelar');
  }


  //FUNCIONES SESSION STORAGE
  // Función para obtener todos los tokens de servidores almacenados
  getServerTokens(): ServerToken[] {
    const tokens = sessionStorage.getItem('colTokenServidores');
    return tokens ? JSON.parse(tokens) : [];
  }

  // Función para agregar un nuevo token de servidor
  addServerToken(url: string, token: string): void {
    const serverTokens = this.getServerTokens();
    serverTokens.push({ [url]: token });
    sessionStorage.setItem('colTokenServidores', JSON.stringify(serverTokens));
  }

  // Función para actualizar un token de servidor existente
  /*updateServerToken(url: string, newToken: string): void {
    const serverTokens = this.getServerTokens();
    const index = serverTokens.findIndex(token => Object.keys(token)[0] === url);
    if (index !== -1) {
      serverTokens[index] = { [url]: newToken };
      sessionStorage.setItem('colTokenServidores', JSON.stringify(serverTokens));
    } else {
      console.warn(`No se encontró un token para la URL: ${url}`);
    }
  }*/

  // Función para remover un token de servidor
  removeServerToken(url: string): void {
    const serverTokens = this.getServerTokens();
    const filteredTokens = serverTokens.filter(token => Object.keys(token)[0] !== url);
    sessionStorage.setItem('colTokenServidores', JSON.stringify(filteredTokens));
  }

  // Función para obtener el token de un servidor específico
  getServerToken(url: string): string | null {
    const serverTokens = this.getServerTokens();
    const serverToken = serverTokens.find(token => Object.keys(token)[0] === url);
    return serverToken ? Object.values(serverToken)[0] : null;
  }

  async validarJWTToken(token:string,url:string):Promise<boolean>{
    const apiUrl = url + '/api/validarToken';
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
    return true;
  }

  async callServerForName(urlServidor: string):Promise<string|null> {
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
        return null;
        //alert('Error en la búsqueda. Intente luego o consulte al administrador del sistema.');
      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      return null;
      //alert('Error en la búsqueda. Intente luego o consulte al administrador del sistema.');
    }
  }
}