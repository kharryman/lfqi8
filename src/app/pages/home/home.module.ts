import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ButtonGradientDirective } from '../../directives/button-gradient/button-gradient';
import { HomePage } from './home';

@NgModule({
  declarations: [
    HomePage    
  ],
  imports: [
    IonicPageModule.forChild(HomePage)
  ],
})
export class HomePageModule {}
