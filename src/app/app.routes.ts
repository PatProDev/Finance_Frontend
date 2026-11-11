import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AppLayoutComponent } from './components/appLayoutComponent/appLayout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, title: 'Finance App' },
  { path: 'register', component: RegisterComponent, title: 'Register' },
  { 
    path: '',
    component: AppLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
      { path: 'transactions', loadComponent: () => import('./features/transactions/transactionDetailList/transactionDetailList').then(m => m.TransactionDetailListComponent) },
      { path: 'budgets', loadComponent: () => import('./features/budgets/budgets.component').then(m => m.BudgetsComponent) },
      { path: 'categoriesTags', loadComponent: () => import('./features/categoriesTags/categoriesAndTags.component').then(m => m.CategoriesAndTagsComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
    ],
  },
];