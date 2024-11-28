import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';

import { DB_Type_ID, Helpers, Mnemonic_Type_ID, Op_Type, Op_Type_ID, SyncQuery, User_Action_Request } from '../../providers/helpers/helpers';
import { Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';


@Component({
   selector: 'page-edit-numbers',
   templateUrl: 'edit-numbers.html',
   styleUrl: 'edit-numbers.scss'
})
export class EditNumbersPage {
   public pageName:string = "Edit Numbers";
   public database_misc: SQLiteDBConnection | null = null;
   progressLoader: any;
   editNumbers: any;
   logged_in: any;
   isTitlesGlobal: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   private onPauseSubscription: Subscription;

   constructor(public navCtrl: NavController, private platform: Platform, private alertCtrl: AlertController, public progress: LoadingController, public storage: Storage, public helpers: Helpers) {
      console.log("EDIT NUMBERS CONSTRUCTOR CALLED.");
      this.onPauseSubscription = this.platform.pause.subscribe(() => {
         this.saveStorage();
      });
      this.isTitlesGlobal = true;
   }

   ngOnDestroy() {
      console.log("ngOnDestroy called");
      this.saveStorage();
      this.onPauseSubscription.unsubscribe();
   }

   async ngOnInit() {      
      this.editNumbers = {};
      Helpers.currentPageName = this.pageName;
      this.editNumbers.user = Helpers.User;
      await this.storage.create();
      this.editNumbers.usernamePadding = []
      for (var i = 0; i < 100; i++) {
         this.editNumbers.usernamePadding.push("&nbsp;");
      }
      this.helpers.setEncryptionKey(this.helpers.usernameHash(this.editNumbers.user.Username));
      this.editNumbers.Is_One_Number = true;
      this.editNumbers.selectedInsertAction = "number_major";
      //FOR INPUTTING NUMBER MNEMONICS===================================>
      this.editNumbers.numberPowers = [];
      var powerName = "", npAbs = 0, spPows = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
      for (var np = -36; np <= 36; np++) {
         powerName = "10^" + np;
         npAbs = Math.abs(np);
         if (npAbs === 3) powerName += "(thousand";
         if (npAbs === 6) powerName += "(million";
         else if (npAbs === 9) powerName += "(billion";
         else if (npAbs === 12) powerName += "(trillion";
         else if (npAbs === 15) powerName += "(quadrillion";
         else if (npAbs === 18) powerName += "(quintillion";
         else if (npAbs === 21) powerName += "(sextillion";
         else if (npAbs === 24) powerName += "(septillion";
         else if (npAbs === 27) powerName += "(octillion";
         else if (npAbs === 30) powerName += "(nonillion";
         else if (npAbs === 33) powerName += "(decillion";
         else if (npAbs === 36) powerName += "(undecillion";
         if (spPows.indexOf(npAbs) >= 0 && np < 0) powerName += "th)";
         else if (spPows.indexOf(np) >= 0) powerName += ")";
         if (np === 0) powerName += "(X1)";
         this.editNumbers.numberPowers.push({ "name": powerName, "value": np });
      }
      this.editNumbers.inputNumberPower = this.editNumbers.numberPowers[36];
      //======================================================================>
      this.editNumbers.isShowInsertOptions = false;
      this.editNumbers.userTable = Helpers.TABLES_MISC.user_number;
      this.editNumbers.shareTable = Helpers.TABLES_MISC.global_number;
      var getOld: myObject = {};
      this.editNumbers.getOld = getOld;
      this.editNumbers.selectedType = "PERSONAL";
      this.editNumbers.invalidTitle = false;
      this.editNumbers.selectedTitle = null;
      this.editNumbers.selectedTable = Helpers.TABLES_MISC.global_number;
      this.editNumbers.isInit = true;
      this.editNumbers.numbers = [];
      this.editNumbers.username = Helpers.User.Username;
      this.editNumbers.numberEntries = null;
      this.editNumbers.isBeginEdit = true;
      this.database_misc = this.helpers.getDatabaseMisc();
      this.storage.get('EDIT_NUMBERS_SELECTED_TABLE').then((val) => {
         if (val != null && Helpers.User.Username !== "GUEST") {
            this.editNumbers.selectedTable = val;
         }
         this.storage.get('EDIT_NUMBERS_SELECTED_ACTION').then((val) => {
            if (val != null) {
               this.editNumbers.selectedAction = val;
            }
            this.storage.get('EDIT_NUMBERS_SELECTED_TYPE').then((val) => {
               if (val != null) {
                  this.editNumbers.selectedType = val;
               }
               this.background_color = Helpers.background_color;
               this.button_color = Helpers.button_color;
               this.button_gradient = Helpers.button_gradient;
               this.editNumbers.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
                  this.background_color = bgColor;
               });
               this.editNumbers.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
                  this.button_color = buttonColor.value;
                  this.button_gradient = buttonColor.gradient;
               });               
               this.helpers.getNumbersTitles(false, this.editNumbers.selectedTable, this.editNumbers.selectedType).then((entries) => {
                  this.finishGetTitles(this.editNumbers.selectedTable, entries);
                  this.helpers.dismissProgress();
               });
            });
         });
      });
   }

   ionViewWillLeave() {
      console.log('ionViewWillLeave EditNumbersPage');
      this.editNumbers.subscribedBackgroundColorEvent.unsubscribe();
      this.editNumbers.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   saveStorage() {
      console.log("saveStorage called");
      this.saveTitle().then(() => {
         this.storage.set('EDIT_NUMBERS_SELECTED_ACTION', this.editNumbers.selectedAction).then(() => {
            this.storage.set('EDIT_NUMBERS_SELECTED_TYPE', this.editNumbers.selectedType).then(() => {
               this.storage.set('EDIT_NUMBERS_SELECTED_TABLE', this.editNumbers.selectedTable).then(() => {
                  this.storage.set('EDIT_NUMBERS_IS_BEGIN_EDIT', this.editNumbers.isBeginEdit).then(() => {
                     console.log("SAVING EDIT_NUMBERS_IS_BEGIN_EDIT TO=" + this.editNumbers.isBeginEdit);
                     if (this.editNumbers.selectedAction === "UPDATE" || this.editNumbers.selectedAction === "INSERT") {
                        this.saveNumberEntries().then(() => {
                           console.log("ionViewWillLeave: EDIT_NUMBERS_NUMBER_ENTRIES=" + this.editNumbers.numbers.length);
                           if (this.editNumbers.isBeginEdit === false) {
                              this.saveNumberEntry(0);
                           }
                        });
                     }
                  });
               });
            });
         });
      });
   }

   saveTitle(): Promise<void> {
      console.log("saveTitle called");
      return new Promise((resolve, reject) => {
         if (this.editNumbers.selectedAction !== "INSERT") {
            if (this.editNumbers.selectedTitle) {
               this.storage.set('EDIT_NUMBERS_SELECTED_TITLE', JSON.stringify(this.editNumbers.selectedTitle)).then(() => {
                  resolve();
               });
            } else {
               resolve();
            }
         } else {
            var inputTitle = this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number ? this.helpers.decryptData(this.editNumbers.inputTitle) : this.editNumbers.inputTitle;
            this.storage.set('EDIT_NUMBERS_INPUT_TITLE', inputTitle).then(() => {
               resolve();
            });
         }
      });
   }

   saveNumberEntries(): Promise<void> {
      return new Promise((resolve, reject) => {
         if (this.editNumbers.numberEntries != null) {
            this.storage.set('EDIT_NUMBERS_NUMBER_ENTRIES', this.editNumbers.numberEntries).then(() => {
               resolve();
            });
         } else {
            this.storage.set('EDIT_NUMBERS_NUMBER_ENTRIES', this.editNumbers.numbers.length).then(() => {
               resolve();
            });
         }
      });
   }

   saveNumberEntry(index:number) {
      if (index < this.editNumbers.numbers.length) {
         var entry = this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number ? this.helpers.encryptData(this.editNumbers.numbers[index].Entry) : this.editNumbers.numbers[index].Entry;
         this.storage.set('EDIT_NUMBERS_NUMBERS_' + index + "_NUMBER", entry).then(() => {
            var entryInfo = this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number ? this.helpers.encryptData(this.editNumbers.numbers[index].Entry_Info) : this.editNumbers.numbers[index].Entry_Info;
            this.storage.set('EDIT_NUMBERS_NUMBERS_' + index + "_ENTRY_INFO", entryInfo).then(() => {
               var entryMne = this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number ? this.helpers.encryptData(this.editNumbers.numbers[index].Entry_Mnemonic) : this.editNumbers.numbers[index].Entry_Mnemonic;
               this.storage.set('EDIT_NUMBERS_NUMBERS_' + index + "_ENTRY_MNEMONIC", entryMne).then(() => {
                  var entryMneInf = this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number ? this.helpers.encryptData(this.editNumbers.numbers[index].Entry_Mnemonic_Info) : this.editNumbers.numbers[index].Entry_Mnemonic_Info;
                  this.storage.set('EDIT_NUMBERS_NUMBERS_' + index + "_ENTRY_MNEMONIC_INFO", entryMneInf).then(() => {
                     index++;
                     this.saveNumberEntry(index);
                  });
               });
            });
         });
      }
   }

   doLoadTitles() {//CALLED FROM HTML
      console.log("doLoadTitles called");
      this.loadTitles(false).then(() => {
         this.helpers.dismissProgress();
      });
   }

   loadTitles(isDoingProgress:boolean): Promise<void> {
      console.log("loadTitles called. this.editNumbers.selectedTable=" + this.editNumbers.selectedTable);
      return new Promise((resolve, reject) => {
         if (this.editNumbers.selectedAction && this.editNumbers.selectedAction === "INSERT") {
            this.editNumbers.selectedAction = "UPDATE";
         }
         this.helpers.getNumbersTitles(isDoingProgress, this.editNumbers.selectedTable, this.editNumbers.selectedType).then((entries) => {
            this.finishGetTitles(this.editNumbers.selectedTable, entries);
            resolve();
         });
      });
   }

   finishGetTitles(table:any, entries:any): Promise<void> {
      console.log("finishGetTitles called");
      return new Promise((resolve, reject) => {
         if (entries.length > 0) {
            this.editNumbers.titles = entries.slice();
            //var rqImg = '<img src="assets/imgs/rq_img.png">', imgTxt="";
            var showUsername = "No-User";
            this.editNumbers.titles.forEach((tit:any) => {
               tit.Title_Show = this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number ? this.helpers.decryptData(tit.Title) : tit.Title;
               //imgTxt = tit.Username === Helpers.User.Username? "" : rqImg;
               //tle.showOption = this.editNumbers.selectedTable === Helpers.TABLES_MISC.global_number ? (this.editNumbers.usernamePadding.slice(0, maxUsernameLength - tle.Username.length).join("") + tle.Username + " -- " + tle.Title_Show) : tle.Title_Show;
               showUsername = tit.Username!=null? tit.Username : "No-User";
               tit.showOption = this.editNumbers.selectedTable===this.editNumbers.shareTable? (tit.Title_Show + " <<i>" + showUsername + "</i>>") : tit.Title_Show;
            });
            //console.log("GOT TITLES = " + JSON.stringify(this.editNumbers.titles));
            this.editNumbers.titles = this.editNumbers.titles.sort(this.helpers.sortByItemStrings("Title_Show", false));
         }
         this.editNumbers.isBeginEdit = true;
         if (this.editNumbers.isInit === true) {
            this.editNumbers.isInit = false;
            this.setSavedTitle().then(() => {
               this.storage.get('EDIT_NUMBERS_IS_BEGIN_EDIT').then((val) => {
                  console.log('getTitles: EDIT_NUMBERS_IS_BEGIN_EDIT=' + val);
                  this.editNumbers.isBeginEdit = val;
                  if (this.editNumbers.selectedAction !== "DELETE") {
                     this.storage.get('EDIT_NUMBERS_NUMBER_ENTRIES').then((val) => {
                        this.editNumbers.numberEntries = val;
                        if (this.editNumbers.isBeginEdit === false) {
                           console.log('getTitles: EDIT_NUMBERS_NUMBER_ENTRIES=' + val);
                           this.editNumbers.numbers = [];
                           for (var i = 0; i < this.editNumbers.numberEntries; i++) {
                              this.editNumbers.numbers.push({ Entry: "", Entry_Info: "", Entry_Mnemonic: "", Entry_Mnemonic_Info: "", invalidNumber: false, invalidMnemonic: false, invalidMnemonicInfo: false, invalidEntryInfo: false });
                           }
                           if (this.editNumbers.numberEntries > 0) {
                              this.getSavedNumber(0, () => {
                                 resolve();
                              });
                           } else {
                              resolve();
                           }
                        } else {
                           resolve();
                        }
                     });
                  } else {//IF IS DELETE:
                     resolve();
                  }
               });
            });
         } else {//END IF IS INIT IS TRUE          
            if (this.editNumbers.titles && this.editNumbers.titles.length > 0) {
               this.editNumbers.selectedTitle = this.editNumbers.titles[0];
            }
            resolve();
         }
      });
   }

   setSavedTitle(): Promise<void> {
      console.log("setSavedTitle called");
      return new Promise((resolve, reject) => {
         this.storage.get('EDIT_NUMBERS_SELECTED_TITLE').then((val) => {
            if (val != null) {
               this.editNumbers.selectedTitle = JSON.parse(val);
            }
            if (this.editNumbers.selectedTitle == null) {
               if (this.editNumbers.titles && this.editNumbers.titles.length > 0) {
                  this.editNumbers.selectedTitle = this.editNumbers.titles[0];
               }
            }
            this.storage.get('EDIT_NUMBERS_INPUT_TITLE').then((val) => {
               this.editNumbers.inputTitle = this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number ? this.helpers.decryptData(val) : val;
               resolve();
            });
         });
      });
   }

   getSavedNumber(index:number, callback:Function) {
      if (index < this.editNumbers.numbers.length) {
         this.storage.get('EDIT_NUMBERS_NUMBERS_' + index + "_NUMBER").then((val) => {
            this.editNumbers.numbers[index].Entry = this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number ? this.helpers.decryptData(val) : val;
            this.storage.get('EDIT_NUMBERS_NUMBERS_' + index + "_ENTRY_INFO").then((val) => {
               this.editNumbers.numbers[index].Entry_Info = this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number ? this.helpers.decryptData(val) : val;
               this.storage.get('EDIT_NUMBERS_NUMBERS_' + index + "_ENTRY_MNEMONIC").then((val) => {
                  this.editNumbers.numbers[index].Entry_Mnemonic = this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number ? this.helpers.decryptData(val) : val;
                  this.storage.get('EDIT_NUMBERS_NUMBERS_' + index + "_ENTRY_MNEMONIC_INFO").then((val) => {
                     this.editNumbers.numbers[index].Entry_Mnemonic_Info = this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number ? this.helpers.decryptData(val) : val;
                     index++;
                     this.getSavedNumber(index, callback);
                  });
               });
            });
         });
      } else {
         this.getTotalNumberPrompt();
         callback();
      }
   }

   initSelectAction() {
      console.log("initSelectAction called.");
      this.editNumbers.inputTitle = "";
      this.editNumbers.isBeginEdit = true;
      this.editNumbers.numbers = [];
      if (this.editNumbers.selectedAction === "UPDATE") {
         this.editNumbers.isShowInsertOptions = false;
      } else if (this.editNumbers.selectedAction === "DELETE") {
         this.editNumbers.isShowInsertOptions = false;
      } else if (this.editNumbers.selectedAction === "INSERT") {
         this.editNumbers.isShowInsertOptions = true
      }
   }

   selectAction() {
      console.log("selectAction called. this.editNumbers.selectedAction=" + this.editNumbers.selectedAction);
      this.editNumbers.results = "";
      if (this.editNumbers.selectedAction === "UPDATE") {
         this.doBeginUpdateNumbers();
      }
      else if (this.editNumbers.selectedAction === "INSERT") {
         this.startInsert();
      }
   }


   doBeginUpdateNumbers() {
      console.log("doBeginUpdateNumbers called.");
      if (this.editNumbers.selectedTitle == null) {
         this.helpers.myAlert("ALERT", "<b>Need to select a title.</b>", "", "Dismiss");
         return;
      }
      this.editNumbers.isEditing = true;
      var numbers_table = this.editNumbers.selectedTable;
      if (this.editNumbers.selectedTable !== Helpers.TABLES_MISC.global_number && this.editNumbers.selectedTable !== Helpers.TABLES_MISC.user_number) {
         this.helpers.myAlert("ALERT", "<b>Need to select 'Shared Numbers` or `User's Numbers'</b>", "", "Dismiss");
         return;
      }
      console.log("this.editNumbers.selectedTitle = " + JSON.stringify(this.editNumbers.selectedTitle));
      this.helpers.setProgress("Loading title: <br /><b>" + this.editNumbers.selectedTitle.Title_Show + "</b><br />, please wait...", false).then(() => {
         if (Helpers.isWorkOffline === false) {
            var params = {
               "table": numbers_table,
               "user_id": this.editNumbers.selectedTitle.User_ID,
               "data_type_id": this.editNumbers.selectedTitle.Data_Type_ID,
               "number_id": this.editNumbers.selectedTitle.Number_ID
            };
            this.helpers.makeHttpRequest("/lfq_directory/php/edit_numbers_get.php", "GET", params).then((data) => {
               this.helpers.dismissProgress();
               if (data["SUCCESS"] === true) {
                  this.finishBeginUpdateNumbers(data["ENTRIES"]);
               } else {
                  this.helpers.alertLfqError(data["ERROR"]);
               }
            }, error => {
               this.editNumbers.results = "Sorry. Error beginning update: " + error.message;
               this.helpers.alertServerError("Sorry. Error beginning update: " + error.message);
               this.helpers.dismissProgress();
            });
         } else {//IF OFFLINE:
            var getEntrySql = "";
            if (numbers_table === Helpers.TABLES_MISC.global_number) {
               getEntrySql = "SELECT * FROM "
               getEntrySql += Helpers.TABLES_MISC.global_number + " AS gn ";
               getEntrySql += "INNER JOIN " + Helpers.TABLES_MISC.global_number_entry + " AS gne ON gne.Number_ID=gn.ID ";
               getEntrySql += "WHERE gn.ID='" + this.editNumbers.selectedTitle.Number_ID + "'";
            } else {
               getEntrySql = "SELECT * FROM "
               getEntrySql += Helpers.TABLES_MISC.user_number + " AS un "
               getEntrySql += "INNER JOIN " + Helpers.TABLES_MISC.user_number_entry + " AS une ON une.Number_ID=un.ID ";
               getEntrySql += "INNER JOIN " + Helpers.TABLES_MISC.data_type + " AS dt ON dt.ID=un.Data_Type_ID ";
               getEntrySql += "WHERE un.ID='" + this.editNumbers.selectedTitle.Number_ID + "'";
            }
            console.log("getEntrySql=" + getEntrySql);
            this.helpers.query(this.database_misc, getEntrySql, 'query', []).then((data) => {
               var entries = [];
               for (var i = 0; i < data.values.length; i++) {
                  entries.push(data.values[i]);
               }
               this.finishBeginUpdateNumbers(entries);
               this.helpers.dismissProgress();
            }).catch((error) => {
               console.log("sql:" + getEntrySql + ", ERROR:" + error.message);
               this.editNumbers.results = "Sorry. Error beginning update";
               this.helpers.dismissProgress();
            });
         }
      });
   }

   finishBeginUpdateNumbers(entries:any) {
      console.log("finishBeginUpdateNumbers called");
      if (entries.length > 0) {
         this.editNumbers.getOld = entries;
         this.editNumbers.inputTitle = this.editNumbers.selectedTitle.Title_Show;
         console.log("SET this.editNumbers.getOld = " + JSON.stringify(this.editNumbers.getOld));
         this.editNumbers.results = "BEGIN UPDATE FOR " + entries[0].Title + ".";
         var num_entries = entries.length;
         console.log("num_entries=" + num_entries);
         this.editNumbers.numberEntries = num_entries;
         this.startInsert();
         if (entries[0].Type) {
            this.editNumbers.selectedType = entries[0].Type;
            console.log("doBeginUpdateNumbers: SET TYPE TO=" + this.editNumbers.selectedType);
         }
         console.log("entries[0].Number = '" + entries[0].Number + "'");
         this.editNumbers.Is_One_Number = !entries[0].Number ? false : true;
         if (this.editNumbers.Is_One_Number === true) {
            if (this.editNumbers.selectedTable === Helpers.TABLES_MISC.global_number) {
               this.editNumbers.inputNumber = entries[0].Number;
            } else {
               this.editNumbers.inputNumber = this.helpers.decryptData(entries[0].Number);
            }
            if (entries[0].Number_Power) {
               var indexNumberPower = this.editNumbers.numberPowers.map((np:any) => { return parseInt(np.value); }).indexOf(parseInt(entries[0].Number_Power));
               console.log("GOT indexNumberPower = " + indexNumberPower);
               this.editNumbers.inputNumberPower = this.editNumbers.numberPowers[indexNumberPower];
            }
         }
         for (var i = 0; i < entries.length; i++) {
            if (this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) {
               this.editNumbers.numbers[i]["Entry"] = this.helpers.decryptData(entries[i].Entry);
               this.editNumbers.numbers[i]["Entry_Info"] = this.helpers.decryptData(entries[i].Entry_Info);
               this.editNumbers.numbers[i]["Entry_Mnemonic"] = this.helpers.decryptData(entries[i].Entry_Mnemonic);
               this.editNumbers.numbers[i]["Entry_Mnemonic_Info"] = this.helpers.decryptData(entries[i].Entry_Mnemonic_Info);
            } else {
               this.editNumbers.numbers[i]["Entry"] = entries[i].Entry;
               this.editNumbers.numbers[i]["Entry_Info"] = entries[i].Entry_Info;
               this.editNumbers.numbers[i]["Entry_Mnemonic"] = entries[i].Entry_Mnemonic;
               this.editNumbers.numbers[i]["Entry_Mnemonic_Info"] = entries[i].Entry_Mnemonic_Info;
            }
         }
         console.log("this.editNumbers.numbers = " + JSON.stringify(this.editNumbers.numbers));
         this.getTotalNumberPrompt();
         this.editNumbers.isBeginEdit = false;
      }
   }

   startInsert() {
      console.log("startInsert called.");
      this.editNumbers.totalNumber = "";
      var num_entries = 0;
      if (this.editNumbers.isBeginEdit === true) {
         if (this.editNumbers.numberEntries != null) {
            num_entries = this.editNumbers.numberEntries;
         }
         console.log("startInsert num_entries=" + num_entries);
         this.editNumbers.numbers = [];
         for (var i = 0; i < num_entries; i++) {
            this.editNumbers.numbers.push({ Entry: "", Entry_Info: "", Entry_Mnemonic: "", Entry_Mnemonic_Info: "", invalidNumber: false, invalidMajor: false });
         }
         if (num_entries > 0) {
            this.editNumbers.isBeginEdit = false;
         } else {
            this.helpers.myAlert("ALERT", "<b>Need to enter how many entries.</b>", "", "Dismiss");
         }
      }
   }

   backUp() {
      console.log("backUp called.");
   }

   initInsert() {
      console.log("initInsert called.");
      this.editNumbers.isBeginEdit = true;
   }

   addNumber(index:number) {
      console.log("addNumber called.");
      this.editNumbers.numberEntries++;
      this.editNumbers.numbers.splice((index + 1), 0, ({ Entry: "", Entry_Info: "", Entry_Mnemonic: "", Entry_Mnemonic_Info: "", invalidNumber: false, invalidMajor: false }));
   }
   removeNumber(index:number) {
      console.log("removeNumber called.");
      this.editNumbers.numberEntries--;
      this.editNumbers.numbers.splice(index, 1);
      this.getTotalNumberPrompt();
   }
   addAfterNumber() {
      console.log("addAfterNumber called.");
      this.editNumbers.numberEntries++;
      this.editNumbers.numbers.push({ Entry: "", Entry_Info: "", Entry_Mnemonic: "", Entry_Mnemonic_Info: "", invalidNumber: false, invalidMajor: false });
   }

   editNumber() {
      console.log("editNumber called.");
      this.editNumbers.results = "";
      if (this.editNumbers.selectedAction === "DELETE") {
         this.deleteNumber();
      } else if (this.editNumbers.selectedAction === "INSERT") {
         this.insertNumber();
      } else if (this.editNumbers.selectedAction === "UPDATE") {
         this.updateNumber();
      }
   }

   async deleteNumber() {
      console.log("deleteNumber called. this.editNumbers.selectedTable=" + this.editNumbers.selectedTable);
      var where_username = "";
      if (this.editNumbers.selectedTable == null || (this.editNumbers.selectedTable !== Helpers.TABLES_MISC.global_number && this.editNumbers.selectedTable !== Helpers.TABLES_MISC.user_number)) {
         this.helpers.myAlert("ALert", "<b>Must select 'Shared Numbers' or 'User's Numbers'</b>", "", "Dismiss");
         return;
      } else if (this.editNumbers.selectedTitle == null) {
         this.helpers.myAlert("Alert", "<b>Need to select a title.</b>", "", "Dismiss");
         return;
      }
      if (this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) {
         where_username = " AND Username='" + this.editNumbers.username + "'";
      }
      let alert = await this.alertCtrl.create({
         header: 'Confirm Delete',
         message: 'Do you want to remove this:<br />' + this.editNumbers.selectedTitle.Title_Show,
         buttons: [
            {
               text: 'Cancel',
               role: 'cancel',
               cssClass: 'cancelButton',
               handler: () => {
                  console.log('Cancel clicked');
               }
            },
            {
               text: 'Ok',
               cssClass: 'confirmButton',
               handler: data => {
                  console.log('Deleting!');
                  var deleteTitle = this.editNumbers.selectedTitle.Title_Show;
                  this.helpers.setProgress("Deleting " + deleteTitle + " ...", false).then(() => {
                     //DELETES A NUMBER ENTRY:
                     var cvDelete:any = {};
                     cvDelete.ID = this.editNumbers.selectedTitle.Number_ID;
                     var names:any = { "Title": deleteTitle };
                     if (this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) {
                        //ADD User_ID AND Type FOR user_number :
                        var data_type_id = this.editNumbers.selectedTitle.Data_Type_ID;
                        cvDelete.User_ID = Helpers.User.ID;
                        cvDelete.Data_Type_ID = data_type_id;
                        names["Type"] = this.editNumbers.selectedTitle.Type;
                     }
                     //DELETE ENTRIES, THEN DELETE TITLE:
                     //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                     var queries = [
                        new SyncQuery(null, this.editNumbers.selectedTitle.User_ID, DB_Type_ID.DB_MISC, this.editNumbers.selectedTable + "_entry", Op_Type_ID.DELETE, [], [], { "Number_ID": this.editNumbers.selectedTitle.Number_ID }),
                        new SyncQuery(null, this.editNumbers.selectedTitle.User_ID, DB_Type_ID.DB_MISC, this.editNumbers.selectedTable, Op_Type_ID.DELETE, [], [], cvDelete)
                     ];
                     //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
                     this.helpers.autoSync(queries, Op_Type_ID.DELETE, this.editNumbers.selectedTitle.User_ID, names, null, null).then((res) => {
                        if (res.isSuccess === true) {
                           this.editNumbers.results = "DELETED " + deleteTitle + "." + res.results;
                           this.loadTitles(true).then(() => {
                              this.helpers.dismissProgress();
                              this.helpers.myAlert("SUCCESS", "<b>" + this.editNumbers.results + "</b>", "", "OK");
                              return;
                           });
                        } else {
                           console.log("ERROR:" + res.results);
                           this.editNumbers.results = "Sorry. Error deleting number: " + res.results;
                           this.loadTitles(true).then(() => {
                              this.helpers.dismissProgress();
                              this.helpers.myAlert("ERROR", "<b>" + this.editNumbers.results + "</b>", "", "Dismiss");
                              return;
                           });
                        }
                     });
                  });
               }
            }
         ]
      });
      await alert.present();
   }

   insertNumber() {
      console.log("insertNumber called.");
      if (this.doFormatVerify(true) === false) {
         return;
      }
      if (this.editNumbers.numberEntries == null) {
         this.helpers.myAlert("Alert", "<b>Must enter how many mnemonic entries.</b>", "", "OK");
         return;
      }
      console.log("this.editNumbers.selectedTable=" + this.editNumbers.selectedTable);
      if (this.editNumbers.selectedTable == null || (this.editNumbers.selectedTable !== Helpers.TABLES_MISC.global_number && this.editNumbers.selectedTable !== Helpers.TABLES_MISC.user_number)) {
         this.helpers.myAlert("Alert", "<b>Must select 'Shared Numbers' or 'User's Numbers'.</b>", "", "OK");
         return;
      }
      if (this.editNumbers.inputTitle == null || String(this.editNumbers.inputTitle).trim() === "") {
         this.editNumbers.invalidTitle = true;
         this.helpers.myAlert("Alert", "<b>Must enter a title.</b>", "", "OK");
         return;
      }
      if (this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number && this.editNumbers.selectedType == null) {
         this.editNumbers.invalidTitle = true;
         this.helpers.myAlert("Alert", "<b>Must select Personal or Historical Type of Number.</b>", "", "OK");
         return;
      }
      console.log("insertNumber : this.editNumbers.selectedTable=" + this.editNumbers.selectedTable);
      var numbers_table1 = this.editNumbers.selectedTable;
      var numbers_table2 = numbers_table1 + "_entry";
      var inputTitle = this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number ? this.helpers.encryptData(this.editNumbers.inputTitle) : this.editNumbers.inputTitle;
      var wheresExist:any = { "Title": inputTitle };

      var data_type_id;
      if (this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) {
         console.log("insertNumber SETTING USERNAME TO=" + this.editNumbers.username);
         data_type_id = this.editNumbers.selectedType === 'PERSONAL' ? "1" : "2";
         wheresExist["User_ID"] = Helpers.User.ID;//SHOULD BE CURRENT USER ID.
         wheresExist["Data_Type_ID"] = data_type_id;
      }

      this.helpers.setProgress("Inserting...", false).then(() => {
         this.helpers.insertCheckExists(DB_Type_ID.DB_MISC, numbers_table1, wheresExist).then(isExist => {
            if (isExist) {
               this.helpers.dismissProgress();
               this.helpers.myAlert("Alert", "<b>This number entry already exists, please check your entry and try again.</b>", "", "OK");
               return;
            }
            var inputNumber = this.editNumbers.inputNumber;
            //INSERT TITLE FIRST:
            var colsIns = ["User_ID", "Title"];
            var valsIns = [Helpers.User.ID, inputTitle];
            if (this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) {
               data_type_id = this.editNumbers.selectedType === 'PERSONAL' ? '1' : '2';
               colsIns.push("Data_Type_ID");
               valsIns.push(data_type_id);
               inputNumber = this.helpers.encryptData(this.editNumbers.inputNumber);
            }

            if (this.editNumbers.Is_One_Number === true) {
               colsIns = colsIns.concat(["Number", "Number_Power"]);
               valsIns = valsIns.concat([inputNumber, this.editNumbers.inputNumberPower.value])
            }

            var cols = ["Number_ID", "Entry_Index", "Entry", "Entry_Info", "Entry_Mnemonic", "Entry_Mnemonic_Info"];
            var vals = [];
            var num_entries = this.editNumbers.numbers.length;
            var entry, entryInf, entryMne, entryMneInf;
            for (var i = 0; i < num_entries; i++) {
               entry = (this.editNumbers.numbers[i].Entry && this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) ? this.helpers.encryptData(this.editNumbers.numbers[i].Entry) : this.editNumbers.numbers[i].Entry;
               entryInf = (this.editNumbers.numbers[i].Entry_Info && this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) ? this.helpers.encryptData(this.editNumbers.numbers[i].Entry_Info) : this.editNumbers.numbers[i].Entry_Info;
               entryMne = (this.editNumbers.numbers[i].Entry_Mnemonic && this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) ? this.helpers.encryptData(this.editNumbers.numbers[i].Entry_Mnemonic) : this.editNumbers.numbers[i].Entry_Mnemonic;
               entryMneInf = (this.editNumbers.numbers[i].Entry_Mnemonic_Info && this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) ? this.helpers.encryptData(this.editNumbers.numbers[i].Entry_Mnemonic_Info) : this.editNumbers.numbers[i].Entry_Mnemonic_Info;
               vals.push([
                  '-1',
                  (i + 1),
                  entry,
                  entryInf,
                  entryMne,
                  entryMneInf
               ]);
            }
            //INSERTS NEW NUMBER:
            //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
            var queries = [
               new SyncQuery(null, null, DB_Type_ID.DB_MISC, numbers_table1, Op_Type_ID.INSERT_TYPES, colsIns, [valsIns], wheresExist),
               new SyncQuery(null, null, DB_Type_ID.DB_MISC, numbers_table2, Op_Type_ID.INSERT, cols, vals, wheresExist)
            ];
            //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
            this.helpers.autoSync(queries, Op_Type_ID.INSERT_TYPES, null, null, null, null).then((res) => {
               if (res.isSuccess === true) {
                  this.editNumbers.results = "Inserted number with title: " + this.editNumbers.inputTitle + ". " + res.results;
                  this.editNumbers.isBeginEdit === true;
                  this.loadTitles(true).then(() => {
                     this.helpers.dismissProgress();
                     this.helpers.myAlert("Alert", "<b>" + this.editNumbers.results + "</b>", "", "Dismiss");
                  });
               } else {
                  console.log("ERROR:" + res.results);
                  this.editNumbers.results = "Sorry. Error inserting number: " + res.results;
                  this.helpers.dismissProgress();
                  this.helpers.myAlert("Alert", "", "<b>" + this.editNumbers.results + "</b>", "Dismiss");
               }
            });
         });
      });
   }

   updateNumber() {
      console.log("updateNumber called.");
      if (this.doFormatVerify(true) === false) {
         return;
      } else if (this.editNumbers.selectedTitle == null) {
         this.helpers.myAlert("Alert", "<b>Need to select a title.</b>", "", "Dismiss");
         return;
      }
      console.log("updateNumber.this.editNumbers.selectedTitle = " + JSON.stringify(this.editNumbers.selectedTitle));
      this.helpers.setProgress("Updating...", false).then(() => {

         //SET cvUpdate:
         var inputTitle = this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number ? this.helpers.encryptData(this.editNumbers.inputTitle) : this.editNumbers.inputTitle;
         var data_type_id;
         var mnemonic_type_id = Mnemonic_Type_ID[this.editNumbers.selectedInsertAction];
         var colsUpd = ["Title", "Mnemonic_Type_ID"];
         var valsUpd = [inputTitle, mnemonic_type_id];
         var rqUserIdOld = this.editNumbers.selectedTitle.User_ID;
         if (this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) {
            data_type_id = this.editNumbers.selectedTitle.Data_Type_ID;
            colsUpd.push("Data_Type_ID");
            valsUpd.push(data_type_id);
            rqUserIdOld = null;
         }
         var inputNumber = null;
         if (this.editNumbers.Is_One_Number === true) {
            inputNumber = this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number ? this.helpers.encryptData(this.editNumbers.inputNumber) : this.editNumbers.inputNumber;
            colsUpd = colsUpd.concat(["Number", "Number_Power"]);
            valsUpd = valsUpd.concat([inputNumber, this.editNumbers.inputNumberPower.value]);
         }


         var cols = ["Number_ID", "Entry_Index", "Entry", "Entry_Info", "Entry_Mnemonic", "Entry_Mnemonic_Info"];
         var vals = [];
         var entry, entryInf, entryMne, entryMneInf;
         for (var i = 0; i < this.editNumbers.numbers.length; i++) {
            //SET NUMBER_ID TO -1 BECUASE WON'T KNOW IT UNTIL AFTER INSERT TITLE:
            entry = (this.editNumbers.numbers[i].Entry && this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) ? this.helpers.encryptData(this.editNumbers.numbers[i].Entry) : this.editNumbers.numbers[i].Entry;
            entryInf = (this.editNumbers.numbers[i].Entry_Info && this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) ? this.helpers.encryptData(this.editNumbers.numbers[i].Entry_Info) : this.editNumbers.numbers[i].Entry_Info;
            entryMne = (this.editNumbers.numbers[i].Entry_Mnemonic && this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) ? this.helpers.encryptData(this.editNumbers.numbers[i].Entry_Mnemonic) : this.editNumbers.numbers[i].Entry_Mnemonic;
            entryMneInf = (this.editNumbers.numbers[i].Entry_Mnemonic_Info && this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) ? this.helpers.encryptData(this.editNumbers.numbers[i].Entry_Mnemonic_Info) : this.editNumbers.numbers[i].Entry_Mnemonic_Info;
            vals.push([
               this.editNumbers.selectedTitle.Number_ID,
               (i + 1),
               entry,
               entryInf,
               entryMne,
               entryMneInf
            ]);
         }
         //UPDATES NUMBER       
         var queries: Array<SyncQuery> = [];
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         var wheresUpd = { "Title": this.editNumbers.selectedTitle.Title };
         queries.push(new SyncQuery(null, this.editNumbers.selectedTitle.User_ID, DB_Type_ID.DB_MISC, this.editNumbers.selectedTable, Op_Type_ID.UPDATE, colsUpd, valsUpd, wheresUpd, User_Action_Request.USER_ID_UPDATE));
         queries.push(new SyncQuery(null, this.editNumbers.selectedTitle.User_ID, DB_Type_ID.DB_MISC, this.editNumbers.selectedTable + "_entry", Op_Type_ID.DELETE_INNER_JOIN, [this.editNumbers.selectedTable], [{"A":"Number_ID", "B":"ID"}], wheresUpd));
         queries.push(new SyncQuery(null, this.editNumbers.selectedTitle.User_ID, DB_Type_ID.DB_MISC, this.editNumbers.selectedTable, Op_Type_ID.GET_ID_INSERT_MANY, [], [], wheresUpd)),
         queries.push(new SyncQuery(null, this.editNumbers.selectedTitle.User_ID, DB_Type_ID.DB_MISC, this.editNumbers.selectedTable + "_entry", Op_Type_ID.INSERT, cols, vals, wheresUpd));

         var entriesOld:any = null;
         var entriesNew:any = null;
         var rqNames:any = null;
         if (this.editNumbers.selectedTable === Helpers.TABLES_MISC.global_number) {
            entriesOld = { "Title": this.editNumbers.selectedTitle.Title, "Entries": [] };
            entriesNew = { "Title": this.editNumbers.inputTitle, "Entries": [] };
            var entryObj:any = {};
            var allowedEntries:any = ["Entry", "Entry_Info", "Entry_Mnemonic", "Entry_Mnemonic_Info"];
            //FOR OLD ENTRIES:
            for (var eo = 0; eo < this.editNumbers.getOld.length; eo++) {
               entryObj = {};
               for (var prop in this.editNumbers.getOld[eo]) {
                  if (allowedEntries.indexOf(prop) >= 0) {
                     entryObj[prop] = this.editNumbers.getOld[eo][prop];
                  }
               }
               entriesOld.Entries.push(entryObj);
            }
            //FOR NEW ENTRIES:
            for (var eo = 0; eo < this.editNumbers.numbers.length; eo++) {
               entryObj = {};
               for (var prop in this.editNumbers.numbers[eo]) {
                  if (allowedEntries.indexOf(prop) >= 0) {
                     entryObj[prop] = this.editNumbers.numbers[eo][prop];
                  }
               }
               entriesNew.Entries.push(entryObj);
            }
            rqNames = { "Title": this.editNumbers.selectedTitle.Title };
            if (this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) {
               rqNames["Type"] = this.editNumbers.selectedType;
            }
         }
         this.helpers.autoSync(queries, Op_Type_ID.UPDATE_NUMBERS, rqUserIdOld, rqNames, entriesOld, entriesNew).then((res) => {
            if (res.isSuccess === true) {
               this.editNumbers.results = "Updated number title: " + this.editNumbers.selectedTitle.Title_Show + ".";
               this.editNumbers.isBeginEdit = true;
               this.helpers.dismissProgress();
               this.helpers.myAlert("Alert", "", "<b>Updated number title: " + this.editNumbers.selectedTitle.Title_Show + ". " + res.results + "</b>", "OK");
            } else {
               console.log("ERROR:" + res.results);
               this.editNumbers.results = "Sorry. Error updating number";
               this.helpers.dismissProgress();
               this.helpers.myAlert("Alert", "", "<b>Sorry. Error updating number.</b>" + res.results, "Dismiss");
            }
         });
      });
   }

   resetNumbers() {
      console.log('resetNumbers called selectedTitle=' + JSON.stringify(this.editNumbers.selectedTitle));
      console.log("resetNumbers editNumbers.selectedTable = " + JSON.stringify(this.editNumbers.selectedTable));
      this.editNumbers.isBeginEdit = true;
      this.editNumbers.numbers = [];
      this.editNumbers.numberEntries = null;
   }

   resetAll() {
      console.log('resetAll called');
      this.editNumbers.titles = [];
      this.editNumbers.selectedTitle = null;
      this.resetNumbers();
   }

   formatVerify(index: number, isAlert: boolean) {
      console.log("formatVerify called");
      var isGetMajorWords = (index !== -1 && this.editNumbers.selectedInsertAction === 'number_major') ? true : false;
      var majorNumber = null;
      if (isGetMajorWords === true) {
         majorNumber = this.editNumbers.numbers[index].Entry;
      }
      isGetMajorWords = (majorNumber == null || String(majorNumber).trim() === "") ? false : true;
      this.doGetMajorWords(isGetMajorWords, index, majorNumber).then(() => {
         this.doFormatVerify(isAlert);
      });
   }

   doGetMajorWords(isGet: boolean, index: number, number: number): Promise<void> {
      console.log("doGetMajorWords called");
      return new Promise((resolve, reject) => {
         if (isGet === false) {
            resolve();
         } else {
            this.helpers.getMajorWords(number, 100).then(majorWords => {
               majorWords.forEach((mw:any) => {
                  mw.Word = this.helpers.formatWord(mw.Word.split(""), this.editNumbers.numbers[index].Entry);
               });
               //console.log("GOT MAJOR WORDS = " + JSON.stringify(majorWords));
               this.editNumbers.numbers[index].majorWords = majorWords;
               resolve();
            });
         }
      });
   }

   doFormatVerify(isAlert:boolean): Boolean {
      console.log("doFormatVerify called. isAlert = " + isAlert + ", this.editNumbers.selectedInsertAction = " + this.editNumbers.selectedInsertAction);
      var ret = true;
      var isInvalid = true;
      var isNullNumberInput = false;
      var isInvalidNumberMajor = false;
      var isInvalidNumberLetters = false;
      var isInvalidEncription = false;
      var invalidEncription = "";
      this.editNumbers.invalidTitle = false;
      if ((this.editNumbers.selectedAction === "INSERT" || this.editNumbers.selectedAction === "UPDATE") && (this.editNumbers.inputTitle == null || this.editNumbers.inputTitle.trim() === '')) {
         this.editNumbers.invalidTitle = true;
      }
      if (this.editNumbers.Is_One_Number === true && (!this.editNumbers.inputNumber || !this.editNumbers.inputNumberPower)) {
         isInvalid = true;
         ret = false;
         if (this.editNumbers.selectedInsertAction === 'number_major') {
            isInvalidNumberMajor = true;
         } else if (this.editNumbers.selectedInsertAction === 'number_letters') {
            isInvalidNumberLetters = true;
         }
      } else if (this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number && this.editNumbers.Is_One_Number === true && this.editNumbers.inputNumber) {
         if (this.helpers.decryptData(this.helpers.encryptData(this.editNumbers.inputNumber)) !== this.editNumbers.inputNumber) {
            isInvalidEncription = true;
            invalidEncription = this.editNumbers.inputNumber;
         }
      }

      for (var i = 0; i < this.editNumbers.numbers.length; i++) {
         this.editNumbers.numbers[i].invalidNumber = false;
         this.editNumbers.numbers[i].invalidMnemonic = false;
         this.editNumbers.numbers[i].invalidEntryInfo = false;
         this.editNumbers.numbers[i].invalidMnemonicInfo = false;
         this.editNumbers.numbers[i].Entry = String(this.editNumbers.numbers[i].Entry).replace(/[^0-9]/ig, '');
         this.editNumbers.numbers[i].Entry_Mnemonic = String(this.editNumbers.numbers[i].Entry_Mnemonic).replace(/[^A-Z]/ig, '');
         //FORMAT WORD:
         //CHECK FOR isInvalidNumber:     
         if (this.editNumbers.numbers[i].Entry_Mnemonic != null && String(this.editNumbers.numbers[i].Entry_Mnemonic).trim() !== "") {
            if (this.editNumbers.selectedInsertAction === "number_major") {
               if (this.editNumbers.numbers[i].Entry != null && String(this.editNumbers.numbers[i].Entry).trim() !== "") {
                  //FORMAT MAJOR WORD:-----------------------------
                  this.editNumbers.numbers[i].Entry_Mnemonic = this.helpers.formatWord(String(this.editNumbers.numbers[i].Entry_Mnemonic).split(""), this.editNumbers.numbers[i].Entry);
                  //----------------------------------------------------
                  if (String(this.editNumbers.numbers[i].Entry) !== String(this.helpers.getMajorSystemNumber(this.editNumbers.numbers[i].Entry_Mnemonic, 0, this.editNumbers.numbers[i].Entry)).substring(0, String(this.editNumbers.numbers[i].Entry).length)) {
                     console.log("NUMBERS DONT MATCH! INVALIDATING! : ...");
                     //isInvalidNumber:
                     isInvalidNumberMajor = true;
                     this.editNumbers.numbers[i].invalidNumber = true;
                     this.editNumbers.numbers[i].invalidMnemonic = true;
                  }
               } else {
                  //nullNumber INPUT:
                  isNullNumberInput = true;
                  this.editNumbers.numbers[i].invalidNumber = true;
               }

            } else if (this.editNumbers.selectedInsertAction === "number_letters") {
               console.log("doFormatVerify called DOING number_letters");
               this.editNumbers.numbers[i].Entry = String(this.editNumbers.numbers[i].Entry_Mnemonic).length;
               //----------------------------------------------------
               if (parseInt(this.editNumbers.numbers[i].Entry) !== this.editNumbers.numbers[i].Entry_Mnemonic.length) {
                  isInvalidNumberLetters = true;
                  this.editNumbers.numbers[i].invalidNumber = true;
                  this.editNumbers.numbers[i].invalidMnemonic = true;
                  ret = false;
               }
            }
         } else {
            //nullNumber INPUT:
            isNullNumberInput = true;
            this.editNumbers.numbers[i].invalidNumber = true;
         }
         if (this.editNumbers.selectedTable === Helpers.TABLES_MISC.user_number) {
            //FOR INVALID ENCRIPTION CHECKS:
            if (this.editNumbers.numbers[i].Entry != null && String(this.editNumbers.numbers[i].Entry).trim() !== "") {
               if (this.helpers.decryptData(this.helpers.encryptData(this.editNumbers.numbers[i].Entry)) !== this.editNumbers.numbers[i].Entry) {
                  isInvalidEncription = true;
                  this.editNumbers.numbers[i].invalidNumber = true;
                  invalidEncription = this.editNumbers.numbers[i].Entry;
               }
            }
            if (this.editNumbers.numbers[i].Entry_Info != null && String(this.editNumbers.numbers[i].Entry_Info).trim() !== "") {
               //console.log("TEST formatVerify Entry_Info ENCRYPTION...");
               if (this.helpers.decryptData(this.helpers.encryptData(this.editNumbers.numbers[i].Entry_Info)) !== this.editNumbers.numbers[i].Entry_Info) {
                  isInvalidEncription = true;
                  this.editNumbers.numbers[i].invalidEntryInfo = true;
                  invalidEncription = this.editNumbers.numbers[i].Entry_Info;
               }
            }
            if (this.editNumbers.numbers[i].Entry_Mnemonic != null && String(this.editNumbers.numbers[i].Entry_Mnemonic).trim() !== "") {
               if (this.helpers.decryptData(this.helpers.encryptData(this.editNumbers.numbers[i].Entry_Mnemonic)) !== this.editNumbers.numbers[i].Entry_Mnemonic) {
                  isInvalidEncription = true;
                  this.editNumbers.numbers[i].invalidMnemonic = true;
                  invalidEncription = this.editNumbers.numbers[i].Entry_Mnemonic;
               }
            }
            if (this.editNumbers.numbers[i].Entry_Mnemonic_Info != null && String(this.editNumbers.numbers[i].Entry_Mnemonic_Info).trim() !== "") {
               if (this.helpers.decryptData(this.helpers.encryptData(this.editNumbers.numbers[i].Entry_Mnemonic_Info)) !== this.editNumbers.numbers[i].Entry_Mnemonic_Info) {
                  isInvalidEncription = true;
                  this.editNumbers.numbers[i].invalidMnemonicInfo = true;
                  invalidEncription = this.editNumbers.numbers[i].Entry_Mnemonic_Info;
               }
            }
         }
      }

      //END LOOP THROUGH NUMBER OBJECTS.
      //INVALID ALERT ERRORS:
      var myAlert = "";
      if (isNullNumberInput === true) {
         myAlert = "Make sure all numbers inputted.";
         ret = false;
      } else if (isInvalidNumberMajor === true) {
         myAlert = "Make sure numbers match valid major words.";
         ret = false;
      } else if (isInvalidNumberLetters) {
         myAlert = "Make sure there is a word for each number.";
         ret = false;
      } else if (isInvalidEncription) {
         myAlert = "There is an input with an invalid encription: " + invalidEncription;
         ret = false;
      }

      if (ret === false && isAlert === true) {
         this.helpers.myAlert("Alert", "<b>" + myAlert + "</b>", "", "Dismiss");
      }

      if (ret === false) {
         console.log("INVALID INPUT: " + myAlert);
      }
      this.getTotalNumberPrompt();
      return ret;
   }

   getTotalNumberPrompt() {
      console.log("getTotalNumberPrompt called");
      var numbers = [];
      for (var i = 0; i < this.editNumbers.numbers.length; i++) {
         if (this.editNumbers.numbers[i].Entry != null && String(this.editNumbers.numbers[i].Entry).trim() !== "") {
            //console.log("PUSHING " + String(this.editNumbers.numbers[i].Entry) + " INTO TOTAL NUMBERS PROMPT");
            numbers.push(String(this.editNumbers.numbers[i].Entry));
         }
      }
      var numbers_str = "";
      if (numbers.join("-").length > 0) {
         numbers_str = numbers.join("-");
      }
      this.editNumbers.totalNumber = numbers_str;
   }

   setMajorWord(index:number) {
      console.log("setMajorWord called, this.editMnemonics.numbers[index].selectedMajorWord = " + JSON.stringify(this.editNumbers.numbers[index].selectedMajorWord));
      this.editNumbers.numbers[index].Entry_Mnemonic = this.editNumbers.numbers[index].selectedMajorWord.Word;
      if (this.editNumbers.numbers[index].selectedMajorWord.Definition && String(this.editNumbers.numbers[index].selectedMajorWord.Definition).trim() !== "") {
         this.editNumbers.numbers[index].Entry_Mnemonic_Info = this.editNumbers.numbers[index].selectedMajorWord.Definition;
      }
      this.doFormatVerify(false);
   }
}

interface myObject {
   [key: string]: any;
}