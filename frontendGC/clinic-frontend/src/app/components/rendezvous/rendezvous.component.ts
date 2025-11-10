import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RendezVousService } from '../../services/rendezvous.service';
import { PatientService } from '../../services/patient.service';
import { MedecinService } from '../../services/medecin.service';
import { NotificationService } from '../../services/notification.service';
import { RendezVous, RendezVousRequest, StatutRendezVous } from '../../models/rendezvous.model';
import { Patient } from '../../models/patient.model';
import { Medecin } from '../../models/medecin.model';

@Component({
  selector: 'app-rendezvous',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="layout-container">
      <nav class="navbar">
        <div class="nav-brand">
          <h1>Gestion Clinique</h1>
        </div>
        <div class="nav-user">
          <span class="welcome-text">Gestion des Rendez-vous</span>
        </div>
      </nav>
      
      <div class="main-content">
        <aside class="sidebar">
          <ul class="nav-menu">
            <li><a routerLink="/dashboard">📊 Tableau de bord</a></li>
            <li><a routerLink="/patients">👥 Patients</a></li>
            <li><a routerLink="/medecins">👨⚕️ Médecins</a></li>
            <li><a routerLink="/rendezvous" class="active">📅 Rendez-vous</a></li>
            <li><a routerLink="/users">👥 Utilisateurs</a></li>
          </ul>
          <div class="sidebar-footer"></div>
        </aside>
        
        <main class="content">
          <div class="rendezvous-container">
            <div class="header">
              <h2>Gestion des Rendez-vous</h2>
              <div class="header-actions">
                <button (click)="showAddForm = !showAddForm" class="btn-primary">
                  <span class="btn-icon">{{ showAddForm ? '❌' : '➕' }}</span>
                  {{ showAddForm ? 'Annuler' : 'Ajouter Rendez-vous' }}
                </button>
              </div>
            </div>

      <div *ngIf="showAddForm" class="rendezvous-form">
        <h3>{{ editingRendezVous ? 'Modifier' : 'Ajouter' }} Rendez-vous</h3>
        <form (ngSubmit)="saveRendezVous()" #rendezVousForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label>Patient:</label>
              <select [(ngModel)]="currentRendezVous.patientId" name="patientId" required class="form-control">
                <option value="">Sélectionner un patient</option>
                <option *ngFor="let patient of patients" [value]="patient.id">
                  {{ patient.nom }} {{ patient.prenom }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Médecin:</label>
              <select [(ngModel)]="currentRendezVous.medecinId" name="medecinId" required class="form-control">
                <option value="">Sélectionner un médecin</option>
                <option *ngFor="let medecin of medecins" [value]="medecin.id">
                  Dr. {{ medecin.nom }} {{ medecin.prenom }} - {{ medecin.specialite }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Date et heure:</label>
              <input type="datetime-local" [(ngModel)]="currentRendezVous.dateHeureDebut" name="dateHeureDebut" required class="form-control">
            </div>
            <div class="form-group">
              <label>Motif:</label>
              <input [(ngModel)]="currentRendezVous.motif" name="motif" required class="form-control">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Salle:</label>
              <input [(ngModel)]="currentRendezVous.salle" name="salle" class="form-control" placeholder="Ex: Salle 101">
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" [disabled]="!rendezVousForm.valid" class="btn-primary">Sauvegarder</button>
            <button type="button" (click)="cancelEdit()" class="btn-secondary">Annuler</button>
          </div>
        </form>
      </div>

      <div class="filters-section">
        <h3>🔍 Filtres</h3>
        <div class="filters-row">
          <div class="filter-group">
            <label>Statut:</label>
            <select [(ngModel)]="statusFilter" (change)="filterRendezVous()" class="form-control">
              <option value="">Tous les statuts</option>
              <option value="PLANIFIER">Planifié</option>
              <option value="CONFIRMER">Confirmé</option>
              <option value="ANNULER">Annulé</option>
              <option value="TERMINER">Terminé</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Date:</label>
            <input type="date" [(ngModel)]="dateFilter" (change)="filterRendezVous()" class="form-control">
          </div>
          <div class="filter-group">
            <label>Médecin:</label>
            <select [(ngModel)]="medecinFilter" (change)="filterRendezVous()" class="form-control">
              <option value="">Tous les médecins</option>
              <option *ngFor="let medecin of medecins" [value]="medecin.id">
                Dr. {{ medecin.nom }} {{ medecin.prenom }}
              </option>
            </select>
          </div>
          <button (click)="clearFilters()" class="btn-secondary">❌ Effacer</button>
        </div>
      </div>

      <div class="rendezvous-table">
        <div class="table-header">
          <h3>📅 Rendez-vous ({{ filteredRendezVous.length }})</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date/Heure</th>
              <th>Patient</th>
              <th>Médecin</th>
              <th>Motif</th>
              <th>Salle</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let rdv of filteredRendezVous">
              <td>{{ rdv.dateHeureDebut | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>{{ rdv.patientNom }}</td>
              <td>{{ getMedecinNom(rdv) }}</td>
              <td>{{ rdv.motif }}</td>
              <td>🏥 {{ rdv.salle || 'Non assignée' }}</td>
              <td>
                <span [class]="'status-' + rdv.statut.toLowerCase()">{{ getStatutLabel(rdv.statut) }}</span>
              </td>
              <td>
                <button (click)="editRendezVous(rdv)" class="btn-edit">Modifier</button>
                <button (click)="cancelRendezVous(rdv.id!)" class="btn-cancel" 
                        *ngIf="rdv.statut !== 'ANNULER'" 
                        [disabled]="!canCancelRendezVous(rdv)"
                        [title]="!canCancelRendezVous(rdv) ? 'Annulation impossible (moins de 24h)' : ''">Annuler</button>
                <button (click)="deleteRendezVous(rdv.id!)" class="btn-delete">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
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
    .layout-container { height: 100vh; background: linear-gradient(rgba(255,255,255,0.3), rgba(0,123,255,0.2)), url('https://cdn.futura-sciences.com/sources/images/informatique-administrateur-re%CC%81seaux.jpeg'); background-size: cover; background-position: center; background-attachment: fixed; display: flex; flex-direction: column; overflow: hidden; }
    .navbar { background-color: #007bff; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .nav-brand h1 { margin: 0; }
    .welcome-text { font-weight: 600; color: white; }
    .main-content { display: flex; flex: 1; overflow: hidden; }
    .sidebar { width: 250px; background-color: white; box-shadow: 2px 0 5px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; }
    .nav-menu { list-style: none; padding: 0; margin: 0; flex: 1; }
    .nav-menu li a { display: block; padding: 1rem 1.5rem; text-decoration: none; color: #333; border-bottom: 1px solid #eee; }
    .nav-menu li a:hover, .nav-menu li a.active { background-color: #007bff; color: white; }
    .sidebar-footer { padding: 1rem; border-top: 1px solid #eee; background: #f8f9fa; }
    .global-footer { background-color: #f8f9fa; border-top: 1px solid #dee2e6; padding: 1rem 0; flex-shrink: 0; }
    .footer-content { text-align: center; font-size: 0.9rem; color: #666; font-weight: 500; }
    .content { flex: 1; padding: 2rem; overflow-y: auto; }
    .rendezvous-container { }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header h2 { margin: 0; color: #333; }
    .header-actions { display: flex; gap: 1rem; }
    .btn-icon { margin-right: 0.5rem; font-size: 1.1rem; }
    .rendezvous-form { background: white; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
    .form-control { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    .form-actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .btn-primary, .btn-secondary, .btn-edit, .btn-cancel, .btn-delete { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem; }
    .btn-primary { background-color: #007bff; color: white; font-weight: 600; transition: all 0.3s ease; }
    .btn-primary:hover { background-color: #0056b3; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,123,255,0.3); }
    .btn-secondary { background-color: #6c757d; color: white; }
    .btn-edit { background-color: #28a745; color: white; }
    .btn-cancel { background-color: #ffc107; color: black; }
    .btn-cancel:disabled { background-color: #e9ecef; color: #6c757d; cursor: not-allowed; opacity: 0.6; }
    .btn-delete { background-color: #dc3545; color: white; }
    .filters-section { background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .filters-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) auto; gap: 1rem; align-items: end; }
    .filter-group { display: flex; flex-direction: column; }
    .filter-group label { margin-bottom: 0.5rem; font-weight: bold; }
    .table-header { padding: 1.5rem; border-bottom: 1px solid #eee; }
    .table-header h3 { margin: 0; color: #333; }
    .rendezvous-table { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background-color: #f8f9fa; font-weight: bold; }
    .status-planifier { background-color: #e3f2fd; color: #1976d2; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .status-confirmer { background-color: #e8f5e8; color: #2e7d32; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .status-annuler { background-color: #ffebee; color: #c62828; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .status-terminer { background-color: #f3e5f5; color: #7b1fa2; padding: 0.25rem 0.5rem; border-radius: 4px; }
  `]
})
export class RendezVousComponent implements OnInit {
  rendezVous: RendezVous[] = [];
  filteredRendezVous: RendezVous[] = [];
  patients: Patient[] = [];
  medecins: Medecin[] = [];
  currentRendezVous: RendezVousRequest = this.initRendezVous();
  showAddForm = false;
  editingRendezVous = false;
  editingId?: number;
  statusFilter = '';
  dateFilter = '';
  medecinFilter = '';

  constructor(
    private rendezVousService: RendezVousService,
    private patientService: PatientService,
    private medecinService: MedecinService,
    private notificationService: NotificationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadRendezVous();
    this.loadPatients();
    this.loadMedecins();
    
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        this.showAddForm = true;
      }
    });
  }

  loadRendezVous(): void {
    this.rendezVousService.getAllRendezVous().subscribe({
      next: rendezVous => {
        this.rendezVous = rendezVous;
        this.filterRendezVous();
        this.notificationService.success('Rendez-vous', `${rendezVous.length} rendez-vous chargés`);
      },
      error: () => {
        this.notificationService.error('Erreur', 'Impossible de charger les rendez-vous');
      }
    });
  }

  loadPatients(): void {
    this.patientService.getAllPatients().subscribe(patients => {
      this.patients = patients;
    });
  }

  loadMedecins(): void {
    this.medecinService.getAllMedecins().subscribe(medecins => {
      this.medecins = medecins;
    });
  }

  initRendezVous(): RendezVousRequest {
    return {
      dateHeureDebut: '',
      motif: '',
      salle: '',
      patientId: 0,
      medecinId: 0
    };
  }

  getMedecinNom(rdv: RendezVous): string {
    if (rdv.medecinDTO) {
      return `Dr. ${rdv.medecinDTO.prenom} ${rdv.medecinDTO.nom}`;
    }
    return 'N/A';
  }

  getStatutLabel(statut: StatutRendezVous): string {
    switch (statut) {
      case 'PLANIFIER': return 'Planifié';
      case 'CONFIRMER': return 'Confirmé';
      case 'ANNULER': return 'Annulé';
      case 'TERMINER': return 'Terminé';
      default: return statut;
    }
  }

  saveRendezVous(): void {
    console.log('Saving rendez-vous:', this.currentRendezVous);
    
    if (this.editingRendezVous && this.editingId) {
      console.log('Updating rendez-vous with ID:', this.editingId);
      this.rendezVousService.updateRendezVous(this.editingId, this.currentRendezVous).subscribe({
        next: (response) => {
          console.log('Update response:', response);
          this.loadRendezVous();
          this.cancelEdit();
          this.notificationService.success('Succès', 'Rendez-vous modifié avec succès');
        },
        error: (error) => {
          console.error('Update error:', error);
          const errorMsg = this.getErrorMessage(error);
          this.notificationService.error('Erreur', errorMsg);
        }
      });
    } else {
      console.log('Creating new rendez-vous');
      this.rendezVousService.createRendezVous(this.currentRendezVous).subscribe({
        next: (response) => {
          console.log('Create response:', response);
          this.loadRendezVous();
          this.cancelEdit();
          this.notificationService.success('Succès', 'Rendez-vous créé avec succès');
        },
        error: (error) => {
          console.error('Create error:', error);
          const errorMsg = this.getErrorMessage(error);
          this.notificationService.error('Erreur', errorMsg);
        }
      });
    }
  }

  editRendezVous(rdv: RendezVous): void {
    this.currentRendezVous = {
      dateHeureDebut: rdv.dateHeureDebut,
      motif: rdv.motif,
      salle: rdv.salle,
      patientId: rdv.patientId,
      medecinId: rdv.medecinDTO?.id || 0
    };
    this.editingId = rdv.id;
    this.editingRendezVous = true;
    this.showAddForm = true;
  }

  cancelRendezVous(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      this.rendezVousService.cancelRendezVous(id).subscribe({
        next: () => {
          this.loadRendezVous();
          this.notificationService.success('Succès', 'Rendez-vous annulé avec succès');
        },
        error: (error) => {
          const errorMsg = this.getErrorMessage(error);
          this.notificationService.error('Erreur', errorMsg);
        }
      });
    }
  }

  deleteRendezVous(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      this.rendezVousService.deleteRendezVous(id).subscribe({
        next: () => {
          this.loadRendezVous();
          this.notificationService.success('Succès', 'Rendez-vous supprimé avec succès');
        },
        error: () => {
          this.notificationService.error('Erreur', 'Impossible de supprimer le rendez-vous');
        }
      });
    }
  }

  cancelEdit(): void {
    this.currentRendezVous = this.initRendezVous();
    this.editingRendezVous = false;
    this.editingId = undefined;
    this.showAddForm = false;
  }

  filterRendezVous(): void {
    this.filteredRendezVous = this.rendezVous.filter(rdv => {
      const matchesStatus = !this.statusFilter || rdv.statut === this.statusFilter;
      const matchesDate = !this.dateFilter || rdv.dateHeureDebut.startsWith(this.dateFilter);
      const matchesMedecin = !this.medecinFilter || rdv.medecinDTO?.id?.toString() === this.medecinFilter;
      return matchesStatus && matchesDate && matchesMedecin;
    });
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.dateFilter = '';
    this.medecinFilter = '';
    this.filterRendezVous();
  }

  private getErrorMessage(error: any): string {
    if (error.error && error.error.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Une erreur inattendue s\'est produite';
  }

  canCancelRendezVous(rdv: RendezVous): boolean {
    if (rdv.statut === 'ANNULER') return false;
    const rdvDate = new Date(rdv.dateHeureDebut);
    const now = new Date();
    const diffHours = (rdvDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= 24;
  }
}