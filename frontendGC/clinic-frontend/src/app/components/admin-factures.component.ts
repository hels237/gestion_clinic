import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProfileModalComponent } from './shared/profile-modal.component';
import { PaginationComponent } from './shared/pagination.component';
import { DashboardService } from '../services/dashboard.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { User } from '../models/auth.model';

@Component({
  selector: 'app-admin-factures',
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
          <span class="user-role-badge role-admin">ADMIN</span>
        </div>
      </nav>
      
      <div class="main-content">
        <aside class="sidebar">
          <div class="sidebar-content">
            <ul class="nav-menu">
              <li><a routerLink="/dashboard">📊 Tableau de bord</a></li>
              <li><a routerLink="/patients">👥 Patients</a></li>
              <li><a routerLink="/medecins">👨⚕️ Médecins</a></li>
              <li><a routerLink="/rendezvous">📅 Rendez-vous</a></li>
              <li><a routerLink="/users">👥 Utilisateurs</a></li>
              <li><a routerLink="/admin/factures" class="active">💰 Factures</a></li>
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
                <div class="user-role">Administrateur</div>
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
            <h2>💰 Gestion des Factures</h2>
            <div class="header-actions">
              <select [(ngModel)]="selectedYear" (change)="loadFactures()" class="year-select">
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
              <button (click)="loadFactures()" class="btn-secondary" type="button">🔄 Actualiser</button>
            </div>
          </div>

          <div class="stats-summary">
            <div class="stat-card total">
              <div class="stat-icon">📋</div>
              <div class="stat-info">
                <h3>{{ getTotalFactures() }}</h3>
                <p>Total factures</p>
              </div>
            </div>
            <div class="stat-card paid">
              <div class="stat-icon">✅</div>
              <div class="stat-info">
                <h3>{{ getPaidFactures() }}</h3>
                <p>Factures payées</p>
              </div>
            </div>
            <div class="stat-card unpaid">
              <div class="stat-icon">⚠️</div>
              <div class="stat-info">
                <h3>{{ getUnpaidFactures() }}</h3>
                <p>Factures impayées</p>
              </div>
            </div>
            <div class="stat-card revenue">
              <div class="stat-icon">💰</div>
              <div class="stat-info">
                <h3>{{ getMonthlyRevenue() | number:'1.0-0' }} FCFA</h3>
                <p>Revenus {{ getMonthName(getCurrentMonth()) }}</p>
              </div>
            </div>
          </div>

          <div class="factures-by-month">
            <div *ngFor="let monthGroup of getFacturesByMonth()" class="month-section">
              <div class="month-header">
                <h3>{{ getMonthName(monthGroup.month) }} {{ selectedYear }}</h3>
                <div class="month-stats">
                  <span class="month-count">{{ monthGroup.factures.length }} factures</span>
                  <span class="month-total">{{ monthGroup.total | number:'1.0-0' }} FCFA</span>
                </div>
              </div>
              
              <div class="factures-grid">
                <div *ngFor="let facture of getPaginatedFactures(monthGroup.factures)" class="facture-card" [class]="'status-' + facture.statut?.toLowerCase()">
                  <div class="facture-header">
                    <h4>{{ facture.numeroFacture }}</h4>
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
                      <span>{{ facture.createdAt | date:'dd/MM/yyyy' }}</span>
                    </div>
                    <div class="detail-row">
                      <strong>💰 Montant:</strong>
                      <span class="amount">{{ facture.montantTotal | number:'1.0-0' }} FCFA</span>
                    </div>
                  </div>
                  <div class="facture-actions">
                    <button (click)="downloadFacture(facture)" class="btn-pdf">📄 PDF</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="factures.length === 0" class="no-factures">
            <p>💰 Aucune facture trouvée pour {{ selectedYear }}</p>
          </div>
          
          <app-pagination 
            [currentPage]="currentPage" 
            [totalPages]="getTotalPages()" 
            [totalElements]="factures.length"
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
    .dashboard-container { height: 100vh; background: linear-gradient(rgba(255,255,255,0.3), rgba(0,123,255,0.2)), url('https://cdn.futura-sciences.com/sources/images/informatique-administrateur-re%CC%81seaux.jpeg'); background-size: cover; background-position: center; background-attachment: fixed; display: flex; flex-direction: column; overflow: hidden; }
    .navbar { background-color: #007bff; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
    .nav-brand h1 { margin: 0; }
    .nav-user { display: flex; align-items: center; gap: 1rem; }
    .welcome-text { font-weight: 600; }
    .user-role-badge { padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; }
    .role-admin { background: rgba(255,255,255,0.2); color: #fff; }
    .main-content { display: flex; flex: 1; overflow: hidden; }
    .sidebar { width: 250px; background-color: white; box-shadow: 2px 0 5px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; }
    .sidebar-content { flex: 1; }
    .nav-menu { list-style: none; padding: 0; margin: 0; }
    .nav-menu li a { display: block; padding: 1rem 1.5rem; text-decoration: none; color: #333; border-bottom: 1px solid #eee; }
    .nav-menu li a:hover, .nav-menu li a.active { background-color: #007bff; color: white; }
    .sidebar-footer { padding: 1rem; padding-bottom: 60px; border-top: 1px solid #eee; background: #f8f9fa; }
    .user-profile { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .user-avatar { width: 40px; height: 40px; background: linear-gradient(135deg, #007bff, #0056b3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: white; cursor: pointer; transition: transform 0.3s; }
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
    .header-actions { display: flex; gap: 1rem; align-items: center; }
    .year-select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
    .btn-secondary { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; background: #6c757d; color: white; transition: all 0.3s ease; }
    .btn-secondary:hover { background: #5a6268; transform: translateY(-1px); }
    .btn-secondary:active { transform: translateY(0); }
    .stats-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 1rem; }
    .stat-card.total { border-left: 4px solid #007bff; }
    .stat-card.paid { border-left: 4px solid #28a745; }
    .stat-card.unpaid { border-left: 4px solid #dc3545; }
    .stat-card.revenue { border-left: 4px solid #ffc107; }
    .stat-icon { font-size: 2.5rem; }
    .stat-info h3 { font-size: 2rem; margin: 0; color: #333; }
    .stat-info p { margin: 0; color: #666; }
    .factures-by-month { display: flex; flex-direction: column; gap: 2rem; }
    .month-section { background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden; }
    .month-header { background: #f8f9fa; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e0e6ed; }
    .month-header h3 { margin: 0; color: #333; }
    .month-stats { display: flex; gap: 1rem; }
    .month-count { background: #e3f2fd; color: #1976d2; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: bold; }
    .month-total { background: #e8f5e8; color: #2e7d32; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: bold; }
    .factures-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; padding: 1.5rem; }
    .facture-card { background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #007bff; }
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
    .facture-actions { display: flex; gap: 0.5rem; }
    .btn-pdf { 
      padding: 0.75rem 1.25rem; 
      border: none; 
      border-radius: 8px; 
      cursor: pointer; 
      font-size: 0.9rem; 
      font-weight: 600;
      background: linear-gradient(135deg, #dc3545, #c82333); 
      color: white; 
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
    }
    .btn-pdf:hover { 
      background: linear-gradient(135deg, #c82333, #a71e2a); 
      transform: translateY(-2px); 
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
    }
    .btn-pdf:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
    }
    .no-factures { text-align: center; padding: 3rem; color: #666; background: white; border-radius: 12px; }
  `]
})
export class AdminFacturesComponent implements OnInit {
  factures: any[] = [];
  allFactures: any[] = [];
  currentUser: User | null = null;
  showProfileModal = false;
  selectedYear = new Date().getFullYear();
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
    console.log('Chargement des factures...');
    this.dashboardService.getAllFactures().subscribe({
      next: factures => {
        console.log('Factures reçues:', factures);
        this.allFactures = factures;
        this.factures = factures.filter(f => {
          console.log('Facture complète:', f);
          const dateField = f.createdAt || f.dateCreation || f.dateFacture || new Date().toISOString();
          const date = new Date(dateField);
          const year = date.getFullYear();
          console.log(`Facture ${f.numeroFacture}: dateField=${dateField}, year=${year}`);
          return year === this.selectedYear;
        });
        console.log(`Factures filtrées pour ${this.selectedYear}:`, this.factures);
        this.notificationService.success('Actualisation', `${this.factures.length} factures chargées pour ${this.selectedYear}`);
      },
      error: (error) => {
        console.error('Erreur chargement factures:', error);
        this.notificationService.error('Erreur', 'Impossible de charger les factures');
      }
    });
  }

  getFacturesByMonth(): any[] {
    const monthGroups = new Map();
    
    this.factures.forEach(facture => {
      const date = new Date(facture.dateCreation);
      const month = date.getMonth() + 1;
      
      if (!monthGroups.has(month)) {
        monthGroups.set(month, {
          month: month,
          factures: [],
          total: 0
        });
      }
      
      const group = monthGroups.get(month);
      group.factures.push(facture);
      group.total += facture.montantTotal || 0;
    });
    
    return Array.from(monthGroups.values()).sort((a, b) => a.month - b.month);
  }

  getMonthName(month: number): string {
    const months = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[month];
  }

  getTotalFactures(): number {
    return this.factures.length;
  }

  getPaidFactures(): number {
    return this.factures.filter(f => f.statut === 'PAYEE').length;
  }

  getUnpaidFactures(): number {
    return this.factures.filter(f => f.statut === 'IMPAYEE').length;
  }

  getTotalRevenue(): number {
    return this.factures.filter(f => f.statut === 'PAYEE').reduce((sum, f) => sum + (f.montantTotal || 0), 0);
  }

  getMonthlyRevenue(): number {
    const currentMonth = new Date().getMonth() + 1;
    return this.factures.filter(f => {
      const factureDate = new Date(f.dateCreation || f.createdAt);
      const factureMonth = factureDate.getMonth() + 1;
      return f.statut === 'PAYEE' && factureMonth === currentMonth;
    }).reduce((sum, f) => sum + (f.montantTotal || 0), 0);
  }

  getCurrentMonth(): number {
    return new Date().getMonth() + 1;
  }

  getStatusLabel(statut: string): string {
    return statut === 'IMPAYEE' ? 'Impayée' : 'Payée';
  }

  getPatientName(facture: any): string {
    return facture.patientNom || 'Patient inconnu';
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

  onAvatarUpdated(avatarUrl: string): void {
    if (this.currentUser) {
      this.currentUser.avatarUrl = avatarUrl;
    }
  }

  getPaginatedFactures(factures?: any[]): any[] {
    const facturesArray = factures || this.factures;
    const startIndex = this.currentPage * this.pageSize;
    return facturesArray.slice(startIndex, startIndex + this.pageSize);
  }

  getTotalPages(): number {
    return Math.ceil(this.factures.length / this.pageSize);
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