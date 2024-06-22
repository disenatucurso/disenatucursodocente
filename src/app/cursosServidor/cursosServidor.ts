import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { SchemaSavedData } from '../modelos/schemaData.model';

@Component({
  selector: 'app-cursosServidor',
  templateUrl: './cursosServidor.html',
  styleUrls: ['./cursosServidor.css'],
})
export class cursosServidorComponent {
  title = 'DisenaTuCursoDocente';
  token: string = '';
  servidor: string = '';
  urlServidor: string = '';
  cursosBuscados: any[] = [];
  termino: string = '';
  autor: string = '';
  showAlert: boolean = false; // Variable para controlar la visibilidad del alert

  constructor(private modalService: NgbModal, private router: Router,
              public initialSchemaService: InitialSchemaLoaderService,
              private route: ActivatedRoute) {}

  ngOnInit(): void {
    //remuevo el mensaje de error que se carga por defecto, se muestra poniendole la clase .show
    const alert = document.querySelector('ngb-alert')
    if (alert)
      alert.classList.remove('show')

    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.urlServidor = params['servidor'];
      this.autor = params['autor'];
      console.log('Token:', this.token);
      console.log('URL del servidor:', this.urlServidor);
    });

    this.getNombre(this.urlServidor);

  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.buscarCurso(this.termino);
  }

  async buscarCurso(termino: string) {
    let apiUrl = `${this.urlServidor}/api/listarCursos`;
    if(termino != ""){
      console.log('Buscando curso con término:', termino);
      apiUrl+=`?criterio=${encodeURIComponent(termino)}`
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
        console.log(this.cursosBuscados);
      } else {
        console.log('Ha ocurrido un error:', response.status);
        alert('Error en la búsqueda. Intente luego o consulte al administrador del sistema.');
        this.showAlert = true;
      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      alert('Error al descargar el curso. Intente luego o consulte al administrador del sistema.');
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
        const cursoB64 = await response.json();

        if (this.isBase64(cursoB64)) {
          // Convertir el base64 de la salida en JSON
          const binaryString = atob(cursoB64);
          // Convertir la cadena binaria a una cadena UTF-8
          const utf8String = decodeURIComponent(escape(binaryString));
          const cursoJson = JSON.parse(utf8String);
          console.log(cursoJson);
          this.descargarCurso(cursoJson);
        } else {
          console.error('La respuesta no es una cadena base64 válida');
          alert('Error al descargar el curso. Intente luego o consulte al administrador del sistema.');
          this.showAlert = true;
        }
      } else {
        console.log('Ha ocurrido un error:', response.status);
        alert('Error en la búsqueda. Intente luego o consulte al administrador del sistema.');
        this.showAlert = true;
      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      alert('Error en la búsqueda. Intente luego o consulte al administrador del sistema.');
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
        var respuesta =  await response.json();
        this.servidor = respuesta.nombre;
      } else {
        console.log('Ha ocurrido un error:', response.status);
        alert('Error en la búsqueda. Intente luego o consulte al administrador del sistema.');
        this.showAlert = true;
      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      alert('Error en la búsqueda. Intente luego o consulte al administrador del sistema.');
      this.showAlert = true;
    }
  }

  goHome() {
    this.router.navigate(['/']);
  }

  async descargarCurso(curso: SchemaSavedData) {
    // Encontrar el id mayor en el array allData
    const maxId = this.initialSchemaService.allData?.reduce((max, item) => item.id > max ? item.id : max, 0) || 0;
    console.log(maxId);
    curso.id = maxId + 1;
    const ultimaVersionActual = structuredClone(curso?.versiones.at(-1));

    if (ultimaVersionActual) {
      const nuevaVersion = {
        ...ultimaVersionActual,
        nombre: ultimaVersionActual.nombre || 'Nombre predeterminado', // Proporciona un valor predeterminado
        autor: this.autor,
        version: (ultimaVersionActual.version ?? 0) + 1,
        fechaCreacion: new Date(),
        fechaModificacion: new Date(),
        schemaVersion: ultimaVersionActual.schemaVersion ?? 1, // Proporciona un valor predeterminado para schemaVersion si es necesario
        datosGuardados: ultimaVersionActual.datosGuardados || [] // Proporciona un valor predeterminado para datosGuardados si es necesario
      };

      curso?.versiones.push(nuevaVersion);
      delete curso.idGlobal; // Eliminar la propiedad idGlobal
      delete curso.institucion; // Eliminar la propiedad institucion
      delete curso.versionGlobal; // Eliminar la propiedad versionGlobal

      if (!Array.isArray(curso.autores)) {
        curso.autores = [];
      }

      const autor = {
        "username": null,
        "institucion": null,
        "nombre": this.autor
      };

      curso.autores.push(autor);

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
          alert("Curso descargado exitosamente. Podrás verlo en el Inicio.")
          this.goHome();
        } else {
          console.log('Ha ocurrido un error, ', response.status);
          alert('Error al descargar el curso. Intente nuevamente.');
          this.showAlert = true;
        }
      } catch (e) {
        const alert = document.querySelector('ngb-alert');
        if (alert)
          alert.classList.add('show');
        console.error(e);
      }
    } else {
      console.error('No se encontró la última versión del curso.');
      alert('No se encontró la última versión del curso. Intente nuevamente.');
      this.showAlert = true;
    }
  }

  private isBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  }
}
