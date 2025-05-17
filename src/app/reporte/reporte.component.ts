import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
imports: [
  NgbModule
]
const pdfMakeX = require('pdfmake/build/pdfmake.js');
const pdfFontsX = require('pdfmake-unicode/dist/pdfmake-unicode.js');
pdfMakeX.vfs = pdfFontsX.pdfMake.vfs;
import { __values } from 'tslib';
import { ModalComentariosComponent } from '../modal/comentarios/modal-comentarios.component';
import { GrupoDatoFijo } from '../modelos/schema.model';
import { InformacionGuardada, SchemaSavedData, Version } from '../modelos/schemaData.model';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';

@Component({
  selector: 'app-reporte',
  templateUrl: './reporte.component.html',
  styleUrls: ['./reporte.component.css'],
})
export class ReporteComponent {
  pdf: any;
  title = 'DisenaTuCursoDocente';
  token: string = '';
  urlServidor: string = '';
  titulo: string = '';
  descripcion: string = '';
  categoria: string = '';

  showAlert: boolean = false;
  alertMessage: string = '';

  constructor(
    private modalService: NgbModal,
    private router: Router,
    public initialSchemaService: InitialSchemaLoaderService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.urlServidor = params['servidor'];
      console.log('Token:', this.token);
      console.log('urlServidor:', this.urlServidor);
    });

    const alert = document.querySelector('ngb-alert');
    if (alert) alert.classList.remove('show');
  }

  async enviarReporte(event: Event): Promise<void> {
    event.preventDefault();

    console.log("Título:", this.titulo);
    console.log("Descripción:", this.descripcion);
    console.log("Categoría:", this.categoria);
    console.log("token:", this.token);

    const requestBody = {
      titulo: this.titulo,
      descripcion: this.descripcion,
      categoria: this.categoria
    };
    const apiUrl = this.urlServidor + '/api/nuevaIncidencia';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.token
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Incidencia ', responseData);

        const formIncidencia = document.getElementById('form-incidencia');
        const empty = document.getElementById('empty-ok');
        const textoIncidente = document.getElementById('texto-incidente');

        if (formIncidencia) formIncidencia.style.display = 'none';
        if (empty) {
          empty.style.display = 'block';
          if (textoIncidente)
            textoIncidente.innerText += ' ' + responseData.idIncidencia;
        }
      } else {
        console.log('Ha ocurrido un error:', response.status);
        this.alertMessage = "Error al crear la incidencia. Espere unos minutos y vuelva a intentar.";
        this.showAlert = true;
        this.scrollToTop();
      }
    } catch (error) {
      console.error('Error al crear la incidencia:', error);
      this.alertMessage = "Error al crear la incidencia. Espere unos minutos y vuelva a intentar.";
      this.showAlert = true;
      this.scrollToTop();
    }
  }

  goHome() {
    this.initialSchemaService.loadedData = undefined;
    this.router.navigate(['/']);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
