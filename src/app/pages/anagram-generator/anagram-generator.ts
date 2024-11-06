import { Component } from '@angular/core';
import { NavController, Platform, AlertController, LoadingController } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage';
import { Helpers } from '../../providers/helpers/helpers';
import { Subscription } from 'rxjs';


@Component({
   selector: 'page-anagram-generator',
   templateUrl: 'anagram-generator.html',
})
export class AnagramGeneratorPage {
   public pageName:string = "Anagram Generator";

   anagrams: any;
   public database: SQLiteDBConnection;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   private onPauseSubscription: Subscription;
   user: any;

   constructor(public navCtrl: NavController, private alertCtrl: AlertController, public progress: LoadingController, private platform: Platform, public storage: Storage, public helpers: Helpers) {
      this.onPauseSubscription = this.platform.pause.subscribe(() => {
         this.saveStorage();
      });
      this.database = this.helpers.getDatabaseMisc();
   }

   ngOnDestroy() {
      this.saveStorage();
      this.onPauseSubscription.unsubscribe();
   }

   async ngOnInit() {
      this.anagrams = {};
      this.anagrams.anagrams = [];
      this.user = Helpers.User;
      await this.storage.create();
      this.anagrams.isAllCombinations = false;
      this.anagrams.isMakeVowels = false;
      this.anagrams.isLimitedLetters = false;
      this.anagrams.color = "secondary";
      this.anagrams.numberLetters = null;
      this.anagrams.user = Helpers.User;
      this.storage.get('ANAGRAM_GENERATOR_INPUT').then((val) => {
         if (val != null) {
            this.anagrams.input = val;
         }
         this.storage.get('ANAGRAM_GENERATOR_IS_ALL_COMBINATIONS').then((val) => {
            if (val != null) {
               this.anagrams.isAllCombinations = val;
            }
            this.storage.get('ANAGRAM_GENERATOR_IS_CONSONANTS_VOWELS').then((val) => {
               if (val != null) {
                  this.anagrams.isMakeVowels = val;
               }
               this.storage.get('ANAGRAM_GENERATOR_IS_LIMITED_LETTERS').then((val) => {
                  if (val != null) {
                     this.anagrams.isLimitedLetters = val;
                  }
                  this.storage.get('ANAGRAM_GENERATOR_NUMBER_LETTERS').then((val) => {
                     if (val != null) {
                        this.anagrams.numberLetters = val;
                     }
                     this.background_color = Helpers.background_color;
                     this.button_color = Helpers.button_color;
                     this.button_gradient = Helpers.button_gradient;                     
                     console.log("SET ANAGRAM BACKGROUND COLOR TO=" + this.background_color + '!!!');
                     this.anagrams.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
                        this.background_color = bgColor;
                     });
                     this.anagrams.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
                        this.button_color = buttonColor.value;
                        this.button_gradient = buttonColor.gradient;
                     });          
                  });
               });
            });
         });
      });
   }

   ionViewDidLoad() {
      console.log('ionViewDidLoad AnagramGeneratorPage');
   }

   ionViewWillLeave() {
      console.log('ionViewWillLeave AnagramGeneratorPage');
      this.anagrams.subscribedBackgroundColorEvent.unsubscribe();
      this.anagrams.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   saveStorage() {
      console.log("anagram-generator saveStorage called!");
      this.storage.set('ANAGRAM_GENERATOR_INPUT', this.anagrams.input).then(() => {
         this.storage.set('ANAGRAM_GENERATOR_IS_ALL_COMBINATIONS', this.anagrams.isAllCombinations).then(() => {
            this.storage.set('ANAGRAM_GENERATOR_IS_CONSONANTS_VOWELS', this.anagrams.isMakeVowels).then(() => {
               this.storage.set('ANAGRAM_GENERATOR_IS_LIMITED_LETTERS', this.anagrams.isLimitedLetters).then(() => {
                  this.storage.set('ANAGRAM_GENERATOR_NUMBER_LETTERS', this.anagrams.numberLetters).then(() => {
                  });
               });
            });
         });
      });
   }

   makeAnagrams() {
      console.log("makeAnagrams called.");
      this.helpers.setProgress("Generating anagrams, please wait...", false).then(() => {
         var number_letters = 0;
         var input = String(this.anagrams.input);
         if (this.anagrams.isLimitedLetters) {
            number_letters = parseInt(this.anagrams.numberLetters);
            if(number_letters<=1){
               this.helpers.dismissProgress();
               this.helpers.myAlert("Alert", "", "Must enter more than 1 letter to find.", "OK");
               return;
            }
         }
         var is_matched_vowels = false;
         var vowels = ".*[aeiou].*";
         if (input.match(vowels) != null) {
            this.anagrams.isMakeVowels = true;
         }
         if (Helpers.isWorkOffline === false) {
            var params = {
               "acronym": input,
               "isAllCombinations": this.anagrams.isAllCombinations,
               "isMakeVowels": this.anagrams.isMakeVowels,
               "isChooseCount": this.anagrams.isLimitedLetters,
               "countNumber": number_letters
            };
            this.anagrams.words = null;
            this.helpers.makeHttpRequest("/lfq_directory/php/anagram_new.php", "POST", params).then((data) => {
               //console.log("data=" + JSON.stringify(data));
               this.helpers.dismissProgress();
               if (data["SUCCESS"] === true) {
                  this.anagrams.words = data.WORDS;
                  this.showAnagramResults(this.anagrams.words);
               } else {
                  this.helpers.alertLfqError(data["ERROR"]);
               }
            }, error => {
               this.helpers.dismissProgress();
               this.helpers.alertServerError(error.message);
            });
         } else {
            var input_split = input.split("");
            //GET ONLY UNIQUE VALUES FROM input_split:---------------------------------------
            var sql_input_split = input_split.filter(function onlyUnique(value, index, self) {
               return self.indexOf(value) === index;
            });
            //-------------------------------------------------------------------------------
            var sql_search = "";
            for (var i = 0; i < sql_input_split.length; i++) {
               sql_search += " AND Word LIKE '%" + input_split[i] + "%'";
            }
            var sql_anagram = "SELECT Word, Definition FROM " + Helpers.TABLES_MISC.dictionarya + " WHERE Word NOT LIKE '%[.,;-_]%'" + sql_search + " ORDER BY Word";
            console.log("sql_anagram = " + sql_anagram);
            this.helpers.query(this.database, sql_anagram, []).then((data) => {
               var words_list = [];
               for (var i = 0; i < data.rows.length; i++) {
                  words_list.push({ "WORD": data.rows.item(i).Word, "DEFINITION": data.rows.item(i).Definition });
               }
               this.showAnagramResults(words_list);
               this.helpers.dismissProgress();
            }).catch((error) => {
               console.log("sql:" + sql_anagram + ", ERROR:" + error.message);
               this.helpers.dismissProgress();
            });
         }
      });
   }

   showAnagramResults(words:any) {
      console.log("showAnagramResults called");
      this.anagrams.anagrams = [];
      var text = "";
      var words_list = [];
      var definitions_list = [];
      var input = String(this.anagrams.input);
      var input_length_all = input.length;
      var input_length = input_length_all;
      var countAllowedNoMatches = 0;
      if (this.anagrams.isLimitedLetters) {
         input_length = parseInt(this.anagrams.numberLetters);
         countAllowedNoMatches = input_length_all - input_length;
      }
      console.log("SET countAllowedNoMatches = " + countAllowedNoMatches);
      var input = input.toLowerCase();
      var input_split = input.split("");
      var is_all_combos = this.anagrams.isAllCombinations;
      for (var i = 0; i < words.length; i++) {
         //console.log("Database Word =(" + i + ")=" + data.rows.item(i).Word);
         words_list.push(words[i].WORD);
         definitions_list.push(words[i].DEFINITION);
      }
      var done = false;
      var vowels = ".*[aeiou].*";
      var my_word = "";
      var acronym2 = "";
      var special_word = "";
      var acronym2_split = [];
      var word_split = [];
      var vowel_count = 0;
      var acronym_index;
      var count_matched_letters = 0;;
      var count_matched_words = 0;
      var my_word_length;
      var start;
      if (this.anagrams.isMakeVowels) {//MATCH USING VOWELS
         console.log("USING MATCHED VOWELS!!!");
         for (var increment = 1; increment < 6; increment++) {
            for (var word_index = 0; word_index < words_list.length; word_index++) {
               my_word = words_list[word_index];
               word_split = my_word.toLowerCase().split("");
               my_word_length = my_word.length;
               vowel_count = 0;
               count_matched_letters = 0;
               acronym_index = 0;
               special_word = "";
               acronym2 = input;
               for (var k = 0; k < my_word_length; k++) {
                  if (k != vowel_count || count_matched_letters == input_length) {
                     special_word += word_split[k].toLowerCase();
                  }
                  if (is_all_combos === true) {
                     if (acronym2.match(word_split[vowel_count]) == null && k == vowel_count && count_matched_letters != input_length) {
                        break;
                     }
                     if (acronym2.match(word_split[vowel_count]) != null && k == vowel_count && count_matched_letters != input_length) {//IF MATCHED:
                        //if (acronym2.match(word_split[vowel_count]).length > countAllowedNoMatches) {
                           acronym2_split = acronym2.split("");
                           start = acronym2_split.indexOf(word_split[vowel_count]);
                           acronym2_split.splice(start, 1);
                           acronym2 = acronym2_split.join("");
                           if ((vowel_count + increment) < my_word_length) {
                              vowel_count = vowel_count + increment;
                              //console.log("INCREMENTED vowel_count=" + vowel_count);
                           }
                           special_word += word_split[k].toUpperCase();
                           count_matched_letters++;
                        //}else{
                        //   special_word += word_split[k].toLowerCase();
                        //}
                     }
                  } else {//NO COMBOS:
                     if (word_split[vowel_count] !== input_split[acronym_index] && k == vowel_count && count_matched_letters != input_length) {
                        break;
                     }
                     if (word_split[vowel_count] === input_split[acronym_index] && k == vowel_count && count_matched_letters != input_length) {
                        if ((vowel_count + increment) < my_word_length) {
                           vowel_count += increment;
                        }
                        if ((acronym_index + 1) < input_length) {
                           acronym_index++;
                        }
                        count_matched_letters++;
                        special_word += word_split[k].toUpperCase();
                     }
                  }
               }
               if (count_matched_letters == input_length) {
                  done = true;
                  this.anagrams.anagrams.push({ "word": special_word, "definition": definitions_list[word_index] });
               }
            }// end for each word
         }
         if (!done) {
            this.anagrams.results = "RESULTS: SORRY TRY AGAIN";
         }
      }
      //--------------------------------------------------------------------------------------------------------------------
      //MATCH USING CONSONANTS:-------------------------------------------------------------------------------------------------
      if (this.anagrams.isMakeVowels == false) {
         console.log("USING MATCHED CONSONANTS!!!");
         for (var word_index = 0; word_index < words_list.length; word_index++) {
            my_word = words_list[word_index].toLowerCase();
            word_split = my_word.split("");
            my_word_length = my_word.length;
            if (my_word_length >= input_length) {
               count_matched_letters = 0;
               acronym_index = 0;
               special_word = "";
               acronym2 = input;
               for (var k = 0; k < my_word_length; k++) {
                  if (word_split[k].match(vowels) != null || count_matched_letters == input_length) {
                     special_word += word_split[k].toLowerCase();
                  }
                  if (is_all_combos === true) {
                     if (acronym2.match(word_split[k]) != null) {//IF MATCHED:                      
                        count_matched_letters++;
                        acronym2_split = acronym2.split("");
                        //REMOVE THE LETTER FROM THE acronym2(input):---->
                        start = acronym2_split.indexOf(word_split[k]);
                        acronym2_split.splice(start, 1);
                        acronym2 = acronym2_split.join("");
                        special_word += word_split[k].toUpperCase();
                        continue;
                     }
                     if (acronym2.match(word_split[k]) == null && word_split[k].match(vowels) == null && count_matched_letters != input_length) {
                        break;
                     }
                  }
                  if (is_all_combos == false) {
                     if (word_split[k] !== input_split[acronym_index] && word_split[k].match(vowels) == null && count_matched_letters != input_length) {
                        break;
                     }
                     if (word_split[k] === input_split[acronym_index] && count_matched_letters != input_length) {
                        count_matched_letters++;
                        if ((acronym_index + 1) < input_length) {
                           acronym_index++;
                        }
                        special_word += word_split[k].toUpperCase();
                     }
                  }
               }
               if (count_matched_letters == input_length) {
                  done = true;
                  this.anagrams.anagrams.push({ "word": special_word, "definition": definitions_list[word_index] });
               }
            }
         }// while for each word
         if (!done) {
            this.anagrams.results = "RESULTS: SORRY TRY AGAIN";
         }
         this.helpers.dismissProgress();
      }
   }

}
