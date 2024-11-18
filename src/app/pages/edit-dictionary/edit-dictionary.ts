import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, Platform, ModalController } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage';
import { DB_Type_ID, Helpers, Op_Type, Op_Type_ID, SyncQuery, User_Action_Request } from '../../providers/helpers/helpers';
import { Subscription } from 'rxjs';
import { ModalListPage } from '../../pages/modal-list/modal-list';


@Component({
   selector: 'page-edit-dictionary',
   templateUrl: 'edit-dictionary.html',
   styleUrl: 'edit-dictionary.scss'
})
export class EditDictionaryPage {
   public pageName:string = "Edit Dictionary";
   public database_misc: SQLiteDBConnection;
   progressLoader: any;
   editDictionary: any;
   background_color: any;
   private onPauseSubscription: Subscription;
   button_color: string = "";
   button_gradient: string = "";

   constructor(public navCtrl: NavController, public modalCtrl: ModalController, private platform: Platform, private alertCtrl: AlertController, public progress: LoadingController, public storage: Storage, public helpers: Helpers) {
      console.log("EDIT DICTIONARY CONSTRUCTOR CALLED.");
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
      this.editDictionary = {};
      Helpers.currentPageName = this.pageName;
      this.editDictionary.user = Helpers.User;
      var getOld: any = {};
      this.editDictionary.getOld = getOld;
      this.editDictionary.selectedAction = null;
      this.editDictionary.isEnableActions = false;
      this.editDictionary.savedInputWord = "";
      this.editDictionary.results = "";
      this.editDictionary.inputWord = null;
      this.editDictionary.partsSpeech = [
         { "PartSpeech": "noun", "Part_Speech_ID": 1 },
         { "PartSpeech": "adj.", "Part_Speech_ID": 2 },
         { "PartSpeech": "verb", "Part_Speech_ID": 3 },
         { "PartSpeech": "adv.", "Part_Speech_ID": 4 },
         { "PartSpeech": "acr.", "Part_Speech_ID": 5 },
         { "PartSpeech": "pre.", "Part_Speech_ID": 6 },
         { "PartSpeech": "con.", "Part_Speech_ID": 7 },
         { "PartSpeech": "pro.", "Part_Speech_ID": 8 },
         { "PartSpeech": "aux.", "Part_Speech_ID": 9 },
         { "PartSpeech": "art.", "Part_Speech_ID": 10 }
      ];
      this.editDictionary.partSpeech = this.editDictionary.partsSpeech[0];
      this.editDictionary.suggestedWord = "";
      this.editDictionary.suggestedWords = [];
      this.editDictionary.dictionaryWords = [];
      await this.storage.create();
      this.storage.get('EDIT_DICTIONARY_SELECTED_ACTION').then((val) => {
         if (val != null) {
            this.editDictionary.selectedAction = val;
         }
         this.storage.get('EDIT_DICTIONARY_INPUT_WORD').then((val) => {
            if (val != null) {
               this.editDictionary.inputWord = val;
            }
            this.helpers.getDictionaryWords(false).then((words) => {
               this.editDictionary.dictionaryWords = words;
               if (this.editDictionary.dictionaryWords.length === 0) {
                  this.editDictionary.results = "RESULTS: No dictionary words exit.";
               }
               this.background_color = Helpers.background_color;
               this.button_color = Helpers.button_color;
               this.button_gradient = Helpers.button_gradient;
               this.editDictionary.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
                  this.background_color = bgColor;
               });
               this.editDictionary.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
                  this.button_color = buttonColor.value;
                  this.button_gradient = buttonColor.gradient;
               });
               if (this.editDictionary.selectedAction && this.editDictionary.selectedAction !== "INSERT" && this.editDictionary.inputWord && this.editDictionary.inputWord.trim() !== "") {
                  this.getDefinition(this.editDictionary.inputWord);
               } else {
                  this.storage.get('EDIT_DICTIONARY_DEFINITION_INPUT').then((val) => {
                     if (val != null) {
                        this.editDictionary.definitionInput = val;
                     }
                     this.storage.get('EDIT_DICTIONARY_PART_SPEECH').then((val) => {
                        if (val != null) {
                           var indexPartSpeech = this.editDictionary.partsSpeech.map((ps:any) => { return ps.PartSpeech; }).indexOf(val);
                           if (indexPartSpeech >= 0) {
                              this.editDictionary.partSpeech = this.editDictionary.partsSpeech[indexPartSpeech];
                           }
                        }
                        this.helpers.dismissProgress();
                     });
                  });
               }
            });
         });
      });
   }

   ionViewWillLeave() {
      console.log('ionViewWillLeave EditDictionaryPage');
      this.editDictionary.subscribedBackgroundColorEvent.unsubscribe();
      this.editDictionary.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   saveStorage() {
      this.storage.set('EDIT_DICTIONARY_DEFINITION_INPUT', this.editDictionary.definitionInput).then(() => {
         this.storage.set('EDIT_DICTIONARY_SELECTED_ACTION', this.editDictionary.selectedAction).then(() => {
            this.storage.set('EDIT_DICTIONARY_INPUT_WORD', this.editDictionary.inputWord).then(() => {
               if (this.editDictionary.partSpeech) {
                  this.storage.set('EDIT_DICTIONARY_PART_SPEECH', this.editDictionary.partSpeech.PartSpeech).then(() => {
                  });
               }
            });
         });
      });
   }

   filterWords() {
      console.log("filterWords called, this.editDictionary.dictionaryWords.length=" + this.editDictionary.dictionaryWords.length);
      if (this.editDictionary.selectedAction === "INSERT") {
         return;
      }
      this.editDictionary.isEnableActions = false;
      var selwor = this.editDictionary.inputWord.toLowerCase();
      if (selwor == null || selwor === "" || this.editDictionary.savedInputWord === this.editDictionary.inputWord) {
         this.editDictionary.suggestedWords = [];
         return;
      } else {
         this.editDictionary.savedInputWord = this.editDictionary.inputWord;
         this.editDictionary.isGettingSuggested = true;
         console.log("selwor = " + selwor);
         if (!this.editDictionary.dictionaryWords) {
            console.log("this.editDictionary.dictionaryWords NULL!");
         } else {
            console.log("this.editDictionary.dictionaryWords.length = " + this.editDictionary.dictionaryWords.length);
         }
         var selworLength = selwor.length;
         this.editDictionary.suggestedWords = this.editDictionary.dictionaryWords.filter((word:any) => {
            return (word.substring(0, selworLength).toLowerCase() === selwor);
         });
         this.editDictionary.suggestedWord = this.editDictionary.suggestedWords[0];
      }
   }

   async showSuggestedWords() {
      console.log("showSuggestedWords called");
      // Create the modal
      var itemRet = {};
      var items = this.editDictionary.suggestedWords.map((item: any) => {
         itemRet = { "name": item };
         return itemRet;
      });
      let modal = await this.modalCtrl.create({
         component: ModalListPage,
         componentProps: {
            "items": items,
            "title": "Words Matching: " + this.editDictionary.inputWord
         }
      });
      // Handle the result
      modal.onDidDismiss().then((item:any) => {
         if (item) {
            console.log("SELECTED item");
            this.editDictionary.suggestedWord = item.data.name;
            this.getDefinition(this.editDictionary.suggestedWord);
         }
      });
      await modal.present();
   }


   getDefinition(word:any) {
      console.log('getDefinition called');
      this.helpers.setProgress("Getting word " + word + ", please wait......", false).then(() => {
         if (Helpers.isWorkOffline === false) {
            var params = {
               "word": word
            };
            this.helpers.makeHttpRequest("/lfq_directory/php/edit_dictionary_get_word.php", "GET", params).then((data) => {
               var myWords = [];
               if (data && data["SUCCESS"] === true) {
                  myWords.push(data);
                  this.finishGetDefinition(word, myWords);
                  this.helpers.dismissProgress();
               } else {
                  this.helpers.dismissProgress();
                  this.helpers.alertLfqError(data["ERROR"]);
               }
            }, error => {
               console.log("ERROR:" + error.message);
               this.editDictionary.results = "Sorry. Error getting definition: " + error.message;
               this.helpers.dismissProgress();
               this.helpers.alertServerError(error.message);
            });
         } else {
            var sql = "SELECT d.Definition,p.PartSpeech,d.Number,d.User_ID,ud.Username FROM ";
            sql += Helpers.TABLES_MISC.dictionarya + " d ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.part_speech + " p ON p.ID=d.Part_Speech_ID ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.userdata + " ud ON ud.ID=d.User_ID ";
            sql += "WHERE d.Word='" + word + "'";
            this.helpers.query(this.database_misc, sql, []).then((data) => {
               var myWords = [];
               if (data.rows.length > 0) {
                  myWords.push(data.rows.item(0));
               }
               this.finishGetDefinition(word, myWords);
               this.helpers.dismissProgress();
            }).catch((error) => {
               console.log("sql:" + sql + ", ERROR:" + error.message);
               this.editDictionary.results = "Sorry. Error getting definition.";
               this.helpers.dismissProgress();
            });
         }
      });
   }

   finishGetDefinition(word:any, myWords:any) {
      console.log("finishGetDefinition called");
      var hasDefinition = false;
      if (myWords.length > 0) {
         var myWord = myWords[0];
         this.editDictionary.getOld = myWord;
         console.log("myWord = " + JSON.stringify(myWord));
         if (myWord.Definition && myWord.Definition.trim() !== '') {
            hasDefinition = true;
         }
         console.log("hasDefinition = " + hasDefinition + ", myWord.Username = " + myWord.Username);
         this.editDictionary.definitionInput = myWord.Definition;
         var indexPartSpeech = this.editDictionary.partsSpeech.map((ps:any) => { return ps.PartSpeech; }).indexOf(myWord.PartSpeech);
         if (indexPartSpeech >= 0) {
            this.editDictionary.partSpeech = this.editDictionary.partsSpeech[indexPartSpeech];
         }
         var definitionResult = hasDefinition === true ? "Got definition." : "No definition.";
         this.editDictionary.results = "RESULTS: Got " + word + ". " + definitionResult + " Major number: " + myWord.Number;
         this.editDictionary.isEnableActions = true;
      } else {
         this.editDictionary.results = "RESULTS: '" + word + "' doesn't exist.";
         this.editDictionary.isEnableActions = false;
      }
   }

   doEditDictionary() {
      var partspeech = this.editDictionary.partSpeech;
      var definition = this.editDictionary.definitionInput;
      console.log('editDictionary called, editDictionary.selectedAction=' + this.editDictionary.selectedAction + ", partspeech = " + JSON.stringify(partspeech) + ", definition = " + definition);
      if (this.editDictionary.selectedAction == null) {
         this.helpers.myAlert("Alert", "", "<b>Must select action: Insert, Delete, or Edit.</b>", "Dismiss");
         return;
      }
      var selwor = "";
      if (this.editDictionary.selectedAction === "INSERT") {
         selwor = this.editDictionary.inputWord;
      } else {
         selwor = this.editDictionary.suggestedWord;
      }
      if (selwor == null || selwor.trim() === '') {
         this.helpers.myAlert("Alert", "", "<b>Must input or select a word.</b>", "Dismiss");
         return;
      }
      if (this.editDictionary.selectedAction !== "DELETE") {
         if (partspeech == null) {
            this.helpers.myAlert("Alert", "", "<b>Must select a part of speech.</b>", "Dismiss");
            return;
         }
      }
      //if (definition == null || definition.trim() === '') {
      //   this.helpers.myAlert("Alert", "", "<b>Must input a definition.</b>", "Dismiss");
      //   return;
      //}

      if (this.editDictionary.selectedAction === "INSERT") {
         this.insertDictionary(selwor, partspeech, definition);
      }
      if (this.editDictionary.selectedAction === "EDIT") {
         this.updateDictionary(selwor, partspeech, definition);
      }
      if (this.editDictionary.selectedAction === "DELETE") {
         this.deleteDictionary(selwor);
      }
   }

   insertDictionary(selwor:any, partspeech:any, definition:any) {
      console.log("insertDictionary called");
      var number = parseInt(this.helpers.getMajorSystemNumber(selwor, 0, null));
      var cols = ["User_ID", "Word", "Part_Speech_ID", "Definition", "Number"];
      var vals = [[Helpers.User.ID, selwor, partspeech.Part_Speech_ID, definition, number]];
      this.helpers.setProgress("Inserting word " + selwor + ",please wait......", false).then(() => {
         var checkWheres = {"Word": selwor};
         this.helpers.insertCheckExists(DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.dictionarya, checkWheres).then((isExists) => {
            if(isExists){
               this.helpers.dismissProgress();
               this.helpers.myAlert("ALERT", "", "The word, " + selwor + ", already exists.", "OK");
               return;
            }
            //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
            var queries = [new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.dictionarya, Op_Type_ID.INSERT, cols, vals, {"Word": selwor})];
            //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
            this.helpers.autoSync(queries, Op_Type_ID.INSERT, null, { "Word": selwor }, {}, {}).then((res) => {
               this.helpers.dismissProgress();
               if (res.isSuccess === true) {
                  this.editDictionary.results = "RESULTS: Inserted word: " + selwor + ". Part speech is: " + partspeech.PartSpeech + ". Definition is: " + definition + ". Major number is: " + number + ".<br />" + res.results;
                  this.helpers.myAlert("SUCCESS", "<b>" + this.editDictionary.results + "</b>", "", "Dismiss");
                  this.editDictionary.isEnableActions = true;
                  this.editDictionary.dictionaryWords.push(selwor);
               } else {
                  console.log("ERROR:" + res.results);
                  this.editDictionary.results = "Sorry. Error inserting dictionary entry. " + res.results;
                  this.helpers.myAlert("ERROR", "<b>" + this.editDictionary.results + "</b>", "", "Dismiss");
                  this.editDictionary.isEnableActions = true;
               }
            });
         });
      });
   }

   updateDictionary(selwor:any, partspeech:any, definition:any) {
      console.log("updateDictionary called");
      var number = parseInt(this.helpers.getMajorSystemNumber(selwor, 0, null));
      this.helpers.setProgress("Updating word " + selwor + ",please wait......", false).then(() => {
         var cols = ["Part_Speech_ID", "Definition", "Number"];
         var vals = [partspeech.Part_Speech_ID, definition, number];
         var newCv: any = {};
         newCv.Definition = definition;
         newCv.PartSpeech = partspeech.PartSpeech;
         newCv.Number = number;
         var includeProps = ["Definition", "PartSpeech", "Number"];
         var entriesRequest = Helpers.getEntriesRequest(this.editDictionary.getOld, newCv, includeProps);
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         var queries = [new SyncQuery(null, this.editDictionary.getOld.User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.dictionarya, Op_Type_ID.UPDATE, cols, vals, { "Word": selwor }, User_Action_Request.USER_ID_UPDATE)];
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, Op_Type_ID.UPDATE, this.editDictionary.getOld.User_ID, { "Word": selwor }, entriesRequest[0], entriesRequest[1]).then((res) => {
            this.helpers.dismissProgress();
            if (res.isSuccess === true) {
               this.editDictionary.results = "RESULTS: Updated " + selwor + ". Part speech is: " + partspeech.PartSpeech + ". Definition is: " + definition + ". Major number is: " + number + ".<br />" + res.results;
               this.helpers.myAlert("SUCCESS", "<b>" + this.editDictionary.results + "</b>", "", "Dismiss");
            } else {
               console.log("ERROR:" + res.results);
               this.editDictionary.results = "Sorry. Error updating dictionary entry. " + res.results;
               this.helpers.myAlert("ERROR", "<b>" + this.editDictionary.results + "</b>", "", "Dismiss");
            }
         })
      });
   }

   deleteDictionary(selwor:any) {
      console.log("deleteDictionary called");
      this.helpers.setProgress("Deleting word " + selwor + ",please wait......", false).then(() => {
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         var queries = [new SyncQuery(null, this.editDictionary.getOld.User_ID, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.dictionarya, Op_Type_ID.DELETE, [], [], { "Word": selwor })];
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, Op_Type_ID.DELETE, this.editDictionary.getOld.User_ID, { "Word": selwor }, {}, {}).then((res) => {
            this.helpers.dismissProgress();
            if (res.isSuccess === true) {
               this.editDictionary.inputWord = "";
               this.editDictionary.partSpeech = null;
               this.editDictionary.definitionInput = null;
               this.editDictionary.suggestedWords = [];
               this.editDictionary.results = "RESULTS: Deleted word: " + selwor + "<br />" + res.results;
               this.helpers.myAlert("SUCCESS", "<b>" + this.editDictionary.results + "</b>", "", "Dismiss");
               this.editDictionary.isEnableActions = false;
               var wordIndex = this.editDictionary.dictionaryWords.indexOf(selwor);
               if (wordIndex >= 0) {
                  this.editDictionary.dictionaryWords.splice(wordIndex, 1);
               }
            } else {
               console.log("ERROR:" + res.results);
               this.editDictionary.results = "Sorry. Error deleting dictionary entry. " + res.results;
               this.helpers.myAlert("ERROR", "<b>" + this.editDictionary.results + "</b>", "", "Dismiss");
               this.editDictionary.isEnableActions = false;
            }
         });
      });
   }
}

interface myObject {
   [key: string]: any;
}
