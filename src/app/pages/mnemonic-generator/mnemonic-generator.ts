import { Component, AfterViewInit } from '@angular/core';
import { NavController, LoadingController, AlertController, Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';
import { Helpers } from '../../providers/helpers/helpers';
import { NgZone } from '@angular/core';
import { Subscription } from 'rxjs';


@Component({
   selector: 'page-mnemonic-generator',
   templateUrl: 'mnemonic-generator.html',
   styleUrl: 'mnemonic-generator.scss'
})
export class MnemonicGeneratorPage {
   public pageName: string = "Mnemonics Generator";
   mnemonicGenerator: any = {};
   public database_misc: SQLiteDBConnection | null = null;
   user: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   private onPauseSubscription: Subscription;

   constructor(public navCtrl: NavController, private platform: Platform, public progress: LoadingController, public storage: Storage, private alertCtrl: AlertController, public helpers: Helpers, public ngZone: NgZone) {
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
      Helpers.currentPageName = this.pageName;
      this.user = Helpers.User;
      await this.storage.create();
      console.log("ngOnInit called");
      this.mnemonicGenerator = {};
      this.mnemonicGenerator.isShowTable = false;
      this.mnemonicGenerator.isAble = false;
      this.mnemonicGenerator.input = "";
      this.mnemonicGenerator.themes = [];
      this.mnemonicGenerator.adjectives = [];
      this.mnemonicGenerator.showMethod = "TABLE";
      this.mnemonicGenerator.inputList = [];
      this.mnemonicGenerator.wordsArray = [];
      this.mnemonicGenerator.comboArray = [];
      this.mnemonicGenerator.comboWords = [];
      this.mnemonicGenerator.selectedAdjective;
      this.mnemonicGenerator.selectedTheme;
      this.mnemonicGenerator.specialMatch = false;
      this.mnemonicGenerator.wordIndex = 0;
      this.mnemonicGenerator.comboIndex = 0;

      this.mnemonicGenerator.isShowingMenu = false;
      this.mnemonicGenerator.subscribedMenuToolbarEvent = this.helpers.menuToolbarEvent.subscribe((isShown) => {
         this.mnemonicGenerator.isShowingMenu = isShown;
      });
      this.background_color = Helpers.background_color;
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;
      this.mnemonicGenerator.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor: any) => {
         this.background_color = bgColor;
      });
      this.mnemonicGenerator.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor: any) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
      });
   }

   async ngAfterViewInit() {
      console.log('ngAfterViewInit MnemonicGeneratorPage');
      var catNames: any = [];
      await this.helpers.setProgress("Loading, please wait......", false);
      var val: any = await this.storage.get('MNEMONIC_GENERATOR_INPUT');
      if (val != null) {
         this.mnemonicGenerator.input = val;
      }
      val = await this.storage.get('MNEMONIC_GENERATOR_SHOW_METHOD');
      if (val != null) {
         this.mnemonicGenerator.showMethod = val;
      }
      await this.helpers.setProgress("Loading categories, please wait......", true);
      if (Helpers.isWorkOffline === false) {
         var data: any = null;
         try {
            data = await this.helpers.makeHttpRequest("/lfq_directory/php/mnemonic_generator_initiate.php", "GET", null);
         } catch (error: any) {
            this.helpers.dismissProgress();
            this.helpers.alertLfqError(error.message);
         }
         if (data["SUCCESS"] === true) {
            if (data["THEMES"] && data["THEMES"].length > 0) {
               this.mnemonicGenerator.themes = data["THEMES"];
               this.mnemonicGenerator.selectedTheme = this.mnemonicGenerator.themes[0];
            }
            if (data["ADJECTIVES"] && data["ADJECTIVES"].length > 0) {
               this.mnemonicGenerator.adjectives = data["ADJECTIVES"];
               this.mnemonicGenerator.selectedAdjective = this.mnemonicGenerator.adjectives[0];
            }
            val = await this.storage.get('MNEMONIC_GENERATOR_SELECTED_THEME');
            if (val != null && data["THEMES"].length > 0) {
               this.mnemonicGenerator.selectedTheme = val;
            }
            val = await this.storage.get('MNEMONIC_GENERATOR_SELECTED_ADJECTIVE');
            if (val != null && data["ADJECTIVES"].length > 0) {
               this.mnemonicGenerator.selectedAdjective = val;
            }
            this.helpers.dismissProgress();
         } else {
            this.helpers.dismissProgress();
            this.helpers.alertLfqError(data["ERROR"]);
         }
      } else {//OFFLINE INITIATE MNEMONICS:
         var sql = "SELECT DISTINCT Category FROM " + Helpers.TABLES_MISC.alphabet_table + " ORDER BY Category";
         var data: any = null;
         try {
            this.helpers.query(Helpers.database_misc, sql, []);
         } catch (error: any) {
            console.log("sql:" + sql + ", ERROR:" + error.message);
            this.helpers.dismissProgress();
         }
         if (data && data.rows.length > 0) {
            for (var i = 0; i < data.rows.length; i++) {
               catNames.push(data.rows.item(i).Category);
            }
         }
         var adj_types = ["Opposites", "Shapes", "Times"];
         var theme_types = ["Colors", "Directions", "Materials", "Nationalities", "Number", "Religions"];
         for (var i = 0; i < catNames.length; i++) {// Add to themes if new Type Table:....
            if (theme_types.indexOf(catNames[i]) < 0
               && adj_types.indexOf(catNames[i]) < 0) {
               if (catNames[i] !== "_id") {
                  theme_types.push(catNames[i]);
               }
            }
         }
         // GET AND ADD ALL ALPHABET TABLES:----------------------------
         await this.helpers.setProgress("Loading alphabet tables, please wait......", true);
         sql = "SELECT Table_name FROM " + Helpers.TABLES_MISC.alphabet_table + " ORDER BY Table_name";

         data = await this.helpers.query(Helpers.database_misc, sql, []);
         var tabs = [];
         if (data.rows.length > 0) {
            for (var i = 0; i < data.rows.length; i++) {
               tabs.push(data.rows.item(i).Table_name);
            }
         }
         await this.helpers.setProgress("Loading themes, please wait......", true);
         sql = "SELECT Table_name FROM " + Helpers.TABLES_MISC.alphabet_table + " WHERE Category IN ('" + theme_types.join("','") + "') AND Is_Complete='1' ORDER BY Category, Table_name";
         data = await this.helpers.query(Helpers.database_misc, sql, []);
         if (data.rows.length > 0) {
            for (var i = 0; i < data.rows.length; i++) {
               this.mnemonicGenerator.themes.push(data.rows.item(i).Table_name);
            }
            this.mnemonicGenerator.selectedTheme = this.mnemonicGenerator.themes[0];
         }
         val = await this.storage.get('MNEMONIC_GENERATOR_SELECTED_THEME');
         if (val != null && data.rows.length > 0) {
            this.mnemonicGenerator.selectedTheme = val;
         }
         await this.helpers.setProgress("Loading adjective types, please wait......", true);
         sql = "SELECT Table_name FROM " + Helpers.TABLES_MISC.alphabet_table + " WHERE Category IN ('" + adj_types.join("','") + "') AND Is_Complete='1' ORDER BY Category, Table_name";
         try {
            data = await this.helpers.query(Helpers.database_misc, sql, []);
         } catch (error: any) {
            console.log("sql:" + sql + ", ERROR:" + error.message);
            this.helpers.dismissProgress();
         }
         if (data && data.rows.length > 0) {
            for (var i = 0; i < data.rows.length; i++) {
               this.mnemonicGenerator.adjectives.push(data.rows.item(i).Table_name);
            }
            this.mnemonicGenerator.selectedAdjective = this.mnemonicGenerator.adjectives[0];
         }
         val = await this.storage.get('MNEMONIC_GENERATOR_SELECTED_ADJECTIVE');
         if (val != null && data.rows.length > 0) {
            this.mnemonicGenerator.selectedAdjective = val;
         }
         this.helpers.dismissProgress();
      }
   }

   ionViewWillLeave() {
      console.log('ionViewWillLeave MnemonicGeneratorPage');
      this.mnemonicGenerator.subscribedMenuToolbarEvent.unsubscribe();
      this.mnemonicGenerator.subscribedBackgroundColorEvent.unsubscribe();
      this.mnemonicGenerator.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   saveStorage() {
      console.log("saveStorage called");
      this.storage.set('MNEMONIC_GENERATOR_INPUT', this.mnemonicGenerator.input).then(() => {
         console.log('ionViewWillLeave MnemonicGeneratorPage setting MNEMONIC_GENERATOR_SELECTED_ADJECTIVE=' + this.mnemonicGenerator.selectedAdjective);
         this.storage.set('MNEMONIC_GENERATOR_SELECTED_ADJECTIVE', this.mnemonicGenerator.selectedAdjective).then(() => {
            console.log('ionViewWillLeave MnemonicGeneratorPage setting MNEMONIC_GENERATOR_SELECTED_THEME=' + this.mnemonicGenerator.selectedTheme);
            this.storage.set('MNEMONIC_GENERATOR_SELECTED_THEME', this.mnemonicGenerator.selectedTheme).then(() => {
               this.storage.set('MNEMONIC_GENERATOR_SHOW_METHOD', this.mnemonicGenerator.showMethod).then(() => {
               });
            });
         });
      });
   }

   goBackUp() {
      this.mnemonicGenerator.isShowTable = false;
   }

   doCreateMnemonics() {
      console.log("doCreateMnemonics called. selectedAdjective = " + this.mnemonicGenerator.selectedAdjective + " , selectedTheme=" + this.mnemonicGenerator.selectedTheme);
      if (this.mnemonicGenerator.input == null || this.mnemonicGenerator.input.trim() === '') {
         this.helpers.myAlert("ALERT", "<b>Need to input a list of words to mnemonicize...</b>", "", "Dismiss");
         return;
      }
      this.mnemonicGenerator.isShowTable = true;
      this.helpers.setProgress("Loading mnemonics ,please wait...", false).then(() => {
         this.mnemonicGenerator.inputList = this.mnemonicGenerator.input.toUpperCase().split(" ");
         //BOOLEANS:
         this.mnemonicGenerator.isAble = true;
         this.mnemonicGenerator.specialMatch = false;
         //-----

         if (this.mnemonicGenerator.selectedAdjective === "numbers") {
            this.mnemonicGenerator.selectedAdjective = "adjectivenumber";
         }
         if (this.mnemonicGenerator.selectedAdjective === "colors") {
            this.mnemonicGenerator.selectedAdjective = "adjectivecolor";
         }
         this.mnemonicGenerator.abc_string = "abcdefghijklmnopqrstuvwxyz";
         this.mnemonicGenerator.columnNames = [
            { "name": "specialNouns", "value": this.mnemonicGenerator.selectedTheme, "type": "other" },
            { "name": "prepositions", "value": "preposition", "type": "other" },
            { "name": "conjunctions", "value": "conjunction", "type": "other" },
            { "name": "chosenAdjectives", "value": this.mnemonicGenerator.selectedAdjective, "type": "other" },
            { "name": "verbs", "value": "verb", "type": "normal" },
            { "name": "adverbs", "value": "adv.", "type": "normal" },
            { "name": "nouns", "value": "noun", "type": "normal" },
            { "name": "adjectives", "value": "adj.", "type": "normal" }
         ];
         this.mnemonicGenerator.tableArrayString = ["other", "verb", "adverb", "standard noun", "standard adjective"];
         this.mnemonicGenerator.tableArraySpecialString = [
            { "name": "special noun", "value": "specialNouns" },
            { "name": "preposition", "value": "prepostions" },
            { "name": "conjunction", "value": "conjunctions" },
            { "name": "chosen adjective", "value": "chosenAdjectives" }
         ];
         this.mnemonicGenerator.tableColumnsNormal = ["verbs", "adverbs", "nouns", "adjectives"];

         var input_list_word_split = [];
         console.log("this.mnemonicGenerator.showMethod=" + this.mnemonicGenerator.showMethod);
         if (this.mnemonicGenerator.showMethod === "COMBINATIONS") {
            this.mnemonicGenerator.comboIndex = 0;
            this.mnemonicGenerator.partSpeechList = [];
            this.mnemonicGenerator.partSpeechArray = [];
            if (this.mnemonicGenerator.inputList.length < 3) {
               this.mnemonicGenerator.isAble = false;
               this.helpers.myAlert("ALERT", "<b>Need to input a list of 3 or more words to create sentences.</b>", "", "Dismiss");
               this.helpers.dismissProgress();
               return;
            } else {
               this.mnemonicGenerator.comboWords = [];
               var jlen = this.mnemonicGenerator.inputList.length - 3;

               if (Helpers.isWorkOffline === false) {
                  var params = {
                     "numberWords": String(this.mnemonicGenerator.inputList.length),
                     "selectedTheme": this.mnemonicGenerator.selectedTheme,
                     "selectedAdjective": this.mnemonicGenerator.selectedAdjective
                  }
                  this.helpers.makeHttpRequest("/lfq_directory/php/mnemonic_generator_get_combos.php", "GET", params).then((data) => {
                     if (data["SUCCESS"] === true) {
                        this.mnemonicGenerator.comboArray = data["COMBOS"];
                        this.mnemonicGenerator.partSpeechList = this.mnemonicGenerator.comboArray[this.mnemonicGenerator.comboIndex];
                        this.finishInitializingCombos();
                        //this.doCombo(0);
                        this.createMnemonics();
                     } else {
                        this.helpers.dismissProgress();
                        this.helpers.alertLfqError(data["ERROR"]);
                     }
                  }, error => {
                     this.helpers.dismissProgress();
                     this.helpers.alertServerError(error.message);
                  });
               } else {//OFFLINE DO COMBOS:
                  //`ID`, `Number_Words`, `Combo_Number`, `Partspeech_Number`, `Partspeech`
                  var sql_string = "SELECT mc.*,p.PartSpeech FROM " + Helpers.TABLES_MISC.mnemonic_combination + " AS mc ";
                  sql_string += "INNER JOIN " + Helpers.TABLES_MISC.part_speech + " AS p ON p.ID=mc.Part_Speech_ID ";
                  sql_string += "WHERE mc.Number_Words='" + this.mnemonicGenerator.inputList.length + "' ";
                  sql_string += "ORDER BY mc.Combo_Number, mc.Part_Speech_ID";
                  this.helpers.query(Helpers.database_misc, sql_string, []).then((data) => {
                     this.mnemonicGenerator.comboArray = [];
                     var comboObj: any = {};
                     var comboNumber = 0;
                     for (var i = 0; i < data.rows.length; i++) {
                        if (data.rows.item(i)["Combo_Number"] != comboNumber) {
                           this.mnemonicGenerator.comboArray.push([]);
                           comboNumber++;
                        }
                        comboObj = {};
                        if (data.rows.item(i)["Is_Special"] == '0') {
                           if (data.rows.item(i)["PartSpeech"] == "SELECTED_THEME") {
                              comboObj["name"] = this.mnemonicGenerator.selectedTheme;
                              comboObj["value"] = this.mnemonicGenerator.selectedTheme;
                           }
                           else if (data.rows.item(i)["PartSpeech"] == "SELECTED_ADJECTIVE") {
                              comboObj["name"] = this.mnemonicGenerator.selectedAdjective;
                              comboObj["value"] = this.mnemonicGenerator.selectedAdjective;
                           }
                           else {
                              comboObj["name"] = data.rows.item(i)["PartSpeech"];
                              comboObj["value"] = data.rows.item(i)["PartSpeech"];
                           }
                        } else {
                           comboObj["name"] = "Special";
                           comboObj["value"] = data.rows.item(i)["PartSpeech"].split(",");
                        }
                        this.mnemonicGenerator.comboArray[(comboNumber - 1)].push(comboObj);
                     }
                     console.log("this.mnemonicGenerator.comboArray = " + JSON.stringify(this.mnemonicGenerator.comboArray));
                     this.finishInitializingCombos();
                     //this.doCombo(0);
                     this.createMnemonics();
                  });
               }
            }
         }
         else if (this.mnemonicGenerator.showMethod === "TABLE") {
            this.mnemonicGenerator.wordIndex = 0;
            this.mnemonicGenerator.wordsArray = [];
            var wordObject;
            for (var i = 0; i < this.mnemonicGenerator.inputList.length; i++) {
               wordObject = {
                  "WORD_FOUND": false,
                  "WORD_PARTSPEECH": "",
                  "WORD_DEFINITION": "",
                  "isFetched": false,
                  "word": this.mnemonicGenerator.inputList[i],
                  "other": {
                     "specialNouns": [],
                     "prepositions": [],
                     "conjuctions": [],
                     "chosenAdjectives": []
                  },
                  "verbs": [],
                  "adverbs": [],
                  "nouns": [],
                  "adjectives": []
               };
               this.mnemonicGenerator.wordsArray.push(wordObject);
            }
            //this.getPartsSpeechInputListWord(0, 0);
            this.createMnemonics();
         }
      });
   }// end function makeMnemonics()

   finishInitializingCombos() {
      console.log("finishInitializingCombos called");
      this.mnemonicGenerator.partSpeechStringList = [];
      var partSpeechStringArray = [];
      this.mnemonicGenerator.combosDone = [];
      for (var i = 0; i < this.mnemonicGenerator.comboArray.length; i++) {
         this.mnemonicGenerator.comboWords.push([]);
         this.mnemonicGenerator.partSpeechArray.push([]);
         partSpeechStringArray = [];
         for (var j = 0; j < this.mnemonicGenerator.comboArray[i].length; j++) {
            this.mnemonicGenerator.partSpeechArray[i].push(this.mnemonicGenerator.comboArray[i][j]);
            if (this.mnemonicGenerator.comboArray[i][j].name === "Special") {
               partSpeechStringArray.push("Special");
            } else {
               partSpeechStringArray.push(this.mnemonicGenerator.comboArray[i][j].name);
            }
         }
         this.mnemonicGenerator.combosDone.push(false);
         //FOR PROMPTING EACH COMBO'S PART SPEECH'S:
         this.mnemonicGenerator.partSpeechStringList.push(partSpeechStringArray.join(","));
      }
   }

   getLast() {
      console.log("getLast called, this.mnemonicGenerator.showMethod = " + this.mnemonicGenerator.showMethod);
      if (this.mnemonicGenerator.showMethod === 'TABLE') {
         if (this.mnemonicGenerator.wordIndex > 0) {
            this.mnemonicGenerator.wordIndex--;
            //this.getPartsSpeechInputListWord(0, this.mnemonicGenerator.wordIndex);
            this.createMnemonics();
         }
      } else if (this.mnemonicGenerator.showMethod === 'COMBINATIONS') {
         if (this.mnemonicGenerator.comboIndex > 0) {
            this.mnemonicGenerator.comboIndex--;
            //this.doCombo(this.mnemonicGenerator.comboIndex);
            this.createMnemonics();
         }
      }
   }

   getNext() {
      console.log("getNext called, this.mnemonicGenerator.showMethod = " + this.mnemonicGenerator.showMethod);
      if (this.mnemonicGenerator.showMethod === 'TABLE') {
         if (this.mnemonicGenerator.wordIndex < (this.mnemonicGenerator.inputList.length - 1)) {
            this.mnemonicGenerator.wordIndex++;
            //this.getPartsSpeechInputListWord(0, this.mnemonicGenerator.wordIndex);
            this.createMnemonics();
         }
      } else if (this.mnemonicGenerator.showMethod === 'COMBINATIONS') {
         if (this.mnemonicGenerator.comboIndex < (this.mnemonicGenerator.comboArray.length - 1)) {
            this.mnemonicGenerator.comboIndex++;
            //this.doCombo(this.mnemonicGenerator.comboIndex);
            this.createMnemonics();
         }
      }
   }
   getWord(parent_index: number) {
      console.log("getWord called, parent_index = " + parent_index);
      this.mnemonicGenerator.wordIndex = parent_index;
      //this.getPartsSpeechInputListWord(0, parent_index);
      this.createMnemonics();
   }

   getCombo(comboIndex: number) {
      console.log("getCombo called, comboIndex = " + comboIndex);
      this.mnemonicGenerator.comboIndex = comboIndex;
      //this.doCombo(comboIndex);      
      this.createMnemonics();
   }



   createMnemonics() {
      console.log("createMnemonics called");
      //var liststr=document.getElementById("list").value;      
      console.log(" this.mnemonicGenerator.input = " + this.mnemonicGenerator.input);
      var partSpeechList: any = [];
      var comboIndex = this.mnemonicGenerator.comboIndex;
      if (this.mnemonicGenerator.showMethod === 'COMBINATIONS') {
         if (this.mnemonicGenerator.inputList.length < 3) {
            alert("MUST ENTER 3 OR MORE");
            return;
         }
         if (this.mnemonicGenerator.combosDone[comboIndex] === true) {
            return;
         }
         partSpeechList = this.mnemonicGenerator.comboArray[comboIndex];
         console.log("createMnemonics COMBINATIONS partSpeechList = " + JSON.stringify(partSpeechList));
      } else if (this.mnemonicGenerator.showMethod === 'TABLE') {
         if (this.mnemonicGenerator.wordsArray[this.mnemonicGenerator.wordIndex].isFetched === true) {
            return;
         }
      }
      var progressMessage = this.mnemonicGenerator.showMethod === 'TABLE' ? "Loading table mnemonics, please wait..." : "Loading combination mnemonics, please wait...";
      this.helpers.setProgress(progressMessage, false).then(() => {

         this.mnemonicGenerator.isShowTable = true;
         var inputWord = this.mnemonicGenerator.inputList[this.mnemonicGenerator.wordIndex];
         console.log("createMnemonics this.mnemonicGenerator.inputList = " + this.mnemonicGenerator.inputList + ", inputWord = " + inputWord);
         //BOOLEANS:
         this.mnemonicGenerator.isAble = true;
         this.mnemonicGenerator.specialMatch = false;
         //-----
         if (this.mnemonicGenerator.selectedAdjective === "numbers") {
            this.mnemonicGenerator.selectedAdjective = "adjectivenumber";
         }
         if (this.mnemonicGenerator.selectedAdjective === "colors") {
            this.mnemonicGenerator.selectedAdjective = "adjectivecolor";
         }
         this.mnemonicGenerator.columnNames = [
            { "name": "specialNouns", "value": this.mnemonicGenerator.selectedTheme, "type": "other" },
            { "name": "prepositions", "value": "preposition", "type": "other" },
            { "name": "conjunctions", "value": "conjunction", "type": "other" },
            { "name": "chosenAdjectives", "value": this.mnemonicGenerator.selectedAdjective, "type": "other" },
            { "name": "verbs", "value": "verb", "type": "normal" },
            { "name": "adverbs", "value": "adv.", "type": "normal" },
            { "name": "nouns", "value": "noun", "type": "normal" },
            { "name": "adjectives", "value": "adj.", "type": "normal" }
         ];
         if (Helpers.isWorkOffline === false) {//ONLINE CREATE MNEMONICS:
            var params = {
               "comboIndex": comboIndex,
               "showMethod": this.mnemonicGenerator.showMethod,//'TABLE' or 'COMBINATIONS'
               "inputList": this.mnemonicGenerator.inputList,
               "partSpeechList": partSpeechList,
               "inputWord": inputWord,
               "selectedTheme": this.mnemonicGenerator.selectedTheme,
               "selectedAdjective": this.mnemonicGenerator.selectedAdjective
            };
            this.helpers.makeHttpRequest('/lfq_directory/php/mnemonic_generator_generate.php', "POST", params).then((data) => {
               console.log("RETURNED FROM mnemonic_generator_generate.php");
               if (this.mnemonicGenerator.showMethod === "TABLE") {
                  this.finishWord(data);
               } else if (this.mnemonicGenerator.showMethod === "COMBINATIONS") {
                  this.finishCombo(data);
               }
               this.helpers.dismissProgress();
            }, (error) => {
               this.mnemonicGenerator.pleasewait = "";
               this.helpers.dismissProgress();
               this.helpers.alertServerError(error.message);
            });
         } else {//OFFLINE CREATE MNEMONICS:
            var showMethod = this.mnemonicGenerator.showMethod;
            var inputList = this.mnemonicGenerator.inputList;
            var selectedTheme = this.mnemonicGenerator.selectedTheme.toLowerCase();
            var selectedAdjective = this.mnemonicGenerator.selectedAdjective.toLowerCase();
            if (selectedAdjective == "numbers") { selectedAdjective = "adjectivenumber"; }
            if (selectedAdjective == "colors") { selectedAdjective = "adjectivecolor"; }
            var abcs = "abcdefghijklmnopqrstuvwxyz";
            var table_array = [selectedTheme, "preposition", "conjunction", selectedAdjective, "verb", "adv.", "noun", "adj."];
            var table_array_names = ["specialNouns", "prepositions", "conjunctions", "chosenAdjectives", "verbs", "adverbs", "nouns", "adjectives"];
            var tableArrayString = ["other", "verb", "adverb", "standard noun", "standard adjective"];
            var tableArrayStringLength = tableArrayString.length;
            var tabarrspestr = ["special noun", "preposition", "conjunction", "chosen adjective"];
            var tabarrspestrlen = tabarrspestr.length;
            var dictionaryPartSpeechArr = ["verb", "adv.", "noun", "adj.", "pre.", "con.", "pro.", "aux.", "art."];
            var dictionaryPartSpeechArrLong = ["verb", "adverb", "noun", "adjective"];
            var dictionaryPartSpeechGetArr = table_array.filter((ps) => {
               return dictionaryPartSpeechArr.indexOf(ps) >= 0;
            });
            var response: any = {};
            response["WORDS"] = [];
            var totalData = [];
            if (this.mnemonicGenerator.showMethod === "TABLE") {
               response["WORD_FOUND"] = false;
               var word_split = inputWord.split("");
               var alphabetPartSpeechGetArr = table_array.filter((ps) => {
                  return dictionaryPartSpeechArr.indexOf(ps) < 0;
               });
               var sql_string1 = "SELECT d.*,p.PartSpeech FROM dictionarya AS d ";
               sql_string1 += "INNER JOIN part_speech AS p ON p.ID=d.Part_Speech_ID ";
               sql_string1 += "WHERE d.Word LIKE '" + word_split[0] + "%' ";
               sql_string1 += "AND p.PartSpeech IN ('" + dictionaryPartSpeechGetArr.join("','") + "') ";
               sql_string1 += "ORDER BY d.Word";
               for (var ps = 0; ps < table_array_names.length; ps++) {
                  response["WORDS"][table_array_names[ps]] = [];
               }
               this.helpers.query(Helpers.database_misc, sql_string1, []).then((dicData) => {
                  var myDicData: any = [];
                  for (var d = 0; d < dicData.rows.length; d++) {
                     myDicData.push(dicData.rows.item(d));
                  }
                  var sql_string2 = "SELECT a.Entry as Word, at.Table_name AS PartSpeech FROM alphabet AS a ";
                  sql_string2 += "INNER JOIN alphabet_table AS at ON at.ID=a.Table_ID ";
                  sql_string2 += "WHERE at.Table_name IN ('" + alphabetPartSpeechGetArr.join("','") + "') ";
                  sql_string2 += "AND a.Letter='" + word_split[0] + "'";
                  this.helpers.query(Helpers.database_misc, sql_string2, []).then((alpData) => {
                     var myAlpData: any = [], select_word = "", definition = "", indexDefinition = -1, alpEntry: any = {};
                     for (var a = 0; a < alpData.rows.length; a++) {
                        alpEntry = alpData.rows.item(a);
                        alpEntry["Definition"] = "";
                        indexDefinition = alpEntry["Word"].search(/[^A-Za-z]/);
                        if (indexDefinition >= 0) {
                           alpEntry["Word"] = alpEntry["Word"].substring(0, indexDefinition);
                           alpEntry["Definition"] = alpEntry["Word"].substring(indexDefinition);
                        }
                        myAlpData.push(alpEntry);
                     }
                     var part_speech = "", isDictionary = false, matchedPartSpeechWords = [];
                     for (var ta = 0; ta < table_array.length; ta++) {
                        isDictionary = false;
                        if (dictionaryPartSpeechArr.indexOf(table_array[ta]) >= 0) isDictionary = true;
                        if (isDictionary === true) {
                           matchedPartSpeechWords = myDicData.filter((word: any) => { return word.PartSpeech === table_array[ta] });
                        } else {
                           matchedPartSpeechWords = myAlpData.filter((word: any) => { return word.PartSpeech === table_array[ta] });
                        }
                        if (matchedPartSpeechWords.length > 0) {
                           response["WORD_FOUND"] = true;
                           response["WORD_PARTSPEECH"] = table_array[ta];
                           response["WORD_DEFINITION"] = matchedPartSpeechWords[0].Definition;
                        }
                        for (var w = 0; w < matchedPartSpeechWords.length; w++) {
                           select_word = matchedPartSpeechWords[w].Word;
                           definition = matchedPartSpeechWords[w].Definition;
                           var matchCount = 0;
                           for (var x = 5; x > 0; x--) {
                              if (select_word.length >= x && inputWord.length >= x && select_word.toLowerCase().substring(0, x) === inputWord.toLowerCase().substring(0, x)) {
                                 matchCount = x;
                                 break;
                              }
                           }
                           var wordObj: any = {};
                           wordObj["word"] = select_word;
                           wordObj["matchCount"] = matchCount;
                           wordObj["part_speech"] = table_array[ta];
                           wordObj["definition"] = definition;
                           response["WORDS"][table_array_names[ta]].push(wordObj);
                        }
                     }
                     this.finishWord(response);
                  });
               });
            } else if (this.mnemonicGenerator.showMethod === "COMBINATIONS") {
               var recspc: any = [];
               var specialMatch = false;
               var special_one = "";
               var count_speech = 0;
               var input_list_word_split: any = [];
               var isAble = true;
               var part_speech = "";
               var input_list_letter_array: any = [];
               var whereAlphabetSQL: any = [];
               var whereDictionarySQL: any = [];
               var wordObject: any = {};
               var specialMatched = true;
               var comboDicWheres: any = [];
               var comboAlpWheres: any = [];
               var isDictionary = false;

               for (var q = 0; q < inputList.length; q++) {
                  response["WORDS"].push([]);
                  part_speech = partSpeechList[q]["name"];
                  console.log("COMBOS.. SETTING UP PARTSPEECH = " + part_speech);
                  input_list_word_split = inputList[q].split("");
                  if (input_list_letter_array.indexOf(input_list_word_split[0]) < 0) {
                     input_list_letter_array.push(input_list_word_split[0]);
                  }
                  if (partSpeechList[q]["name"] == "Special") {
                     input_list_word_split = inputList[q].split("");
                     count_speech++;
                     specialMatch = true;
                     specialMatched = false;
                     var special_one = "";
                     for (var m = 0; m < partSpeechList[q]["value"].length; m++) {
                        special_one = partSpeechList[q]["value"][m];
                        for (var n = 5; n > 0; n--) {
                           if (special_one.length >= n && inputList[q].length >= n && special_one.toLowerCase().substring(0, n) === inputList.toLowerCase().substring(0, n)) {
                              specialMatched = true;
                              wordObject = {};
                              wordObject["word"] = special_one;
                              wordObject["matchCount"] = n;
                              response["WORDS"][q].push(wordObject);
                              break;
                           }
                        }
                     }
                     if (specialMatched == false) {
                        isAble = false;
                        break;
                     }
                  } else {//PART SPEECH IS NOT SPECIAL:
                     isDictionary = dictionaryPartSpeechArr.indexOf(part_speech) >= 0;
                     if (isDictionary == true) {
                        comboDicWheres.push("(d.Word LIKE '" + input_list_word_split[0] + "%' AND p.PartSpeech='" + part_speech + "')");
                     } else {
                        comboAlpWheres.push("(at.Table_name='" + part_speech + "' AND a.Letter='" + input_list_word_split[0].toUpperCase() + "')");
                     }
                  }
               }
               var sql_string1 = "SELECT d.*,p.PartSpeech FROM dictionarya AS d ";
               sql_string1 += "INNER JOIN part_speech AS p ON p.ID=d.Part_Speech_ID "
               if (comboDicWheres.length > 0) sql_string1 += "WHERE " + comboDicWheres.join(" OR ") + " ";
               sql_string1 += "ORDER BY d.Word";
               console.log("COMBOS.. GET DICTIONARY SQL = " + sql_string1);
               this.helpers.query(Helpers.database_misc, sql_string1, []).then(dicData => {
                  var myDicData: any = [];
                  for (var d = 0; d < dicData.rows.length; d++) {
                     myDicData.push(dicData.rows.item(d));
                  }
                  var sql_string2 = "SELECT a.Entry AS Word, at.Table_name AS PartSpeech FROM alphabet AS a ";
                  sql_string2 += "INNER JOIN alphabet_table AS at ON at.ID=a.Table_ID ";
                  if (comboAlpWheres.length > 0) sql_string2 += "WHERE " + comboAlpWheres.join(" OR ") + " ";
                  sql_string2 += "ORDER BY a.Entry";
                  console.log("COMBOS.. GET ALPHABET SQL = " + sql_string2);
                  this.helpers.query(Helpers.database_misc, sql_string2, []).then(alpData => {
                     var myAlpData: any = [], alpEntry: any = {}, indexDefinition = -1;
                     for (var a = 0; a < alpData.rows.length; a++) {
                        alpEntry = alpData.rows.item(a);
                        alpEntry["Definition"] = "";
                        indexDefinition = alpEntry["Word"].search(/[^A-Za-z]/);
                        if (indexDefinition >= 0) {
                           alpEntry["Word"] = alpEntry["Word"].substring(0, indexDefinition);
                           alpEntry["Definition"] = alpEntry["Word"].substring(indexDefinition);
                        }
                        myAlpData.push(alpEntry);
                     }
                     var part_speech_split_spaces = [];
                     if (dicData.rows.length == 0 || alpData.rows.length == 0) {
                        isAble = false;
                        response["IS_ABLE"] = false;
                     } else {
                        var entry_first_word = "";
                        var maxMatchCount = 0;
                        var matchCount = 0;
                        var partsSpeech = [];
                        var indexDefinitions = null;
                        var select_word = "";
                        var definition = "";
                        var isDictionary = false;
                        var matchedPartSpeechWords = [];

                        for (var q = 0; q < inputList.length; q++) {
                           part_speech = partSpeechList[q]["name"];
                           isDictionary = false;
                           if (dictionaryPartSpeechArr.indexOf(part_speech) >= 0) isDictionary = true;
                           if (isDictionary === true) {
                              console.log("COMBOS.. MATCHING PART SPEECH TO " + part_speech);
                              matchedPartSpeechWords = myDicData.filter((word: any) => { return word.PartSpeech === part_speech });
                           } else {
                              console.log("COMBOS.. MATCHING PART SPEECH TO " + part_speech);
                              matchedPartSpeechWords = myAlpData.filter((word: any) => { return word.PartSpeech === part_speech });
                           }
                           for (var w = 0; w < matchedPartSpeechWords.length; w++) {
                              select_word = matchedPartSpeechWords[w].Word;
                              definition = matchedPartSpeechWords[w].Definition;
                              matchCount = 0;
                              for (var x = 5; x > 0; x--) {
                                 //FOR matchCount = 5,4,3,2
                                 if (select_word.length >= x && inputList[q].length >= x && select_word.toLowerCase().substring(0, x) === inputList[q].toLowerCase().substring(0, x)) {
                                    matchCount = x;
                                    break;
                                 }
                              }
                              wordObject = {};
                              wordObject["word"] = select_word;
                              wordObject["matchCount"] = matchCount;
                              wordObject["definition"] = definition;
                              response["WORDS"][q].push(wordObject);
                           }
                        }
                        this.finishCombo(response);
                     }//END IF sql && num_rows>0          
                  });//END ALPHABET QUERY
               });//END DICTIONARY QUERY
            }//END COMBINATIONS
         }//END IF OFFLINE.
      });
   }

   finishWord(data: any) {
      var shuffledPartSpeechLowMatch: any = [];
      var shuffledPartSpeechHighMatch: any = [];
      var filteredSortedWordArray: any = [];
      var wordArray = [];
      this.mnemonicGenerator.wordsArray[this.mnemonicGenerator.wordIndex]["WORD_FOUND"] = data["WORD_FOUND"];
      if (this.mnemonicGenerator.wordsArray[this.mnemonicGenerator.wordIndex]["WORD_FOUND"] === true) {
         this.mnemonicGenerator.wordsArray[this.mnemonicGenerator.wordIndex]["WORD_PARTSPEECH"] = data["WORD_PARTSPEECH"];
         this.mnemonicGenerator.wordsArray[this.mnemonicGenerator.wordIndex]["WORD_DEFINITION"] = data["WORD_DEFINITION"];
      }
      for (var i = 0; i < this.mnemonicGenerator.columnNames.length; i++) {
         wordArray = data["WORDS"][this.mnemonicGenerator.columnNames[i].name];
         shuffledPartSpeechLowMatch = [];
         shuffledPartSpeechHighMatch = [];
         filteredSortedWordArray = [];
         //FILTER/SORT HIGH MATCH FIRST:
         for (var mc = 5; mc >= 4; mc--) {
            shuffledPartSpeechHighMatch = this.helpers.shuffleArray(wordArray.filter((word: any) => { return (word.matchCount === mc) }));
            shuffledPartSpeechHighMatch = shuffledPartSpeechHighMatch.sort(this.helpers.sortByItem("word", false));
            shuffledPartSpeechHighMatch.forEach((word: any) => {
               filteredSortedWordArray.push(word);
            });
         }
         for (var mc = 3; mc >= 1; mc--) {
            shuffledPartSpeechLowMatch = this.helpers.shuffleArray(wordArray.filter((word: any) => { return (word.matchCount === mc) }));
            if (shuffledPartSpeechLowMatch.length >= 10) {
               shuffledPartSpeechLowMatch = shuffledPartSpeechLowMatch.slice(0, 10);
            }
            shuffledPartSpeechLowMatch = shuffledPartSpeechLowMatch.sort(this.helpers.sortByItem("word", false));
            shuffledPartSpeechLowMatch.forEach((word: any) => {
               filteredSortedWordArray.push(word);
            });
         }
         console.log("wordArray = " + JSON.stringify(wordArray));
         if (this.mnemonicGenerator.columnNames[i].type === "other") {
            this.mnemonicGenerator.wordsArray[this.mnemonicGenerator.wordIndex]["other"][this.mnemonicGenerator.columnNames[i].name] = filteredSortedWordArray;
         } else {
            this.mnemonicGenerator.wordsArray[this.mnemonicGenerator.wordIndex][this.mnemonicGenerator.columnNames[i].name] = filteredSortedWordArray;
         }
      }
      this.mnemonicGenerator.wordsArray[this.mnemonicGenerator.wordIndex].isFetched = true;
      this.helpers.dismissProgress();
      //console.log("createMnemonics this.mnemonicGenerator.wordsArray = " + JSON.stringify(this.mnemonicGenerator.wordsArray));      
   }

   finishCombo(data: any) {
      console.log("finishCombo called");
      var partSpeechIndex = -1;
      var shuffledPartSpeechLowMatch: any = [];
      var shuffledPartSpeechHighMatch: any = [];
      var partSpeechList: any = [];
      var partSpeechWords = data["WORDS"];
      var comboIndex = this.mnemonicGenerator.comboIndex;
      for (var i = 0; i < this.mnemonicGenerator.partSpeechArray[comboIndex].length; i++) {
         console.log("LOOP, NOW DOING " + this.mnemonicGenerator.partSpeechArray[comboIndex][i].name);
         partSpeechList = [];
         shuffledPartSpeechHighMatch = this.helpers.shuffleArray(partSpeechWords[i].filter((word: any) => { return word.matchCount > 2 }));
         if (shuffledPartSpeechHighMatch.length >= 20) {
            shuffledPartSpeechHighMatch = shuffledPartSpeechHighMatch.slice(0, 20);
         }
         shuffledPartSpeechHighMatch = shuffledPartSpeechHighMatch.sort(this.helpers.sortByItem("matchCount", true));
         shuffledPartSpeechHighMatch.forEach((word: any) => {
            partSpeechList.push(word);
         });
         shuffledPartSpeechLowMatch = this.helpers.shuffleArray(partSpeechWords[i].filter((word: any) => { return word.matchCount <= 2 }));
         if (shuffledPartSpeechLowMatch.length >= 10) {
            shuffledPartSpeechLowMatch = shuffledPartSpeechLowMatch.slice(0, 10);
         }
         shuffledPartSpeechLowMatch = shuffledPartSpeechLowMatch.sort(this.helpers.sortByItem("matchCount", true));
         shuffledPartSpeechLowMatch.forEach((word: any) => {
            partSpeechList.push(word);
         });
         this.mnemonicGenerator.comboWords[comboIndex][i] = partSpeechList;
         //console.log("SET comboWords[" + i + "]=" + JSON.stringify(this.mnemonicGenerator.comboWords[comboIndex][i]));            
      }
      this.mnemonicGenerator.combosDone[comboIndex] = true;
      this.helpers.dismissProgress();
   }

}
