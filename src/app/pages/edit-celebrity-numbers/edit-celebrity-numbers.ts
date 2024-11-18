import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';
import { DB_Type_ID, Helpers, Op_Type, Op_Type_ID, SyncQuery } from '../../providers/helpers/helpers';
import { Subscription } from 'rxjs';

@Component({
   selector: 'page-edit-celebrity-numbers',
   templateUrl: 'edit-celebrity-numbers.html',
   styleUrl: 'edit-celebrity-numbers.scss'
})
export class EditCelebrityNumbersPage {
   public pageName:string = "Edit Celebrity Numbers";
   private onPauseSubscription: Subscription;
   public user: any;
   editCelebrities: any;
   public database_misc: SQLiteDBConnection | null = null;
   progressLoader: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";

   constructor(public navCtrl: NavController, private platform: Platform, private alertCtrl: AlertController, public progress: LoadingController, public storage: Storage, private helpers: Helpers) {
      this.onPauseSubscription = this.platform.pause.subscribe(() => {
         this.saveStorage();
      });
   }

   async ngOnInit() {
      this.database_misc = this.helpers.getDatabaseMisc();
      this.editCelebrities = {};
      Helpers.currentPageName = this.pageName;
      this.user = Helpers.User;
      await this.storage.create();
      this.editCelebrities.entries = [];
      this.editCelebrities.entriesEdit = [];
      this.editCelebrities.username = Helpers.User.Username;
      this.background_color = Helpers.background_color;
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;
      this.editCelebrities.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
         this.background_color = bgColor;
      });
      this.editCelebrities.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
      });                          
      this.editCelebrities.entries = [];
      this.editCelebrities.entriesEdit = [];
      this.helpers.getCelebrityNumbers().then((celebrity_numbers) => {
         this.editCelebrities.entries = celebrity_numbers;
         if (celebrity_numbers != null) {
            for (var i = 0; i < celebrity_numbers.length; i++) {
               this.editCelebrities.entriesEdit.push({});
            }
            this.storage.get('EDIT_CELEBRITY_ENTRIES').then((val) => {
               if (val != null) {
                  this.editCelebrities.entries = JSON.parse(val);
               }
            });
         }
      });
   }

   saveStorage() {
      console.log("saveStorage called");
      this.storage.set('EDIT_CELEBRITY_ENTRIES', JSON.stringify(this.editCelebrities.entries));
   }

   ionViewDidLoad() {
      console.log('ionViewDidLoad EditCelebrityNumbersPage');
      this.editCelebrities.subscribedBackgroundColorEvent.unsubscribe();
      this.editCelebrities.subscribedButtonColorEvent.unsubscribe();
   }

   doEditCelebrities() {
      console.log("doEditCelebrities called");
      this.helpers.setProgress("Saving celebrity entries for " + this.editCelebrities.username + ", please wait...", false).then(() => {
         //CHECK INPUT:
         var vals = [];
         var isGood = true;
         var badInputs = [];
         for (var i = 0; i < this.editCelebrities.entries.length; i++) {
            if (!this.editCelebrities.entries[i].First_Name || this.editCelebrities.entries[i].First_Name.trim() === "") {
               isGood = false;
               badInputs.push((i + 1));
            } else if (!this.editCelebrities.entries[i].Last_Name || this.editCelebrities.entries[i].Last_Name.trim() === "") {
               isGood = false;
               badInputs.push((i + 1));
            } else if (!this.editCelebrities.entries[i].Action1 || this.editCelebrities.entries[i].Action2.trim() === "") {
               isGood = false;
               badInputs.push((i + 1));
            }
            if (isGood === true) {
               vals.push([Helpers.User.ID, (i + 1), this.editCelebrities.entries[i].First_Name, this.editCelebrities.entries[i].Last_Name, this.editCelebrities.entries[i].Action1, this.editCelebrities.entries[i].Action2, this.editCelebrities.entries[i].Information]);
            }
         }
         if (isGood === false) {
            this.helpers.myAlert("Alert", "<b>Bad inputs: " + badInputs + ".</b>", "", "Dismiss");
            this.helpers.dismissProgress();
            return;
         }
         var cols = ["User_ID", "Number", "First_Name", "Last_Name", "Action1", "Action2", "Information"];
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         var queries = [
            new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.celebrity_number, Op_Type_ID.DELETE, [], [], { "User_ID": Helpers.User.ID }),
            new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.celebrity_number, Op_Type_ID.INSERT, cols, vals, { "User_ID": Helpers.User.ID })
         ];
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, Op_Type_ID.UPDATE, null, null, null, null).then((res) => {
            this.helpers.dismissProgress();
            if (res.isSuccess === true) {
               this.editCelebrities.results = "UPDATED CELEBRITIES FOR " + Helpers.User.Username + ".";
               this.helpers.myAlert("Alert", "<b>Updated celebrities for " + Helpers.User.Username + ".</b>", "", "Dismiss");
            } else {
               console.log("ERROR:" + res.results);
               this.editCelebrities.results = "Sorry. Error updating celebrities";
               this.helpers.myAlert("Alert", "", "<b>Sorry. Error updating celebrities.</b>", "Dismiss");
            }
         });
      });
   }

   addEntry(index:number) {
      console.log("addNumber called.");
      this.editCelebrities.numberEntries++;
      this.editCelebrities.entries.splice((index + 1), 0, "");
      this.editCelebrities.entriesEdit.splice((index + 1), 0, {});
   }

   removeEntry(index:number) {
      console.log("removeNumber called.");
      this.editCelebrities.numberEntries--;
      this.editCelebrities.entries.splice(index, 1);
      this.editCelebrities.entriesEdit.splice(index, 1);
   }

}
