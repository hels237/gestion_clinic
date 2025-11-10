import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ProfileModalComponent } from '../shared/profile-modal.component';
import { ConflictModalComponent } from '../shared/conflict-modal.component';
import { CancelModalComponent } from '../shared/cancel-modal.component';
import { RendezVousService } from '../../services/rendezvous.service';
import { PatientService } from '../../services/patient.service';
import { MedecinService } from '../../services/medecin.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-secretaire-rendezvous',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProfileModalComponent, ConflictModalComponent, CancelModalComponent],
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
              placeholder="Rechercher rendez-vous..."
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
              <li><a routerLink="/secretaire/patients">👥 Patients</a></li>
              <li><a routerLink="/secretaire/rendezvous" class="active">📅 Rendez-vous</a></li>
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
              <span class="logout-icon">🚪</span>
              Déconnexion
            </button>
          </div>
        </aside>
        
        <main class="content">
          <div class="header">
            <h2>📅 Gestion des Rendez-vous</h2>
            <div class="header-actions">
              <button (click)="showAddForm = !showAddForm" class="btn-primary">
                {{ showAddForm ? '❌ Annuler' : '➕ Nouveau RDV' }}
              </button>
              <button (click)="loadRendezVous()" class="btn-refresh">↻ Actualiser</button>
            </div>
          </div>

          <div *ngIf="showAddForm" class="rdv-form">
            <h3>{{ editingRdv ? 'Modifier' : 'Nouveau' }} Rendez-vous</h3>
            <form (ngSubmit)="saveRendezVous()" #rdvForm="ngForm">
              <div class="form-row">
                <div class="form-group">
                  <label>Patient *:</label>
                  <select [(ngModel)]="currentRdv.patientId" name="patientId" required class="form-control">
                    <option value="">Sélectionner un patient</option>
                    <option *ngFor="let patient of patients" [value]="patient.id">
                      {{ patient.prenom }} {{ patient.nom }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Médecin *:</label>
                  <select [(ngModel)]="currentRdv.medecinId" name="medecinId" required class="form-control">
                    <option value="">Sélectionner un médecin</option>
                    <option *ngFor="let medecin of medecins" [value]="medecin.id">
                      Dr. {{ medecin.prenom }} {{ medecin.nom }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Date *:</label>
                  <input type="date" [(ngModel)]="currentRdv.date" name="date" required 
                         [min]="getTodayDate()" [max]="getMaxRdvDate()" 
                         class="form-control" #dateRdvField="ngModel">
                  <div *ngIf="dateRdvField.invalid && dateRdvField.touched" class="error-message">
                    <span *ngIf="dateRdvField.errors?.['required']">Date obligatoire</span>
                    <span *ngIf="dateRdvField.errors?.['min']">Date passée non autorisée</span>
                    <span *ngIf="dateRdvField.errors?.['max']">Maximum 6 mois à l'avance</span>
                  </div>
                </div>
                <div class="form-group">
                  <label>Heure *:</label>
                  <input type="time" [(ngModel)]="currentRdv.heure" name="heure" required 
                         min="08:00" max="18:00" 
                         class="form-control" #heureField="ngModel">
                  <div *ngIf="heureField.invalid && heureField.touched" class="error-message">
                    <span *ngIf="heureField.errors?.['required']">Heure obligatoire</span>
                    <span *ngIf="heureField.errors?.['min'] || heureField.errors?.['max']">Horaires: 8h-18h</span>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label>Motif:</label>
                <textarea [(ngModel)]="currentRdv.motif" name="motif" 
                          maxlength="500" rows="3" 
                          class="form-control" #motifField="ngModel"></textarea>
                <div *ngIf="motifField.invalid && motifField.touched" class="error-message">
                  <span *ngIf="motifField.errors?.['maxlength']">Maximum 500 caractères</span>
                </div>
              </div>
              <div class="form-group">
                <label>Salle:</label>
                <input [(ngModel)]="currentRdv.salle" name="salle" 
                       maxlength="20" pattern="[a-zA-Z0-9\s-]+" 
                       class="form-control" placeholder="Ex: Salle 101" #salleField="ngModel">
                <div *ngIf="salleField.invalid && salleField.touched" class="error-message">
                  <span *ngIf="salleField.errors?.['pattern']">Caractères alphanumériques uniquement</span>
                </div>
              </div>
              <div class="form-actions">
                <button type="submit" [disabled]="!rdvForm.valid" class="btn-save">💾 Sauvegarder</button>
                <button type="button" (click)="cancelEdit()" class="btn-cancel">❌ Annuler</button>
              </div>
            </form>
          </div>

          <div class="filter-section">
            <div class="filters">
              <select [(ngModel)]="statusFilter" (change)="filterRendezVous()" class="filter-select">
                <option value="">Tous les statuts</option>
                <option value="PLANIFIE">Planifié</option>
                <option value="CONFIRME">Confirmé</option>
                <option value="ANNULE">Annulé</option>
                <option value="TERMINE">Terminé</option>
              </select>
              <input type="date" [(ngModel)]="dateFilter" (change)="filterRendezVous()" class="filter-date">
            </div>
          </div>

          <div class="rdv-timeline">
            <div *ngFor="let rdv of filteredRendezVous" class="rdv-card" [class]="'status-' + rdv.statut?.toLowerCase()">
              <div class="rdv-header">
                <div class="rdv-time">
                  <strong>{{ rdv.dateHeureDebut | date:'dd/MM/yyyy HH:mm' }}</strong>
                </div>
                <div class="rdv-status">
                  <span class="status-badge" [class]="'badge-' + rdv.statut?.toLowerCase()">{{ getStatusDisplay(rdv.statut) }}</span>
                </div>
              </div>
              <div class="rdv-details">
                <div class="rdv-patient">
                  <h4>👤 {{ getPatientName(rdv) }}</h4>
                  <p>📞 {{ getPatientPhone(rdv) }}</p>
                </div>
                <div class="rdv-medecin">
                  <h5>👨‍⚕️ {{ getMedecinName(rdv) }}</h5>
                </div>
                <div class="rdv-motif" *ngIf="rdv.motif">
                  <p><strong>Motif:</strong> {{ rdv.motif }}</p>
                </div>
                <div class="rdv-salle" *ngIf="rdv.salle">
                  <p><strong>🏥 Salle:</strong> {{ rdv.salle }}</p>
                </div>
              </div>
              <div class="rdv-actions">
                <button (click)="editRendezVous(rdv)" class="btn-edit">✏️ Modifier</button>
                <button (click)="confirmRendezVous(rdv)" *ngIf="rdv.statut === 'PLANIFIE'" class="btn-confirm">✅ Confirmer</button>
                <button (click)="cancelRendezVous(rdv)" *ngIf="rdv.statut !== 'ANNULE'" class="btn-cancel-rdv">❌ Annuler</button>
              </div>
            </div>
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
      
      <app-conflict-modal
        [isVisible]="showConflictModal"
        [message]="conflictMessage"
        (closed)="showConflictModal = false">
      </app-conflict-modal>
      
      <app-cancel-modal
        [isVisible]="showCancelModal"
        (closed)="showCancelModal = false"
        (confirmed)="confirmCancelRendezVous($event)">
      </app-cancel-modal>
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
    .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem; padding: 1rem; background: white; border-radius: 8px; }
    .btn-pagination { padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; color: #333; border-radius: 4px; cursor: pointer; }
    .btn-pagination:hover:not(:disabled) { background: #f8f9fa; }
    .btn-pagination:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination-info { font-weight: 600; color: #333; }
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
    .btn-primary, .btn-secondary { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-primary { background: #28a745; color: #fff; }
    .btn-secondary { background: #6c757d; color: white; }
    .rdv-form { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; color: #333; }
    .form-control { width: 100%; padding: 0.75rem; border: 2px solid #e0e6ed; border-radius: 8px; box-sizing: border-box; }
    .form-control:focus { outline: none; border-color: #28a745; }
    .form-actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .btn-save { background: #28a745; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
    .btn-cancel { background: #dc3545; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
    /* Styles de filtres gérés par styles.css global */
    .rdv-timeline { display: flex; flex-direction: column; gap: 1rem; }
    .rdv-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 4px solid #28a745; }
    .rdv-card.status-confirme { border-left-color: #28a745; }
    .rdv-card.status-annule { border-left-color: #dc3545; }
    .rdv-card.status-termine { border-left-color: #6c757d; }
    .rdv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .rdv-time { color: #333; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
    .badge-programme { background: #e3f2fd; color: #1976d2; }
    .badge-confirme { background: #e8f5e8; color: #2e7d32; }
    .badge-annule { background: #ffebee; color: #c62828; }
    .badge-termine { background: #f3e5f5; color: #7b1fa2; }
    .rdv-details { margin-bottom: 1rem; }
    .rdv-patient h4, .rdv-medecin h5 { margin: 0.5rem 0; }
    .rdv-patient p { margin: 0.25rem 0; color: #666; }
    .rdv-motif p { margin: 0.5rem 0; color: #666; }
    .rdv-actions { display: flex; gap: 0.5rem; }
    .btn-edit, .btn-confirm, .btn-cancel-rdv { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
    .btn-edit { background: #007bff; color: white; }
    .btn-confirm { background: #28a745; color: white; }
    .btn-cancel-rdv { background: #dc3545; color: white; }
    .global-footer { background: #f8f9fa; border-top: 1px solid #dee2e6; padding: 1rem 0; text-align: center; color: #666; }
    .error-message { color: #dc3545; font-size: 0.8rem; margin-top: 0.25rem; display: block; }
    .form-control.ng-invalid.ng-touched { border-color: #dc3545; box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25); }
    .form-control.ng-valid.ng-touched { border-color: #28a745; box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25); }
  `]
})
export class SecretaireRendezVousComponent implements OnInit {
  rendezVous: any[] = [];
  filteredRendezVous: any[] = [];
  patients: any[] = [];
  medecins: any[] = [];
  currentRdv: any = this.initRdv();
  showAddForm = false;
  editingRdv = false;
  currentUser: User | null = null;
  statusFilter = '';
  dateFilter = '';
  showProfileModal = false;
  showConflictModal = false;
  conflictMessage = '';
  showCancelModal = false;
  rdvToCancel: any = null;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  constructor(
    private rendezVousService: RendezVousService,
    private patientService: PatientService,
    private medecinService: MedecinService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.loadData();
    
    this.route.queryParams.subscribe(params => {
      if (params['patientId']) {
        this.currentRdv.patientId = +params['patientId'];
        this.showAddForm = true;
      }
    });
  }

  loadData(): void {
    this.loadRendezVous();
    this.loadPatients();
    this.loadMedecins();
  }

  loadRendezVous(): void {
    console.log('🔄 Actualisation des rendez-vous...');
    this.rendezVousService.getAllRendezVous().subscribe({
      next: rdv => {
        console.log('✅ Rendez-vous chargés:', rdv.length);
        // Trier du plus récent au plus ancien
        this.rendezVous = rdv.sort((a, b) => new Date(b.dateHeureDebut).getTime() - new Date(a.dateHeureDebut).getTime());
        this.currentPage = 1;
        this.filterRendezVous();
        // Rendez-vous chargés silencieusement
      },
      error: (error) => {
        console.error('❌ Erreur chargement:', error);
        this.notificationService.error('Erreur', 'Impossible de charger les rendez-vous');
      }
    });
  }

  loadPatients(): void {
    this.patientService.getAllPatients().subscribe({
      next: patients => this.patients = patients,
      error: () => {}
    });
  }

  loadMedecins(): void {
    this.medecinService.getAllMedecins().subscribe({
      next: medecins => this.medecins = medecins,
      error: () => {}
    });
  }

  initRdv(): any {
    return {
      patientId: '',
      medecinId: '',
      date: '',
      heure: '',
      motif: '',
      salle: ''
    };
  }

  filterRendezVous(): void {
    const filtered = this.rendezVous.filter(rdv => {
      const statusMatch = !this.statusFilter || rdv.statut === this.statusFilter;
      const dateMatch = !this.dateFilter || rdv.dateHeure?.startsWith(this.dateFilter);
      return statusMatch && dateMatch;
    });
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.updatePaginatedResults(filtered);
  }

  updatePaginatedResults(filtered: any[]): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredRendezVous = filtered.slice(startIndex, endIndex);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.filterRendezVous();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.filterRendezVous();
    }
  }

  saveRendezVous(): void {
    console.log('Tentative de sauvegarde du rendez-vous:', this.currentRdv);
    console.log('Mode édition:', this.editingRdv);
    
    const rdvData = {
      ...this.currentRdv,
      dateHeureDebut: `${this.currentRdv.date}T${this.currentRdv.heure}:00`,
      dateHeureFin: `${this.currentRdv.date}T${this.currentRdv.heure}:00`
    };
    
    // Supprimer les champs temporaires
    delete rdvData.date;
    delete rdvData.heure;
    
    console.log('Données à envoyer:', rdvData);

    if (this.editingRdv) {
      console.log('Modification du rendez-vous avec ID:', this.currentRdv.id);
      const updateData = {
        patientId: this.currentRdv.patientId,
        medecinId: this.currentRdv.medecinId,
        dateHeureDebut: rdvData.dateHeureDebut,
        motif: this.currentRdv.motif,
        salle: this.currentRdv.salle
      };
      this.rendezVousService.updateRendezVous(this.currentRdv.id, updateData).subscribe({
        next: (response) => {
          console.log('Rendez-vous modifié avec succès:', response);
          this.loadRendezVous();
          this.cancelEdit();
          // Rendez-vous modifié silencieusement
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          
          if (error.status === 409 || (error.error && error.error.includes('conflit'))) {
            this.conflictMessage = 'Créneau déjà occupé pour ce médecin à cette heure';
            this.showConflictModal = true;
          } else {
            let errorMessage = 'Impossible de modifier le rendez-vous';
            if (error.error && typeof error.error === 'string') {
              errorMessage = error.error;
            }
            this.notificationService.error('Erreur', errorMessage);
          }
        }
      });
    } else {
      console.log('Création d\'un nouveau rendez-vous');
      this.rendezVousService.createRendezVous(rdvData).subscribe({
        next: (response) => {
          console.log('Rendez-vous créé avec succès:', response);
          this.loadRendezVous();
          this.cancelEdit();
          // Rendez-vous créé silencieusement
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          
          if (error.status === 409 || (error.error && error.error.includes('conflit'))) {
            this.conflictMessage = 'Créneau déjà occupé pour ce médecin à cette heure';
            this.showConflictModal = true;
          } else {
            let errorMessage = 'Impossible de créer le rendez-vous';
            if (error.error && typeof error.error === 'string') {
              errorMessage = error.error;
            }
            this.notificationService.error('Erreur', errorMessage);
          }
        }
      });
    }
  }

  editRendezVous(rdv: any): void {
    console.log('Édition du rendez-vous:', rdv);
    console.log('dateHeureDebut reçue:', rdv.dateHeureDebut);
    
    let date = '';
    let heure = '';
    
    if (rdv.dateHeureDebut) {
      try {
        const dateTime = new Date(rdv.dateHeureDebut);
        if (!isNaN(dateTime.getTime())) {
          date = dateTime.toISOString().split('T')[0];
          heure = dateTime.toTimeString().slice(0, 5);
        } else {
          console.error('Date invalide:', rdv.dateHeureDebut);
          const now = new Date();
          date = now.toISOString().split('T')[0];
          heure = now.toTimeString().slice(0, 5);
        }
      } catch (error) {
        console.error('Erreur lors du parsing de la date:', error);
        const now = new Date();
        date = now.toISOString().split('T')[0];
        heure = now.toTimeString().slice(0, 5);
      }
    } else {
      const now = new Date();
      date = now.toISOString().split('T')[0];
      heure = now.toTimeString().slice(0, 5);
    }
    
    this.currentRdv = {
      id: rdv.id,
      patientId: rdv.patientId,
      medecinId: rdv.medecinDTO?.id,
      date: date,
      heure: heure,
      motif: rdv.motif,
      salle: rdv.salle
    };
    
    console.log('currentRdv après édition:', this.currentRdv);
    this.editingRdv = true;
    this.showAddForm = true;
  }

  confirmRendezVous(rdv: any): void {
    this.rendezVousService.updateRendezVousStatus(rdv.id, 'CONFIRME').subscribe({
      next: () => {
        this.loadRendezVous();
        // Rendez-vous confirmé silencieusement
      },
      error: () => {
        this.notificationService.error('Erreur', 'Impossible de confirmer le rendez-vous');
      }
    });
  }

  cancelRendezVous(rdv: any): void {
    this.rdvToCancel = rdv;
    this.showCancelModal = true;
  }

  confirmCancelRendezVous(motif: string): void {
    if (this.rdvToCancel) {
      this.rendezVousService.updateRendezVousStatus(this.rdvToCancel.id, 'ANNULE').subscribe({
        next: () => {
          this.loadRendezVous();
          // Rendez-vous annulé silencieusement
        },
        error: () => {
          this.notificationService.error('Erreur', 'Impossible d\'annuler le rendez-vous');
        }
      });
      this.rdvToCancel = null;
    }
  }

  cancelEdit(): void {
    this.currentRdv = this.initRdv();
    this.editingRdv = false;
    this.showAddForm = false;
  }

  getPatientName(rdv: any): string {
    if (rdv.patientNom) {
      return rdv.patientNom;
    }
    const patient = this.patients.find(p => p.id === rdv.patientId);
    return patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu';
  }

  getPatientPhone(rdv: any): string {
    const patient = this.patients.find(p => p.id === rdv.patientId);
    return patient?.telephone || 'N/A';
  }

  getMedecinName(rdv: any): string {
    if (rdv.medecinDTO) {
      return `Dr. ${rdv.medecinDTO.prenom} ${rdv.medecinDTO.nom}`;
    }
    const medecin = this.medecins.find(m => m.id === rdv.medecinId);
    return medecin ? `Dr. ${medecin.prenom} ${medecin.nom}` : 'Médecin inconnu';
  }

  getStatusDisplay(statut: string): string {
    switch(statut) {
      case 'PLANIFIE': return 'Planifié';
      case 'CONFIRME': return 'Confirmé';
      case 'ANNULE': return 'Annulé';
      case 'TERMINE': return 'Terminé';
      case 'EN_ATTENTE': return 'En attente';
      default: return statut;
    }
  }

  onAvatarUpdated(avatarUrl: string): void {
    if (this.currentUser) {
      this.currentUser.avatarUrl = avatarUrl;
    }
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getMaxRdvDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 6);
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