import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SecretaireDashboardComponent } from './components/secretaire/secretaire-dashboard.component';
import { SecretairePatientsComponent } from './components/secretaire/secretaire-patients.component';
import { SecretaireRendezVousComponent } from './components/secretaire/secretaire-rendezvous.component';
import { MedecinDashboardComponent } from './components/medecin/medecin-dashboard.component';
import { MedecinRendezVousComponent } from './components/medecin/medecin-rendezvous.component';
import { MedecinPatientsComponent } from './components/medecin/medecin-patients.component';
import { PatientsComponent } from './components/patients/patients.component';
import { MedecinsComponent } from './components/medecins/medecins.component';
import { RendezVousComponent } from './components/rendezvous/rendezvous.component';
import { UsersComponent } from './components/users/users.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'secretaire', component: SecretaireDashboardComponent, canActivate: [AuthGuard] },
  { path: 'secretaire/patients', component: SecretairePatientsComponent, canActivate: [AuthGuard] },
  { path: 'secretaire/rendezvous', component: SecretaireRendezVousComponent, canActivate: [AuthGuard] },
  { path: 'medecin', component: MedecinDashboardComponent, canActivate: [AuthGuard] },
  { path: 'medecin/patients', component: MedecinPatientsComponent, canActivate: [AuthGuard] },
  { path: 'medecin/rendezvous', component: MedecinRendezVousComponent, canActivate: [AuthGuard] },
  { path: 'patients', component: PatientsComponent, canActivate: [AuthGuard] },
  { path: 'medecins', component: MedecinsComponent, canActivate: [AuthGuard] },
  { path: 'rendezvous', component: RendezVousComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UsersComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/login' }
];
