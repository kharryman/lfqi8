import { Directive, ElementRef, Renderer2 } from '@angular/core';
import { Helpers } from '../../providers/helpers/helpers';

@Directive({
  selector: '[button-gradient]' // Attribute selector
})
export class ButtonGradientDirective {  ;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    console.log("button-gradient DIRECTIVE CALLED!");
    this.el.nativeElement.style.background = 'linear-gradient( 180deg, ' + Helpers.button_color + ', #0DB04B )';
    //this.renderer.setStyle(this.el.nativeElement, 'background', 'linear-gradient( 180deg, ' + Helpers.button_color + ', #0DB04B )');
  }

}
