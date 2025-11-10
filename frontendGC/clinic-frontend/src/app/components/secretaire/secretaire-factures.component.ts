import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProfileModalComponent } from '../shared/profile-modal.component';
import { PaginationComponent } from '../shared/pagination.component';
import { DashboardService } from '../../services/dashboard.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-secretaire-factures',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProfileModalComponent, PaginationComponent],
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
              <li><a routerLink="/secretaire/prescriptions">💊 Prescriptions</a></li>
              <li><a routerLink="/secretaire/factures" class="active">💰 Factures</a></li>
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
            <h2>💰 Suivi des Factures</h2>
            <div class="header-actions">
              <button (click)="loadFactures()" class="btn-secondary">🔄 Actualiser</button>
            </div>
          </div>

          <div class="filters-section">
            <div class="filter-tabs">
              <button (click)="setFilter('ALL')" [class.active]="currentFilter === 'ALL'" class="filter-tab">
                📋 Toutes ({{ getTotalCount() }})
              </button>
              <button (click)="setFilter('IMPAYEE')" [class.active]="currentFilter === 'IMPAYEE'" class="filter-tab alert">
                ⚠️ Impayées ({{ getUnpaidCount() }})
              </button>
              <button (click)="setFilter('PAYEE')" [class.active]="currentFilter === 'PAYEE'" class="filter-tab success">
                ✅ Payées ({{ getPaidCount() }})
              </button>
            </div>
          </div>

          <div class="factures-grid">
            <div *ngFor="let facture of getPaginatedFactures()" class="facture-card" [class]="'status-' + facture.statut?.toLowerCase()">
              <div class="facture-header">
                <h4>📄 {{ facture.numeroFacture }}</h4>
                <span class="facture-status" [class]="'badge-' + facture.statut?.toLowerCase()">
                  {{ getStatusLabel(facture.statut) }}
                </span>
              </div>
              <div class="facture-details">
                <div class="detail-row">
                  <strong>👤 Patient:</strong>
                  <span>{{ getPatientName(facture) }}</span>
                </div>
                <div class="detail-row">
                  <strong>📅 Date:</strong>
                  <span>{{ facture.dateCreation | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="detail-row">
                  <strong>💰 Montant:</strong>
                  <span class="amount">{{ facture.montantTotal | number:'1.0-0' }} FCFA</span>
                </div>
                <div class="detail-row">
                  <strong>📆 Échéance:</strong>
                  <span [class.overdue]="isOverdue(facture)">{{ facture.dateEcheance | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>
              <div class="facture-actions">
                <button (click)="downloadFacture(facture)" class="btn-pdf">📄 PDF</button>
                <button *ngIf="facture.statut === 'IMPAYEE'" (click)="markAsPaid(facture)" class="btn-pay">✅ Marquer payée</button>
                <button *ngIf="facture.statut === 'IMPAYEE' && isOverdue(facture)" (click)="sendReminder(facture)" class="btn-reminder">📧 Relance</button>
              </div>
            </div>
          </div>

          <div *ngIf="filteredFactures.length === 0" class="no-factures">
            <p>💰 Aucune facture trouvée</p>
          </div>
          
          <app-pagination 
            [currentPage]="currentPage" 
            [totalPages]="getTotalPages()" 
            [totalElements]="filteredFactures.length"
            (pageChange)="onPageChange($event)">
          </app-pagination>
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
    .user-avatar { width: 40px; height: 40px; background: linear-gradient(135deg, #28a745, #20c997); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: white; cursor: pointer; transition: transform 0.3s; }
    .user-avatar:hover { transform: scale(1.1); }
    .user-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
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
    .filters-section { margin-bottom: 2rem; }
    .filter-tabs { display: flex; gap: 0.5rem; background: white; padding: 1rem; border-radius: 8px; }
    .filter-tab { padding: 0.75rem 1.5rem; border: 2px solid #e0e6ed; background: white; color: #333; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s; }
    .filter-tab.active { background: #28a745; color: white; border-color: #28a745; }
    .filter-tab.alert.active { background: #dc3545; border-color: #dc3545; }
    .filter-tab.success.active { background: #28a745; border-color: #28a745; }
    .factures-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }
    .facture-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 4px solid #28a745; }
    .facture-card.status-impayee { border-left-color: #dc3545; }
    .facture-card.status-payee { border-left-color: #28a745; }
    .facture-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .facture-header h4 { margin: 0; color: #333; }
    .facture-status { padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: bold; }
    .badge-impayee { background: #ffebee; color: #c62828; }
    .badge-payee { background: #e8f5e8; color: #2e7d32; }
    .facture-details { margin-bottom: 1.5rem; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .detail-row strong { color: #333; }
    .detail-row span { color: #666; }
    .amount { font-weight: bold; color: #28a745; }
    .overdue { color: #dc3545; font-weight: bold; }
    .facture-actions { display: flex; gap: 0.5rem; }
    .btn-pdf, .btn-pay, .btn-reminder { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
    .btn-pdf { background: #007bff; color: white; }
    .btn-pay { background: #28a745; color: white; }
    .btn-reminder { background: #ffc107; color: #000; }
    .no-factures { text-align: center; padding: 3rem; color: #666; background: white; border-radius: 12px; }
  `]
})
export class SecretaireFacturesComponent implements OnInit {
  factures: any[] = [];
  filteredFactures: any[] = [];
  currentUser: User | null = null;
  showProfileModal = false;
  currentFilter = 'ALL';
  currentPage = 0;
  pageSize = 5;

  constructor(
    private dashboardService: DashboardService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadFactures();
      }
    });
  }

  loadFactures(): void {
    this.dashboardService.getAllFactures().subscribe({
      next: factures => {
        this.factures = factures;
        this.applyFilter();
        this.notificationService.success('Actualisation', `${factures.length} factures chargées`);
      },
      error: () => {
        this.notificationService.error('Erreur', 'Impossible de charger les factures');
      }
    });
  }

  setFilter(filter: string): void {
    this.currentFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    switch (this.currentFilter) {
      case 'IMPAYEE':
        this.filteredFactures = this.factures.filter(f => f.statut === 'IMPAYEE');
        break;
      case 'PAYEE':
        this.filteredFactures = this.factures.filter(f => f.statut === 'PAYEE');
        break;
      default:
        this.filteredFactures = this.factures;
    }
  }

  getTotalCount(): number {
    return this.factures.length;
  }

  getUnpaidCount(): number {
    return this.factures.filter(f => f.statut === 'IMPAYEE').length;
  }

  getPaidCount(): number {
    return this.factures.filter(f => f.statut === 'PAYEE').length;
  }

  getStatusLabel(statut: string): string {
    return statut === 'IMPAYEE' ? 'Impayée' : 'Payée';
  }

  getPatientName(facture: any): string {
    return facture.patientNom || 'Patient inconnu';
  }

  isOverdue(facture: any): boolean {
    return new Date(facture.dateEcheance) < new Date() && facture.statut === 'IMPAYEE';
  }

  downloadFacture(facture: any): void {
    this.dashboardService.downloadFacturePdf(facture.id).subscribe({
      next: (response) => {
        const blob = response.body;
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${facture.numeroFacture}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.notificationService.success('Téléchargement', 'Facture téléchargée');
        }
      },
      error: () => {
        this.notificationService.error('Erreur', 'Impossible de télécharger la facture');
      }
    });
  }

  markAsPaid(facture: any): void {
    console.log('Facture à marquer payée:', facture);
    if (!facture.id) {
      this.notificationService.error('Erreur', 'ID de facture manquant');
      return;
    }
    
    this.dashboardService.updateFactureStatus(facture.id, 'PAYEE').subscribe({
      next: () => {
        facture.statut = 'PAYEE';
        this.notificationService.success('Succès', 'Facture marquée comme payée');
        this.applyFilter();
      },
      error: (error) => {
        console.error('Erreur mise à jour statut:', error);
        this.notificationService.error('Erreur', 'Impossible de mettre à jour le statut');
      }
    });
  }

  sendReminder(facture: any): void {
    // Simulation - à implémenter côté backend
    this.notificationService.success('Relance', 'Email de relance envoyé');
  }

  onAvatarUpdated(avatarUrl: string): void {
    if (this.currentUser) {
      this.currentUser.avatarUrl = avatarUrl;
    }
  }

  getPaginatedFactures(): any[] {
    const startIndex = this.currentPage * this.pageSize;
    return this.filteredFactures.slice(startIndex, startIndex + this.pageSize);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredFactures.length / this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
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