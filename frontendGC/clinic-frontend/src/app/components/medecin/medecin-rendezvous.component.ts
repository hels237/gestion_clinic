import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { RendezVousService } from '../../services/rendezvous.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.model';
import { NotificationsComponent } from '../notifications/notifications.component';
import { NotificationToastComponent } from '../shared/notification-toast.component';
import { ProfileModalComponent } from '../shared/profile-modal.component';
import { CalendarComponent } from '../calendar/calendar.component';

@Component({
  selector: 'app-medecin-rendezvous',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NotificationsComponent, NotificationToastComponent, ProfileModalComponent, CalendarComponent],
  template: `
    <div class="dashboard-container">
      <app-notifications [isVisible]="showNotifications"></app-notifications>
      <app-notification-toast></app-notification-toast>
      <nav class="navbar">
        <div class="nav-brand">
          <h1>Gestion Clinique</h1>
        </div>
        <div class="nav-actions">
          <button (click)="toggleNotifications()" class="nav-btn" title="Notifications">
            🔔 <span class="badge" *ngIf="notificationCount > 0">{{ notificationCount }}</span>
          </button>
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
              <li><a routerLink="/medecin/patients">👥 Mes Patients</a></li>
              <li><a routerLink="/medecin/rendezvous" class="active">📅 Mes Rendez-vous</a></li>
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
              <span class="logout-icon">🚪</span>
              Déconnexion
            </button>
          </div>
        </aside>
        
        <main class="content">
          <div class="header">
            <h2>📅 Mes Rendez-vous</h2>
            <div class="header-actions">
              <button (click)="toggleUpcoming()" [class]="showUpcoming ? 'btn-primary' : 'btn-secondary'">
                {{ showUpcoming ? '📋 Tous' : '⏰ À venir' }}
              </button>
              <button (click)="loadRendezVous()" class="btn-refresh" type="button">↻ Actualiser</button>
            </div>
          </div>

          <div class="view-toggle">
            <button (click)="viewMode = 'calendar'" [class.active]="viewMode === 'calendar'" class="btn-toggle">📅 Calendrier</button>
            <button (click)="viewMode = 'list'" [class.active]="viewMode === 'list'" class="btn-toggle">📋 Liste</button>
          </div>

          <!-- Vue Calendrier -->
          <div *ngIf="viewMode === 'calendar'">
            <app-calendar></app-calendar>
          </div>

          <!-- Vue Liste -->
          <div *ngIf="viewMode === 'list'">
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
                  <h4>👤 {{ rdv.patientNom }}</h4>
                </div>
                <div class="rdv-motif" *ngIf="rdv.motif">
                  <p><strong>Motif:</strong> {{ rdv.motif }}</p>
                </div>
                <div class="rdv-salle" *ngIf="rdv.salle">
                  <p><strong>🏥 Salle:</strong> {{ rdv.salle }}</p>
                </div>
              </div>
              <div class="rdv-actions">
                <button (click)="confirmRendezVous(rdv)" *ngIf="rdv.statut === 'PLANIFIE'" class="btn-confirm">✅ Confirmer</button>
                <button (click)="cancelRendezVous(rdv)" *ngIf="rdv.statut !== 'ANNULE' && rdv.statut !== 'TERMINE'" class="btn-cancel-rdv">❌ Annuler</button>
                <button (click)="completeRendezVous(rdv)" *ngIf="rdv.statut === 'CONFIRME'" class="btn-complete">✅ Terminer</button>
              </div>
            </div>

            <div class="pagination" *ngIf="totalPages > 1">
              <button (click)="previousPage()" [disabled]="currentPage === 1" class="btn-pagination">‹ Précédent</button>
              <span class="pagination-info">Page {{ currentPage }} sur {{ totalPages }}</span>
              <button (click)="nextPage()" [disabled]="currentPage === totalPages" class="btn-pagination">Suivant ›</button>
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
    .btn-secondary { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; background: #6c757d; color: white; }
    .btn-primary { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; background: #007bff; color: white; }
    /* Styles de filtres gérés par styles.css global */
    .rdv-timeline { display: flex; flex-direction: column; gap: 1rem; }
    .rdv-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 4px solid #007bff; }
    .rdv-card.status-confirmer { border-left-color: #28a745; }
    .rdv-card.status-annuler { border-left-color: #dc3545; }
    .rdv-card.status-terminer { border-left-color: #6c757d; }
    .rdv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .rdv-time { color: #333; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
    .badge-planifier { background: #e3f2fd; color: #1976d2; }
    .badge-confirmer { background: #e8f5e8; color: #2e7d32; }
    .badge-annuler { background: #ffebee; color: #c62828; }
    .badge-terminer { background: #f3e5f5; color: #7b1fa2; }
    .rdv-details { margin-bottom: 1rem; }
    .rdv-patient h4 { margin: 0.5rem 0; }
    .rdv-motif p { margin: 0.5rem 0; color: #666; }
    .rdv-actions { display: flex; gap: 0.5rem; }
    .btn-confirm, .btn-cancel-rdv, .btn-complete { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
    .btn-confirm { background: #28a745; color: white; }
    .btn-cancel-rdv { background: #dc3545; color: white; }
    .btn-complete { background: #6c757d; color: white; }
    .nav-actions { display: flex; gap: 0.5rem; }
    .nav-btn { background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.5rem; border-radius: 50%; cursor: pointer; font-size: 1.2rem; position: relative; transition: all 0.3s ease; }
    .nav-btn:hover { background: rgba(255,255,255,0.3); transform: scale(1.1); }
    .badge { position: absolute; top: -5px; right: -5px; background: #dc3545; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem; padding: 1rem; background: white; border-radius: 8px; }
    .btn-pagination { padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; color: #333; border-radius: 4px; cursor: pointer; }
    .btn-pagination:hover:not(:disabled) { background: #f8f9fa; }
    .btn-pagination:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination-info { font-weight: 600; color: #333; }
    .view-toggle { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .btn-toggle { padding: 0.75rem 1.5rem; border: 2px solid #007bff; background: white; color: #007bff; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s; }
    .btn-toggle.active { background: #007bff; color: white; }
    .btn-toggle:hover { background: #007bff; color: white; }
  `]
})
export class MedecinRendezVousComponent implements OnInit {
  rendezVous: any[] = [];
  filteredRendezVous: any[] = [];
  currentUser: User | null = null;
  statusFilter = '';
  dateFilter = '';
  notificationCount = 0;
  showProfileModal = false;
  showNotifications = false;
  viewMode: 'calendar' | 'list' = 'calendar';
  currentPage = 1;
  showUpcoming = false;
  itemsPerPage = 10;
  totalPages = 0;

