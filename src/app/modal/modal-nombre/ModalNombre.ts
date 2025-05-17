import { Component, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ComentarioPrivado } from '../../modelos/schema.model';

@Component({
  selector: 'app-modal-nombre',
  templateUrl: './ModalNombre.html',
  styleUrls: ['./ModalNombre.css'],
})
export class ModalNombreComponent implements OnInit {
  @Input() tittle: string = '';
  @Input() body: string = '';
  @Input() inputDisclaimer: string[] = [];
  @Input() comentariosPrivados!: ComentarioPrivado[];
  @Output() salida: string[] = [];
  isInputValid: boolean = false;

  showAlert: boolean = false;       // Controla si se muestra la alerta
  alertMessage: string = '';        // Mensaje de alerta a mostrar

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    console.log(this.comentariosPrivados);
    this.body = 'El nombre ingresado aquí será usado para identificarlo y registrarlo como propietario de sus cursos.';
  }

  onInputChange() {
    // Verifica si todos los inputs tienen valores
    this.isInputValid = this.inputDisclaimer.every((_, i) => {
      const inputValue: HTMLInputElement | null = document.querySelector("#input-content_" + i);
      return inputValue?.value.trim() !== '';
    });
  }

  resolve() {
    this.salida = []; // Limpia la salida por si el usuario volvió atrás

    for (let i = 0; i < this.inputDisclaimer.length; i++) {
      let inputValue: HTMLInputElement | null;
      inputValue = document.querySelector("#input-content_" + i);
      if (inputValue && inputValue.value) {
        this.salida.push(inputValue.value);
      }
    }

    if (this.isInputValid) {
      this.activeModal.close(this.salida);
    } else {
      this.alertMessage = 'Debe ingresar su nombre.';
      this.showAlert = true;
      this.scrollToTop();
    }
  }

  reject() {
    this.activeModal.dismiss('Cancelar');
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
