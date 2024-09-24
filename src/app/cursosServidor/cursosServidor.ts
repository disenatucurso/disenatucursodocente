import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { SchemaSavedData } from '../modelos/schemaData.model';

@Component({
  selector: 'app-cursosServidor',
  templateUrl: './cursosServidor.html',
  styleUrls: ['./cursosServidor.css'],
})
export class cursosServidorComponent {
  busquedaEmptyVisible: boolean = false;
  title = 'DisenaTuCursoDocente';
  token: string = '';
  servidor: string = '';
  urlServidor: string = '';
  cursosBuscados: any[] = [];
  termino: string = '';
  autor: string = '';
  showAlert: boolean = false; // Variable para controlar la visibilidad del alert
  alertMessage: string = '';  // Variable para almacenar el mensaje de error

  constructor( private router: Router,
              public initialSchemaService: InitialSchemaLoaderService,
              private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.urlServidor = params['servidor'];
      this.autor = params['autor'];

      if (!this.token || !this.urlServidor) {
        console.error('Faltan parámetros necesarios para el componente.');
        // Podrías redirigir o mostrar un mensaje de error aquí
      } else {
        console.log('Token:', this.token);
        console.log('URL del servidor:', this.urlServidor);
        this.getNombre(this.urlServidor);
      }
    });
  }


  onSubmit(event: Event) {
    event.preventDefault();
    this.buscarCurso(this.termino);
  }

  async buscarCurso(termino: string) {
    let apiUrl = `${this.urlServidor}/api/listarCursos`;
    if (termino != "") {
      console.log('Buscando curso con término:', termino);
      apiUrl += `?criterio=${encodeURIComponent(termino)}`
    }

    console.log(apiUrl);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${this.token}`,
        }
      });

      if (response.ok) {
        this.cursosBuscados = await response.json();
        this.busquedaEmptyVisible = this.cursosBuscados.length === 0;
        console.log(this.cursosBuscados);
      } else {
        console.log('Ha ocurrido un error:', response.status);
        this.alertMessage = 'Error en la búsqueda. Intente luego o consulte al administrador del sistema.';
        this.showAlert = true;
      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      this.alertMessage = 'Error al descargar el curso. Intente luego o consulte al administrador del sistema.';
      this.showAlert = true;
    }
  }

  async cardClick(idCurso: any) {
    console.log('Buscando curso:', idCurso);
    const apiUrl = `${this.urlServidor}/api/bajarCurso?idCurso=${encodeURIComponent(idCurso)}`;

    console.log(apiUrl);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${this.token}`,
        }
      });

      if (response.ok) {
        const respuestaSRV = await response.json();
        const binaryString = atob(respuestaSRV.base64);
        const utf8String = decodeURIComponent(escape(binaryString));
        const cursoJson = JSON.parse(utf8String);
        console.log(cursoJson);
        this.descargarCurso(cursoJson);
      } else {
        console.log('Ha ocurrido un error:', response.status);
        this.alertMessage = 'Error en la búsqueda. Intente luego o consulte al administrador del sistema.';
        this.showAlert = true;
      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      this.alertMessage = 'Error en la búsqueda. Intente luego o consulte al administrador del sistema.';
      this.showAlert = true;
    }
  }

  async getNombre(urlServidor: string) {
    const apiUrl = `${urlServidor}/api/institucion`;

    console.log(apiUrl);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      });

      if (response.ok) {
        var respuesta = await response.json();
        this.servidor = respuesta.nombre;
      } else {
        console.log('Ha ocurrido un error:', response.status);
        this.alertMessage = 'Error en la búsqueda. Intente luego o consulte al administrador del sistema.';
        this.showAlert = true;
      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      this.alertMessage = 'Error en la búsqueda. Intente luego o consulte al administrador del sistema.';
      this.showAlert = true;
    }
  }

  goHome() {
    this.router.navigate(['/home']); // Asegúrate de que redirige a la ruta correcta
  }

  async descargarCurso(curso: SchemaSavedData) {
    const maxId = this.initialSchemaService.allData?.reduce((max, item) => item.id > max ? item.id : max, 0) || 0;
    console.log(maxId);
    curso.id = maxId + 1;
    const ultimaVersionActual = structuredClone(curso?.versiones.at(-1));

    if (ultimaVersionActual) {
      const nuevaVersion = {
        ...ultimaVersionActual,
        nombre: ultimaVersionActual.nombre || 'Nombre predeterminado',
        autor: this.autor,
        version: (ultimaVersionActual.version ?? 0) + 1,
        fechaCreacion: new Date(),
        fechaModificacion: new Date(),
        schemaVersion: ultimaVersionActual.schemaVersion ?? 1,
        datosGuardados: ultimaVersionActual.datosGuardados || []
      };
      curso?.versiones.push(nuevaVersion);

      //Agrego Autor offline de quien está bajando
      const autor = {
        "username": null,
        "institucion": null,
        "nombre": this.autor
      };
      curso.autores!.push(autor);

      let headers = new Headers();
      headers.append('Accept', 'application/json');
      headers.append('Content-Type', 'application/json; charset=utf-8');
      try {
        const response = await fetch(`http://localhost:${this.initialSchemaService.puertoBackend}/cursos/${curso?.id}`, {
          method: 'PUT',
          headers: headers,
          mode: 'cors',
          body: JSON.stringify({
            curso: { ...curso, fechaModificacion: new Date() },
          }),
        });
        if (response.status === 200) {
          this.initialSchemaService.allData?.push(curso);
          console.log('Curso descargado exitosamente');
          this.alertMessage = "Curso descargado exitosamente. Podrás verlo en el Inicio.";
          this.showAlert = true;
          this.goHome();
        } else {
          console.log('Ha ocurrido un error, ', response.status);
          this.alertMessage = 'Error al descargar el curso. Intente nuevamente.';
          this.showAlert = true;
        }
      } catch (e) {
        console.error(e);
        this.alertMessage = 'Error al descargar el curso. Intente nuevamente.';
        this.showAlert = true;
      }
    } else {
      console.error('No se encontró la última versión del curso.');
      this.alertMessage = 'No se encontró la última versión del curso. Intente nuevamente.';
      this.showAlert = true;
    }
  }
}
