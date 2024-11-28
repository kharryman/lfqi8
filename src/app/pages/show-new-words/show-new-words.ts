import { Component, AfterViewInit } from '@angular/core';
import { NavController, LoadingController, Platform, AlertController } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';
import { DB_Type_ID, Helpers, Op_Type, Op_Type_ID, SyncQuery, User_Action_Request } from '../../providers/helpers/helpers';
import { ArgumentOutOfRangeError, Subscription } from 'rxjs';

@Component({
   selector: 'page-show-new-words',
   templateUrl: 'show-new-words.html',
   styleUrl: 'show-new-words.scss'
})
export class ShowNewWordsPage {
   public pageName: string = "Show New Words";
   newWords: any;
   public database_acrostics: SQLiteDBConnection | null = null;
   public database_misc: SQLiteDBConnection | null = null;
   progressLoader: any;
   review_index: any;
   review_times: any = [1, 5, 10, 30, 100, 180];
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   private onPauseSubscription: Subscription;

   constructor(public navCtrl: NavController, private platform: Platform, private alertCtrl: AlertController, public progress: LoadingController, public storage: Storage, public helpers: Helpers) {
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
      console.log("ngOnInit called.");
      this.database_acrostics = this.helpers.getDatabaseAcrostics();
      this.database_misc = this.helpers.getDatabaseMisc();
      this.newWords = {};
      Helpers.currentPageName = this.pageName;
      this.newWords.trueVar = true;
      this.newWords.user = Helpers.User;
      await this.storage.create();
      this.newWords.isShowResults = false;
      this.review_index = null;
      this.review_times = [1, 5, 10, 30, 100, 180]
      this.newWords.days = [0, 1, 2, 3, 4, 5, 6, 7];
      this.newWords.isEvents = false;
      this.newWords.isEditMnemonics = false;
      this.newWords.isShowAllPeglist = false;
      this.newWords.isShowMajorPeglist = false;
      this.newWords.isEventsShared = true;
      this.newWords.isEventsUser = false;
      this.newWords.eventsOption = "MAJOR";
      this.newWords.isEventsAscending = false;
      this.newWords.peglist = [];
      this.newWords.isShowingMenu = false;
      this.newWords.subscribedMenuToolbarEvent = this.helpers.menuToolbarEvent.subscribe((isShown: any) => {
         this.newWords.isShowingMenu = isShown;
      });

      this.helpers.setEncryptionKey(this.helpers.usernameHash(this.newWords.user.Username));
      for (var i = 0; i < 100; i++) {
         this.newWords.days.push(i);
      }
      var val: string = await this.storage.get('SHOW_NEWWORDS_DAYS_BEFORE');
      if (val != null) {
         this.newWords.daysBefore = val;
      } else {
         this.newWords.daysBefore = this.newWords.days[0];
      }
      val = await this.storage.get("SHOW_NEWWORDS_IS_EVENTS");
      if (val != null) {
         this.newWords.isEvents = val;
      }
      val = await this.storage.get("SHOW_NEWWORDS_EVENTS_OPTION");
      if (val != null) {
         this.newWords.eventsOption = val;
      }
      val = await this.storage.get("SHOW_NEWWORDS_EVENTS_SHOW_SHARED");
      if (val != null) {
         this.newWords.isEventsShared = val;
      }
      val = await this.storage.get("SHOW_NEWWORDS_EVENTS_SHOW_USER");
      if (val != null) {
         this.newWords.isEventsUser = val;
      }
      val = await this.storage.get("SHOW_NEWWORDS_IS_EVENTS_ASCENDING");
      if (val != null) {
         this.newWords.isEventsAscending = val;
      }
      this.background_color = Helpers.background_color;
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;
      this.newWords.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor: any) => {
         this.background_color = bgColor;
      });
      this.newWords.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor: any) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
      });
      this.newWords.user = Helpers.User;
   }

   async ngAfterViewInit() {
      console.log("ShowNewWords ngAfterViewInit called");
      var peglist: any = await this.helpers.getPeglist();
      this.newWords.peglist = peglist;
      if (this.newWords.peglist.length >= 100) {
         this.newWords.hasPeglist = true;
      }
      var res: any = await this.setReviewTimes();
      console.log("this.review_times=" + this.review_times);
      var val:any = await this.storage.get('SHOW_NEWWORDS_REVIEW_INDEX');
      console.log("review_index = " + val);
      if (val != null) {
         this.review_index = val;
         console.log("ngOnInit CALLING getNewWords...");
         await this.getNewWords(this.review_index, true);
         console.log("ngOnInit getNewWords DONE DISMISSING PROGRESS!");
         this.helpers.dismissProgress();
      } else {
         this.helpers.dismissProgress();
      }
    }

   

   ionViewWillLeave() {
      console.log('ionViewWillLeave ShowNewwordsPage');
      this.newWords.subscribedBackgroundColorEvent.unsubscribe();
      this.newWords.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   async saveStorage() {
      console.log("saveStorage called");
      await this.storage.set('SHOW_NEWWORDS_DAYS_BEFORE', this.newWords.daysBefore);
      await this.storage.set('SHOW_NEWWORDS_REVIEW_INDEX', this.review_index);
      await this.storage.set("SHOW_NEWWORDS_IS_EVENTS", this.newWords.isEvents);
      await this.storage.set("SHOW_NEWWORDS_EVENTS_OPTION", this.newWords.eventsOption);
      await this.storage.set("SHOW_NEWWORDS_EVENTS_SHOW_SHARED", this.newWords.isEventsShared);
      await this.storage.set("SHOW_NEWWORDS_EVENTS_SHOW_USER", this.newWords.isEventsUser);
      await this.storage.set("SHOW_NEWWORDS_IS_EVENTS_ASCENDING", this.newWords.isEventsAscending);
   }


   goBackUp() {
      console.log("goBackUp called.");
      this.storage.remove('SHOW_NEWWORDS_REVIEW_INDEX').then(() => {
         console.log("goBackUp SHOW_NEWWORDS_REVIEW_INDEX SET TO NULL!!");
         this.newWords.isShowResults = false;
         this.review_index = null;
      });
   }

   getFormattedDateBefore() {
      var days_before = parseInt(this.newWords.daysBefore) + parseInt(this.review_times[this.review_index]);
      console.log("getFormattedDateBefore called, days_before=" + days_before + ", this.newWords.daysBefore=" + this.newWords.daysBefore);
      // GET DATE:
      var date = new Date();
      var last = new Date(date.getTime() - (days_before * 24 * 60 * 60 * 1000));
      var day = last.getDate();
      var month = last.getMonth() + 1;
      var year = last.getFullYear();
      var month_display_number = String(month);
      var day_display_number = String(day);
      if (month < 10) {
         month_display_number = "0" + month;
      }
      if (day < 10) {
         day_display_number = "0" + day;
      }
      return year + "/" + month_display_number + "/" + day_display_number;
   }

   getLast() {
      console.log("getLast called.");
      if (this.review_index == 0) {
         this.newWords.newWordsStatus = "<b><u>NO PREVIOUS REVIEW.</u></b>";
         return;
      }
      this.newWords.newWordsStatus = "";
      this.review_index--;
      this.getNewWords(this.review_index, false);

   }
   getNext() {
      console.log("getNext called. review_index=" + this.review_index + ", review_times.length= " + this.review_times.length);
      if (this.review_index >= (this.review_times.length - 1)) {
         this.newWords.newWordsStatus = "<b><u>NO NEXT REVIEW.</u></b>";
         return;
      }
      this.newWords.newWordsStatus = "";
      this.review_index++;
      this.getNewWords(this.review_index, false);
   }

   async getNewWords(review_index: number, isDoingProgress: boolean): Promise<any> {
      return new Promise<void>(async (resolve, reject) => {
         this.newWords.newWordsStatus = "";
         this.review_index = review_index;
         var date_before = this.getFormattedDateBefore();
         console.log('getNewWords called');
         this.newWords.majorEvents = [];
         // SET VARIABLES:
         // INITIATE VARIABLES:
         //console.log("this.newWordsStatus=" + this.newWordsStatus);
         await this.helpers.setProgress("Getting words of " + date_before + ", please wait...", isDoingProgress);
         this.newWords.newWords = [];
         this.newWords.mnemonics = [];
         this.newWords.numbers_shared = [];
         this.newWords.numbers_user_historical = [];
         this.newWords.numbers_user_personal = [];
         if (Helpers.isWorkOffline === false) {
            var params = {
               "username": Helpers.User.Username,
               "date_before": date_before,
               "is_events": this.newWords.isEvents,
               "is_events_shared": this.newWords.isEventsShared,
               "is_events_user": this.newWords.isEventsUser,
               "is_ascend": this.newWords.isEventsAscending,
               "event_option": this.newWords.eventsOption
            };
            var data: any = null;
            try {
               data = await this.helpers.makeHttpRequest("/lfq_app_php/show_newwords_get.php", "GET", params);
            } catch (error: any) {
               this.helpers.dismissProgress();
               this.newWords.newWordsStatus = "Sorry. Error loading new words: " + error.message;
               this.helpers.alertServerError("Sorry. Error loading new words: " + error.message);
               resolve();
            }
            if (data && data["SUCCESS"] === true) {
               this.newWords.isShowResults = true;
               this.newWords.promptReviewTime = "<b>" + this.review_times[this.review_index] + " DAYS BEFORE:" + date_before + "</b><br />";
               this.newWords.REVIEW_DATE_MAJOR = date_before;
               this.newWords.MNEMONICS = data["MNEMONICS"];
               //for (var i = 0; i < data["WORDS"].length; i++) {
               //   this.newWords.newWords.push({ "User_ID": data["WORDS"][i].User_ID, "Username": data["WORDS"][i].Username, "table": data["WORDS"][i].Table_name, "word": data["WORDS"][i].Word, "isInformationExpanded": false, "information": data["WORDS"][i].Information, "oldInformation": data["WORDS"][i].Information, "isEditInformation": false, "informationStatus": "", "oldAcrostic": data["WORDS"][i].Acrostics, "acrostic": data["WORDS"][i].Acrostics, "acrosticStatus": "", "isEditAcrostic": false });
               //}
               this.finishGetNewwords(data["WORDS"]);

               var majorEventObj: any = {};
               this.newWords.majorEvents = [];
               this.newWords.majorUserEvents = [];
               var date_exploded = date_before.split("/");
               if (this.newWords.isEvents === true) {
                  for (var i = 0; i < data["MAJOR_EVENTS"].length; i++) {
                     majorEventObj = data["MAJOR_EVENTS"][i];
                     majorEventObj["oldEvent"] = data["MAJOR_EVENTS"][i].Event;
                     majorEventObj["isEditEvent"] = false;
                     majorEventObj["oldMnemonics"] = data["MAJOR_EVENTS"][i].Mnemonics;
                     majorEventObj["isEditMnemonics"] = false;
                     majorEventObj["MAJOR_WORDS"] = this.helpers.getSavedWords(data["MAJOR_EVENTS"][i]);
                     var peg_words = [];
                     var yearSplit = [];
                     if (this.newWords.eventsOption !== "MAJOR") {
                        peg_words = [];
                        yearSplit = ("000" + data["MAJOR_EVENTS"][i].Year.replace(" BC", "")).slice(-4).split("");
                        peg_words.push(this.newWords.peglist[parseInt(yearSplit[0] + yearSplit[1])] + "(" + yearSplit[0] + yearSplit[1] + ")");
                        peg_words.push(this.newWords.peglist[parseInt(yearSplit[2] + yearSplit[3])] + "(" + yearSplit[2] + yearSplit[3] + ")");
                        peg_words.push(this.newWords.peglist[parseInt(date_exploded[1])] + "(" + date_exploded[1] + ")");
                        peg_words.push(this.newWords.peglist[parseInt(date_exploded[2])] + "(" + date_exploded[2] + ")");
                        //TO_DO:
                        majorEventObj["PEGLIST_WORDS"] = peg_words.join(" ");
                     }
                     this.newWords.majorEvents.push(majorEventObj);
                  }

                  for (var i = 0; i < data["MAJOR_USER_EVENTS"].length; i++) {
                     majorEventObj = data["MAJOR_USER_EVENTS"][i];
                     majorEventObj["oldEvent"] = data["MAJOR_USER_EVENTS"][i].Event;
                     majorEventObj["isEditEvent"] = false;
                     majorEventObj["oldMnemonics"] = data["MAJOR_USER_EVENTS"][i].Mnemonics;
                     majorEventObj["isEditMnemonics"] = false;
                     majorEventObj["MAJOR_WORDS"] = this.helpers.getSavedWords(data["MAJOR_USER_EVENTS"][i]);
                     var peg_words = [];
                     var yearSplit = [];
                     if (this.newWords.eventsOption !== "MAJOR") {
                        peg_words = [];
                        yearSplit = ("000" + data["MAJOR_USER_EVENTS"][i].Year.replace(" BC", "")).slice(-4).split("");
                        peg_words.push(this.newWords.peglist[parseInt(yearSplit[0] + yearSplit[1])] + "(" + yearSplit[0] + yearSplit[1] + ")");
                        peg_words.push(this.newWords.peglist[parseInt(yearSplit[2] + yearSplit[3])] + "(" + yearSplit[2] + yearSplit[3] + ")");
                        peg_words.push(this.newWords.peglist[parseInt(date_exploded[1])] + "(" + date_exploded[1] + ")");
                        peg_words.push(this.newWords.peglist[parseInt(date_exploded[2])] + "(" + date_exploded[2] + ")");
                        //TO_DO:
                        majorEventObj["PEGLIST_WORDS"] = peg_words.join(" ");
                     }
                     this.newWords.majorUserEvents.push(majorEventObj);
                  }
               }
               this.helpers.dismissProgress();
               resolve();
            } else {
               this.helpers.dismissProgress();
               this.helpers.alertLfqError(data["ERROR"]);
               resolve();
            }
         } else {
            var sql = "SELECT ";
            sql += "unw.ID AS NW_ID, at.Table_name AS NW_Table_name, unw.User_ID AS NW_User_ID, unw.Date AS NW_Date, unw.Table_ID AS NW_Table_ID, unw.Word AS NW_Word, unw.Mnemonic_ID AS NW_Mnemonic_ID, unw.Global_Number_ID, unw.User_Number_ID, ";
            sql += "m.ID AS MNE_Mnemonic_ID, mc.Name AS MNE_Category, m.User_ID AS MNE_User_ID, m.Mnemonic_Type_ID AS MNE_Mnemonic_Type_ID, m.Mnemonic_Category_ID AS MNE_Mnemonic_Category_ID, m.Is_Linebreak AS MNE_Is_Linebreak, m.Title AS MNE_Title, m.Number AS MNE_Number, m.Number_Power AS MNE_Number_Power, ";
            sql += "me.Entry_Index AS MNE_Entry_Index, me.Entry  AS MNE_Entry, me.Entry_Mnemonic AS MNE_Entry_Mnemonic, me.Entry_Info AS MNE_Entry_Info, ";
            sql += "gn.ID AS GN_ID, gn.Mnemonic_Type_ID AS GN_Mnemonic_Type_ID, gn.Title AS GN_Title, gn.User_ID AS GN_User_ID, gn.Number AS GN_Number, gn.Number_Power AS GN_Number_Power, ";
            sql += "gne.Number_ID AS GN_Number_ID, gne.Entry_Index AS GN_Entry_Index, gne.Entry AS GN_Entry, gne.Entry_Info AS GN_Entry_Info, gne.Entry_Mnemonic AS GN_Entry_Mnemonic, gne.Entry_Mnemonic_Info AS GN_Entry_Mnemonic_Info, "
            sql += "un.ID AS UN_ID, un.Mnemonic_Type_ID AS UN_Mnemonic_Type_ID, un.Title AS UN_Title, un.User_ID AS UN_User_ID, un.Data_Type_ID AS UN_Data_Type_ID, un.Number AS UN_Number, un.Number_Power AS UN_Number_Power, ";
            sql += "une.Number_ID AS UN_Number_ID, une.Entry_Index AS UN_Entry_Index, une.Entry AS UN_Entry, une.Entry_Info AS UN_Entry_Info, une.Entry_Mnemonic AS UN_Entry_Mnemonic, une.Entry_Mnemonic_Info AS UN_Entry_Mnemonic_Info ";
            sql += "FROM " + Helpers.TABLES_MISC.user_new_word + " unw ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " ud ON ud.ID=unw.User_ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.acrostic_table + " at ON at.ID=unw.Table_ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.mnemonic + " m ON m.ID=unw.Mnemonic_ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.mnemonic_category + " mc ON mc.ID=m.Mnemonic_Category_ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.mnemonic_entry + " me ON me.Mnemonic_ID=m.ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.global_number + " gn ON gn.ID=unw.Global_Number_ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.global_number_entry + " gne ON gne.Number_ID=gn.ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.user_number + " un ON un.ID=unw.User_Number_ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.user_number_entry + " une ON une.Number_ID=un.ID ";
            sql += "WHERE unw.User_ID='" + Helpers.User.ID + "' AND unw.Date='" + date_before + "'";
            console.log("getWords sql = " + sql);
            var data: any = null;
            try {
               data = await this.helpers.query(this.database_misc, sql, 'query', []);
            } catch (error: any) {
               console.log("sql:" + sql + ", ERROR:" + error.message);
               this.helpers.dismissProgress();
               this.newWords.newWordsStatus = "Sorry. Error loading new words." + error.message;
               resolve();
            }
            if (data) {
               console.log("BACK FROM GETTING NEW WORDS, length=" + data.values.length);
               this.newWords.isShowResults = true;
               this.newWords.promptReviewTime = "<b>" + this.review_times[this.review_index] + " DAYS BEFORE:" + date_before + "</b><br />";
               this.newWords.REVIEW_DATE_MAJOR = date_before;
               if (data.values.length > 0) {
                  var newwords = [];
                  for (var d = 0; d < data.values.length; d++) {
                     newwords.push(data.values[d]);
                  }
                  this.finishGetNewwords(newwords);
                  var sql = "SELECT unm.Mnemonics FROM " + Helpers.TABLES_MISC.user_new_word_mnemonic + " unm ";
                  sql += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " ud on ud.ID=unm.User_ID ";
                  sql += "WHERE unm.Date='" + date_before + "' AND ud.Username='" + Helpers.User.Username + "'";
                  data = null;
                  try {
                     data = await this.helpers.query(this.database_misc, sql, 'query', []);
                  } catch (error: any) {
                     console.log("sql:" + sql + ", ERROR:" + error.message);
                     this.helpers.dismissProgress();
                     this.newWords.newWordsStatus = "Sorry. Error loading new words." + error.message;
                  }
                  if (data) {
                     this.newWords.MNEMONICS = null;
                     if (data.values.length > 0) {
                        this.newWords.MNEMONICS = data.values[0].Mnemonics;
                     }
                     //DATE FORMAT: YYYY/MM/DD
                     await this.doMajorWords(date_before);
                     this.getInformationAcrostic(0);
                     resolve();
                  }
               } else {
                  this.newWords.newWordsStatus = "<b><u>NO NEWWORDS FOR " + date_before + "</u></b>";
                  await this.doMajorWords(date_before);
                  this.helpers.dismissProgress();
                  resolve();
                  //this.getInformationAcrostic(0);
               }
            }
         }
      });
   }

   finishGetNewwords(newwords: any) {
      if (!newwords || newwords.length === 0) { return; }
      console.log("finishGetNewwords called");
      var rowKeys: any = Object.keys(newwords[0]);
      var table: any = "", word: any = "", newwordObj: any = {};
      //ACROSTICS:
      for (var i = 0; i < newwords.length; i++) {
         if (newwords[i].NW_Word != null) {
            word = newwords[i].NW_Word;
            table = newwords[i].NW_Table_name;
            newwordObj = {
               "table": table,
               "word": word,
               "isInformationExpanded": false,
               "information": "",
               "isEditInformation": false,
               "informationStatus": "",
               "oldAcrostic": "",
               "acrostic": "",
               "acrosticStatus": "",
               "isEditAcrostic": false,
               "Username": newwords[i].NW_Username
            };
            if (Helpers.isWorkOffline === false) {
               newwordObj["information"] = newwords[i].NW_Information;
               newwordObj["oldInformation"] = newwords[i].NW_Information;
               newwordObj["acrostic"] = newwords[i].NW_Acrostics;
               newwordObj["oldAcrostic"] = newwords[i].NW_Acrostics;
            }
            this.newWords.newWords.push(newwordObj);
         }
      }
      console.log("newwords = " + JSON.stringify(newwords));
      //MNEMONICS:
      this.newWords.mnemonics = [];
      var mneKeys = rowKeys.filter((key: any) => { return key.split("_")[0] === "MNE" });
      var mneKeySplit: any = [];
      var mnemonic: any = [], mneObj: any = {};
      var uniqueMneIDs = newwords.map((nw: any) => { return nw.MNE_Mnemonic_ID }).filter((mneID: any) => { return mneID != null; }).filter(this.helpers.onlyUnique);
      var mneText = "";
      for (var i = 0; i < uniqueMneIDs.length; i++) {
         mnemonic = newwords.filter((nw: any) => { return nw.MNE_Mnemonic_ID === uniqueMneIDs[i] }).map((mne: any) => {
            mneObj = {}
            for (var mk = 0; mk < mneKeys.length; mk++) {
               mneKeySplit = mneKeys[mk].split("_");
               mneObj[mneKeySplit.slice(1).join("_")] = mne[mneKeys[mk]];
            }
            return mneObj;
         });
         mneText = this.helpers.getMnemonicText(mnemonic, this.newWords.peglist);
         this.newWords.mnemonics.push({ "Category": mnemonic[0].Category, "Title": mnemonic[0].Title, "text": mneText });
      }

      //GET SHARED NUMBERS:                  
      var uniqueNumberSharedIDs = newwords.map((nw: any) => { return nw.GN_Number_ID }).filter((numID: any) => { return numID != null; }).filter(this.helpers.onlyUnique);
      var numberShared = [];
      this.newWords.numbers_shared = [];
      for (var i = 0; i < uniqueNumberSharedIDs.length; i++) {
         numberShared = newwords.filter((nw: any) => { return nw.GN_Number_ID === uniqueNumberSharedIDs[i] });
         if (numberShared.length > 0) {
            this.newWords.numbers_shared.push(numberShared);
         }
      }

      //GET USER NUMBERS HISTORICAL:
      var userNumberDecodeCols = ["UN_Title", "UN_Number", "UN_Entry", "UN_Entry_Mnemonic", "UN_Entry_Info"];
      var uniqueNumbersUserHistoricalIDs = newwords.filter((nw: any) => { return nw.UN_Number_ID != null && String(nw.UN_Data_Type_ID) === '2' }).map((nw: any) => { return nw.UN_Number_ID }).filter((numID: any) => { return numID != null; }).filter(this.helpers.onlyUnique);
      console.log("uniqueNumbersUserHistoricalIDs = " + uniqueNumbersUserHistoricalIDs);
      var numberUserHistorical = [];
      this.newWords.numbers_user_historical = [];
      for (var i = 0; i < uniqueNumbersUserHistoricalIDs.length; i++) {
         numberUserHistorical = newwords.filter((nw: any) => { return nw.UN_Number_ID === uniqueNumbersUserHistoricalIDs[i] && String(nw.UN_Data_Type_ID) === '2' });
         if (numberUserHistorical.length > 0) {
            for (var j = 0; j < numberUserHistorical.length; j++) {
               for (var p = 0; p < userNumberDecodeCols.length; p++) {
                  numberUserHistorical[j][userNumberDecodeCols[p]] = this.helpers.decryptData(numberUserHistorical[j][userNumberDecodeCols[p]]);
               }
            }
            this.newWords.numbers_user_historical.push(numberUserHistorical);
         }
      }

      //GET USER NUMBERS PERSONAL:
      var uniqueNumbersUserPersonalIDs = newwords.filter((nw: any) => { return nw.UN_Number_ID != null && String(nw.UN_Data_Type_ID) === '1' }).map((nw: any) => { return nw.UN_Number_ID }).filter((numID: any) => { return numID != null; }).filter(this.helpers.onlyUnique);
      console.log("uniqueNumbersUserPersonalIDs = " + uniqueNumbersUserPersonalIDs);
      var numberUserPersonal = [];
      this.newWords.numbers_user_personal = [];
      for (var i = 0; i < uniqueNumbersUserPersonalIDs.length; i++) {
         numberUserPersonal = newwords.filter((nw: any) => { return nw.UN_Number_ID === uniqueNumbersUserPersonalIDs[i] && String(nw.UN_Data_Type_ID) === '1' });
         //console.log("numberUserPersonal = " + JSON.stringify(numberUserPersonal));
         if (numberUserPersonal.length > 0) {
            for (var j = 0; j < numberUserPersonal.length; j++) {
               for (var p = 0; p < userNumberDecodeCols.length; p++) {
                  //console.log("DECRYPTING userNumberDecodeCols[p] = " + userNumberDecodeCols[p] + ", numberUserPersonal[j][userNumberDecodeCols[p] = " + numberUserPersonal[j][userNumberDecodeCols[p]]);
                  numberUserPersonal[j][userNumberDecodeCols[p]] = this.helpers.decryptData(numberUserPersonal[j][userNumberDecodeCols[p]]);
                  //console.log("after DECRYPTING numberUserPersonal[j][userNumberDecodeCols[p]] = " + numberUserPersonal[j][userNumberDecodeCols[p]]);
               }
            }
            this.newWords.numbers_user_personal.push(numberUserPersonal);
         }
      }
   }

   doMajorWords(date_before: any): Promise<void> {
      var self = this;
      return new Promise((resolve, reject) => {
         if (this.newWords.isEvents === false) {
            resolve();
         } else {
            var date_exploded = date_before.split("/");
            var event_date = date_exploded[1] + "-" + date_exploded[2];
            var sqlMajor = " AND et.Number1 IS NOT NULL AND et.Number1<>''";
            if (this.newWords.eventsOption === "ALL_PEGLIST" || this.newWords.eventsOption === "MAJOR_ALL_PEGLIST") {
               sqlMajor = "";
            }
            var ascending_clause = this.newWords.isEventsAscending === true ? "ASC" : "DESC";
            var sql = "SELECT et.*,ud.Username FROM " + Helpers.TABLES_MISC.event_table + " AS et ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.userdata + " AS ud ON ud.ID=et.User_ID ";
            sql += "WHERE et.Date='" + event_date + "'" + sqlMajor + " ORDER BY et.Year " + ascending_clause;
            //console.log("doMajorWords sql1 = " + sql1);
            this.helpers.query(this.database_misc, sql, 'query', []).then((data) => {
               self.newWords.majorEvents = [];
               var majorEventObj: any = {};
               var yearSplit: any = [];
               var peg_words: any = [];
               for (var i = 0; i < data.values.length; i++) {
                  majorEventObj = data.values[i];
                  majorEventObj["oldEvent"] = majorEventObj["Event"];
                  majorEventObj["isEditEvent"] = false;
                  majorEventObj["oldMnemonics"] = majorEventObj["Mnemonics"];
                  majorEventObj["isEditMnemonics"] = false;
                  majorEventObj["MAJOR_WORDS"] = this.helpers.getSavedWords(data.values[i]);
                  if (this.newWords.eventsOption !== "MAJOR") {
                     peg_words = [];
                     yearSplit = ("000" + String(data.values[i].Year).replace("-", "")).slice(-4).split("");
                     peg_words.push(this.newWords.peglist[parseInt(yearSplit[0] + yearSplit[1])] + "(" + yearSplit[0] + yearSplit[1] + ")");
                     peg_words.push(this.newWords.peglist[parseInt(yearSplit[2] + yearSplit[3])] + "(" + yearSplit[2] + yearSplit[3] + ")");
                     peg_words.push(this.newWords.peglist[parseInt(date_exploded[1])] + "(" + date_exploded[1] + ")");
                     peg_words.push(this.newWords.peglist[parseInt(date_exploded[2])] + "(" + date_exploded[2] + ")");
                     //TO_DO:
                     majorEventObj["PEGLIST_WORDS"] = peg_words.join(" ");
                  }
                  self.newWords.majorEvents.push(majorEventObj);
               }

               var sql = "SELECT * FROM " + Helpers.TABLES_MISC.user_event + " AS et";
               sql += " WHERE et.Date='" + event_date + "'" + sqlMajor + " ORDER BY et.Year " + ascending_clause;
               this.helpers.query(this.database_misc, sql, 'query', []).then((data) => {
                  self.newWords.majorUserEvents = [];
                  majorEventObj = {};
                  yearSplit = [];
                  peg_words = [];
                  for (var i = 0; i < data.values.length; i++) {
                     majorEventObj = data.values[i];
                     majorEventObj["oldEvent"] = majorEventObj["Event"];
                     majorEventObj["isEditEvent"] = false;
                     majorEventObj["oldMnemonics"] = majorEventObj["Mnemonics"];
                     majorEventObj["isEditMnemonics"] = false;
                     majorEventObj["MAJOR_WORDS"] = this.helpers.getSavedWords(data.values[i]);
                     if (this.newWords.eventsOption !== "MAJOR") {
                        peg_words = [];
                        yearSplit = ("000" + String(data.values[i].Year).replace("-", "")).slice(-4).split("");
                        peg_words.push(this.newWords.peglist[parseInt(yearSplit[0] + yearSplit[1])] + "(" + yearSplit[0] + yearSplit[1] + ")");
                        peg_words.push(this.newWords.peglist[parseInt(yearSplit[2] + yearSplit[3])] + "(" + yearSplit[2] + yearSplit[3] + ")");
                        peg_words.push(this.newWords.peglist[parseInt(date_exploded[1])] + "(" + date_exploded[1] + ")");
                        peg_words.push(this.newWords.peglist[parseInt(date_exploded[2])] + "(" + date_exploded[2] + ")");
                        //TO_DO:
                        majorEventObj["PEGLIST_WORDS"] = peg_words.join(" ");
                     }
                     self.newWords.majorUserEvents.push(majorEventObj);
                  }
                  resolve();
               });
            });
         }
      });
   }


   getInformationAcrostic(index: number) {
      if (index < this.newWords.newWords.length) {
         var sql = "SELECT Information,Acrostics,User_ID FROM " + this.newWords.newWords[index].table + " WHERE Name='" + this.newWords.newWords[index].word + "'";
         this.helpers.query(this.database_acrostics, sql, 'query', []).then((data) => {
            if (data.values.length > 0) {
               this.newWords.newWords[index].information = data.values[0].Information;
               this.newWords.newWords[index].oldInformation = data.values[0].Information;
               this.newWords.newWords[index].acrostic = data.values[0].Acrostics;
               this.newWords.newWords[index].oldAcrostic = data.values[0].Acrostics;
               this.newWords.newWords[index].User_ID = data.values[0].User_ID;
               var sql = "SELECT Username FROM " + Helpers.TABLES_MISC.userdata + " WHERE ID='" + data.values[0].User_ID + "'";
               this.helpers.query(this.database_misc, sql, 'query', []).then((data) => {
                  this.newWords.newWords[index].Username = data.values[0].Username;
                  index++;
                  this.getInformationAcrostic(index);
               });
            } else {
               index++;
               this.getInformationAcrostic(index);
            }
         }).catch((error) => {
            console.log("sql:" + sql + ", ERROR:" + error.message);
            this.newWords.newWordsStatus = "Sorry. Error getting acrostic information for one of the new words."
         });
      } else {
         this.helpers.dismissProgress();
      }
   }

   async setReviewTimes(): Promise<any> {
      console.log("setReviewTimes called.");
      //this.helpers.setProgress("Logged in, setting review times, please wait...", false).then(() => {

      if (Helpers.isWorkOffline === false) {
         var params = {
            "username": Helpers.User.Username
         };
         this.helpers.makeHttpRequest("/lfq_app_php/show_newwords_review_times.php", "GET", params).then(async (data) => {
            await this.helpers.dismissProgress();
            if (data["SUCCESS"] === true) {
               this.finishSetReviewTimes(data["REVIEW_TIMES"]);
               return true;
            } else {
               this.helpers.alertLfqError(data["ERROR"]);
               return false;
            }
         }, async error => {
            await this.helpers.dismissProgress();
            this.newWords.newWordsStatus = "Sorry. Error setting review times: " + error.message;
            this.helpers.alertServerError("Sorry. Error setting review times: " + error.message);
            return false;
         });
      } else {
         var sql = "SELECT * FROM " + Helpers.TABLES_MISC.user_review_time + " a ";
         sql += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " ud on ud.ID=a.User_ID ";
         sql += "WHERE ud.Username='" + Helpers.User.Username + "'";
         this.helpers.query(this.database_misc, sql, 'query', []).then(async (data) => {
            await this.helpers.dismissProgress();
            this.finishSetReviewTimes(data.values[0]);
            return true;
         }).catch(async (error) => {
            await this.helpers.dismissProgress();
            console.log("sql:" + sql + ", ERROR:" + error.message);
            this.newWords.newWordsStatus = "Sorry. Error setting review times." + error.message;
            return false;
         });
      }
      //});
   }

   finishSetReviewTimes(review_times: any) {
      this.review_times = [];
      for (var i = 1; i <= 10; i++) {
         console.log("parseInt(data.values[0]['Time' + i]) = " + parseInt(review_times["Time" + i]));
         if (!isNaN(parseInt(review_times["Time" + i]))) {
            this.review_times.push(parseInt(review_times["Time" + i]));
         }
      }
      console.log("this.review_times=" + JSON.stringify(this.review_times));
      console.log("this.review_times.length=" + this.review_times.length);
   }

   expandInformation(index: number) {
      if (this.newWords.newWords[index].isInformationExpanded === false) {
         this.newWords.newWords[index].isInformationExpanded = true;
      } else {
         this.newWords.newWords[index].isInformationExpanded = false;
      }
   }

   editInformation(newwordsIndex: number) {
      console.log("editInformation called.");
      if (this.newWords.newWords[newwordsIndex].isEditInformation === true) {
         this.newWords.newWords[newwordsIndex].isEditInformation = false;
         var info = this.newWords.newWords[newwordsIndex].information;
         var info_old = this.newWords.newWords[newwordsIndex].oldInformation;
         var table = this.newWords.newWords[newwordsIndex].table;
         var word = this.newWords.newWords[newwordsIndex].word;
         var user_id_old = this.newWords.newWords[newwordsIndex].User_ID;
         if (this.newWords.newWords[newwordsIndex].information === this.newWords.newWords[newwordsIndex].oldInformation) {
            //myAlert(title: any, subtitle, message: any, okButton)
            this.helpers.myAlert("Alert", "", "Information is the same, not updating.", "Dismiss");
            return;
         }
         this.helpers.setProgress("Updating information of " + word + ", please wait...", false).then(() => {
            //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
            var queries = [new SyncQuery(null, this.newWords.newWords[newwordsIndex].User_ID, DB_Type_ID.DB_ACROSTICS, table, Op_Type_ID.UPDATE, ["Information"], [info], { "Name": word }, User_Action_Request.USER_ID_UPDATE)];
            //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
            this.helpers.autoSync(queries, Op_Type_ID.UPDATE, this.newWords.newWords[newwordsIndex].User_ID, { "Name": word }, { "Information": this.newWords.newWords[newwordsIndex].oldInformation }, { "Information": info }).then((res) => {
               if (res.isSuccess === true) {
                  this.newWords.newWords[newwordsIndex].informationStatus = "<b>Updated " + word + "." + res.results + "</b>";
                  this.helpers.dismissProgress();
               } else {
                  console.log("ERROR:" + res.results);
                  this.helpers.dismissProgress();
                  this.newWords.newWords[newwordsIndex].informationStatus = "Sorry. Error editting information:" + res.results
               }
            });
         });
      } else {
         this.newWords.newWords[newwordsIndex].isEditInformation = true;
      }
   }

   editAcrostic(newwordsIndex: number) {
      console.log("editAcrostic called.");
      if (this.newWords.newWords[newwordsIndex].isEditAcrostic === true) {
         this.newWords.newWords[newwordsIndex].isEditAcrostic = false;
         var acrostic = this.newWords.newWords[newwordsIndex].acrostic;
         var acrostic_old = this.newWords.newWords[newwordsIndex].oldAcrostic;
         var table = this.newWords.newWords[newwordsIndex].table;
         var word = this.newWords.newWords[newwordsIndex].word;
         var user_id_old = this.newWords.newWords[newwordsIndex].User_ID;
         if (acrostic === this.newWords.newWords[newwordsIndex].oldAcrostic) {
            //myAlert(title: any, subtitle, message: any, okButton)
            this.helpers.myAlert("Alert", "", "Acrostics is the same, not updating.", "Dismiss");
            return;
         }
         var checkAcrosticResult = this.helpers.checkAcrostic(word, acrostic);
         if (checkAcrosticResult !== true) {
            this.helpers.myAlert("Alert", "<b>Could not edit acrostic</b>", "<b>" + checkAcrosticResult + "<b><br /><br />" + Helpers.incompleteAcrosticMessage, "Dismiss");
            //this.newWords.newWords[newwordsIndex].acrostic = this.newWords.newWords[newwordsIndex].oldAcrostic;
            return;
         }
         this.helpers.setProgress("Updating acrostics of " + word + ", please wait...", false).then(() => {
            //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
            var queries = [new SyncQuery(null, this.newWords.newWords[newwordsIndex].User_ID, DB_Type_ID.DB_ACROSTICS, table, Op_Type_ID.UPDATE, ["Acrostics"], [acrostic], { "Name": word }, User_Action_Request.USER_ID_UPDATE)];
            //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
            this.helpers.autoSync(queries, Op_Type_ID.UPDATE, this.newWords.newWords[newwordsIndex].User_ID, { "Name": word }, { "Acrostic": this.newWords.newWords[newwordsIndex].oldAcrostic }, { "Acrostic": acrostic }).then((res) => {
               if (res.isSuccess === true) {
                  this.newWords.newWords[newwordsIndex].acrosticStatus = "<b>Updated " + word + "." + res.results + "</b>";
                  this.newWords.newWords[newwordsIndex].oldAcrostic = this.newWords.newWords[newwordsIndex].acrostic;
                  this.helpers.dismissProgress();
               } else {
                  console.log("UPDATE ACROSTIC ERROR:" + res.results);
                  this.newWords.newWords[newwordsIndex].acrosticStatus = "Sorry. Error editting acrostic." + res.results;
                  this.helpers.dismissProgress();
               }
            });
         });
      } else {
         this.newWords.newWords[newwordsIndex].isEditAcrostic = true;
      }
   }

   editEvent(eventIndex: number) {
      console.log("editEvent called");
      this.newWords.majorEvents[eventIndex].isEditEvent = !this.newWords.majorEvents[eventIndex].isEditEvent;
      if (this.newWords.majorEvents[eventIndex].isEditEvent === false) {

         if (this.newWords.majorEvents[eventIndex].Event === this.newWords.majorEvents[eventIndex].oldEvent) {
            //myAlert(title: any, subtitle, message: any, okButton)
            this.helpers.myAlert("Alert", "", "Event is the same, not updating.", "Dismiss");
            return;
         }
         var date = this.newWords.majorEvents[eventIndex].Year + "-" + this.newWords.majorEvents[eventIndex].Date;
         this.helpers.setProgress("Updating event, please wait...", false).then(() => {
            //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
            var queries = [new SyncQuery(null, this.newWords.majorEvents[eventIndex].User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.event_table, Op_Type_ID.UPDATE, ["Event"], [this.newWords.majorEvents[eventIndex].Event], { "Event": this.newWords.majorEvents[eventIndex].oldEvent }, User_Action_Request.USER_ID_UPDATE)];
            //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
            this.helpers.autoSync(queries, Op_Type_ID.UPDATE, this.newWords.majorEvents[eventIndex].User_ID, { "Date": date }, { "Event": this.newWords.majorEvents[eventIndex].oldEvent }, { "Event": this.newWords.majorEvents[eventIndex].Event }).then((res) => {
               if (res.isSuccess === true) {
                  this.newWords.majorEvents[eventIndex].updateEventStatus = "<b>Updated event. " + res.results + "</b>";
                  this.helpers.dismissProgress();
               } else {
                  console.log("ERROR:" + res.results);
                  this.newWords.majorEvents[eventIndex].updateEventStatus = "Sorry. Error editting event." + res.results;
                  this.helpers.dismissProgress();
               }
            });
         });
      }
   }

   editUserEvent(eventIndex: number) {
      console.log("editUserEvent called");
      this.newWords.majorUserEvents[eventIndex].isEditEvent = !this.newWords.majorUserEvents[eventIndex].isEditEvent;
      if (this.newWords.majorUserEvents[eventIndex].isEditEvent === false) {

         if (this.newWords.majorUserEvents[eventIndex].Event === this.newWords.majorUserEvents[eventIndex].oldEvent) {
            //myAlert(title: any, subtitle, message: any, okButton)
            this.helpers.myAlert("Alert", "", "User event is the same, not updating.", "Dismiss");
            return;
         }
         var date = this.newWords.majorUserEvents[eventIndex].Year + "-" + this.newWords.majorUserEvents[eventIndex].Date;
         this.helpers.setProgress("Updating user event, please wait...", false).then(() => {
            //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
            var queries = [new SyncQuery(null, this.newWords.majorUserEvents[eventIndex].User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.user_event, Op_Type_ID.UPDATE, ["Event"], [this.newWords.majorUserEvents[eventIndex].Event], { "Event": this.newWords.majorUserEvents[eventIndex].oldEvent }, User_Action_Request.USER_ID_UPDATE)];
            //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
            this.helpers.autoSync(queries, Op_Type_ID.UPDATE, this.newWords.majorUserEvents[eventIndex].User_ID, { "Date": date }, { "Event": this.newWords.majorUserEvents[eventIndex].oldEvent }, { "Event": this.newWords.majorUserEvents[eventIndex].Event }).then((res) => {
               if (res.isSuccess === true) {
                  this.newWords.majorUserEvents[eventIndex].updateEventStatus = "<b>Updated user event. " + res.results + "</b>";
                  this.helpers.dismissProgress();
               } else {
                  console.log("ERROR:" + res.results);
                  this.newWords.majorUserEvents[eventIndex].updateEventStatus = "Sorry. Error editting user event." + res.results;
                  this.helpers.dismissProgress();
               }
            });
         });
      }
   }

   editMnemonics(eventIndex: number) {
      console.log("editMnemonics called");
      this.newWords.majorEvents[eventIndex].isEditMnemonics = !this.newWords.majorEvents[eventIndex].isEditMnemonics;
      if (this.newWords.majorEvents[eventIndex].isEditMnemonics === false) {

         if (this.newWords.majorEvents[eventIndex].Mnemonics === this.newWords.majorEvents[eventIndex].oldMnemonics) {
            //myAlert(title: any, subtitle, message: any, okButton)
            this.helpers.myAlert("Alert", "", "Mnemonics is the same, not updating.", "Dismiss");
            return;
         }
         var date = this.newWords.majorEvents[eventIndex].Year + "-" + this.newWords.majorEvents[eventIndex].Date;
         this.helpers.setProgress("Updating mnemonics of event, please wait...", false).then(() => {
            //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
            var queries = [new SyncQuery(null, this.newWords.majorEvents[eventIndex].User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.event_table, Op_Type_ID.UPDATE, ["Mnemonics"], [this.newWords.majorEvents[eventIndex].Mnemonics], { "Event": this.newWords.majorEvents[eventIndex].Event }, User_Action_Request.USER_ID_UPDATE)];
            //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
            this.helpers.autoSync(queries, Op_Type_ID.UPDATE, this.newWords.majorEvents[eventIndex].User_ID, { "Date": date }, { "Mnemonics": this.newWords.majorEvents[eventIndex].oldMnemonics }, { "Mnemonics": this.newWords.majorEvents[eventIndex].Mnemonics }).then((res) => {
               if (res.isSuccess === true) {
                  this.newWords.majorEvents[eventIndex].updateStatus = "<b>Updated event mnemonics. " + res.results + "</b>";
                  this.helpers.dismissProgress();
               } else {
                  console.log("ERROR:" + res.results);
                  this.newWords.majorEvents[eventIndex].updateStatus = "Sorry. Error editting event mnemonics." + res.results;
                  this.helpers.dismissProgress();
               }
            });
         });
      }
   }

   editUserMnemonics(eventIndex: number) {
      console.log("editUserMnemonics called");
      this.newWords.majorUserEvents[eventIndex].isEditMnemonics = !this.newWords.majorUserEvents[eventIndex].isEditMnemonics;
      if (this.newWords.majorUserEvents[eventIndex].isEditMnemonics === false) {

         if (this.newWords.majorUserEvents[eventIndex].Mnemonics === this.newWords.majorUserEvents[eventIndex].oldMnemonics) {
            //myAlert(title: any, subtitle, message: any, okButton)
            this.helpers.myAlert("Alert", "", "Mnemonics is the same, not updating.", "Dismiss");
            return;
         }
         var date = this.newWords.majorUserEvents[eventIndex].Year + "-" + this.newWords.majorUserEvents[eventIndex].Date;
         this.helpers.setProgress("Updating mnemonics of user event, please wait...", false).then(() => {
            //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
            var queries = [new SyncQuery(null, this.newWords.majorUserEvents[eventIndex].User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.user_event, Op_Type_ID.UPDATE, ["Mnemonics"], [this.newWords.majorUserEvents[eventIndex].Mnemonics], { "Event": this.newWords.majorUserEvents[eventIndex].Event })];
            //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
            this.helpers.autoSync(queries, Op_Type_ID.UPDATE, this.newWords.majorUserEvents[eventIndex].User_ID, { "Date": date }, { "Mnemonics": this.newWords.majorUserEvents[eventIndex].oldMnemonics }, { "Mnemonics": this.newWords.majorUserEvents[eventIndex].Mnemonics }).then((res) => {
               if (res.isSuccess === true) {
                  this.newWords.majorUserEvents[eventIndex].updateStatus = "<b>Updated event mnemonics. " + res.results + "</b>";
                  this.helpers.dismissProgress();
               } else {
                  console.log("ERROR:" + res.results);
                  this.newWords.majorUserEvents[eventIndex].updateStatus = "Sorry. Error editting event mnemonics." + res.results;
                  this.helpers.dismissProgress();
               }
            });
         });
      }
   }

   clickEventsSharedUser(event: any, which: string, value: any) {
      console.log("clickEventsSharedUser called, which = " + which);
      if (value === true && ((which === "SHARED" && this.newWords.isEventsUser === false) || (which === "USER" && this.newWords.isEventsShared === false))) {
         event.preventDefault();
      } else {
         value = !value;
      }
   }

}
