import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Ubicacion } from 'src/app/modelos/schema.model';

@Component({
    selector: 'app-modal',
    templateUrl: './modal-confirmacion.component.html',
    styleUrls: ['./modal-confirmacion.component.css']
})
export class ModalConfirmacionComponent implements OnInit {
    @Input() tittle: string='';
    @Input() body: string='';
    @Input() ubicacionAtr: Ubicacion|null=null;
    
    constructor(public activeModal: NgbActiveModal) { }

    ngOnInit(): void { }

    resolve() {
        this.activeModal.close(this.ubicacionAtr);
    }
    
    reject() {
        this.activeModal.dismiss(null);
    }
}
