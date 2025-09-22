import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { UserService, User } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="layout-container">
      <nav class="navbar">
        <div class="nav-brand">
          <h1>Gestion Clinique</h1>
        </div>
        <div class="nav-user">
          <span class="welcome-text">Gestion des Utilisateurs</span>
        </div>
      </nav>
      
      <div class="main-content">
        <aside class="sidebar">
          <ul class="nav-menu">
            <li><a routerLink="/dashboard">📊 Tableau de bord</a></li>
            <li><a routerLink="/patients">👥 Patients</a></li>
            <li><a routerLink="/medecins">👨⚕️ Médecins</a></li>
            <li><a routerLink="/rendezvous">📅 Rendez-vous</a></li>
            <li><a routerLink="/users" class="active">👤 Utilisateurs</a></li>
          </ul>
          <div class="sidebar-footer"></div>
        </aside>
        
        <main class="content">
          <div class="users-container">
            <div class="header">
              <h2>👥 Gestion des Utilisateurs</h2>
              <div class="header-actions">
                <button (click)="showAddForm = !showAddForm" class="btn-primary">
                  <span class="btn-icon">{{ showAddForm ? '❌' : '➕' }}</span>
                  {{ showAddForm ? 'Annuler' : 'Ajouter Utilisateur' }}
                </button>
                <button (click)="loadUsers()" class="btn-secondary">
                  <span class="btn-icon">🔄</span>
                  Actualiser
                </button>
              </div>
            </div>

      <div *ngIf="showAddForm" class="user-form">
        <h3>{{ editingUser ? 'Modifier' : 'Ajouter' }} Utilisateur</h3>
        <form (ngSubmit)="saveUser()" #userForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label>Nom:</label>
              <input [(ngModel)]="currentUser.nom" name="nom" required class="form-control">
            </div>
            <div class="form-group">
              <label>Prénom:</label>
              <input [(ngModel)]="currentUser.prenom" name="prenom" required class="form-control">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Email:</label>
              <input type="email" [(ngModel)]="currentUser.email" name="email" required class="form-control">
            </div>
            <div class="form-group">
              <label>Rôle:</label>
              <select [(ngModel)]="currentUser.role" name="role" required class="form-control">
                <option value="">Sélectionner un rôle</option>
                <option value="ADMIN">Administrateur</option>
                <option value="MEDECIN">Médecin</option>
                <option value="SECRETAIRE">Secrétaire</option>
              </select>
            </div>
          </div>
          <div class="form-group" *ngIf="!editingUser">
            <label>Mot de passe:</label>
            <input type="password" [(ngModel)]="currentUser.motDePasse" name="motDePasse" required class="form-control">
          </div>
          <div class="form-actions">
            <button type="submit" [disabled]="!userForm.valid" class="btn-primary">💾 Sauvegarder</button>
            <button type="button" (click)="cancelEdit()" class="btn-secondary">❌ Annuler</button>
          </div>
        </form>
      </div>

      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>👤 Nom</th>
              <th>📧 Email</th>
              <th>🎭 Rôle</th>
              <th>⚙️ Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.prenom }} {{ user.nom }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span [class]="'role-badge role-' + user.role.toLowerCase()">{{ getRoleLabel(user.role) }}</span>
              </td>
              <td class="actions">
                <button (click)="editUser(user)" class="btn-edit" title="Modifier">✏️</button>
                <button (click)="deleteUser(user.id!)" class="btn-delete" title="Supprimer">🗑️</button>
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
    .navbar { background-color: #007bff; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
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
    .users-container { }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header h2 { margin: 0; color: #333; }
    .header-actions { display: flex; gap: 1rem; }
    .btn-icon { margin-right: 0.5rem; font-size: 1.1rem; }
    .user-form { background: white; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
    .form-control { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    .form-actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .btn-primary, .btn-secondary, .btn-edit, .btn-delete { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; }
    .btn-primary { background-color: #007bff; color: white; }
    .btn-secondary { background-color: #6c757d; color: white; }
    .btn-edit { background-color: #28a745; color: white; margin-right: 0.5rem; }
    .btn-delete { background-color: #dc3545; color: white; }
    .users-table { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background-color: #f8f9fa; font-weight: bold; }
    .actions { white-space: nowrap; }
    .role-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
    .role-admin { background: #e3f2fd; color: #1976d2; }
    .role-medecin { background: #e8f5e8; color: #2e7d32; }
    .role-secretaire { background: #fff3e0; color: #f57c00; }
  `]
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  currentUser: User = this.initUser();
  showAddForm = false;
  editingUser = false;

  constructor(
    private userService: UserService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    console.log('Tentative de chargement des utilisateurs...');
    this.userService.getAllUsers().subscribe({
      next: users => {
        console.log('Utilisateurs chargés avec succès:', users);
        this.users = users;
        this.notificationService.success('Utilisateurs', `${users.length} utilisateurs chargés`);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Error body:', error.error);
        this.notificationService.error('Erreur', 'Impossible de charger les utilisateurs');
      }
    });
  }

  initUser(): User {
    return {
      nom: '',
      prenom: '',
      email: '',
      role: '',
      motDePasse: ''
    };
  }

  saveUser(): void {
    console.log('Tentative de sauvegarde de l\'utilisateur:', this.currentUser);
    console.log('Mode édition:', this.editingUser);
    
    // Vérifier si l'email existe déjà (sauf en mode édition)
    if (!this.editingUser && this.users.some(u => u.email === this.currentUser.email)) {
      this.notificationService.error('Erreur', 'Cet email est déjà utilisé');
      return;
    }

    if (this.editingUser) {
      console.log('Modification de l\'utilisateur avec ID:', this.currentUser.id);
      this.userService.updateUser(this.currentUser.id!, this.currentUser).subscribe({
        next: (response) => {
          console.log('Utilisateur modifié avec succès:', response);
          this.loadUsers();
          this.cancelEdit();
          this.notificationService.success('Succès', 'Utilisateur modifié avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          const errorMessage = error.error || 'Impossible de modifier l\'utilisateur';
          this.notificationService.error('Erreur', errorMessage);
        }
      });
    } else {
      console.log('Création d\'un nouvel utilisateur');
      this.userService.createUser(this.currentUser).subscribe({
        next: (response) => {
          console.log('Utilisateur créé avec succès:', response);
          this.loadUsers();
          this.cancelEdit();
          this.notificationService.success('Succès', 'Utilisateur créé avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          const errorMessage = error.error || 'Impossible de créer l\'utilisateur';
          this.notificationService.error('Erreur', errorMessage);
        }
      });
    }
  }

  editUser(user: User): void {
    this.currentUser = { ...user };
    this.editingUser = true;
    this.showAddForm = true;
  }

  deleteUser(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.loadUsers();
          this.notificationService.success('Succès', 'Utilisateur supprimé avec succès');
        },
        error: () => {
          this.notificationService.error('Erreur', 'Impossible de supprimer l\'utilisateur');
        }
      });
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'MEDECIN': return 'Médecin';
      case 'SECRETAIRE': return 'Secrétaire';
      default: return role;
    }
  }

  cancelEdit(): void {
    this.currentUser = this.initUser();
    this.editingUser = false;
    this.showAddForm = false;
  }


}