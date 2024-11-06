import { Component } from '@angular/core';
import { NavController, AlertController, LoadingController, Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';
import { Helpers } from '../../providers/helpers/helpers';
import { Subscription } from 'rxjs';

@Component({
   selector: 'page-show-dictionary',
   templateUrl: 'show-dictionary.html',
})
export class ShowDictionaryPage {
   public pageName:string = "Show Dictionary";
   showDictionary: any;
   public database_misc: SQLiteDBConnection;
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

   doClickCheckOneWord() {
      this.showDictionary.isOneWord = !this.showDictionary.isOneWord;
      this.showDictionary.words = [];
      this.showDictionary.loadResults = "";
      console.log("doClickCheckOneWord called, this.showDictionary.isOneWord=" + this.showDictionary.isOneWord);
      this.doCheckOneWord();
   }

   doCheckOneWord() {
      console.log("doCheckOneWord called. this.showDictionary.isOneWord=" + this.showDictionary.isOneWord);
      if (this.showDictionary.isOneWord === true) {
         this.showDictionary.and_placeholder = "Enter one word to look up.";
      } else {
         this.showDictionary.and_placeholder = "All words to exist";
      }
   }

   async ngOnInit() {
      this.user = Helpers.User;
      this.showDictionary = {};
      await this.storage.create();
      this.showDictionary.words = [];
      this.showDictionary.isOneWord = false;
      this.showDictionary.and_placeholder = "All words to exist"
      this.showDictionary.and_input = "";
      this.showDictionary.or_input = "";
      this.showDictionary.nor_input = "";
      this.showDictionary.color = "secondary";
      this.storage.get('SHOW_DICTIONARY_AND_INPUT').then((val) => {
         if (val != null) {
            this.showDictionary.and_input = val;
         }
         this.storage.get('SHOW_DICTIONARY_OR_INPUT').then((val) => {
            if (val != null) {
               this.showDictionary.or_input = val;
            }
            this.storage.get('SHOW_DICTIONARY_NOR_INPUT').then((val) => {
               if (val != null) {
                  this.showDictionary.nor_input = val;
               }
               this.storage.get('SHOW_DICTIONARY_IS_ONE_WORD').then((val) => {
                  if (val != null) {
                     this.showDictionary.isOneWord = val;
                  }
                  this.background_color = Helpers.background_color;
                  this.button_color = Helpers.button_color;
                  this.button_gradient = Helpers.button_gradient;
                  this.showDictionary.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
                     this.background_color = bgColor;
                  });
                  this.showDictionary.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
                     this.button_color = buttonColor.value;
                     this.button_gradient = buttonColor.gradient;
                  });
                  this.doCheckOneWord();
               });
            });
         });
      });
   }


   ionViewWillLeave() {
      console.log('ionViewWillLeave ShowDictionaryPage');
      this.showDictionary.subscribedBackgroundColorEvent.unsubscribe();
      this.showDictionary.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   saveStorage() {
      console.log("saveStorage called");
      this.storage.set('SHOW_DICTIONARY_AND_INPUT', this.showDictionary.and_input).then(() => {
         this.storage.set('SHOW_DICTIONARY_OR_INPUT', this.showDictionary.or_input).then(() => {
            this.storage.set('SHOW_DICTIONARY_NOR_INPUT', this.showDictionary.nor_input).then(() => {
               this.storage.set('SHOW_DICTIONARY_IS_ONE_WORD', this.showDictionary.isOneWord).then(() => {
               });
            });
         });
      });
   }

   getDictionaryResults() {
      console.log("getDictionaryResults called");
      this.showDictionary.results = null;
      var input_and = this.showDictionary.and_input;
      var input_or = this.showDictionary.or_input;
      var input_nor = this.showDictionary.nor_input;
      var and_spl = input_and.split(/\s+/);
      var or_spl = input_or.split(/\s+/);
      var nor_spl = input_nor.split(/\s+/);
      var and_l = 0;
      var or_l = 0;
      var nor_l = 0;
      if (input_and !== "") {
         and_l = and_spl.length;
      }
      console.log("and_spl = " + and_spl + ", and_l = " + and_l);
      if (input_or !== "") {
         or_l = or_spl.length;
      }
      if (input_nor !== "") {
         nor_l = nor_spl.length;
      }
      var is_one_word = this.showDictionary.isOneWord;
      if ((and_l < 2 && and_spl[0].length < 2)
         && (or_l < 2 && or_spl[0].length < 2)
         && (nor_l < 2 && nor_spl[0].length < 2)) {
         this.helpers.myAlert("INPUT ERROR", "MUST ENTER AT LEAST 1 KEYWORD THAT HAS MORE THAN 1 LETTER.", "", "Dismiss");
         return;
      }
      var text = "RESULTS:<br />";
      var ct_now = 0;
      if (is_one_word) {
         var selectionArgs = [];
         selectionArgs.push(input_and);
         this.helpers.setProgress("Getting dictionary results for 1 word: " + input_and + ", please wait......", false).then(() => {

            if (Helpers.isWorkOffline === false) {
               var params = {
                  "input_and": input_and
               };
               this.helpers.makeHttpRequest("/lfq_directory/php/show_dictionary_one_word.php", "POST", params).then((data) => {
                  if (data["SUCCESS"] === true) {
                     this.showOneWordResults(data["WORDS"]);
                     this.helpers.dismissProgress();
                  } else {
                     this.helpers.dismissProgress();
                     this.helpers.alertLfqError(data["ERROR"]);
                  }
               }, error => {
                  this.helpers.dismissProgress();
                  this.helpers.alertServerError(error.message);
               });
            } else {         
               var sql = "SELECT d.Word,p.PartSpeech,d.Definition FROM " + Helpers.TABLES_MISC.dictionarya + " AS d ";
               sql += "INNER JOIN " + Helpers.TABLES_MISC.part_speech + " AS p ON p.ID=d.Part_Speech_ID ";
               sql += "WHERE d.Word LIKE '%" + input_and + "%' ORDER BY d.Word LIMIT 1000";
               this.helpers.query(this.database_misc, sql, []).then((data) => {
                  var oneWords = [];
                  for(var i=0;i<data.rows.length;i++){
                     oneWords.push(data.rows.item(i));
                  }
                  this.showOneWordResults(oneWords);
                  this.helpers.dismissProgress();
               }).catch((error) => {//END SELECT QUERY
                  console.log("sql:" + sql + ", ERROR:" + error.message);
                  this.showDictionary.loadResults = "Sorry no records found.";
                  this.showDictionary.results = "Sorry. Error loading dictionary words."
                  this.helpers.dismissProgress();
               });
            }
         });
      }
      else { //IF !is_one_word :
         this.helpers.setProgress("Getting dictionary results query, please wait......", false).then(() => {
            var andExps = [];
            var orExps = [];
            var norExps = [];
            for (var i = 0; i < and_l; i++) {
               andExps.push("d.Definition LIKE '%" + and_spl[i] + "%'");
            }
            for (var i = 0; i < or_l; i++) {
               orExps.push("d.Definition LIKE '%" + or_spl[i] + "%'");
            }
            for (var i = 0; i < nor_l; i++) {
               norExps.push("d.Definition NOT LIKE '%" + nor_spl[i] + "%'");
            }
            var exps = [];
            if(andExps.length>0){
               exps.push("(" + andExps.join(" AND ") + ")");
            }
            if(orExps.length>0){
               exps.push("(" + orExps.join(" OR ") + ")");
            }
            if(norExps.length>0){
               exps.push("(" + norExps.join(" AND ") + ")");
            }            
            var def_expression = exps.join(" AND ");

            if (Helpers.isWorkOffline === false) {
               var params = {
                  "def_expression": def_expression
               };
               this.helpers.makeHttpRequest("/lfq_directory/php/show_dictionary_many_word.php", "POST", params).then((data) => {
                  if (data["SUCCESS"] === true) {
                     this.showManyWordResults(data["WORDS"]);
                     this.helpers.dismissProgress();
                  } else {
                     this.helpers.dismissProgress();
                     this.helpers.alertLfqError(data["ERROR"]);
                  }
               }, error => {
                  this.helpers.dismissProgress();
                  this.helpers.alertServerError(error.message);
               });
            } else {
               var sql = "SELECT d.Word,p.PartSpeech,d.Definition FROM " + Helpers.TABLES_MISC.dictionarya + " AS d ";
               sql += "INNER JOIN " + Helpers.TABLES_MISC.part_speech + " AS p ON p.ID=d.Part_Speech_ID ";
               sql += "WHERE" + def_expression;
               sql += " ORDER BY d.Word COLLATE NOCASE LIMIT 300";
               this.helpers.query(this.database_misc, sql, []).then((data) => {
                  console.log("QUERY=" + sql);
                  var manyWords = [];
                  for (var i = 0; i < data.rows.length; i++) {
                     manyWords.push(data.rows.item(i));
                  }
                  this.showManyWordResults(manyWords);
                  this.helpers.dismissProgress();
               }).catch((error) => {//END SELECT QUERY
                  console.log("sql:" + sql + ", ERROR:" + error.message);
                  this.showDictionary.loadResults = "Loaded 0 words.";
                  this.showDictionary.results = "Sorry. Error loading dictionary results."
                  this.helpers.dismissProgress();
               });
            }
         });
      }// if !is_one_word
   }

   showOneWordResults(words:any) {
      console.log("showOneWordResults called");
      this.showDictionary.words = [];
      if (words.length > 0) {
         this.showDictionary.words = words;
         this.showDictionary.loadResults = "Found " + words.length + " words.";
      } else {
         this.showDictionary.loadResults = "Sorry no records found.";
      }
   }

   showManyWordResults(words:any) {
      console.log();
      if (words.length > 0) {
         var uniqueLetters = words.map((word:any)=>{return word.Word[0].toUpperCase()}).filter(this.helpers.onlyUnique);
         console.log("GOT UNIQUE LETTERS: " + uniqueLetters);
         this.showDictionary.words = [];
         var matchedWords = [];
         var countNext = 0;
         uniqueLetters.forEach((letter:any)=>{
            matchedWords = words.filter((word:any)=>{return word.Word[0].toUpperCase()===letter;});
            this.showDictionary.words.push({
               "COUNT_NEXT":countNext,
               "LETTER": letter,
               "WORDS": matchedWords
            });
            countNext+=matchedWords.length;
         });
         console.log("GOT this.showDictionary.words = " + JSON.stringify(this.showDictionary.words));
         this.showDictionary.loadResults = "Loaded " + words.length + " words.";
      } else {
         this.showDictionary.loadResults = "Sorry no words found.";
      }
   }

}
