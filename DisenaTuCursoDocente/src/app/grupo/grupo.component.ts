import { Component, OnInit, Input } from '@angular/core';
import { RegistrarDependencia } from '../atributo/atributo.component';
import { Atributo, Grupo, Ubicacion } from '../modelos/schema.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {ComentarioPrivado } from '../modelos/schema.model'
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { ModalComentariosComponent } from '../modal/comentarios/modal-comentarios.component';

@Component({
  selector: 'app-grupo',
  templateUrl: './grupo.component.html',
  styleUrls: ['./grupo.component.css'],
})
export class GrupoComponent implements OnInit {
    @Input() grupo!: Grupo;

    comentariosPrivados: ComentarioPrivado[] | undefined = undefined;
    mapObservadorCambios : Map<string,RegistrarDependencia[]> = new Map();

    constructor(private modalService: NgbModal,
        public initialSchemaService : InitialSchemaLoaderService) {}

    ngOnInit(): void {}

    registrarDependencia(registroDependencia:RegistrarDependencia){
        let claveMap = this.objectToString(registroDependencia.observado);
        let depdendencias = this.mapObservadorCambios.get(claveMap);
        if(depdendencias === undefined){
            let array : RegistrarDependencia[] = [];
            array.push(registroDependencia);
            this.mapObservadorCambios.set(claveMap,array);
        }
        else{
            depdendencias.push(registroDependencia);
        }
    }

    informarCambio(cambioEnUbicacion:Ubicacion){
        let claveMap = this.objectToString(cambioEnUbicacion);
        let depdendencias = this.mapObservadorCambios.get(claveMap);
        if(depdendencias !== undefined){
            for(let dependencia of depdendencias){
                let claveObservado = this.objectToString(dependencia.observado);
                if(claveMap === claveObservado){
                    dependencia.interesadoEscucha.emit(dependencia);
                }
            }
        }
    }

    objectToString(obj:any){
        return JSON.stringify(obj);
    }

    stringToObject(string:string){
        return JSON.parse(string);
    }

    openModal(atributo: Atributo){
        // MODAL PARA AGREGAR COMENTARIOS
        console.log(atributo)
        const InformacionGuardada = this.initialSchemaService.loadedData?.versiones.at(-1)?.datosGuardados
        console.log(InformacionGuardada)
        this.comentariosPrivados = []
        if (InformacionGuardada)
            for(let dato of InformacionGuardada){
                if(dato.ubicacionAtributo.idEtapa == atributo.ubicacion.idEtapa &&
                    dato.ubicacionAtributo.idGrupo == atributo.ubicacion.idGrupo){
                        for(let comentario of dato.comentariosPrivados){
                            this.comentariosPrivados.push(comentario)
                        }
                        
                }
            }
        const ubiAtrr = atributo.ubicacion
        const modalRef = this.modalService.open(ModalComentariosComponent, {
            scrollable: false,
        });
        modalRef.componentInstance.tittle = 'Agregar comentario';
        modalRef.componentInstance.inputDisclaimer = '*Los comentarios que ingreses aquí solo tú los veras';
        modalRef.componentInstance.comentariosPrivados = this.comentariosPrivados;
        //modalRef.componentInstance.resolveFunction = this.resolveModal;

        //Control Resolve with Observable
        modalRef.closed.subscribe({
            next: (resp) => {
                console.log(this.comentariosPrivados);
                if (resp.length > 0){
                    console.log('comentario: ' + resp);
                    var today = new Date();
                    let autor = this.initialSchemaService.loadedData?.versiones.at(-1)?.autor;
                    let comentario : ComentarioPrivado = {
                        // autor : this.initialSchemaService.loadedData?.autor;
                        autor : autor,
                        fecha : today.getTime(),
                        valor : resp
                    }
                    if (InformacionGuardada)
                        for(let dato of InformacionGuardada){
                            if(dato.ubicacionAtributo.idEtapa == atributo.ubicacion.idEtapa &&
                                dato.ubicacionAtributo.idGrupo == atributo.ubicacion.idGrupo){
                                    dato.comentariosPrivados.push(comentario)
                                    
                            }
                        }
                        
                }
                if (modalRef.componentInstance.comentariosPrivados){
                    this.comentariosPrivados = modalRef.componentInstance.comentariosPrivados
                    console.log(atributo)
                }
            },
            error: () => {
                //Nunca se llama aca
            },
        });
    }

    async modificarCurso() {
        const curso = this.initialSchemaService.loadedData
        // busco version actualizada y la agrego como nueva cuando es el 1er cambio, falta definir esa logica
        // const nuevaVersion = curso?.versiones.at(-1); 
        // if (nuevaVersion !== undefined) curso?.versiones?.push(nuevaVersion);
        let headers = new Headers();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/json');
        try {
          // no hay convencion sobre los nombres aun asi que paso id para que busque archivo curso_id 
          const response = await fetch(`http://localhost:8081/cursos/${curso?.id}`, {
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
          console.error(e);
        }
      }

    /*resolveModal = (args: any): void => {
        var inputValue = (<HTMLInputElement>document.getElementById("input-content")).value;
        console.log(inputValue);
        if (inputValue){
            this.activeModal.close(inputValue);
        }
        else{
            this.activeModal.close('');
        }
    }*/
}
