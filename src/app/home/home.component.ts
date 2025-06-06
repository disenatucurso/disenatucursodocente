import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
imports: [
  NgbModule
]
const pdfMakeX = require('pdfmake/build/pdfmake.js');
const pdfFontsX = require('pdfmake-unicode/dist/pdfmake-unicode.js');
pdfMakeX.vfs = pdfFontsX.pdfMake.vfs;
import * as pdfMake from 'pdfmake/build/pdfmake';
import { __values } from 'tslib';
import { ExportpdfComponent } from '../exportpdf/exportpdf.component';
import { ModalComentariosComponent } from '../modal/comentarios/modal-comentarios.component';
import { ModalLoginComponent } from '../modal-login/modal-login.component';
import { ModalNombreComponent } from '../modal/modal-nombre/ModalNombre';
import { GrupoDatoFijo } from '../modelos/schema.model';
import { InformacionGuardada, SchemaSavedData, Version, Referencias, ReferenciasInternas } from '../modelos/schemaData.model';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
interface Server {
  name: string;
  url: string;
}

interface Variables {
  clave: string;
  valor: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})


export class HomeComponent {
  pdf: any;
  title = 'DisenaTuCursoDocente';
  nombreArchivo: string = '';
  autor: string = '';
  token: string = '';
  urlServidor: string = '';
  datosFijos: GrupoDatoFijo[] | undefined;
  servers: Server[] = [];
  variables: Variables[] = [];
  showAlert: boolean = false; // Variable para controlar la visibilidad del alert
  alertMessage: string = '';  // Variable para almacenar el mensaje de error


  constructor(
    private modalService: NgbModal,
    private router: Router,
    public initialSchemaService: InitialSchemaLoaderService
  ) {}

  async ngOnInit(): Promise<void> {
    //remuevo el mensaje de error que se carga por defecto, se muestra poniendole la clase .show
    let colTokenServidores = JSON.parse(sessionStorage.getItem('colTokenServidores') || '[]');
    console.log(colTokenServidores)

    const alert = document.querySelector('ngb-alert')
    if (alert)
      alert.classList.remove('show')
    //

    this.initialSchemaService.loadAllDataFile();
    console.log(this.initialSchemaService.allData)
    this.datosFijos = this.initialSchemaService.defaultSchema?.gruposDatosFijos;

    var headers = new Headers();
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
    this.VerificarExisteNombre()
  }

  // Método para manejar el evento de clic en el lápiz
  onEditAuthor() {
    console.log('Editar autor');
    this.ingresarNombreUsuario();
    // Lógica para editar el autor
  }

  cardClick(idCurso: any) {
    var cursos = this.initialSchemaService.allData;
    if (cursos)
      for (var i = 0; i < cursos.length; i++) {
        if (cursos[i].id == idCurso)
          this.initialSchemaService.loadedData = cursos[i];
        this.router.navigate(['/dashboard']);
      }
  }

