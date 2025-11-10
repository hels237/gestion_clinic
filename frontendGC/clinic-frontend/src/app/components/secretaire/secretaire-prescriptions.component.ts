import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProfileModalComponent } from '../shared/profile-modal.component';
import { PrescriptionService } from '../../services/prescription.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { HttpClient } from '@angular/common/http';
import { User } from '../../models/auth.model';
import { Prescription } from '../../models/prescription.model';

@Component({
  selector: 'app-secretaire-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProfileModalComponent],
  template: `
    <div class="dashboard-container">
      <nav class="navbar">
        <div class="nav-brand">
          <h1>Gestion Clinique</h1>
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
              <li><a routerLink="/secretaire/rendezvous">📅 Rendez-vous</a></li>
              <li><a routerLink="/secretaire/prescriptions" class="active">💊 Prescriptions</a></li>
              <li><a routerLink="/secretaire/factures">💰 Factures</a></li>
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
            <h2>💊 Gestion des Prescriptions</h2>
            <div class="header-actions">
              <button (click)="loadPrescriptions()" class="btn-secondary">🔄 Actualiser</button>
            </div>
          </div>

          <div class="prescriptions-grid">
            <div *ngFor="let prescription of prescriptions" class="prescription-card">
              <div class="prescription-header">
                <h4>👤 {{ prescription.patientPrenom }} {{ prescription.patientNom }}</h4>
                <span class="prescription-date">{{ prescription.dateCreation | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="prescription-content">
                <div class="prescription-section">
                  <strong>👨⚕️ Médecin:</strong>
                  <p>Dr. {{ prescription.medecinNom }}</p>
                </div>
                <div class="prescription-section">
                  <strong>💊 Médicament:</strong>
                  <p>{{ prescription.medicament || prescription.medicaments || 'Non spécifié' }}</p>
                </div>
                <div class="prescription-section">
                  <strong>⏰ Posologie:</strong>
                  <p>{{ prescription.posologie || 'Non spécifiée' }}</p>
                </div>
                <div class="prescription-section">
                  <strong>📊 Dosage:</strong>
                  <p>{{ prescription.dosage || prescription.duree || 'Non spécifié' }}</p>
                </div>
              </div>
              <div class="prescription-actions">
                <button (click)="creerFacture(prescription)" class="btn-success">💰 Créer Facture</button>
              </div>
            </div>
          </div>

          <div *ngIf="prescriptions.length === 0" class="no-prescriptions">
            <p>💊 Aucune prescription trouvée</p>
          </div>

          <!-- Popup de création de facture -->
          <div *ngIf="showFactureForm" class="facture-form-overlay">
            <div class="facture-form">
              <div class="form-header">
                <h3>💰 Créer une Facture</h3>
                <button (click)="cancelFacture()" class="btn-close">✖</button>
              </div>
              <div class="patient-info">
                <h4>👤 Patient: {{ getPatientName() }}</h4>
                <p>👨‍⚕️ Médecin: Dr. {{ getMedecinName() }}</p>
                <p>📅 Prescription: {{ selectedPrescription?.dateCreation | date:'dd/MM/yyyy HH:mm' }}</p>
                <p>🕐 Facturation: {{ currentDateTime | date:'dd/MM/yyyy HH:mm:ss' }}</p>
              </div>
              <form (ngSubmit)="submitFacture()" #factureForm="ngForm">
                <div class="form-group">
                  <label>💊 Frais de consultation (FCFA) *</label>
                  <input [(ngModel)]="factureData.fraisConsultation" name="fraisConsultation" 
                         type="number" step="1" min="0" required class="form-control"
                         placeholder="Ex: 25000">
                </div>
                <div class="form-group">
                  <label>🏥 Frais d'hospitalisation (FCFA)</label>
                  <input [(ngModel)]="factureData.fraisHospitalisation" name="fraisHospitalisation" 
                         type="number" step="1" min="0" class="form-control"
                         placeholder="Ex: 100000">
                </div>
                <div class="form-group">
                  <label>🔬 Frais d'examens cliniques (FCFA)</label>
                  <input [(ngModel)]="factureData.fraisExamen" name="fraisExamen" 
                         type="number" step="1" min="0" class="form-control"
                         placeholder="Ex: 35000">
                </div>
                <div class="total-section">
                  <div class="total-display">
                    <strong>💰 Total: {{ calculateTotal() | number:'1.0-0' }} FCFA</strong>
                  </div>
                </div>
                <div class="form-actions">
                  <button type="submit" [disabled]="!factureForm.valid" class="btn-primary">💾 Créer Facture</button>
                  <button *ngIf="showDownloadButton" type="button" (click)="downloadFacture()" class="btn-success">📄 Télécharger PDF</button>
                  <button type="button" (click)="cancelFacture()" class="btn-secondary">❌ Annuler</button>
                </div>
              </form>
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
    </div>
  `,
  styles: [`
    .dashboard-container { height: 100vh; background: linear-gradient(135deg, #e8f5e8, #f0f8f0, #e1f5e1); display: flex; flex-direction: column; overflow: hidden; }
    .navbar { background-color: #28a745; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
    .nav-brand h1 { margin: 0; }
    .nav-user { display: flex; align-items: center; gap: 1rem; }
    .welcome-text { font-weight: 600; }
    .user-role-badge { padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; }
    .role-secretaire { background: rgba(255,255,255,0.2); color: #fff; }
    .main-content { display: flex; flex: 1; overflow: hidden; }
    .sidebar { width: 250px; background-color: white; box-shadow: 2px 0 5px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; }
    .sidebar-content { flex: 1; }
    .nav-menu { list-style: none; padding: 0; margin: 0; }
    .nav-menu li a { display: block; padding: 1rem 1.5rem; text-decoration: none; color: #333; border-bottom: 1px solid #eee; }
    .nav-menu li a:hover, .nav-menu li a.active { background-color: #28a745; color: white; }
    .sidebar-footer { padding: 1rem; padding-bottom: 60px; border-top: 1px solid #eee; background: #f8f9fa; }
    .user-profile { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .user-avatar { width: 40px; height: 40px; background: linear-gradient(135deg, #28a745, #20c997); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: white; cursor: pointer; transition: transform 0.3s; } .user-avatar:hover { transform: scale(1.1); } .user-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
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
    .btn-secondary { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; background: #6c757d; color: white; }
    .btn-success { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; background: #28a745; color: white; }
    .prescriptions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }
    .prescription-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 4px solid #28a745; }
    .prescription-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee; }
    .prescription-header h4 { margin: 0; color: #333; }
    .prescription-date { background: #e8f5e8; color: #28a745; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: bold; }
    .prescription-content { margin-bottom: 1.5rem; }
    .prescription-section { margin-bottom: 1rem; }
    .prescription-section strong { color: #333; display: block; margin-bottom: 0.25rem; }
    .prescription-section p { margin: 0; color: #666; background: #f8f9fa; padding: 0.5rem; border-radius: 4px; }
    .prescription-actions { display: flex; gap: 0.5rem; }
    .no-prescriptions { text-align: center; padding: 3rem; color: #666; background: white; border-radius: 12px; }
    .facture-form-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .facture-form { background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 2px solid #28a745; padding-bottom: 1rem; }
    .form-header h3 { margin: 0; color: #28a745; }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
    .patient-info { background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #28a745; }
    .patient-info h4 { margin: 0 0 0.5rem 0; color: #333; }
    .patient-info p { margin: 0; color: #666; font-size: 0.9rem; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; }
    .form-control { width: 100%; padding: 0.75rem; border: 2px solid #e0e6ed; border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.3s; }
    .form-control:focus { border-color: #28a745; }
    .total-section { background: #e8f5e8; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center; }
    .total-display { font-size: 1.2rem; color: #28a745; }
    .form-actions { display: flex; gap: 1rem; justify-content: flex-end; }
    .btn-primary { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; background: #28a745; color: white; }
    .btn-primary:disabled { background: #6c757d; cursor: not-allowed; }
    .btn-secondary { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; background: #6c757d; color: white; }
  `]
})
export class SecretairePrescriptionsComponent implements OnInit {
  prescriptions: Prescription[] = [];
  currentUser: User | null = null;
  showProfileModal = false;
  showFactureForm = false;
  selectedPrescription: Prescription | null = null;
  currentDateTime = new Date();
  factureData = {
    fraisConsultation: 25000,
    fraisHospitalisation: 0,
    fraisExamen: 0
  };
  lastCreatedFactureId: number | null = null;
  showDownloadButton = false;

