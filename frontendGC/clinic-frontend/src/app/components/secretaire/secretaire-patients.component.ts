import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProfileModalComponent } from '../shared/profile-modal.component';
import { PatientHistoryModalComponent } from '../medecin/patient-history-modal.component';
import { PatientService } from '../../services/patient.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Patient } from '../../models/patient.model';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-secretaire-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProfileModalComponent, PatientHistoryModalComponent],
  template: `
    <div class="dashboard-container">
      <nav class="navbar">
        <div class="nav-brand">
          <h1>Gestion Clinique</h1>
        </div>
        <div class="nav-search">
          <div class="search-container">
            <input 
              type="text" 
              [(ngModel)]="searchTerm" 
              (input)="filterPatients()" 
              placeholder="Rechercher patients..."
              class="search-input">
          </div>
        </div>
        <div class="nav-user" *ngIf="currentUser">
          <span class="welcome-text">{{ currentUser.prenom }} {{ currentUser.nom }}</span>
          <span class="user-role-badge role-secretaire">SECRÉTAIRE</span>
        </div>
      </nav>
      
      <div class="main-content">
        <aside class="sidebar">
          <div class="sidebar-content">
            <ul class="nav-menu">
              <li><a routerLink="/secretaire">📊 Tableau de bord</a></li>
              <li><a routerLink="/secretaire/patients" class="active">👥 Patients</a></li>
              <li><a routerLink="/secretaire/rendezvous">📅 Rendez-vous</a></li>
            </ul>
          </div>
          <div class="sidebar-footer">
            <div class="user-profile" *ngIf="currentUser">
              <div class="user-avatar" (click)="showProfileModal = true">
                <img *ngIf="currentUser.avatarUrl; else defaultAvatar" [src]="currentUser.avatarUrl" alt="Avatar">
                <ng-template #defaultAvatar>👤</ng-template>
              </div>
              <div class="user-details">
                <div class="user-name">{{ currentUser.prenom }} {{ currentUser.nom }}</div>
                <div class="user-role">Secrétaire</div>
              </div>
            </div>
            <button (click)="logout()" class="btn-logout-sidebar">
              <span class="logout-icon">🔓</span>
              Déconnexion
            </button>
          </div>
        </aside>
        
        <main class="content">
          <div class="header">
            <h2>👤 Gestion des Patients</h2>
            <div class="header-actions">
              <button (click)="showAddForm = !showAddForm" class="btn-primary">
                {{ showAddForm ? '✖️ Annuler' : '✚ Nouveau Patient' }}
              </button>
              <button (click)="loadPatients()" class="btn-refresh">↻ Actualiser</button>
            </div>
          </div>

          <div *ngIf="showAddForm" class="patient-form">
            <h3>{{ editingPatient ? 'Modifier' : 'Nouveau' }} Patient</h3>
            <form (ngSubmit)="savePatient()" #patientForm="ngForm">
              <div class="form-row">
                <div class="form-group">
                  <label>Nom *:</label>
                  <input [(ngModel)]="currentPatient.nom" name="nom" required 
                         minlength="2" maxlength="50" pattern="[a-zA-ZÀ-ÿ\s-']+" 
                         class="form-control" #nomField="ngModel">
                  <div *ngIf="nomField.invalid && nomField.touched" class="error-message">
                    <span *ngIf="nomField.errors?.['required']">Le nom est obligatoire</span>
                    <span *ngIf="nomField.errors?.['minlength']">Minimum 2 caractères</span>
                    <span *ngIf="nomField.errors?.['maxlength']">Maximum 50 caractères</span>
                    <span *ngIf="nomField.errors?.['pattern']">Seules les lettres sont autorisées</span>
                  </div>
                </div>
                <div class="form-group">
                  <label>Prénom *:</label>
                  <input [(ngModel)]="currentPatient.prenom" name="prenom" required 
                         minlength="2" maxlength="50" pattern="[a-zA-ZÀ-ÿ\s-']+" 
                         class="form-control" #prenomField="ngModel">
                  <div *ngIf="prenomField.invalid && prenomField.touched" class="error-message">
                    <span *ngIf="prenomField.errors?.['required']">Le prénom est obligatoire</span>
                    <span *ngIf="prenomField.errors?.['minlength']">Minimum 2 caractères</span>
                    <span *ngIf="prenomField.errors?.['maxlength']">Maximum 50 caractères</span>
                    <span *ngIf="prenomField.errors?.['pattern']">Seules les lettres sont autorisées</span>
                  </div>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Email *:</label>
                  <input type="email" [(ngModel)]="currentPatient.email" name="email" required 
                         pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" 
                         class="form-control" #emailField="ngModel">
                  <div *ngIf="emailField.invalid && emailField.touched" class="error-message">
                    <span *ngIf="emailField.errors?.['required']">L'email est obligatoire</span>
                    <span *ngIf="emailField.errors?.['email'] || emailField.errors?.['pattern']">Format email invalide</span>
                  </div>
                </div>
                <div class="form-group">
                  <label>Téléphone *:</label>
                  <input [(ngModel)]="currentPatient.telephone" name="telephone" required 
                         pattern="[0-9+\s-()]{8,15}" maxlength="15" 
                         class="form-control" #telephoneField="ngModel">
                  <div *ngIf="telephoneField.invalid && telephoneField.touched" class="error-message">
                    <span *ngIf="telephoneField.errors?.['required']">Le téléphone est obligatoire</span>
                    <span *ngIf="telephoneField.errors?.['pattern']">Format invalide (8-15 chiffres)</span>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label>Date de naissance *:</label>
                <input type="date" [(ngModel)]="currentPatient.dateNaissance" name="dateNaissance" required 
                       [max]="getMaxDate()" [min]="getMinDate()" 
                       class="form-control" #dateField="ngModel">
                <div *ngIf="dateField.invalid && dateField.touched" class="error-message">
                  <span *ngIf="dateField.errors?.['required']">La date de naissance est obligatoire</span>
                  <span *ngIf="dateField.errors?.['max']">Date future non autorisée</span>
                  <span *ngIf="dateField.errors?.['min']">Âge maximum 120 ans</span>
                </div>
              </div>
              <div class="form-actions">
                <button type="submit" [disabled]="!patientForm.valid" class="btn-save">💿 Sauvegarder</button>
                <button type="button" (click)="cancelEdit()" class="btn-cancel">✖️ Annuler</button>
              </div>
            </form>
          </div>

          <div class="filter-section">
            <input [(ngModel)]="searchTerm" (input)="filterPatients()" placeholder="Rechercher un patient..." class="search-input">
          </div>

          <div class="pagination-info">
            <p>Page {{ currentPage }} sur {{ totalPages }} ({{ filteredPatients.length }} patients au total)</p>
          </div>

          <div class="patients-grid">
            <div *ngFor="let patient of paginatedPatients" class="patient-card">
              <div class="patient-header">
                <h4>{{ patient.prenom }} {{ patient.nom }}</h4>

              </div>
              <div class="patient-info">
                <p><strong>✉️</strong> {{ patient.email }}</p>
                <p><strong>☎️</strong> {{ patient.telephone }}</p>
                <p><strong>🗓️</strong> {{ patient.dateNaissance | date:'dd/MM/yyyy' }}</p>
              </div>
              <div class="patient-actions">
                <button (click)="viewHistory(patient)" class="btn-history">Historique</button>
                <button (click)="editPatient(patient)" class="btn-edit">Modifier</button>
                <button (click)="viewPatient(patient)" class="btn-view">Voir</button>
              </div>
              <button (click)="scheduleAppointment(patient)" class="btn-appointment">🗓️ Planifier RDV</button>
            </div>
          </div>

          <div class="pagination-controls" *ngIf="totalPages > 1">
            <button (click)="prevPage()" [disabled]="currentPage === 1" class="btn-pagination">← Précédent</button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button (click)="nextPage()" [disabled]="currentPage === totalPages" class="btn-pagination">Suivant →</button>
          </div>
        </main>
      </div>
      <footer class="global-footer">
        <div class="footer-content">
          © kfokam48 2025 - Gestion Clinique
        </div>
      </footer>
      <app-profile-modal 
        [isVisible]="showProfileModal" 
        [currentUser]="currentUser"
        (closed)="showProfileModal = false"
        (avatarUpdated)="onAvatarUpdated($event)">
      </app-profile-modal>
      
      <app-patient-history-modal 
        [isVisible]="showHistoryModal" 
        [patient]="selectedPatient"
        (closed)="showHistoryModal = false">
      </app-patient-history-modal>
    </div>
  `,
  styles: [`
    .dashboard-container { height: 100vh; background: linear-gradient(135deg, #e8f5e8, #f0f8f0, #e1f5e1); display: flex; flex-direction: column; overflow: hidden; }
    .navbar { background-color: #28a745; color: #fff; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; gap: 2rem; }
    .nav-brand h1 { margin: 0; }
    .nav-search { flex: 1; max-width: 500px; }
    .search-container { position: relative; }
    .search-input { width: 100%; padding: 0.75rem 1rem; border: none; border-radius: 25px; font-size: 1rem; outline: none; }
    .nav-user { display: flex; align-items: center; gap: 1rem; }
    .welcome-text { font-weight: 600; }
    .user-role-badge { padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; }
    .role-secretaire { background: rgba(255,255,255,0.2); color: #fff; }
    .main-content { display: flex; }
    .sidebar { width: 250px; background-color: white; min-height: calc(100vh - 80px); box-shadow: 2px 0 5px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
    .sidebar-content { flex: 1; }
    .nav-menu { list-style: none; padding: 0; margin: 0; }
    .nav-menu li a { display: block; padding: 1rem 1.5rem; text-decoration: none; color: #333; border-bottom: 1px solid #eee; }
    .nav-menu li a:hover, .nav-menu li a.active { background-color: #28a745; color: #fff; }
    .sidebar-footer { padding: 1rem; padding-bottom: 60px; border-top: 1px solid #eee; background: #f8f9fa; }
    .user-profile { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .user-avatar { width: 40px; height: 40px; background: linear-gradient(135deg, #28a745, #20c997); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #fff; cursor: pointer; transition: transform 0.3s; } .user-avatar:hover { transform: scale(1.1); } .user-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
    .user-details { flex: 1; }
    .user-name { font-weight: bold; font-size: 0.9rem; color: #333; }
    .user-role { font-size: 0.8rem; color: #666; }
    .btn-logout-sidebar { width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #dc3545, #c82333); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s ease; }
    .btn-logout-sidebar:hover { background: linear-gradient(135deg, #c82333, #a71e2a); transform: translateY(-1px); box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3); }
    .logout-icon { font-size: 1.1rem; }
    .content { flex: 1; padding: 2rem; }
    .global-footer { background-color: #f8f9fa; border-top: 1px solid #dee2e6; padding: 1rem 0; flex-shrink: 0; }
    .footer-content { text-align: center; font-size: 0.9rem; color: #666; font-weight: 500; }
    .navbar { background: linear-gradient(135deg, #28a745, #20c997); color: #fff; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
    .nav-brand h1 { margin: 0; font-weight: bold; }
    .nav-user { display: flex; align-items: center; gap: 1rem; }
    .btn-logout { background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer; }
    .main-content { display: flex; flex: 1; overflow: hidden; }
    .sidebar { width: 250px; background: white; overflow-y: auto; flex-shrink: 0; }
    .nav-menu { list-style: none; padding: 0; margin: 0; }
    .nav-menu li a { display: block; padding: 1rem 1.5rem; text-decoration: none; color: #333; border-bottom: 1px solid #eee; }
    .nav-menu li a:hover, .nav-menu li a.active { background: #28a745; color: #fff; font-weight: bold; }
    .content { flex: 1; padding: 2rem; overflow-y: auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .header h2 { margin: 0; color: #333; }
    .header-actions { display: flex; gap: 1rem; }
    .btn-primary { 
      background: linear-gradient(135deg, #28a745, #20c997); 
      color: #fff; 
      padding: 0.75rem 1.5rem; 
      border: none; 
      border-radius: 8px; 
      cursor: pointer; 
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 3px 8px rgba(40, 167, 69, 0.2);
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-primary:hover { 
      background: linear-gradient(135deg, #20c997, #1e7e34); 
      transform: translateY(-2px); 
      box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4);
    }
    .patient-form { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; color: #333; }
    .form-control { width: 100%; padding: 0.75rem; border: 2px solid #e0e6ed; border-radius: 8px; box-sizing: border-box; }
    .form-control:focus { outline: none; border-color: #28a745; }
    .form-actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .btn-save { background: #28a745; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
    .btn-cancel { background: #dc3545; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
    /* Styles de recherche gérés par styles.css global */
    .patients-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .patient-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 4px solid #28a745; }
    .patient-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .patient-header h4 { margin: 0; color: #333; }
    .patient-actions { 
      display: flex; 
      gap: 0.5rem; 
      justify-content: space-between; 
      margin-top: 1rem; 
      flex-wrap: wrap;
    }
    .btn-history, .btn-edit, .btn-view { 
      background: linear-gradient(135deg, #6c757d, #5a6268); 
      color: white; 
      border: none; 
      padding: 0.5rem 0.75rem; 
      border-radius: 6px; 
      cursor: pointer; 
      font-size: 0.8rem; 
      font-weight: 600; 
      transition: all 0.3s ease; 
      box-shadow: 0 1px 3px rgba(0,0,0,0.12); 
      flex: 1;
      text-align: center;
      min-width: 0;
    }
    .btn-history { background: linear-gradient(135deg, #17a2b8, #138496); }
    .btn-history:hover { background: linear-gradient(135deg, #138496, #117a8b); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3); }
    .btn-edit { background: linear-gradient(135deg, #28a745, #20c997); }
    .btn-edit:hover { background: linear-gradient(135deg, #20c997, #1e7e34); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3); }
    .btn-view { background: linear-gradient(135deg, #007bff, #0056b3); }
    .btn-view:hover { background: linear-gradient(135deg, #0056b3, #004085); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3); }
    .patient-info p { margin: 0.5rem 0; color: #666; }
    .btn-appointment { 
      width: 100%; 
      background: linear-gradient(135deg, #28a745, #20c997); 
      color: #fff; 
      border: none; 
      padding: 0.85rem; 
      border-radius: 10px; 
      cursor: pointer; 
      font-weight: 700; 
      font-size: 0.95rem;
      margin-top: 1.5rem; 
      transition: all 0.3s ease;
      box-shadow: 0 3px 8px rgba(40, 167, 69, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .btn-appointment:hover { 
      background: linear-gradient(135deg, #20c997, #1e7e34); 
      transform: translateY(-2px); 
      box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4);
    }
    .pagination-info { text-align: center; margin-bottom: 1rem; color: #666; }
    .pagination-controls { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem; padding: 1rem; background: white; border-radius: 8px; }
    .btn-pagination { padding: 0.5rem 1rem; border: 1px solid #28a745; background: white; color: #28a745; border-radius: 4px; cursor: pointer; }
    .btn-pagination:hover:not(:disabled) { background: #28a745; color: white; }
    .btn-pagination:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-info { font-weight: bold; color: #333; }
    .global-footer { background: #f8f9fa; border-top: 1px solid #dee2e6; padding: 1rem 0; text-align: center; color: #666; }
    .error-message { color: #dc3545; font-size: 0.8rem; margin-top: 0.25rem; display: block; }
    .form-control.ng-invalid.ng-touched { border-color: #dc3545; box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25); }
    .form-control.ng-valid.ng-touched { border-color: #28a745; box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25); }
  `]
})
export class SecretairePatientsComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  currentPatient: Patient = this.initPatient();
  showAddForm = false;
  editingPatient = false;
  currentUser: User | null = null;
  searchTerm = '';
  showProfileModal = false;
  showHistoryModal = false;
  selectedPatient: Patient | null = null;
  currentPage = 1;
  patientsPerPage = 10;
  paginatedPatients: any[] = [];

  constructor(
    private patientService: PatientService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.loadPatients();
  }

  loadPatients(): void {
    this.patientService.getAllPatients().subscribe({
      next: patients => {
        this.patients = patients;
        this.filteredPatients = patients;
        this.currentPage = 1;
        this.updatePaginatedPatients();
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

  filterPatients(): void {
    if (!this.searchTerm) {
      this.filteredPatients = this.patients;
    } else {
      this.filteredPatients = this.patients.filter(patient =>
        patient.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        patient.prenom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.currentPage = 1;
    this.updatePaginatedPatients();
  }

  updatePaginatedPatients(): void {
    const startIndex = (this.currentPage - 1) * this.patientsPerPage;
    const endIndex = startIndex + this.patientsPerPage;
    this.paginatedPatients = this.filteredPatients.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPatients.length / this.patientsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedPatients();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedPatients();
    }
  }

  savePatient(): void {
    if (this.editingPatient) {
      this.patientService.updatePatient(this.currentPatient.id!, this.currentPatient).subscribe({
        next: () => {
          this.loadPatients();
          this.cancelEdit();
          // Patient modifié silencieusement
        },
        error: () => {
          this.notificationService.error('Erreur', 'Impossible de modifier le patient');
        }
      });
    } else {
      this.patientService.createPatient(this.currentPatient).subscribe({
        next: () => {
          this.loadPatients();
          this.cancelEdit();
          // Patient créé silencieusement
        },
        error: () => {
          this.notificationService.error('Erreur', 'Impossible de créer le patient');
        }
      });
    }
  }

  editPatient(patient: Patient): void {
    this.currentPatient = { ...patient };
    this.editingPatient = true;
    this.showAddForm = true;
  }

  viewHistory(patient: Patient): void {
    this.selectedPatient = patient;
    this.showHistoryModal = true;
  }

  viewPatient(patient: Patient): void {
    this.notificationService.info('Patient', `${patient.prenom} ${patient.nom} - ${patient.email}`);
  }

  scheduleAppointment(patient: Patient): void {
    this.router.navigate(['/secretaire/rendezvous'], { queryParams: { patientId: patient.id } });
  }

  cancelEdit(): void {
    this.currentPatient = this.initPatient();
    this.editingPatient = false;
    this.showAddForm = false;
  }

  onAvatarUpdated(avatarUrl: string): void {
    if (this.currentUser) {
      this.currentUser.avatarUrl = avatarUrl;
    }
  }

  getMaxDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getMinDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 120);
    return date.toISOString().split('T')[0];
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
      }
    });
  }
}