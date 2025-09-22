import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { NotificationService } from '../../services/notification.service';
import { SearchService, SearchResult } from '../../services/search.service';
import { NotificationsComponent } from '../notifications/notifications.component';
import { NotificationToastComponent } from '../shared/notification-toast.component';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationsComponent, NotificationToastComponent, FormsModule],
  template: `
    <div class="dashboard-container">
      <app-notifications></app-notifications>
      <app-notification-toast></app-notification-toast>
      <nav class="navbar">
        <div class="nav-brand">
          <h1>Gestion Clinique</h1>
        </div>
        <div class="nav-search">
          <div class="search-container">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (input)="onSearch()" 
              placeholder="Rechercher patients, médecins, RDV..."
              class="search-input">
            <div *ngIf="searchResults.length > 0" class="search-results">
              <div *ngFor="let result of searchResults" class="search-result-item" (click)="selectResult(result)">
                <div class="result-type">{{ getTypeLabel(result.type) }}</div>
                <div class="result-title">{{ result.title }}</div>
                <div class="result-subtitle">{{ result.subtitle }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="nav-actions">
          <button (click)="toggleNotifications()" class="nav-btn" title="Notifications">
            🔔 <span class="badge" *ngIf="notificationCount > 0">{{ notificationCount }}</span>
          </button>
          <button (click)="showQuickActions()" class="nav-btn" title="Actions rapides">
            ⚡
          </button>
          <button (click)="showHelp()" class="nav-btn" title="Aide">
            ❓
          </button>
        </div>
        <div class="nav-user" *ngIf="currentUser">
          <span class="welcome-text">Bienvenue, {{ currentUser.prenom }} !</span>
          <span class="user-role-badge" [class]="'role-' + currentUser.role.toLowerCase()">{{ getUserRoleLabel(currentUser.role) }}</span>
        </div>
      </nav>
      
      <div class="main-content">
        <aside class="sidebar">
          <div class="sidebar-content">
            <ul class="nav-menu">
              <li><a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">📊 Tableau de bord</a></li>
              <li><a routerLink="/patients" routerLinkActive="active">👥 Patients</a></li>
              <li [class.disabled]="!canAccessMedecins()">
                <a *ngIf="canAccessMedecins()" routerLink="/medecins" routerLinkActive="active">👨⚕️ Médecins</a>
                <span *ngIf="!canAccessMedecins()" class="disabled-link">👨⚕️ Médecins</span>
              </li>
              <li><a routerLink="/rendezvous" routerLinkActive="active">📅 Rendez-vous</a></li>
              <li [class.disabled]="!canAccessUsers()">
                <a *ngIf="canAccessUsers()" routerLink="/users" routerLinkActive="active">👥 Utilisateurs</a>
                <span *ngIf="!canAccessUsers()" class="disabled-link">👥 Utilisateurs</span>
              </li>
            </ul>
          </div>
          <div class="sidebar-footer">
            <div class="user-profile" *ngIf="currentUser">
              <div class="user-avatar">👤</div>
              <div class="user-details">
                <div class="user-name">{{ currentUser.prenom }} {{ currentUser.nom }}</div>
                <div class="user-role">{{ getUserRoleLabel(currentUser.role) }}</div>
              </div>
            </div>
            <button (click)="logout()" class="btn-logout-sidebar">
              <span class="logout-icon">🚪</span>
              Déconnexion
            </button>
          </div>
        </aside>
        
        <main class="content">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <h3>{{ stats?.totalPatients || 0 }}</h3>
                <p>Patients</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">👨‍⚕️</div>
              <div class="stat-info">
                <h3>{{ stats?.totalMedecins || 0 }}</h3>
                <p>Médecins</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-info">
                <h3>{{ stats?.rendezVousAujourdhui || 0 }}</h3>
                <p>RDV Aujourd'hui</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⏰</div>
              <div class="stat-info">
                <h3>{{ stats?.rendezVousEnAttente || 0 }}</h3>
                <p>En Attente</p>
              </div>
            </div>
          </div>
          
          <div class="dashboard-sections">
            <div class="section">
              <h3>Rendez-vous Récents</h3>
              <div class="recent-appointments">
                <div *ngFor="let rdv of recentRendezVous" class="appointment-item">
                  <div class="appointment-time">{{ rdv.dateHeure | date:'HH:mm' }}</div>
                  <div class="appointment-info">
                    <strong>{{ rdv.patient?.prenom }} {{ rdv.patient?.nom }}</strong>
                    <span>Dr. {{ rdv.medecin?.prenom }} {{ rdv.medecin?.nom }}</span>
                  </div>
                  <div class="appointment-status" [class]="'status-' + rdv.statut.toLowerCase()">{{ rdv.statut }}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3>Actions Rapides</h3>
              <div class="quick-actions">
                <a routerLink="/patients" class="action-btn">
                  <span class="action-icon">👥</span>
                  <span>Gérer Patients</span>
                </a>
                <a *ngIf="currentUser?.role === 'ADMIN'" routerLink="/medecins" class="action-btn">
                  <span class="action-icon">👨‍⚕️</span>
                  <span>Gérer Médecins</span>
                </a>
                <a routerLink="/rendezvous" class="action-btn">
                  <span class="action-icon">📅</span>
                  <span>Planifier RDV</span>
                </a>
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
    </div>
  `,
  styles: [`
    .dashboard-container {
      height: 100vh;
      background: linear-gradient(rgba(255,255,255,0.3), rgba(0,123,255,0.2)), url('https://cdn.futura-sciences.com/sources/images/informatique-administrateur-re%CC%81seaux.jpeg');
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .navbar {
      background-color: #007bff;
      color: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
    }
    .nav-search {
      flex: 1;
      max-width: 500px;
    }
    .search-container {
      position: relative;
    }
    .search-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 25px;
      font-size: 1rem;
      outline: none;
    }
    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;
    }
    .search-result-item {
      padding: 1rem;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      color: #333;
    }
    .search-result-item:hover {
      background: #f8f9fa;
    }
    .result-type {
      font-size: 0.8rem;
      color: #007bff;
      font-weight: bold;
      text-transform: uppercase;
    }
    .result-title {
      font-weight: bold;
      margin: 0.25rem 0;
    }
    .result-subtitle {
      font-size: 0.9rem;
      color: #666;
    }
    .nav-brand h1 {
      margin: 0;
    }
    .nav-actions {
      display: flex;
      gap: 0.5rem;
    }
    .nav-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 0.5rem;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.2rem;
      position: relative;
      transition: all 0.3s ease;
    }
    .nav-btn:hover {
      background: rgba(255,255,255,0.3);
      transform: scale(1.1);
    }
    .badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #dc3545;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-user {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .welcome-text {
      font-weight: 600;
      color: white;
      opacity: 0.9;
    }
    .user-role-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: bold;
      text-transform: uppercase;
    }
    .role-admin { background: rgba(255,255,255,0.2); color: #fff; }
    .role-medecin { background: rgba(40,167,69,0.8); color: #fff; }
    .role-secretaire { background: rgba(255,193,7,0.8); color: #000; }
    .main-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .sidebar {
      width: 250px;
      background-color: white;
      box-shadow: 2px 0 5px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .sidebar-content {
      flex: 1;
    }
    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid #eee;
      background: #f8f9fa;
    }
    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .user-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #007bff, #0056b3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: white;
    }
    .user-details {
      flex: 1;
    }
    .user-name {
      font-weight: bold;
      font-size: 0.9rem;
      color: #333;
    }
    .user-role {
      font-size: 0.8rem;
      color: #666;
    }
    .btn-logout-sidebar {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #dc3545, #c82333);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }
    .btn-logout-sidebar:hover {
      background: linear-gradient(135deg, #c82333, #a71e2a);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
    }
    .logout-icon {
      font-size: 1.1rem;
    }
    .global-footer {
      background-color: #f8f9fa;
      border-top: 1px solid #dee2e6;
      padding: 1rem 0;
      flex-shrink: 0;
    }
    .footer-content {
      text-align: center;
      font-size: 0.9rem;
      color: #666;
      font-weight: 500;
    }
    .nav-menu {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .nav-menu li a {
      display: block;
      padding: 1rem 1.5rem;
      text-decoration: none;
      color: #333;
      border-bottom: 1px solid #eee;
    }
    .nav-menu li a:hover,
    .nav-menu li a.active {
      background-color: #007bff;
      color: white;
    }
    .nav-menu li.disabled {
      opacity: 0.5;
    }
    .disabled-link {
      display: block;
      padding: 1rem 1.5rem;
      color: #999;
      cursor: not-allowed;
      border-bottom: 1px solid #eee;
    }
    .content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .stat-icon {
      font-size: 2.5rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #007bff, #0056b3);
      border-radius: 50%;
    }
    .stat-info h3 {
      font-size: 2rem;
      margin: 0;
      color: #333;
    }
    .stat-info p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }
    .dashboard-sections {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }
    .section {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .section h3 {
      margin-top: 0;
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 0.5rem;
    }
    .appointment-item {
      display: flex;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #eee;
      gap: 1rem;
    }
    .appointment-time {
      font-weight: bold;
      color: #007bff;
      min-width: 60px;
    }
    .appointment-info {
      flex: 1;
    }
    .appointment-info strong {
      display: block;
      margin-bottom: 0.25rem;
    }
    .appointment-info span {
      color: #666;
      font-size: 0.9rem;
    }
    .appointment-status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: bold;
    }
    .status-programme { background: #e3f2fd; color: #1976d2; }
    .status-confirme { background: #e8f5e8; color: #2e7d32; }
    .status-annule { background: #ffebee; color: #c62828; }
    .status-termine { background: #f3e5f5; color: #7b1fa2; }
    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .action-btn {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      border-radius: 8px;
      text-decoration: none;
      color: #333;
      transition: all 0.3s ease;
    }
    .action-btn:hover {
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      transform: translateY(-2px);
    }
    .action-icon {
      font-size: 1.5rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  stats: DashboardStats | null = null;
  recentRendezVous: any[] = [];
  searchQuery = '';
  searchResults: SearchResult[] = [];
  notificationCount = 3;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private notificationService: NotificationService,
    private searchService: SearchService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.notificationService.connectWebSocket();
      }
    });
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.dashboardService.getStats().subscribe({
      next: stats => {
        this.stats = stats;
        this.notificationService.success('Dashboard', 'Données chargées avec succès');
      },
      error: () => {
        this.stats = {
          totalPatients: 0,
          totalMedecins: 0,
          totalRendezVous: 0,
          rendezVousAujourdhui: 0,
          rendezVousEnAttente: 0
        };
        this.notificationService.warning('Dashboard', 'Impossible de charger les statistiques');
      }
    });

    this.dashboardService.getRecentRendezVous().subscribe({
      next: rdv => this.recentRendezVous = rdv,
      error: () => {
        this.recentRendezVous = [];
        this.notificationService.info('Dashboard', 'Aucun rendez-vous récent trouvé');
      }
    });
  }

  logout(): void {
    this.notificationService.disconnectWebSocket();
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

  onSearch(): void {
    if (this.searchQuery.length > 2) {
      this.searchService.globalSearch(this.searchQuery).subscribe({
        next: results => this.searchResults = results,
        error: () => this.searchResults = []
      });
    } else {
      this.searchResults = [];
    }
  }

  selectResult(result: SearchResult): void {
    this.searchResults = [];
    this.searchQuery = '';
    
    switch (result.type) {
      case 'patient':
        this.router.navigate(['/patients'], { queryParams: { id: result.id } });
        break;
      case 'medecin':
        this.router.navigate(['/medecins'], { queryParams: { id: result.id } });
        break;
      case 'rendezvous':
        this.router.navigate(['/rendezvous'], { queryParams: { id: result.id } });
        break;
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'patient': return 'Patient';
      case 'medecin': return 'Médecin';
      case 'rendezvous': return 'Rendez-vous';
      default: return type;
    }
  }

  navigateToAddPatient(): void {
    this.router.navigate(['/patients'], { queryParams: { action: 'add' } });
  }

  navigateToAddMedecin(): void {
    this.router.navigate(['/medecins'], { queryParams: { action: 'add' } });
  }

  navigateToAddRendezVous(): void {
    this.router.navigate(['/rendezvous'], { queryParams: { action: 'add' } });
  }

  showStats(): void {
    const message = `
      👥 Patients: ${this.stats?.totalPatients || 0}
      👨⚕️ Médecins: ${this.stats?.totalMedecins || 0}
      📅 RDV Total: ${this.stats?.totalRendezVous || 0}
      📅 RDV Aujourd'hui: ${this.stats?.rendezVousAujourdhui || 0}
      ⏰ En Attente: ${this.stats?.rendezVousEnAttente || 0}
    `;
    this.notificationService.info('Statistiques', message);
  }

  toggleNotifications(): void {
    this.notificationService.info('Notifications', 'Aucune nouvelle notification');
    this.notificationCount = 0;
  }

  showQuickActions(): void {
    this.notificationService.info('Actions', 'Utilisez les boutons verts pour créer rapidement');
  }

  showHelp(): void {
    this.notificationService.info('Aide', 'Utilisez la barre de recherche pour trouver rapidement patients, médecins ou RDV');
  }

  getUserRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'MEDECIN': return 'Médecin';
      case 'SECRETAIRE': return 'Secrétaire';
      default: return role;
    }
  }

  canAccessMedecins(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  canAccessUsers(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }
}