  constructor(
    private rendezVousService: RendezVousService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.notificationService.connectWebSocket();
        this.subscribeToNotifications();
      }
    });
    this.loadRendezVous();
  }

  loadRendezVous(): void {
    const service = this.showUpcoming ? 
      this.rendezVousService.getUpcomingRendezVous() : 
      this.rendezVousService.getAllRendezVous();
    
    service.subscribe({
      next: rdv => {
        this.rendezVous = rdv.filter(r => r.medecinDTO?.id === this.currentUser?.id);
        if (this.showUpcoming) {
          const now = new Date();
          this.rendezVous = this.rendezVous.filter(r => new Date(r.dateHeureDebut) > now);
        }
        this.currentPage = 1;
        this.filterRendezVous();
        // Rendez-vous chargés silencieusement
      },
      error: () => {
        this.notificationService.error('Erreur', 'Impossible de charger les rendez-vous');
      }
    });
  }

  toggleUpcoming(): void {
    this.showUpcoming = !this.showUpcoming;
    this.loadRendezVous();
  }

  filterRendezVous(): void {
    const filtered = this.rendezVous.filter(rdv => {
      const statusMatch = !this.statusFilter || rdv.statut === this.statusFilter;
      const dateMatch = !this.dateFilter || rdv.dateHeureDebut?.startsWith(this.dateFilter);
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
    const motif = prompt('Motif d\'annulation (optionnel):');
    if (motif !== null) {
      this.rendezVousService.updateRendezVousStatus(rdv.id, 'ANNULE').subscribe({
        next: () => {
          this.loadRendezVous();
          // Rendez-vous annulé silencieusement
        },
        error: () => {
          this.notificationService.error('Erreur', 'Impossible d\'annuler le rendez-vous');
        }
      });
    }
  }

  completeRendezVous(rdv: any): void {
    this.rendezVousService.updateRendezVousStatus(rdv.id, 'TERMINE').subscribe({
      next: () => {
        this.loadRendezVous();
        // Rendez-vous terminé silencieusement
      },
      error: () => {
        this.notificationService.error('Erreur', 'Impossible de terminer le rendez-vous');
      }
    });
  }

  subscribeToNotifications(): void {
    this.notificationService.notifications$.subscribe(notifications => {
      this.notificationCount = notifications.length;
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
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

  logout(): void {
    this.notificationService.disconnectWebSocket();
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