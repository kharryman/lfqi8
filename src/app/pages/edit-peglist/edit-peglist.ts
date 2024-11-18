import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage';
import { DB_Type_ID, Helpers, Op_Type, Op_Type_ID, SyncQuery } from '../../providers/helpers/helpers';
import { Subscription } from 'rxjs';

@Component({
   selector: 'page-edit-peglist',
   templateUrl: 'edit-peglist.html',
   styleUrl: 'edit-peglist.scss'
})
export class EditPeglistPage {
   public pageName: string = "Edit Peglist";
   editPeglist: any;
   public database_misc: SQLiteDBConnection | null = null;
   progressLoader: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   private onPauseSubscription: Subscription;
   user: any;

   constructor(public navCtrl: NavController, private platform: Platform, private alertCtrl: AlertController, public progress: LoadingController, public storage: Storage, private helpers: Helpers) {
      this.onPauseSubscription = this.platform.pause.subscribe(() => {
         this.saveStorage();
      });
   }

   ngOnInit() {
      this.database_misc = this.helpers.getDatabaseMisc();
      this.editPeglist = {};
      Helpers.currentPageName = this.pageName;
      this.user = Helpers.User;
      this.editPeglist.entries = [];
      this.editPeglist.entriesEdit = [];
      this.editPeglist.username = Helpers.User.Username;
      this.background_color = Helpers.background_color;
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;      
      this.editPeglist.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
         this.background_color = bgColor;
      });
      this.editPeglist.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
      });      
      this.editPeglist.entries = [];
      this.editPeglist.entriesEdit = [];
      this.helpers.getPeglist().then((peglist) => {
         if (peglist != null) {
            console.log("SETTING PEGLIST !!!!");
            this.editPeglist.entries = peglist;
            for (var i = 0; i < peglist.length; i++) {
               this.editPeglist.entriesEdit.push("");
            }
         }
      });
   }

   ionViewDidLoad() {
      console.log('ionViewDidLoad EditPeglistPage');
   }

   ionViewWillLeave(){
      this.editPeglist.subscribedBackgroundColorEvent.unsubscribe();
      this.editPeglist.subscribedButtonColorEvent.unsubscribe();
   }

   saveStorage() {
      console.log("saveStorage called");
      this.saveEntry(0);
   }

   saveEntry(index:number) {
      if (index < this.editPeglist.entries.length) {
         this.storage.set('EDIT_PEGLIST_ENTRY_' + index, this.editPeglist.entries[index].entry).then(() => {
            index++;
            this.saveEntry(index);
         });
      }
   }


   doEditPeglist() {
      console.log("doEditPeglist called");
      this.helpers.setProgress("Saving peglist entries for " + this.editPeglist.username + ", please wait...", false).then(() => {
         //CHECK INPUT:
         var isGood = true;
         var badInputs = [];
         var cols = ["User_ID", "Number", "Entry"];
         var vals = [];
         for (var i = 0; i < this.editPeglist.entries.length; i++) {
            if (!this.editPeglist.entries[i] || this.editPeglist.entries[i].trim() === "") {
               isGood = false;
               badInputs.push((i + 1));
            }
            if (isGood === true) {
               vals.push([Helpers.User.ID, (i + 1), this.editPeglist.entries[i]]);
            }
         }
         if (isGood === false) {
            this.helpers.myAlert("Alert", "<b>Bad inputs: " + badInputs + ".</b>", "", "Dismiss");
            this.helpers.dismissProgress();
            return;
         }
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         var queries = [
            new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.peglist, Op_Type_ID.DELETE, [], [], { "User_ID": Helpers.User.ID }),
            new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.peglist, Op_Type_ID.INSERT, cols, vals, { "User_ID": Helpers.User.ID })
         ];
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, Op_Type_ID.UPDATE, null, null, null, null).then((res) => {
            this.helpers.dismissProgress();
            if (res.isSuccess === true) {
               this.editPeglist.results = "UPDATED PEGLISTS FOR " + this.editPeglist.username + ".";
               this.helpers.myAlert("Alert", "", "<b>Updated peglist for " + this.editPeglist.username + ".</b>", "OK");
            } else {
               console.log("ERROR:" + res.results);
               this.editPeglist.results = "Sorry. Error updating peglist:" + res.results;
               this.helpers.myAlert("Alert", "", "<b>Sorry. Error updating number.</b>", "Dismiss");
            }
         });
      });
   }

   addEntry(index:number) {
      console.log("addNumber called.");
      this.editPeglist.numberEntries++;
      this.editPeglist.entries.splice((index + 1), 0, "");
      this.editPeglist.entriesEdit.splice((index + 1), 0, "");
   }

   removeEntry(index:number) {
      console.log("removeNumber called.");
      this.editPeglist.numberEntries--;
      this.editPeglist.entries.splice(index, 1);
      this.editPeglist.entriesEdit.splice(index, 1);
   }

}

interface myObject {
   [key: string]: any;
}
