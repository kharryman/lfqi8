import { Component } from '@angular/core';
//import { NavParams, ViewController} from '@ionic/angular';
import { Helpers } from '../../providers/helpers/helpers';


@Component({
   selector: 'page-modal-list',
   templateUrl: 'modal-list.html'
})
export class ModalListPage {
   public modal: any;
   //public items: Array<any> = [];
   public itemsToShow: Array<any> = [];
   public modalTitle: string = "";
   background_color: string;
   button_color: string;
   button_gradient: string;

   constructor() {
      // Get the data as a parameter
      this.modal = {};
      this.modal.user = Helpers.User;
      //this.items = paramsCtrl.get('items');
      //this.modalTitle = paramsCtrl.get('title');
      this.background_color = Helpers.background_color;
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;

      // Initialize the list of countries to show in the view
      this.initializeItemsToShow();
   }

   ionViewDidLoad() {
      console.log('ionViewDidLoad ModalListPage');
   }

   public initializeItemsToShow(): void {
      // Clone the list of countries so we don't modify the original copy
      //this.itemsToShow = this.items.slice();
   }

   public filterItems(ev: any): void {
      this.initializeItemsToShow();
      // Set val to the value of the searchbar
      let val = ev.target.value;
      // If the value is an empty string don't filter the countries
      if (val && val.trim() != '') {
         this.itemsToShow = this.itemsToShow.filter((item) => {
            return (item.name.toLowerCase().indexOf(val.toLowerCase()) > -1);
         })
      }
   }

   // Method that returns the selected country to the caller
   public selectItem(item: any): void {
      //this.viewCtrl.dismiss(item);
   }

   // Method that closes the modal without returning anything
   public close(): void {
      //this.viewCtrl.dismiss();
   }

}


