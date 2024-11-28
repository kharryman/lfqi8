//

import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, ModalController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Helpers } from '../../providers/helpers/helpers';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { ModalListPage } from '../../pages/modal-list/modal-list';


@Component({
   selector: 'page-alphabet-acrostics',
   templateUrl: 'alphabet-acrostics.html',
   styleUrl: 'alphabet-acrostics.scss'
})
export class AlphabetAcrosticsPage {
   public pageName: string = "Alphabet Acrostics";
   alphabetAcrostics: any;
   completeTables: any;
   alphabetDropdowns: any;
   button_color: string = "";
   button_gradient: string = "";
   user: any;

   constructor(public navCtrl: NavController, public modalCtrl: ModalController, public progress: LoadingController, public storage: Storage, public helpers: Helpers, private alertCtrl: AlertController) {
   }

   async ngOnInit() {
      this.alphabetAcrostics = {};
      Helpers.currentPageName = this.pageName;
      this.user = Helpers.User;
      await this.storage.create();
      this.alphabetAcrostics.acrosticWord = "";
      this.alphabetAcrostics.completeTables = [];
      this.alphabetAcrostics.selectedThemes = [];
      this.alphabetAcrostics.foundWords = [];
      this.alphabetAcrostics.isEnableMakeAcrostics = true;
      this.alphabetAcrostics.background_color = Helpers.background_color;
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;
      this.alphabetAcrostics.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor: any) => {
         this.alphabetAcrostics.background_color = bgColor;
      });
      this.alphabetAcrostics.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor: any) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
      });
      this.finishLoad();
   }

   saveStorage() {
      console.log("anagram-generator saveStorage called!");
      this.storage.set('ALPHABET_ACROSTICS_INPUT', this.alphabetAcrostics.acrosticWord).then(() => {
         this.storage.set('ALPHABET_ACCROSTICS_SELECTED_THEMES', JSON.stringify(this.alphabetAcrostics.selectedThemes)).then(() => {
         });
      });
   }

   finishLoad() {
      console.log('ionViewDidLoad AlphabetAcrosticsPage');
      var self = this;
      this.helpers.setProgress("Getting complete tables ... ", false).then(() => {
         this.storage.get("ALPHABET_ACROSTICS_INPUT").then((val) => {
            if (val != null) {
               this.alphabetAcrostics.acrosticWord = val;
            }
            if (Helpers.isWorkOffline === false) {
               this.helpers.makeHttpRequest("/lfq_directory/php/get_alphabet_tables_completed.php", "GET", {}).then((data) => {
                  this.helpers.dismissProgress();
                  if (data["SUCCESS"] === true) {
                     this.alphabetAcrostics.completeTables = data["COMPLETED_TABLES"];
                     this.showCompletedAlphabetTables();
                  } else {
                     this.helpers.alertLfqError(data["ERROR"]);
                  }
               }, error => {
                  this.helpers.dismissProgress();
                  this.helpers.alertServerError(error.message);
               });
            } else {//OFFLINE GET COMPLETED TABLES:
               //var sql_complete = "SELECT a.myTable FROM (SELECT Table_name AS myTable, COUNT(DISTINCT Letter) AS LETTER_COUNT FROM alphabet GROUP BY Table_name)a WHERE a.LETTER_COUNT='26'";
               var sql_complete = "SELECT * FROM (SELECT at.Table_name, COUNT(DISTINCT a.Letter) AS LETTER_COUNT FROM " + Helpers.TABLES_MISC.alphabet + " AS a INNER JOIN " + Helpers.TABLES_MISC.alphabet_table + " AS at ON at.ID=a.Table_ID GROUP BY at.Table_name)r WHERE r.LETTER_COUNT=26";
               this.helpers.query(Helpers.database_misc, sql_complete, 'query', []).then((data) => {
                  console.log("RETURNED FROM GET sql_complete data.values.length = " + data.values.length);
                  this.alphabetAcrostics.completeTables = [];
                  for (var i = 0; i < data.values.length; i++) {
                     console.log("PUSHING COMPLETED TABLE: " + data.values[i].Table_name);
                     this.alphabetAcrostics.completeTables.push(data.values[i].Table_name);
                  }
                  this.showCompletedAlphabetTables();
                  this.helpers.dismissProgress();
               });
            }
         });
      });
   }

   showCompletedAlphabetTables() {
      console.log("showCompletedAlphabetTables called");;
      console.log("this.alphabetAcrostics.completeTables=" + JSON.stringify(this.alphabetAcrostics.completeTables));
      this.alphabetAcrostics.completeTables.sort(this.compare_strings);
      this.storage.get("ALPHABET_ACCROSTICS_SELECTED_THEMES").then((val) => {
         if (val != null) {
            this.alphabetAcrostics.selectedThemes = JSON.parse(val);
            //REMOVE FROM COMPLETED TABLES:-------------------------->
            var index = -1;
            for (var i = 0; i < this.alphabetAcrostics.selectedThemes.length; i++) {
               index = this.alphabetAcrostics.completeTables.indexOf(this.alphabetAcrostics.selectedThemes[i]);
               if (index >= 0) {
                  this.alphabetAcrostics.completeTables.splice(index, 1);
               }
            }
            //------------------------------------------------------>
         }
      });
   }

   ionViewDidLeave() {
      console.log("ionViewDidLeave called");
      this.alphabetAcrostics.subscribedBackgroundColorEvent.unsubscribe();
      this.alphabetAcrostics.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   compare_strings(a: any, b: any) {
      if (a < b) return -1;
      else if (a > b) return 1;
      return 0;
   }

   addAlphabetAcrostics() {
      console.log("addAlphabetAcrostics called, alphabetAcrostics.selectedTheme=" + this.alphabetAcrostics.selectedTheme);
      if (!this.alphabetAcrostics.selectedTheme) {
         this.helpers.myAlert("ALERT", "No theme selected.", "", "Dismiss");
         return;
      }
      if (this.alphabetAcrostics.selectedThemes.length > 10) {
         this.helpers.myAlert("ALERT", "Can select at most 10 themes.", "", "Dismiss");
         return;
      } else {
         this.alphabetAcrostics.selectedThemes.push(this.alphabetAcrostics.selectedTheme);
         var index = this.alphabetAcrostics.completeTables.indexOf(this.alphabetAcrostics.selectedTheme);
         console.log("completeTables index=" + index);
         if (index >= 0) {
            this.alphabetAcrostics.completeTables.splice(index, 1);
         }
      }
      this.alphabetAcrostics.selectedTheme = null;
      console.log("this.alphabetAcrostics.selectedThemes=" + this.alphabetAcrostics.selectedThemes);
   }

   removeAlphabetAcrostics(index: any) {
      console.log("removeAlphabetAcrostics called, selected theme to remove=" + this.alphabetAcrostics.selectedThemes[index]);
      if (this.alphabetAcrostics.selectedThemes.length >= 1) {
         console.log("PUSHING this.alphabetAcrostics.selectedThemes[index]this.alphabetAcrostics.selectedThemes[index]=" + this.alphabetAcrostics.selectedThemes[index]);
         this.alphabetAcrostics.completeTables.push(this.alphabetAcrostics.selectedThemes[index]);
         this.alphabetAcrostics.completeTables.sort(this.compare_strings);
         this.alphabetAcrostics.selectedThemes.splice(index, 1);
      }
   }

   makeAlphabetAcrostics() {
      console.log("makeAlphabetAcrostics called, this.alphabetAcrostics.acrosticWord=" + JSON.stringify(this.alphabetAcrostics.acrosticWord));
      if (!this.alphabetAcrostics.acrosticWord || this.alphabetAcrostics.acrosticWord.trim() === '') {
         this.helpers.myAlert("ALERT", "Need to input an acrostic word.", "", "Dismiss");
         return;
      }
      if (this.alphabetAcrostics.selectedThemes.length === 0) {
         this.helpers.myAlert("ALERT", "Need to select one or more themes.", "", "Dismiss");
         return;
      }
      var acrostic_word_split = this.alphabetAcrostics.acrosticWord.toUpperCase().split("");
      var unique_letters = acrostic_word_split.filter((value: any, index: any, self: any) => {
         return self.indexOf(value) === index;
      });
      this.helpers.setProgress("Getting alphabet acrostics ... ", false).then(() => {
         this.alphabetAcrostics.isEnableMakeAcrostics = false;
         this.alphabetAcrostics.results = "";
         console.log("this.alphabetAcrostics.selectedThemes = " + this.alphabetAcrostics.selectedThemes);
         console.log("unique_letters = " + unique_letters);
         this.alphabetAcrostics.foundWords = [];

         if (Helpers.isWorkOffline === false) {
            var params = {
               "selectedThemes": this.alphabetAcrostics.selectedThemes,
               "uniqueLetters": unique_letters
            }
            this.helpers.makeHttpRequest("/lfq_directory/php/get_alphabet_tables_completed_entries.php", "POST", params).then((data) => {
               this.helpers.dismissProgress();
               if (data["SUCCESS"] === true) {
                  this.showCompletedAlphabetEntries(data["ENTRIES"], unique_letters);
               } else {
                  this.helpers.alertLfqError(data["ERROR"]);
               }
            }, error => {
               this.helpers.dismissProgress();
               this.helpers.alertServerError(error.message);
            });
         } else {//OFFLINE makeAlphabetAcrostics
            var sql_string = "SELECT a.*,at.Table_name FROM " + Helpers.TABLES_MISC.alphabet + " AS a INNER JOIN " + Helpers.TABLES_MISC.alphabet_table + " AS at ON at.ID=a.Table_ID WHERE at.Table_name IN ('" + this.alphabetAcrostics.selectedThemes.join("','") + "') AND Letter IN ('" + unique_letters.join("','") + "') ORDER BY a.Letter, at.Table_name";
            console.log("makeAlphabetAcrostics sql_string = " + sql_string);
            this.helpers.query(Helpers.database_misc, sql_string, 'query', []).then((data) => {
               var entries = [];
               for (var i = 0; i < data.values.length; i++) {
                  entries.push(data.values[i]);
               }
               this.showCompletedAlphabetEntries(entries, unique_letters);
               this.helpers.dismissProgress();
            });
         }
      });
   }

   showCompletedAlphabetEntries(entries: any, unique_letters: any) {
      console.log("showCompeltedAlphabetEntries called");
      console.log("makeAlphabetAcrostics #ROWS = " + entries.length);
      this.alphabetAcrostics.totalEntries = entries.length;
      var letterIndex: any = -1;
      var themeIndex: any = -1;
      var selectedThemesOrdered = this.alphabetAcrostics.selectedThemes.slice().sort(this.compare_strings);
      console.log("selectedThemesOrdered = " + JSON.stringify(selectedThemesOrdered));
      for (var i = 0; i < unique_letters.length; i++) {
         this.alphabetAcrostics.foundWords.push({ "Letter": unique_letters[i], "tables": [], "numberLetterEntries": 0 });
         for (var j = 0; j < selectedThemesOrdered.length; j++) {
            this.alphabetAcrostics.foundWords[i].tables.push({ "Table_name": selectedThemesOrdered[j], "words": [] });
         }
      }
      for (var i = 0; i < entries.length; i++) {
         letterIndex = this.helpers.getIndex(this.alphabetAcrostics.foundWords, "Letter", entries[i].Letter);
         console.log("GETTING THEME BY Table_name = " + entries[i].Table_name);
         themeIndex = Helpers.getIndex(selectedThemesOrdered, entries[i].Table_name);
         this.alphabetAcrostics.foundWords[letterIndex]["tables"][themeIndex]["words"].push(entries[i].Entry);
         this.alphabetAcrostics.foundWords[letterIndex]["numberLetterEntries"]++;
      }
      console.log("this.alphabetAcrostics.foundWords = " + JSON.stringify(this.alphabetAcrostics.foundWords));
      this.alphabetAcrostics.isEnableMakeAcrostics = true;
      //this.alphabetAcrostics.loadResults = 
      //this.alphabetAcrostics.results = htmlText;      
   }

   async showAlphabetTables() {
      console.log("showSuggestedWords called");
      // Create the modal
      var itemRet = {};
      var tablesRemove: Array<string> = [
         "adjective", "adjectiveage", "adjectivecolor", "adjectiveintensity", "adjectivematerial", "adjectivenationality", "adjectivenumber", "adjectivequality", "adjectivereligion", "adjectiveshape", "adjectivesize", "adjectivetexture"
      ];
      var items = this.alphabetAcrostics.completeTables.filter((item:any)=>{return tablesRemove.indexOf(item)<0}).map((item: any) => {
         itemRet = { "name": item };
         return itemRet;
      });
      let modal = await this.modalCtrl.create({
         component: ModalListPage,
         componentProps: {
            "items": items,
            "title": "Completed Alphabet Tables"
         }
      });
      // Handle the result
      modal.onDidDismiss().then((item: any) => {
         if (item && item.name) {
            console.log("SELECTED item: ", item);
            this.alphabetAcrostics.selectedTheme = item.data.name;
         }
      });
      await modal.present();
   }
}

