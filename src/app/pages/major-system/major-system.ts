import { Component } from '@angular/core';
import { NavController, AlertController, LoadingController, Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage';
import { Helpers } from '../../providers/helpers/helpers';
import { Subscription } from 'rxjs';

@Component({
   selector: 'page-major-system',
   templateUrl: 'major-system.html',
   styleUrl: 'major-system.scss'
})
export class MajorSystemPage {
   public pageName:string = "Major System";
   major: any;
   public database_misc: SQLiteDBConnection;
   input_split: any;
   done: any;
   progressLoader: any;
   user: any;
   search_success: boolean = false;
   total_loaded_words: number = 0;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   private onPauseSubscription: Subscription;

   constructor(public navCtrl: NavController, private platform: Platform, public progress: LoadingController, private alertCtrl: AlertController, public storage: Storage, public helpers: Helpers) {
      this.input_split = [];
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
      this.user = Helpers.User;
      this.search_success = false;
      this.total_loaded_words = 0;
      this.major = {};
      Helpers.currentPageName = this.pageName;
      this.major.canWorkOffline = Helpers.isWorkOffline;
      this.major.isUseBeginningLetters = false;
      this.major.isEveryLetter = false;
      this.major.input = "";
      await this.storage.create();
      this.storage.get('MAJOR_SYSTEM_USE_BEGINNING_LETTERS').then((val) => {
         if (val != null) {
            this.major.isUseBeginningLetters = val;
         }
         this.storage.get('MAJOR_SYSTEM_IS_EVERY_LETTER').then((val) => {
            if (val != null) {
               this.major.isEveryLetter = val;
            }
            this.storage.get('MAJOR_SYSTEM_INPUT').then((val) => {
               if (val != null) {
                  this.major.input = val;
               }
               this.background_color = Helpers.background_color;
               this.button_color = Helpers.button_color;
               this.button_gradient = Helpers.button_gradient;
               
               this.major.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
                  this.background_color = bgColor;
               });
               this.major.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
                  this.button_color = buttonColor.value;
                  this.button_gradient = buttonColor.gradient;
                  console.log("MAJORSYSTEM, SET GRADIENT = " + this.button_gradient)
               });
            });
         });
      });
   }

   ionViewDidLoad() {
      console.log('ionViewDidLoad MajorSystemPage');
   }

   ionViewWillLeave() {
      console.log('ionViewWillLeave MajorSystemPage');
      this.major.subscribedBackgroundColorEvent.unsubscribe();
      this.major.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   saveStorage() {
      console.log("saveStorage called");
      this.storage.set('MAJOR_SYSTEM_USE_BEGINNING_LETTERS', this.major.isUseBeginningLetters).then(() => {
         this.storage.set('MAJOR_SYSTEM_IS_EVERY_LETTER', this.major.isEveryLetter).then(() => {
            this.storage.set('MAJOR_SYSTEM_INPUT', this.major.input).then(() => {
            });
         });
      });
   }

   makeMajor() {
      console.log("makeMajor called");
      var input = this.major.input;
      var input_count = input.length;
      console.log("makeMajor called, this.major.input=" + this.major.input + ", input_count=" + input_count);
      this.search_success = false;
      this.major.loadResults = "";
      this.major.loadResults = "According to the Stanislaus Mink von Wennsshein, of 17th Century, the Major Sytem is<br />";
      this.major.loadResults += "0=s,z 1=d,t,th 2=n 3=m 4=r 5=l 6=ch,j,g,sh 7=c,gg,k,q 8=f,ph,v 9=b,p<br /><br />";
      this.major.results = "<br />";
      var alphabet_re = /[A-Z]/ig;
      var numbers_re = /[0-9]/g;
      var not_numbers_re = /[^0-9]/g;
      var reg_exp = /[A-Z]+[0-9]+/i
      var letter_count = 0;
      this.input_split = input.split("");
      var beginning_letters_each = "";
      var beginning_letters_all = "";
      var end_numbers = "";

      //****NOTE
      //1) USE isUseBeginningLetters IS ALL LETTERS IN BEGINNING MATCH,  AND THE MAJOR WORD MATCHES THE NUMBER
      // 2) IS EVERY LETTER, IS EVERY LETTER MATCHES THE BEGINNING LETTER OF THE WORD AND THE MAJOR WORD MATCHES THE NUMBER
      if ((this.major.isUseBeginningLetters && this.major.isUseBeginningLetters === true) || (this.major.isEveryLetter && this.major.isEveryLetter === true)) {
         if (input.match(reg_exp) == null) {
            this.helpers.myAlert("Input Error", "Must enter only letters followed by numbers '<i>abc123</i>'.", "", "Dismiss");
            this.major.results = "Nothing Loaded";
            return;
         }
      } else {//IF NOT USE MAJOR LETTERS:
         if (input.match(not_numbers_re) != null) {
            this.helpers.myAlert("Input Error", "Must enter only numbers.", "", "Dismiss");
            return;
         }
      }
      for (var i = 0; i < input_count; i++) {
         if (this.input_split[i].match(alphabet_re) != null) {
            letter_count++;
         } else {
            break;
         }
      }
      beginning_letters_all = input.substring(0, letter_count);
      this.major.begLets = beginning_letters_all;
      this.helpers.setProgress("Loading words, please wait......", false).then(() => {
         if (Helpers.isWorkOffline === false) {//IF CAN NOT WORK OFFLINE:
            var option = "";
            var params = {
               "isUseBeginningLetters": this.major.isUseBeginningLetters,
               "isEveryLetter": this.major.isEveryLetter,
               "major_input": input,
               "option": option
            }
            this.helpers.makeHttpRequest("/lfq_directory/php/major_generator_new.php", "POST", params).then((data) => {
               console.log("makeMajor data.=" + JSON.stringify(data));
               this.helpers.dismissProgress();
               if (data["SUCCESS"] === true) {
                  this.major.words = data["WORDS"];
                  this.major.words_beginning = data["WORDS_BEGINNING"];
                  this.major.results = data["LOAD_RESULTS"];
                  this.search_success = true;
                  this.showSearchSuccessResult();
               } else {
                  this.helpers.alertLfqError(data["ERROR"]);
               }
            }, error => {
               this.helpers.dismissProgress();
               this.helpers.alertServerError(error.message);
            });
         } else {
            if (!this.major.isUseBeginningLetters && !this.major.isEveryLetter) {// OPTION: uses only numbers
               this.major.results += input + "<br /><br />";
               console.log("Helpers.isWorkOffline = " + Helpers.isWorkOffline);
               var sql = "SELECT * FROM " + Helpers.TABLES_MISC.dictionarya + " WHERE Number LIKE '" + input + "%'";
               this.helpers.query(this.database_misc, sql, 'query', []).then((data) => {
                  if (data.values.length > 0) {
                     this.search_success = true;
                     this.major.words = [];
                     for (var i = 0; i < data.values.length; i++) {
                        this.major.words.push({ "WORD": data.values[i].Word, "DEFINITION": data.values[i].Definition });
                     }
                     var word_split = [];
                     for (var i = 0; i < this.major.words.length; i++) {
                        word_split = this.major.words[i].WORD.split("");
                        this.major.words[i].WORD = this.helpers.formatWord(word_split, input);
                     }
                  }
                  this.helpers.dismissProgress();
                  this.showSearchSuccessResult();
               }, (error) => {
                  console.log("sql:" + sql + ", ERROR:" + error.message);
                  this.major.loadResults = "Sorry. Making major words error.";
                  this.helpers.dismissProgress();
                  this.showSearchSuccessResult();
               });
            }// END OPTION only numbers
            else if ((this.major.isUseBeginningLetters && this.major.isUseBeginningLetters === true) || (this.major.isEveryLetter && this.major.isEveryLetter === true)) {// for 2 OPTIONS: letters at beginning, or find all letters
               end_numbers = input.substring(letter_count, input_count);
               if (this.major.isEveryLetter === true) {
                  // replaces redundant letters
                  console.log("beginning_letters BEFORE=" + beginning_letters_all);
                  beginning_letters_each = beginning_letters_all.split("").filter(function onlyUnique(value, index, self) {
                     return self.indexOf(value) === index;
                  }).join("");
                  console.log("beginning_letters AFTER=" + beginning_letters_each);
               }
               // FOR NUMBERS TO WORDS:
               if ((this.major.isEveryLetter && this.major.isEveryLetter === true)) {
                  this.major.words = [];
                  this.getWordsLikeLetter(0, beginning_letters_each, beginning_letters_all, end_numbers);
               } else if (this.major.isUseBeginningLetters && this.major.isUseBeginningLetters === true) {
                  this.major.words_beginning = [];
                  this.getWordsLikeWord(0, beginning_letters_all, end_numbers);
               }
            }// END IF OTHER 2 OPTIONS
         }//END IF CAN WORK OFFLINE
      });
   }

   getWordsLikeLetter(beginning_letter_index:any, beginning_letters_each:any, beginning_letters_all:any, end_numbers:any) {
      console.log("getWordsLikeLetter called, begginning_letter_index=" + beginning_letter_index + ", beginning_letters.length=" + beginning_letters_all.length);
      var word_split = [];
      if (beginning_letter_index < beginning_letters_each.length) {
         var beginning_letter = beginning_letters_each.substring(beginning_letter_index, beginning_letter_index + 1);
         this.major.words.push({ "LETTER": beginning_letter, "WORDS_INCLUDED": [], "WORDS_EXCLUDED": [] });
         var letterNumber = String(this.helpers.getMajorSystemNumber(beginning_letter, 0, null));
         var sql = "SELECT * FROM " + Helpers.TABLES_MISC.dictionarya + " WHERE Word LIKE '" + beginning_letter + "%' AND (Number LIKE '" + end_numbers + "%' OR Number LIKE '" + letterNumber + end_numbers + "%')";
         this.helpers.query(this.database_misc, sql, 'query', []).then((data) => {
            if (data && data.values && data.values.length > 0) {
               var majSysNumNoLetter, majSysNumWithLetter, formattedWord;
               for (var i = 0; i < data.values.length; i++) {
                  //console.log("getWordsLikeLetter FOUND WORD=" + data.values[i].Word);
                  word_split = data.values[i].Word.split("");
                  //
                  //try {
                  majSysNumNoLetter = String(this.helpers.getMajorSystemNumber(data.values[i].Word.substring(1), 0, null));
                  majSysNumWithLetter = String(this.helpers.getMajorSystemNumber(data.values[i].Word, 0, null));
                  if (majSysNumNoLetter !== "" && majSysNumNoLetter.substring(0, end_numbers.length) === end_numbers) {
                     formattedWord = word_split[0].toLowerCase() + this.helpers.formatWord(word_split.slice(1), end_numbers);
                     this.major.words[beginning_letter_index].WORDS_EXCLUDED.push({ "WORD": formattedWord, "DEFINITION": data.values[i].Definition });
                  }
                  if (majSysNumWithLetter !== "" && majSysNumWithLetter.substring(0, end_numbers.length) === end_numbers) {
                     formattedWord = this.helpers.formatWord(word_split.slice(0), end_numbers);
                     this.major.words[beginning_letter_index].WORDS_INCLUDED.push({ "WORD": formattedWord, "DEFINITION": data.values[i].Definition });
                  }
                  //} catch (e) { }
               }
               this.search_success = true;
            }
            beginning_letter_index++;
            this.getWordsLikeLetter(beginning_letter_index, beginning_letters_each, beginning_letters_all, end_numbers);
         }, (error) => {
            console.log("sql:" + sql + ", ERROR:" + error.message);
            this.major.loadResults = "Sorry. Getting words like letter error."
            this.helpers.dismissProgress();
         });
      } else {//NEXT TASK GET WORDS WITH BEGGING WORD: 
         if (this.major.isUseBeginningLetters && this.major.isUseBeginningLetters === true) {
            this.getWordsLikeWord(0, beginning_letters_all, end_numbers);
         } else {
            this.helpers.dismissProgress();
         }
      }
   }

   getWordsLikeWord(beginning_letter_index:any, beginning_letters_all:any, end_numbers:any) {
      console.log("getWordsLikeWord called beginning_letter_index=" + beginning_letter_index + ", beginning_letters_all = " + beginning_letters_all + ", beginning_letters_all.length=" + beginning_letters_all.length);

      if (beginning_letter_index < beginning_letters_all.length) {
         var beginning_letters_string_length = beginning_letters_all.length - beginning_letter_index;
         var beginning_letters_string = beginning_letters_all.substring(0, beginning_letters_string_length);
         console.log("getWordsLikeWord, beginning_letters_string=" + beginning_letters_string);
         var getWordsLikeWordSql = "SELECT * FROM " + Helpers.TABLES_MISC.dictionarya + " WHERE Word LIKE '" + beginning_letters_string + "%'";
         //WANT TO FIND OUT IF WORD NUMBER=END NUMBERS
         console.log("getWordsLikeWordSql=" + getWordsLikeWordSql);
         this.helpers.query(this.database_misc, getWordsLikeWordSql, 'query', []).then((data) => {
            if (data.values.length > 0) {
               if (!this.major.words_beginning) {
                  this.major.words_beginning = [];
               }
               console.log("getWordsLikeWord, data.values.length=" + data.values.length);
               this.major.words_beginning.push({ "LETTER": beginning_letters_string.toUpperCase(), "WORDS_INCLUDED": [], "WORDS_EXCLUDED": [] });
               console.log("this.major.words_beginning.length = " + this.major.words_beginning.length);
               var search_word = "";
               var word_split = [];
               var number = "";
               var formattedWord = "";
               var count_beginning_words = 0;
               var majSysNoLettersNum, majSysWithLettersNum;
               for (var i = 0; i < data.values.length; i++) {
                  search_word = data.values[i].Word;
                  //console.log("getWordsLikeWord, search_word=" + search_word);
                  word_split = search_word.split("");
                  //number = this.helpers.getMajorSystemNumber(search_word, beginning_letters_string.length, null);
                  //if (number === "") {
                  //   continue;
                  //}
                  //if (number.length < end_numbers.length) {
                  //   continue;
                  //}
                  //if (end_numbers === number.substring(0, end_numbers.length)) {// if numbers in indicator= the number
                  word_split = data.values[i].Word.split("");
                  this.search_success = true;
                  majSysNoLettersNum = this.helpers.getMajorSystemNumber(data.values[i].Word.substring(beginning_letters_string.length), 0, null);
                  majSysWithLettersNum = this.helpers.getMajorSystemNumber(data.values[i].Word, 0, null);
                  //console.log("majSysNoLettersNum = " + majSysNoLettersNum + ", majSysWithLettersNum = " + majSysWithLettersNum);
                  if (majSysNoLettersNum !== "" && majSysNoLettersNum.substring(0, end_numbers.length) === end_numbers) {
                     formattedWord = data.values[i].Word.substring(0, beginning_letters_string.length).toLowerCase() + this.helpers.formatWord(word_split.slice(beginning_letters_string.length), end_numbers);
                     this.major.words_beginning[beginning_letter_index].WORDS_EXCLUDED.push({ "WORD": formattedWord, "DEFINITION": data.values[i].Definition });
                  }
                  if (majSysWithLettersNum !== "" && majSysWithLettersNum.substring(0, end_numbers.length) === end_numbers) {
                     formattedWord = this.helpers.formatWord(word_split, end_numbers);
                     this.major.words_beginning[beginning_letter_index].WORDS_INCLUDED.push({ "WORD": formattedWord, "DEFINITION": data.values[i].Definition });
                  }
                  //}// end if end_numbers equals the found number
               }
               if (count_beginning_words > 0) {
                  console.log("ct_begwords>0=" + count_beginning_words);
               }
            }
            beginning_letter_index++;
            this.getWordsLikeWord(beginning_letter_index, beginning_letters_all, end_numbers);
         }, (error) => {
            console.log("sql:" + getWordsLikeWordSql + ", ERROR:" + error.message);
            this.major.results = "Sorry. Getting words like word error."
            this.helpers.dismissProgress();
            this.showSearchSuccessResult();
         });
      } else {
         this.helpers.dismissProgress();
         this.showSearchSuccessResult();
      }
   }

   showSearchSuccessResult() {
      console.log("showSearchSuccessResult called");
      this.getTotalCount();
      if (this.search_success === true) {
         this.major.loadResults += "Loaded.. " + this.total_loaded_words + " total words";
      } else {
         this.major.loadResults = "RESULTS: SORRY TRY AGAIN", "NOTHING LOADED";
      }
   }

   clearWords() {
      this.major.words = null;
      this.major.words_beginning = null;
      this.major.loadResults = "";
   }

   getTotalCount() {
      this.total_loaded_words = 0;
      if (this.major.words) {
         for (var i = 0; i < this.major.words.length; i++) {
            if (this.major.words[i]["WORDS_INCLUDED"]) {
               this.total_loaded_words += this.major.words[i]["WORDS_INCLUDED"].length;
            }
            if (this.major.words[i]["WORDS_EXCLUDED"]) {
               this.total_loaded_words += this.major.words[i]["WORDS_EXCLUDED"].length;
            }
         }
      }
      if (this.major.words_beginning) {
         for (var i = 0; i < this.major.words_beginning.length; i++) {
            if (this.major.words_beginning[i]["WORDS_INCLUDED"]) {
               this.total_loaded_words += this.major.words_beginning[i]["WORDS_INCLUDED"].length;
            }
            if (this.major.words_beginning[i]["WORDS_EXCLUDED"]) {
               this.total_loaded_words += this.major.words_beginning[i]["WORDS_EXCLUDED"].length;
            }
         }
      }
      if (this.major.isEveryLetter === false && this.major.isUseBeginningLetters === false) {
         if (this.major.words) {
            this.total_loaded_words += this.major.words.length;
         }
      }
   }

}
