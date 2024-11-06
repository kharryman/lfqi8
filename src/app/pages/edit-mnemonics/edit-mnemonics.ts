import { ChangeDetectorRef, Component } from '@angular/core';
import { NavController, LoadingController, AlertController, Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';

import { DB_Type_ID, Helpers, Mnemonic_Type_ID, Op_Type, Op_Type_ID, SyncQuery, User_Action_Request } from '../../providers/helpers/helpers';
import { NgZone } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
   selector: 'page-edit-mnemonics',
   templateUrl: 'edit-mnemonics.html',
   styleUrl: 'edit-mnemonics.scss'
})
export class EditMnemonicsPage {
   public pageName:string = "Edit Mnemonics";
   public database_misc: SQLiteDBConnection;
   progressLoader: any;
   editMnemonics: any;
   peglist: any;
   tv_mnemonic: any;
   tv_word: any;
   tv_info: any;
   mnemonic: any;
   word: any;
   info: any;
   prompt_anagram: any;
   anagram: any;
   words: any;
   mnemonics: any;
   infos: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   private onPauseSubscription: Subscription;

   constructor(public navCtrl: NavController, private platform: Platform, private alertCtrl: AlertController, public progress: LoadingController, public storage: Storage, public helpers: Helpers, public ngZone: NgZone, public changeDet: ChangeDetectorRef) {
      console.log("EDIT MNEMONICS CONSTRUCTOR CALLED.");
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
      this.editMnemonics = {};
      this.editMnemonics.user = Helpers.User;
      await this.storage.create();
      this.editMnemonics.usernamePadding = []
      for (var i = 0; i < 100; i++) {
         this.editMnemonics.usernamePadding.push("&nbsp;");
      }
      //FOR INPUTTING NUMBER MNEMONICS===================================>
      this.editMnemonics.numberPowers = [];
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
         this.editMnemonics.numberPowers.push({ "name": powerName, "value": np });
      }
      this.editMnemonics.inputNumberPower = this.editMnemonics.numberPowers[25];
      //======================================================================>
      this.editMnemonics.getOld = null;
      this.editMnemonics.isFormatting = false;
      this.editMnemonics.isRenameTable = false;
      this.editMnemonics.isRenameTitle = false;
      this.editMnemonics.renameTable = "";
      this.editMnemonics.renameTitle = "";
      this.editMnemonics.selectedTable = null;
      this.editMnemonics.selectedInsertAction = "mnemonic";
      this.editMnemonics.anagramInputInvalid = false;
      this.editMnemonics.isInit = true;
      this.editMnemonics.isBeginEdit = true;
      this.editMnemonics.numberEntries = null;
      this.peglist = ["Tea", "New", "Me", "Ear", "Owl", "Gay", "Cow", "UFO", "Bee", "Dash", "Dead", "Tuna", "Atom", "Deer",
         "Tale", "Dog", "Duke", "TV", "Tuba", "NASA", "Ant", "Noon", "Enemy", "Honor", "Noel", "Wing", "Ink", "Navy", "Newbie",
         "Mouse", "Myth", "Moon", "Memo", "Humor", "Email", "Image", "Macho", "Movie", "Amoeba", "Horse", "Rat", "Rain", "Arm",
         "Arrow", "Rail", "Rage", "Rich", "Review", "Robe", "Loose", "Old", "Lion", "Lama", "Liar", "Hello", "Leg", "Lake", "Wolf",
         "Loop", "Goose", "Goat", "Gun", "Game", "Gray", "Galaxy", "Egg", "Joke", "Goofy", "Jeep", "Cheese", "Cat", "Knee",
         "Coma", "Car", "Cola", "Cage", "Cake", "Cafe", "Chip", "Fish", "Fat", "Fun", "Fame", "Fairy", "Fly", "Fog", "Fake", "FIFO",
         "FBI", "Bus", "Bat", "PIN", "Beam", "Bear", "Pool", "Pig", "Bike", "Beef", "Babe", "Disease", "Test", "Disney", "Autism",
         "Tzar", "Diesel", "White sage", "Disc", "Satisfy", "Hat shop", "Odds", "Daddy", "Titan", "Stadium", "Dexter", "Total",
         "Hot dog", "Attic", "HDTV", "HTTP", "Adonis", "Stunt", "Estonian", "Autonomy", "Diner", "Denial", "Stone Age",
         "Dance", "TNF", "Danube", "Times", "Time-out", "Domine", "Dummy", "Tumor", "HTML", "Damage", "Stomach", "TMV", "Thumb",
         "Tears", "Druid", "Darwin", "Storm", "Adorer", "Australia", "Storage", "Dark", "Dwarf", "Trophy", "Atlas", "Athlete",
         "Italian", "Soda lime", "Hitler", "Dolly", "Dialogue", "Italic", "Tea leaf", "Toolbox", "Doghouse", "Widget",
         "Shotgun", "Dogma", "Tiger", "Stagily", "Hedgehog", "Dog hook", "Deja vu", "Doughboy", "Steakhouse", "Woodcut", "Technique",
         "Sitcom", "Teacher", "Stokehole", "The Cage", "Duck", "Deceive", "Teacup", "TV show", "DVD", "Divine", "The Fame",
         "Stover", "Devil", "Defog", "Device", "Day off", "The F.B.I.", "Oedipus", "Tibet", "Headphone", "Tie beam", "Sidebar",
         "Duplex", "Debug", "Topic", "Top-heavy", "Tippy", "News show"];
      this.editMnemonics.isShowLineBreakOption = true;
      this.editMnemonics.isShowInsertOptions = false;
      this.editMnemonics.isDeleteTable = false;
      this.editMnemonics.isInsertTable = false;
      this.editMnemonics.isNewTable = false;
      this.editMnemonics.isLineBreaks = false;
      this.editMnemonics.tables = [];
      this.editMnemonics.titles = [];
      this.editMnemonics.mnemonics = [];

