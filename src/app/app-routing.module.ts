import { NgModule} from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginPage } from './pages/login/login';
import { HomePage } from './pages/home/home';
import { SearchPage } from './pages/search/search';
import { HelpMenuPage } from './pages/help-menu/help-menu';
import { EditAcrosticsPage } from './pages/edit-acrostics/edit-acrostics';
import { EditAlphabetPage } from './pages/edit-alphabet/edit-alphabet';
import { ShowMnemonicsPage } from './pages/show-mnemonics/show-mnemonics';
import { MajorSystemPage } from './pages/major-system/major-system';
import { CelebrityNumbersPage } from './pages/celebrity-numbers/celebrity-numbers';
import { AnagramGeneratorPage } from './pages/anagram-generator/anagram-generator';
import { EditDictionaryPage } from './pages/edit-dictionary/edit-dictionary';
import { ShowDictionaryPage } from './pages/show-dictionary/show-dictionary';
import { AlphabetAcrosticsPage } from './pages/alphabet-acrostics/alphabet-acrostics';
import { ShowWorldMapPage } from './pages/show-world-map/show-world-map';
import { EditEventsPage } from './pages/edit-events/edit-events';
import { EditMnemonicsPage } from './pages/edit-mnemonics/edit-mnemonics';
import { EditNumbersPage } from './pages/edit-numbers/edit-numbers';
import { EditTablesPage } from './pages/edit-tables/edit-tables';
import { EditNewWordsPage } from './pages/edit-new-words/edit-new-words';
import { EditPeglistPage } from './pages/edit-peglist/edit-peglist';
import { EditCelebrityNumbersPage } from './pages/edit-celebrity-numbers/edit-celebrity-numbers';
import { ShowNewWordsPage } from './pages/show-new-words/show-new-words';
import { ShowNumbersPage } from './pages/show-numbers/show-numbers';
import { RequestsPage } from './pages/requests/requests';
import { ShowTimelinePage } from './pages/show-timeline/show-timeline';
import { ShowTablesPage } from './pages/show-tables/show-tables';
import { MnemonicGeneratorPage } from './pages/mnemonic-generator/mnemonic-generator';



const routes: Routes = [
  {
    path: 'login',
    component: LoginPage,
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'home',
    component: HomePage,
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },  
  {
    path: 'edit-acrostics',
    component: EditAcrosticsPage,
    loadChildren: () => import('./pages/edit-acrostics/edit-acrostics.module').then( m => m.EditAcrosticsPageModule)
  },    
  {
    path: 'edit-alphabet',
    component: EditAlphabetPage,
    loadChildren: () => import('./pages/edit-alphabet/edit-alphabet.module').then( m => m.EditAlphabetPageModule)
  },      
  {
    path: 'edit-dictionary',
    component: EditDictionaryPage,
    loadChildren: () => import('./pages/edit-dictionary/edit-dictionary.module').then( m => m.EditDictionaryPageModule)
  },        
  {
    path: 'edit-events',
    component: EditEventsPage,
    loadChildren: () => import('./pages/edit-events/edit-events.module').then( m => m.EditEventsPageModule)
  },
  {
    path: 'edit-mnemonics',
    component: EditMnemonicsPage,
    loadChildren: () => import('./pages/edit-mnemonics/edit-mnemonics.module').then( m => m.EditMnemonicsPageModule)
  },  
  {
    path: 'edit-numbers',
    component: EditNumbersPage,
    loadChildren: () => import('./pages/edit-numbers/edit-numbers.module').then( m => m.EditNumbersPageModule)
  },    
  {
    path: 'edit-tables',
    component: EditTablesPage,
    loadChildren: () => import('./pages/edit-tables/edit-tables.module').then( m => m.EditTablesPageModule)
  },    
  {
    path: 'edit-new-words',
    component: EditNewWordsPage,
    loadChildren: () => import('./pages/edit-new-words/edit-new-words.module').then( m => m.EditNewWordsPageModule)
  },        
  {
    path: 'edit-peglist',
    component: EditPeglistPage,
    loadChildren: () => import('./pages/edit-peglist/edit-peglist.module').then( m => m.EditPeglistPageModule)
  },          
  {
    path: 'edit-celebrity-numbers',
    component: EditCelebrityNumbersPage,
    loadChildren: () => import('./pages/edit-celebrity-numbers/edit-celebrity-numbers.module').then( m => m.EditCelebrityNumbersPageModule)
  },            
  {
    path: 'show-tables',
    component: ShowTablesPage,
    loadChildren: () => import('./pages/show-tables/show-tables.module').then( m => m.ShowTablesPageModule)
  },    
  {
    path: 'show-new-words',
    component: ShowNewWordsPage,
    loadChildren: () => import('./pages/show-new-words/show-new-words.module').then( m => m.ShowNewWordsPageModule)
  },  
  {
    path: 'show-mnemonics',
    component: ShowMnemonicsPage,
    loadChildren: () => import('./pages/show-mnemonics/show-mnemonics.module').then( m => m.ShowMnemonicsPageModule)
  },
  {
    path: 'show-numbers',
    component: ShowNumbersPage,
    loadChildren: () => import('./pages/show-numbers/show-numbers.module').then( m => m.ShowNumbersPageModule)
  },  
  {
    path: 'show-timeline',
    component: ShowTimelinePage,
    loadChildren: () => import('./pages/show-timeline/show-timeline.module').then( m => m.ShowTimelinePageModule)
  },    
  {
    path: 'show-world-map',
    component: ShowWorldMapPage,
    loadChildren: () => import('./pages/show-world-map/show-world-map.module').then( m => m.ShowWorldMapPageModule)
  },  
  {
    path: 'major-system',
    component: MajorSystemPage,
    loadChildren: () => import('./pages/major-system/major-system.module').then( m => m.MajorSystemPageModule)
  },  
  {
    path: 'celebrity-numbers',
    component: CelebrityNumbersPage,
    loadChildren: () => import('./pages/celebrity-numbers/celebrity-numbers.module').then( m => m.CelebrityNumbersPageModule)
  },    
  {
    path: 'anagram-generator',
    component: AnagramGeneratorPage,
    loadChildren: () => import('./pages/anagram-generator/anagram-generator.module').then( m => m.AnagramGeneratorPageModule)
  },    
  {
    path: 'mnemonic-generator',
    component: MnemonicGeneratorPage,
    loadChildren: () => import('./pages/mnemonic-generator/mnemonic-generator.module').then( m => m.MnemonicGeneratorPageModule)
  },      
  {
    path: 'show-dictionary',
    component: ShowDictionaryPage,
    loadChildren: () => import('./pages/show-dictionary/show-dictionary.module').then( m => m.ShowDictionaryPageModule)
  },      
  {
    path: 'alphabet-acrostics',
    component: AlphabetAcrosticsPage,
    loadChildren: () => import('./pages/alphabet-acrostics/alphabet-acrostics.module').then( m => m.AlphabetAcrosticsPageModule)
  },        
  {
    path: 'requests',
    component: RequestsPage,
    loadChildren: () => import('./pages/requests/requests.module').then( m => m.RequestsPageModule)
  },        
  {
    path: 'help-menu',
    component: HelpMenuPage,
    loadChildren: () => import('./pages/help-menu/help-menu.module').then( m => m.HelpMenuPageModule)
  },      
  {
    path: 'search',
    component: SearchPage,
    loadChildren: () => import('./pages/search/search.module').then( m => m.SearchPageModule)
  },    
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]  
})
export class AppRoutingModule { }