  constructor(
    private prescriptionService: PrescriptionService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadPrescriptions();
      }
    });
  }

  loadPrescriptions(): void {
    this.prescriptionService.getAllPrescriptions().subscribe({
      next: prescriptions => {
        this.prescriptions = prescriptions;
        this.notificationService.success('Actualisation', `${prescriptions.length} prescriptions chargées`);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des prescriptions:', error);
        this.notificationService.error('Erreur', 'Impossible de charger les prescriptions');
      }
    });
  }

  creerFacture(prescription: Prescription): void {
    this.selectedPrescription = prescription;
    this.currentDateTime = new Date();
    this.factureData = {
      fraisConsultation: 25000,
      fraisHospitalisation: 0,
      fraisExamen: 0
    };
    this.showFactureForm = true;
  }

  calculateTotal(): number {
    return (this.factureData.fraisConsultation || 0) + 
           (this.factureData.fraisHospitalisation || 0) + 
           (this.factureData.fraisExamen || 0);
  }

  submitFacture(): void {
    console.log('=== CREATION FACTURE ===');
    console.log('Prescription sélectionnée:', this.selectedPrescription);
    console.log('Données facture:', this.factureData);
    
    if (!this.selectedPrescription?.id) {
      console.error('Pas de prescription sélectionnée');
      this.notificationService.error('Erreur', 'Prescription manquante');
      return;
    }
    
    const requestData = {
      prescriptionId: this.selectedPrescription.id,
      fraisConsultation: this.factureData.fraisConsultation || 0,
      fraisHospitalisation: this.factureData.fraisHospitalisation || 0,
      fraisExamen: this.factureData.fraisExamen || 0
    };
    
    console.log('Données envoyées:', requestData);
    
    this.http.post<any>('http://localhost:8080/api/factures/creer', requestData).subscribe({
      next: (facture) => {
        console.log('Facture créée:', facture);
        this.notificationService.success('Succès', 'Facture créée avec succès');
        this.lastCreatedFactureId = facture.id;
        this.showDownloadButton = true;
      },
      error: (error) => {
        console.error('Erreur création facture:', error);
        this.notificationService.error('Erreur', 'Impossible de créer la facture');
      }
    });
  }

  getPatientName(): string {
    if (!this.selectedPrescription) return 'Non spécifié';
    const prenom = this.selectedPrescription.patientPrenom || '';
    const nom = this.selectedPrescription.patientNom || '';
    return `${prenom} ${nom}`.trim() || 'Non spécifié';
  }

  getMedecinName(): string {
    if (!this.selectedPrescription) return 'Non spécifié';
    const prenom = this.selectedPrescription.medecinPrenom || '';
    const nom = this.selectedPrescription.medecinNom || '';
    return `${prenom} ${nom}`.trim() || this.selectedPrescription.medecinNom || 'Non spécifié';
  }

  downloadFacture(): void {
    if (this.lastCreatedFactureId) {
      this.dashboardService.downloadFacturePdf(this.lastCreatedFactureId).subscribe({
        next: (response) => {
          const blob = response.body;
          if (blob) {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `facture_${this.lastCreatedFactureId}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            this.notificationService.success('Téléchargement', 'Facture téléchargée');
          }
        },
        error: (error) => {
          console.error('Erreur téléchargement:', error);
          this.notificationService.error('Erreur', 'Impossible de télécharger la facture');
        }
      });
    }
  }

  cancelFacture(): void {
    this.showFactureForm = false;
    this.selectedPrescription = null;
    this.lastCreatedFactureId = null;
    this.showDownloadButton = false;
    this.factureData = {
      fraisConsultation: 25000,
      fraisHospitalisation: 0,
      fraisExamen: 0
    };
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