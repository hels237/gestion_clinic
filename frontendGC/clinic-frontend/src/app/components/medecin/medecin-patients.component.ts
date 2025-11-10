import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProfileModalComponent } from '../shared/profile-modal.component';
import { PatientHistoryModalComponent } from './patient-history-modal.component';
import { PatientService } from '../../services/patient.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-medecin-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProfileModalComponent, PatientHistoryModalComponent],
  template: `
    <div class="dashboard-container">
      <nav class="navbar">
        <div class="nav-brand">
          <h1>Gestion Clinique</h1>
        </div>
        <div class="nav-user" *ngIf="currentUser">
          <span class="welcome-text">Dr. {{ currentUser.prenom }} {{ currentUser.nom }}</span>
          <span class="user-role-badge role-medecin">MÉDECIN</span>
        </div>
      </nav>
      
      <div class="main-content">
        <aside class="sidebar">
          <div class="sidebar-content">
            <ul class="nav-menu">
              <li><a routerLink="/medecin">📊 Tableau de bord</a></li>
              <li><a routerLink="/medecin/patients" class="active">👥 Mes Patients</a></li>
              <li><a routerLink="/medecin/rendezvous">📅 Mes Rendez-vous</a></li>
              <li><a routerLink="/medecin/prescriptions">💊 Prescriptions</a></li>
            </ul>
          </div>
          <div class="sidebar-footer">
            <div class="user-profile" *ngIf="currentUser">
              <div class="user-avatar" (click)="showProfileModal = true">
                <img *ngIf="currentUser.avatarUrl; else defaultAvatar" [src]="currentUser.avatarUrl" alt="Avatar">
                <ng-template #defaultAvatar>👨⚕️</ng-template>
              </div>
              <div class="user-details">
                <div class="user-name">Dr. {{ currentUser.prenom }} {{ currentUser.nom }}</div>
                <div class="user-role">Médecin</div>
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
            <h2>👤 Mes Patients</h2>
            <div class="header-actions">
              <button (click)="loadPatients()" class="btn-refresh" type="button">↻ Actualiser</button>
            </div>
          </div>

          <div class="filter-section">
            <input type="text" [(ngModel)]="searchQuery" (input)="filterPatients()" 
                   placeholder="Rechercher un patient..." class="search-input">
          </div>

          <div class="pagination-info">
            <p>Page {{ currentPage }} sur {{ totalPages }} ({{ filteredPatients.length }} patients au total)</p>
          </div>

          <div class="patients-grid">
            <div *ngFor="let patient of paginatedPatients" class="patient-card">
              <div class="patient-header">
                <h4>👤 {{ patient.prenom }} {{ patient.nom }}</h4>
                <span class="patient-age">{{ calculateAge(patient.dateNaissance) }} ans</span>
              </div>
              <div class="patient-details">
                <p><strong>✉️ Email:</strong> {{ patient.email }}</p>
                <p><strong>☎️ Téléphone:</strong> {{ patient.telephone }}</p>
                <p><strong>🗓️ Né(e) le:</strong> {{ patient.dateNaissance | date:'dd/MM/yyyy' }}</p>
                <div *ngIf="patient.antecedents" class="patient-medical">
                  <p><strong>🏨 Antécédents:</strong> {{ patient.antecedents }}</p>
                </div>
                <div *ngIf="patient.allergies" class="patient-medical">
                  <p><strong>⚠️ Allergies:</strong> {{ patient.allergies }}</p>
                </div>
              </div>
              <div class="patient-actions">
                <button (click)="viewHistory(patient)" class="btn-info">Historique</button>
                <button (click)="scheduleAppointment(patient)" class="btn-primary">Nouveau RDV</button>
                <button (click)="createPrescription(patient)" class="btn-success">Prescription</button>
              </div>
            </div>
          </div>

          <div *ngIf="filteredPatients.length === 0" class="no-patients">
            <p>Aucun patient trouvé</p>
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
    .dashboard-container { height: 100vh; background: linear-gradient(rgba(255,255,255,0.3), rgba(0,123,255,0.2)), url('https://mydoctorsclinicsurfers.com.au/wp-content/uploads/2023/04/contact-Banner.jpeg'); background-size: cover; background-position: center; background-attachment: fixed; display: flex; flex-direction: column; overflow: hidden; }
    .navbar { background-color: #007bff; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
    .nav-brand h1 { margin: 0; }
    .nav-user { display: flex; align-items: center; gap: 1rem; }
    .welcome-text { font-weight: 600; }
    .user-role-badge { padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; }
    .role-medecin { background: rgba(40,167,69,0.8); color: #fff; }
    .main-content { display: flex; flex: 1; overflow: hidden; }
    .sidebar { width: 250px; background-color: white; box-shadow: 2px 0 5px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; }
    .sidebar-content { flex: 1; }
    .nav-menu { list-style: none; padding: 0; margin: 0; }
    .nav-menu li a { display: block; padding: 1rem 1.5rem; text-decoration: none; color: #333; border-bottom: 1px solid #eee; }
    .nav-menu li a:hover, .nav-menu li a.active { background-color: #007bff; color: white; }
    .sidebar-footer { padding: 1rem; padding-bottom: 60px; border-top: 1px solid #eee; background: #f8f9fa; }
    .user-profile { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .user-avatar { width: 40px; height: 40px; background: linear-gradient(135deg, #007bff, #0056b3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: white; cursor: pointer; transition: transform 0.3s; } .user-avatar:hover { transform: scale(1.1); } .user-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
    .user-details { flex: 1; }
    .user-name { font-weight: bold; font-size: 0.9rem; color: #333; }
    .user-role { font-size: 0.8rem; color: #666; }
    .btn-logout-sidebar { width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #dc3545, #c82333); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s ease; }
    .btn-logout-sidebar:hover { background: linear-gradient(135deg, #c82333, #a71e2a); transform: translateY(-1px); box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3); }
    .logout-icon { font-size: 1.1rem; }
    .content { flex: 1; padding: 2rem; overflow-y: auto; }
    .global-footer { background-color: #f8f9fa; border-top: 1px solid #dee2e6; padding: 1rem 0; flex-shrink: 0; }
    .footer-content { text-align: center; font-size: 0.9rem; color: #666; font-weight: 500; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .header h2 { margin: 0; color: #333; }
    .header-actions { display: flex; gap: 1rem; }
    /* Style géré par styles.css global */
    /* Styles de recherche gérés par styles.css global */
    .patients-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
    .patient-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 4px solid #007bff; }
    .patient-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .patient-header h4 { margin: 0; color: #333; }
    .patient-age { background: #e3f2fd; color: #1976d2; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: bold; }
    .patient-details { margin-bottom: 1rem; }
    .patient-details p { margin: 0.5rem 0; color: #666; }
    .patient-medical { background: #f8f9fa; padding: 0.75rem; border-radius: 6px; margin: 0.5rem 0; }
    .patient-actions { 
      display: flex; 
      gap: 0.5rem; 
      justify-content: space-between; 
      margin-top: 1.5rem; 
      flex-wrap: wrap;
    }
    .btn-info, .btn-primary, .btn-success { 
      padding: 0.6rem 0.8rem; 
      border: none; 
      border-radius: 8px; 
      cursor: pointer; 
      font-size: 0.8rem; 
      font-weight: 600;
      color: white; 
      transition: all 0.3s ease;
      box-shadow: 0 2px 6px rgba(0,0,0,0.12);
      flex: 1;
      text-align: center;
      min-width: 0;
    }
    .btn-info { 
      background: linear-gradient(135deg, #17a2b8, #138496); 
    }
    .btn-info:hover { 
      background: linear-gradient(135deg, #138496, #117a8b); 
      transform: translateY(-3px); 
      box-shadow: 0 6px 16px rgba(23, 162, 184, 0.4);
    }
    .btn-primary { 
      background: linear-gradient(135deg, #007bff, #0056b3); 
    }
    .btn-primary:hover { 
      background: linear-gradient(135deg, #0056b3, #004085); 
      transform: translateY(-3px); 
      box-shadow: 0 6px 16px rgba(0, 123, 255, 0.4);
    }
    .btn-success { 
      background: linear-gradient(135deg, #28a745, #20c997); 
    }
    .btn-success:hover { 
      background: linear-gradient(135deg, #20c997, #1e7e34); 
      transform: translateY(-3px); 
      box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4);
    }
    .no-patients { text-align: center; padding: 3rem; color: #666; background: white; border-radius: 12px; }
    .pagination-info { text-align: center; margin-bottom: 1rem; color: #666; }
    .pagination-controls { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem; padding: 1rem; background: white; border-radius: 8px; }
    .btn-pagination { padding: 0.5rem 1rem; border: 1px solid #007bff; background: white; color: #007bff; border-radius: 4px; cursor: pointer; }
    .btn-pagination:hover:not(:disabled) { background: #007bff; color: white; }
    .btn-pagination:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-info { font-weight: bold; color: #333; }
  `]
})
export class MedecinPatientsComponent implements OnInit {
  patients: any[] = [];
  filteredPatients: any[] = [];
  currentUser: User | null = null;
  searchQuery = '';
  showProfileModal = false;
  showHistoryModal = false;
  selectedPatient: any = null;
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
    console.log('=== BOUTON ACTUALISER PATIENTS CLIQUÉ ===');
    this.patientService.getAllPatients().subscribe({
      next: patients => {
        console.log('Patients chargés:', patients);
        this.patients = patients;
        this.filteredPatients = patients;
        this.currentPage = 1;
        this.updatePaginatedPatients();
        // Patients chargés silencieusement
      },
      error: (error) => {
        console.error('Erreur lors du chargement des patients:', error);
        this.notificationService.error('Erreur', 'Impossible de charger les patients');
      }
    });
  }

  filterPatients(): void {
    if (!this.searchQuery) {
      this.filteredPatients = this.patients;
    } else {
      this.filteredPatients = this.patients.filter(patient =>
        patient.nom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        patient.prenom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(this.searchQuery.toLowerCase())
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

  calculateAge(dateNaissance: string): number {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  scheduleAppointment(patient: any): void {
    this.router.navigate(['/medecin/rendezvous'], { queryParams: { patientId: patient.id } });
  }

  createPrescription(patient: any): void {
    this.router.navigate(['/medecin/prescriptions'], { queryParams: { patientId: patient.id } });
  }

  viewHistory(patient: any): void {
    this.selectedPatient = patient;
    this.showHistoryModal = true;
  }

  onAvatarUpdated(avatarUrl: string): void {
    if (this.currentUser) {
      this.currentUser.avatarUrl = avatarUrl;
    }
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