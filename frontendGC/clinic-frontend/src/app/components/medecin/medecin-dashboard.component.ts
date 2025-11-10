import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/auth.model';
import { ChatService } from '../../services/chat.service';
import { NotificationsComponent } from '../notifications/notifications.component';
import { NotificationToastComponent } from '../shared/notification-toast.component';
import { ProfileModalComponent } from '../shared/profile-modal.component';
import { ChatComponent } from '../shared/chat.component';
import { ChatContactsComponent } from '../shared/chat-contacts.component';

@Component({
  selector: 'app-medecin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NotificationsComponent, NotificationToastComponent, ProfileModalComponent, ChatComponent, ChatContactsComponent],
  template: `
    <div class="dashboard-container">
      <app-notifications [isVisible]="showNotifications"></app-notifications>
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
              placeholder="Rechercher patients, RDV..."
              class="search-input">
          </div>
        </div>
        <div class="nav-actions">
          <button (click)="toggleNotifications()" class="nav-btn" title="Notifications">
            🔔 <span class="badge" *ngIf="notificationCount > 0">{{ notificationCount }}</span>
          </button>
          <button (click)="toggleChat()" class="nav-btn" title="Messages">
            💬 <span class="badge" *ngIf="totalUnreadMessages > 0">{{ totalUnreadMessages }}</span>
          </button>
        </div>
        <div class="nav-user" *ngIf="currentUser">
          <span class="welcome-text">Bienvenue, Dr. {{ currentUser.prenom }} !</span>
          <span class="user-role-badge role-medecin">MÉDECIN</span>
        </div>
      </nav>
      
      <div class="main-content">
        <aside class="sidebar">
          <div class="sidebar-content">
            <ul class="nav-menu">
              <li><a routerLink="/medecin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">📊 Tableau de bord</a></li>
              <li><a routerLink="/medecin/patients" routerLinkActive="active">👥 Mes Patients</a></li>
              <li><a routerLink="/medecin/rendezvous" routerLinkActive="active">📅 Mes Rendez-vous</a></li>
              <li><a routerLink="/medecin/prescriptions" routerLinkActive="active">💊 Prescriptions</a></li>
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
          <div class="welcome-section">
            <h2>🩺 Espace Médecin</h2>
            <p>Gérez vos consultations et suivez vos patients</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card patients">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <h3>{{ stats?.mesPatients || 0 }}</h3>
                <p>Mes patients</p>
              </div>
              <button (click)="navigateToPatients()" class="stat-action">Voir</button>
            </div>
            
            <div class="stat-card appointments">
              <div class="stat-icon">📅</div>
              <div class="stat-info">
                <h3>{{ stats?.rdvAujourdhui || 0 }}</h3>
                <p>RDV aujourd'hui</p>
              </div>
              <button (click)="navigateToRendezVous()" class="stat-action">Consulter</button>
            </div>
            
            <div class="stat-card pending">
              <div class="stat-icon">⏰</div>
              <div class="stat-info">
                <h3>{{ stats?.rdvEnAttente || 0 }}</h3>
                <p>En attente</p>
              </div>
              <button (click)="navigateToRendezVous()" class="stat-action">Traiter</button>
            </div>
          </div>

          <div class="quick-actions">
            <h3>🚀 Actions Rapides</h3>
            <div class="actions-grid">
              <button (click)="navigateToAddConsultation()" class="action-btn add-consultation">
                <span class="action-icon">📝➕</span>
                <span class="action-text">Nouvelle Consultation</span>
              </button>
              
              <button (click)="searchPatient()" class="action-btn search">
                <span class="action-icon">🔍</span>
                <span class="action-text">Rechercher Patient</span>
              </button>
              
              <button (click)="navigateToPrescriptions()" class="action-btn prescriptions">
                <span class="action-icon">💊</span>
                <span class="action-text">Mes Prescriptions</span>
              </button>
              
              <button (click)="viewSchedule()" class="action-btn schedule">
                <span class="action-icon">📋</span>
                <span class="action-text">Mon Planning</span>
              </button>
            </div>
          </div>

          <!-- Revenus Annuels et Mensuels (Admin uniquement) -->
          <div *ngIf="currentUser?.role === 'ADMIN'" class="revenue-section">
            <div class="section-header">
              <h3>💰 Revenus de l'Hôpital</h3>
              <div class="selectors">
                <select [(ngModel)]="selectedYear" (change)="onYearChange()" class="year-select">
                  <option *ngFor="let year of years" [value]="year">{{ year }}</option>
                </select>
                <select [(ngModel)]="selectedMonth" (change)="onMonthChange()" class="month-select">
                  <option *ngFor="let month of months" [value]="month.value">{{ month.name }}</option>
                </select>
              </div>
            </div>
            <div class="revenue-cards">
              <div class="revenue-card annual">
                <div class="revenue-amount">
                  <span class="amount">{{ revenuAnnuel | currency:'EUR':'symbol':'1.2-2' }}</span>
                  <span class="year-label">Revenus {{ selectedYear }}</span>
                </div>
              </div>
              <div class="revenue-card monthly">
                <div class="revenue-amount">
                  <span class="amount">{{ revenuMensuel | currency:'EUR':'symbol':'1.2-2' }}</span>
                  <span class="year-label">{{ getMonthName(selectedMonth) }} {{ selectedYear }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="recent-section">
            <h3>📋 Mes rendez-vous du jour</h3>
            <div class="appointments-list">
              <div *ngFor="let rdv of todayAppointments" class="appointment-card">
                <div class="appointment-time">{{ rdv.dateHeureDebut | date:'HH:mm' }}</div>
                <div class="appointment-patient">
                  <strong>{{ rdv.patient?.prenom }} {{ rdv.patient?.nom }}</strong>
                  <span>{{ rdv.motif }}</span>
                </div>
                <div class="appointment-status" [class]="'status-' + rdv.statut?.toLowerCase()">
                  {{ getStatusDisplay(rdv.statut) }}
                </div>
              </div>
              <div *ngIf="todayAppointments.length === 0" class="no-appointments">
                <p>Aucun rendez-vous prévu aujourd'hui</p>
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
      
      <app-chat-contacts
        [isVisible]="showChatContacts"
        (closed)="showChatContacts = false"
        (contactSelected)="openChat($event)">
      </app-chat-contacts>
      
      <app-chat
        [isVisible]="showChat"
        [otherUser]="selectedChatUser"
        (closed)="showChat = false">
      </app-chat>
    </div>
  `,
  styles: [`
    .dashboard-container { height: 100vh; background: linear-gradient(rgba(255,255,255,0.3), rgba(0,123,255,0.2)), url('https://mydoctorsclinicsurfers.com.au/wp-content/uploads/2023/04/contact-Banner.jpeg'); background-size: cover; background-position: center; background-attachment: fixed; display: flex; flex-direction: column; overflow: hidden; }
    .navbar { background-color: #007bff; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-shrink: 0; }
    .nav-brand h1 { margin: 0; }
    .nav-search { flex: 1; max-width: 500px; }
    .search-container { position: relative; }
    .search-input { width: 100%; padding: 0.75rem 1rem; border: none; border-radius: 25px; font-size: 1rem; outline: none; }
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
    .welcome-section { text-align: center; margin-bottom: 2rem; }
    .welcome-section h2 { color: #333; margin-bottom: 0.5rem; }
    .welcome-section p { color: #666; font-size: 1.1rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 1rem; position: relative; }
    .stat-card.patients { border-left: 4px solid #007bff; }
    .stat-card.appointments { border-left: 4px solid #28a745; }
    .stat-card.pending { border-left: 4px solid #ffc107; }
    .stat-icon { font-size: 2.5rem; }
    .stat-info { flex: 1; }
    .stat-info h3 { font-size: 2rem; margin: 0; color: #333; }
    .stat-info p { margin: 0; color: #666; }
    .stat-action { background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer; font-weight: bold; }
    .quick-actions { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 2rem; }
    .quick-actions h3 { margin-top: 0; color: #333; }
    .actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .action-btn { background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: none; padding: 1.5rem; border-radius: 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; transition: all 0.3s ease; }
    .action-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
    .action-btn.add-consultation:hover { background: linear-gradient(135deg, #007bff, #0056b3); color: white; }
    .action-btn.search:hover { background: linear-gradient(135deg, #28a745, #1e7e34); color: white; }
    .action-btn.schedule:hover { background: linear-gradient(135deg, #17a2b8, #138496); color: white; }
    .action-btn.prescriptions:hover { background: linear-gradient(135deg, #28a745, #1e7e34); color: white; }
    .action-icon { font-size: 2rem; }
    .action-text { font-weight: bold; }
    .recent-section { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .recent-section h3 { margin-top: 0; color: #333; }
    .appointments-list { display: flex; flex-direction: column; gap: 1rem; }
    .appointment-card { display: flex; align-items: center; padding: 1rem; background: #f8f9fa; border-radius: 8px; gap: 1rem; }
    .appointment-time { font-weight: bold; color: #007bff; min-width: 60px; }
    .appointment-patient { flex: 1; }
    .appointment-patient strong { display: block; }
    .appointment-patient span { color: #666; font-size: 0.9rem; }
    .appointment-status { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
    .status-programme { background: #e3f2fd; color: #1976d2; }
    .status-confirme { background: #e8f5e8; color: #2e7d32; }
    .no-appointments { text-align: center; padding: 2rem; color: #666; }
    .nav-actions { display: flex; gap: 0.5rem; }
    .nav-btn { background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.5rem; border-radius: 50%; cursor: pointer; font-size: 1.2rem; position: relative; transition: all 0.3s ease; }
    .nav-btn:hover { background: rgba(255,255,255,0.3); transform: scale(1.1); }
    .badge { position: absolute; top: -5px; right: -5px; background: #dc3545; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; }
    .revenue-section { margin-bottom: 2rem; background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .selectors { display: flex; gap: 1rem; }
    .year-select, .month-select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
    .revenue-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .revenue-card { color: white; padding: 2rem; border-radius: 12px; text-align: center; }
    .revenue-card.annual { background: linear-gradient(135deg, #28a745, #20c997); }
    .revenue-card.monthly { background: linear-gradient(135deg, #007bff, #0056b3); }
    .amount { font-size: 2.5rem; font-weight: bold; display: block; }
    .year-label { font-size: 1.1rem; opacity: 0.9; }
  `]
})
export class MedecinDashboardComponent implements OnInit {
  currentUser: User | null = null;
  stats: any = {};
  todayAppointments: any[] = [];
  searchQuery = '';
  notificationCount = 0;
  showNotifications = false;
  showChatContacts = false;
  showChat = false;
  selectedChatUser: any = null;
  totalUnreadMessages = 0;
  showProfileModal = false;
  revenuAnnuel = 0;
  revenuMensuel = 0;
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  years = [2023, 2024, 2025, 2026];
  months = [
    { value: 1, name: 'Janvier' },
    { value: 2, name: 'Février' },
    { value: 3, name: 'Mars' },
    { value: 4, name: 'Avril' },
    { value: 5, name: 'Mai' },
    { value: 6, name: 'Juin' },
    { value: 7, name: 'Juillet' },
    { value: 8, name: 'Août' },
    { value: 9, name: 'Septembre' },
    { value: 10, name: 'Octobre' },
    { value: 11, name: 'Novembre' },
    { value: 12, name: 'Décembre' }
  ];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private notificationService: NotificationService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.notificationService.connectWebSocket();
        this.subscribeToNotifications();
        this.loadData(); // Charger après avoir l'utilisateur
        if (user.role === 'ADMIN') {
          this.loadRevenuAnnuel();
          this.loadRevenuMensuel();
        }
      }
    });
  }

  loadData(): void {
    if (this.currentUser?.id) {
      this.dashboardService.getMedecinStats(this.currentUser.id).subscribe({
        next: stats => {
          console.log('Stats médecin reçues:', stats);
          this.stats = stats;
        },
        error: () => this.stats = { mesPatients: 0, rdvAujourdhui: 0, rdvEnAttente: 0 }
      });
    }

    this.dashboardService.getRecentRendezVous().subscribe({
      next: rdv => this.todayAppointments = rdv,
      error: () => this.todayAppointments = []
    });
  }

  loadRevenuAnnuel(): void {
    this.dashboardService.getRevenuAnnuel(this.selectedYear).subscribe({
      next: (data) => {
        this.revenuAnnuel = data.revenuAnnuel;
      },
      error: (error) => {
        console.error('Erreur chargement revenus:', error);
      }
    });
  }

  loadRevenuMensuel(): void {
    this.dashboardService.getRevenuMensuel(this.selectedYear, this.selectedMonth).subscribe({
      next: (data) => {
        this.revenuMensuel = data.revenuMensuel;
      },
      error: (error) => {
        console.error('Erreur chargement revenus mensuels:', error);
      }
    });
  }

  onYearChange(): void {
    this.loadRevenuAnnuel();
    this.loadRevenuMensuel();
  }

  onMonthChange(): void {
    this.loadRevenuMensuel();
  }

  getMonthName(monthValue: number): string {
    const month = this.months.find(m => m.value === monthValue);
    return month ? month.name : 'Mois inconnu';
  }

  navigateToPatients(): void {
    this.router.navigate(['/medecin/patients']);
  }

  navigateToRendezVous(): void {
    this.router.navigate(['/medecin/rendezvous']);
  }

  navigateToAddConsultation(): void {
    this.router.navigate(['/medecin/rendezvous'], { queryParams: { action: 'add' } });
  }

  searchPatient(): void {
    this.router.navigate(['/medecin/patients'], { queryParams: { search: true } });
  }

  viewSchedule(): void {
    this.router.navigate(['/medecin/rendezvous']);
  }

  navigateToPrescriptions(): void {
    this.router.navigate(['/medecin/prescriptions']);
  }

  onSearch(): void {
    if (this.searchQuery.length > 2) {
      // Logique de recherche
    }
  }

  subscribeToNotifications(): void {
    this.notificationService.notifications$.subscribe(notifications => {
      this.notificationCount = notifications.length;
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  toggleChat(): void {
    this.showChatContacts = !this.showChatContacts;
  }

  openChat(user: any): void {
    this.selectedChatUser = user;
    this.showChat = true;
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
        this.notificationService.success('Déconnexion', 'À bientôt !');
        this.router.navigate(['/login']);
      },
      error: () => {
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
      }
    });
  }
}