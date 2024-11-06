import { NgModule } from '@angular/core';
import { PinchZoomDirective } from './pinch/pinch-zoom';
import { ClickOutsideDirective } from './click-outside/click-outside';
import { ButtonGradientDirective } from './button-gradient/button-gradient';
@NgModule({
	declarations: [PinchZoomDirective,
    ClickOutsideDirective,
    ButtonGradientDirective],
	imports: [],
	exports: [PinchZoomDirective,
    ClickOutsideDirective,
    ButtonGradientDirective]
})
export class DirectivesModule {}
