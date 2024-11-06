import {Directive, ElementRef, Output, EventEmitter, HostListener} from '@angular/core';

@Directive({
    selector: '[clickOutside]'
})
export class ClickOutsideDirective {
    constructor(private _elementRef : ElementRef) {
    }

    @Output()
    public clickOutside = new EventEmitter();

    @HostListener('document:click', ['$event.target'])
    public onClick(targetElement:any) {
        const clickedInside = this._elementRef.nativeElement.contains(targetElement);
        console.log("Directive ClickOutsideDirective clickedInside = " + clickedInside);
        if (!clickedInside) {
            this.clickOutside.emit(null);
        }
    }
}