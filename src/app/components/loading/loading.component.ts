import { Component, Input } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-loading',
  template: `
    <div class="custom-loading">
      OK
      <div [innerHTML]="message"></div>
    </div>
  `,
  styleUrls: ['./loading.component.scss'],
})
export class LoadingComponent {
  @Input() message: string = '';

  constructor(private loadingController: LoadingController) {}
}
