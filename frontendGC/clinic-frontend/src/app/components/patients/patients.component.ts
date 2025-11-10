import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Patient } from '../../models/patient.model';
import { User } from '../../models/auth.model';
import { SidebarComponent } from '../shared/sidebar.component';
import { ExportService } from '../../services/export.service';
import { PatientHistoryModalComponent } from '../medecin/patient-history-modal.component';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, PatientHistoryModalComponent],
  template: `
    <div class="layout-container">
      <nav class="navbar">
        <div class="nav-brand">
          <h1>Gestion Clinique</h1>
        </div>
        <div class="nav-user">
          <span class="welcome-text">Gestion des Patients</span>
        </div>
      </nav>
      
      <div class="main-content">
        <app-sidebar></app-sidebar>
        
        <main class="content">
          <div class="patients-container">
            <div class="header">
              <h2>Gestion des Patients</h2>
              <div class="header-actions">
                <button (click)="showAddForm = !showAddForm" class="btn-primary">
                  <span class="btn-icon">{{ showAddForm ? '✖️' : '✚' }}</span>
                  {{ showAddForm ? 'Annuler' : 'Ajouter Patient' }}
                </button>
                <button (click)="exportPatients()" class="btn-success">
                  <span class="btn-icon">📃</span>
                  Exporter
                </button>
                <button (click)="loadPatients()" class="btn-refresh">
                  <span class="btn-icon">↻</span>
                  Actualiser
                </button>
              </div>
            </div>

      <div *ngIf="showAddForm" class="patient-form">
        <h3>{{ editingPatient ? 'Modifier' : 'Ajouter' }} Patient</h3>
        <form (ngSubmit)="savePatient()" #patientForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label>Nom:</label>
              <input [(ngModel)]="currentPatient.nom" name="nom" required class="form-control">
            </div>
            <div class="form-group">
              <label>Prénom:</label>
              <input [(ngModel)]="currentPatient.prenom" name="prenom" required class="form-control">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Email:</label>
              <input type="email" [(ngModel)]="currentPatient.email" name="email" required class="form-control">
            </div>
            <div class="form-group">
              <label>Téléphone:</label>
              <input [(ngModel)]="currentPatient.telephone" name="telephone" required class="form-control">
            </div>
          </div>
          <div class="form-group">
            <label>Date de naissance:</label>
            <input type="date" [(ngModel)]="currentPatient.dateNaissance" name="dateNaissance" required class="form-control">
          </div>
          <div class="form-group">
            <label>Antécédents:</label>
            <textarea [(ngModel)]="currentPatient.antecedents" name="antecedents" class="form-control"></textarea>
          </div>
          <div class="form-group">
            <label>Allergies:</label>
            <textarea [(ngModel)]="currentPatient.allergies" name="allergies" class="form-control"></textarea>
          </div>
          <h4>Adresse</h4>
          <div class="form-row">
            <div class="form-group">
              <label>Rue:</label>
              <input [(ngModel)]="currentPatient.adressDto.street" name="street" required class="form-control">
            </div>
            <div class="form-group">
              <label>Numéro:</label>
              <input [(ngModel)]="currentPatient.adressDto.houseNumber" name="houseNumber" class="form-control">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Ville:</label>
              <input [(ngModel)]="currentPatient.adressDto.city" name="city" required class="form-control">
            </div>
            <div class="form-group">
              <label>Code postal:</label>
              <input type="number" [(ngModel)]="currentPatient.adressDto.postalCode" name="postalCode" required class="form-control">
            </div>
          </div>
          <div class="form-group">
            <label>Pays:</label>
            <input [(ngModel)]="currentPatient.adressDto.country" name="country" required class="form-control">
          </div>
          <div class="form-actions">
            <button type="submit" [disabled]="!patientForm.valid" class="btn-primary">Sauvegarder</button>
            <button type="button" (click)="cancelEdit()" class="btn-secondary">Annuler</button>
          </div>
        </form>
      </div>

      <div class="patients-table">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Date de naissance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let patient of patients">
              <td>{{ patient.nom }}</td>
              <td>{{ patient.prenom }}</td>
              <td>{{ patient.email }}</td>
              <td>{{ patient.telephone }}</td>
              <td>{{ patient.dateNaissance | date:'dd/MM/yyyy' }}</td>
              <td>
                <button (click)="viewHistory(patient)" class="btn-history">Historique</button>
                <button (click)="editPatient(patient)" class="btn-edit">Modifier</button>
                <button (click)="deletePatient(patient.id!)" class="btn-delete">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
        </main>
      </div>
      
      <app-patient-history-modal 
        [isVisible]="showHistoryModal" 
        [patient]="selectedPatient"
        (closed)="showHistoryModal = false">
      </app-patient-history-modal>
      
      <footer class="global-footer">
        <div class="footer-content">
          © kfokam48 2025 - Gestion Clinique
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .layout-container { height: 100vh; background: linear-gradient(rgba(255,255,255,0.3), rgba(0,123,255,0.2)), url('https://cdn.futura-sciences.com/sources/images/informatique-administrateur-re%CC%81seaux.jpeg'); background-size: cover; background-position: center; background-attachment: fixed; display: flex; flex-direction: column; overflow: hidden; }
    .navbar { flex-shrink: 0; }
    .main-content { display: flex; flex: 1; overflow: hidden; }
    .content { flex: 1; overflow-y: auto; }
    .global-footer { flex-shrink: 0; }
    .navbar { background-color: #007bff; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .nav-brand h1 { margin: 0; }
    .welcome-text { font-weight: 600; color: white; }
    .main-content { display: flex; }
    .sidebar { width: 250px; background-color: white; min-height: calc(100vh - 80px); box-shadow: 2px 0 5px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
    .nav-menu { list-style: none; padding: 0; margin: 0; flex: 1; }
    .nav-menu li a { display: block; padding: 1rem 1.5rem; text-decoration: none; color: #333; border-bottom: 1px solid #eee; }
    .nav-menu li a:hover, .nav-menu li a.active { background-color: #007bff; color: white; }
    .sidebar-content { flex: 1; }
    .sidebar-footer { padding: 1rem; border-top: 1px solid #eee; background: #f8f9fa; }
    .user-profile { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .user-avatar { width: 40px; height: 40px; background: linear-gradient(135deg, #007bff, #0056b3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: white; }
    .user-details { flex: 1; }
    .user-name { font-weight: bold; font-size: 0.9rem; color: #333; }
    .user-role { font-size: 0.8rem; color: #666; }
    .btn-logout-sidebar { width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #dc3545, #c82333); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s ease; }
    .btn-logout-sidebar:hover { background: linear-gradient(135deg, #c82333, #a71e2a); transform: translateY(-1px); box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3); }
    .logout-icon { font-size: 1.1rem; }
    .global-footer { background-color: #f8f9fa; border-top: 1px solid #dee2e6; padding: 1rem 0; margin-top: auto; }
    .footer-content { text-align: center; font-size: 0.9rem; color: #666; font-weight: 500; }
    .content { flex: 1; padding: 2rem; }
    .patients-container { }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header h2 { margin: 0; color: #333; }
    .header-actions { display: flex; gap: 1rem; }
    .btn-icon { margin-right: 0.5rem; font-size: 1.1rem; }
    .patient-form { background: white; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
    .form-control { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    .form-actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .btn-primary, .btn-secondary, .btn-edit, .btn-delete { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; }
    .btn-primary { background-color: #007bff; color: white; font-weight: 600; transition: all 0.3s ease; }
    .btn-primary:hover { background-color: #0056b3; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,123,255,0.3); }
    .btn-success { 
      background: linear-gradient(135deg, #28a745, #20c997); 
      color: white; 
      font-weight: 600; 
      transition: all 0.3s ease;
      box-shadow: 0 3px 8px rgba(40, 167, 69, 0.2);
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-success:hover { 
      background: linear-gradient(135deg, #20c997, #1e7e34); 
      transform: translateY(-2px); 
      box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4);
    }
    /* Style géré par styles.css global */
    .btn-history { 
      background: linear-gradient(135deg, #17a2b8, #138496); 
      color: white; 
      margin-right: 0.5rem; 
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-history:hover { 
      background: linear-gradient(135deg, #138496, #117a8b); 
      transform: translateY(-2px); 
      box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
    }
    .btn-edit { 
      background: linear-gradient(135deg, #28a745, #20c997); 
      color: white; 
      margin-right: 0.5rem; 
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    .btn-edit:hover { 
      background: linear-gradient(135deg, #20c997, #1e7e34); 
      transform: translateY(-2px); 
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
    }
    .btn-delete { 
      background: linear-gradient(135deg, #dc3545, #c82333); 
      color: white; 
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    .btn-delete:hover { 
      background: linear-gradient(135deg, #c82333, #a71e2a); 
      transform: translateY(-2px); 
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
    }
    .patients-table { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
    td:last-child { 
      display: flex; 
      gap: 0.5rem; 
      align-items: center; 
      justify-content: flex-start;
    }
    th { background-color: #f8f9fa; font-weight: bold; }
  `]
})
export class PatientsComponent implements OnInit {
  patients: Patient[] = [];
  currentPatient: Patient = this.initPatient();
  showAddForm = false;
  editingPatient = false;
  currentUser: User | null = null;
  showHistoryModal = false;
  selectedPatient: Patient | null = null;

