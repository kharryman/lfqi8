import { ChangeDetectorRef, Component } from '@angular/core';
import { NavController, NavParams, LoadingController, Platform, AlertController, ModalController } from '@ionic/angular';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';
import { DB_Type_ID, Helpers, Op_Type, Op_Type_ID, SyncQuery, User_Action_Request } from '../../providers/helpers/helpers';
import { NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalListPage } from '../../pages/modal-list/modal-list';
//import { timestamp } from 'rxjs/operator/timestamp';


@Component({
   selector: 'page-edit-alphabet',
   templateUrl: 'edit-alphabet.html',
   styleUrl: 'edit-alphabet.scss'
})
export class EditAlphabetPage {
   public pageName: string = "Edit Alphabets";
   public database_misc: SQLiteDBConnection | null = null;
   editAlphabets: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   private onPauseSubscription: Subscription;

   constructor(public navCtrl: NavController, public modalCtrl: ModalController, public platform: Platform, private alertCtrl: AlertController, public progress: LoadingController, public storage: Storage, public helpers: Helpers, public ngZone: NgZone, public changeDetector: ChangeDetectorRef) {
      console.log("EDIT ALPHABET CONSTRUCTOR CALLED.");
      this.onPauseSubscription = this.platform.pause.subscribe(() => {
         this.saveStorage();
      });
   }

   ngOnDestroy() {
      console.log("ngOnDestroy called");
      this.saveStorage();
      this.onPauseSubscription.unsubscribe();
   }

