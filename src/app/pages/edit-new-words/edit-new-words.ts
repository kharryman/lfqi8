import { Component } from '@angular/core';
import { NavController, ModalController, Platform, LoadingController, AlertController } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';
import { DB_Type_ID, Helpers, MnemonicEntry, Op_Type, Op_Type_ID, SyncQuery } from '../../providers/helpers/helpers';
import { NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalListPage } from '../../pages/modal-list/modal-list';



@Component({
   selector: 'page-edit-new-words',
   templateUrl: 'edit-new-words.html',
})
export class EditNewWordsPage {
   public pageName:string = "Edit New Words";
   progressLoader: any;
   public database_misc: SQLiteDBConnection | null = null;
   public database_acrostics: SQLiteDBConnection | null = null;
   editNewWords: any;
   logged_in: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   //private onPauseSubscription: Subscription;

   constructor(public navCtrl: NavController, public modalCtrl: ModalController, private platform: Platform, private alertCtrl: AlertController, public progress: LoadingController, public storage: Storage, public helpers: Helpers, public ngZone: NgZone) {
   }

   ngOnDestroy() {
      console.log("ngOnDestroy called");
      this.saveStorage();
      //this.onPauseSubscription.unsubscribe();
   }

   async ngOnInit() {
      //this.onPauseSubscription = this.platform.pause.subscribe(() => {
      //   this.saveStorage();
      //});

      this.editNewWords = {};
      await this.storage.create();

      this.editNewWords.isInitialized = false;

      this.editNewWords.acrostic_tables = [];
      this.editNewWords.acrostic_words = [];
      this.editNewWords.mnemonic_tables = [];
      this.editNewWords.mnemonic_titles = [];
      this.editNewWords.number_titles_shared = [];
      this.editNewWords.number_titles_user_historical = [];
      this.editNewWords.number_titles_user_personal = [];

      this.editNewWords.count_acrostic = 0;
      this.editNewWords.count_mnemonic = 0;
      this.editNewWords.count_number_shared = 0;
      this.editNewWords.count_number_user_historical = 0;
      this.editNewWords.count_number_user_personal = 0;
      this.editNewWords.count_acrostic_reviewed = 0;
      this.editNewWords.count_acrostic_total = 0;
      this.editNewWords.count_mnemonic_reviewed = 0;
      this.editNewWords.count_mnemonic_total = 0;

      this.editNewWords.selectedAcrosticTables = [];
      this.editNewWords.selectedAcrosticWords = [];
      this.editNewWords.selectedMnemonicTables = [];
      this.editNewWords.selectedNumbersShared = [];
      this.editNewWords.selectedNumbersUserHistorical = [];
      this.editNewWords.selectedNumbersUserPersonal = [];

      this.editNewWords.savedAcrosticWords = [];
      this.editNewWords.savedMnemonicTitles = [];

      this.editNewWords.acrostic_reviewed_count = [];
      this.editNewWords.mnemonic_reviewed = [];
      this.editNewWords.number_shared_reviewed = [];
      this.editNewWords.number_user_historical_reviewed = [];
      this.editNewWords.number_user_personal_reviewed = [];

      this.editNewWords.selectedAcrosticsInvalid = [];

      this.editNewWords.isOneAcrosticTable = false;
      this.editNewWords.isOneMnemonicTable = false;
      this.editNewWords.isOneNumberShared = false;
      this.editNewWords.isOneNumberUserHistorical = false;
      this.editNewWords.isOneNumberUserPersonal = false;

      this.editNewWords.review_times_columns = ["Time1", "Time2", "Time3", "Time4", "Time5", "Time6", "Time7", "Time8", "Time9", "Time10"];
      this.editNewWords.review_times_prompts = ["REVIEW 1", "REVIEW 2", "REVIEW 3", "REVIEW 4", "REVIEW 5", "REVIEW 6", "REVIEW 7", "REVIEW 8", "REVIEW 9", "REVIEW 10"];
      this.editNewWords.review_times = new Array(10);
      this.editNewWords.review_times_edit = new Array(10);

      this.editNewWords.isChangeReviewTimes = false;
      this.editNewWords.selectedAction = null;
      this.editNewWords.user = Helpers.User;
      this.helpers.setEncryptionKey(this.helpers.usernameHash(this.editNewWords.user.Username));
      var date_now = new Date();
      var year = date_now.getFullYear();
      var month_index = date_now.getMonth();
      var day = date_now.getDate();
      this.editNewWords.years = [];
      this.editNewWords.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      this.editNewWords.month = this.editNewWords.months[month_index];
      for (var i = (year - 20); i < (year + 20); i++) {
         this.editNewWords.years.push(i);
      }
      this.editNewWords.select_number_words = [];
      for (var i = 0; i <= 20; i++) {
         this.editNewWords.select_number_words.push(i);
      }
      this.editNewWords.year = year;
      this.editNewWords.days = [];
      this.getMonthDays(year, month_index);
      this.editNewWords.day = day;
      this.editNewWords.number_words = 0;
      this.editNewWords.isInsertMnemonic = false;
      console.log("EDITNEWWORDS INIT ENTERING storage get!");
      this.storage.get('EDIT_NEWWORDS_IS_ONE_ACROSTIC_TABLE').then((val) => {
         if (val != null) {
            this.editNewWords.isOneAcrosticTable = val;
         }
         this.storage.get('EDIT_NEWWORDS_IS_ONE_MNEMONIC_TABLE').then((val) => {
            if (val != null) {
               this.editNewWords.isOneMnemonicTable = val;
            }
            this.storage.get('EDIT_NEWWORDS_IS_ONE_NUMBER_SHARED_TABLE').then((val) => {
               if (val != null) {
                  this.editNewWords.isOneNumberShared = val;
               }
               this.storage.get('EDIT_NEWWORDS_IS_ONE_NUMBER_USER_HISTORICAL_TABLE').then((val) => {
                  if (val != null) {
                     this.editNewWords.isOneNumberUserHistorical = val;
                  }
                  this.storage.get('EDIT_NEWWORDS_IS_ONE_NUMBER_USER_PERSONAL_TABLE').then((val) => {
                     if (val != null) {
                        this.editNewWords.isOneNumberUserPersonal = val;
                     }
                     this.storage.get('EDIT_NEWWORDS_SELECTED_ACTION').then((val) => {
                        if (val != null) {
                           this.editNewWords.selectedAction = val;
                        }
                        this.storage.get('EDIT_NEWWORDS_IS_INSERT_MNEMONIC').then((val) => {
                           if (val != null) {
                              this.editNewWords.isInsertMnemonic = val;
                           }
                           this.background_color = Helpers.background_color;
                           this.button_color = Helpers.button_color;
                           this.button_gradient = Helpers.button_gradient;
                           this.editNewWords.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
                              this.background_color = bgColor;
                           });
                           this.editNewWords.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
                              this.button_color = buttonColor.value;
                              this.button_gradient = buttonColor.gradient;
                           });                           
                           this.editNewWords.isInitialized = true;
                           this.database_misc = this.helpers.getDatabaseMisc();
                           this.database_acrostics = this.helpers.getDatabaseAcrostics();
                           console.log("EDITNEWWORDS INIT CALLING setTables!");
                           this.setTables().then(() => {
                              this.helpers.getPeglist().then(peglist => {
                                 this.editNewWords.peglist = peglist;
                                 this.helpers.dismissProgress();
                                 this.setUpTables();
                              });
                           });
                        });
                     });
                  });
               });
            });
         });
      });
   }

   setUpTables() {
      console.log("setUpTables called");
      this.storage.get("EDIT_NEWWORDS_SELECTED_ACROSTIC_TABLES").then((val) => {
         if (val != null) {
            try {
               //this.editNewWords.selectedAcrosticTables = JSON.parse(val);
               var tmpTables = JSON.parse(val);
               console.log("GOT tmpTables = " + JSON.stringify(tmpTables));
               var tableIndex = -1;
               this.editNewWords.selectedAcrosticTables = [];
               for (var i = 0; i < tmpTables.length; i++) {
                  tableIndex = this.editNewWords.acrostic_tables.map((tbl:any) => { return tbl.Table_name; }).indexOf(tmpTables[i].Table_name);
                  if (tableIndex >= 0) {
                     this.editNewWords.selectedAcrosticTables.push(this.editNewWords.acrostic_tables[tableIndex]);
                  }
               }
               console.log("GOT FROM STORAGE this.editNewWords.selectedAcrosticTables = " + JSON.stringify(this.editNewWords.selectedAcrosticTables));
            } catch (e) {
               console.log("ERROR GET selectedAcrosticTables FROM STORAGE");
            }
         }
         this.storage.get("EDIT_NEWWORDS_SELECTED_MNEMONIC_TABLES").then((val) => {
            if (val != null) {
               try {
                  //this.editNewWords.selectedMnemonicTables = JSON.parse(val);
                  var tmpTables = JSON.parse(val);
                  //console.log("GOT tmpTables = " + JSON.stringify(tmpTables));
                  var tableIndex = -1;
                  this.editNewWords.selectedMnemonicTables = [];
                  for (var i = 0; i < tmpTables.length; i++) {
                     tableIndex = this.editNewWords.mnemonic_tables.map((tbl:any) => { return tbl.Category; }).indexOf(tmpTables[i].Category);
                     if (tableIndex >= 0) {
                        this.editNewWords.selectedMnemonicTables.push(this.editNewWords.mnemonic_tables[tableIndex]);
                     }
                  }
                  console.log("GOT FROM STORAGE this.editNewWords.selectedMnemonicTables = " + JSON.stringify(this.editNewWords.selectedMnemonicTables));
               } catch (e) {
                  console.log("ERROR GET selectedMnemonicTables FROM STORAGE");
               }
            }
            this.storage.get('EDIT_NEWWORDS_COUNT_ACROSTIC').then((val) => {
               if (val != null) {
                  this.editNewWords.count_acrostic = val;
               }
               var isInitiate = val == null;
               this.setUpAcrostics(isInitiate).then(() => {
                  this.storage.get('EDIT_NEWWORDS_COUNT_MNEMONIC').then((val) => {
                     if (val != null) {
                        this.editNewWords.count_mnemonic = val;
                     }
                     var isInitiate = val == null;
                     this.setUpMnemonics(isInitiate).then(() => {
                        this.storage.get('EDIT_NEWWORDS_COUNT_NUMBER_SHARED').then((val) => {
                           if (val != null) {
                              this.editNewWords.count_number_shared = val;
                              this.setUpNumbersShared();
                           }
                           this.storage.get('EDIT_NEWWORDS_COUNT_NUMBER_USER_HISTORICAL').then((val) => {
                              if (val != null) {
                                 this.editNewWords.count_number_user_historical = val;
                                 this.setUpNumbersUserHistorical();
                              }
                              this.storage.get('EDIT_NEWWORDS_COUNT_NUMBER_USER_PERSONAL').then((val) => {
                                 if (val != null) {
                                    this.editNewWords.count_number_user_personal = val;
                                    this.setUpNumbersUserPersonal();
                                 }
                              });
                           });
                        });
                     });
                  });
               });
            });
         });
      });
   }

   ionViewDidLoad() {
      console.log('ionViewDidLoad EditNewWordsPage');
   }

   ionViewWillLeave() {
      console.log('ionViewWillLeave EditNewWordsPage');
      this.editNewWords.subscribedBackgroundColorEvent.unsubscribe();
      this.editNewWords.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   async saveStorage() {
      console.log("saveStorage called");
      await this.storage.set('EDIT_NEWWORDS_COUNT_ACROSTIC', this.editNewWords.count_acrostic);
      await this.storage.set('EDIT_NEWWORDS_COUNT_MNEMONIC', this.editNewWords.count_mnemonic);
      await this.storage.set('EDIT_NEWWORDS_COUNT_NUMBER_SHARED', this.editNewWords.count_number_shared);
      await this.storage.set('EDIT_NEWWORDS_COUNT_NUMBER_USER_HISTORICAL', this.editNewWords.count_number_user_historical);
      await this.storage.set('EDIT_NEWWORDS_COUNT_NUMBER_USER_PERSONAL', this.editNewWords.count_number_user_personal);
      await this.storage.set('EDIT_NEWWORDS_SELECTED_ACROSTIC_TABLES', JSON.stringify(this.editNewWords.selectedAcrosticTables));
      await this.storage.set('EDIT_NEWWORDS_SELECTED_MNEMONIC_TABLES', JSON.stringify(this.editNewWords.selectedMnemonicTables));
      await this.storage.set('EDIT_NEWWORDS_IS_ONE_ACROSTIC_TABLE', this.editNewWords.isOneAcrosticTable);
      await this.storage.set('EDIT_NEWWORDS_IS_ONE_MNEMONIC_TABLE', this.editNewWords.isOneMnemonicTable);
      await this.storage.set('EDIT_NEWWORDS_IS_ONE_NUMBER_SHARED_TABLE', this.editNewWords.isOneNumberShared);
      await this.storage.set('EDIT_NEWWORDS_IS_ONE_NUMBER_USER_HISTORICAL_TABLE', this.editNewWords.isOneNumberUserHistorical);
      await this.storage.set('EDIT_NEWWORDS_IS_ONE_NUMBER_USER_PERSONAL_TABLE', this.editNewWords.isOneNumberUserPersonal);
      await this.storage.set('EDIT_NEWWORDS_SELECTED_ACTION', this.editNewWords.selectedAction);
      await this.storage.set('EDIT_NEWWORDS_IS_INSERT_MNEMONIC', this.editNewWords.isInsertMnemonic);
   }

   //GETS LIST OF ACROSTIC TABLES:
   setTables(): Promise<void> {
      console.log("setTables called");
      return new Promise((resolve, reject) => {
         this.helpers.setProgress("Loading tables ,please wait...", false).then(() => {
            this.editNewWords.acrostic_tables = [];
            this.getAcrosticTables().then(tables => {
               if (tables) {
                  this.editNewWords.acrostic_tables = tables;//.map(tbl => { return tbl.Table_name });
                  this.editNewWords.count_acrostic_reviewed = 0;
                  this.editNewWords.count_acrostic_total = 0;
                  tables.forEach((tbl:any) => {
                     this.editNewWords.count_acrostic_reviewed += parseInt(tbl.REVIEWED);
                     this.editNewWords.count_acrostic_total += parseInt(tbl.TOTAL);
                  });
               }
               this.getMnemonicsTables(true).then(mneTables => {
                  this.editNewWords.count_mnemonic_reviewed = 0;
                  this.editNewWords.count_mnemonic_total = 0;
                  if (mneTables) {
                     this.editNewWords.mnemonic_tables = mneTables;//.map(tbl => { return tbl.Category; });
                     mneTables.forEach((tbl:any) => {
                        console.log("MNEMONICS ADDING tbl.REVIEWED = " + tbl.REVIEWED + ", tbl.TOTAL = " + tbl.TOTAL);
                        this.editNewWords.count_mnemonic_reviewed += parseInt(tbl.REVIEWED);
                        this.editNewWords.count_mnemonic_total += parseInt(tbl.TOTAL);
                     });
                  }
                  this.getNumberTitles(true, Helpers.TABLES_MISC.global_number).then(res1 => {
                     this.editNewWords.number_titles_shared = res1.titles;
                     this.editNewWords.number_shared_reviewed = res1.reviewed;
                     this.getNumberTitles(true, Helpers.TABLES_MISC.user_number, 'HISTORICAL').then(res2 => {
                        this.editNewWords.number_titles_user_historical = res2.titles;
                        this.editNewWords.number_user_historical_reviewed = res2.reviewed;
                        this.getNumberTitles(true, Helpers.TABLES_MISC.user_number, 'PERSONAL').then(res3 => {
                           this.editNewWords.number_titles_user_personal = res3.titles;
                           this.editNewWords.number_user_personal_reviewed = res3.reviewed;
                           this.editNewWords.isTablesSet = true;
                           resolve();
                        });
                     });
                  });
               });
            });
         });
      });
   }

   getMonthDays(year:any, month_index:number) {
      console.log("getMonthDays called.");
      this.editNewWords.days = [];
      var days_in_month = new Date(year, (month_index + 1), 0).getDate();
      for (var i = 1; i <= days_in_month; i++) {
         this.editNewWords.days.push(i);
      }
   }

   changeLatest() {
      console.log("changeLatest called.");
      var date_now = new Date();
      var year = date_now.getFullYear();
      var month_index = date_now.getMonth();
      var day = date_now.getDate();
      this.editNewWords.year = year;
      this.editNewWords.month = this.editNewWords.months[month_index];
      this.editNewWords.day = day;
      this.getWords();
   }
   getLast() {
      console.log("getLast called.");
      console.log("changeLatest called.");
      var year = this.editNewWords.year;
      var month_index = this.editNewWords.months.indexOf(this.editNewWords.month);
      var day = this.editNewWords.day;
      if (day === 1) {
         if (month_index === 0) {
            month_index = 12;//WILL BE SUBTRACTED NEXT:
            year--;
         }
         console.log("getLast calling getMonthDays!");
         this.getMonthDays(year, (month_index - 1));
      }
      var date_yesterday = new Date(year, month_index, (day - 1));
      var year_yesterday = date_yesterday.getFullYear();
      var month_index_yesterday = date_yesterday.getMonth();
      var day_yesterday = date_yesterday.getDate();
      this.editNewWords.year = year_yesterday;
      this.editNewWords.month = this.editNewWords.months[month_index_yesterday];
      this.editNewWords.day = day_yesterday;
      this.getWords();
   }
   getNext() {
      console.log("getNext called.");
      var year = this.editNewWords.year;
      var month_index = this.editNewWords.months.indexOf(this.editNewWords.month);
      var day = this.editNewWords.day;
      if (day === this.editNewWords.days.length) {
         if (month_index === 11) {
            month_index = -1;//WILL BE ADDED NEXT:
            year++;
         }
         console.log("getLast calling getMonthDays!");
         this.getMonthDays(year, (month_index + 1));
      }
      var date_tomorrow = new Date(year, month_index, (day + 1));
      var year_tomorrow = date_tomorrow.getFullYear();
      var month_index_tomorrow = date_tomorrow.getMonth();
      var day_tomorrow = date_tomorrow.getDate();
      this.editNewWords.year = year_tomorrow;
      this.editNewWords.month = this.editNewWords.months[month_index_tomorrow];
      this.editNewWords.day = day_tomorrow;
      this.getWords();
   }

   getWords() {
      console.log("getWords called.");
      this.editNewWords.results = "";
      this.editNewWords.reviewWords = "";
      var mnemonicKeys = Object.keys(MnemonicEntry);
      console.log("getWords mnemonicKeys = " + mnemonicKeys);
      this.helpers.setProgress("Getting new words ,please wait...", false).then(() => {
         var formattedDate = this.getFormattedDateBefore();
         var text = formattedDate + " New Words:<br />";

         if (Helpers.isWorkOffline === false) {
            var params = {
               "user_id": Helpers.User.ID,
               "date": formattedDate
            };
            this.helpers.makeHttpRequest("/lfq_directory/php/edit_newwords_get_words.php", "GET", params).then((data:any) => {
               this.helpers.dismissProgress();
               if (data["SUCCESS"] === true) {
                  if (data["WORDS"].length > 0) {
                     text += this.getNewwordsText(data["WORDS"]);
                  }
                  if (data["MNEMONICS"] && String(data["MNEMONICS"]).trim() !== "") {
                     text += "Mnemonics: " + data["MNEMONICS"];
                  }
                  this.editNewWords.reviewWords = String(text);
               } else {
                  this.helpers.alertLfqError(data["ERROR"]);
               }
            }, error => {
               console.log("ERROR:" + error.message);
               this.editNewWords.results = "Sorry. Error getting words: " + error.message;
               this.editNewWords.reviewWords = "";
               this.helpers.alertServerError("Sorry. Error getting words: " + error.message);
               this.helpers.dismissProgress();
            });
         } else {
            var sql = "SELECT ";
            sql += "unw.ID AS NW_ID, unw.User_ID AS NW_User_ID, unw.Date AS NW_Date, unw.Table_ID AS NW_Table_ID, unw.Word AS NW_Word, unw.Mnemonic_ID AS NW_Mnemonic_ID, unw.Global_Number_ID, unw.User_Number_ID, ";
            sql += "m.ID AS MNE_Mnemonic_ID, mc.Name AS MNE_Category, m.User_ID AS MNE_User_ID, m.Mnemonic_Type_ID AS MNE_Mnemonic_Type_ID, m.Mnemonic_Category_ID AS MNE_Mnemonic_Category_ID, m.Is_Linebreak AS MNE_Is_Linebreak, m.Title AS MNE_Title, m.Number AS MNE_Number, m.Number_Power AS MNE_Number_Power, ";
            sql += "me.Entry_Index AS MNE_Entry_Index, me.Entry  AS MNE_Entry, me.Entry_Mnemonic AS MNE_Entry_Mnemonic, me.Entry_Info AS MNE_Entry_Info, ";
            sql += "gn.ID AS GN_ID, gn.Mnemonic_Type_ID AS GN_Mnemonic_Type_ID, gn.Title AS GN_Title, gn.User_ID AS GN_User_ID, gn.Number AS GN_Number, gn.Number_Power AS GN_Number_Power, ";
            sql += "gne.Number_ID AS GN_Number_ID, gne.Entry_Index AS GN_Entry_Index, gne.Entry AS GN_Entry, gne.Entry_Info AS GN_Entry_Info, gne.Entry_Mnemonic AS GN_Entry_Mnemonic, gne.Entry_Mnemonic_Info AS GN_Entry_Mnemonic_Info, "
            sql += "un.ID AS UN_ID, un.Mnemonic_Type_ID AS UN_Mnemonic_Type_ID, un.Title AS UN_Title, un.User_ID AS UN_User_ID, un.Data_Type_ID AS UN_Data_Type_ID, un.Number AS UN_Number, un.Number_Power AS UN_Number_Power, ";
            sql += "une.Number_ID AS UN_Number_ID, une.Entry_Index AS UN_Entry_Index, une.Entry AS UN_Entry, une.Entry_Info AS UN_Entry_Info, une.Entry_Mnemonic AS UN_Entry_Mnemonic, une.Entry_Mnemonic_Info AS UN_Entry_Mnemonic_Info ";
            sql += "FROM " + Helpers.TABLES_MISC.user_new_word + " unw ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " ud ON ud.ID=unw.User_ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.mnemonic + " m ON m.ID=unw.Mnemonic_ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.mnemonic_category + " mc ON mc.ID=m.Mnemonic_Category_ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.mnemonic_entry + " me ON me.Mnemonic_ID=m.ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.global_number + " gn ON gn.ID=unw.Global_Number_ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.global_number_entry + " gne ON gne.Number_ID=gn.ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.user_number + " un ON un.ID=unw.User_Number_ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.user_number_entry + " une ON une.Number_ID=un.ID ";
            sql += "WHERE ud.ID='" + Helpers.User.ID + "' AND unw.Date='" + formattedDate + "'";
            console.log("getWords sql = " + sql);
            var newwordsMnemonicsText = "";

            this.helpers.query(this.database_misc, sql, []).then((data) => {
               if (data.rows.length > 0) {
                  var newwords = [];
                  for (var r = 0; r < data.rows.length; r++) {
                     newwords.push(data.rows.item(r));
                  }
                  text += this.getNewwordsText(newwords);
               }
               var sql = "SELECT a.Mnemonics AS MNEMONICS FROM " + Helpers.TABLES_MISC.user_new_word_mnemonic + " a ";
               sql += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " ud ON ud.ID=a.User_ID ";
               sql += "WHERE ud.Username='" + Helpers.User.Username + "' AND a.Date='" + formattedDate + "'";
               console.log("getWords Mnemonics sql = " + sql);
               this.helpers.query(this.database_misc, sql, []).then((data) => {
                  this.helpers.dismissProgress();
                  if (data.rows.length > 0) {
                     var mnemonics = data.rows.item(0).MNEMONICS;
                     if (mnemonics && String(mnemonics).trim() !== "") {
                        newwordsMnemonicsText += "Mnemonics: " + mnemonics;
                     }
                  }
                  this.editNewWords.reviewWords = String(text);
               }, (error) => {
                  console.log("sql:" + sql + ", ERROR:" + error.message);
                  this.editNewWords.results = "Sorry. Error getting words.";
                  this.editNewWords.reviewWords = "";
                  this.helpers.dismissProgress();
               });
            }, (error) => {
               console.log("sql:" + sql + ", ERROR:" + error.message);
               this.editNewWords.results = "Sorry. Error getting words.";
               this.editNewWords.reviewWords = "";
               this.helpers.dismissProgress();
            });
         }
      });
   }

   getNewwordsText(newwords:any): string {
      var acrosticsText = "", mnemonicsText = "", numbersSharedText = "", numbersUserPersonalText = "", numbersUserHistoricalText = "";

      console.log("GOT NEWWORDS = " + JSON.stringify(newwords));
      var rowKeys = Object.keys(newwords[0]);
      //GET ACRSOTICS:
      var countAcrostic = 1;
      for (var i = 0; i < newwords.length; i++) {
         if (newwords[i].NW_Word != null) {
            acrosticsText += countAcrostic++ + ")" + newwords[i].NW_Word + "<br />";
         }
      }
      //GET MNEMONICS:                  
      var mneKeys = rowKeys.filter(key => { return key.split("_")[0] === "MNE" });
      var mneKeySplit = [];
      var mnemonic:any = [], mneObj:any = {};
      var uniqueMneIDs = newwords.map((nw:any) => { return nw.MNE_Mnemonic_ID }).filter((mneID:any) => { return mneID != null; }).filter(this.helpers.onlyUnique);
      mnemonicsText = uniqueMneIDs.length > 0 ? "<b>Mnemonics:</b></br />" : "";
      for (var i = 0; i < uniqueMneIDs.length; i++) {
         mnemonic = newwords.filter((nw:any) => { return nw.MNE_Mnemonic_ID === uniqueMneIDs[i] }).map((mne:any) => {
            mneObj = {}
            for (var mk = 0; mk < mneKeys.length; mk++) {
               mneKeySplit = mneKeys[mk].split("_");
               mneObj[mneKeySplit.slice(1).join("_")] = mne[mneKeys[mk]];
            }
            return mneObj;
         });
         mnemonicsText += "<b>" + (i + 1) + ")" + mnemonic[0]["Category"] + ":</b> ";
         mnemonicsText += mnemonic[0]["Title"] + "<br />";
         //mnemonicsText += this.helpers.getMnemonicText(mnemonic, this.editNewWords.peglist);
      }
      //GET SHARED NUMBERS:                  
      var uniqueNumberSharedIDs = newwords.map((nw:any) => { return nw.GN_Number_ID }).filter((numID:any) => { return numID != null; }).filter(this.helpers.onlyUnique);
      var numberShared = [];
      numbersSharedText += uniqueNumberSharedIDs.length > 0 ? "<b>Numbers Shared:</b></br />" : "";
      var countNumbersShared = 1;
      for (var i = 0; i < uniqueNumberSharedIDs.length; i++) {
         numberShared = newwords.filter((nw:any) => { return nw.GN_Number_ID === uniqueNumberSharedIDs[i] });
         if (numberShared.length > 0) {
            numbersSharedText += countNumbersShared++ + ") " + numberShared[0].GN_Title + "<br />";
         }
         //for(var j=0;j<numberShared.length;j++){
         //   numbersSharedText += (j+ 1) + ") " + numberShared[j].GN_Entry + "(" + numberShared[j].GN_Entry_Mnemonic + "): " + numberShared[j].GN_Entry_Info + "<br />";
         //}
      }
      //GET USER HISTORICAL NUMBERS:                  
      var uniqueNumberHistoricalIDs = newwords.filter((nw:any) => { return nw.UN_Number_ID != null && String(nw.UN_Data_Type_ID) === '2' }).map((nw:any) => { return nw.UN_Number_ID }).filter((numID:any) => { return numID != null; }).filter(this.helpers.onlyUnique);
      var numberUserHistorical = [];
      numbersUserHistoricalText += uniqueNumberHistoricalIDs.length > 0 ? "<b>User Numbers Historical:</b></br />" : "";
      var countUserHistorical = 1;
      for (var i = 0; i < uniqueNumberHistoricalIDs.length; i++) {
         numberUserHistorical = newwords.filter((nw:any) => { return nw.UN_Number_ID === uniqueNumberHistoricalIDs[i] && String(nw.UN_Data_Type_ID) === '2' });
         if (numberUserHistorical.length > 0) {
            numbersUserHistoricalText += countUserHistorical++ + ") " + this.helpers.decryptData(numberUserHistorical[0].UN_Title) + "<br />";
         }
      }
      //GET USER PERSONAL NUMBERS:                  
      var uniqueNumberPersonalIDs = newwords.filter((nw:any) => { return nw.UN_Number_ID != null && String(nw.UN_Data_Type_ID) === '1' }).map((nw:any) => { return nw.UN_Number_ID }).filter((numID:any) => { return numID != null; }).filter(this.helpers.onlyUnique);
      var numberUserPersonal = [];
      numbersUserPersonalText += uniqueNumberPersonalIDs.length > 0 ? "<b>User Numbers Personal:</b></br />" : "";
      var countUserPersonal = 1;
      for (var i = 0; i < uniqueNumberPersonalIDs.length; i++) {
         numberUserPersonal = newwords.filter((nw:any) => { return nw.UN_Number_ID === uniqueNumberPersonalIDs[i] && String(nw.UN_Data_Type_ID) === '1' });
         if (numberUserPersonal.length > 0) {
            numbersUserPersonalText += countUserPersonal++ + ") " + this.helpers.decryptData(numberUserPersonal[0].UN_Title) + "<br />";
         }
      }
      return acrosticsText + mnemonicsText + numbersSharedText + numbersUserHistoricalText + numbersUserPersonalText;
   }

   startEditReviewTimes() {
      console.log("startEditReviewTimes called, this.editNewWords.isChangeReviewTimes=" + this.editNewWords.isChangeReviewTimes);
      if (this.editNewWords.isChangeReviewTimes === true) {
         this.setReviewTimes().then((res) => {
            console.log("setReviewTimes promise returned=" + res);
         });
      } else {
         this.editNewWords.review_times.fill("");
      }
   }

   editWords() {
      console.log("editWords called.");
      this.editNewWords.results = "";
      this.editNewWords.reviewWords = "";
      if (this.editNewWords.isChangeReviewTimes === true) {
         this.changeReviewTimes();
      }
      else {// END IF check_review_times IS CHECKED
         var month_number = this.editNewWords.months.indexOf(this.editNewWords.month) + 1;
         var day_number = this.editNewWords.day;
         var month_display_number = String(month_number);
         var day_display_number = String(day_number);
         month_display_number = ("0" + month_display_number).slice(-2);
         day_display_number = ("0" + day_display_number).slice(-2);
         var edidate = this.editNewWords.year + "/" + month_display_number + "/" + day_display_number;
         var results = "";
         var number_words = 0;
         if (this.editNewWords.selectedAction === "INSERT") {
            if (this.checkWords(true)) {
               this.insertNewwords(edidate);
            }
         }
         else if (this.editNewWords.selectedAction === "DELETE") {
            this.deleteNewwords(edidate);
         }
      }
   }

   changeReviewTimes() {
      console.log("changeReviewTimes called");
      this.helpers.setProgress("Updating review times, please wait...", false).then(() => {
         var this_entry = "";
         var previous_entry = "";
         for (var i = 0; i < 10; i++) {
            if (i > 0) {
               this_entry = this.editNewWords.review_times_edit[i];
               previous_entry = this.editNewWords.review_times_edit[i - 1];
               if (this_entry !== "") {
                  if (previous_entry === "") {
                     this.editNewWords.results = "<b>NOT UPDATED! CAN'T LEAVE PREVIOUS ENTRIES BLANK.</b>";
                     this.helpers.dismissProgress();
                     return;
                  }
                  if (parseInt(this_entry) <= parseInt(previous_entry)) {
                     this.editNewWords.results = "<b>NOT UPDATED! EACH NEXT REVIEW TIME MUST BE GREATER THAN THE LAST.</b>";
                     this.helpers.dismissProgress();
                     return;
                  }
               }
            }
         }
         var update_str = "";
         var cols = [];
         var vals = [];
         for (var i = 0; i < 10; i++) {
            cols.push(this.editNewWords.review_times_columns[i]);
            if (this.editNewWords.review_times_edit[i] !== "") {
               vals.push(this.editNewWords.review_times_edit[i]);
            } else {
               vals.push('');
            }
         }
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         var queries = [new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.user_review_time, Op_Type_ID.UPDATE, cols, vals, { "User_ID": Helpers.User.ID })];
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, Op_Type_ID.UPDATE, null, null, null, null).then((res) => {
            this.helpers.dismissProgress();
            if (res.isSuccess) {
               this.editNewWords.results = "<b>UPDATED " + Helpers.User.Username + "'s REVIEW TIMES! " + res.results + "</b>";
            } else {
               console.log("ERROR:" + res.result);
               this.editNewWords.results = "Sorry. Error updating review times.";
            }
         });
      });
   }


   insertNewwords(editDate:any) {
      console.log("insertNewwords called");
      this.helpers.setProgress("Inserting new words, please wait...", false).then(() => {
         this.editNewWords.results = "";
         var results = "";
         var checkWheres = {
            "User_ID": Helpers.User.ID,
            "Date": editDate
         };
         console.log("insertNewwords check exists, checkWheres = " + JSON.stringify(checkWheres));
         //this.checkNewwordsExist(editDate).then((isExists) => {
         this.helpers.insertCheckExists(DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.user_new_word, checkWheres).then(isExists => {
            if (isExists) {
               this.helpers.dismissProgress();
               this.editNewWords.results = "Date " + editDate + " already exists.";
            } else {
               var cols = ["User_ID", "Table_ID", "Word", "Date", "Mnemonic_ID", "Global_Number_ID", "User_Number_ID"];
               var vals = [];
               for (var i = 0; i < this.editNewWords.count_acrostic; i++) {
                  vals.push([Helpers.User.ID, this.editNewWords.selectedAcrosticTables[i].Table_ID, this.editNewWords.selectedAcrosticWords[i], editDate, null, null, null]);
               }// END for loop of # acrostics
               for (var i = 0; i < this.editNewWords.count_mnemonic; i++) {
                  vals.push([Helpers.User.ID, null, null, editDate, this.editNewWords.selectedMnemonicTitles[i].Mnemonic_ID, null, null]);
               }// END for loop of # mnemonics
               for (var i = 0; i < this.editNewWords.count_number_shared; i++) {
                  vals.push([Helpers.User.ID, null, null, editDate, null, this.editNewWords.selectedNumbersShared[i].Number_ID, null]);
               }// END for loop of # number shared
               for (var i = 0; i < this.editNewWords.count_number_user_historical; i++) {
                  vals.push([Helpers.User.ID, null, null, editDate, null, null, this.editNewWords.selectedNumbersUserHistorical[i].Number_ID]);
               }// END for loop of # number user historical
               for (var i = 0; i < this.editNewWords.count_number_user_personal; i++) {
                  vals.push([Helpers.User.ID, null, null, editDate, null, null, this.editNewWords.selectedNumbersUserPersonal[i].Number_ID]);
               }// END for loop of # number user historical                  
               //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
               var queries = [new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.user_new_word, Op_Type_ID.INSERT, cols, vals, checkWheres)];
               if (this.editNewWords.isInsertMnemonic === true && this.editNewWords.inputMnemonicWords && String(this.editNewWords.inputMnemonicWords).trim() !== '') {
                  cols = ["Mnemonics", "Date", "User_ID"];
                  vals = [[this.editNewWords.inputMnemonicWords, editDate, Helpers.User.ID]];
                  queries.push(new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.user_new_word_mnemonic, Op_Type_ID.INSERT, cols, vals, checkWheres));
               }
               //var totalCount = this.editNewWords.count_acrostic + this.editNewWords.count_mnemonic + this.editNewWords.count_number_shared + this.editNewWords.count_number_user_historical + this.editNewWords.count_number_user_personal;
               //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
               this.helpers.autoSync(queries, Op_Type_ID.INSERT, null, null, null, null).then((res) => {
                  if (res.isSuccess === true) {
                     var spliceIndex = -1;
                     if (this.editNewWords.selectedAcrosticWords && this.editNewWords.selectedAcrosticWords.length > 0) {
                        var acrosticsTableIndex = -1;
                        results += " INSERTED " + this.editNewWords.selectedAcrosticWords.length + " acrostic words:<br />";
                        for (var i = 0; i < this.editNewWords.selectedAcrosticWords.length; i++) {
                           acrosticsTableIndex = this.editNewWords.acrostic_tables.map((tbl:any) => { return tbl.Table_ID }).indexOf(this.editNewWords.selectedAcrosticTables[i].Table_ID);
                           if (acrosticsTableIndex >= 0) { this.editNewWords.acrostic_tables[acrosticsTableIndex].REVIEWED++; }
                           spliceIndex = this.editNewWords.acrostic_words[i].indexOf(this.editNewWords.selectedAcrosticWords[i]);
                           if (spliceIndex >= 0) { this.editNewWords.acrostic_words[i].splice(spliceIndex, 1) }
                           results += (i + 1) + ")" + this.editNewWords.selectedAcrosticWords[i] + "</br >";
                        }
                        this.editNewWords.count_acrostic_reviewed += this.editNewWords.selectedAcrosticWords.length;
                        this.setUpAcrostics(false);
                     }
                     if (this.editNewWords.selectedMnemonicTitles && this.editNewWords.selectedMnemonicTitles.length > 0) {
                        var mnemonicsTableIndex = -1;
                        results += " INSERTED " + this.editNewWords.selectedMnemonicTitles.length + " mnemonics:<br />";
                        for (var i = 0; i < this.editNewWords.selectedMnemonicTitles.length; i++) {
                           mnemonicsTableIndex = this.editNewWords.mnemonic_tables.map((tbl:any) => { return tbl.Category }).indexOf(this.editNewWords.selectedMnemonicTables[i].Category);
                           if (mnemonicsTableIndex >= 0) { this.editNewWords.mnemonic_tables[mnemonicsTableIndex].REVIEWED++; }
                           spliceIndex = this.editNewWords.mnemonic_titles[i].map((tit:any) => { return tit.Mnemonic_ID }).indexOf(this.editNewWords.selectedMnemonicTitles[i].Mnemonic_ID);
                           if (spliceIndex >= 0) { this.editNewWords.mnemonic_titles[i].splice(spliceIndex, 1) }
                           results += (i + 1) + ")" + this.editNewWords.selectedMnemonicTitles[i].Title + "</br >";
                        }
                        this.editNewWords.count_mnemonic_reviewed += this.editNewWords.selectedMnemonicTitles.length;
                        this.setUpMnemonics(false);
                     }
                     if (this.editNewWords.selectedNumbersShared && this.editNewWords.selectedNumbersShared.length > 0) {
                        results += " INSERTED " + this.editNewWords.selectedNumbersShared.length + " shared numbers:<br />";
                        for (var i = 0; i < this.editNewWords.selectedNumbersShared.length; i++) {
                           this.editNewWords.number_shared_reviewed.push(this.editNewWords.selectedNumbersShared[i]);
                           spliceIndex = this.editNewWords.number_titles_shared.map((tit:any) => { return tit.Number_ID }).indexOf(this.editNewWords.selectedNumbersShared[i].Number_ID);
                           if (spliceIndex >= 0) { this.editNewWords.number_titles_shared.splice(spliceIndex, 1); }
                           results += (i + 1) + ")" + this.editNewWords.selectedNumbersShared[i].Title + "</br >";
                        }
                        this.editNewWords.number_user_personal_reviewed
                        this.setUpNumbersShared();
                     }
                     if (this.editNewWords.selectedNumbersUserHistorical && this.editNewWords.selectedNumbersUserHistorical.length > 0) {
                        results += " INSERTED " + this.editNewWords.selectedNumbersUserHistorical.length + " user historical numbers:<br />";
                        for (var i = 0; i < this.editNewWords.selectedNumbersUserHistorical.length; i++) {
                           this.editNewWords.number_user_historical_reviewed.push(this.editNewWords.selectedNumbersUserHistorical[i]);
                           spliceIndex = this.editNewWords.number_titles_user_historical.map((tit:any) => { return tit.Number_ID }).indexOf(this.editNewWords.selectedNumbersUserHistorical[i].Number_ID);
                           if (spliceIndex >= 0) { this.editNewWords.number_titles_user_historical.splice(spliceIndex, 1); }
                           results += (i + 1) + ")" + this.editNewWords.selectedNumbersUserHistorical[i].Title + "</br >";
                        }
                        this.setUpNumbersUserHistorical();
                     }
                     if (this.editNewWords.selectedNumbersUserPersonal && this.editNewWords.selectedNumbersUserPersonal.length > 0) {
                        results += " INSERTED " + this.editNewWords.selectedNumbersUserPersonal.length + " user personal numbers:<br />";
                        for (var i = 0; i < this.editNewWords.selectedNumbersUserPersonal.length; i++) {
                           this.editNewWords.number_user_personal_reviewed.push(this.editNewWords.selectedNumbersUserPersonal[i]);
                           spliceIndex = this.editNewWords.number_titles_user_personal.map((tit:any) => { return tit.Number_ID }).indexOf(this.editNewWords.selectedNumbersUserPersonal[i].Number_ID);
                           if (spliceIndex >= 0) { this.editNewWords.number_titles_user_personal.splice(spliceIndex, 1); }
                           results += (i + 1) + ")" + this.editNewWords.selectedNumbersUserPersonal[i].Title + "</br >";
                        }
                        this.setUpNumbersUserPersonal();
                     }
                     //this.setTables();
                     this.helpers.dismissProgress();
                     this.editNewWords.results = results;
                  } else {
                     console.log("ERROR:" + res.results);
                     this.editNewWords.results = "Sorry. Error inserting new words.";
                     this.helpers.dismissProgress();
                  }
               });
            }
         }).catch((error) => {
            console.log("ERROR:" + error.message);
            this.editNewWords.results = "Sorry. Error inserting new words.";
            this.helpers.dismissProgress();
         });
      });
   }

   deleteNewwords(editDate:any) {
      console.log("deleteNewwords called");
      this.helpers.setProgress("Deleting user " + this.editNewWords.user.Username + "' new words date: " + editDate + ", please wait...", false).then(() => {

         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         var queries = [
            new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.user_new_word, Op_Type_ID.DELETE, [], [], { "User_ID": Helpers.User.ID, "Date": editDate }),
            new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.user_new_word_mnemonic, Op_Type_ID.DELETE, [], [], { "User_ID": Helpers.User.ID, "Date": editDate })
         ];
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, Op_Type_ID.DELETE, null, null, null, null).then((res) => {
            if (res.isSuccess === true) {
               this.editNewWords.results = editDate + " DELETED FROM user_new_words. " + res.results;
               this.helpers.myAlert("Alert", "", "Successfully deleted words of " + this.editNewWords.user.Username + " on date: " + editDate, "OK").then(() => {
                  this.ngOnInit();
               });
            } else {
               console.log("ERROR:" + res.results);
               this.editNewWords.results = "Sorry. Error deleting new words: " + res.results;
               this.helpers.alertServerError("Sorry. Error deleting new words: " + res.results);
               this.helpers.dismissProgress();
            }
         });
      });
   }

   checkWords(isAlert:boolean): Boolean {
      console.log("checkWords called");
      var isNull = false;
      var isSame = false;
      var ret = true;
      for (var i = 0; i < this.editNewWords.count_acrostic; i++) {
         this.editNewWords.selectedAcrosticsInvalid[i].isNull = false;
         this.editNewWords.selectedAcrosticsInvalid[i].isSame = false;
         console.log("this.editNewWords.selectedAcrosticWords[" + i + "] = " + this.editNewWords.selectedAcrosticWords[i]);
         if (this.editNewWords.selectedAcrosticWords[i] == null || this.editNewWords.selectedAcrosticWords[i].trim() === '') {
            isNull = true;
            this.editNewWords.selectedAcrosticsInvalid[i].isNull = true;
         } else {
            for (var j = 0; j < this.editNewWords.count_acrostic; j++) {
               if (i !== j &&
                  this.editNewWords.selectedAcrosticTables[i] &&
                  this.editNewWords.selectedAcrosticTables[j] &&
                  this.editNewWords.selectedAcrosticTables[i].Table_name === this.editNewWords.selectedAcrosticTables[j].Table_name &&
                  this.editNewWords.selectedAcrosticWords[i] != null &&
                  this.editNewWords.selectedAcrosticWords[i] === this.editNewWords.selectedAcrosticWords[j]
               ) {
                  isSame = true;
                  this.editNewWords.selectedAcrosticsInvalid[i].isSame = true;
               }
            }
         }
         console.log("this.editNewWords.selectedAcrosticsInvalid[" + i + "]=" + JSON.stringify(this.editNewWords.selectedAcrosticsInvalid[i]));
      }
      for (var i = 0; i < this.editNewWords.count_mnemonic; i++) {
         this.editNewWords.selectedMnemonicsInvalid[i].isNull = false;
         this.editNewWords.selectedMnemonicsInvalid[i].isSame = false;
         if (this.editNewWords.selectedMnemonicTitles[i] == null) {
            isNull = true;
            this.editNewWords.selectedMnemonicsInvalid[i].isNull = true;
         } else {
            for (var j = 0; j < this.editNewWords.count_mnemonic; j++) {
               if (i !== j &&
                  this.editNewWords.selectedMnemonicTables[i] &&
                  this.editNewWords.selectedMnemonicTables[j] &&
                  this.editNewWords.selectedMnemonicTables[i].Category === this.editNewWords.selectedMnemonicTables[j].Category &&
                  this.editNewWords.selectedMnemonicTitles[i] &&
                  this.editNewWords.selectedMnemonicTitles[j] &&
                  this.editNewWords.selectedMnemonicTitles[i].Mnemonic_ID === this.editNewWords.selectedMnemonicTitles[j].Mnemonic_ID
               ) {
                  isSame = true;
                  this.editNewWords.selectedMnemonicsInvalid[i].isSame = true;
               }
            }
         }
      }
      for (var i = 0; i < this.editNewWords.count_number_shared; i++) {
         this.editNewWords.selectedNumbersSharedInvalid[i].isNull = false;
         this.editNewWords.selectedNumbersSharedInvalid[i].isSame = false;
         if (!this.editNewWords.selectedNumbersShared[i]) {
            isNull = true;
            this.editNewWords.selectedNumbersSharedInvalid[i].isNull = true;
         } else {
            for (var j = 0; j < this.editNewWords.count_number_shared; j++) {
               if (i !== j && this.editNewWords.selectedNumbersShared[i].Number_ID === this.editNewWords.selectedNumbersShared[j].Number_ID) {
                  isSame = true;
                  this.editNewWords.selectedNumbersSharedInvalid[i].isSame = true;
               }
            }
         }
      }
      console.log("this.editNewWords.selectedNumbersShared = " + JSON.stringify(this.editNewWords.selectedNumbersShared) + ", this.editNewWords.selectedNumbersSharedInvalid = " + JSON.stringify(this.editNewWords.selectedNumbersSharedInvalid));
      for (var i = 0; i < this.editNewWords.count_number_user_historical; i++) {
         this.editNewWords.selectedNumbersUserHistoricalInvalid[i].isNull = false;
         this.editNewWords.selectedNumbersUserHistoricalInvalid[i].isSame = false;
         if (!this.editNewWords.selectedNumbersUserHistorical[i] == null) {
            isNull = true;
            this.editNewWords.selectedNumbersUserHistoricalInvalid[i].isNull = true;
         } else {
            for (var j = 0; j < this.editNewWords.count_number_user_historical; j++) {
               if (i !== j && this.editNewWords.selectedNumbersUserHistorical[i].Number_ID === this.editNewWords.selectedNumbersUserHistorical[j].Number_ID) {
                  isSame = true;
                  this.editNewWords.selectedNumbersUserHistoricalInvalid[i].isSame = true;
               }
            }
         }
      }
      for (var i = 0; i < this.editNewWords.count_number_user_personal; i++) {
         this.editNewWords.selectedNumbersUserPersonalInvalid[i].isNull = false;
         this.editNewWords.selectedNumbersUserPersonalInvalid[i].isSame = false;
         if (this.editNewWords.selectedNumbersUserPersonal[i] == null) {
            isNull = true;
            this.editNewWords.selectedNumbersUserHistoricalInvalid[i].isNull = true;
         } else {
            for (var j = 0; j < this.editNewWords.count_number_user_personal; j++) {
               if (i !== j && this.editNewWords.selectedNumbersUserPersonal[i].Number_ID === this.editNewWords.selectedNumbersUserPersonal[j].Number_ID) {
                  isSame = true;
                  this.editNewWords.selectedNumbersUserPersonalInvalid[i].isSame = true;
               }
            }
         }
      }
      console.log("checkWords: isAlert=" + isAlert + ", isNull=" + isNull + ", isSame=" + isSame);
      if (isAlert) {
         if (isNull === true) {
            this.helpers.myAlert("Alert", "<b>All words for each table must be selected.</b>", "", "Dismiss");
            ret = false;
         }
         if (isSame === true) {
            this.helpers.myAlert("Alert", "<b>All words must be different.</b>", "", "Dismiss");
            ret = false;
         }
      }
      if (!isAlert) {
         this.setMnemonicWords();
      }
      return ret;
   }

   getFormattedDateBefore() {
      console.log("getFormattedDateBefore called");
      var day = this.editNewWords.day;
      var month = this.editNewWords.months.indexOf(this.editNewWords.month) + 1;
      var year = this.editNewWords.year;
      var month_display_number = ("0" + String(month)).slice(-2);
      var day_display_number = ("0" + String(day)).slice(-2);
      var ret = year + "/" + month_display_number + "/" + day_display_number;
      console.log("getFormattedDateBefore returning=" + ret);
      return ret;
   }

   setReviewTimes(): Promise<Boolean> {
      console.log("setReviewTimes called");
      return new Promise((resolve, reject) => {
         this.helpers.setProgress("Getting review times ,please wait...", false).then(() => {

            if (Helpers.isWorkOffline === false) {
               var params = {
                  "username": Helpers.User.Username
               };
               this.helpers.makeHttpRequest("/lfq_directory/php/edit_newwords_get_review_times.php", "GET", params).then((data) => {
                  this.helpers.dismissProgress();
                  if (data["SUCCESS"] === true) {
                     for (var i = 0; i < this.editNewWords.review_times_columns.length; i++) {
                        if (data["REVIEWS"][i] !== "") {
                           //console.log("SETTING REVIEW TIMES[" + i + "]=" + data["REVIEWS"][i]);
                           this.editNewWords.review_times[i] = data["REVIEWS"][i];
                           this.editNewWords.review_times_edit[i] = data["REVIEWS"][i];
                        } else {
                           console.log("REVIEW TIMES [" + i + "] IS NULL!!!");
                        }
                     }
                     resolve(true);
                  } else {
                     this.helpers.alertLfqError(data["ERROR"]);
                     resolve(false);
                  }
               }, error => {
                  console.log("ERROR:" + error.message);
                  this.editNewWords.results = "Sorry. Error getting review times." + error.message;
                  this.helpers.alertServerError("Sorry. Error getting review times." + error.message);
                  this.helpers.dismissProgress();
                  resolve(false);
               });
            } else {//IF OFFLINE:
               var sql = "SELECT * FROM " + Helpers.TABLES_MISC.user_review_time + " WHERE User_ID='" + Helpers.User.ID + "'";
               this.helpers.query(this.database_misc, sql, []).then((data) => {
                  if (data.rows.length > 0) {
                     for (var i = 0; i < this.editNewWords.review_times_columns.length; i++) {
                        if (data.rows.item(0)[this.editNewWords.review_times_columns[i]] !== "") {
                           console.log("SETTING REVIEW TIMES[" + i + "]=" + data.rows.item(0)[this.editNewWords.review_times_columns[i]]);
                           this.editNewWords.review_times[i] = data.rows.item(0)[this.editNewWords.review_times_columns[i]];
                           this.editNewWords.review_times_edit[i] = data.rows.item(0)[this.editNewWords.review_times_columns[i]];
                        } else {
                           console.log("REVIEW TIMES [" + i + "] IS NULL!!!");
                        }
                     }
                  } else {
                     console.log("REVIEW TIMES data.rows.length=0 !!!");
                  }
                  this.helpers.dismissProgress();
                  resolve(true);
               }).catch((error) => {
                  console.log("sql:" + sql + ", ERROR:" + error.message);
                  this.editNewWords.results = "Sorry. Error getting review times." + error.message;
                  this.helpers.dismissProgress();
                  resolve(false);
               });
            }
         });
      });
   }


   async reviewAcrosticWordsAgain(index:number) {
      console.log("reviewAcrosticWordsAgain called, WILL REVIEW AGAIN THIS TABLE:" + JSON.stringify(this.editNewWords.selectedAcrosticTables[index].Table_name));
      let alert = await this.alertCtrl.create({
         header: "Confirm",
         subHeader: "Are you sure you want to review words of table " + this.editNewWords.selectedAcrosticTables[index].Table_name + " again?",
         buttons: [
            {
               text: 'Cancel',
               cssClass: 'cancelButton',
               handler: () => {
                  console.log('Cancel review again clicked');
                  return true;
               }
            },
            {
               text: 'Confirm',
               cssClass: 'confirmButton',
               handler: () => {
                  console.log('Confirm review again clicked');
                  this.editNewWords.results = "";
                  this.helpers.setProgress("Clearing " + Helpers.User.Username + "' " + this.editNewWords.selectedAcrosticTables[index].Table_name + " table...", false).then(() => {
                     //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                     var queries = [new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.user_new_word, Op_Type_ID.DELETE, [], [], { "User_ID": Helpers.User.ID, "Table_ID": this.editNewWords.selectedAcrosticTables[0].Table_ID })];
                     //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
                     this.helpers.autoSync(queries, Op_Type_ID.DELETE, null, null, null, null).then((res) => {
                        if (res.isSuccess === true) {
                           this.editNewWords.results = "Cleared user " + Helpers.User.Username + "' reviewed table: " + this.editNewWords.selectedAcrosticTables[index].Table_name + ". " + res.results;
                           this.helpers.dismissProgress();
                           return true;
                        } else {
                           console.log("ERROR:" + res.results);
                           this.editNewWords.results = "Sorry. Error reviewing words again. " + res.results;
                           this.helpers.dismissProgress();
                           return true;
                        }
                     });
                  });
               }
            }
         ]
      });
      alert.present();
   }

   async reviewAgain(index:number, which:any) {
      console.log("reviewAgain called, WILL REVIEW AGAIN which=" + which);
      var table_prompt:string = "", reviewCol:string = "", reviewIds:any = [];
      if (which === "mnemonic") {
         table_prompt = "mnemonics table " + this.editNewWords.selectedMnemonicTables[index].Category;
         reviewCol = "Mnemonic_ID";
         reviewIds = this.editNewWords.mnemonic_reviewed[index].map((mr:any) => { return mr.Mnemonic_ID });
      } else if (which === "global_number") {
         table_prompt = "numbers shared table";
         reviewCol = "Global_Number_ID";
         reviewIds = this.editNewWords.number_shared_reviewed[index].map((nsr:any) => { return nsr.Number_ID });
      } else if (which === "user_number_personal") {
         table_prompt = "user numbers personal table";
         reviewCol = "User_Number_ID";
         reviewIds = this.editNewWords.number_user_personal_reviewed[index].map((nup:any) => { return nup.Number_ID });
      } else if (which === "user_number_historical") {
         table_prompt = "user numbers historical table";
         reviewCol = "User_Number_ID";
         reviewIds = this.editNewWords.number_user_historical_reviewed[index].map((nuh:any) => { return nuh.Number_ID });
      }
      let alert = await this.alertCtrl.create({
         header: "Confirm",
         subHeader: "Are you sure you want to review " + table_prompt + " again?",
         buttons: [
            {
               text: 'Cancel',
               cssClass: 'cancelPopupButton',
               handler: () => {
                  console.log('Cancel review again clicked');
                  return true;
               }
            },
            {
               text: 'Confirm',
               cssClass: 'confirmPopupButton1',
               handler: () => {
                  console.log('Confirm review again clicked');
                  this.editNewWords.results = "";
                  this.helpers.setProgress("Clearing " + Helpers.User.Username + "'s " + table_prompt + " ...", false).then(() => {
                     //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                     var wheres:any = {};
                     wheres[reviewCol] = reviewIds;
                     var queries = [new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.user_new_word, Op_Type_ID.DELETE_IN, [], [], wheres)];
                     //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
                     this.helpers.autoSync(queries, Op_Type_ID.DELETE_IN, null, null, null, null).then((res:any) => {
                        if (res.isSuccess === true) {
                           this.editNewWords.results = "Cleared user " + Helpers.User.Username + "' reviews of " + table_prompt + ". " + res.results;
                           if (which === "mnemonic") {
                              this.editNewWords.mnemonic_reviewed[index] = [];
                              for (var i = 0; i < this.editNewWords.count_mnemonic; i++) {
                                 for (var j = 0; j < this.editNewWords.mnemonic_titles[i].length; i++) {
                                    if (this.editNewWords.mnemonic_titles[i].NW_Mnemonic_ID && reviewIds.indexOf(this.editNewWords.mnemonic_titles[i].NW_Mnemonic_ID) >= 0) {
                                       this.editNewWords.mnemonic_titles[i].NW_Mnemonic_ID = null;
                                    }
                                 }
                                 this.editNewWords.mnemonic_titles[i] = this.editNewWords.mnemonic_titles[i].filter((tle:any) => { return tle.NW_Mnemonic_ID == null; });
                                 this.editNewWords.mnemonic_reviewed[i] = this.editNewWords.mnemonic_titles[i].filter((tle:any) => { return tle.NW_Mnemonic_ID != null; });
                              }
                           } else if (which === "global_number") { this.editNewWords.number_shared_reviewed = []; }
                           else if (which === "user_number_historical") { this.editNewWords.number_user_historical_reviewed = []; }
                           else if (which === "user_number_personal") { this.editNewWords.number_user_personal_reviewed = []; }
                           this.helpers.dismissProgress();
                           return true;
                        } else {
                           console.log("ERROR:" + res.results);
                           this.editNewWords.results = "Sorry. Error reviewing " + table_prompt + " again. " + res.results;
                           this.helpers.dismissProgress();
                           return true;
                        }
                     });
                  });
               }
            }
         ]
      });
      alert.present();
   }


   public async showNewwordsDropdown(tableIndex:number): Promise<void> {
      // Create the modal
      var itemRet = {};
      var items = [];
      if (this.editNewWords.acrostic_words && this.editNewWords.acrostic_words[tableIndex]) {
         items = this.editNewWords.acrostic_words[tableIndex].map((item: any) => {
            itemRet = { "name": item };
            return itemRet;
         });
      }
      let modal = await this.modalCtrl.create({
         component: ModalListPage,
         componentProps: {
            "items": items,
            "title": "Words of table: " + this.editNewWords.selectedAcrosticTables[tableIndex].Table_name
         }
   });
      // Handle the result
      modal.onDidDismiss().then((item:any) => {
         if (item) {
            console.log("SELECTED item");
            this.editNewWords.selectedAcrosticWords[tableIndex] = item.name;
            this.checkWords(false);
         }
      });
      // Show the modal
      await modal.present();
   }

   getAcrosticWords(isGet:boolean, tableIndex:number): Promise<any> {
      return new Promise((resolve, reject) => {
         if (isGet === false || !this.editNewWords.selectedAcrosticTables || !this.editNewWords.selectedAcrosticTables[tableIndex]) {
            resolve(true);
         } else {
            if (Helpers.isWorkOffline === false) {
               var params = {
                  "username": Helpers.User.Username,
                  "table": this.editNewWords.selectedAcrosticTables[tableIndex].Table_name
               };
               this.helpers.makeHttpRequest("/lfq_directory/php/edit_newwords_get_table_words.php", "GET", params).then((data:any) => {
                  if (data["SUCCESS"] === true) {
                     this.editNewWords.acrostic_words[tableIndex] = [];
                     console.log("data['WORDS'].length = " + data['WORDS'].length);
                     console.log("GET WORDS data = " + JSON.stringify(data));
                     this.editNewWords.acrostic_words[tableIndex] = data["WORDS"];
                     this.editNewWords.acrostic_words[tableIndex].sort(this.helpers.sortArray);
                     this.editNewWords.acrostic_reviewed_count[tableIndex] = data["REVIEWED_WORDS_COUNT"];
                     resolve(true);
                  } else {
                     tableIndex++;
                     this.helpers.alertLfqError(data["ERROR"]);
                     resolve(false);
                  }
                  //console.log("new_words=" + JSON.stringify(this.editNewWords.new_words));
               }, error => {
                  console.log("ERROR:" + error.message);
                  this.editNewWords.results = "Sorry. Error getting table words: " + error.message;
                  this.helpers.alertServerError("Sorry. Error getting table words: " + error.message);
                  tableIndex++;
                  resolve(false);
               });
            } else {//IF OFFLINE:
               var sql_number_words = "SELECT COUNT(DISTINCT a.Word) AS COUNT FROM " + Helpers.TABLES_MISC.user_new_word + " AS a ";
               sql_number_words += "INNER JOIN " + Helpers.TABLES_MISC.acrostic_table + " AS at ON at.ID=a.Table_ID ";
               sql_number_words += "WHERE a.User_ID='" + Helpers.User.ID + "' AND a.Word IS NOT NULL AND a.Word<>'' AND a.Word<>'undefined' AND UPPER(a.Word)<>'NULL' AND at.Table_name='" + this.editNewWords.selectedAcrosticTables[tableIndex].Table_name + "'";
               var sql = "";
               var number_words = 0;
               this.helpers.query(this.database_misc, sql_number_words, []).then((data) => {
                  number_words = data.rows.item(0).COUNT;
                  console.log("GET number_words = " + number_words);
                  console.log("setNewwordSelect tableIndex=" + tableIndex + ", this.editNewWords.selectedAcrosticTables[tableIndex].Table_name = " + JSON.stringify(this.editNewWords.selectedAcrosticTables[tableIndex].Table_name));
                  var sql_number_acrostics = "SELECT COUNT(DISTINCT Name) AS COUNT FROM " + this.editNewWords.selectedAcrosticTables[tableIndex].Table_name + " WHERE Acrostics<>'' AND Name<>'undefined' AND Name IS NOT NULL";
                  this.helpers.query(this.database_acrostics, sql_number_acrostics, []).then((data) => {
                     var number_acrostics = data.rows.item(0).COUNT;
                     console.log("GET number_acrostics = " + number_acrostics);
                     sql = "SELECT DISTINCT a.Word FROM " + Helpers.TABLES_MISC.user_new_word + " AS a ";
                     sql += "INNER JOIN " + Helpers.TABLES_MISC.acrostic_table + " AS at ON at.ID=a.Table_ID ";
                     sql += "WHERE a.User_ID='" + Helpers.User.ID + "' AND a.Word IS NOT NULL AND at.Table_name='" + this.editNewWords.selectedAcrosticTables[tableIndex].Table_name + "'";
                     console.log("GET USER NEW WORDS SQL = " + sql);
                     this.helpers.query(this.database_misc, sql, []).then((data) => {
                        var words_exclude = [];
                        for (var i = 0; i < data.rows.length; i++) {
                           if (data.rows.item(i).Word && String(data.rows.item(i).Word).toUpperCase() !== "NULL" && String(data.rows.item(i).Word).trim() !== "") {
                              words_exclude.push(data.rows.item(i).Word);
                           }
                        }
                        console.log("words_exclude.length = " + words_exclude.length);
                        sql = "SELECT DISTINCT Name FROM " + this.editNewWords.selectedAcrosticTables[tableIndex].Table_name + " WHERE Acrostics<>'' AND Name<>'undefined' AND Name IS NOT NULL AND Name NOT IN ('" + words_exclude.join("','") + "')";
                        console.log("GET WORDS SQL = " + sql);
                        this.helpers.query(this.database_acrostics, sql, []).then((data) => {
                           this.editNewWords.acrostic_words[tableIndex] = [];
                           var newWordsTemp = [];
                           if (data.rows.length > 0) {
                              for (var i = 0; i < data.rows.length; i++) {
                                 newWordsTemp.push(data.rows.item(i).Name);
                              }
                              this.editNewWords.acrostic_words[tableIndex] = newWordsTemp;
                              this.editNewWords.acrostic_reviewed_count[tableIndex] = number_words;
                              resolve(true);
                           } else {
                              resolve(true);
                           }
                        }, (error) => {
                           console.log("sql:" + sql + ", ERROR:" + error.message);
                           this.editNewWords.results = "Sorry. Error getting table words.";
                           tableIndex++;
                           resolve(false);
                        });
                     }, (error) => {
                        console.log("sql:" + sql + ", ERROR:" + error.message);
                        this.editNewWords.results = "Sorry. Error getting table words.";
                        tableIndex++;
                        resolve(false);
                     });
                  }, (error) => {
                     console.log("sql:" + sql + ", ERROR:" + error.message);
                     this.editNewWords.results = "Sorry. Error getting table words.";
                     tableIndex++;
                     resolve(false);
                  });
               });
            }
         }
      });
   }

   getMnemonicTitles(tableIndex:number): Promise<any> {
      console.log("getMnemonicTitles called");
      var self = this;
      return new Promise((resolve, reject) => {
         if (!this.editNewWords.selectedMnemonicTables || !this.editNewWords.selectedMnemonicTables[tableIndex]) {
            resolve(false);
         } else {
            if (Helpers.isWorkOffline === false) {
               var params = {
                  "user_id": Helpers.User.ID,
                  "table": this.editNewWords.selectedMnemonicTables[tableIndex].Category
               };
               self.helpers.makeHttpRequest("/lfq_directory/php/edit_newwords_get_mnemonic_titles.php", "GET", params).then((data) => {
                  console.log("NUMBER OF TITLES=" + data["TITLES"].length);
                  if (data["SUCCESS"] === true) {
                     this.editNewWords.mnemonic_titles[tableIndex] = data["TITLES"].filter((tle:any) => { return tle.NW_Mnemonic_ID == null; });
                     this.editNewWords.mnemonic_reviewed[tableIndex] = data["TITLES"].filter((tle:any) => { return tle.NW_Mnemonic_ID != null; });
                     resolve(true);
                  } else {
                     self.helpers.alertLfqError(data["ERROR"]);
                     resolve(false);
                  }
               }, error => {
                  console.log("ERROR:" + error.message);
                  self.helpers.alertServerError(error.message);
                  resolve(false);
               });
            } else {//OFFLINE GET TITLES:
               //GET TITTLES OF CATEGORY NOT REVIEWED BY USER, AND COUNT OF REVIEWED                       
               //`ID`, `User_ID`, `Mnemonic_Type_ID`, `Mnemonic_Category_ID`, `Is_Linebreak`, `Title`, `Number`, `Number_Power`
               var sql = "SELECT m.Mnemonic_Type_ID, m.Mnemonic_Category_ID, m.Is_Linebreak, m.Title, m.Number, m.Number_Power, m.ID AS Mnemonic_ID, unw.Mnemonic_ID AS NW_Mnemonic_ID, mt.Name AS Mnemonic_Type, mc.Name AS Category, ud.Username FROM " + Helpers.TABLES_MISC.mnemonic + " AS m ";
               sql += "INNER JOIN " + Helpers.TABLES_MISC.mnemonic_type + " AS mt ON mt.ID=m.Mnemonic_Type_ID ";
               sql += "INNER JOIN " + Helpers.TABLES_MISC.mnemonic_category + " AS mc ON mc.ID=m.Mnemonic_Category_ID ";
               sql += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " AS ud ON ud.ID=m.User_ID ";
               sql += "LEFT JOIN " + Helpers.TABLES_MISC.user_new_word + " AS unw ON unw.Mnemonic_ID=m.ID AND unw.User_ID=? ";
               sql += "WHERE mc.Name=? GROUP BY m.ID";
               console.log("getMnemonicTitles SQL = " + sql);
               var sqlParams = [Helpers.User.ID, this.editNewWords.selectedMnemonicTables[tableIndex].Category];
               console.log("sqlParams = " + JSON.stringify(sqlParams));
               self.helpers.query(Helpers.database_misc, sql, sqlParams).then((data) => {
                  console.log("NUMBER OF TITLES=" + data.rows.length);
                  var titles = [];
                  for (var i = 0; i < data.rows.length; i++) {
                     titles.push(data.rows.item(i));
                  }
                  console.log("GOT MNEMONIC TITLES = " + JSON.stringify(titles));
                  this.editNewWords.mnemonic_titles[tableIndex] = titles;//.map(title => { return title.Title });
                  this.editNewWords.mnemonic_reviewed[tableIndex] = titles.filter(tle => { return tle.NW_Mnemonic_ID != null; });
                  resolve(true);
               }).catch((error) => {
                  self.helpers.alertLfqError(error.message);
                  resolve(false);
               });
            }
         }
      });
   }
   doGetMnemonicsTitles(isGet:boolean, tableIndex:number): Promise<any> {
      return new Promise((resolve, reject) => {
         if (!isGet) {
            resolve(true);
         } else {
            this.getMnemonicTitles(tableIndex).then((titles) => {
               resolve(true);
            });
         }
      });
   }

   getAcrosticTables(): Promise<any> {
      return new Promise((resolve, reject) => {
         if (Helpers.isWorkOffline === false) {
            var params = {
               "user_id": Helpers.User.ID
            };
            this.helpers.makeHttpRequest("/lfq_directory/php/edit_newwords_get_acrostics_tables.php", "GET", params).then((data) => {
               if (data["SUCCESS"] === true) {
                  resolve(data["TABLES"]);
               } else {
                  this.helpers.alertLfqError(data["ERROR"]);
               }
            }, error => {
               console.log("ERROR:" + error.message);
               this.helpers.alertServerError("Sorry. Error getting table names: " + error.message);
               resolve(false);
            });
         } else {//OFFLINE:
            var sql = "SELECT at.ID AS Table_ID, at.Table_name, at.User_ID, ud.Username, at.Number_Newword AS TOTAL, "
            sql += "(SELECT COALESCE(COUNT(DISTINCT unw.Word),'0') FROM " + Helpers.TABLES_MISC.user_new_word + " AS unw WHERE unw.User_ID='" + Helpers.User.ID + "' AND unw.Table_ID IS NOT NULL AND unw.Table_ID=at.ID) AS REVIEWED ";
            sql += "FROM ";
            sql += Helpers.TABLES_MISC.acrostic_table + " AS at ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " AS ud ON ud.ID=at.User_ID ";
            sql += "ORDER BY at.Table_name";
            this.helpers.query(Helpers.database_misc, sql, []).then((data) => {
               var tables = [];
               if (data.rows.length > 0) {
                  for (var i = 0; i < data.rows.length; i++) {
                     tables.push(data.rows.item(i));
                  }
               }
               console.log("GOT ACROSTIC TABLES OFFLINE " + JSON.stringify(tables));
               resolve(tables);
            }).catch((error) => {
               console.log("sql:" + sql + ", ERROR:" + error.message);
               this.helpers.alertLfqError(error.message);
               resolve(false);
            });
         }
      });
   }

   getMnemonicsTables(isDoingProgress:boolean): Promise<any> {
      console.log("getMnemonicsTables called.");
      var self = this;
      return new Promise((resolve, reject) => {
         self.helpers.setProgress("Loading tables ,please wait...", isDoingProgress).then(() => {
            if (Helpers.isWorkOffline === false) {
               var params = {
                  "user_id": Helpers.User.ID
               };
               self.helpers.makeHttpRequest("/lfq_directory/php/edit_newwords_get_mnemonics_tables.php", "GET", params).then((data) => {
                  if (data["SUCCESS"] === true) {
                     resolve(data["TABLES"]);
                  } else {
                     self.helpers.alertLfqError(data["ERROR"]);
                     resolve(false);
                  }
               }, error => {
                  console.log("ERROR:" + error.message);
                  self.helpers.alertServerError(error.message);
                  resolve(false);
               });
            } else {//OFFLINE GET CATEGORIES:
               var sql = "SELECT mc.ID, mc.Name AS Category, mc.User_ID, ud.Username, ";
               sql += "(SELECT COALESCE(COUNT(DISTINCT unw.Mnemonic_ID),'0') FROM " + Helpers.TABLES_MISC.user_new_word + " AS unw INNER JOIN " + Helpers.TABLES_MISC.mnemonic + " AS im1 ON im1.ID=unw.Mnemonic_ID WHERE unw.User_ID=? AND unw.Mnemonic_ID IS NOT NULL AND im1.Mnemonic_Category_ID=mc.ID) AS REVIEWED, ";
               sql += "(SELECT COALESCE(COUNT(DISTINCT im2.ID),'0') FROM " + Helpers.TABLES_MISC.mnemonic + " AS im2 WHERE im2.Mnemonic_Category_ID=mc.ID) AS TOTAL ";
               sql += "FROM ";
               sql += Helpers.TABLES_MISC.mnemonic_category + " AS mc ";
               sql += "INNER JOIN userdata AS ud ON ud.ID=mc.User_ID ";
               sql += "GROUP BY mc.ID "
               sql += "ORDER BY mc.Name";
               self.helpers.query(Helpers.database_misc, sql, [Helpers.User.ID]).then((data) => {
                  var tables = [];
                  if (data.rows && data.rows.length > 0) {
                     for (var i = 0; i < data.rows.length; i++) {
                        tables.push(data.rows.item(i));
                     }
                  }
                  resolve(tables);
               }, (error) => {
                  self.helpers.alertLfqError(error.message);
                  resolve(false);
                  //this.getTitles(true);
               });
            }
         });
      });
   }

   getNumberTitles(isDoingProgress: boolean, table: string, type?: string): Promise<any> {
      console.log("getNumberTitles called. table=" + table);
      return new Promise((resolve, reject) => {
         var prompt_table = table === Helpers.TABLES_MISC.global_number ? "Shared Numbers" : Helpers.User.Username + "'s Numbers";
         this.helpers.setProgress("Loading titles for " + prompt_table + ", please wait...", isDoingProgress).then(() => {
            if (Helpers.isWorkOffline === false) {
               var params:any = {
                  "table": table,
                  "user_id": Helpers.User.ID
               };
               if (type) {
                  params["type"] = type;
               }
               this.helpers.makeHttpRequest("/lfq_directory/php/edit_newwords_get_numbers_titles.php", "GET", params).then((data) => {
                  if (data["SUCCESS"] === true) {
                     var titles = [];
                     if (table === Helpers.TABLES_MISC.global_number) {
                        titles = data["ENTRIES"];//.map(title => { return title.Title; });
                     } else {
                        titles = data["ENTRIES"];
                        titles.forEach((title:any) => { title.Title = this.helpers.decryptData(title.Title); });
                     }
                     var notReviewed = titles.filter((tle:any) => { return tle.NW_Number_ID == null; });
                     var reviewed = titles.filter((tle:any) => { return tle.NW_Number_ID != null; });
                     resolve({ "titles": notReviewed, "reviewed": reviewed });
                  } else {
                     this.helpers.alertLfqError(data["ERROR"]);
                     resolve(false);
                  }
               }, error => {
                  this.helpers.alertServerError(error.message);
                  resolve(false);
               });
            } else {
               var sql = "";
               var queryParams = [];
               if (table === Helpers.TABLES_MISC.global_number) {
                  sql = "SELECT unw.Global_Number_ID AS NW_Number_ID, gne.Number_ID, gn.User_ID, gn.Title, gne.Entry_Index, gne.Entry, gne.Entry_Info, gne.Entry_Mnemonic, gne.Entry_Mnemonic_Info, ud.Username FROM "
                  sql += Helpers.TABLES_MISC.global_number + " AS gn INNER JOIN " + Helpers.TABLES_MISC.global_number_entry + " AS gne ON gne.Number_ID=gn.ID ";
                  sql += "INNER JOIN userdata AS ud ON ud.ID=gn.User_ID ";
                  sql += "LEFT JOIN " + Helpers.TABLES_MISC.user_new_word + " AS unw ON unw.Global_Number_ID=gn.ID AND unw.User_ID=? AND unw.Global_Number_ID IS NOT NULL ";
                  sql += "GROUP BY gn.Title ORDER BY gn.Title,gn.ID";
                  queryParams = [Helpers.User.ID];
               } else {//FOR USER NUMBERS TABLE
                  var Data_Type_ID = type === 'PERSONAL' ? '1' : '2';
                  sql = "SELECT unw.User_Number_ID AS NW_Number_ID, une.Number_ID, un.User_ID, un.Title, une.Entry_Index, une.Entry, une.Entry_Info, une.Entry_Mnemonic, une.Entry_Mnemonic_Info, ud.Username FROM ";
                  sql += Helpers.TABLES_MISC.user_number + " AS un INNER JOIN " + Helpers.TABLES_MISC.user_number_entry + " AS une ON une.Number_ID=un.ID ";
                  sql += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " AS ud ON ud.ID=un.User_ID ";
                  sql += "LEFT JOIN " + Helpers.TABLES_MISC.user_new_word + " AS unw ON unw.User_Number_ID=un.ID AND unw.User_Number_ID IS NOT NULL ";
                  sql += "WHERE un.User_ID=? AND un.Data_Type_ID=?";
                  sql += "GROUP BY un.ID ORDER BY un.Title,un.Data_Type_ID";
                  queryParams = [Helpers.User.ID, Data_Type_ID]
               }
               console.log("getNumbersTitles " + table + " sql = " + sql);
               this.helpers.query(Helpers.database_misc, sql, queryParams).then((data) => {
                  var entries = [];
                  for (var i = 0; i < data.rows.length; i++) {
                     entries.push(data.rows.item(i));
                  }
                  var titles = [];
                  if (table === Helpers.TABLES_MISC.global_number) {
                     titles = entries;//.map(title => { return title.Title; });
                  } else {
                     titles = entries;
                     titles.forEach(title => { title.Title = this.helpers.decryptData(title.Title); });
                  }
                  var notReviewed = titles.filter(tle => { return tle.NW_Number_ID == null; });
                  var reviewed = titles.filter(tle => { return tle.NW_Number_ID != null; });
                  var res = { "titles": notReviewed, "reviewed": reviewed };
                  console.log("getNumbersTitles res = " + JSON.stringify(res));
                  resolve(res);
               }).catch((error) => {
                  this.helpers.alertLfqError(error.message);
                  resolve(false);
               });
            }
         });
      });
   }


   setUpAcrostics(isInitiate:boolean): Promise<void> {
      console.log("setUpAcrostics called, isInitiate = " + isInitiate);
      var self = this;
      console.log("setUpAcrostics START, self.editNewWords.selectedAcrosticTables = " + JSON.stringify(self.editNewWords.selectedAcrosticTables));
      return new Promise((resolve, reject) => {
         self.editNewWords.acrostic_words = [];
         self.editNewWords.acrostic_reviewed_count = [];
         self.editNewWords.selectedAcrosticWords = [];
         self.editNewWords.selectedAcrosticsInvalid = [];
         self.editNewWords.beforeSelectedWords = [];
         if (isInitiate === true || !self.editNewWords.selectedAcrosticTables || self.editNewWords.selectedAcrosticTables.length === 0) {
            console.log("SETTING self.editNewWords.selectedAcrosticTables ALL TO 0");
            self.editNewWords.selectedAcrosticTables = [];
            for (var i = 0; i < self.editNewWords.count_acrostic; i++) {
               self.editNewWords.selectedAcrosticTables.push(self.editNewWords.acrostic_tables[0]);
            }
         }
         for (var i = 0; i < self.editNewWords.count_acrostic; i++) {
            self.editNewWords.selectedAcrosticWords.push(null);
            self.editNewWords.selectedAcrosticsInvalid.push({ "isNull": false, "isSame": false });
            self.editNewWords.acrostic_words.push([]);
            self.editNewWords.acrostic_reviewed_count.push(0);
         }
         self.doSelectAcrosticTables(0, () => {
            for (var i = 0; i < self.editNewWords.count_acrostic; i++) {
               self.editNewWords.acrostic_reviewed_count[i] = self.editNewWords.acrostic_reviewed_count[0];
            }
            self.checkWords(false);
            console.log("setUpAcrostics DONE, self.editNewWords.selectedAcrosticTables = " + JSON.stringify(self.editNewWords.selectedAcrosticTables));
            resolve();
         });
      });
   }

   setUpMnemonics(isInitiate:boolean): Promise<void> {
      console.log("setUpMnemonics called, this.editNewWords.count_mnemonic = " + this.editNewWords.count_mnemonic);
      var self = this;
      return new Promise((resolve, reject) => {
         self.editNewWords.mnemonic_titles = [];
         self.editNewWords.selectedMnemonicTitles = [];
         self.editNewWords.selectedMnemonicsInvalid = [];
         self.editNewWords.beforeSelectedMnemonics = [];
         if (isInitiate === true || !self.editNewWords.selectedMnemonicTables || self.editNewWords.selectedMnemonicTables.length == 0) {
            self.editNewWords.selectedMnemonicTables = [];
            for (var i = 0; i < self.editNewWords.count_mnemonic; i++) {
               self.editNewWords.selectedMnemonicTables.push(self.editNewWords.mnemonic_tables[0]);
            }
         }
         console.log("setUpMnemonics self.editNewWords.selectedMnemonicTables = " + JSON.stringify(self.editNewWords.selectedMnemonicTables));
         for (var i = 0; i < self.editNewWords.count_mnemonic; i++) {
            self.editNewWords.selectedMnemonicTitles.push(null);
            self.editNewWords.selectedMnemonicsInvalid.push({ "Mnemonic_ID": null, "isNull": false, "isSame": false });
            self.editNewWords.mnemonic_titles.push([]);
            self.editNewWords.mnemonic_reviewed.push([]);
         }
         console.log("setUpMnemonics this.editNewWords.mnemonic_titles = " + JSON.stringify(self.editNewWords.mnemonic_titles));
         self.doSelectMnemonicTables(0, () => {
            for (var i = 0; i < self.editNewWords.count_mnemonic; i++) {
               self.editNewWords.mnemonic_reviewed[i] = self.editNewWords.mnemonic_reviewed[0];
            }
            self.checkWords(false);
            resolve();
         });
      });
   }

   setUpNumbersShared() {
      console.log("setUpNumbersShared called, this.editNewWords.count_number_shared = " + this.editNewWords.count_number_shared);
      this.editNewWords.selectedNumbersShared = [];
      this.editNewWords.selectedNumbersSharedInvalid = [];
      if (this.editNewWords.isInitialized === true || this.editNewWords.selectedNumbersShared.length == 0) {
         this.editNewWords.selectedNumbersShared = [];
      }
      console.log("setUpNumbersShared this.editNewWords.selectedNumbersShared = " + JSON.stringify(this.editNewWords.selectedNumbersShared));
      for (var i = 0; i < this.editNewWords.count_number_shared; i++) {
         if (this.editNewWords.number_titles_shared) {
            if (!this.editNewWords.isOneNumberShared) {
               if (this.editNewWords.number_titles_shared[0]) {
                  this.editNewWords.selectedNumbersShared.push(this.editNewWords.number_titles_shared[0]);
               }
            } else {
               if (this.editNewWords.number_titles_shared[i]) {
                  this.editNewWords.selectedNumbersShared.push(this.editNewWords.number_titles_shared[i]);
               }
            }
         }
         this.editNewWords.selectedNumbersSharedInvalid.push({ "Number_ID": this.editNewWords.selectedNumbersShared[i].Number_ID, "isNull": false, "isSame": false });
      }
      this.checkWords(false);
   }

   setUpNumbersUserHistorical() {
      console.log("setUpNumbersUserHistorical called, this.editNewWords.count_number_user_historical = " + this.editNewWords.count_number_user_historical);
      this.editNewWords.selectedNumbersUserHistorical = [];
      this.editNewWords.selectedNumbersUserHistoricalInvalid = [];
      if (this.editNewWords.isInitialized === true || this.editNewWords.selectedNumbersUserHistorical.length == 0) {
         this.editNewWords.selectedNumbersUserHistorical = [];
      }
      console.log("setUpM this.editNumbersUserHistorical NewWords.selectedNumbersUserHistorical = " + JSON.stringify(this.editNewWords.selectedNumbersUserHistorical));
      var numberID = null;
      for (var i = 0; i < this.editNewWords.count_number_user_historical; i++) {
         if (this.editNewWords.number_titles_user_historical) {
            if (!this.editNewWords.isOneNumberUserHistorical) {
               if (this.editNewWords.number_titles_user_historical[0]) {
                  this.editNewWords.selectedNumbersUserHistorical.push(this.editNewWords.number_titles_user_historical[0]);
               }
            } else {
               if (this.editNewWords.number_titles_user_historical[i]) {
                  this.editNewWords.selectedNumbersUserHistorical.push(this.editNewWords.number_titles_user_historical[i]);
               }
            }
         }
         numberID = this.editNewWords.selectedNumbersUserHistorical[i] ? this.editNewWords.selectedNumbersUserHistorical.Number_ID : null;
         this.editNewWords.selectedNumbersUserHistoricalInvalid.push({ "Number_ID": numberID, "isNull": false, "isSame": false });
      }
      this.checkWords(false);
   }

   setUpNumbersUserPersonal() {
      console.log("setUpNumbersUserPersonal called, this.editNewWords.count_number_user_personal = " + this.editNewWords.count_number_user_personal);
      this.editNewWords.selectedNumbersUserPersonal = [];
      this.editNewWords.selectedNumbersUserPersonalInvalid = [];
      if (this.editNewWords.isInitialized === true || this.editNewWords.selectedNumbersUserPersonal.length == 0) {
         this.editNewWords.selectedNumbersUserPersonal = [];
      }
      for (var i = 0; i < this.editNewWords.count_number_user_personal; i++) {
         if (this.editNewWords.number_titles_user_personal) {
            if (!this.editNewWords.isOneNumberUserPersonal) {
               if (this.editNewWords.number_titles_user_personal[0]) {
                  this.editNewWords.selectedNumbersUserPersonal.push(this.editNewWords.number_titles_user_personal[0]);
               }
            } else {
               if (this.editNewWords.number_titles_user_personal[i]) {
                  this.editNewWords.selectedNumbersUserPersonal.push(this.editNewWords.number_titles_user_personal[i]);
               }
            }
         }
         this.editNewWords.selectedNumbersUserPersonalInvalid.push({ "Number_ID": this.editNewWords.selectedNumbersUserPersonal[i].Number_ID, "isNull": false, "isSame": false });
      }
      this.checkWords(false);
   }

   doSelectAcrosticTables(tableIndex:number, callback:Function) {
      console.log("doSelectAcrosticTables called, tableIndex = " + tableIndex);
      if (tableIndex < this.editNewWords.selectedAcrosticTables.length) {
         this.selectAcrosticTable(tableIndex).then(() => {
            this.doSelectAcrosticTables(++tableIndex, callback);
         });
      } else {
         callback();
      }
   }

   selectAcrosticTable(tableIndex:number): Promise<void> {
      console.log("selectAcrosticTable called");
      var self = this;
      return new Promise((resolve, reject) => {
         var savedIndex = -1;
         if (self.editNewWords.selectedAcrosticTables && self.editNewWords.selectedAcrosticTables[tableIndex]) {
            savedIndex = self.editNewWords.savedAcrosticWords.map((tbl:any) => { return tbl.Table; }).indexOf(self.editNewWords.selectedAcrosticTables[tableIndex].Table_name);
         }
         var isGet = true;
         if (savedIndex >= 0) {
            isGet = false;
            self.editNewWords.acrostic_words[tableIndex] = self.editNewWords.savedAcrosticWords[savedIndex].Words;
         }
         self.getAcrosticWords(isGet, tableIndex).then(() => {

            console.log("this.editNewWords.isOneAcrosticTable TRUE, SETTING AUTO WORDS FOR TABLE = " + self.editNewWords.selectedAcrosticTables[tableIndex].Table_name);
            if (self.editNewWords.isOneAcrosticTable === true) {
               for (var i = 0; i < self.editNewWords.count_acrostic; i++) {
                  self.editNewWords.selectedAcrosticTables[i] = self.editNewWords.selectedAcrosticTables[tableIndex];
                  self.editNewWords.acrostic_words[i] = self.editNewWords.acrostic_words[tableIndex];
                  self.editNewWords.selectedAcrosticWords[i] = self.editNewWords.acrostic_words[tableIndex][i];
                  self.editNewWords.acrostic_reviewed_count[i] = self.editNewWords.acrostic_reviewed_count[tableIndex];
               }
            } else {
               self.editNewWords.selectedAcrosticWords[tableIndex] = self.editNewWords.acrostic_words[tableIndex][0];
            }
            console.log("SET this.editNewWords.selectedAcrosticTables = " + JSON.stringify(self.editNewWords.selectedAcrosticTables));
            self.checkWords(false);
            resolve();
         });
      });
   }

   setMnemonicWords() {
      console.log("setMnemonicWords called");
      if (this.editNewWords.selectedAcrosticWords && this.editNewWords.selectedAcrosticWords.length > 0) {
         this.editNewWords.inputMnemonicWords = this.editNewWords.selectedAcrosticWords.join(" ");
         console.log("SET this.editNewWords.inputMnemonicWords = " + this.editNewWords.inputMnemonicWords);
      }
   }

   doSelectMnemonicTables(tableIndex:number, callback:Function) {
      console.log("doSelectMnemonicTables called, tableIndex = " + tableIndex);
      if (tableIndex < this.editNewWords.selectedMnemonicTables.length) {
         this.selectMnemonicTable(tableIndex).then(() => {
            this.doSelectMnemonicTables(++tableIndex, callback);
         });
      } else {
         callback();
      }
   }

   selectMnemonicTable(tableIndex:number): Promise<void> {
      return new Promise((resolve, reject) => {
         var savedIndex = -1;
         if (this.editNewWords.selectedMnemonicTables && this.editNewWords.selectedMnemonicTables[tableIndex]) {
            savedIndex = this.editNewWords.savedMnemonicTitles.map((tbl:any) => { return tbl.Table; }).indexOf(this.editNewWords.selectedMnemonicTables[tableIndex].Category);
         }
         var isGet = true;
         if (savedIndex >= 0) {
            isGet = false;
            this.editNewWords.mnemonic_titles[tableIndex] = this.editNewWords.savedMnemonicTitles[savedIndex].Titles;
            this.editNewWords.mnemonic_reviewed[tableIndex] = this.editNewWords.savedMnemonicTitles[savedIndex].Reviews;
         }
         this.doGetMnemonicsTitles(isGet, tableIndex).then(() => {
            if (isGet === true) {
               this.editNewWords.savedMnemonicTitles.push({ "Table": this.editNewWords.selectedMnemonicTables[tableIndex].Category, "Titles": this.editNewWords.mnemonic_titles[tableIndex], "Reviews": this.editNewWords.mnemonic_reviewed[tableIndex] });
            }
            if (this.editNewWords.isOneMnemonicTable === true) {
               for (var i = 0; i < this.editNewWords.count_mnemonic; i++) {
                  this.editNewWords.selectedMnemonicTables[i] = this.editNewWords.selectedMnemonicTables[tableIndex];
                  this.editNewWords.mnemonic_titles[i] = this.editNewWords.mnemonic_titles[tableIndex];
                  this.editNewWords.mnemonic_reviewed[i] = this.editNewWords.mnemonic_reviewed[tableIndex];
                  this.editNewWords.selectedMnemonicTitles[i] = this.editNewWords.mnemonic_titles[tableIndex][i];
               }
            } else {
               this.editNewWords.selectedMnemonicTitles[tableIndex] = this.editNewWords.mnemonic_titles[tableIndex][0];
            }
            this.checkWords(false);
            resolve();
         });
      });
   }

}

interface myObject {
   [key: string]: any;
}
function titles(titles: any, arg1: (any: any) => void) {
   throw new Error('Function not implemented.');
}

