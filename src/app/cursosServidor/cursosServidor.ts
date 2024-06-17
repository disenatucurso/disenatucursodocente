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
    console.log('Buscando curso con término:', termino);
    const apiUrl = `${this.urlServidor}/api/listarCursos?criterio=${encodeURIComponent(termino)}`;

    console.log(apiUrl);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
      alert('Error en la búsqueda. Intente luego o consulte al administrador del sistema.');
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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        }
      });

      if (response.ok) {
        const cursoB64 = await response.json();
        const cursoJson = JSON.parse(atob(cursoB64.base64));
        console.log(cursoJson);
        this.descargarCurso(cursoJson);

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
          'Content-Type': 'application/json'
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
    curso.id = (this.initialSchemaService.allData?.length || 0) + 1;
    let headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    try {
      const response = await fetch(`http://localhost:${this.initialSchemaService.puertoBackend}/cursos/${curso?.id}`, {
        method: 'PUT',
        headers: headers,
        mode: 'cors',
        body: JSON.stringify({
          curso: { ...curso, fechaModificacion: new Date() },
        }),
      });
      if (response.status === 200){
        console.log('Curso descargado exitosamente');
        alert("Curso descargado exitosamente. Podrás verlo en el Inicio.")
        this.goHome();
      }
      else {
        console.log('Ha ocurrido un error, ', response.status);
        alert('Error al modificar el curso. Intente nuevamente.');
        this.showAlert = true;
      }
    } catch (e) {
      const alert = document.querySelector('ngb-alert');
      if (alert)
        alert.classList.add('show');
      console.error(e);
    }
  }
}
