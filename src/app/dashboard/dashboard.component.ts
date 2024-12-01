import { Component, OnInit, HostListener, TemplateRef, ViewChild } from '@angular/core';
import { Etapa, Grupo,Esquema, Atributo, Dato, FilaDatos } from '../modelos/schema.model';
import { SchemaSavedData, Version } from '../modelos/schemaData.model';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { AccionesCursosService } from '../servicios/acciones-cursos.service';
import {ExportpdfComponent} from   '../exportpdf/exportpdf.component'
import { Router } from '@angular/router';
import { ModalComentariosComponent } from '../modal/comentarios/modal-comentarios.component';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Interaccion_Schema_Data } from '../servicios/interaccion-schema-data.service';
imports: [
  NgbModule
]

declare function createGraph(graph : any): any;

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {
    title = 'DisenaTuCursoDocente';
    gruposDeEtapa : Grupo[] | undefined = undefined;
    grupoCargado : Grupo | undefined = undefined;
    mostrarUIVersiones: boolean = false;

    savedDataCurso : SchemaSavedData = this.initialSchemaService.loadedData!;
    versionSeleccionada: Version = this.savedDataCurso.versiones.at(-1)!;
    //POP UP Selector PDF
    @ViewChild('selectorPdf') selectorPdf!: TemplateRef<any>;
    checkStatus: { [key: string]: boolean } = {};
    esquema:Esquema;

    constructor(public initialSchemaService : InitialSchemaLoaderService,
        private router: Router,
        private modalService: NgbModal,
        public accionesCursosService: AccionesCursosService,
        public interaccionSchemaConData: Interaccion_Schema_Data
    ){ 
        this.esquema=this.initialSchemaService.defaultSchema!;
    }


    ngOnInit() {
        
        this.initializeCheckStatus(this.esquema);
        
        const palette = ["#c0392b","#2980b9","#27ae60","#708284"] //rojo, azul, verde, gris
        setTimeout(()=>{
            // tiene que estar en el timeout sino da undefined
            var schemaEtapas = this.initialSchemaService.defaultSchema?.etapas;

            let graph: any = {nodes:[],links:[]};

            if (schemaEtapas)
                for (var i=0; i < schemaEtapas.length; i++) {
                    //recorrida de etapas -> nodos principales (grado 1)
                    let node: any = {id:'',name:''};
                    node.id = schemaEtapas[i].id;
                    node.name = schemaEtapas[i].nombre;
                    node.grado = 1
                    node.Descripcion = schemaEtapas[i].descripcion
                    node.color = palette[i]

                    node.childrens = []
                    node.childrenLinks = []
                    if (schemaEtapas[i].grupos)
                        for (var j=0; j < schemaEtapas[i].grupos.length; j++) {
                            //recorrida de grupos -> nodos secundarios (grado 2)
                            var grupoNodo = schemaEtapas[i].grupos[j]
                            let childrenNode: any = {id:'',name:''};
                            childrenNode.id = grupoNodo.id
                            childrenNode.name = grupoNodo.nombre
                            childrenNode.color = node.color
                            childrenNode.grado = 2
                            childrenNode.parent = []
                            if (grupoNodo.relacionesGrafo)
                                childrenNode.parent = grupoNodo.relacionesGrafo
                            childrenNode.parent.push(node.id)
                            node.childrens.push(childrenNode)

                            //por cada hijo hago un link al padre
                            let childrenLink: any = {source:'',target:''};
                            childrenLink.source = node.id
                            childrenLink.target = grupoNodo.id
                            childrenLink.grado = 2
                            node.childrenLinks.push(childrenLink)
                        }

                    // agrego link con el resto de los de grado 1
                    for (var j=0; j < graph.nodes.length; j++) {
                        let link: any = {source:'',target:''};
                        link.source = node.id
                        link.target = graph.nodes[j].id
                        link.grado = 1

                        graph.links.push(link)
                    }

                    graph.nodes.push(node)

                }
                createGraph(graph); // function en script.js
          }, 0);

    }

    @HostListener('window:grupoOnClick', ['$event.detail.grupoId'])
    grupoOnClick(grupoId:number){
        var schemaEtapas = this.initialSchemaService.defaultSchema?.etapas;
        var grupoSeleccionado;
        if (schemaEtapas)
            for (var i=0; i < schemaEtapas.length; i++) {
                if (schemaEtapas[i].grupos)
                    for (var j=0; j < schemaEtapas[i].grupos.length; j++) {
                        if (schemaEtapas[i].grupos[j].id == grupoId)
                            grupoSeleccionado = schemaEtapas[i].grupos[j]
                    }
            }
        this.grupoCargado = grupoSeleccionado;
        this.mostrarUIVersiones = false
    }

    mostrarGruposDeEtapa(etapa: Etapa){
        console.log(etapa.grupos)
        this.gruposDeEtapa = etapa.grupos;
        this.mostrarUIVersiones = false
    }

    cargarGrupo(grupo:Grupo){
        console.log(grupo)
        this.grupoCargado = grupo;
        this.mostrarUIVersiones = false
    }

    openModal(opcion: string){
        if (opcion == 'nuevo'){
            // MODAL PARA CREAR NUEVA VERSION
            const modalRef = this.modalService.open(ModalComentariosComponent, {
                scrollable: false,
            });
            modalRef.componentInstance.tittle = 'Nueva version';
            modalRef.componentInstance.body = "Se creará una nueva versión del curso a partir de la version actual."
            modalRef.componentInstance.inputDisclaimer[0] = 'Nombre de la nueva versión';

            //Control Resolve with Observable
            modalRef.closed.subscribe({
                next: (resp) => {
                    if (resp.length > 0){
                        this.nuevaVersion(resp[0])
                    }
                },
                error: () => {
                    //Nunca se llama aca
                },
            });
        }else{
            if (opcion == 'eliminar'){
                // MODAL PARA CREAR NUEVA VERSION
                const modalRef = this.modalService.open(ModalComentariosComponent, {
                    scrollable: false,
                });
                modalRef.componentInstance.tittle = 'Eliminar curso';
                modalRef.componentInstance.body = "¿Confirma que desea eliminar éste curso?"

                //Control Resolve with Observable
                modalRef.closed.subscribe({
                    next: (resp) => {
                        console.log("eliminar curso")
                        this.accionesCursosService.eliminarCurso()

                    },
                    error: () => {
                        //Nunca se llama aca
                    },
                });
            }
        }

    }

    descargarArchivo(){
        let a = document.createElement('a');
        a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(JSON.stringify(this.initialSchemaService.loadedData, null, 4)));
        a.setAttribute('download', "file.json");
        a.click();
    }

    public descargarCurso(event: any):void{
        event.stopPropagation();
        let a = document.createElement('a');
        a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(JSON.stringify(this.initialSchemaService.loadedData, null, 4)));
        a.setAttribute('download', this.initialSchemaService.loadedData?.nombreCurso + ".json");
        a.click();

    }

    public descargarPDF(event: any):void{
        const referenceModal = this.modalService.open(this.selectorPdf);
        referenceModal.result.then((result) => {
            // Aquí manejas el resultado cuando el modal se cierra exitosamente.
            const exportPdf = new ExportpdfComponent(this.initialSchemaService,this.interaccionSchemaConData);
            var pdf;
            if(this.versionSeleccionada){
                pdf = exportPdf.newGeneratePdf(this.savedDataCurso,this.versionSeleccionada,this.checkStatus);
                pdf.open();
            }
        }).catch((_) => {});
        /*event.stopPropagation();
        const exportPdf = new ExportpdfComponent(this.initialSchemaService,this.interaccionSchemaConData);
        var pdf;
        if(this.versionSeleccionada){
            //pdf = exportPdf.generatePdf(this.initialSchemaService.loadedData?.id!);
            pdf = exportPdf.newGeneratePdf(this.savedDataCurso,this.versionSeleccionada);
            pdf.open();
        }*/
    }

    goHome(){
        this.initialSchemaService.loadedData = undefined
        this.router.navigate(['/']);
    }

    invertirMostrarVersiones(){
        this.mostrarUIVersiones = !this.mostrarUIVersiones;
    }

    nuevaVersion(nombreVersion:string){
        const curso = this.initialSchemaService.loadedData;
        let nuevaVersion = structuredClone(curso?.versiones.find(v => v.version === this.versionSeleccionada!.version));
        const ultimaVersion = curso?.versiones.at(-1)?.version;
        nuevaVersion!.version = ultimaVersion!+1;
        let fechaMod = new Date();
        nuevaVersion!.fechaCreacion = fechaMod;
        nuevaVersion!.fechaModificacion = fechaMod;
        nuevaVersion!.nombre = nombreVersion;
        curso?.versiones.push(nuevaVersion!);
        this.versionSeleccionada = nuevaVersion!;
        this.accionesCursosService.modificarCurso();
    }

    eliminarVersion(version: number, e: any) {
      const curso = this.initialSchemaService.loadedData;
      if (curso) {
        // Encuentra la versión que se va a eliminar
        const index = curso.versiones.findIndex(v => v.version === version);

        if (index !== -1) {
          // Elimina la versión del array de versiones del curso
          curso.versiones.splice(index, 1);

          // Si la versión eliminada es la versión seleccionada actualmente, selecciona la última versión
          if (this.versionSeleccionada.version === version) {
            this.versionSeleccionada = curso.versiones.at(-1)!; // Selecciona la última versión restante
          }

          // Realiza cualquier acción necesaria después de eliminar la versión (ej. guardar cambios)
          this.accionesCursosService.modificarCurso();
        }
      }
    }

    seleccionarVersion(version: number, e:any){
        const curso = this.initialSchemaService.loadedData;
        this.versionSeleccionada = curso?.versiones.find(v => v.version === version)!;
    }




    //CODIGO POPUP PDF
    // Manejar el estado de los checkboxes
    initializeCheckStatus(esquema: Esquema) {
        //For Etapa
        esquema.etapas.forEach(etapa => {
          this.checkStatus[`E_${etapa.id}`] = true; // Inicializa etapa como marcada
          this.checkStatus[`Eexp_${etapa.id}`] = true; // Inicializa etapa como expandida
          //For Grupo
          etapa.grupos.forEach(grupo => {
            this.checkStatus[`E_${etapa.id}-G_${grupo.id}`] = true; // Inicializa grupo como marcado
            this.checkStatus[`Eexp_${etapa.id}-Gexp_${grupo.id}`] = true; // Inicializa grupo como expandido
            //For Atributo
            grupo.atributos.forEach(atributo => {
              this.checkStatus[`E_${etapa.id}-G_${grupo.id}-A_${atributo.id}`] = true; // Inicializa atributo como marcado
              this.checkStatus[`Eexp_${etapa.id}-Gexp_${grupo.id}-Aexp_${atributo.id}`] = true; // Inicializa atributo como expandido
              let atributoCalculado:Atributo|null=null;
              //Cargo Datos de Herencia
              if (atributo.herencia){
                const [atributoHerencia, grupoHerencia, etapaHerencia] = this.interaccionSchemaConData.getAtributoHerencia(atributo.herencia,{idEtapa:atributo.ubicacion.idEtapa,idGrupo:atributo.ubicacion.idGrupo,idAtributo:atributo.id,idDato:null});
                if(atributoHerencia!.filasDatos!=null){
                    atributoHerencia!.filasDatos.forEach(fila => {
                      //For Dato del Atributo Heredado
                      fila.datos.forEach(dato => {
                        this.checkStatus[`E_${etapa.id}-G_${grupo.id}-A_${atributo.id}-D_${dato.id}`] = true; // Inicializa dato como marcado
                      });
                    });
                }
                atributoCalculado=atributoHerencia;
              }
              
              //For FilaDatos del Atributo Local (no Heredado)
              if(atributo.filasDatos!=null){
                  atributo.filasDatos.forEach(fila => {
                    //For Dato del Atributo Local
                    fila.datos.forEach(dato => {
                      this.checkStatus[`E_${etapa.id}-G_${grupo.id}-A_${atributo.id}-D_${dato.id}`] = true; // Inicializa dato como marcado
                    });
                  });
                  if(atributoCalculado!=null){
                    atributoCalculado.filasDatos.push(...atributo.filasDatos);
                  }
                  else{
                    atributoCalculado=atributo;
                  }
              }
            });
          });
        });
    }


    // Funciones para controlar la expansión/colapso
    toggleExpandEtapa(element: any) {
        this.checkStatus[`Eexp_${element.id}`] = !this.checkStatus[`Eexp_${element.id}`];
    }
    isEtapaExpanded(element: any): boolean {
        return !!this.checkStatus[`Eexp_${element.id}`];
    }
    toggleExpandGrupo(element: any) {
        this.checkStatus[`Eexp_${element.ubicacion.idEtapa}-Gexp_${element.id}`] = !this.checkStatus[`Eexp_${element.ubicacion.idEtapa}-Gexp_${element.id}`];
    }
    isGrupoExpanded(element: any): boolean {
        return !!this.checkStatus[`Eexp_${element.ubicacion.idEtapa}-Gexp_${element.id}`];
    }
    toggleExpandAtributo(element: any) {
        this.checkStatus[`Eexp_${element.ubicacion.idEtapa}-Gexp_${element.ubicacion.idGrupo}-Aexp_${element.id}`] = !this.checkStatus[`Eexp_${element.ubicacion.idEtapa}-Gexp_${element.ubicacion.idGrupo}-Aexp_${element.id}`];
    }
    isAtributoExpanded(element: any): boolean {
        return !!this.checkStatus[`Eexp_${element.ubicacion.idEtapa}-Gexp_${element.ubicacion.idGrupo}-Aexp_${element.id}`];
    }

    // Funciones para manejar checkboxes
    onToggleEtapa(element: any, event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const isChecked = inputElement ? inputElement.checked : false;
        this.toggleEtapa(element, isChecked);
    }
    toggleEtapa(etapa: Etapa, isChecked: boolean) {
        this.checkStatus[`E_${etapa.id}`] = isChecked;
        etapa.grupos.forEach(grupo => this.toggleGrupo(grupo, isChecked)); // Desmarca sus grupos
    }
    onToggleGrupo(element: any, event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const isChecked = inputElement ? inputElement.checked : false;
        this.toggleGrupo(element, isChecked);
    }
    toggleGrupo(grupo: Grupo, isChecked: boolean) {
        this.checkStatus[`E_${grupo.ubicacion.idEtapa}-G_${grupo.id}`] = isChecked;
        grupo.atributos.forEach(atributo => this.toggleAtributo(atributo, isChecked)); // Desmarca atributos
    }
    onToggleAtributo(element: any, event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const isChecked = inputElement ? inputElement.checked : false;
        this.toggleAtributo(element, isChecked);
    }
    toggleAtributo(atributo: Atributo, isChecked: boolean) {
        this.checkStatus[`E_${atributo.ubicacion.idEtapa}-G_${atributo.ubicacion.idGrupo}-A_${atributo.id}`] = isChecked;
        let filaDatos:FilaDatos[] = this.calculoFilaDatosDeAtributo(atributo);
        if(filaDatos!=null){
            filaDatos.forEach(fila => {
                fila.datos.forEach(dato => {
                    this.checkStatus[`E_${dato.ubicacion.idEtapa}-G_${dato.ubicacion.idGrupo}-A_${atributo.id}-D_${dato.id}`] = isChecked; // Desmarca datos
                });
            });
        }
    }
    onToggleDato(element: any, event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const isChecked = inputElement ? inputElement.checked : false;
        this.toggleDato(element, isChecked);
    }
    toggleDato(dato: Dato, isChecked: boolean) {
        this.checkStatus[`E_${dato.ubicacion.idEtapa}-G_${dato.ubicacion.idGrupo}-A_${dato.ubicacion.idAtributo}-D_${dato.id}`] = isChecked;
    }
    // Funciones para verificar el estado
    isEtapaChecked(etapa: Etapa): boolean {
        return this.checkStatus[`E_${etapa.id}`];
    }

    isGrupoChecked(grupo: Grupo): boolean {
        return this.checkStatus[`E_${grupo.ubicacion.idEtapa}-G_${grupo.id}`];
    }

    isAtributoChecked(atributo: Atributo): boolean {
        return this.checkStatus[`E_${atributo.ubicacion.idEtapa}-G_${atributo.ubicacion.idGrupo}-A_${atributo.id}`];
    }

    isDatoChecked(dato: Dato): boolean {
        return this.checkStatus[`E_${dato.ubicacion.idEtapa}-G_${dato.ubicacion.idGrupo}-A_${dato.ubicacion.idAtributo}-D_${dato.id}`];
    }
    calculoAtributosDeGrupo(atributosGrupo:Atributo[]):Atributo[]{
        let atributosCalculados:Atributo[]=[];
        
        for(let atributo of atributosGrupo){
            /*//Porque esto no anda?
            let calcFilaDatos:FilaDatos[] = this.calculoFilaDatosDeAtributo(atributo);
            atributo.filasDatos = calcFilaDatos;
            atributosCalculados.push(atributo);*/
            let atributoCalculado:Atributo|null=null;
            //Cargo FilaDatos del Atributo Herencia
            if (atributo.herencia){
                const [atributoHerencia, grupoHerencia, etapaHerencia] = this.interaccionSchemaConData.getAtributoHerencia(atributo.herencia,{idEtapa:atributo.ubicacion.idEtapa,idGrupo:atributo.ubicacion.idGrupo,idAtributo:atributo.id,idDato:null});
                atributoCalculado=atributoHerencia;
            }
            
            //Cargo FilaDatos del Atributo Local (no Heredado)
            if(atributo.filasDatos!=null){
                if(atributoCalculado!=null){
                    atributoCalculado.filasDatos.push(...atributo.filasDatos);
                }
                else{
                    atributoCalculado=atributo;
                }
            }
            atributosCalculados.push(atributoCalculado!);
        }
        return atributosCalculados;
    }

    calculoFilaDatosDeAtributo(atributo:Atributo):FilaDatos[]{
        let atributoCalculado:Atributo|null=null;
        //Cargo FilaDatos del Atributo Herencia
        if (atributo.herencia){
            const [atributoHerencia, grupoHerencia, etapaHerencia] = this.interaccionSchemaConData.getAtributoHerencia(atributo.herencia,{idEtapa:atributo.ubicacion.idEtapa,idGrupo:atributo.ubicacion.idGrupo,idAtributo:atributo.id,idDato:null});
            atributoCalculado=atributoHerencia;
        }
        
        //Cargo FilaDatos del Atributo Local (no Heredado)
        if(atributo.filasDatos!=null){
            if(atributoCalculado!=null){
                atributoCalculado.filasDatos.push(...atributo.filasDatos);
            }
            else{
                atributoCalculado=atributo;
            }
        }
        return atributoCalculado!.filasDatos;
    }
}
