import { Component, OnInit, HostListener } from '@angular/core';
import { Etapa, Grupo,Esquema } from '../modelos/schema.model';
import { SchemaSavedData, Version } from '../modelos/schemaData.model';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { AccionesCursosService } from '../servicios/acciones-cursos.service';
import {ExportpdfComponent} from   '../exportpdf/exportpdf.component'
import { Router } from '@angular/router';

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
    savedData : SchemaSavedData | undefined = undefined;
    defaultSchema : Esquema | undefined = undefined;
    mostrarVersiones: boolean = false
    versionSeleccionada: Version | undefined = this.initialSchemaService.loadedData?.versiones.at(-1);

    nombreArchivo:string='';
    constructor(public initialSchemaService : InitialSchemaLoaderService,
        private router: Router,
        public accionesCursosService: AccionesCursosService){ }


    ngOnInit() {
        const palette = ["#c0392b","#2980b9","#27ae60","#708284"] //rojo, azul, verde, gris
        setTimeout(()=>{
            // tiene que estar en el timeout sino da undefined
            var schemaEtapas = this.initialSchemaService.defaultSchema?.etapas;

            let graph: any = {nodes:[],links:[]};

            console.log(schemaEtapas)
            console.log(this.initialSchemaService)  
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
        // this.accionesCursosService.setImpactarCambios(false);
        var schemaEtapas = this.initialSchemaService.defaultSchema?.etapas;
        console.log(schemaEtapas)
        var grupoSeleccionado;
        if (schemaEtapas)
            for (var i=0; i < schemaEtapas.length; i++) {
                if (schemaEtapas[i].grupos)
                    for (var j=0; j < schemaEtapas[i].grupos.length; j++) {
                        if (schemaEtapas[i].grupos[j].id == grupoId &&
                            schemaEtapas[i].grupos[j].ubicacion.idEtapa == 1) // HARDCORE PARA VER SOLO PROGRAMA
                            grupoSeleccionado = schemaEtapas[i].grupos[j]
                    }
            }
        this.grupoCargado = grupoSeleccionado; 
        // setTimeout(() => this.accionesCursosService.setImpactarCambios(true), 5000);
    }
    
    mostrarGruposDeEtapa(etapa: Etapa){
        console.log(etapa.grupos)
        this.gruposDeEtapa = etapa.grupos;
    }

    cargarGrupo(grupo:Grupo){
        console.log(grupo)
        this.grupoCargado = grupo;
    }

    /*cargarArchivo(){
        this.initialSchemaService.loadDataFile(this.nombreArchivo);
    }*/

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
        event.stopPropagation();
        const exportPdf = new ExportpdfComponent(this.initialSchemaService);
        var pdf;
        if (this.initialSchemaService.loadedData?.id){
            pdf = exportPdf.generatePdf(this.initialSchemaService.loadedData?.id)
            pdf.open();
        }
    }

    goHome(){
        this.router.navigate(['/']);
    }

    invertirMostrarVersiones(){
        this.mostrarVersiones = !this.mostrarVersiones;
    }

    nuevaVersion(e:any){
        // console.log('prevengo')
        // e.preventDefault();
        const curso = this.initialSchemaService.loadedData;
        const ultimaVersionActual = structuredClone(curso?.versiones.at(-1));
        if(ultimaVersionActual){
            const nuevaVersion = {...ultimaVersionActual,
                nombre: "nombre hardcodeado",
                version: ultimaVersionActual.version+1,
                fechaCreacion: new Date()
            }
            curso?.versiones.push(nuevaVersion);
            this.versionSeleccionada = nuevaVersion;
        }
        // this.accionesCursosService.modificarCurso();
    }

    seleccionarVersion(version: number, e:any){
        const curso = this.initialSchemaService.loadedData;
        const versionSeleccionada = structuredClone(curso?.versiones.find(v => v.version === version));
        const ultimoIdentificador = curso?.versiones.at(-1)?.version;
        console.log(versionSeleccionada?.datosGuardados?.[0].valoresAtributo?.[0].valoresDato?.[0]);
        if(versionSeleccionada && ultimoIdentificador){
            const nuevaVersion = {...versionSeleccionada,
                nombre: "nombre hardcodeado",
                version: ultimoIdentificador+1,
                fechaCreacion: new Date()
            };
            curso?.versiones.push(nuevaVersion);
            this.versionSeleccionada = nuevaVersion;
        }
        // this.accionesCursosService.modificarCurso();
    }

    printLoaded(){
        console.log(this.initialSchemaService.loadedData?.versiones?.[0]?.datosGuardados?.[0].valoresAtributo?.[0].valoresDato?.[0], this.initialSchemaService.loadedData?.versiones?.[0]?.version);
        console.log(this.initialSchemaService.loadedData?.versiones?.[1]?.datosGuardados?.[0].valoresAtributo?.[0].valoresDato?.[0], this.initialSchemaService.loadedData?.versiones?.[1]?.version);
        console.log(this.initialSchemaService.loadedData?.versiones?.[2]?.datosGuardados?.[0].valoresAtributo?.[0].valoresDato?.[0], this.initialSchemaService.loadedData?.versiones?.[2]?.version);
        console.log(this.initialSchemaService.loadedData?.versiones?.[3]?.datosGuardados?.[0].valoresAtributo?.[0].valoresDato?.[0], this.initialSchemaService.loadedData?.versiones?.[3]?.version);
        console.log(this.initialSchemaService.loadedData?.versiones);
        console.log(this.versionSeleccionada);
    }
}