  async subirPrimeraVez(idCurso: any, event: any) {
    event.stopPropagation();
    console.log(idCurso);

    const modalRef = this.modalService.open(ModalLoginComponent, {
      scrollable: false,
    });
    modalRef.componentInstance.inputDisclaimer = ['Email', 'Contraseña', 'Url del servidor'];

    /*modalRef.componentInstance.tittle = 'Iniciar sesión';
    modalRef.componentInstance.inputDisclaimer[0] = 'Email';
    modalRef.componentInstance.inputDisclaimer[1] = 'Contraseña';
    modalRef.componentInstance.inputDisclaimer[2] = 'Url del servidor';*/

    // Control Resolve with Observable
    modalRef.closed.subscribe({
      next: async (resp) => { // Añadimos async aquí
        if (resp) { // Comprobar que la respuesta no sea null
          const cursoJson = await this.obtenerCurso(idCurso);
          let stringCurso = JSON.stringify(cursoJson);
          //const cursoB64 = btoa(stringCurso); // Convertir el JSON a base64
          const cursoB64 = btoa(unescape(encodeURIComponent(stringCurso)));

          const requestBody = { base64: cursoB64 };
          const apiUrl = `${resp.urlServidorValue}/api/subirCurso`;

          try {
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': 'Bearer ' + resp.token,
              },
              body: JSON.stringify(requestBody),
            });

            if (response.ok) {
              // Si la solicitud fue exitosa, extraer el token de la respuesta
              const responseData = await response.json();
              const idCurso = responseData.idCurso;
              const base64 = responseData.base64;
              console.log('Curso subido exitosamente', idCurso);
              console.log('Nuevo base64', base64);
              // Convertir el base64 de la salida en JSON
              const binaryString = atob(base64);
              // Convertir la cadena binaria a una cadena UTF-8
              const utf8String = decodeURIComponent(escape(binaryString));
              const decodedCurso = JSON.parse(utf8String);

              this.alertMessage = 'Tu curso ha sido subido exitosamente al servidor.';
              this.showAlert = true;
              this.scrollToTop();
              this.modificarCurso(decodedCurso)
              // Recargar el componente

              this.router.navigate(['/']);
            } else {
              // Si la solicitud no fue exitosa, mostrar un mensaje de error
              console.log('Ha ocurrido un error:', response.status);
              const responseBody = await response.json();
              this.alertMessage = 'Error al subir el curso. El servidor dice: '+responseBody.message;
              this.showAlert = true;
              this.scrollToTop();
            }
          } catch (error) {
            // Manejar errores de la solicitud
            console.error('Error al realizar la solicitud:', error);

            this.alertMessage = 'Error al subir el curso. Intente luego o consulte al administrador del sistema.';
            this.showAlert = true;
            this.scrollToTop();
          }
        }
      },
      error: () => {
        // Nunca se llama acá
      },
    });
  }


  /*subirCambios(idCurso: any, event: any) {
    event.stopPropagation();
    console.log(idCurso);

    const modalRef = this.modalService.open(ModalLoginComponent, {
      scrollable: false,
    });

    modalRef.componentInstance.tittle = 'Iniciar sesión';
    modalRef.componentInstance.inputDisclaimer[0] = 'Email';
    modalRef.componentInstance.inputDisclaimer[1] = 'Contraseña';
    modalRef.componentInstance.inputDisclaimer[2] = 'Url del servidor';

    // Control Resolve with Observable
    modalRef.closed.subscribe({
      next: async (resp) => { // Añadimos async aquí
        const cursoJson = await this.obtenerCurso(idCurso);
        let stringCurso = JSON.stringify(cursoJson);
        const cursoB64 = btoa(unescape(encodeURIComponent(stringCurso)));

        const requestBody = { base64: cursoB64 };

        const apiUrl = `${resp.urlServidorValue}/api/subirCurso`;

        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Authorization': 'Bearer ' + resp.token,
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            // Si la solicitud fue exitosa, extraer el token de la respuesta
            const responseData = await response.json();
            const idCurso = responseData.idCurso;
            const base64 = responseData.base64;
            console.log('Curso subido exitosamente', idCurso);
            console.log('Nuevo base64', base64);

            // Convertir el base64 de la salida en JSON
            const binaryString = atob(base64);
            // Convertir la cadena binaria a una cadena UTF-8
            const utf8String = decodeURIComponent(escape(binaryString));
            const decodedCurso = JSON.parse(utf8String);


            this.alertMessage = 'Tu curso ha sido actualizado en el servidor.';
            this.showAlert = true;
            this.scrollToTop();
            this.modificarCurso(decodedCurso)

            // Recargar el componente
            this.router.navigate(['/']);
          } else {
            // Si la solicitud no fue exitosa, mostrar un mensaje de error
            console.log('Ha ocurrido un error:', response.status);
            this.alertMessage = 'Error al subir el curso. Intente luego o consulte al administrador del sistema.';
            this.showAlert = true;
            this.scrollToTop();
          }
        } catch (error) {
          // Manejar errores de la solicitud
          console.error('Error al realizar la solicitud:', error);
          this.alertMessage = 'Error al subir el curso. Intente luego o consulte al administrador del sistema.';
            this.showAlert = true;
            this.scrollToTop();
        }
      },
      error: () => {
        // Nunca se llama acá
      },
    });

  }*/

  cardReporte(event:any) {
    event.stopPropagation();

    const modalRef = this.modalService.open(ModalLoginComponent, {
      scrollable: false,
    });
    modalRef.componentInstance.tittle = 'Iniciar sesión';
    modalRef.componentInstance.inputDisclaimer[0] = 'Email';
    modalRef.componentInstance.inputDisclaimer[1] = 'Contraseña';
    modalRef.componentInstance.inputDisclaimer[2] = 'Url del servidor';

    //Control Resolve with Observable
    modalRef.closed.subscribe({
      next: (resp) => {
        this.token = resp.token
        // this.urlServidor = resp.urlServidorValue
        // this.router.navigate(['/cursosServidor'], { queryParams: { token: resp.token, servidor: resp.urlServidorValue } });
        if (this.token){
          this.router.navigate(['/reporte'], { queryParams: { token: resp.token, servidor: resp.urlServidorValue} });
        }else{
          const alert = document.querySelector('ngb-alert')
          if (alert)
            alert.classList.add('show')
          console.error("Error al autenticar");
        }

      },
      error: () => {
        //Nunca se llama aca
      },
    });

  }

  getInstitutionName(url: any): string {
    const server = this.servers.find(server => server.url === url);
    return server ? server.name : 'Institución no encontrada'; // Devuelve el nombre si se encuentra el servidor, o un mensaje de error si no se encuentra
  }

  editarNombre(curso: SchemaSavedData, event: any) {
    event.stopPropagation();
    console.log(curso)
    const modalRef = this.modalService.open(ModalComentariosComponent, {
      scrollable: false,
    });
    modalRef.componentInstance.tittle = 'Editar nombre del curso';
    modalRef.componentInstance.inputDisclaimer[0] = curso.nombreCurso;

    //Control Resolve with Observable
    modalRef.closed.subscribe({
      next: (resp) => {
        if (resp.length > 0) {
          console.log(resp);
          curso.nombreCurso = resp[0]
          const ver: Version | undefined = curso.versiones.at(-1);
          if (ver) {
            ver.fechaModificacion = new Date()
            ver.version = ver.version + 1
            curso.versiones.push(ver)
          }
          this.modificarCurso(curso)
        }
      },
      error: () => {
        //Nunca se llama aca
      },
    });
  }

  importarCurso(event: any) {
    this.VerificarExisteNombre()
    this.cargarArchivo(event)

  }

  ingresarNombreUsuario() {
    // MODAL PARA AGREGAR NOMBRE DEL USUARIO
    const modalRef = this.modalService.open(ModalNombreComponent, {
      scrollable: false,
      backdrop: 'static', // No permite cerrar el modal al hacer clic fuera
      keyboard: false // No permite cerrar el modal al presionar la tecla Esc
    });
    modalRef.componentInstance.tittle = 'Ingresar su nombre y apellido';
    modalRef.componentInstance.inputDisclaimer[0] = 'Ingrese aquí';


    //Control Resolve with Observable
    modalRef.closed.subscribe({
      next: async (resp) => { //
        if (resp.length > 0) {
          console.log(resp);
          this.autor = resp[0]

         // Buscar el objeto con clave "Nombre"
        let variableNombre = this.variables.find(v => v.clave === "Nombre");

        if (variableNombre) {
          // Si existe, actualizar el valor
          variableNombre.valor = this.autor;
        } else {
          // Si no existe, agregarlo al array
          this.variables.push({ clave: "Nombre", valor: this.autor });
        }

          let headers = new Headers();
          headers.append('Accept', 'application/json');
          headers.append('Content-Type', 'application/json; charset=utf-8');
          try {
            const response = await fetch(`http://localhost:` + this.initialSchemaService.puertoBackend + `/variables`, {
              method: 'PUT',
              headers: headers,
              mode: 'cors',
              body: JSON.stringify({
                variables: this.variables,
              }),
            });
            if (response.status === 200)
              console.log('Variables actualizadas exitosamente');
            else console.log('Ha ocurrido un error, ', response.status);

          }catch (e) {
            const alert = document.querySelector('ngb-alert')
            if (alert)
              alert.classList.add('show')
            console.error(e);
          }
        }
      },
      error: () => {
        //Nunca se llama aca
        console.log("Ha ocurrido un error al ingresar el nombre")
      },
    });
  }

  cargarArchivo(event: any) {
    let files = event.srcElement.files;
    let file: File;
    event = null;
    file = files[0];
    var reader = new FileReader();
    reader.onload = async () => {
      if (reader.result) var nuevoCurso = JSON.parse(reader.result.toString());

      let headers = new Headers();
      headers.append('Content-Type', 'application/json; charset=utf-8');
      try {
        const response = await fetch('http://localhost:' + this.initialSchemaService.puertoBackend + '/cursos', {
          method: 'POST',
          headers: headers,
          mode: 'cors',
          body: JSON.stringify({
            curso: nuevoCurso,
          }),
        });
        if (response.status === 201) {
          const idCreado = await response.json();
          console.log('Curso importado exitosamente');
          const ultimaVersionActual = structuredClone(nuevoCurso?.versiones.at(-1));
          if (ultimaVersionActual) {
            const nuevaVersion = {
              ...ultimaVersionActual,
              nombre: nuevoCurso?.versiones.at(-1).nombre,
              autor: this.autor,
              version: ultimaVersionActual.version + 1,
              fechaCreacion: new Date(),
              fechaModificacion: new Date()
            }
            nuevoCurso?.versiones.push(nuevaVersion)
            nuevoCurso.id = idCreado.id;

            //AGREGO PROPIEDADES DE NUEVA VERSION AL IMPORTAR CURSO
            //Propiedad Autor
            if (!Array.isArray(nuevoCurso.autores)) {
              nuevoCurso.autores = [];
            }
            const autor = {
              "username": null,
              "institucion": null,
              "nombre": this.autor
            };
            nuevoCurso.autores.push(autor);
            //Propiedad Referencias
            if (!nuevoCurso.referencias) {
              nuevoCurso.referencias = { internas: [], externas: [] };
            }
            //Propiedad Servidor Central
            if (!Array.isArray(nuevoCurso.servidorCentral)) {
              nuevoCurso.servidorCentral = [];
            }

            this.modificarCurso(nuevoCurso)
            this.initialSchemaService.allData?.push(nuevoCurso);
          }
        } else console.log('Ha ocurrido un error, ', response.status);
      } catch (e) {
        const alert = document.querySelector('ngb-alert')
        if (alert)
          alert.classList.add('show')
        console.error(e);
      }
    };
    reader.readAsText(file);
  }

  async VerificarExisteNombre(){

    let headers = new Headers();
    headers.append('Accept', 'application/json');
    try {
      const response = await fetch('http://localhost:' + this.initialSchemaService.puertoBackend + '/variables', {
        method: 'GET',
        headers: headers,
        mode: 'cors',
      });
      if (response.status === 200) {
        this.variables = await response.json();
        const variableNombre = this.variables.find(variable => variable.clave === 'Nombre');
        if (variableNombre && variableNombre.valor){
          this.autor = variableNombre.valor;
        }else{
          console.log('No hay nombre de usuario');
          //le pedimos el nombre de usuario por unica vez
          this.ingresarNombreUsuario();
        }
        console.log('Variables obtenidas exitosamente', this.variables);
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

  descargarArchivo() {
    let a = document.createElement('a');
    a.setAttribute(
      'href',
      'data:text/plain;charset=utf-u,' +
      encodeURIComponent(
        JSON.stringify(this.initialSchemaService.loadedData, null, 4)
      )
    );
    a.setAttribute('download', 'file.json');
    a.click();
  }

  initDatosGuardados(): any[] | undefined {
    let datosAInformacionGuardada: any[] = [];
    const datos = this.initialSchemaService.defaultSchema?.
      // .etapas[0].grupos
      etapas.map((etapa) => etapa.grupos)
      .flat()
      .map((grupo) => grupo.atributos)
      .flat()
      .map(atributo => {
        let atributoHerencia = structuredClone(
          this.initialSchemaService.defaultSchema?.
            etapas.map((etapaFilter) => etapaFilter.grupos)
            .flat()
            .map((grupoFilter) => grupoFilter.atributos)
            .flat()
            .find(atributoFilter =>
              atributoFilter.id === atributo?.herencia?.idAtributo &&
              atributoFilter.ubicacion.idEtapa === atributo.herencia?.idEtapa &&
              atributoFilter.ubicacion.idGrupo === atributo.herencia?.idGrupo)
        );
        let hayDatosHerencia = atributoHerencia !== undefined && atributoHerencia !== null;
        let datosHerencia: any = [];
        while (hayDatosHerencia) {
          console.log(atributoHerencia);
          datosHerencia = datosHerencia.concat(atributoHerencia?.filasDatos
            ?.flat()
            .map(fila => fila?.datos)
            .flat() || []); //deberia poner el || []??
          if (atributoHerencia?.herencia) {
            atributoHerencia = structuredClone(
              this.initialSchemaService.defaultSchema?.
                etapas.map((etapaFilter) => etapaFilter.grupos)
                .flat()
                .map((grupoFilter) => grupoFilter.atributos)
                .flat()
                .find(atributoFilter =>
                  atributoFilter.id === atributoHerencia?.herencia?.idAtributo &&
                  atributoFilter.ubicacion.idEtapa === atributoHerencia.herencia?.idEtapa &&
                  atributoFilter.ubicacion.idGrupo === atributoHerencia.herencia?.idGrupo)
            );
          } else hayDatosHerencia = false;
        }
        const datosParaInfoGuardada = (atributo.filasDatos
          ?.flat()
          .map((fd) => fd?.datos.filter(dato => dato.filasDatos !== null))
          .flat() || [])?.map(datoFilaNoNull => datoFilaNoNull.filasDatos)?.flat()
          ?.map(filaNoNull => filaNoNull.datos)?.flat()
          ?.map(datoFiltrado => {
            const idsDatosEnDato = datoFiltrado.idContenidoCondicional;
            let maximaCantidad = 0;
            this.initialSchemaService.defaultSchema?.contenidoCondicional
              .filter((contenidoCondicional) => idsDatosEnDato.includes(contenidoCondicional.id))
              .forEach((contenidoCondicional) => {
                const cantidadContenido = (contenidoCondicional.filasDatos?.map(fila => fila?.datos?.length))
                  ?.reduce((sumaParcial, cantDatos) => sumaParcial + cantDatos, 0) || 0;
                const contenidoCondicionalHerencia = this.initialSchemaService.defaultSchema?.contenidoCondicional
                  .find(contenidoCondicionalInterior => contenidoCondicionalInterior.id === contenidoCondicional.herencia);
                const cantidadContenidoHerencia = (contenidoCondicionalHerencia?.filasDatos?.map(fila => fila?.datos?.length))
                  ?.reduce((sumaParcial, cantDatos) => sumaParcial + cantDatos, 0) || 0;
                if ((cantidadContenido + cantidadContenidoHerencia) > maximaCantidad)
                  maximaCantidad = cantidadContenido + cantidadContenidoHerencia;
              })
            return new Object({
              ubicacionAtributo: { ...datoFiltrado.ubicacion, idDato: [0].concat(datoFiltrado.ubicacion.idDato || []).concat(datoFiltrado.id) },
              cantidadInstancias: 1,
              valoresAtributo: Array.from({ length: maximaCantidad + 1 }, (_, index) =>
                new Object({
                  idDato: index === 0 ? (datoFiltrado.ubicacion.idDato || []).concat(datoFiltrado.id) :
                    (datoFiltrado.ubicacion.idDato || []).concat(datoFiltrado.id, index),
                  valoresDato: [
                    {
                      string: null,
                      number: null,
                      selectFijo: null,
                      selectUsuario: null,
                      archivo: null,
                      date: null,
                    },
                  ],
                })
              )
            })
          })
        datosAInformacionGuardada = datosAInformacionGuardada.concat(datosParaInfoGuardada);
        return new Object({
          ubicacionAtributo: { ...atributo.ubicacion, idAtributo: atributo.id },
          cantidadInstancias: 1,
          valoresAtributo: (atributo.filasDatos
            ?.flat()
            .map((fd) => fd?.datos.filter(dato => dato.filasDatos === null))
            .flat() || [])
            .concat(datosHerencia || [])
            .map((dato) => new Object({
              idDato: [dato.id],
              valoresDato: [
                {
                  string: null,
                  number: null,
                  selectFijo: null,
                  selectUsuario: null,
                  archivo: null,
                  date: null,
                },
              ],
            })
            )
        })
      }).concat(datosAInformacionGuardada);
    return datos;
  }

  async crearCurso() {
    const datosGuardados: InformacionGuardada[] | undefined =
      this.initDatosGuardados();
    let curso: SchemaSavedData = {
      id: (this.initialSchemaService.allData?.length || 0) + 1,
      servidorCentral:[],
      autores: [],
      referencias: { 
        internas: [], 
        externas: [] 
      },
      nombreCurso: this.nombreArchivo,
      versiones: [
        {
          schemaVersion: 1,
          version: 0,
          datosGuardados,
          autor: this.autor, //tomar el autor del nombre
          fechaModificacion: new Date(),
          fechaCreacion: new Date(),
          nombre: 'Versión inicial'
        },
      ],
      archivos: []
    };

    //Propiedad Autor Offline
    const autor = {
      "username": null,
      "institucion": null,
      "nombre": this.autor
    };
    curso.autores!.push(autor);

    let headers = new Headers();
    headers.append('Content-Type', 'application/json; charset=utf-8');

    try {
      const response = await fetch('http://localhost:' + this.initialSchemaService.puertoBackend + '/cursos', {
        method: 'POST',
        headers: headers,
        mode: 'cors',
        body: JSON.stringify({
          curso,
        }),
      });
      if (response.status === 201) {
        console.log('Curso creado exitosamente');
        this.initialSchemaService.allData?.push(curso);
        this.initialSchemaService.loadedData = curso;
        this.router.navigate(['/dashboard']);
      } else console.log('Ha ocurrido un error, ', response.status);
    } catch (e) {
      const alert = document.querySelector('ngb-alert')
      if (alert)
        alert.classList.add('show')
      console.error(e);
    }
  }

  async obtenerCurso(id: number) {
    let headers = new Headers();
    headers.append('Accept', 'application/json');

    try {
      const response = await fetch(`http://localhost:`+this.initialSchemaService.puertoBackend+`/cursos/${id}`, {
            method: 'GET',
            headers: headers,
            mode: 'cors',
          });
      const curso = await response.json();
      if (response.status === 200){
        console.log('Curso obtenido exitosamente', curso);
        return curso
      }
      else console.log('Ha ocurrido un error, ', response.status);
    } catch (e) {
      const alert = document.querySelector('ngb-alert')
      if (alert)
        alert.classList.add('show')
      console.error(e);
    }
  }

  async modificarCurso(curso: SchemaSavedData) {
    // const curso = this.initialSchemaService.loadedData
    // busco version actualizada y la agrego como nueva cuando es el 1er cambio, falta definir esa logica
    // const nuevaVersion = curso?.versiones.at(-1);
    // if (nuevaVersion !== undefined) curso?.versiones?.push(nuevaVersion);
    let headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json; charset=utf-8');
    try {
      // no hay convencion sobre los nombres aun asi que paso id para que busque archivo curso_id
      const response = await fetch(`http://localhost:${this.initialSchemaService.puertoBackend}/cursos/${curso?.id}`, {
        method: 'PUT',
        headers: headers,
        mode: 'cors',
        body: JSON.stringify({
          curso: { ...curso, fechaModificacion: new Date() },
        }),
      });
      if (response.status === 200)
        console.log('Curso actualizado exitosamente');
      else console.log('Ha ocurrido un error, ', response.status);
    } catch (e) {
      const alert = document.querySelector('ngb-alert')
      if (alert)
        alert.classList.add('show')
      console.error(e);
    }
  }

  /*async listarCursos() {
    let headers = new Headers();
    headers.append('Accept', 'application/json');

    try {
      const response = await fetch('http://localhost:' + this.initialSchemaService.puertoBackend + '/cursos', {
        method: 'GET',
        headers: headers,
        mode: 'cors',
      });
      const cursos = await response.json();
      if (response.status === 200)
        console.log('Cursos obtenidos exitosamente', cursos);
      else console.log('Ha ocurrido un error, ', response.status);
    } catch (e) {
      const alert = document.querySelector('ngb-alert')
      if (alert)
        alert.classList.add('show')
      console.error(e);
    }
  }*/

  @HostListener("click", ["$event"])
  public onClick(event: any): void {
    event.stopPropagation();
    var target = event.target;
    if (!target.closest(".dropdown-menu") && !target.closest(".dropdown-toggle")) {
      // do whatever you want here
      let dropdown = document.querySelectorAll(".dropdown-menu")
      dropdown.forEach(div => {
        if (div.classList.contains("show"))
          div.classList.remove('show');

      });
    }

  }

  openModal() {
    // MODAL PARA AGREGAR COMENTARIOS
    this.VerificarExisteNombre()

    const modalRef = this.modalService.open(ModalComentariosComponent, {
      scrollable: false,
    });
    modalRef.componentInstance.tittle = 'Nuevo curso';
    modalRef.componentInstance.inputDisclaimer[0] = 'Nombre del curso';

    //Control Resolve with Observable
    modalRef.closed.subscribe({
      next: (resp) => {
        if (resp.length > 0) {
          console.log(resp);
          this.nombreArchivo = resp[0]
          this.crearCurso()
        }
      },
      error: () => {
        //Nunca se llama aca
      }
    });

  }

  openModalLogin() {
    const modalRef = this.modalService.open(ModalLoginComponent, {
      scrollable: false,
    });

    modalRef.componentInstance.tittle = 'Iniciar sesión';
    modalRef.componentInstance.inputDisclaimer = ['Email', 'Contraseña', 'Url del servidor'];

    modalRef.closed.subscribe({
      next: (resp) => {
        if (resp) { // Comprobar que la respuesta no sea null
          this.token = resp.token;
          this.urlServidor = resp.urlServidorValue;

          // Verifica que el token y la URL del servidor sean válidos antes de redirigir
          if (this.token && this.urlServidor) {
            this.router.navigate(['/cursosServidor'], {
              queryParams: {
                token: this.token,
                servidor: this.urlServidor,
                autor: this.autor
              }
            });
          } else {
            console.error('Token o URL del servidor no válidos:', this.token, this.urlServidor);
          }
        } else {
          console.error('La respuesta del modal fue nula.');
        }
      },
      error: (err) => {
        console.error('Error al cerrar el modal:', err);
      },
    });
}

  muestroHeader() {
    let vuelta = this.initialSchemaService.loadedData !== undefined;
    console.log("muestroHeader: " + vuelta);
    return vuelta;
  }

  muestroMisCursos() {
    let vuelta = this.initialSchemaService.allData === undefined && this.initialSchemaService.loadedData !== undefined;
    console.log("muestroMisCursos: " + vuelta);
    return vuelta;
  }

  muestroCursosCompartidosConmigo() {
    let vuelta = this.initialSchemaService.allData && !this.initialSchemaService.loadedData;
    console.log("muestroCursosCompartidosConmigo: " + vuelta);
    return vuelta;
  }

  muestroNoExistenCursos() {
    let vuelta = !this.initialSchemaService.allData;
    console.log("muestroNoExistenCursos: " + vuelta);
    return vuelta;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