   async ngOnInit() {
      this.editAlphabets = {};
      Helpers.currentPageName = this.pageName;
      this.editAlphabets.placeholder = "Please select table before editing.";
      this.editAlphabets.user = Helpers.User;
      await this.storage.create();
      console.log("SET this.editAlphabets.user = " + JSON.stringify(this.editAlphabets.user));
      this.editAlphabets.total_entries = 0;
      this.editAlphabets.index = 0;
      this.editAlphabets.saved_id = 0;
      this.editAlphabets.alp = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      this.editAlphabets.alp_complete_text = [];
      var getOld: myObject = {};
      this.editAlphabets.getOld = getOld;
      this.editAlphabets.showInsertions = null;
      this.editAlphabets.letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
      this.editAlphabets.alphabetInput = "";
      this.editAlphabets.dontShow = false;
      this.editAlphabets.selectedTable = null;
      this.editAlphabets.selectedLetter = this.editAlphabets.letters[0];
      this.editAlphabets.tables = [];
      this.editAlphabets.categories = [];
      this.editAlphabets.inputTable = "";
      this.editAlphabets.selectedCategoryTable = null;
      this.editAlphabets.categoryTables = [];
      this.editAlphabets.selectedAction = "INSERT";
      var val: any = await this.storage.get('EDIT_ALPHABET_LETTER');
      if (val != null) {
         this.editAlphabets.selectedLetter = val;
         console.log("FROM STORAGE: EDIT_ALPHABET_LETTER, SET this.editAlphabets.selectedLetter=" + this.editAlphabets.selectedLetter);
      }
      val = await this.storage.get('EDIT_ALPHABET_DONT_SHOW');
      if (val != null) {
         this.editAlphabets.dontShow = val;
      }
      val = await this.storage.get('EDIT_ALPHABET_SELECTED_ACTION');
      if (val != null) {
         this.editAlphabets.selectedAction = val;
      }
      this.database_misc = this.helpers.getDatabaseMisc();
      val = await this.storage.get('EDIT_ALPHABET_SELECTED_TABLE');
      if (val != null) {
         this.editAlphabets.selectedTable = JSON.parse(val);
         console.log("FROM STORAGE, EDIT_ALPHABET_SELECTED_TABLE, SET this.editAlphabets.selectedTable=" + this.editAlphabets.selectedTable);
      }
      this.background_color = Helpers.background_color;
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;
      this.editAlphabets.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor: any) => {
         this.background_color = bgColor;
      });
      this.editAlphabets.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor: any) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
      });
      this.helpers.dismissProgress();
      await this.loadSelectedAdjectives(false);
      console.log("INIT BACK FROM loadSelectedAdjectives, this.editAlphabets.selectedTable= " + this.editAlphabets.selectedTable + ", this.editAlphabets.selectedLetter=" + this.editAlphabets.selectedLetter);
      if (this.editAlphabets.selectedTable != null && this.editAlphabets.selectedLetter != null) {
         await this.getAlphabets(this.editAlphabets.selectedTable.Table_name, this.editAlphabets.selectedLetter, "get", true);
         this.changeDetector.detectChanges();
         this.helpers.dismissProgress();
      } else {
         this.changeDetector.detectChanges();
         this.helpers.dismissProgress();
      }
   }

   ionViewWillLeave() {
      console.log('ionViewWillLeave EditAlphabetPage, this.editAlphabets.selectedTable=' + this.editAlphabets.selectedTable + ", this.editAlphabets.selectedLetter=" + this.editAlphabets.selectedLetter);
      this.editAlphabets.subscribedBackgroundColorEvent.unsubscribe();
      this.editAlphabets.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   async saveStorage() {
      await this.storage.set('EDIT_ALPHABET_LETTER', this.editAlphabets.selectedLetter);
      await this.storage.set('EDIT_ALPHABET_DONT_SHOW', this.editAlphabets.dontShow);
      await this.storage.set('EDIT_ALPHABET_SELECTED_ACTION', this.editAlphabets.selectedAction);
      await this.storage.set('EDIT_ALPHABET_SELECTED_TABLE', JSON.stringify(this.editAlphabets.selectedTable));
   }

   doEditAlphabet(selectedTable: any, letter: any, entry: any) {
      console.log("doEditAlphabet called, selectedTable = " + JSON.stringify(this.editAlphabets.selectedTable));
      var table = selectedTable.Table_name;
      if (!this.editAlphabets.selectedAction) {
         this.helpers.myAlert("ALERT", "<b>No action selected. Please choose 'Insert', 'Delete' or 'Edit'.</b>", "", "Dismiss");
         return;
      }
      if (!table || String(table).trim() === '') {
         this.helpers.myAlert("ALERT", "<b>No table selected.</b>", "", "Dismiss");
         return;
      }
      if (!letter || String(letter).trim() === '') {
         this.helpers.myAlert("ALERT", "<b>No letter selected.</b>", "", "Dismiss");
         return;
      }
      if (this.editAlphabets.selectedAction == "INSERT" && (!entry || String(entry).trim() === '')) {
         this.helpers.myAlert("ALERT", "<b>No entry entered.</b>", "", "Dismiss");
         return;
      }
      if (this.editAlphabets.selectedAction == "INSERT") {
         this.insertAlphabet(selectedTable, letter, entry);
      } else if (this.editAlphabets.selectedAction == "DELETE") {
         this.deleteAlphabet(selectedTable, letter, entry);
      } else if (this.editAlphabets.selectedAction == "EDIT") {
         this.updateAlphabet(selectedTable, letter, entry);
      }
   }


   insertAlphabet(selectedTable: any, letter: any, entry: any) {
      console.log("insertAlphabet called");
      this.helpers.setProgress("Checking if exists", false).then(() => {
         var checkWheres = {
            "user_id": Helpers.User.ID,
            "table_id": selectedTable.Table_ID,
            "letter": letter,
            "entry": entry,
         }
         this.helpers.insertCheckExists(DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.alphabet, checkWheres).then((isExists: boolean) => {
            if (isExists) {
               this.editAlphabets.results = "Entry already exists. Not inserted.";
               this.helpers.myAlert("ALERT", "<b>Entry already exists. Not inserted.</b>", "", "Dismiss");
               this.helpers.dismissProgress();
               return;
            }
            var cols = ["User_ID", "Table_ID", "Entry", "Letter"];
            var vals = [[Helpers.User.ID, selectedTable.Table_ID, entry, letter]];
            this.helpers.setProgress("Inserting entry, please wait...", true).then(() => {
               var wheres: any = { "User_ID": Helpers.User.ID, "Table_ID": selectedTable.Table_ID, "Letter": letter, "Entry": entry };
               var names: any = { "Table": selectedTable.Table_name, "Letter": letter };
               var entry: any = { "Entry": entry };
               //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
               var queries = [new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.alphabet, Op_Type_ID.INSERT, cols, vals, wheres)];
               //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
               this.helpers.autoSync(queries, Op_Type_ID.INSERT, null, names, {}, entry).then((res) => {
                  this.helpers.dismissProgress();
                  if (res.isSuccess) {
                     this.editAlphabets.editResults = "Results: Inserted into adjective's, " + selectedTable.Table_name + ", sync results:" + res.results;
                     if (this.editAlphabets.index != 0) {
                        this.editAlphabets.index++;
                     }
                     this.getAlphabets(selectedTable.Table_name, letter, "get", true).then(() => {
                        this.helpers.dismissProgress();
                     });
                  } else {
                     this.editAlphabets.results = "Sorry. Error inserting alphabet entry:" + res.results;
                     this.helpers.dismissProgress();
                  }
               });
            });
         });
      });
   }

   deleteAlphabet(selectedTable: any, letter: any, entry: any) {
      console.log("deleteAlphabet called, selectedTable = " + JSON.stringify(selectedTable));
      this.helpers.setProgress("Deleting entry of table " + selectedTable.Table_name + ", letter " + letter + ", please wait...", false).then(() => {
         var wheres = { "User_ID": this.editAlphabets.getOld.User_ID, "Table_ID": selectedTable.Table_ID, "Letter": letter, "Entry": this.editAlphabets.getOld.Entry };
         var names = { "Table": selectedTable.Table_name, "Letter": letter };
         var entry_old = { "Entry": this.editAlphabets.getOld.Entry };
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         var queries = [new SyncQuery(null, this.editAlphabets.getOld.User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.alphabet, Op_Type_ID.DELETE, [], [], wheres)];
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, Op_Type_ID.DELETE, this.editAlphabets.getOld.User_ID, names, entry_old, {}).then((res) => {
            if (res.isSuccess === true) {
               this.editAlphabets.editResults = "RESULTS: Deleted from : " + selectedTable.Table_name + " where letter is " + letter + " and entry is: " + this.editAlphabets.getOld.Entry + ". " + res.results;
               if (this.editAlphabets.index > 0) {
                  this.editAlphabets.index--;
               }
               this.helpers.myAlert("SUCCESS", "<b>" + this.editAlphabets.editResults + "</b>", "", "Dismiss");
               this.getAlphabets(selectedTable.Table_name, letter, "get", true).then(() => {
                  this.helpers.dismissProgress();
               });
            } else {
               console.log("ERROR:" + res.results);
               this.editAlphabets.editResults = "Sorry. Error deleting alphabet:" + res.results;
               this.helpers.myAlert("ERROR", "<b>" + this.editAlphabets.editResults + "</b>", "", "Dismiss");
               this.helpers.dismissProgress();
            }
         });
      });
   }

   updateAlphabet(selectedTable: any, letter: any, entry: any) {
      console.log("editAlphabet called, table=" + selectedTable.Table_name + ", letter=" + letter + ", entry=" + entry);
      this.helpers.setProgress("Editting entry of table " + selectedTable.Table_name + ", letter " + letter + ", please wait...", false).then(() => {
         var cols = ["Entry"];
         var vals = [entry];
         var wheres = { "Table_ID": selectedTable.Table_ID, "Letter": letter, "Entry": this.editAlphabets.getOld.Entry };
         var name = { "Table": selectedTable.Table_name, "Letter": letter };
         var newEntry: any = {};
         var oldEntry: any = {};
         newEntry.Entry = entry;
         oldEntry.Entry = this.editAlphabets.getOld.Entry;
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         var queries = [new SyncQuery(null, this.editAlphabets.getOld.User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.alphabet, Op_Type_ID.UPDATE, cols, vals, wheres, User_Action_Request.USER_ID_UPDATE)];
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, Op_Type_ID.UPDATE, this.editAlphabets.getOld.User_ID, name, oldEntry, newEntry).then((res) => {
            if (res.isSuccess === true) {
               this.helpers.dismissProgress();
               this.editAlphabets.editResults = "RESULTS: Updated " + selectedTable.Table_name + "'s letter," + letter + ". " + res.results;
               var is_request = this.editAlphabets.getOld.User_ID != null && parseInt(Helpers.User.ID) !== parseInt(String(this.editAlphabets.getOld.User_ID));
               if (is_request === false) {
                  this.editAlphabets.getOld.Entry = entry;
               }
            } else {
               this.helpers.dismissProgress();
               this.editAlphabets.editResults = "RESULTS: Update " + selectedTable.Table_name + ", letter " + letter + " error: " + res.results;
            }
         });
      });
   }

   checkCategorySelected(): boolean {
      console.log("checkCategoryTableSelected called");
      if (!this.editAlphabets.selectedCategory || String(this.editAlphabets.selectedCategory).trim() === '') {
         this.helpers.myAlert("ALERT", "<b>No category selected.</b>", "", "Dismiss");
         return false;
      }
      return true;
   }

   async deleteTable(): Promise<any> {
      console.log("deleteTable called");
      if (!this.checkCategorySelected()) {
         return false;
      }
      if (!this.editAlphabets.selectedCategoryTable || !this.editAlphabets.selectedCategoryTable.Table_name || String(this.editAlphabets.selectedCategoryTable.Table_name).trim() === '') {
         this.helpers.myAlert("ALERT", "<b>No category table selected.</b>", "", "Dismiss");
         return false;
      }
      var self = this;
      let alert = await this.alertCtrl.create({
         header: "Are you sure you want to delete table, " + this.editAlphabets.selectedCategoryTable.Table_name + "?",
         buttons: [
            {
               text: 'Cancel',
               cssClass: 'cancelButton',
               handler: () => {
                  console.log('Dismiss delete table called.');
                  return true;
               }
            },
            {
               text: 'Continue',
               cssClass: 'confirmButton',
               handler: () => {
                  console.log('Continue delete table called.');
                  self.doDeleteTable();
                  return true;
               }
            }
         ]
      });
      await alert.present();
   }

   doDeleteTable() {
      console.log("doDeleteTable called");
      var category = this.editAlphabets.selectedCategory;
      var table = this.editAlphabets.selectedCategoryTable.Table_name;
      var self = this;

      this.helpers.setProgress("Dropping table " + + " of category " + category + ", please wait...", false).then(() => {
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         var queries = [
            new SyncQuery(null, this.editAlphabets.selectedCategoryTable.User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.alphabet, Op_Type_ID.DELETE, [], [], { "Table_ID": this.editAlphabets.selectedCategoryTable.Table_ID }),
            new SyncQuery(null, this.editAlphabets.selectedCategoryTable.User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.alphabet_table, Op_Type_ID.DELETE, [], [], { "Category": category, "Table_name": table })
         ];
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, Op_Type_ID.DELETE, this.editAlphabets.selectedCategoryTable.User_ID, { "Category": category, "Table": table }, null, null).then((res) => {
            if (res.isSuccess) {
               var text = "";
               text = "Deleted table " + table + ". ";
               this.editAlphabets.results = text + "<br />" + res.results;
               this.helpers.myAlert("SUCCESS", "<b>" + this.editAlphabets.results + "</b>", "", "Dismiss");
               var self = this;
               this.loadSelectedAdjectives(true).then(function () {
                  self.helpers.dismissProgress();
               });
            } else {
               console.log("ERROR:" + res.results);
               this.editAlphabets.results = "Sorry. Error deleting table. " + res.results;
               this.helpers.myAlert("ERROR", "<b>" + this.editAlphabets.results + "</b>", "", "Dismiss");
               this.helpers.dismissProgress();
            }
         });
      });
   }

   insertTable() {
      console.log("insertTable called, category=" + this.editAlphabets.selectedCategory + ", table=" + this.editAlphabets.selectedCategoryTable.Table_name);
      if (!this.checkCategorySelected()) {
         return;
      }
      if (!this.editAlphabets.inputTable || String(this.editAlphabets.inputTable).trim() === '') {
         this.helpers.myAlert("ALERT", "<b>No table entered.</b>", "", "OK");
         return;
      }
      var category = this.editAlphabets.selectedCategory;
      var table = this.editAlphabets.inputTable
      this.helpers.setProgress("Inserting table " + table + " for category " + category + ", please wait...", false).then(() => {
         var checkWheres = {
            "Category": category,
            "Table_Name": table
         }
         this.helpers.insertCheckExists(DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.alphabet_table, checkWheres).then((isExists) => {
            if (isExists) {
               this.helpers.dismissProgress();
               this.helpers.myAlert("ALERT", "<b>The category, " + category + ", and table, " + table + ", already exists.</b>", "", "OK");
               return;
            }
            var cols = ["Category", "Table_name", "User_ID", "Is_Complete"];
            var vals = [[category, table, Helpers.User.ID, "0"]];
            // SYNC TO LFQ:
            //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
            var queries = [new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.alphabet_table, Op_Type_ID.INSERT, cols, vals, { "Category": category, "Table_name": table })];
            //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
            this.helpers.autoSync(queries, Op_Type_ID.INSERT, null, { "Category": category, "Table_name": table }, null, null).then((res) => {
               if (res.isSuccess === true) {
                  var text = "";
                  text = "Inserted new table " + table + " into " + category + ". ";
                  this.editAlphabets.results = text + "<br />" + res.results;
                  this.helpers.myAlert("SUCCESS", "<b>" + this.editAlphabets.results + "</b>", "", "Dismiss");
                  this.loadSelectedAdjectives(true).then(() => {
                     this.helpers.dismissProgress();
                  });
               } else {
                  console.log("ERROR:" + res.results);
                  this.editAlphabets.results = "Sorry. Error inserting table.<br />" + res.results;
                  this.helpers.myAlert("ERROR", "<b>" + this.editAlphabets.results + "</b>", "", "Dismiss");
                  this.helpers.dismissProgress();
               }
            });
         });
      });
   }

   loadSelectedAdjectives(isDoingProgress: boolean): Promise<void> {
      console.log("loadSelectedAdjectives called");
      return new Promise((resolve, reject) => {
         this.helpers.setProgress("Loading adjective tables ,please wait...", isDoingProgress).then(() => {
            this.editAlphabets.tables = [];
            if (Helpers.isWorkOffline === false) {
               this.helpers.makeHttpRequest("/lfq_directory/php/edit_alphabet_get_all_tables.php", "GET", null).then((data) => {
                  if (data["SUCCESS"] === true) {
                     if (data["TABLES"].length > 0) {
                        this.editAlphabets.tables = data["TABLES"];
                        if (this.editAlphabets.selectedTable == null) {//IF NOT SAVED:
                           this.editAlphabets.selectedTable = this.editAlphabets.tables[0];
                        }
                     } else {
                        this.editAlphabets.result = "nothing found";
                     }
                     this.editAlphabets.categories = data["TABLES"].map((obj: any) => { return obj.Category }).filter(this.helpers.onlyUnique);
                     this.editAlphabets.selectedCategory = this.editAlphabets.categories[0];
                     //this.editAlphabets.selectedCategoryTable = this.editAlphabets.categories[0];
                     this.getCategoryTables(this.editAlphabets.categories[0], true).then(() => {
                        this.helpers.dismissProgress();
                        resolve();
                     });
                  } else {
                     this.helpers.dismissProgress();
                     this.helpers.alertLfqError(data["ERROR"]);
                     resolve();
                  }
               }, error => {
                  console.log("ERROR:" + error.message);
                  this.helpers.dismissProgress();
                  this.editAlphabets.results = "Sorry. Error loading alphabet tables: " + error.message;
                  this.helpers.alertServerError(error.message);
                  resolve();
               });
            } else {
               var sql = "SELECT at.User_ID, at.ID AS Table_ID, at.Table_name, at.Category, at.Is_Complete, ud.Username ";
               sql += "FROM " + Helpers.TABLES_MISC.alphabet_table + " AS at ";
               sql += "LEFT JOIN " + Helpers.TABLES_MISC.userdata + " AS ud ON ud.ID=at.User_ID ";
               sql += "ORDER BY at.Category, at.Table_name";
               this.helpers.query(this.database_misc, sql, 'query', []).then((data) => {
                  console.log("Number tables=" + data.values.length);
                  if (data.values.length > 0) {
                     this.editAlphabets.tables = [];
                     for (var i = 0; i < data.values.length; i++) {
                        this.editAlphabets.tables.push(data.values[i]);
                     }
                     if (this.editAlphabets.selectedTable == null) {//IF NOT SAVED:
                        this.editAlphabets.selectedTable = this.editAlphabets.tables[0];
                     }
                  } else {
                     this.editAlphabets.result = "nothing found";
                  }
                  sql = "SELECT DISTINCT Category FROM " + Helpers.TABLES_MISC.alphabet_table + " ORDER BY Category";
                  this.helpers.query(this.database_misc, sql, 'query', []).then((data) => {
                     console.log("# Categories=" + data.values.length);
                     this.editAlphabets.categories = [];
                     if (data.values.length > 0) {
                        for (var i = 0; i < data.values.length; i++) {
                           this.editAlphabets.categories.push(data.values[i].Category);
                        }
                        this.editAlphabets.selectedCategory = this.editAlphabets.categories[0];
                        this.getCategoryTables(this.editAlphabets.categories[0], true).then(() => {
                           this.helpers.dismissProgress();
                           resolve();
                        });
                     } else {
                        this.helpers.dismissProgress();
                        resolve();
                     }
                  }).catch((error) => {
                     console.log("sql:" + sql + ", ERROR:" + error.message);
                     this.helpers.dismissProgress();
                     this.editAlphabets.results = "Sorry. Error loading adjectives.";
                     resolve();
                  });
               }).catch((error) => {
                  console.log("sql:" + sql + ", ERROR:" + error.message);
                  this.helpers.dismissProgress();
                  this.editAlphabets.results = "Sorry. Error loading adjectives.";
                  resolve();
               });
            }
         });
      });
   }

   doGetCategoryTables(category: any, isDoingProgress: boolean) {
      this.getCategoryTables(category, isDoingProgress).then(() => {
         this.helpers.dismissProgress();
      });
   }

   getCategoryTables(category: any, isDoingProgress: boolean): Promise<void> {
      console.log('getCategoryTables called.');
      return new Promise((resolve, reject) => {
         this.helpers.setProgress("Getting Category tables for category " + category + " ,please wait...", isDoingProgress).then(() => {
            if (Helpers.isWorkOffline == false) {
               var params = {
                  "category": category
               };
               this.helpers.makeHttpRequest("/lfq_directory/php/edit_alphabet_get_category_tables.php", "GET", params).then((data) => {
                  this.helpers.dismissProgress();
                  if (data["SUCCESS"] === true) {
                     this.editAlphabets.categoryTables = data["TABLES"];
                     this.finishGetCategoryTables();
                     resolve();
                  } else {
                     this.helpers.dismissProgress();
                     this.helpers.alertLfqError(data["ERROR"]);
                     resolve();
                  }
               }, error => {
                  console.log("ERROR:" + error.message);
                  this.editAlphabets.results = "Sorry. Error loading category tables: " + error.message;
                  this.helpers.alertServerError(error.message);
                  resolve();
               });
            } else {
               var sql = "SELECT a.ID as Table_ID, a.Table_name,a.User_ID,ud.Username FROM ";
               sql += Helpers.TABLES_MISC.alphabet_table + " AS a ";
               sql += "LEFT JOIN " + Helpers.TABLES_MISC.userdata + " AS ud ON ud.ID=a.User_ID ";
               sql += "WHERE a.Category='" + category + "' ORDER BY a.Table_name";
               this.helpers.query(this.database_misc, sql, 'query', []).then((data) => {
                  this.helpers.dismissProgress();
                  this.editAlphabets.categoryTables = [];
                  if (data.values.length > 0) {
                     for (var i = 0; i < data.values.length; i++) {
                        this.editAlphabets.categoryTables.push(data.values[i]);
                     }
                  }
                  this.finishGetCategoryTables();
                  resolve();
               }).catch((error) => {
                  this.helpers.dismissProgress();
                  console.log("sql:" + sql + ", ERROR:" + error.message);
                  this.editAlphabets.results = "Sorry. Error loading category tables.";
                  resolve();
               });
            }
         });
      });
   }

   finishGetCategoryTables() {
      console.log("finishGetCategoryTables called");
      if (this.editAlphabets.categoryTables.length > 0) {
         this.editAlphabets.selectedCategoryTable = this.editAlphabets.categoryTables[0];
         console.log("get_tables this.editAlphabets.selectedCategoryTable = " + JSON.stringify(this.editAlphabets.selectedCategoryTable));
      }
      var showUsername = "No-User";
      this.editAlphabets.categoryTables.forEach((tbl: any) => {
         showUsername = tbl.Username != null ? tbl.Username : "No-User";
         tbl.showOption = tbl.Table_name + " <<i>" + showUsername + "</i>>";
      });
   }

   displayCompleteLetters(isDoingProgress: boolean): Promise<void> {
      console.log("displayCompleteLetters called");
      return new Promise((resolve, reject) => {
         if (this.editAlphabets.dontShow === true) {
            resolve();
         } else {
            this.helpers.setProgress("Loading not completed letters, please wait...", isDoingProgress).then(() => {
               if (Helpers.isWorkOffline === false) {
                  var params = {
                     table: this.editAlphabets.selectedTable.Table_name
                  };
                  console.log("this.editAlphabet.selectedCategoryTable=" + JSON.stringify(this.editAlphabets.selectedCategoryTable));
                  this.helpers.makeHttpRequest("/lfq_directory/php/edit_alphabet_get_incomplete_letters.php", "GET", params).then((data) => {
                     if (data["SUCCESS"] === true) {
                        if (data["INCOMPLETE_ABCS"].length === 0) {
                           this.editAlphabets.showInsertions = "ALL COMPLETE.";
                        } else {
                           this.editAlphabets.showInsertions = data["INCOMPLETE_ABCS"].join("") + " ARE INCOMPLETE.";
                        }
                        resolve();
                     } else {
                        this.helpers.alertLfqError(data["ERROR"]);
                        resolve();
                     }
                  }, error => {
                     console.log("ERROR:" + error.message);
                     this.editAlphabets.showInsertions = "Sorry. Error loading completed letters: " + error.message;
                     this.helpers.alertServerError(error.message);
                     resolve();
                  });
               } else {
                  this.editAlphabets.alp_complete_text = this.editAlphabets.alp.split("");
                  console.log("displayCompleteLetters called, alp_complete_text=" + this.editAlphabets.alp_complete_text);
                  var sql = "SELECT DISTINCT a.Letter FROM " + Helpers.TABLES_MISC.alphabet + " AS a ";
                  sql += "INNER JOIN " + Helpers.TABLES_MISC.alphabet_table + " AS at ON at.ID=a.Table_ID ";
                  sql += "WHERE at.Table_name='" + this.editAlphabets.selectedTable.Table_name + "' ORDER BY a.Letter"
                  this.helpers.query(this.database_misc, sql, 'query', []).then((data) => {
                     console.log("# DISTINCT LETTERS=" + data.values.length);
                     if (data.values.length > 0) {
                        for (var i = 0; i < data.values.length; i++) {
                           this.editAlphabets.alp_complete_text.splice(this.editAlphabets.alp_complete_text.indexOf(data.values[i].Letter), 1);
                        }
                     }
                     if (this.editAlphabets.alp_complete_text.length === 0) {
                        this.editAlphabets.showInsertions = "ALL COMPLETE.";
                     } else {
                        this.editAlphabets.showInsertions = this.editAlphabets.alp_complete_text.join("") + " ARE INCOMPLETE.";
                     }
                     resolve();
                  }).catch((error) => {
                     console.log("sql:" + sql + ", ERROR:" + error.message);
                     this.editAlphabets.showInsertions = "Sorry. Error loading completed letters.";
                     resolve();
                  });
               }
            });
         }
      });
   }

   doGetAlphabets(table: any, letter: any, opt: any, isDoingProgress: boolean) {
      this.getAlphabets(table, letter, opt, isDoingProgress).then(() => {
         console.log("getAlphabets RESOLVED!!!");
         this.helpers.dismissProgress();
      });
   }

   async showAlphabetTables() {
      console.log("showSuggestedWords called");
      this.editAlphabets.total_entries = 0;
      var itemRet: any = {};
      var items: any = this.editAlphabets.tables.map((table: any) => {
         itemRet = { "name": table.Table_name };
         return itemRet;
      });
      let myModal = await this.modalCtrl.create(
         {
            component: ModalListPage,
            componentProps:
            {

               "items": items,
               "title": "Alphabet Tables"
            }
         }
      );
      // Handle the result
      myModal.onDidDismiss().then((selectedItem: any) => {
         if (selectedItem) {
            console.log("SELECTED selectedItem:" + JSON.stringify(selectedItem));
            //{"data":{"selectedItem":{"name":"brown"}}}
            var item = selectedItem.data;

            this.editAlphabets.selectedTable = this.editAlphabets.tables.filter((table: any) => { return table.Table_name === item.name; })[0];
            this.doGetAlphabets(this.editAlphabets.selectedTable.Table_name, this.editAlphabets.selectedLetter, "get", false);
         }
      });
      // Show the modal
      await myModal.present();
   }

   getAlphabets(table: any, letter: any, opt: any, isDoingProgress: boolean): Promise<void> {
      console.log("getAlphabets called, opt = " + opt + ", table=" + table + ", letter=" + letter);
      this.editAlphabets.placeholder = "Enter alphabet mnemonic to category " + table + ", letter " + letter + " here."
      return new Promise((resolve, reject) => {
         //this.total_entries = 0;
         //opt= ""(GET CURRENT), "get_next"(GET NEXT), "get_last"(GET LAST)
         var opt_prompt = "";
         if (opt === "get") {
            this.editAlphabets.index = 0;
         } else if (opt === "next" || opt === "last") {
            opt_prompt = opt + " ";
         }
         this.editAlphabets.showInsertions = null;
         var id: any = null;
         if (opt === "last" || opt === "next") {
            id = this.editAlphabets.saved_id;
         }
         this.helpers.setProgress("Loading " + opt_prompt + "entry for table " + table + ", letter " + letter + ", please wait...", isDoingProgress).then(() => {
            if (Helpers.isWorkOffline === false) {
               var params = {
                  "table": table,
                  "letter": letter,
                  "action": opt,
                  "id": id
               };
               this.helpers.makeHttpRequest("/lfq_directory/php/edit_alphabet_get_letter.php", "GET", params).then((data) => {
                  if (data["SUCCESS"] === true) {
                     var myData = data;
                     if (opt !== "get" && data["COUNT"] === 0) {
                        myData = null;
                     }
                     this.finishGetAlphabetLetter(opt, table, letter, myData);
                     this.displayCompleteLetters(true).then(() => {
                        resolve();
                     });
                  } else {
                     this.helpers.alertLfqError(data["ERROR"]);
                     resolve();
                  }
               }, error => {
                  console.log("ERROR:" + error.message);
                  this.editAlphabets.showInsertions = "Sorry. Error getting alphabet entries: " + error.message;
                  this.helpers.alertServerError(error.message);
                  this.displayCompleteLetters(true).then(() => {
                     resolve();
                  });
               });
            } else {
               var sql = "";
               var sql_total = "SELECT COUNT(a.ID) FROM " + Helpers.TABLES_MISC.alphabet + " AS a ";
               sql_total += "INNER JOIN " + Helpers.TABLES_MISC.alphabet_table + " AS at ON at.ID=a.Table_ID ";
               sql_total += "WHERE at.Table_name='" + table + "' AND a.Letter='" + letter + "'";
               if (opt == "get") {
                  sql = "SELECT a.*,at.Table_name,ud.Username, (" + sql_total + ") AS TOTAL FROM ";
                  sql += Helpers.TABLES_MISC.alphabet + " AS a ";
                  sql += "INNER JOIN " + Helpers.TABLES_MISC.alphabet_table + " AS at ON at.ID=a.Table_ID ";
                  sql += "LEFT JOIN " + Helpers.TABLES_MISC.userdata + " AS ud ON ud.ID=a.User_ID ";
                  sql += "WHERE at.Table_name='" + table + "' AND a.Letter='" + letter + "' ";
                  sql += "ORDER BY a.ID LIMIT 1";
               } else if (opt == "last") {
                  var sql_count = "SELECT COUNT(a.ID) FROM " + Helpers.TABLES_MISC.alphabet + " AS a ";
                  sql_count += "INNER JOIN " + Helpers.TABLES_MISC.alphabet_table + " AS at ON at.ID=a.Table_ID ";
                  sql_count += "WHERE at.Table_name='" + table + "' AND a.Letter='" + letter + "' AND a.ID<'" + id + "'";
                  sql = "SELECT a.*,at.Table_name,ud.Username, (" + sql_total + ") AS TOTAL, (" + sql_count + ") AS COUNT FROM ";
                  sql += Helpers.TABLES_MISC.alphabet + " AS a ";
                  sql += "INNER JOIN " + Helpers.TABLES_MISC.alphabet_table + " AS at ON at.ID=a.Table_ID ";
                  sql += "LEFT JOIN " + Helpers.TABLES_MISC.userdata + " AS ud ON ud.ID=a.User_ID ";
                  sql += "WHERE at.Table_name='" + table + "' AND a.Letter='" + letter + "' AND a.ID<'" + id + "' ";
                  sql += "ORDER BY a.ID DESC LIMIT 1";
               } else if (opt == "next") {
                  var sql_count = "SELECT COUNT(a.ID) FROM ";
                  sql_count += Helpers.TABLES_MISC.alphabet + " AS a ";
                  sql_count += "INNER JOIN " + Helpers.TABLES_MISC.alphabet_table + " AS at ON at.ID=a.Table_ID ";
                  sql_count += "WHERE at.Table_name='" + table + "' AND a.Letter='" + letter + "' AND a.ID>'" + id + "'";
                  sql = "SELECT a.*,at.Table_name,ud.Username, (" + sql_total + ") AS TOTAL, (" + sql_count + ") AS COUNT FROM ";
                  sql += Helpers.TABLES_MISC.alphabet + " AS a ";
                  sql += "INNER JOIN " + Helpers.TABLES_MISC.alphabet_table + " AS at ON at.ID=a.Table_ID ";
                  sql += "LEFT JOIN " + Helpers.TABLES_MISC.userdata + " AS ud ON ud.ID=a.User_ID ";
                  sql += "WHERE at.Table_name='" + table + "' AND a.Letter='" + letter + "' AND a.ID>'" + id + "' ";
                  sql += "ORDER BY a.ID LIMIT 1";
               }
               console.log("SQL =" + sql);
               //var sql = "SELECT COUNT(*), * FROM ID,Entry,Username FROM alphabet WHERE Table_name='" + table + "' AND Letter='" + letter + "' ORDER BY ID";
               this.helpers.query(this.database_misc, sql, 'query', []).then((data) => {
                  var myData = null;
                  if (data.values.length > 0) {
                     myData = data.values[0];
                  }
                  this.finishGetAlphabetLetter(opt, table, letter, myData);
                  this.displayCompleteLetters(true).then(() => {
                     resolve();
                  });
               }).catch((error) => {
                  console.log("sql:" + sql + ", ERROR:" + error.message);
                  this.editAlphabets.showInsertions = "Sorry. Error getting alphabet entries.";
                  this.displayCompleteLetters(true).then(() => {
                     resolve();
                  });
               });
            }
         });
      });
   }

   finishGetAlphabetLetter(opt: any, table: any, letter: any, data: any) {
      if (data) {
         console.log("finishGetAlphabetLetter called, data=" + JSON.stringify(data));
         this.editAlphabets.total_entries = data["TOTAL"];
         this.editAlphabets.getOld = Object.assign({}, data);
         if (this.editAlphabets.total_entries > 0) {
            var isShowResults = true;
            if (opt === "get") {
               this.editAlphabets.index = 1;
            }
            else if (opt === "last" || opt === "next") {
               console.log('data["COUNT"]=' + data["COUNT"]);
               if (data["COUNT"] > 0) {
                  if (opt === "last") {
                     this.editAlphabets.index = data["COUNT"];
                  } else if (opt === "next") {
                     this.editAlphabets.index = this.editAlphabets.total_entries - data["COUNT"] + 1;
                  }
               } else {
                  this.editAlphabets.results = data["Username"] + "'S ENTRY " + this.editAlphabets.index + " OF " + this.editAlphabets.total_entries + " TOTAL. NO " + opt.toUpperCase() + " ENRTY.";
                  this.editAlphabets.editResults = "RESULTS: doesn't exist.";
                  isShowResults = false;
               }
            }
            if (isShowResults) {
               console.log("this.index=" + this.editAlphabets.index);
               this.editAlphabets.saved_id = data.ID;
               this.editAlphabets.savedEntry = data.Entry;
               this.editAlphabets.alphabetInput = data.Entry;
               this.editAlphabets.results = "Entry " + this.editAlphabets.index + " OF " + this.editAlphabets.total_entries + " TOTAL.";
               this.editAlphabets.editResults = "RESULTS: got alliterations of letter=" + letter + " for adjective=" + table;
            }
         } else {
            this.editAlphabets.results = "Entry 0 OF 0 Total.";
            this.editAlphabets.editResults = "RESULTS: NO RESULTS FOR letter=" + letter + " , adjective=" + table;
            this.editAlphabets.alphabetInput = "";
         }
      } else {///IF DATA IS NULL:
         if (opt === "get") {
            this.editAlphabets.results = "<b>RESULTS: doesn't exist.</b>";
            this.editAlphabets.editResults = "";
            this.editAlphabets.alphabetInput = "";
         } else {
            this.editAlphabets.results = "Entry " + this.editAlphabets.index + " OF " + this.editAlphabets.total_entries + " TOTAL. NO " + opt.toUpperCase() + " ENRTY.";
            this.editAlphabets.editResults = "RESULTS: doesn't exist.";
         }
      }
   }

}

interface myObject {
   [key: string]: any;
}