      var val = await this.storage.get('EDIT_MNEMONICS_SELECTED_TABLE');
      if (val != null) {
         this.editMnemonics.selectedTable = JSON.parse(val);
         console.log("GOT SAVED TABLE=" + JSON.stringify(this.editMnemonics.selectedTable));
      }
      val = await this.storage.get('EDIT_MNEMONICS_IS_NEW_TABLE');
      if (val != null) {
         this.editMnemonics.isNewTable = val;
      }
      val = await this.storage.get('EDIT_MNEMONICS_INPUT_TABLE');
      if (val != null) {
         this.editMnemonics.inputTable = val;
      }
      val = await this.storage.get('EDIT_MNEMONICS_INPUT_TITLE');
      if (val != null) {
         this.editMnemonics.inputTitle = val;
      }
      val = await this.storage.get('EDIT_MNEMONICS_SELECTED_ACTION');
      if (val != null) {
         this.editMnemonics.selectedAction = val;
      }
      val = await this.storage.get('EDIT_MNEMONICS_SELECTED_INSERT_ACTION');
      if (val != null) {
         this.editMnemonics.selectedInsertAction = val;
      }
      val = await this.storage.get('EDIT_MNEMONICS_LINE_BREAKS');
      if (val != null) {
         this.editMnemonics.isLineBreaks = val;
      }
      if (this.editMnemonics.selectedInsertAction === "number_major" || this.editMnemonics.selectedInsertAction === "number_letters" || this.editMnemonics.selectedInsertAction === "mnemonic") {
         val = await this.storage.get('EDIT_MNEMONICS_INPUT_NUMBER');
         if (val != null) {
            this.editMnemonics.inputNumber = val;
         }
         val = await this.storage.get('EDIT_MNEMONICS_INPUT_NUMBER_POWER');
         if (val != null) {
            var indexPower = this.editMnemonics.numberPowers.map((pwr: any) => { return pwr.value }).indexOf(val);
            if (indexPower >= 0) {
               this.editMnemonics.inputNumberPower = this.editMnemonics.numberPowers[indexPower];
            }
         }
      }
      this.background_color = Helpers.background_color;
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;
      this.editMnemonics.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
         this.background_color = bgColor;
      });
      this.editMnemonics.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
      });
      this.getTables(false).then(() => {
         console.log("GET TABLES RESOLVED.");
         this.helpers.dismissProgress();
      });
   }

   ionViewWillLeave() {
      console.log('ionViewWillLeave EditMnemonicsPage');
      this.editMnemonics.subscribedBackgroundColorEvent.unsubscribe();
      this.editMnemonics.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   async saveStorage() {
      console.log("saveStorage called");
      console.log("SAVING TABLE=" + JSON.stringify(this.editMnemonics.selectedTable));
      console.log("SAVING INSERT_ACTION=" + this.editMnemonics.selectedInsertAction);
      console.log("SAVING LINE_BREAKS=" + this.editMnemonics.isLineBreaks);
      await this.storage.set('EDIT_MNEMONICS_SELECTED_TABLE', JSON.stringify(this.editMnemonics.selectedTable));
      await this.storage.set('EDIT_MNEMONICS_SELECTED_ACTION', this.editMnemonics.selectedAction);
      await this.storage.set('EDIT_MNEMONICS_SELECTED_TITLE', JSON.stringify(this.editMnemonics.selectedTitle));
      await this.storage.set('EDIT_MNEMONICS_SELECTED_INSERT_ACTION', this.editMnemonics.selectedInsertAction);
      await this.storage.set('EDIT_MNEMONICS_LINE_BREAKS', this.editMnemonics.isLineBreaks);
      await this.storage.set('EDIT_MNEMONICS_IS_NEW_TABLE', this.editMnemonics.isNewTable);
      await this.storage.set('EDIT_MNEMONICS_INPUT_TABLE', this.editMnemonics.inputTable);
      await this.storage.set('EDIT_MNEMONICS_INPUT_TITLE', this.editMnemonics.inputTitle);
      if (this.editMnemonics.selectedInsertAction === "number_major" || this.editMnemonics.selectedInsertAction === "number_letters" || this.editMnemonics.selectedInsertAction === "mnemonic") {
         await this.storage.set('EDIT_MNEMONICS_INPUT_NUMBER', this.editMnemonics.inputNumber);
         await this.storage.set('EDIT_MNEMONICS_INPUT_NUMBER_POWER', this.editMnemonics.inputNumberPower.value);
      }
      if ((this.editMnemonics.selectedAction === "UPDATE" || this.editMnemonics.selectedAction === "INSERT") && this.editMnemonics.isBeginEdit === false) {
         console.log("SAVING IS_BEGIN_EDIT=" + this.editMnemonics.isBeginEdit);
         console.log("SAVING NUMBER_ENTRIES=" + this.editMnemonics.numberEntries);
         await this.storage.set('EDIT_MNEMONICS_IS_BEGIN_EDIT', this.editMnemonics.isBeginEdit);
         await this.storage.set('EDIT_MNEMONICS_NUMBER_ENTRIES', this.editMnemonics.mnemonics.length);
         this.saveAnagramInput().then(() => {
            this.saveMnemonicInputs(0);
         });
      }
   }

   saveAnagramInput(): Promise<void> {
      return new Promise((resolve, reject) => {
         if (this.editMnemonics.selectedInsertAction === "anagram") {
            this.storage.set("EDIT_MNEMONICS_ANAGRAM_INPUT", this.editMnemonics.anagramInput).then(() => {
               console.log("SAVING ANAGRAM_INPUT=" + this.editMnemonics.anagramInput);
               resolve();
            });
         } else {
            resolve();
         }
      });
   }

   saveMnemonicInputs(index:number) {
      if (index < this.editMnemonics.mnemonics.length) {
         this.storage.set('EDIT_MNEMONICS_MNEMONICS_' + index + "_MNEMONIC", this.editMnemonics.mnemonics[index].Entry_Mnemonic).then(() => {
            this.storage.set('EDIT_MNEMONICS_MNEMONICS_' + index + "_WORD", this.editMnemonics.mnemonics[index].Entry).then(() => {
               this.storage.set('EDIT_MNEMONICS_MNEMONICS_' + index + "_INFO", this.editMnemonics.mnemonics[index].Entry_Info).then(() => {
                  index++;
                  this.saveMnemonicInputs(index);
               });
            });
         });
      }
   }


   doAction() {
      console.log("doAction called this.editMnemonics.selectedAction=" + this.editMnemonics.selectedAction);
      this.editMnemonics.results = "";
      this.reset();
      if (this.editMnemonics.selectedAction === "UPDATE") {
         this.editMnemonics.isShowLineBreakOption = true;
         this.editMnemonics.isShowInsertOptions = false;
         this.editMnemonics.isDeleteTable = false;
         this.editMnemonics.isInsertTable = false;
      } else if (this.editMnemonics.selectedAction === "DELETE") {
         this.editMnemonics.isShowLineBreakOption = false;
         this.editMnemonics.isShowInsertOptions = false;
         this.editMnemonics.isDeleteTable = false;
         this.editMnemonics.isInsertTable = false;
      } else if (this.editMnemonics.selectedAction === "INSERT") {
         this.editMnemonics.isShowLineBreakOption = true;
         this.editMnemonics.isShowInsertOptions = true;
         this.editMnemonics.isDeleteTable = false;
         this.editMnemonics.isInsertTable = false;
      } else if (this.editMnemonics.selectedAction === "DELETE_TABLE") {
         this.editMnemonics.isShowLineBreakOption = false;
         this.editMnemonics.isShowInsertOptions = false;
         this.editMnemonics.isDeleteTable = true;
         this.editMnemonics.isInsertTable = false;
      } else if (this.editMnemonics.selectedAction === "INSERT_TABLE") {
         this.editMnemonics.isShowLineBreakOption = false;
         this.editMnemonics.isShowInsertOptions = false;
         this.editMnemonics.isInsertTable = true;
      } else if (this.editMnemonics.selectedAction === "RENAME") {
         this.editMnemonics.isShowLineBreakOption = false;
         this.editMnemonics.isShowInsertOptions = false;
         this.editMnemonics.isDeleteTable = false;
         this.editMnemonics.isInsertTable = false;
      }
   }

   beginEdit() {
      console.log("beginEdit called.");
      this.editMnemonics.results = "";
      //this.reset();
      if (this.editMnemonics.selectedAction === "UPDATE") {
         this.getEntry();
      }
      else if (this.editMnemonics.selectedAction === "INSERT") {
         this.startInsert();
      }
   }


   getTables(isDoingProgress:boolean): Promise<void> {
      console.log("getTables called.");
      return new Promise((resolve, reject) => {
         this.helpers.setProgress("Loading tables ,please wait...", isDoingProgress).then(() => {
            this.helpers.getMnemonicsTables(true).then(async (tables: any) => {
               console.log("getTables getMnemonicsTables RESOLVED");
               if (tables !== false) {
                  this.editMnemonics.tables = tables;
               }
               await this.finishGetTables();
               this.getTitles(true).then(() => {
                  resolve();
               });
            });
         });
      });
   }

   finishGetTables(): Promise<void> {
      console.log("finishGetTables called");
      return new Promise((resolve, reject) => {
         var showName = "No-User";
         this.editMnemonics.tables.forEach((tbl:any) => {
            showName = tbl.Username ? tbl.Username : "No-User";
            //tbl.showOption = (this.editMnemonics.usernamePadding.slice(0, maxUsernameLength - tbl.Username.length).join("") + showName + " -- " + tbl.Category)
            tbl.showOption = tbl.Category + " <<i>" + showName + "</i>>";
            //tbl.tableOption = tbl.Category;
         });

         if (this.editMnemonics.isInit === true) {
            //this.editMnemonics.isInit === false;            
            if (this.editMnemonics.selectedTable == null) {
               console.log("finishGetTables this.editMnemonics.isInit TRUE selectedTable NULL, SET TO FIRST...");
               this.editMnemonics.selectedTable = this.editMnemonics.tables[0];
            } else {
               var tableIndex = this.editMnemonics.tables.map((table:any) => { return table.Category; }).indexOf(this.editMnemonics.selectedTable.Category);
               console.log("finishGetTables FOUND selectedTable tables Index=" + tableIndex);
               if (tableIndex >= 0) {
                  this.editMnemonics.selectedTable = this.editMnemonics.tables[tableIndex];
                  console.log("finishGetTables FOUND selectedTable = " + JSON.stringify(this.editMnemonics.selectedTable));
               }
            }
         }
         resolve();
      });
   }

   doGetTitles(isDoingProgress:boolean) {
      //this.editMnemonics.selectedTable = table;
      console.log('doGetTitles called.');
      this.getTitles(false).then(() => {
         console.log("getTitles RESOLVED");
         this.helpers.dismissProgress();
      });
   }

   getTitles(isDoingProgress:boolean): Promise<void> {
      console.log('getTitles called.');
      return new Promise((resolve, reject) => {
         this.helpers.setProgress("Loading titles ,please wait...", isDoingProgress).then(() => {
            this.editMnemonics.titles = [];
            this.helpers.getMnemonicsTitles(this.editMnemonics.selectedTable.Category).then((titles) => {
               if (titles !== false) {
                  this.editMnemonics.titles = titles;
                  var maxUsernameLength = Math.max(...(this.editMnemonics.titles.map((tit: any) => (tit.Username || "No-User").length)));
                  var showName = "No-User";
                  this.editMnemonics.titles.forEach((tit:any) => {
                     //imgTxt = tle.Username === Helpers.User.Username? "" : rqImg;
                     //tle.titleOption = imgTxt + " -- " + tle.Title;
                     tit.titleOption = tit.Title;
                     showName = tit.Username ? tit.Username : "No-User";
                     //tit.showOption = this.editMnemonics.usernamePadding.slice(0, maxUsernameLength - showName.length).join("") + showName + " -- " + tit.Title
                     tit.showOption = tit.Title + " -- " + tit.Mnemonic_Type + " <<i>" + showName + "</i>>";
                  });
               }
               //DO THIS HERE!: MUST DO IT AFTER GETTING TITLES AND SAVED TITLE: 
               if (this.editMnemonics.isInit === true) {
                  this.editMnemonics.isInit = false;
                  this.storage.get('EDIT_MNEMONICS_SELECTED_TITLE').then((val) => {
                     if (val != null) {
                        this.editMnemonics.selectedTitle = JSON.parse(val);
                        var selectedTitleIndex = this.editMnemonics.titles.map((tit: any) => { return tit.Mnemonic_ID; }).indexOf(this.editMnemonics.selectedTitle.Mnemonic_ID);
                        console.log("GOT selectedTitleIndex = " + selectedTitleIndex);
                        if (selectedTitleIndex >= 0) {
                           this.editMnemonics.selectedTitle = this.editMnemonics.titles[selectedTitleIndex];
                           console.log("GOT SAVED PREFS this.editMnemonics.selectedTitle=" + JSON.stringify(this.editMnemonics.selectedTitle));
                        }
                     } else {
                        this.editMnemonics.selectedTitle = this.editMnemonics.titles[0];
                     }
                     this.storage.get('EDIT_MNEMONICS_IS_BEGIN_EDIT').then((val) => {
                        if (val != null) {
                           this.editMnemonics.isBeginEdit = val;
                           console.log("FROM SAVVED PREFS, SET isBeginEdit=" + this.editMnemonics.isBeginEdit);
                        }
                        if ((this.editMnemonics.selectedAction === "UPDATE" || this.editMnemonics.selectedAction === "INSERT") && this.editMnemonics.isBeginEdit === false) {
                           console.log("NEXT WILL BEGIN UPDATE/INSERT(START INSERT)....");
                           this.storage.get('EDIT_MNEMONICS_NUMBER_ENTRIES').then((val) => {
                              if (val != null) {
                                 this.editMnemonics.numberEntries = val;
                                 console.log("NUMBER OF ENTRIES FROM SAVED PREFERENCES.=" + this.editMnemonics.numberEntries);
                              }
                              //INITIALIZE MNEMONICS:
                              this.editMnemonics.mnemonics = [];
                              for (var i = 0; i < this.editMnemonics.numberEntries; i++) {
                                 this.editMnemonics.mnemonics.push({});
                              }
                              //------------------------
                              this.setSavedAnagramInput().then(() => {
                                 this.setSavedMnemonic(0, () => {
                                    this.setPrompts();
                                    this.editMnemonics.isBeginEdit = false;
                                    if (this.editMnemonics.selectedInsertAction === "number_major" || this.editMnemonics.selectedInsertAction === "number_letters" || this.editMnemonics.selectedInsertAction === "mnemonic") {
                                       this.getTotalSummaryPrompt();
                                       resolve();
                                    } else {
                                       resolve();
                                    }
                                 });
                              });
                           });
                        } else {
                           resolve();
                        }
                     });
                  });
               } else {//IF NOT this.editMnemonics.isInit true                    
                  this.editMnemonics.totalNumber = "";
                  this.editMnemonics.mnemonics = [];
                  this.editMnemonics.isBeginEdit = true;
                  this.editMnemonics.numberEntries = null;
                  if (this.editMnemonics.titles.length > 0) {
                     this.editMnemonics.selectedTitle = this.editMnemonics.titles[0];
                  }
                  resolve();
               }
            });
         });
      });
   }


   setSavedAnagramInput(): Promise<Boolean> {
      console.log("setAnagramInput called");
      return new Promise((resolve, reject) => {
         if (this.editMnemonics.selectedInsertAction === "anagram") {
            this.storage.get("EDIT_MNEMONICS_ANAGRAM_INPUT").then((val) => {
               if (val != null) {
                  this.editMnemonics.anagramInput = val;
               }
               resolve(true);
            });
         } else {
            resolve(true);
         }
      });
   }

   setSavedMnemonic(index:number, callback:Function) {
      console.log("setSavedMnemonic called, this.editMnemonics.mnemonics.length=" + this.editMnemonics.mnemonics.length);
      if (index < this.editMnemonics.mnemonics.length) {
         this.storage.get('EDIT_MNEMONICS_MNEMONICS_' + index + "_MNEMONIC").then((val) => {
            if (val != null) {
               this.editMnemonics.mnemonics[index].Entry_Mnemonic = val;
            }
            this.storage.get('EDIT_MNEMONICS_MNEMONICS_' + index + "_WORD").then((val) => {
               if (val != null) {
                  this.editMnemonics.mnemonics[index].Entry = val;
               }
               this.storage.get('EDIT_MNEMONICS_MNEMONICS_' + index + "_INFO").then((val) => {
                  if (val != null) {
                     this.editMnemonics.mnemonics[index].Entry_Info = val;
                  }
                  index++;
                  this.setSavedMnemonic(index, callback);
               });
            });
         });
      } else {
         callback();
      }
   }

   startInsert() {
      console.log("startInsert called. this.editMnemonics.selecedInsertAction=" + this.editMnemonics.selectedInsertAction + ", this.editMnemonics.numberEntries=" + this.editMnemonics.numberEntries);
      console.log("reset called");
      this.editMnemonics.results = "";
      this.editMnemonics.totalNumber = "";
      var isInputError = false;
      var inputError = "";
      if (this.editMnemonics.numberEntries == null || String(this.editMnemonics.numberEntries).trim() === '' || this.editMnemonics.numberEntries === 0) {
         inputError = "NEED TO ENTER: '# Entries'<br />";
         isInputError = true;
      }
      else if (String(this.editMnemonics.inputTitle).trim() === "") {
         inputError = "NEED TO ENTER: 'Title'";
         isInputError = true;
      }
      else if (this.editMnemonics.selectedInsertAction == null) {
         inputError = "NEED TO SELECT which kind of mnemonics";
         isInputError = true;
      }
      if (isInputError === true) {
         this.helpers.myAlert("Alert", "<b>" + inputError + "</b>", "", "Dismiss");
         return;
      }
      this.editMnemonics.mnemonics = [];
      for (var i = 0; i < this.editMnemonics.numberEntries; i++) {
         this.editMnemonics.mnemonics.push({});
      }
      // BEGIN
      this.setPrompts();
      this.editMnemonics.isBeginEdit = false;
   }


   getEntry() {
      console.log("getEntry called!");
      this.editMnemonics.results = "";
      this.editMnemonics.totalNumber = "";
      if (this.editMnemonics.selectedTable == null) {
         this.helpers.myAlert("Alert", "<b>No table selected</b>", "", "Dismiss");
         return;
      } else if (this.editMnemonics.selectedTitle == null) {
         this.helpers.myAlert("Alert", "<b>No title selected</b>", "", "Dismiss");
         return;
      }
      this.helpers.setProgress("Getting entry ,please wait...", false).then(() => {
         if (Helpers.isWorkOffline === false) {
            var params = {
               "table": this.editMnemonics.selectedTable.Category,
               "user_id": this.editMnemonics.selectedTitle.User_ID,
               "mnemonic_type_id": this.editMnemonics.selectedTitle.Mnemonic_Type_ID,
               "title": this.editMnemonics.selectedTitle.Title
            };
            this.helpers.makeHttpRequest("/lfq_directory/php/edit_mnemonics_get_entry.php", "GET", params).then((data) => {
               if (data["SUCCESS"] === true) {
                  this.finishGetEntry(data["ENTRIES"]);
                  this.helpers.dismissProgress();
               } else {
                  this.helpers.dismissProgress();
                  this.helpers.alertLfqError(data["ERROR"]);
               }
            }, (error) => {
               console.log("ERROR:" + error.message);
               this.editMnemonics.results = "Sorry. Error getting entry.";
               this.helpers.dismissProgress();
            });
         } else {//OFFLINE GET ENTRY:
            var cat_sel = this.editMnemonics.selectedTable.Category;

            var sql = "SELECT m.*,mt.Name AS Mnemonic_Type, me.*,mc.Name AS Category FROM " + Helpers.TABLES_MISC.mnemonic + " AS m ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.mnemonic_type + " AS mT ON mt.ID=m.Mnemonic_Type_ID ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.mnemonic_entry + " AS me ON me.Mnemonic_ID=m.ID ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.mnemonic_category + " AS mc ON mc.Name=? ";
            sql += "WHERE m.User_ID=? AND m.Mnemonic_Type_ID=? AND m.Title=? ORDER BY me.Entry_Index";

            this.helpers.query(this.database_misc, sql, [cat_sel, this.editMnemonics.selectedTitle.User_ID, this.editMnemonics.selectedTitle.Mnemonic_Type_ID, this.editMnemonics.selectedTitle.Title]).then((data) => {
               var entries = [];
               for (var i = 0; i < data.rows.length; i++) {
                  entries.push(data.rows.item(i));
               }
               this.finishGetEntry(entries);
               this.helpers.dismissProgress();
            }).catch((error) => {
               console.log("sql:" + sql + ", ERROR:" + error.message);
               this.editMnemonics.results = "Sorry. Error getting entry.";
               this.helpers.dismissProgress();
            });
         }
      });
   }

   finishGetEntry(entries:any) {
      console.log("finishGetEntry called, entries = " + JSON.stringify(entries));
      if (entries.length > 0) {
         this.editMnemonics.getOld = [];
         entries.forEach((ent: any) => { this.editMnemonics.getOld.push(Object.assign({}, ent)); });
         console.log("finishGetEntry called this.editMnemonics.getOld = " + JSON.stringify(this.editMnemonics.getOld));
         for (var prop in entries[0]) {
            console.log(prop + "=" + entries[0][prop]);
         }
         // 0=TITLE, 1=TYPE, 2=LINEBREAK, 3=MNEMONICS,4=WORDS, 5=INFO
         console.log("num_entries=" + entries.length);
         //SET ANAGRAM INPUT:----------------------------------------------
         console.log("entries[0].Mnemonic_Type = " + entries[0].Mnemonic_Type);
         if (entries[0].Mnemonic_Type === "anagram") {
            console.log("IS ANAGRAM! entries[0].Entry_Mnemonic = " + entries[0].Entry_Mnemonic);
            this.editMnemonics.anagramInput = entries[0].Entry_Mnemonic;
         }
         //SET MNEMONIC TYPE(selectedInsertAction)--------------------------------
         this.editMnemonics.selectedInsertAction = this.editMnemonics.selectedTitle.Mnemonic_Type;
         console.log("getEntry: SET this.editMnemonics.selectedInsertAction(data.rows.item(0).Mnemonic_Type)=" + this.editMnemonics.selectedInsertAction);
         var type = this.editMnemonics.selectedInsertAction;

         if (type === "number_major" || type === "number_letters") {
            console.log("Mnemonic_Type IS number_major/number_letters");
            if (entries[0].Number != null) {
               this.editMnemonics.inputNumber = entries[0].Number;
            }
            console.log("finishGetEntry entries[0].Number_Power = " + entries[0].Number_Power);
            if (entries[0].Number_Power != null) {
               var indexNumberPower = this.editMnemonics.numberPowers.map((np:any) => { return parseInt(np.value); }).indexOf(parseInt(entries[0].Number_Power));
               console.log("GOT indexNumberPower = " + indexNumberPower);
               this.editMnemonics.inputNumberPower = this.editMnemonics.numberPowers[indexNumberPower];
            }
         }

         //SET LINEBREAK------------------------------------------------------
         var linebreak = String(entries[0].Is_Linebreak);
         if (linebreak === "1") {
            this.editMnemonics.isLineBreaks = true;
         } else {
            this.editMnemonics.isLineBreaks = false;
         }
         this.editMnemonics.saveIsLineBreaks = linebreak;
         //SET PROMPTS------------------------------------------------------
         this.setPrompts();
         //SET MNEMONICS-----------------------------------------------------
         this.editMnemonics.mnemonics = [];
         var mnemonic, type;
         for (var i = 0; i < entries.length; i++) {
            mnemonic = entries[i];
            mnemonic.isInvalidWord = false;
            mnemonic.isInvalidMnemonic = false;
            type = Mnemonic_Type_ID[entries[i].Mnemonic_Type_ID];
            if (type !== "anagram") {
               mnemonic.Entry_Mnemonic = entries[i].Entry_Mnemonic;
               console.log("mnemonic.Entry_Mnemonic = " + mnemonic.Entry_Mnemonic)
            } else {
               delete mnemonic.Entry_Mnemonic;
            }
            this.editMnemonics.mnemonics.push(mnemonic);
         }
         //SET BEGINNING ACTION:------------------------------------------------------
         this.editMnemonics.isBeginEdit = false;
         //SET INPUT SUMMARY------------------------------------------------------
         type = Mnemonic_Type_ID[entries[0].Mnemonic_Type_ID];
         this.editMnemonics.selectedInsertAction = type;
         console.log("finishGetEntry type=" + type);
         if (type === 'number_major' || type === 'number_letters' || type === 'mnemonic') {
            this.getTotalSummaryPrompt();
         }
      }
   }

   async editMnemonic() {
      console.log('editMnemonic called. this.editMnemonics.selectedAction=' + this.editMnemonics.selectedAction);
      this.editMnemonics.results = "";
      if (this.editMnemonics.selectedAction === "UPDATE" || this.editMnemonics.selectedAction === "INSERT") {
         if (this.formatVerifyNoPromise(true) === false) {
            return;
         }
      }
      console.log("VERIFIED! DOING EDIT!!!");
      if (this.editMnemonics.selectedAction === "UPDATE") {
         this.updateMnemonic();
      } else if (this.editMnemonics.selectedAction === "INSERT") {
         this.insertMnemonic();
      } else if (this.editMnemonics.selectedAction === "DELETE") {
         let alert = await this.alertCtrl.create({
            header: "Delete Mnemonic",
            subHeader: "Are you sure you want to delete mnemonic:<br /><b>" + this.editMnemonics.selectedTitle.Title + "</b>?",
            buttons: [
               {
                  text: 'Cancel',
                  cssClass: 'cancelButton',
                  handler: () => {
                     console.log('Cancel delete mnemonic clicked');
                     return true;
                  }
               },
               {
                  text: 'Confirm',
                  cssClass: 'confirmButton',
                  handler: () => {
                     console.log('Confirm delete mnemonic clicked');
                     this.deleteMnemonic();
                     return true;
                  }
               }
            ]
         });
         await alert.present();
      } else if (this.editMnemonics.selectedAction === "DELETE_TABLE") {
         let alert = await this.alertCtrl.create({
            header: "Delete Mnemonic Table",
            subHeader: "Are you sure you want to delete mnemonic table:<br /><b>" + this.editMnemonics.selectedTable.Category + "</b>?",
            buttons: [
               {
                  text: 'Cancel',
                  cssClass: 'cancelButton',
                  handler: () => {
                     console.log('Cancel delete mnemonic table clicked');
                     return true;
                  }
               },
               {
                  text: 'Confirm',
                  cssClass: 'confirmButton',
                  handler: () => {
                     console.log('Confirm delete mnemonic table clicked');
                     this.deleteTable();
                     return true;
                  }
               }
            ]
         });
         await alert.present();
      } else if (this.editMnemonics.selectedAction === "RENAME") {
         if ((this.editMnemonics.isRenameTable === false && this.editMnemonics.isRenameTitle === false) || this.editMnemonics.selectedTable == null || this.editMnemonics.selectedTitle == null) {
            this.helpers.myAlert("Alert", "<b>Need to check that old and new table or title names are selected to rename.</b>", "", "Dismiss");
            return;
         }
         if (this.editMnemonics.isRenameTable === true && (!this.editMnemonics.renameTable || this.editMnemonics.renameTable.trim() === '')) {
            this.helpers.myAlert("Alert", "<b>Need to enter the new table name.</b>", "", "Dismiss");
            return;
         }
         if (this.editMnemonics.isRenameTitle === true && (!this.editMnemonics.renameTitle || this.editMnemonics.renameTitle.trim() === '')) {
            this.helpers.myAlert("Alert", "<b>Need to enter the new title name.</b>", "", "Dismiss");
            return;
         }
         if (!this.editMnemonics.getOld || this.editMnemonics.getOld.length === 0) {
            this.helpers.myAlert("Alert", "", "Please load the mnemonic first before deleting.", "Ok");
            return;
         }
         var subtitle = "";
         if (this.editMnemonics.isRenameTable === true) {
            subtitle += "<br />Rename mnemonic table " + this.editMnemonics.selectedTable.Category + " to " + this.editMnemonics.renameTable + ".";
         }
         if (this.editMnemonics.isRenameTitle === true) {
            subtitle += "<br />Rename mnemonic title " + this.editMnemonics.selectedTitle.Title + " to " + this.editMnemonics.renameTitle + ".";
         }
         let alert = await this.alertCtrl.create({
            header: "Rename Table",
            subHeader: "Are you sure you want to:" + subtitle + "</b>?",
            buttons: [
               {
                  text: 'Cancel',
                  cssClass: 'cancelPopupButton',
                  handler: () => {
                     console.log('Cancel rename mnemonic table clicked');
                     return true;
                  }
               },
               {
                  text: 'Confirm',
                  cssClass: 'confirmPopupButton1',
                  handler: () => {
                     console.log('Confirm rename mnemonic table clicked');
                     this.renameMnemonic();
                     return true;
                  }
               }
            ]
         });
         await alert.present();
      }
   }
   updateMnemonic() {
      console.log("updateNumber called");
      if (!this.editMnemonics.getOld || this.editMnemonics.getOld.length === 0) {
         this.helpers.myAlert("Alert", "", "Please load the mnemonic first before deleting.", "Ok");
         return;
      } else {
         this.helpers.setProgress("Updating mnemonic ,please wait...", false).then(() => {
            var cvWhere: any = {};
            //TYPES= mnemonic, number_major, number_letters, anagram, peglist
            //ORDER OF THIS IS IMPORTANT TO GET Helpers.getUniqueString() : 
            console.log("this.editMnemonics.getOld = " + JSON.stringify(this.editMnemonics.getOld) + " selectedTable = " + JSON.stringify(this.editMnemonics.selectedTable));
            var mnemonicTypeID = Mnemonic_Type_ID[this.editMnemonics.selectedInsertAction];
            cvWhere.User_ID = this.editMnemonics.getOld[0].User_ID;
            cvWhere.Mnemonic_Type_ID = mnemonicTypeID;
            cvWhere.Mnemonic_Category_ID = this.editMnemonics.selectedTable.ID;
            cvWhere.Title = this.editMnemonics.selectedTitle.Title;
            cvWhere.Is_Linebreak = String(this.editMnemonics.selectedTitle.Is_Linebreak);
            //FOR SETTING THE WHERE CLAUSE FOR THE DELETE STATEMENT:---------
            var linebreak = this.editMnemonics.isLineBreaks === true ? "1" : "0";
            var colsUpd = ["Mnemonic_Type_ID", "Mnemonic_Category_ID", "Title", "Is_Linebreak"];
            var valsUpd = [mnemonicTypeID, this.editMnemonics.selectedTable.ID, this.editMnemonics.selectedTitle.Title, linebreak];
            if (this.editMnemonics.selectedInsertAction === "number_major" || this.editMnemonics.selectedInsertAction === "number_letters") {
               colsUpd = colsUpd.concat(["Number", "Number_Power"]);
               valsUpd = valsUpd.concat([this.editMnemonics.inputNumber, this.editMnemonics.inputNumberPower.value]);
            }
            //-------------------------------------------------------------
            var cols = ["Mnemonic_ID", "Entry_Index", "Entry", "Entry_Mnemonic", "Entry_Info"];
            var vals = [], Entry_Mnemonic: string = "";
            var entriesOld:any = { "Mnemonic_Type": Mnemonic_Type_ID[this.editMnemonics.getOld[0].Mnemonic_Type_ID], "Category": this.editMnemonics.getOld[0].Category, "Title": this.editMnemonics.getOld[0].Title, "Is_Linebreak": this.editMnemonics.getOld[0].Is_Linebreak };
            var entriesNew:any = { "Mnemonic_Type": this.editMnemonics.selectedInsertAction, "Category": this.editMnemonics.selectedTable.Category, "Title": this.editMnemonics.selectedTitle.Title, "Is_Linebreak": linebreak };
            if (this.editMnemonics.selectedInsertAction === "number_major" || this.editMnemonics.selectedInsertAction === "number_letters") {
               entriesOld["Number"] = this.editMnemonics.getOld[0].Number;
               entriesOld["Number_Power"] = this.editMnemonics.getOld[0].Number_Power;
               entriesNew["Number"] = this.editMnemonics.inputNumber;
               entriesNew["Number_Power"] = this.editMnemonics.inputNumberPower.value;
            }
            if (this.editMnemonics.selectedInsertAction === 'anagram') {
               entriesOld["Anagram"] = this.editMnemonics.getOld[0].Entry_Mnemonic;
               entriesNew["Anagram"] = this.editMnemonics.anagramInput;
            }
            var compareFields = ["Entry", "Entry_Mnemonic", "Entry_Info"];
            for (var i = 0; i < this.editMnemonics.mnemonics.length; i++) {
               if (this.editMnemonics.selectedInsertAction === 'anagram') {
                  Entry_Mnemonic = this.editMnemonics.anagramInput;
               } else {
                  Entry_Mnemonic = this.editMnemonics.mnemonics[i].Entry_Mnemonic;
               }
               vals.push(
                  [this.editMnemonics.selectedTitle.Mnemonic_ID, (i + 1), this.editMnemonics.mnemonics[i].Entry, Entry_Mnemonic, this.editMnemonics.mnemonics[i].Entry_Info]
               );
               entriesNew[String((i + 1))] = {};
               entriesOld[String((i + 1))] = {};
               for (var c = 0; c < compareFields.length; c++) {
                  if (this.editMnemonics.getOld && this.editMnemonics.getOld[i] && this.editMnemonics.getOld[i][compareFields[c]] && (compareFields[c] !== "Entry_Mnemonic" || this.editMnemonics.getOld[i].Mnemonic_Type !== 'anagram')) {
                     entriesOld[String((i + 1))][compareFields[c]] = this.editMnemonics.getOld[i][compareFields[c]];
                  }
                  if (this.editMnemonics.mnemonics[i][compareFields[c]] && (compareFields[c] !== "Entry_Mnemonic" || Mnemonic_Type_ID[this.editMnemonics.mnemonics[i].Mnemonic_Type_ID] !== 'anagram')) {
                     entriesNew[String((i + 1))][compareFields[c]] = this.editMnemonics.mnemonics[i][compareFields[c]];
                  }
               }
            }
            var wheresDeleteGetID = {"Title": cvWhere.Title, "Mnemonic_Type_ID": cvWhere.Mnemonic_Type_ID, "Mnemonic_Category_ID":cvWhere.Mnemonic_Category_ID, "Is_Linebreak":cvWhere.Is_Linebreak};
            //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
            var queries = [
               new SyncQuery(null, this.editMnemonics.getOld[0].User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic, Op_Type_ID.UPDATE, colsUpd, valsUpd, cvWhere, User_Action_Request.USER_ID_UPDATE),
               new SyncQuery(null, this.editMnemonics.getOld[0].User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic_entry, Op_Type_ID.DELETE_INNER_JOIN, [Helpers.TABLES_MISC.mnemonic], [{"A":"Mnemonic_ID", "B":"ID"}], wheresDeleteGetID),
               new SyncQuery(null, this.editMnemonics.getOld[0].User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic, Op_Type_ID.GET_ID_INSERT_MANY, [], [], wheresDeleteGetID),
               new SyncQuery(null, this.editMnemonics.getOld[0].User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic_entry, Op_Type_ID.INSERT, cols, vals, cvWhere)
            ];            
            //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
            this.helpers.autoSync(queries, Op_Type_ID.UPDATE, this.editMnemonics.getOld[0].User_ID, { "Title": this.editMnemonics.selectedTitle.Title }, entriesOld, entriesNew).then((res) => {
               this.helpers.dismissProgress();
               if (res.isSuccess === true) {
                  this.editMnemonics.results = "UPDATED " + this.editMnemonics.selectedTitle.Title + "." + res.results;
                  this.reset();
                  this.helpers.myAlert("Alert", "", "<b>UPDATED " + this.editMnemonics.selectedTitle.Title + "." + res.results + "</b>", "Dismiss");
               } else {
                  console.log("ERROR:" + res.results);
                  this.editMnemonics.results = "Sorry. Error updating mnemonic.";
                  this.helpers.myAlert("Alert", "", "<b>Sorry. Error updating mnemonic:" + res.results + "</b>", "Dismiss");
               }
            });
         });
      }
   }
   insertMnemonic() {
      console.log("insertMnemonic called.");
      if (!this.editMnemonics.inputTitle || String(this.editMnemonics.inputTitle).trim() === '') {
         this.helpers.myAlert("Alert", "<b>Need to input title</b>", "", "Dismiss");
         return;
      }
      this.helpers.setProgress("Inserting mnemonic ,please wait...", false).then(() => {
         //TYPES= mnemonic, number_major, number_letters, anagram, peglist
         var type = this.editMnemonics.selectedInsertAction;
         var mnemonic_type_id = Mnemonic_Type_ID[type];
         var title = this.editMnemonics.inputTitle;
         var category = "";
         var category_id = "";
         if (this.editMnemonics.isNewTable === false) {
            category = this.editMnemonics.selectedTable.Category;
            category_id = this.editMnemonics.selectedTable.ID;
         } else {
            category = this.editMnemonics.inputTable;
            var categoriesExist = this.editMnemonics.tables.map((tbl: any) => { return tbl.Category; });
            if (categoriesExist.indexOf(category) >= 0) {
               //CATEOGRY ALREADY EXISTS!:
               this.helpers.myAlert("Alert", "<b>Category already exists. Please enter a new category name.</b>", "", "OK");
               return;
            }
         }
         var linebreak = "0";
         if (this.editMnemonics.isLineBreaks === true) {
            linebreak = "1";
         }
         var checkWheres:any = {
            "User_ID": Helpers.User.ID,
            "Mnemonic_Type_ID": mnemonic_type_id,
            "Is_Linebreak": linebreak,
            "Title": title
         }
         if (category_id !== "") {
            checkWheres["Mnemonic_Category_ID"] = category_id;
         }
         this.helpers.insertCheckExists(DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic, checkWheres).then(isExists => {
            if (isExists) {
               this.helpers.dismissProgress();
               this.helpers.myAlert("Alert", "<b>Mnemonic already exists.</b>", "", "OK");
               return;
            }
            var colsIns = ["Mnemonic_Category_ID", "User_ID", "Mnemonic_Type_ID", "Title", "Is_Linebreak"];
            var valsIns = [category_id, Helpers.User.ID, mnemonic_type_id, title, linebreak];
            if (type === "number_major" || type === "number_letters") {
               colsIns = colsIns.concat(["Number", "Number_Power"]);
               valsIns = valsIns.concat([this.editMnemonics.inputNumber, this.editMnemonics.inputNumberPower.value]);
            }
            var cols = ["Mnemonic_ID", "Entry_Index", "Entry", "Entry_Mnemonic", "Entry_Info"];
            var vals = [];
            var Entry_Mnemonic = null;
            for (var i = 0; i < this.editMnemonics.mnemonics.length; i++) {
               Entry_Mnemonic = null;
               if (this.editMnemonics.selectedInsertAction !== "anagram") {
                  Entry_Mnemonic = this.editMnemonics.mnemonics[i].Entry_Mnemonic;
               } else {
                  Entry_Mnemonic = this.editMnemonics.anagramInput;
               }
               //USER -1 AS Mnemonic_ID FOR NOW, BECAUSE DO NOT KNOW IT UNTIL AFTER INSERT:
               vals.push(
                  ['-1', (i + 1), this.editMnemonics.mnemonics[i].Entry, Entry_Mnemonic, this.editMnemonics.mnemonics[i].Entry_Info]
               )
            }
            console.log("BACK FROM INSERT.");
            // SYNC TO LFQ DATABASE:
            var queries = [];
            if (this.editMnemonics.isNewTable === true) {
               var colsInsCat = ["Name"];
               var valsInsCat = [[this.editMnemonics.inputTable]];
               //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
               queries.push(new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic_category, Op_Type_ID.INSERT_TYPES, colsInsCat, valsInsCat, checkWheres))
            }
            console.log("colsIns = " + colsIns + ", valsIns = " + valsIns);
            queries = queries.concat([
               new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic, Op_Type_ID.INSERT_TYPES, colsIns, [valsIns], checkWheres),
               new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic_entry, Op_Type_ID.INSERT, cols, vals, checkWheres)
            ]);
            //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
            this.helpers.autoSync(queries, Op_Type_ID.INSERT, null, null, null, null).then((res) => {
               if (res.isSuccess === true) {
                  this.editMnemonics.results = "INSERTED " + title + ". " + res.results;
                  console.log("INSERT MNEMONIC autosync_text=" + res.results);
                  this.editMnemonics.isNewTable = false;
                  this.reset();
                  this.getTables(true).then(() => {
                     console.log("GET TABLES RESOLVED.");
                     this.helpers.dismissProgress();
                     this.editMnemonics.selectedAction = "UPDATE";
                     this.helpers.myAlert("Alert", "", "<b>" + this.editMnemonics.results + "</b>", "Dismiss");
                  });
               } else {
                  console.log("ERROR:" + res.results);
                  this.editMnemonics.results = "Sorry. Error inserting mnemonic. " + res.results;
                  this.helpers.dismissProgress();
                  this.helpers.myAlert("Alert", "", "<b>" + this.editMnemonics.results + "</b>", "Dismiss");
               }
            });
         });
      });
   }

   deleteMnemonic() {
      console.log("deleteMnemonic called.");
      if (!this.editMnemonics.getOld || this.editMnemonics.getOld.length === 0) {
         this.helpers.myAlert("Alert", "", "Please load the mnemonic first before deleting.", "Ok");
         return;
      }
      this.helpers.setProgress("Deleting mnemonic ,please wait...", false).then(() => {
         var cv: any = {};
         //ORDER OF THIS IS IMPORTANT TO GET Helpers.getUniqueString() : ---------------
         console.log("OFFLINE DELETE MNEMONIC, this.editMnemonics.getOld=" + JSON.stringify(this.editMnemonics.getOld));
         cv.User_ID = this.editMnemonics.getOld[0].User_ID;
         cv.Mnemonic_Type = this.editMnemonics.selectedTitle.Mnemonic_Type;
         //cv.Category = this.editMnemonics.selectedTable.Category;
         cv.Title = this.editMnemonics.selectedTitle.Title;
         cv.Is_Linebreak = String(this.editMnemonics.selectedTitle.Is_Linebreak);
         //--------------------------------------------------------------------
         var wheres = cv;
         var names = { "Category": cv.Category, " Title": cv.Title, "Type": cv.Menmonic_Type };
         var entriesNew = {};
         var entriesOld = cv;
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         var queries = [
            new SyncQuery(null, this.editMnemonics.getOld[0].User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic_entry, Op_Type_ID.DELETE, [], [], { "Mnemonic_ID": this.editMnemonics.selectedTitle.Mnemonic_ID }),
            new SyncQuery(null, this.editMnemonics.getOld[0].User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic, Op_Type_ID.DELETE, [], [], wheres)
         ];
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, Op_Type_ID.DELETE, this.editMnemonics.getOld[0].User_ID, names, entriesOld, entriesNew).then((res) => {
            if (res.isSuccess === true) {
               this.editMnemonics.results = "DELETED from " + this.editMnemonics.selectedTable.Category + ".";
               this.editMnemonics.results = res;
               this.getTables(true).then(() => {
                  console.log("GET TABLES RESOLVED.");
                  this.editMnemonics.selectedAction = "UPDATE";
                  this.helpers.dismissProgress();
                  this.helpers.myAlert("Alert", "", "<b>Deleted mnemonic " + cv.Title + ".</b>", "Dismiss");
               });
            } else {
               console.log("ERROR:" + res.results);
               this.editMnemonics.results = "Sorry. Error deleting mnemonic.";
               this.helpers.dismissProgress();
               this.helpers.myAlert("Alert", "", "<b>Sorry. Error deleting mnemonic " + cv.Title + ".</b>", "Dismiss");
            }
         });
      });
   }


   deleteTable() {
      console.log("deleteTable called.");
      var category = this.editMnemonics.selectedTable.Category;
      this.helpers.setProgress("Deleting table " + category + ".", false).then(() => {
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         var queries = [
            new SyncQuery(null, this.editMnemonics.selectedTable.User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic_entry, Op_Type_ID.DELETE_INNER_JOIN, [Helpers.TABLES_MISC.mnemonic, Helpers.TABLES_MISC.mnemonic_category], [{"A":"Mnemonic_ID", "B":"T1.ID"}, {"A":"T2.ID", "B":"T1.Mnemonic_Category_ID"}], { "T2.Name": category }),
            new SyncQuery(null, this.editMnemonics.selectedTable.User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic, Op_Type_ID.DELETE_INNER_JOIN, [Helpers.TABLES_MISC.mnemonic_category], [{"A":"Mnemonic_Category_ID", "B":"ID"}], { "Name": this.editMnemonics.selectedTable.Name }),
            new SyncQuery(null, this.editMnemonics.selectedTable.User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic_category, Op_Type_ID.DELETE, [], [], { "Name": category })
         ];
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, Op_Type_ID.DELETE, this.editMnemonics.selectedTable.User_ID, { "Category": category }, { "Category": category }, {}).then((res) => {
            if (res.isSuccess === true) {
               this.editMnemonics.results = "DELETED table " + category + "." + res.results;
               this.editMnemonics.selectedAction = "UPDATE";
               this.getTables(true).then(() => {
                  this.helpers.dismissProgress();
                  this.helpers.myAlert("Alert", "", "<b>DELETED table " + category + "." + res.results + "</b>", "Dismiss");
               });
            } else {
               console.log("ERROR:" + res.results);
               this.editMnemonics.results = "Sorry. Error deleting table. " + res.results;
               this.helpers.dismissProgress();
               this.helpers.myAlert("Alert", "", "<b>Sorry. Error deleting table " + category + ". " + res.results + "</b>", "Dismiss");
            }
         });
      });
   }

   renameMnemonic() {
      console.log("renameMnemonic called.");
      var progressMessage = [];
      this.editMnemonics.results = "";
      this.editMnemonics.results = "";
      var resultsMessage = "";
      var queries: Array<SyncQuery> = [];
      var entriesOld:any = {}, entriesNew:any = {};
      var opTypeNum = 0;
      if (this.editMnemonics.isRenameTable === true) {
         progressMessage.push("Renaming table " + this.editMnemonics.selectedTable.Category + " to " + this.editMnemonics.renameTable);
         resultsMessage += "Renamed table " + this.editMnemonics.selectedTable.Category + " to " + this.editMnemonics.renameTable + ".<br />";
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         queries.push(
            new SyncQuery(null, this.editMnemonics.selectedTable.User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic_category, Op_Type_ID.UPDATE, ["Name"], [this.editMnemonics.renameTable], { "Name": this.editMnemonics.selectedTable.Category }, User_Action_Request.USER_ID_UPDATE)
         );
         entriesOld["Table"] = this.editMnemonics.selectedTable.Category;
         entriesNew["Table"] = this.editMnemonics.renameTable;
         opTypeNum++;
      }
      if (this.editMnemonics.isRenameTitle === true) {
         progressMessage.push("Renaming Title " + this.editMnemonics.selectedTitle.Title + " to " + this.editMnemonics.renameTable);
         resultsMessage += "Renamed title " + this.editMnemonics.selectedTitle.Title + " to " + this.editMnemonics.renameTitle + ".<br />";
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         queries.unshift(
            new SyncQuery(null, this.editMnemonics.selectedTitle.User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.mnemonic, Op_Type_ID.UPDATE, ["Title"], [this.editMnemonics.renameTitle], { "Mnemonic_Category_ID": this.editMnemonics.selectedTable.ID, "Title": this.editMnemonics.selectedTitle.Title, "User_ID": this.editMnemonics.selectedTitle.User_ID }, User_Action_Request.USER_ID_UPDATE)
         );
         entriesOld["Title"] = this.editMnemonics.selectedTitle.Title;
         entriesNew["Title"] = this.editMnemonics.renameTitle;
         opTypeNum += 2;
      }
      var opTypeID = opTypeNum === 1 ? Op_Type_ID.RENAME_MNEMONIC_TABLE : (opTypeNum === 2 ? Op_Type_ID.RENAME_MNEMONIC_TITLE : Op_Type_ID.RENAME_MNEMONIC_TABLE_AND_TITLE);
      this.helpers.setProgress(progressMessage.join("<br />") + "...", false).then(() => {
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, opTypeID, this.editMnemonics.selectedTitle.User_ID, {}, entriesOld, entriesNew).then((res) => {
            if (res.isSuccess === true) {
               this.editMnemonics.results = resultsMessage + res.results;
               //SET NAME CORRECTLY IN DROPDOWN:-----------------------------------------------------
               var tableIndex = this.editMnemonics.tables.map((table:any) => { return table.Category; }).indexOf(this.editMnemonics.selectedTable.Category);
               this.editMnemonics.tables[tableIndex] = this.editMnemonics.renameTable;
               this.editMnemonics.selectedTable = this.editMnemonics.tables[tableIndex];
               this.helpers.myAlert("SUCCESS", "<b>" + this.editMnemonics.results + "</b>", "", "OK");
               //-------------------------------------------------------------------------------------                     
            } else {
               console.log("ERROR:" + res.results);
               this.editMnemonics.results = "Sorry. Error renaming: " + res.results;
               this.helpers.myAlert("ERROR", "<b>" + this.editMnemonics.results + "</b>", "", "Dismiss");
            }
            this.editMnemonics.renameTable = "";
            this.editMnemonics.renameTitle = "";
            this.getTables(true).then(() => {
               this.helpers.dismissProgress();
            });
         });
      });
   }

   reset() {
      console.log("reset called");
      setTimeout(() => {
         this.editMnemonics.results = "";
      }, 2000);
      this.editMnemonics.totalNumber = "";
      this.editMnemonics.mnemonics = [];
      this.editMnemonics.isBeginEdit = true;
      this.editMnemonics.selectAction = null;
      this.editMnemonics.numberEntries = null;
   }

   //KEYUP EVENT IN ENTRY NUMBER INPUT
   resetNumberEntries() {
      this.editMnemonics.isBeginEdit = true;
      this.editMnemonics.mnemonics = [];
   }

   addNumber(index:number) {
      console.log("addNumber called.");
      this.editMnemonics.numberEntries++;
      this.editMnemonics.mnemonics.splice((index + 1), 0, {});
      //this.getTotalSummaryPrompt();
   }
   removeNumber(index:number) {
      console.log("removeNumber called.");
      this.editMnemonics.numberEntries--;
      if (this.editMnemonics.numberEntries === 0) {
         this.editMnemonics.isBeginEdit = true;
      }
      this.editMnemonics.mnemonics.splice(index, 1);
      this.getTotalSummaryPrompt();
   }
   getTotalSummaryPrompt() {
      console.log("getTotalSummaryPrompt called, this.editMnemonics.selectedInsertAction = " + this.editMnemonics.selectedInsertAction);
      var ret = [];
      var ret2 = [];
      var mnemonic_prompt = '';
      console.log("getTotalSummaryPrompt MNEMONICS LENGTH = " + this.editMnemonics.mnemonics.length);
      for (var i = 0; i < this.editMnemonics.mnemonics.length; i++) {
         if (this.editMnemonics.mnemonics[i].Entry_Mnemonic && String(this.editMnemonics.mnemonics[i].Entry_Mnemonic).trim() !== "") {
            if (this.editMnemonics.selectedInsertAction === 'number_major' || this.editMnemonics.selectedInsertAction === 'number_letters') {
               ret.push(this.editMnemonics.mnemonics[i].Entry);
               ret2.push(this.editMnemonics.mnemonics[i].Entry_Mnemonic);
            } else if (this.editMnemonics.selectedInsertAction === 'mnemonic') {
               mnemonic_prompt = this.editMnemonics.mnemonics[i].Entry_Mnemonic;
               if (this.editMnemonics.mnemonics[i].Entry && String(this.editMnemonics.mnemonics[i].Entry).trim() !== "") {
                  mnemonic_prompt += "(" + this.editMnemonics.mnemonics[i].Entry + ")"
               }
               ret.push(mnemonic_prompt);
            }
         }
      }
      if (this.editMnemonics.selectedInsertAction === 'number_major') {
         this.editMnemonics.totalNumber = "<b>Numbers:</b>" + ret.join(" - ");
         this.editMnemonics.totalNumber += "<br /><b>Mnemonics:</b>" + ret2.join(" ");
      } else if (this.editMnemonics.selectedInsertAction === 'number_letters') {
         this.editMnemonics.totalNumber = "<b>Numbers:</b>" + ret.join("");
         this.editMnemonics.totalNumber += "<br /><b>Mnemonics:</b>" + ret2.join(" ");
      } else if (this.editMnemonics.selectedInsertAction === 'mnemonic') {
         this.editMnemonics.totalNumber = "<b>Mnemonic:</b>" + ret.join(" ");
      }
      console.log("getTotalSummaryPrompt, DONE SET this.editMnemonics.totalNumber = " + this.editMnemonics.totalNumber);
      this.changeDet.detectChanges();
      // console.log("END getTotalSummaryPrompt, SET this.editMnemonics.totalNumber=" + this.editMnemonics.totalNumber);
   }

   setPrompts() {
      this.editMnemonics.wordPrompt = "Word to learn:";
      this.editMnemonics.infoPrompt = "Word to learn information:";
      this.editMnemonics.anagramPrompt = "Word to learn information:";
      if (this.editMnemonics.selectedInsertAction === "mnemonic") {
         this.editMnemonics.prompt = "Mnemonic(Word with first letters matching word to learn):";
      } else if (this.editMnemonics.selectedInsertAction === "number_major") {
         this.editMnemonics.prompt = "Word that represents number(use major system*):";
         this.editMnemonics.wordPrompt = "Mnemonic Number(Number to remember):";
         this.editMnemonics.infoPrompt = "Number to learn information:";
      } else if (this.editMnemonics.selectedInsertAction === "number_letters") {
         this.editMnemonics.prompt = "Word that represents number(uses number of letters*):";
         this.editMnemonics.wordPrompt = "Mnemonic Number(Number to remember):";
         this.editMnemonics.infoPrompt = "Number to learn information:";
      } else if (this.editMnemonics.selectedInsertAction === "peglist") {
         this.editMnemonics.prompt = "Associative Sentence For ";
         console.log("IS PEGLIST!!!! SET PROMPT T)=" + this.editMnemonics.prompt);
         this.editMnemonics.wordPrompt = "Word to remember in list";
      } else if (this.editMnemonics.selectedInsertAction === "anagram") {
         this.editMnemonics.anagramPrompt = "Anagram Word(s) **Captilize letters that are first letters of your words, otherwise lower-case them):";
         this.editMnemonics.wordPrompt = "Word(from a letter of the *above anagram to learn):";
      }
   }

   formatVerifyNoPromise(isAlert:boolean) {
      console.log("formatVerify called, this.editMnemonics.selectedInsertAction=" + this.editMnemonics.selectedInsertAction + ", isAlert=" + isAlert);
      var ret:boolean | null = false;
      if (this.editMnemonics.selectedInsertAction !== 'anagram') {
         ret = this.formatVerifyMnemonics(isAlert);
      } else {
         ret = this.formatVerifyAnagram(isAlert);
      }
      console.log("formateAndVerify returning =" + ret);
      return ret;
   }

   formatVerify(index:number, isAlert:boolean) {
      console.log("formatVerify called, this.editMnemonics.selectedInsertAction=" + this.editMnemonics.selectedInsertAction + ", isAlert=" + isAlert);
      if (this.editMnemonics.selectedInsertAction !== 'anagram') {
         var isGetMajorWords = (index !== -1 && this.editMnemonics.selectedInsertAction === 'number_major') ? true : false;
         var majorNumber = null;
         if (isGetMajorWords === true) {
            majorNumber = this.editMnemonics.mnemonics[index].Entry;
         }
         isGetMajorWords = (majorNumber == null || String(majorNumber).trim() === "") ? false : true;
         this.doGetMajorWords(isGetMajorWords, index, majorNumber).then(() => {
            this.formatVerifyMnemonics(isAlert);
         });
      } else {
         this.formatVerifyAnagram(isAlert);
      }
   }

   doGetMajorWords(isGet: boolean, index: number, number: number): Promise<void> {
      console.log("doGetMajorWords called");
      return new Promise((resolve, reject) => {
         if (isGet === false) {
            resolve();
         } else {
            this.helpers.getMajorWords(number, 100).then(majorWords => {
               majorWords.forEach((mw:any) => {
                  mw.Word = this.helpers.formatWord(mw.Word.split(""), this.editMnemonics.mnemonics[index].Entry);
               });
               //console.log("GOT MAJOR WORDS = " + JSON.stringify(majorWords));
               this.editMnemonics.mnemonics[index].majorWords = majorWords;
               resolve();
            });
         }
      });
   }

   formatVerifyMnemonics(isAlert:boolean): boolean | null {
      console.log("formatVerifyMnemonics called, isAlert=" + isAlert);
      if (this.editMnemonics.isFormatting === true) {
         return null;
      }
      this.editMnemonics.isFormatting = true;
      var isInvalid = false;
      var ret = true;
      var isNullMnemonic = false;
      var isNullWord = false;
      var isInvalidMnemonic = false;
      var isInvalidNumberMajor = false;
      var isInvalidNumberLetters = false;
      if (this.editMnemonics.selectedInsertAction === 'number_major' || this.editMnemonics.selectedInsertAction === 'number_letters') {
         if (!this.editMnemonics.inputNumber || !this.editMnemonics.inputNumberPower) {
            isInvalid = true;
            ret = false;
            if (this.editMnemonics.selectedInsertAction === 'number_major') {
               isInvalidNumberMajor = true;
            } else if (this.editMnemonics.selectedInsertAction === 'number_letters') {
               isInvalidNumberLetters = true;
            }
         }
      }
      if (isInvalid === false) {
         for (var i = 0; i < this.editMnemonics.mnemonics.length; i++) {
            this.editMnemonics.mnemonics[i].isInvalidMnemonic = false;
            this.editMnemonics.mnemonics[i].isInvalidWord = false;
            if (!this.editMnemonics.mnemonics[i].Entry_Mnemonic || String(this.editMnemonics.mnemonics[i].Entry_Mnemonic).trim() === "") {
               this.editMnemonics.mnemonics[i].isInvalidMnemonic = true;
               isNullMnemonic = true;
               ret = false;
            } else {
               if (this.editMnemonics.selectedInsertAction === 'number_major' || this.editMnemonics.selectedInsertAction === 'number_letters') {
                  this.editMnemonics.mnemonics[i].Entry_Mnemonic = String(this.editMnemonics.mnemonics[i].Entry_Mnemonic).replace(/[^A-Z]/ig, '');
               }
               else if (this.editMnemonics.selectedInsertAction === 'mnemonic') {
                  this.editMnemonics.mnemonics[i].Entry_Mnemonic = this.editMnemonics.mnemonics[i].Entry_Mnemonic.replace(/[^A-Z]/ig, '');
               }
            }
            if (this.editMnemonics.selectedInsertAction !== 'number_letters' && (!this.editMnemonics.mnemonics[i].Entry || String(this.editMnemonics.mnemonics[i].Entry).trim() === "")) {
               this.editMnemonics.mnemonics[i].isInvalidWord = true;
               isNullWord = true;
               ret = false;
            } else {
               if (this.editMnemonics.selectedInsertAction === 'number_major' || this.editMnemonics.selectedInsertAction === 'number_letters') {
                  this.editMnemonics.mnemonics[i].Entry = String(this.editMnemonics.mnemonics[i].Entry).replace(/[^0-9]/ig, '');
               }
            }
            if (this.editMnemonics.selectedInsertAction !== 'peglist' && this.editMnemonics.mnemonics[i].isInvalidMnemonic === false && this.editMnemonics.mnemonics[i].isInvalidWord === false) {
               if (this.editMnemonics.selectedInsertAction === 'mnemonic') {
                  console.log("TEST IF FIRST CHARACTERS OF MNEMONIC AND WORD MATCH:");
                  if (this.editMnemonics.mnemonics[i].Entry_Mnemonic.split("")[0].toUpperCase() !== this.editMnemonics.mnemonics[i].Entry.split("")[0].toUpperCase()) {
                     isInvalidMnemonic = true;
                     this.editMnemonics.mnemonics[i].isInvalidWord = true;
                     this.editMnemonics.mnemonics[i].isInvalidMnemonic = true;
                     ret = false;
                  } else {
                     console.log("GOING TO CALL this.helpers.formatMnemonicWord, mnemonic=" + this.editMnemonics.mnemonics[i].Entry_Mnemonic + ", word=" + this.editMnemonics.mnemonics[i].Entry);
                     this.editMnemonics.mnemonics[i].Entry_Mnemonic = this.helpers.formatMnemonicWord(this.editMnemonics.mnemonics[i].Entry_Mnemonic, this.editMnemonics.mnemonics[i].Entry);
                  }
               } else if (this.editMnemonics.selectedInsertAction === 'number_major') {
                  console.log("CALLING FORMATWORD, WORD BEFORE=" + this.editMnemonics.mnemonics[i].Entry_Mnemonic);
                  this.editMnemonics.mnemonics[i].Entry_Mnemonic = this.helpers.formatWord(String(this.editMnemonics.mnemonics[i].Entry_Mnemonic).split(""), this.editMnemonics.mnemonics[i].Entry);
                  console.log("CALLING FORMATWORD, WORD AFTER=" + this.editMnemonics.mnemonics[i].Entry_Mnemonic);
                  //----------------------------------------------------
                  console.log("Checking if number matches major word: number=" + String(this.editMnemonics.mnemonics[i].Entry) + ", major number=" + this.helpers.getMajorSystemNumber(this.editMnemonics.mnemonics[i].Entry_Mnemonic, 0, this.editMnemonics.mnemonics[i].Entry));
                  if (String(this.editMnemonics.mnemonics[i].Entry) !== String(this.helpers.getMajorSystemNumber(this.editMnemonics.mnemonics[i].Entry_Mnemonic, 0, this.editMnemonics.mnemonics[i].Entry).substring(0, String(this.editMnemonics.mnemonics[i].Entry).length))) {
                     isInvalidNumberMajor = true;
                     this.editMnemonics.mnemonics[i].isInvalidWord = true;
                     this.editMnemonics.mnemonics[i].isInvalidMnemonic = true;
                     ret = false;
                  }
               } else if (this.editMnemonics.selectedInsertAction === 'number_letters') {
                  this.editMnemonics.mnemonics[i].Entry = String(this.editMnemonics.mnemonics[i].Entry_Mnemonic).length;
                  //----------------------------------------------------
                  console.log("Checking if number matches number of letters: number=" + String(this.editMnemonics.mnemonics[i].Entry) + ", number of letters=" + String(this.editMnemonics.mnemonics[i].Entry_Mnemonic).length);
                  if (isNaN(parseInt(this.editMnemonics.mnemonics[i].Entry)) || parseInt(this.editMnemonics.mnemonics[i].Entry) !== String(this.editMnemonics.mnemonics[i].Entry_Mnemonic).length) {
                     isInvalidNumberLetters = true;
                     this.editMnemonics.mnemonics[i].isInvalidWord = true;
                     this.editMnemonics.mnemonics[i].isInvalidMnemonic = true;
                     ret = false;
                  }
               }
            }
         }
      }
      if (isAlert === true) {
         if (isNullWord) {
            this.helpers.myAlert("Alert", "<b>All words need to be entered.</b>", "", "Dismiss");
            ret = false;
         }
         else if (isNullMnemonic) {
            this.helpers.myAlert("Alert", "<b>All mnemonics need to be entered.</b>", "", "Dismiss");
            ret = false;
         }
         else if (isInvalidMnemonic) {
            this.helpers.myAlert("Alert", "<b>Mnemonics need to have first characters of mnemonic matching word:('COin<->COpper').</b>", "", "Dismiss");
            ret = false;
         }
         else if (isInvalidNumberMajor) {
            this.helpers.myAlert("Alert", "<b>Make sure your number and power is entered and each entry number matches valid major words.</b>", "", "Dismiss");
            ret = false;
         } else if (isInvalidNumberLetters) {
            alert("Make sure your number and power is entered and there is a word for each number.");
            ret = false;
         }
      } else {//NOT ACTUALLY EDITTING(ALERTING):
         this.getTotalSummaryPrompt();
      }
      this.editMnemonics.isFormatting = false;
      return ret;
   }

   formatVerifyAnagram(isAlert:boolean): boolean {
      console.log("formatVerifyAnagram called, isAlert=" + isAlert);
      var isNullAnagram = false;
      var isNullWord = false;
      var isInvalidAnagram = false;
      var ret = true;
      this.editMnemonics.anagramInputInvalid = false;
      console.log("INPUT ANAGRAM=" + this.editMnemonics.anagramInput);
      if (!this.editMnemonics.anagramInput || this.editMnemonics.anagramInput.trim() === '') {
         console.log("INPUT ANAGRAM IS NULL!!!");
         isNullAnagram = true;
         this.editMnemonics.anagramInputInvalid = true;
      } else {
         console.log("ANAGRAM NOT NULL, CHECKING WORDS...");
         var anagram_split = this.editMnemonics.anagramInput.split("");
         var letters = [];
         for (var i = 0; i < this.editMnemonics.mnemonics.length; i++) {
            this.editMnemonics.mnemonics[i].isInvalidWord = false;
            this.editMnemonics.mnemonics[i].isInvalidMnemonic = false;
            if (!this.editMnemonics.mnemonics[i].Entry || String(this.editMnemonics.mnemonics[i].Entry).trim() === "") {
               this.editMnemonics.mnemonics[i].isInvalidWord = true;
               isNullWord = true;
               letters.push("");
            } else {
               letters.push(this.editMnemonics.mnemonics[i].Entry.split("")[0]);
            }
         }
         this.editMnemonics.anagramInput = this.helpers.getFormattedAnagram(this.editMnemonics.anagramInput, letters);
         if (letters.length !== this.helpers.countUpperCase(this.editMnemonics.anagramInput)) {
            console.log("LETTERS LENGTH != COUNT UPPERCASE...INVALIDATING!!!");
            for (var i = 0; i < this.editMnemonics.mnemonics.length; i++) {
               console.log("letters[" + i + "]=" + letters[i]);
               if (this.editMnemonics.anagramInput.indexOf(letters[i].toUpperCase()) < 0) {
                  console.log("SETTING WORD " + i + " AS INVALID!");
                  this.editMnemonics.mnemonics[i].isInvalidWord = true;
                  isInvalidAnagram = true;
               }
            }
         }
      }
      if (isAlert === true) {
         if (isNullAnagram) {
            this.helpers.myAlert("Alert", "<b>Need to input an anagram.</b>", "", "Dismiss");
            ret = false;
         }
         else if (isNullWord) {
            this.helpers.myAlert("Alert", "<b>All words need to be entered.</b>", "", "Dismiss");
            ret = false;
         }
         else if (isInvalidAnagram) {
            this.helpers.myAlert("Alert", "<b>Anagram needs to contain letters in the order of the first character of each word.</b>", "", "Dismiss");
            ret = false;
         }
      }
      return ret;
   }

   setMajorWord(index:number) {
      console.log("setMajorWord called, this.editMnemonics.mnemonics[index].selectedMajorWord = " + JSON.stringify(this.editMnemonics.mnemonics[index].selectedMajorWord));
      this.editMnemonics.mnemonics[index].Entry_Mnemonic = this.editMnemonics.mnemonics[index].selectedMajorWord.Word;
      if (this.editMnemonics.mnemonics[index].selectedMajorWord.Definition && String(this.editMnemonics.mnemonics[index].selectedMajorWord.Definition).trim() !== "") {
         this.editMnemonics.mnemonics[index].Entry_Info = this.editMnemonics.mnemonics[index].selectedMajorWord.Definition;
      }
      this.formatVerifyNoPromise(false);
   }
}

interface myObject {
   [key: string]: any;
}