import { Component, ChangeDetectorRef, Query } from '@angular/core';
import { NavController, NavParams, Platform, LoadingController, AlertController } from '@ionic/angular';
//import { SQLiteObject } from '@ionic-native/sqlite';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';

//import { Storage } from '@ionic/storage';
import { Storage } from '@ionic/storage-angular';

import { DB_Type_ID, Helpers, Op_Type, Op_Type_ID, SyncQuery, User_Action_Request } from '../../providers/helpers/helpers';
import { NgZone } from '@angular/core';
//import { Camera, CameraOptions } from '@ionic-native/camera';
import { Camera, CameraResultType } from '@capacitor/camera';

import { Subscription } from 'rxjs';
//import { HTTP } from '@ionic-native/http';
//import * as $ from "jquery";
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
   selector: 'edit-acrostics',
   templateUrl: 'edit-acrostics.html',
   styleUrl: 'edit-acrostics.scss'
})
export class EditAcrosticsPage {
   public pageName: string = "Edit Acrostics";
   public database_misc: SQLiteDBConnection;
   public database_acrostics: SQLiteDBConnection;
   progressLoader: any;
   editAcrostics: any;
   inputs: any;
   saveEnterdAcrosticLength: number = 0;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   private onPauseSubscription: Subscription;
   savedAcrostic: any;
   //private camera: Camera
   //private nativeHttp: HTTP, 
   constructor(public navCtrl: NavController, private alertCtrl: AlertController, public progress: LoadingController, private platform: Platform, public storage: Storage, public helpers: Helpers, public ngZone: NgZone, public changeDet: ChangeDetectorRef, private formBuilder: FormBuilder) {
      //this.app.getActiveNav()._setComponentName();

      console.log("EDIT ACROSTICS CONSTRUCTOR CALLED.");
      this.onPauseSubscription = this.platform.pause.subscribe(() => {
         this.saveStorage();
      });
      this.database_acrostics = this.helpers.getDatabaseAcrostics();
      this.database_misc = this.helpers.getDatabaseMisc();
   }

   ngOnDestroy() {
      console.log("ngOnDestroy called");
      this.saveStorage();
      this.onPauseSubscription.unsubscribe();
   }

