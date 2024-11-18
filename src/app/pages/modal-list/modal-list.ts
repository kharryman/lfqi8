import { Component, Input } from '@angular/core';
//import { NavParams, ViewController} from '@ionic/angular';
import { Helpers } from '../../providers/helpers/helpers';
import { ModalController } from '@ionic/angular';


@Component({
   selector: 'page-modal-list',
   templateUrl: 'modal-list.html'
})
export class ModalListPage {
   @Input() items: any = [];
   @Input() title: string = "";   
   public modal: any;
   //public items: Array<any> = [];
   public itemsToShow: Array<any> = [];
   public modalTitle: string = "";
   background_color: string = "";
   button_color: string = "";
   button_gradient: string = "";

   constructor(private modalCtrl: ModalController) {}

   ngOnInit() {
      console.log("ModalListPage ngOnInit called");
      this.modal = {};
      this.modal.user = Helpers.User;
      this.background_color = Helpers.background_color;
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;      
      this.initializeItemsToShow();
   }

   public initializeItemsToShow(): void {
      // Clone the list of countries so we don't modify the original copy
      this.itemsToShow = this.items.slice();
   }

   public filterItems(ev: any): void {
      this.initializeItemsToShow();
      // Set val to the value of the searchbar
      let val = ev.target.value;
      // If the value is an empty string don't filter the countries
      if (val && val.trim() != '') {
         this.itemsToShow = this.items.filter((item:any) => {
            return (item.name.toLowerCase().indexOf(val.toLowerCase()) > -1);
         })
      }
   }

   // Method that returns the selected country to the caller
   public selectItem(item: any): void {
      this.modalCtrl.dismiss(item);
   }

   // Method that closes the modal without returning anything
   public close(): void {
      this.modalCtrl.dismiss();      
   }

}


