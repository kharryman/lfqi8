import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, LoadingController, AlertController, Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';
import { Helpers } from '../../providers/helpers/helpers';
import { Subscription } from 'rxjs';

@Component({
   selector: 'page-show-numbers',
   templateUrl: 'show-numbers.html',
})
export class ShowNumbersPage {
   public pageName:string = "Show Numbers";
   showNumbers: any;
   @ViewChild('showNumbersResults') showNumbersResults: ElementRef | null = null;
   public database_misc: SQLiteDBConnection;
   private text: any;
   progressLoader: any;
   user: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   private onPauseSubscription: Subscription;

   constructor(public navCtrl: NavController, private platform: Platform, public progress: LoadingController, private alertCtrl: AlertController, public storage: Storage, public helpers: Helpers) {
      this.onPauseSubscription = this.platform.pause.subscribe(() => {
         this.saveStorage();
      });
      this.database_misc = this.helpers.getDatabaseMisc();
   }

   ngOnDestroy() {
      console.log("ngOnDestroy called");
      this.saveStorage();
      this.onPauseSubscription.unsubscribe();
   }

   async ngOnInit() {
      this.showNumbers = {};
      this.showNumbers.selectedType = "PERSONAL";
      this.showNumbers.color = "secondary";
      this.showNumbers.isShared = true;
      this.text = "";
      this.showNumbers.selectedTable = Helpers.TABLES_MISC.global_number;
      this.user = Helpers.User;
      await this.storage.create();
      this.helpers.setEncryptionKey(this.helpers.usernameHash(this.user.Username));
      this.storage.get('YOUR_NUMBERS_IS_SHARED').then(isShared => {
         if (isShared != null && Helpers.User.Username !== "GUEST") {
            this.showNumbers.isShared = isShared;
         }
         this.background_color = Helpers.background_color;
         this.button_color = Helpers.button_color;
         this.button_gradient = Helpers.button_gradient;
         this.showNumbers.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
            this.background_color = bgColor;
         });
         this.showNumbers.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
            this.button_color = buttonColor.value;
            this.button_gradient = buttonColor.gradient;
         });         
         this.showNumbers.numberEntriesList = [];
      });
   }

   ionViewDidLoad() {
      console.log('ionViewDidLoad ShowNumbersPage');
   }

   ionViewWillLeave() {
      console.log("ionViewWillLeave called");
      this.showNumbers.subscribedBackgroundColorEvent.unsubscribe();
      this.showNumbers.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   saveStorage() {
      console.log("saveStorage called");
      this.storage.set('YOUR_NUMBERS_IS_SHARED', this.showNumbers.isShared);
   }

   clickUsersOption() {
      console.log("clickUsersOption called.");
   }

   getNumbers() {
      console.log("getNumbers called");
      console.log("getNumbers isShared=" + this.showNumbers.isShared);
      this.showNumbers.results = "";
      var sql = "", data_type_id = "";
      if (this.showNumbers.selectedTable === Helpers.TABLES_MISC.global_number) {
         sql = "SELECT gn.Number, gn.Number_Power, gn.User_ID, gn.Title, gne.Number_ID, gne.Entry ,gne.Entry_Info, gne.Entry_Mnemonic, gne.Entry_Mnemonic_Info ";
         sql += "FROM " + Helpers.TABLES_MISC.global_number + " AS gn ";
         sql += "INNER JOIN " + Helpers.TABLES_MISC.global_number_entry + " AS gne ON gne.Number_ID=gn.ID ";
         sql += "ORDER BY gn.ID, gne.Entry_Index";
      }
      else if (this.showNumbers.selectedTable === Helpers.TABLES_MISC.user_number) {
         data_type_id = this.showNumbers.selectedType === "PERSONAL" ? "1" : "2";
         sql = "SELECT dt.Name AS Type, un.Number, un.Number_Power, un.User_ID, un.Title, une.Number_ID, une.Entry ,une.Entry_Info, une.Entry_Mnemonic, une.Entry_Mnemonic_Info ";
         sql += "FROM " + Helpers.TABLES_MISC.user_number + " AS un "
         sql += "INNER JOIN " + Helpers.TABLES_MISC.user_number_entry + " AS une ON une.Number_ID=un.ID ";
         sql += "INNER JOIN " + Helpers.TABLES_MISC.data_type + " AS dt ON dt.ID=un.Data_Type_ID ";
         sql += "WHERE un.User_ID='" + Helpers.User.ID + "' ";
         sql += " AND un.Data_Type_ID='" + data_type_id + "'";
         sql += "ORDER BY dt.Name, un.ID, une.Entry_Index";
      } else {//NEED TO CHOOSE OPTION:         
         this.helpers.myAlert("ALERT", "Please select shared number or user numbers.", "", "Dismiss");
         return;
      }
      //numbers_above_layout.setVisibility(View.GONE);
      //backup.setVisibility(View.VISIBLE);
      this.helpers.setProgress("Getting numbers ,please wait...", false).then(() => {
         this.showNumbers.numbers = [];
         this.showNumbers.results = "";
         if (Helpers.isWorkOffline === false) {
            var params = {
               "table": this.showNumbers.selectedTable,
               "username": Helpers.User.Username,
               "data_type_id": data_type_id
            };
            this.helpers.makeHttpRequest("/lfq_directory/php/show_numbers_get.php", "GET", params).then((data) => {
               if (data["SUCCESS"] === true) {
                  this.showNumbers.numbers = data["NUMBERS"];
                  this.finishGetNumbers();
                  this.helpers.dismissProgress();
               } else {
                  this.helpers.dismissProgress();
                  this.helpers.alertLfqError(data["ERROR"]);
               }
            });
         } else {
            this.helpers.query(this.database_misc, sql, []).then((data) => {
               this.showNumbers.numbers = [];
               for (var i = 0; i < data.rows.length; i++) {
                  this.showNumbers.numbers.push(data.rows.item(i));
               }
               this.finishGetNumbers();
               this.helpers.dismissProgress();
            }).catch((error) => {//END SELECT QUERY
               console.log("sql:" + sql + ", ERROR:" + error.message);
               this.showNumbers.results = "Sorry. Error loading numbers."
               this.helpers.dismissProgress();
            });
         }
      });
   }

   finishGetNumbers() {
      console.log("finishGetNumbers called");
      var lastNumberID = null;
      this.showNumbers.numberEntriesList = new Array(this.showNumbers.numbers.length);
      var numberCount = 0;

      for (var n = 0; n < this.showNumbers.numbers.length; n++) {
         this.showNumbers.numbers[n]["IS_HAS_COUNT"] = true;
         if (lastNumberID !== this.showNumbers.numbers[n]["Number_ID"]) {
            if (this.showNumbers.selectedTable === Helpers.TABLES_MISC.user_number) {
               this.showNumbers.numbers[n]["Title"] = this.helpers.decryptData(this.showNumbers.numbers[n]["Title"]);
               if(this.showNumbers.numbers[n]["Number"]){
                 this.showNumbers.numbers[n]["Number"] = this.helpers.decryptData(this.showNumbers.numbers[n]["Number"]);
               }
            }
            //if(this.showNumbers.numbers[n]["Number"]){
            //  this.showNumbers.numbers[n]["Number"] = this.helpers.formatNumber(this.showNumbers.numbers[n]["Number"]);
            //}
            lastNumberID = this.showNumbers.numbers[n]["Number_ID"];
            this.showNumbers.numberEntriesList[lastNumberID] = 1;
            numberCount++;
         } else {
            this.showNumbers.numbers[n]["IS_HAS_COUNT"] = null;
            this.showNumbers.numbers[n]["Title"] = null;
            this.showNumbers.numbers[n]["Type"] = null;
            this.showNumbers.numberEntriesList[lastNumberID]++;
         }
         this.showNumbers.numbers[n].Number_Count = numberCount;

         if (this.showNumbers.selectedTable === Helpers.TABLES_MISC.user_number) {
            this.showNumbers.numbers[n].Entry = this.helpers.decryptData(this.showNumbers.numbers[n].Entry);
            this.showNumbers.numbers[n].Entry_Info = this.helpers.decryptData(this.showNumbers.numbers[n].Entry_Info);
            this.showNumbers.numbers[n].Entry_Mnemonic = this.helpers.decryptData(this.showNumbers.numbers[n].Entry_Mnemonic);
            this.showNumbers.numbers[n].Entry_Mnemonic_Info = this.helpers.decryptData(this.showNumbers.numbers[n].Entry_Mnemonic_Info);
         }
      }

      if (this.showNumbers.numbers.length === 0) {
         if (this.showNumbers.selectedTable === Helpers.TABLES_MISC.global_number) {
            this.showNumbers.results = "No shared/global numbers!"
         }
         else if (this.showNumbers.selectedTable === Helpers.TABLES_MISC.user_number) {
            this.showNumbers.results = "<strong><b>No numbers for '" + Helpers.User.Username + "'</b></strong>";
         }
      }
   }
}