   async ngOnInit() {
      this.saveEnterdAcrosticLength = 0;
      this.editAcrostics = {};
      Helpers.currentPageName = this.pageName;
      this.editAcrostics.user = Helpers.User;
      await this.storage.create();
      this.editAcrostics.getOld = null;
      this.editAcrostics.isDictionaryWordsLoaded = false;
      this.editAcrostics.selectedWordName = null;
      this.editAcrostics.cameraAction = null;
      this.editAcrostics.isLoadingWords = false;
      this.editAcrostics.categories = [];
      this.inputs = [];
      this.editAcrostics.searchInput = "";
      this.editAcrostics.isGetLast = false;
      this.editAcrostics.isGetNext = false;
      this.editAcrostics.newAcrosticsName = "";
      this.editAcrostics.textInputs = ["INFORMATION", "ACROSTICS"];
      this.editAcrostics.selectedTextInput = this.editAcrostics.textInputs[0];
      this.editAcrostics.selectedTextInputIndex = 0;
      this.editAcrostics.isChangeName = false;
      this.editAcrostics.results = "";
      this.editAcrostics.tables = [];
      this.editAcrostics.words = [];
      this.editAcrostics.selectedAction = "INSERT";
      this.editAcrostics.informationInput = "";
      this.editAcrostics.acrosticsInput = "";
      this.editAcrostics.mnemonicsInput = "";
      this.editAcrostics.peglistInput = "";
      this.editAcrostics.hasMnemonics = false;
      this.editAcrostics.hasPeglist = false;
      this.editAcrostics.hasImage = false;
      this.editAcrostics.nameInput = "";
      this.editAcrostics.showExists = "";
      this.editAcrostics.isUseAllAcrostics = false;
      this.editAcrostics.isUseDictionary = false;
      var val: string = await this.storage.get('EDIT_ACROSTICS_USE_DICTIONARY');
      if (val != null) {
         this.editAcrostics.isUseDictionary = val;
      }
      val = await this.storage.get('EDIT_ACROSTICS_USE_ALL_ACROSTICS');
      if (val != null) {
         this.editAcrostics.isUseAllAcrostics = val;
      }
      val = await this.storage.get('EDIT_ACROSTICS_SELECTED_ACTION');
      if (val != null) {
         this.editAcrostics.selectedAction = val;
      }
      val = await this.storage.get('EDIT_ACROSTICS_SEARCH_INPUT');
      if (val != null) {
         this.editAcrostics.searchInput = val;
      }
      val = await this.storage.get('EDIT_ACROSTICS_SELECTED_WORD_NAME');
      console.log("GOT EDIT_ACROSTICS_SELECTED_WORD_NAME=" + val);
      if (val != null) {
         this.editAcrostics.selectedWordName = val;
      }
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;
      this.editAcrostics.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor: any) => {
         this.background_color = bgColor;
      });
      this.editAcrostics.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor: any) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
      });
      await this.loadTables();
   }

   ionViewWillLeave() {
      console.log("ionViewWillLeave called");
      this.editAcrostics.subscribedBackgroundColorEvent.unsubscribe();
      this.editAcrostics.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   async saveStorage() {
      //this.storage.set('YOUR_NUMBERS_IS_SHARED', this.yourNumbers.isShared);
      await this.storage.set('EDIT_ACROSTICS_USE_DICTIONARY', this.editAcrostics.isUseDictionary);
      await this.storage.set('EDIT_ACROSTICS_USE_ALL_ACROSTICS', this.editAcrostics.isUseAllAcrostics);
      await this.storage.set('EDIT_ACROSTICS_SEARCH_INPUT', this.editAcrostics.searchInput);
      await this.storage.set('EDIT_ACROSTICS_TABLE', this.editAcrostics.selectedTable);
      await this.storage.set('EDIT_ACROSTICS_INFORMATION', this.editAcrostics.informationInput);
      await this.storage.set('EDIT_ACROSTICS_ACROSTICS', this.editAcrostics.acrosticsInput);
      await this.storage.set('EDIT_ACROSTICS_SELECTED_ACTION', this.editAcrostics.selectedAction);
      await this.storage.set('EDIT_ACROSTICS_GET_LAST', this.editAcrostics.isGetLast);
      await this.storage.set('EDIT_ACROSTICS_GET_NEXT', this.editAcrostics.isGetNext);
      await this.storage.set('EDIT_ACROSTICS_NAME_INPUT', this.editAcrostics.nameInput);
      if (this.editAcrostics.selectedWord) {
         console.log("SAVING EDIT_ACROSTICS_SELECTED_WORD_NAME=" + this.editAcrostics.selectedWord.name);
         await this.storage.set('EDIT_ACROSTICS_SELECTED_WORD_NAME', this.editAcrostics.selectedWord.name);
      }
   }

   async loadTables() {
      await this.helpers.setProgress("Loading tables ,please wait...", false);
      await this.getTableNames(true);
      this.editAcrostics.selectedTable = this.editAcrostics.tables[0];
      var val: string = await this.storage.get('EDIT_ACROSTICS_TABLE');
      if (val != null) {
         this.editAcrostics.selectedTable = val;
      }
      console.log("BACK FROM getTableNames, this.editAcrostics.selectedTable=" + this.editAcrostics.selectedTable);
      await this.helpers.setProgress("Loading column types, please wait...", true);
      this.setTableData().then(async () => {
         console.log("BACK FROM setTableData");
         if (this.editAcrostics.isUseDictionary === true) {
            this.helpers.getDictionaryWords(true).then(async (words) => {
               console.log("BACK FROM getDictionaryWords");
               this.editAcrostics.dictionaryWords = words;
               this.editAcrostics.isDictionaryWordsLoaded = true;
               console.log("this.editAcrostics.searchInput = " + this.editAcrostics.searchInput);
               if (this.editAcrostics.searchInput != null) {
                  await this.searchInputEditted(true);
                  console.log("this.searchInputEditted(true) RESOLVED!!!");
                  console.log("this.editAcrostics.selectedWordName = " + this.editAcrostics.selectedWordName);
                  if (this.editAcrostics.selectedWordName != null) {
                     this.editAcrostics.selectedWord = this.helpers.getRecord(this.editAcrostics.words, "name", this.editAcrostics.selectedWordName);
                     if (this.editAcrostics.selectedWord !== "FALSE") {
                        this.doShowExists(this.editAcrostics.selectedWord.isExists);
                     }
                     this.editAcrostics.nameInput = this.editAcrostics.selectedWord.name;
                     console.log("GOT SAVED this.editAcrostics.selectedWord=" + JSON.stringify(this.editAcrostics.selectedWord));
                  }
                  await this.setSavedInputs();
                  await this.helpers.dismissProgress();
               } else {
                  await this.helpers.dismissProgress();
               }
            }, async () => {
               await this.helpers.dismissProgress();
            });
         } else {//NOT USING DICTIONARY:
            //TO DO : USE SAVE NORMAL NAME INPUT ENTERED AND GET ACROSTIC:
            val = await this.storage.get('EDIT_ACROSTICS_NAME_INPUT');
            if (val != null) {
               this.editAcrostics.nameInput = val;
               await this.getAcrostic(true);
               this.setSavedInputs();
               await this.helpers.dismissProgress();
            } else {
               await this.setSavedInputs();
               await this.helpers.dismissProgress();
            }
         }
      }, async () => {
         await this.helpers.dismissProgress();
      });
   }

   async setSavedInputs(): Promise<void> {
      console.log("setSavedInputs called");
      var val: string = await this.storage.get('EDIT_ACROSTICS_INFORMATION');
      if (val != null) {
         this.editAcrostics.informationInput = val;
      }
      val = await this.storage.get('EDIT_ACROSTICS_ACROSTICS');
      if (val != null) {
         this.editAcrostics.acrosticsInput = val;
      }
      val = await this.storage.get('EDIT_ACROSTICS_GET_LAST');
      if (val != null) {
         this.editAcrostics.isGetLast = val;
      }
      val = await this.storage.get('EDIT_ACROSTICS_GET_NEXT');
      if (val != null) {
         this.editAcrostics.isGetNext = val;
      }
   }

   async getTableNames(isDoingProgress: boolean): Promise<void> {
      console.log("getTableNames called");
      return new Promise((resolve, reject) => {
         this.helpers.setProgress("Getting table names...", isDoingProgress).then(() => {
            if (Helpers.isWorkOffline === false) {
               this.helpers.makeHttpRequest("/lfq_directory/php/edit_acrostics_get_tables.php", "GET", null).then(async (data) => {
                  await this.helpers.dismissProgress();
                  if (data["SUCCESS"] === true) {
                     this.editAcrostics.tables = data["TABLES"];
                  } else {
                     this.helpers.alertLfqError(data["ERROR"]);
                  }
                  resolve();
               }, error => {
                  this.helpers.alertServerError(error.message);
                  resolve();
               });
            } else {
               var sql = "SELECT tbl_name FROM sqlite_master WHERE type='table' ORDER BY tbl_name"
               this.helpers.query(this.database_acrostics, sql, []).then(async (data) => {
                  await this.helpers.dismissProgress();
                  if (data.rows.length > 0) {
                     for (var i = 0; i < data.rows.length; i++) {
                        if (data.rows.item(i).tbl_name !== '__WebKitDatabaseInfoTable__') {
                           this.editAcrostics.tables.push(data.rows.item(i).tbl_name);
                        }
                     }
                  }
                  resolve();
               }).catch(async (error) => {
                  await this.helpers.dismissProgress();
                  console.log("sql:" + sql + ", ERROR:" + error.message);
                  resolve();
               });
            }
         });
      });
   }

   loadTableNames(): Promise<void> {
      console.log("loadTableNames( called");
      return new Promise((resolve, reject) => {
         //ALWAYS DOING PROGRESS?:
         this.helpers.setProgress("Loading names of table " + this.editAcrostics.selectedTable + "...", true).then(() => {
            if (Helpers.isWorkOffline === false) {
               var params = {
                  "table": this.editAcrostics.selectedTable
               }
               this.editAcrostics.tableNames = [];
               this.helpers.makeHttpRequest("/lfq_directory/php/edit_acrostics_get_table_names.php", "GET", params).then(async (data) => {
                  if (data["SUCCESS"] === true) {
                     this.editAcrostics.tableNames = data["TABLE_NAMES"];
                  } else {
                     this.helpers.alertLfqError(data["ERROR"]);
                  }
                  await this.helpers.dismissProgress();
                  resolve();
               }, async error => {
                  await this.helpers.dismissProgress();
                  this.helpers.alertServerError(error.message);
                  resolve();
               });
            } else {
               var sql = "SELECT Name,User_ID FROM " + this.editAcrostics.selectedTable + " ORDER BY Name";
               this.helpers.query(this.database_acrostics, sql, []).then(async (data) => {
                  this.editAcrostics.tableNames = [];
                  if (data.rows.length > 0) {
                     for (var i = 0; i < data.rows.length; i++) {
                        this.editAcrostics.tableNames.push(data.rows.item(i));
                     }
                  }
                  await this.helpers.dismissProgress();
                  resolve();
               }).catch(async (error) => {
                  console.log("sql:" + sql + ", ERROR:" + error.message);
                  await this.helpers.dismissProgress();
                  resolve();
               });
            }
         });
      });
   }

   doSetTableData(isUseAllAcrostics: boolean): Promise<void> {
      return new Promise((resolve, reject) => {
         if (!isUseAllAcrostics) {
            resolve();
         } else {
            this.setTableData().then(() => {
               resolve();
            });
         }
      });
   }

   setTableData(): Promise<any> {
      console.log("setTableData called. this.editAcrostics.selectedTable=" + this.editAcrostics.selectedTable);
      return new Promise((resolve, reject) => {
         this.editAcrostics.categories = [];
         var word = null;
         var col_list_arr: any = [];
         this.editAcrostics.hasMnemonics = false;
         this.editAcrostics.hasPeglist = false;
         this.helpers.getColumnNames(this.database_acrostics, this.editAcrostics.selectedTable).then((columns) => {
            //if (data.rows.length > 0) {
            console.log("getColumnNames GOT COLUMNS = " + columns);
            var input = null;
            var col = "";
            for (var i = 0; i < columns.length; i++) {
               col = columns[i];
               if (col !== "ID" && col !== "User_ID") {
                  col_list_arr.push(col);
               }
               if (col !== "ID" && col !== "Name" && col !== "Information" && col !== "Acrostics" && col !== "Image" && col !== "User_ID" && col !== "Mnemonics" && col !== "Peglist") {
                  this.editAcrostics.categories.push({ "name": col, "input": input });
               }
               if (col === "Mnemonics") {
                  this.editAcrostics.hasMnemonics = true;
               }
               if (col === "Peglist") {
                  this.editAcrostics.hasPeglist = true;
               }
               if (col === "Image") {
                  this.editAcrostics.hasImage = true;
               }
            }
            //}
            this.editAcrostics.textInputs = ["INFORMATION", "ACROSTICS"];
            if (this.editAcrostics.hasMnemonics === true) {
               this.editAcrostics.textInputs.push("MNEMONICS");
            }
            if (this.editAcrostics.hasPeglist === true) {
               this.editAcrostics.textInputs.push("PEGLIST");
            }
            if (this.editAcrostics.hasImage === true) {
               this.editAcrostics.textInputs.push("IMAGE");
            }
            this.loadTableNames().then(() => {
               resolve(col_list_arr);
            });
         }, () => {
            reject();
         });
      });
   }


   vocabularySwitch() {
      console.log("switchVocabulary called");
      if (this.editAcrostics.selectedTable.toLowerCase() === "vocabulary") {
         if (this.editAcrostics.savedSelectedTable != null) {
            this.editAcrostics.selectedTable = this.editAcrostics.savedSelectedTable;
         } else {
            this.editAcrostics.selectedTable = this.editAcrostics.tables[0];
         }
      } else {
         this.editAcrostics.savedSelectedTable = this.editAcrostics.selectedTable;
         this.editAcrostics.selectedTable = "vocabulary"
      }
      this.helpers.setProgress("Switching to " + this.editAcrostics.selectedTable + ", please wait...", false).then(() => {
         this.setTableData().then(async () => {
            await this.helpers.dismissProgress();
         }, async () => {
            await this.helpers.dismissProgress();
         });
      });
   }

   clickUseDictionary() {
      console.log("clickUseDictionary called");
      if (this.editAcrostics.isUseDictionary === true) {
         this.editAcrostics.isUseAllAcrostics = false;
         if (this.editAcrostics.isDictionaryWordsLoaded === false) {
            this.helpers.getDictionaryWords(false).then(async (words) => {
               this.editAcrostics.dictionaryWords = words;
               this.editAcrostics.isDictionaryWordsLoaded = true;
               await this.helpers.dismissProgress();
            }, async () => {
               await this.helpers.dismissProgress()
            });
         }
      }
   }

   clickUseAllAcrostics() {
      console.log("clickUseAllAcrostics called");
      if (this.editAcrostics.isUseDictionary === true) {
         this.editAcrostics.isUseDictionary = false;
      }
   }

   /*
   * @method refresTables: 
   * 1) Checks 2 mile proximity, 2) Removes from reprocessing factory, 3) Splices from BOL list
   * Overrides, setting new address, and posts PICKUP_LOCATION_OVERRID BOL problem if not in proximity
   * @param: bol: A BOL object
   * @param: status: The status to update to(INTRANSIT)
   * @param: bolIndex: The index of the BOL in the list view to update.
   */
   refreshTables() {
      console.log("refreshTables called");
      var name = "";
      if (this.editAcrostics.isUseDictionary === true) {
         if (this.editAcrostics.words.length > 0) {
            name = this.editAcrostics.nameInput;
         }
      }
      var col_list = [];
      this.getColumnsNotImage(true).then((res) => {
         col_list = res;
         if (col_list.length > 0) {
            this.inputs = [];
            for (var i = 0; i < col_list.length; i++) {
               if (col_list[i] !== "ID"
                  && col_list[i] !== "Name"
                  && col_list[i] !== "Information"
                  && col_list[i] !== "Acrostics"
                  && col_list[i] !== "Mnemonics"
                  && col_list[i] !== "Peglist") {
                  this.inputs.push(col_list[i]);
               }
            }
         }
      });
      // setWords();    
   }

   selectWord() {
      console.log("selectWord called");
      this.editAcrostics.showExists = "";
      var name = this.editAcrostics.selectedWord.name;
      console.log("selectWord name = " + name);
      if (this.editAcrostics.isUseAllAcrostics === true) {
         var namespl = this.editAcrostics.selectedWord.name.split("--");
         this.editAcrostics.selectedTable = namespl[0];
         name = namespl[1];
      }
      this.editAcrostics.nameInput = name;
      this.getAcrostic(false);
   }


   getLastTextInput() {
      console.log("getLastTextInput called");
      if (this.editAcrostics.selectedTextInputIndex > 0) {
         this.editAcrostics.selectedTextInputIndex--;
         this.editAcrostics.selectedTextInput = this.editAcrostics.textInputs[this.editAcrostics.selectedTextInputIndex];
      }
      console.log("this.editAcrostics.selectedTextInput=" + this.editAcrostics.selectedTextInput);
   }

   getNextTextInput() {
      console.log("getNextTextInput called this.editAcrostics.textInputs.length=" + this.editAcrostics.textInputs.length + ", this.editAcrostics.selectedTextInputIndex=" + this.editAcrostics.selectedTextInputIndex);
      if (this.editAcrostics.selectedTextInputIndex < (this.editAcrostics.textInputs.length - 1)) {
         this.editAcrostics.selectedTextInputIndex++;
         this.editAcrostics.selectedTextInput = this.editAcrostics.textInputs[this.editAcrostics.selectedTextInputIndex];
      }
      console.log("this.editAcrostics.selectedTextInput=" + this.editAcrostics.selectedTextInput);
   }

   getDictionaryWord() {
      console.log("getDictionaryWord called");
      this.helpers.setProgress("Getting dictionary word, please wait...", false).then(async () => {
         if (this.editAcrostics.words.length === 0) {
            await this.helpers.dismissProgress();
            return;
         }
         var opt = "none";
         if (this.editAcrostics.isGetNext === true) {
            opt = "get_next";
         }
         if (this.editAcrostics.isLastNext === true) {
            opt = "get_last";
         }

         var sql = "";
         console.log("this.editAcrostics.selectedWord=" + JSON.stringify(this.editAcrostics.selectedWord));
         if (opt === "none") {
            sql = "SELECT * FROM " + Helpers.TABLES_MISC.dictionarya + " WHERE Word='" + this.editAcrostics.selectedWord.name + "'";
         }
         if (opt === "get_next") {
            sql = "SELECT * FROM " + Helpers.TABLES_MISC.dictionarya + " WHERE LOWER(Word)>'" + this.editAcrostics.selectedWord.name.toLowerCase() + "' ORDER BY LOWER(Word) LIMIT 1";
         }
         if (opt === "get_last") {
            sql = "SELECT * FROM " + Helpers.TABLES_MISC.dictionarya + " WHERE LOWER(Word)<'" + this.editAcrostics.selectedWord.name.toLowerCase() + "' ORDER BY LOWER(Word) DESC LIMIT 1";
         }
         this.helpers.query(this.database_misc, sql, []).then(async (data) => {
            if (data.rows.length > 0) {
               if (opt === "get_last" || opt === "get_next") {
                  this.editAcrostics.selectedWord.name = data.rows.item(0).Word;
                  this.editAcrostics.nameInput = this.editAcrostics.selectedWord.name
               }
               console.log("this.editAcrostics.selectedWord.isExists=" + this.editAcrostics.selectedWord.isExists);
               this.doShowExists(this.editAcrostics.selectedWord.isExists);
               this.editAcrostics.results = "Found " + this.editAcrostics.selectedWord.name;
               this.editAcrostics.informationInput = data.rows.item(0).Definition;
               this.editAcrostics.acrosticsInput = "";
            } else {
               this.editAcrostics.results = "RESULTS: doesn't exist.";
            }
            await this.helpers.dismissProgress();
         }).catch((error) => {
            console.log("sql:" + sql + ", ERROR:" + error.message);
            this.editAcrostics.results = "RESULTS: doesn't exist.";
         });
      });
   }


   getAcrostic(isDoingProgress: boolean): Promise<void> {
      console.log("getAcrostic called");
      return new Promise((resolve, reject) => {
         var table_name = this.editAcrostics.selectedTable;
         if (!this.editAcrostics.selectedWord) return;
         var name = this.editAcrostics.isUseAllAcrostics === true ? this.editAcrostics.selectedWord.name.split("--")[1] : this.editAcrostics.selectedWord.name;
         if (this.editAcrostics.isUseDictionary === true && Helpers.isWorkOffline === true) {
            this.getDictionaryWord();
            resolve();
            return;
         }
         this.helpers.setProgress("Getting acrostic, please wait...", isDoingProgress).then(() => {
            var opt = "none";
            var is_get_last = false;
            var is_get_next = false;
            if (this.editAcrostics.isGetNext === true) {
               opt = "get_next";
               is_get_next = true;
            }
            if (this.editAcrostics.isGetLast === true) {
               opt = "get_last";
               is_get_last = true;
            }
            this.editAcrostics.imageInput = null;
            this.doSetTableData(this.editAcrostics.isUseAllAcrostics).then(() => {

               if (Helpers.isWorkOffline === false) {
                  var params = {
                     "selected_name": name,
                     "selected_table": table_name,
                     "is_use_dictionary": this.editAcrostics.isUseDictionary,
                     'is_get_next': is_get_next,
                     'is_get_last': is_get_last,
                     'is_get_category': false,
                     'get_category': ''
                  };
                  this.helpers.makeHttpRequest("/lfq_directory/php/edit_acrostics_get_acrostic.php", "POST", params).then(async (data) => {
                     //console.log("GET ACROSTIC data=" + JSON.stringify(data));
                     if (data && data["SUCCESS"] === true) {
                        if (this.editAcrostics.isUseDictionary === true) {
                           this.editAcrostics.selectedWord.name = data.Name;
                           if (opt === "get_last" || opt === "get_next") {
                              this.editAcrostics.nameInput = this.editAcrostics.selectedWord.name
                           }
                           console.log("this.editAcrostics.selectedWord.isExists=" + this.editAcrostics.selectedWord.isExists);
                           this.doShowExists(this.editAcrostics.selectedWord.isExists);
                           this.editAcrostics.results = "Found " + name + ".";
                           this.editAcrostics.informationInput = data.Information;
                           this.editAcrostics.acrosticsInput = "";
                        } else {
                           for (var i = 0; i < this.editAcrostics.categories.length; i++) {
                              if (data["CATEGORY_VALUES"] && data["CATEGORY_VALUES"][this.editAcrostics.categories[i].name]) {
                                 this.editAcrostics.categories[i].input = data["CATEGORY_VALUES"][this.editAcrostics.categories[i].name];
                              }
                           }
                           console.log("SET this.editAcrostics.categories = " + JSON.stringify(this.editAcrostics.categories));
                           this.finishGetAcrostic(opt, data);
                        }
                        await this.helpers.dismissProgress();
                     } else {
                        await this.helpers.dismissProgress();
                        this.helpers.alertLfqError(data["ERROR"]);
                     }
                     resolve();
                  }, async error => {
                     console.log("ERROR:" + error.message);
                     this.editAcrostics.results = "Server Error: " + error.message;
                     this.helpers.alertServerError(error.message);
                     await this.helpers.dismissProgress();
                     resolve();
                  });
               } else {
                  var col_list_str = "Name, Information, Acrostics, Image, User_ID";
                  if (this.editAcrostics.categories.length > 0) {
                     col_list_str += "," + this.editAcrostics.categories.map((category: any) => { return category.name; }).join(",");
                  }
                  console.log("col_list_str=" + col_list_str);
                  var sql = "";
                  if (opt === "none") {
                     sql = "SELECT " + col_list_str + " FROM " + table_name + " WHERE Name='" + name + "'";
                  }
                  if (opt === "get_next") {
                     sql = "SELECT " + col_list_str + " FROM " + table_name + " WHERE LOWER(Name)>'" + name.toLowerCase() + "' ORDER BY LOWER(Name) LIMIT 1";
                  }
                  if (opt === "get_last") {
                     sql = "SELECT " + col_list_str + " FROM " + table_name + " WHERE LOWER(Name)<'" + name.toLowerCase() + "' ORDER BY LOWER(Name) DESC LIMIT 1";
                  }
                  console.log("getAcrostic sql=" + sql);
                  this.helpers.query(this.database_acrostics, sql, []).then((data) => {
                     var myData: any = null;
                     if (data.rows.length > 0) {
                        myData = data.rows.item(0);
                     }
                     for (var i = 0; i < this.editAcrostics.categories.length; i++) {
                        this.editAcrostics.categories[i].input = myData[this.editAcrostics.categories[i].name];
                     }
                     this.helpers.getUsernameByID(myData.User_ID).then(async (gotUsername) => {
                        myData.Username = gotUsername;
                        this.finishGetAcrostic(opt, myData);
                        await this.helpers.dismissProgress();
                        resolve();
                     });
                  }).catch(async (error) => {
                     console.log("sql:" + sql + ", ERROR:" + error.message);
                     this.editAcrostics.results = "RESULTS: doesn't exist.";
                     await this.helpers.dismissProgress();
                     resolve();
                  });
               }
            });
         });
      });
   }

   finishGetAcrostic(opt: any, data: any) {
      console.log("finishGetAcrostic called, data=" + JSON.stringify(data));
      if (data) {
         this.editAcrostics.getOld = data;
         if (data.Image != null) {
            //console.log("SET IMAGE!!!! imageInput = " + this.editAcrostics.imageInput);
            this.editAcrostics.imageInput = data.Image;
         } else {
            this.editAcrostics.imageInput = null;
         }
         var name = data.Name;
         if (opt === "get_last" || opt === "get_next") {
            this.editAcrostics.nameInput = name;
         }
         this.editAcrostics.results = "Found " + name + ".";
         this.editAcrostics.informationInput = data.Information;
         console.log("this.editAcrostics.informationInput=" + this.editAcrostics.informationInput);
         this.editAcrostics.acrosticsInput = data.Acrostics;
         console.log("this.editAcrostics.acrosticsInput=" + this.editAcrostics.acrosticInput);
         if (data.Mnemonics != null) {
            this.editAcrostics.mnemonicsInput = data.Mnemonics;
         }
         if (data.Peglist != null) {
            this.editAcrostics.peglistInput = data.Peglist;
         }
      } else {
         this.editAcrostics.results = "RESULTS: doesn't exist.";
      }
   }

   searchInputEditted(isDoingProgress: boolean): Promise<void> {
      console.log("searchInputEditted called");
      return new Promise((resolve, reject) => {
         var searchInput = this.editAcrostics.searchInput;
         console.log("searchInputEditted called, searchInput=" + searchInput);
         if (searchInput.length < 2 || searchInput.length < this.saveEnterdAcrosticLength) {
            if (searchInput.length < this.saveEnterdAcrosticLength) {
               this.editAcrostics.words = [];
            }
            this.saveEnterdAcrosticLength = searchInput.length;
            resolve();
         } else {
            this.saveEnterdAcrosticLength = searchInput.length;
            this.editAcrostics.isLoadingWords = true;
            this.doLoadWords(isDoingProgress).then(() => {
               resolve();
            });
         }
      });
   }

   doLoadWords(isDoingProgress: boolean): Promise<void> {
      console.log("doLoadWords called, this.editAcrostics.isUseDictionary=" + this.editAcrostics.isUseDictionary + ", this.editAcrostics.isUseAllAcrostics=" + this.editAcrostics.isUseAllAcrostics);
      return new Promise((resolve, reject) => {
         this.editAcrostics.words = [];
         var name = this.editAcrostics.searchInput;
         var nameLength = name.length;
         var nameLower = name.toLowerCase();
         console.log("name=" + name);
         if (this.editAcrostics.isUseAllAcrostics === false && this.editAcrostics.isUseDictionary === false) {
            var myData = { "WORDS": [] };
            myData["WORDS"] = this.editAcrostics.tableNames.filter((myName: any) => {
               return (myName != null && myName.Name.substring(0, nameLength).toLowerCase() === nameLower);
            });
            this.doFinishLoadWords(isDoingProgress, myData);
            resolve();
         } else if (this.editAcrostics.isUseDictionary === true) {
            //this.helpers.setProgress("Loading dictionary words, please wait...", isDoingProgress).then(() => {
            var isExists = false;
            var existsText = "";
            var indexExists = -1;
            var userID = null;
            var tableNamesOnly = this.editAcrostics.tableNames.map((tN: any) => { return tN.Name; });
            var dictionaryWords = this.editAcrostics.dictionaryWords.filter((dw: any) => {
               return (dw.substring(0, nameLength).toLowerCase() === nameLower);
            });
            for (var i = 0; i < dictionaryWords.length; i++) {
               indexExists = tableNamesOnly.indexOf(dictionaryWords[i]);
               isExists = indexExists >= 0;
               if (isExists === true) {
                  existsText = " --X";
                  userID = this.editAcrostics.tableNames[indexExists].User_ID;
               } else {
                  existsText = "";
                  userID = null;
               }
               this.editAcrostics.words.push({ "name": dictionaryWords[i], "existsText": existsText, "isExists": isExists, "User_ID": userID });
            }
            console.log("ADDED " + this.editAcrostics.words.length + " NAMES.");
            this.finishLoadWords(isDoingProgress);
            resolve();
            //});
         } else if (this.editAcrostics.isUseAllAcrostics === true) {
            this.helpers.setProgress("Loading all acrostic words, please wait...", isDoingProgress).then(() => {
               if (Helpers.isWorkOffline === false) {
                  var params = {
                     "selected_name": name
                  };
                  this.helpers.makeHttpRequest("/lfq_directory/php/edit_acrostics_get_all_suggested_names.php", "POST", params).then((data) => {
                     if (data["SUCCESS"] === true) {
                        this.doFinishLoadWords(true, data);
                     } else {
                        this.editAcrostics.isLoadingWords = false;
                        this.helpers.alertLfqError(data["ERROR"]);
                        resolve();
                     }
                  }, async error => {
                     console.log("ERROR:" + error.message);
                     await this.helpers.dismissProgress();
                     this.editAcrostics.isLoadingWords = false;
                     this.helpers.alertServerError(error.message);
                     resolve();
                  });
               } else {//OFFLING LOAD WORDS:
                  var sql_all_acr_arr = [];
                  for (var i = 0; i < this.editAcrostics.tables.length; i++) {
                     sql_all_acr_arr.push("SELECT Name,'" + this.editAcrostics.tables[i] + "' AS TABLE_NAME  FROM " + this.editAcrostics.tables[i] + " WHERE Name LIKE '" + name + "%'");
                  }
                  var sql_all_acr = "SELECT * FROM (" + sql_all_acr_arr.join(" UNION ") + ")a ORDER BY a.TABLE_NAME, a.NAME";
                  console.log("sql_all_scr= " + sql_all_acr);
                  this.helpers.query(this.database_acrostics, sql_all_acr, []).then((data) => {
                     var myData: any = {};
                     myData["WORDS"] = [];
                     for (var i = 0; i < data.rows.length; i++) {
                        myData["WORDS"].push(data.rows.item(i));
                     }
                     this.doFinishLoadWords(true, myData);
                     resolve();
                  }).catch(async (error) => {
                     console.log("sql:" + sql_all_acr + ", ERROR:" + error.message);
                     await this.helpers.dismissProgress();
                     this.editAcrostics.isLoadingWords = false;
                     resolve();
                  });
               }
            });
         }
      });
   }

   doFinishLoadWords(isDoingProgress: boolean, data: any) {
      console.log("doFinishLoadWords called");
      if (this.editAcrostics.isUseAllAcrostics === false && this.editAcrostics.isUseDictionary === false) {
         this.editAcrostics.words = [];
         if (data && data["WORDS"]) {
            for (var i = 0; i < data["WORDS"].length; i++) {
               this.editAcrostics.words.push({ "name": data["WORDS"][i].Name, "User_ID": String(data["WORDS"][i].User_ID), "isExists": false, "existsText": "" });
            }
         }
         console.log("ADDED " + this.editAcrostics.words.length + " NAMES.");
         console.log("doFinishLoadWords words = " + JSON.stringify(this.editAcrostics.words));
         this.finishLoadWords(isDoingProgress);
      } else if (this.editAcrostics.isUseAllAcrostics === true) {
         if (data) {
            for (var i = 0; i < data["WORDS"].length; i++) {
               this.editAcrostics.words.push({ "name": data["WORDS"][i].TABLE_NAME + "--" + data["WORDS"][i].Name, "existsText": "", "isExists": false });
            }
         }
         this.finishLoadWords(isDoingProgress);
      }
   }

   async finishLoadWords(isDoingProgress: boolean) {
      if (isDoingProgress === true) {//IF PROGRESS NOT ALREADY BEEING USED:
         await this.helpers.dismissProgress();
      }
      this.editAcrostics.results = "";
      //console.log("this.editAcrostics.words length=" + this.editAcrostics.words.length);
      console.log("this.editAcrostics.words =" + JSON.stringify(this.editAcrostics.words));
      this.editAcrostics.isLoadingWords = false;
   }


   getColumnsNotImage(isDoingProgress: boolean): Promise<any> {
      console.log("getColumnsNotImage called");
      return new Promise((resolve, reject) => {
         this.helpers.setProgress("Getting columns not image, please wait..", isDoingProgress).then(() => {
            this.helpers.getColumnNames(this.database_acrostics, this.editAcrostics.selectedTable).then((columns) => {
               var col_list = [];
               var col = "";
               for (var i = 0; i < columns.length; i++) {
                  col = columns[i];
                  if (col !== "Image") {
                     col_list.push(col);
                  }
               }
               console.log("col_list = " + col_list);
               resolve(col_list);
            });
         });
      });
   }


   detectChanges() {
      console.log("detectChanges called");
      this.changeDet.detectChanges();
      console.log("detectChanges: new acrostic=" + this.editAcrostics.acrosticsInput);
   }

   async editAcrostic() {
      console.log("editAcrostic called, this.editAcrostics.selectedAction=" + this.editAcrostics.selectedAction);
      var table_name = this.editAcrostics.selectedTable;
      var info = this.editAcrostics.informationInput;

      if (!this.editAcrostics.selectedAction) {
         this.helpers.myAlert("Alert", "", "<b>Must select and action first.</b>", "Dismiss");
         return;
      } else if (this.editAcrostics.selectedAction !== 'INSERT' && !this.editAcrostics.selectedWord) {
         this.helpers.myAlert("Alert", "", "<b>Must select or get a word in dropdown before you can " + this.editAcrostics.selectedAction + ".</b>", "Dismiss");
         return;
      }
      var name = this.editAcrostics.selectedAction === 'INSERT' ? this.editAcrostics.nameInput : this.editAcrostics.selectedWord.name;
      if (name == null || String(name).trim() === '') {
         this.helpers.myAlert("Alert", "", "<b>Could not update. Please input name.</b>", "Dismiss");
         return;
      }

      var acrostic: any = null;
      if (this.editAcrostics.acrosticsInput) {
         acrostic = this.editAcrostics.acrosticsInput;
      }
      var exists = false;
      var col_list = [];
      if (this.editAcrostics.selectedAction !== "DELETE" && acrostic && String(acrostic).trim() !== "") {
         var checkAcrosticResult = this.helpers.checkAcrostic(name, acrostic);
         console.log("checkAcrosticResult = " + checkAcrosticResult);
         if (checkAcrosticResult !== true) {
            await this.helpers.dismissProgress();
            this.helpers.myAlert("Alert", "<b>Could not " + this.editAcrostics.selectedAction + "</b>", "<b>" + checkAcrosticResult + "<b><br /><br />" + Helpers.incompleteAcrosticMessage, "Dismiss");
            return;
         }
      }
      var new_name = name;
      if (this.editAcrostics.isChangeName === true) {
         if (!this.editAcrostics.newAcrosticsName || this.editAcrostics.newAcrosticsName.trim() === '') {
            this.helpers.myAlert("Alert", "", "<b>Need to enter a new name.</b>", "Dismiss");
            return;
         }
         new_name = this.editAcrostics.newAcrosticsName;
      }
      var mnemonic = "";
      var peglist = "";
      var cv: any = {};
      if (this.editAcrostics.selectedAction !== "DELETE") {
         if (this.editAcrostics.selectedAction === "INSERT") {
            cv.User_ID = Helpers.User.ID;
         }
         if (this.editAcrostics.selectedAction === "INSERT" || this.editAcrostics.isChangeName === true) {
            cv.Name = new_name;
         }
         cv.Information = info;
         cv.Acrostics = acrostic;
         var has_mnemonics = false;
         var has_peglist = false;
         if (this.editAcrostics.textInputs.indexOf("MNEMONICS") >= 0) {
            mnemonic = this.editAcrostics.mnemonicsInput;
            mnemonic = mnemonic.replace("'", "`");
            mnemonic = mnemonic.replace("\"", "`");
            cv.Mnemonics = mnemonic;
            has_mnemonics = true;
         }
         if (this.editAcrostics.textInputs.indexOf("PEGLIST") >= 0) {
            peglist = this.editAcrostics.peglistInput;
            peglist = peglist.replace("'", "`");
            peglist = peglist.replace("\"", "`");
            cv.Peglist = peglist;
            has_peglist = true;
         }
         for (var i = 0; i < this.editAcrostics.categories.length; i++) {
            if (this.editAcrostics.categories[i].input && this.editAcrostics.categories[i].input.trim() !== '') {
               cv[this.editAcrostics.categories[i].name] = this.editAcrostics.categories[i].input;
            }
         }
      }
      this.getColumnsNotImage(false).then((res) => {
         console.log("getColumnsNotImage resolved");
         col_list = res;
         //var col_list_str = col_list.join(",");
         if (col_list.length === 0) {
            this.editAcrostics.results = "NAME NOT FOUND!";
         }
         var Wheres = { "name": this.editAcrostics.nameInput };
         console.log("calling insertCheckExists.. table = " + this.editAcrostics.selectedTable + ", Wheres = " + JSON.stringify(Wheres));
         this.helpers.insertCheckExists(DB_Type_ID.DB_ACROSTICS, this.editAcrostics.selectedTable, Wheres).then(async (checkRes) => {
            console.log("calling insertCheckExists.. checkRes = " + JSON.stringify(checkRes));
            var isCheckEdit = false;
            if (checkRes) {
               exists = checkRes === false ? false : true;
               //isCheckEdit = (this.editAcrostics.selectedAction === "EDIT" && exists === true && checkRes["ENTRY"] && checkRes["ENTRY"]["Acrostics"] && String(acrostic) !== String(checkRes["ENTRY"]["Acrostics"]));
            }
            //var isCheckInsert = (this.editAcrostics.selectedAction === "INSERT" && String(acrostic).trim() !== "");
            if (this.editAcrostics.selectedAction === "INSERT") {
               if (exists) {
                  await this.helpers.dismissProgress();
                  this.editAcrostics.results = name + " already exists. Did not insert.";
                  this.helpers.myAlert("Alert", "", "<b>" + name + " already exists. Did not insert.</b>", "Dismiss");
                  return;
               }
               var sql = "";
               this.helpers.setProgress("Inserting acrostic " + name + " ,please wait...", true).then(() => {
                  var cols = Object.keys(cv);
                  var vals = cols.map((col) => { return cv[col]; });
                  var names = { "Table": table_name, "Name": name };
                  //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                  var queries = [new SyncQuery(null, null, DB_Type_ID.DB_ACROSTICS, table_name, Op_Type_ID.INSERT, cols, [vals], {})];
                  //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
                  this.helpers.autoSync(queries, Op_Type_ID.INSERT, null, names, null, cv).then(async (res) => {
                     if (res.isSuccess === true) {
                        this.editAcrostics.results = "RESULTS: inserted into " + table_name + ", " + name + "." + res.results;
                        if (this.editAcrostics.isUseDictionary === true) {
                           if (this.editAcrostics.words && this.editAcrostics.words.length > 0) {
                              if (acrostic && acrostic.trim() !== '') {
                                 this.doShowExists(true);
                              }
                           }
                        }
                        await this.helpers.dismissProgress();
                     } else {
                        console.log("sql:" + sql + ", ERROR:" + res.results);
                        this.editAcrostics.results = " Error inserting acrostic.";
                        await this.helpers.dismissProgress();
                     }
                  });
               });
            } else if (this.editAcrostics.selectedAction === "EDIT") {
               console.log("this.editAcrostics.selectedAction=EDIT, doing EDIT..");
               // TEST FIRST IF name EXISTS                   
               if (!exists) {
                  await this.helpers.dismissProgress();
                  this.editAcrostics.results = "RESULTS: " + name + " does not exist.";
                  return;
               } else {
                  this.helpers.setProgress("Updating acrostic " + name + " ,please wait...", true).then(() => {
                     console.log("BEFORE CALLED getUpdateString, cv=" + JSON.stringify(cv));
                     var cols = Object.keys(cv);
                     var vals = cols.map((col) => { return cv[col]; });
                     var wheres = { "Name": name };
                     var names = { "Name": name };
                     var includProps = cols;
                     var entriesRequest = Helpers.getEntriesRequest(checkRes, cv, includProps);
                     var queries = [
                        new SyncQuery(
                           //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                           null, checkRes.User_ID, DB_Type_ID.DB_ACROSTICS, table_name, Op_Type_ID.UPDATE, cols, vals, wheres, User_Action_Request.USER_ID_UPDATE
                        )
                     ];
                     //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
                     this.helpers.autoSync(queries, Op_Type_ID.UPDATE, checkRes.User_ID, names, entriesRequest[0], entriesRequest[1]).then(async (res) => {
                        await this.helpers.dismissProgress();
                        if (res.isSuccess === true) {
                           this.editAcrostics.results = "RESULTS: Updated " + table_name + ", " + name + "." + res.results;
                        } else {
                           console.log("sql:" + sql + ", ERROR:" + res.results);
                           this.editAcrostics.results = "Sorry. Error updating acrostic.";
                           await this.helpers.dismissProgress();
                        }
                     });
                  });
               }
            }
            else if (this.editAcrostics.selectedAction === "DELETE") {
               console.log("DOING DELETE!");
               if (!exists) {
                  await this.helpers.dismissProgress();
                  this.editAcrostics.results = name + " does not exist. Could not delete.";
                  this.helpers.myAlert("Alert", "", "<b>" + name + " does not exist. Could not delete.</b>", "Dismiss");
                  return;
               } else if (!this.editAcrostics.getOld) {
                  await this.helpers.dismissProgress();
                  this.editAcrostics.results = "Please retrieve name first before editting.";
                  this.helpers.myAlert("Alert", "", "<b>" + this.editAcrostics.results + "</b>", "Dismiss");
                  return;
               } else {
                  this.helpers.setProgress("Deleting acrostic " + name + " ,please wait...", true).then(() => {

                     //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                     var queries = [new SyncQuery(null, this.editAcrostics.getOld.User_ID, DB_Type_ID.DB_ACROSTICS, table_name, Op_Type_ID.DELETE, [], [], { "Name": name })];
                     //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
                     this.helpers.autoSync(queries, Op_Type_ID.DELETE, this.editAcrostics.getOld.User_ID, { "Table": table_name, "Name": name }, {}, {}).then(async (res) => {
                        await this.helpers.dismissProgress();
                        if (res.isSuccess === true) {
                           this.editAcrostics.results = "RESULTS: Deleted from : " + table_name + ", " + name + ". " + res.results;
                        } else {
                           console.log("ERROR:" + res.results);
                           this.editAcrostics.results = "Sorry. Error deleting acrostic";
                        }
                     });
                  });
               }
            }//END IF DELETE(LAST SELECTED ACTION)
         });

      });
   }

   doShowExists(isExists: boolean) {
      console.log("doShowExists called.");
      var prompt_name = this.editAcrostics.selectedWord.name;
      if (prompt_name && prompt_name.length > 10) {
         prompt_name = prompt_name.substring(0, 10) + "..";
      }
      if (isExists === true) {
         this.editAcrostics.selectedWord.isExists = true;
         this.editAcrostics.showExists = prompt_name + " EXISTS";
         this.editAcrostics.selectedWord.existsText = " --X";
      } else {
         this.editAcrostics.selectedWord.isExists = false;
         this.editAcrostics.showExists = prompt_name + " NOT EXISTS";
         this.editAcrostics.selectedWord.existsText = "";
      }
   }

   tableChange() {
      console.log('tableChange called');
      this.helpers.setProgress("Changing the table ,please wait...", false).then(() => {
         this.setTableData().then(async () => {
            await this.helpers.dismissProgress();
         }, async () => {
            await this.helpers.dismissProgress();
         });
      });
   }

   replaceImage() {
      console.log('replaceImage called');
      if (this.editAcrostics.nameInput == null || this.editAcrostics.nameInput.toString().trim() === '') {
         this.helpers.myAlert("Alert", "", "<b>Please input an entry name.</b>", "Dismiss");
         return;
      }
      this.getImageData((imageData: any) => {
         console.log("getImageData RESOLVED imageData = " + imageData);
         this.helpers.setProgress("Saving image ,please wait...", false).then(() => {
            // If it's base64 (DATA_URL):       
            imageData = this.helpers.removeImageType(imageData);
            this.editAcrostics.imageInput = imageData;
            var queries = [
               new SyncQuery(
                  //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                  null, this.editAcrostics.getOld.User_ID, DB_Type_ID.DB_ACROSTICS, this.editAcrostics.selectedTable, Op_Type_ID.UPDATE_IMAGE, [], [], { "Name": this.editAcrostics.nameInput }, User_Action_Request.USER_ID_UPDATE
               )
            ];
            //autoSync(queries, opTypeId, userIdOld, names,, entryOld, entry, oldNewImages)
            this.helpers.autoSync(queries, Op_Type_ID.UPDATE_IMAGE, this.editAcrostics.getOld.User_ID, { "Name": this.editAcrostics.nameInput }, null, null, this.editAcrostics.getOld.Image, imageData).then(async (res) => {
               await this.helpers.dismissProgress();
               if (res.isSuccess === true) {
                  this.editAcrostics.results = "RESULTS: Updated image for: " + this.editAcrostics.nameInput + ". " + res.results;
                  console.log("ERROR:" + res.results);
               } else {
                  this.editAcrostics.results = "Sorry. Error updating acrostic: " + res.results;
               }
            });
            /*if (Helpers.isWorkOffline === false) {
               const fileName = this.editAcrostics.selectedTable + "_" + this.editAcrostics.nameInput + '.jpeg';
               const imageBlob = this.helpers.dataURItoBlob(imageData);
               const imageFile = new File([imageBlob], fileName, { type: 'image/jpeg' });
               //let postData = new FormData();                  
               //postData.append('ACROSTIC_IMAGE', imageFile);
               //postData.append('selected_table', this.editAcrostics.selectedTable);
               //postData.append('selected_name', this.editAcrostics.nameInput);

               const fileTransfer: FileTransferObject = this.transfer.create();

               let options: FileUploadOptions = {
                  fileKey: "photo",
                  fileName: fileName,
                  chunkedMode: false,
                  mimeType: "image/jpeg",
                  params: {
                     "selected_table": this.editAcrostics.selectedTable,
                     "selected_name": this.editAcrostics.nameInput
                  },
                  headers: {}
               }

               fileTransfer.upload(base64Image, 'https://www.learnfactsquick.com/lfq_directory/php/edit_acrostics_file_upload.php', options).then(res => {
                  this.editAcrostics.results = "";
                  var data = res.response;
                  if (this.helpers.isJSON(res.response)) {
                     data = JSON.parse(res.response);
                  }
                  console.log("UPLOAD PHOTO RESPONSE DATA:" + JSON.stringify(res));
                  if (data["SUCCESS"] === true) {
                     this.helpers.dismissProgress();
                     this.helpers.myAlert("SUCCESS", "", "<b>Upload photo success: " + data["RESULTS"] + "</b>", "Dismiss");
                  } else {
                     this.helpers.dismissProgress();
                     this.helpers.myAlert("Alert", "", "<b>Upload photo app LFQ Error: " + data["ERROR"] + "</b>", "Dismiss");
                     return;
                  }
               }, error => {
                  this.helpers.dismissProgress();
                  this.helpers.myAlert("Alert", "<b>Uploaded photo app error:</b>", JSON.stringify(error), "Dismiss");
                  //this.helpers.alertServerError("Upload photo server error: " + JSON.stringify(error));
                  return;
               });
            } else {
            */
            //}
         });
      });
   }

   onFileChanged(event: any, callback: Function) {
      console.log("onFileChanged called");
      this.editAcrostics.selectedFile = event.target.files[0];
      this.helpers.getBase64(this.editAcrostics.selectedFile, (imageData: any) => {
         callback(imageData);
      });
   }

   async getImageData(callback: Function) {
      var self = this;
      if (this.helpers.isApp() === false) {
         //$('#image_upload').trigger('click');
         //$("#image_upload").change((event:any)=>{
         //   self.onFileChanged(event, (imageData:any) => {
         //      callback(imageData);
         //   });
         //});
      } else {
         let alert = await this.alertCtrl.create({
            header: "Choose from Gallery<br />or take picture?",
            cssClass: "cameraPopup",
            buttons: [
               {
                  text: 'Cancel',
                  cssClass: 'cancelPopupButton',
                  handler: () => {
                     console.log('Dismiss replace image clicked');
                     //alert.dismiss(true);
                     this.editAcrostics.cameraAction = null;
                     return true;
                  }
               },
               {
                  text: 'Choose from gallery',
                  cssClass: 'confirmPopupButton1',
                  handler: () => {
                     console.log('Choose gallery picture clicked');
                     //alert.dismiss(false);
                     this.editAcrostics.cameraAction = 0;
                     return true;
                  }
               },
               {
                  text: 'Take picture',
                  cssClass: 'confirmPopupButton2',
                  handler: () => {
                     console.log('Take picture clicked');
                     //alert.dismiss(false);
                     this.editAcrostics.cameraAction = 1;
                     return true;
                  }
               }
            ]
         });
         alert.present();
         alert.onDidDismiss().then(async () => {
            console.log("CHOOSE PICTURE METHOD ALERT this.editAcrostics.cameraAction =" + this.editAcrostics.cameraAction);
            if (this.editAcrostics.cameraAction == null) { return; }
            var sourceType = this.editAcrostics.cameraAction;//CAN BE 0:GALERY, OR 1: TAKE PICTURE:

            const image = await Camera.getPhoto({
               quality: 90,
               allowEditing: false,
               width: 120,
               height: 120,
               correctOrientation: true,
               source: sourceType,
               saveToGallery: false,
               resultType: CameraResultType.DataUrl,
            });
            callback(image);
         });
      }
   }

   setGetLastNext(isNext: boolean) {
      console.log("setGetLastNext called, isNext = " + isNext);
      if (isNext === true) {
         this.editAcrostics.isGetLast = false;
      } else {
         this.editAcrostics.isGetNext = false;
      }
   }
}
