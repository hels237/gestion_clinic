import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MedecinService } from '../../services/medecin.service';
import { NotificationService } from '../../services/notification.service';
import { Medecin, Role } from '../../models/medecin.model';

@Component({
  selector: 'app-medecins',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="layout-container">
      <nav class="navbar">
        <div class="nav-brand">
          <h1>Gestion Clinique</h1>
        </div>
        <div class="nav-user">
          <span class="welcome-text">Gestion des Médecins</span>
        </div>
      </nav>
      
      <div class="main-content">
        <aside class="sidebar">
          <ul class="nav-menu">
            <li><a routerLink="/dashboard">📊 Tableau de bord</a></li>
            <li><a routerLink="/patients">👥 Patients</a></li>
            <li><a routerLink="/medecins" class="active">👨⚕️ Médecins</a></li>
            <li><a routerLink="/rendezvous">📅 Rendez-vous</a></li>
            <li><a routerLink="/users">👥 Utilisateurs</a></li>
          </ul>
          <div class="sidebar-footer"></div>
        </aside>
        
        <main class="content">
          <div class="medecins-container">
            <div class="header">
              <h2>Gestion des Médecins</h2>
              <div class="header-actions">
                <button (click)="showAddForm = !showAddForm" class="btn-primary">
                  <span class="btn-icon">{{ showAddForm ? '❌' : '➕' }}</span>
                  {{ showAddForm ? 'Annuler' : 'Ajouter Médecin' }}
                </button>
              </div>
            </div>

      <div *ngIf="showAddForm" class="medecin-form">
        <h3>{{ editingMedecin ? 'Modifier' : 'Ajouter' }} Médecin</h3>
        <form (ngSubmit)="saveMedecin()" #medecinForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label>Nom:</label>
              <input [(ngModel)]="currentMedecin.nom" name="nom" required class="form-control">
            </div>
            <div class="form-group">
              <label>Prénom:</label>
              <input [(ngModel)]="currentMedecin.prenom" name="prenom" required class="form-control">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Email:</label>
              <input type="email" [(ngModel)]="currentMedecin.email" name="email" required class="form-control">
            </div>
            <div class="form-group">
              <label>Spécialité:</label>
              <input [(ngModel)]="currentMedecin.specialite" name="specialite" required class="form-control">
            </div>
          </div>
          <div class="form-group" *ngIf="!editingMedecin">
            <label>Mot de passe:</label>
            <input type="password" [(ngModel)]="currentMedecin.motDePasse" name="motDePasse" required class="form-control">
          </div>
          <h4>Adresse</h4>
          <div class="form-row">
            <div class="form-group">
              <label>Rue:</label>
              <input [ngModel]="currentMedecin.adressDto.street" (ngModelChange)="updateAdresse('street', $event)" name="street" required class="form-control">
            </div>
            <div class="form-group">
              <label>Numéro:</label>
              <input [ngModel]="currentMedecin.adressDto.houseNumber" (ngModelChange)="updateAdresse('houseNumber', $event)" name="houseNumber" class="form-control">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Ville:</label>
              <input [ngModel]="currentMedecin.adressDto.city" (ngModelChange)="updateAdresse('city', $event)" name="city" required class="form-control">
            </div>
            <div class="form-group">
              <label>Code postal:</label>
              <input type="number" [ngModel]="currentMedecin.adressDto.postalCode" (ngModelChange)="updateAdresse('postalCode', $event)" name="postalCode" required class="form-control">
            </div>
          </div>
          <div class="form-group">
            <label>Pays:</label>
            <input [ngModel]="currentMedecin.adressDto.country" (ngModelChange)="updateAdresse('country', $event)" name="country" required class="form-control">
          </div>
          <div class="form-actions">
            <button type="submit" [disabled]="!medecinForm.valid" class="btn-primary">Sauvegarder</button>
            <button type="button" (click)="cancelEdit()" class="btn-secondary">Annuler</button>
          </div>
        </form>
      </div>

      <div class="medecins-table">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Email</th>
              <th>Spécialité</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let medecin of medecins">
              <td>{{ medecin.nom }}</td>
              <td>{{ medecin.prenom }}</td>
              <td>{{ medecin.email }}</td>
              <td>{{ medecin.specialite }}</td>
              <td>
                <button (click)="editMedecin(medecin)" class="btn-edit">Modifier</button>
                <button (click)="deleteMedecin(medecin.id!)" class="btn-delete">Supprimer</button>
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
    .medecins-container { }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header h2 { margin: 0; color: #333; }
    .header-actions { display: flex; gap: 1rem; }
    .btn-icon { margin-right: 0.5rem; font-size: 1.1rem; }
    .medecin-form { background: white; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
    .form-control { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    .form-actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .btn-primary, .btn-secondary, .btn-edit, .btn-delete { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; }
    .btn-primary { background-color: #007bff; color: white; font-weight: 600; transition: all 0.3s ease; }
    .btn-primary:hover { background-color: #0056b3; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,123,255,0.3); }
    .btn-secondary { background-color: #6c757d; color: white; }
    .btn-edit { background-color: #28a745; color: white; margin-right: 0.5rem; }
    .btn-delete { background-color: #dc3545; color: white; }
    .medecins-table { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background-color: #f8f9fa; font-weight: bold; }
  `]
})
export class MedecinsComponent implements OnInit {
  medecins: Medecin[] = [];
  currentMedecin: Medecin = this.initMedecin();
  showAddForm = false;
  editingMedecin = false;

  constructor(
    private medecinService: MedecinService,
    private notificationService: NotificationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadMedecins();
    
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        this.showAddForm = true;
      }
    });
  }

  loadMedecins(): void {
    this.medecinService.getAllMedecins().subscribe({
      next: medecins => {
        this.medecins = medecins;
        // Médecins chargés silencieusement
      },
      error: () => {
        this.notificationService.error('Erreur', 'Impossible de charger les médecins');
      }
    });
  }

  initMedecin(): Medecin {
    return {
      nom: '',
      prenom: '',
      email: '',
      specialite: '',
      motDePasse: '',
      role: Role.MEDECIN,
      adressDto: {
        street: '',
        houseNumber: '',
        city: '',
        postalCode: 0,
        country: ''
      }
    };
  }

  saveMedecin(): void {
    console.log('Tentative de sauvegarde du médecin:', this.currentMedecin);
    
    if (this.editingMedecin) {
      this.medecinService.updateMedecin(this.currentMedecin.id!, this.currentMedecin).subscribe({
        next: (response) => {
          console.log('Médecin modifié avec succès:', response);
          this.loadMedecins();
          this.cancelEdit();
          // Médecin modifié silencieusement
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.notificationService.error('Erreur', 'Impossible de modifier le médecin');
        }
      });
    } else {
      this.medecinService.createMedecin(this.currentMedecin).subscribe({
        next: (response) => {
          console.log('Médecin créé avec succès:', response);
          this.loadMedecins();
          this.cancelEdit();
          // Médecin créé silencieusement
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.notificationService.error('Erreur', 'Impossible de créer le médecin');
        }
      });
    }
  }

  editMedecin(medecin: Medecin): void {
    this.currentMedecin = { 
      ...medecin,
      adressDto: medecin.adressDto ? { ...medecin.adressDto } : {
        street: '',
        houseNumber: '',
        city: '',
        postalCode: 0,
        country: ''
      }
    };
    this.editingMedecin = true;
    this.showAddForm = true;
  }

  deleteMedecin(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce médecin ?')) {
      this.medecinService.deleteMedecin(id).subscribe({
        next: () => {
          this.loadMedecins();
          // Médecin supprimé silencieusement
        },
        error: () => {
          this.notificationService.error('Erreur', 'Impossible de supprimer le médecin');
        }
      });
    }
  }

  updateAdresse(field: string, value: string | number): void {
    if (!this.currentMedecin.adressDto) {
      this.currentMedecin.adressDto = { 
        street: '', 
        houseNumber: '', 
        city: '', 
        postalCode: 0, 
        country: '' 
      };
    }
    (this.currentMedecin.adressDto as any)[field] = value;
  }

  cancelEdit(): void {
    this.currentMedecin = this.initMedecin();
    this.editingMedecin = false;
    this.showAddForm = false;
  }
}