  constructor(
    private patientService: PatientService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.loadPatients();
    
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        this.showAddForm = true;
      }
    });
  }

  loadPatients(): void {
    this.patientService.getAllPatients().subscribe({
      next: patients => {
        this.patients = patients;
        // Patients chargés silencieusement
      },
      error: () => {
        this.notificationService.error('Erreur', 'Impossible de charger les patients');
      }
    });
  }

  initPatient(): Patient {
    return {
      nom: '',
      prenom: '',
      email: '',
      dateNaissance: '',
      telephone: '',
      antecedents: '',
      allergies: '',
      adressDto: {
        street: '',
        houseNumber: '',
        city: '',
        postalCode: 0,
        country: ''
      }
    };
  }

  savePatient(): void {
    console.log('Tentative de sauvegarde du patient:', this.currentPatient);
    console.log('Mode édition:', this.editingPatient);
    
    if (this.editingPatient) {
      console.log('Modification du patient avec ID:', this.currentPatient.id);
      this.patientService.updatePatient(this.currentPatient.id!, this.currentPatient).subscribe({
        next: (response) => {
          console.log('Patient modifié avec succès:', response);
          this.loadPatients();
          this.cancelEdit();
          // Patient modifié silencieusement
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.notificationService.error('Erreur', 'Impossible de modifier le patient');
        }
      });
    } else {
      console.log('Création d\'un nouveau patient');
      this.patientService.createPatient(this.currentPatient).subscribe({
        next: (response) => {
          console.log('Patient créé avec succès:', response);
          this.loadPatients();
          this.cancelEdit();
          // Patient créé silencieusement
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.notificationService.error('Erreur', 'Impossible de créer le patient');
        }
      });
    }
  }

  editPatient(patient: Patient): void {
    this.currentPatient = { 
      ...patient,
      adressDto: patient.adressDto ? { ...patient.adressDto } : {
        street: '',
        houseNumber: '',
        city: '',
        postalCode: 0,
        country: ''
      }
    };
    this.editingPatient = true;
    this.showAddForm = true;
  }

  deletePatient(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
      this.patientService.deletePatient(id).subscribe({
        next: () => {
          this.loadPatients();
          // Patient supprimé silencieusement
        },
        error: () => {
          this.notificationService.error('Erreur', 'Impossible de supprimer le patient');
        }
      });
    }
  }

  cancelEdit(): void {
    this.currentPatient = this.initPatient();
    this.editingPatient = false;
    this.showAddForm = false;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.notificationService.success('Déconnexion', 'Vous avez été déconnecté avec succès');
        this.router.navigate(['/login']);
      },
      error: () => {
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
      }
    });
  }

  getUserRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'MEDECIN': return 'Médecin';
      case 'SECRETAIRE': return 'Secrétaire';
      default: return role;
    }
  }

  viewHistory(patient: Patient): void {
    this.selectedPatient = patient;
    this.showHistoryModal = true;
  }

  exportPatients(): void {
    this.exportService.exportPatientsToWord(this.patients);
    this.notificationService.success('Export', 'Fiche patients exportée au format Word');
  }
}