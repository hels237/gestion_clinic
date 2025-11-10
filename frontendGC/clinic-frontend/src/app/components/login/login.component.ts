import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>Connexion - Gestion Clinique</h2>
        <form (ngSubmit)="onLogin()" #loginForm="ngForm">
          <div class="form-group">
            <label for="email">Email:</label>
            <input 
              type="email" 
              id="email" 
              [(ngModel)]="credentials.email" 
              name="email" 
              required 
              autocomplete="email"
              class="form-control">
          </div>
          <div class="form-group">
            <label for="password">Mot de passe:</label>
            <div class="password-input-container">
              <input 
                [type]="showPassword ? 'text' : 'password'" 
                id="password" 
                [(ngModel)]="credentials.password" 
                name="password" 
                required 
                autocomplete="current-password"
                class="form-control">
              <button 
                type="button" 
                class="password-toggle" 
                (click)="showPassword = !showPassword">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
          <button type="submit" [disabled]="!loginForm.valid || loading" class="btn-primary">
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
          <div *ngIf="error" class="error-message">{{ error }}</div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), 
                  url('https://mydoctorsclinicsurfers.com.au/wp-content/uploads/2025/03/Medical-Clinic-Staff-and-Roles.jpg') center/cover;
      position: relative;
    }
    .login-card {
      background: rgba(255, 255, 255, 0.95);
      padding: 2.5rem;
      border-radius: 15px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      width: 100%;
      max-width: 420px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    }
    h2 {
      text-align: center;
      color: #2c3e50;
      margin-bottom: 2rem;
      font-size: 1.8rem;
      font-weight: 600;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #34495e;
    }
    .form-control {
      width: 100%;
      padding: 1rem;
      border: 2px solid #e0e6ed;
      border-radius: 8px;
      box-sizing: border-box;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }
    .form-control:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
    .btn-primary {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1.1rem;
      font-weight: 600;
      transition: all 0.3s ease;
      margin-top: 1rem;
    }
    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #2980b9, #21618c);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }
    .btn-primary:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
      transform: none;
    }
    .error-message {
      color: #e74c3c;
      margin-top: 1rem;
      text-align: center;
      padding: 0.75rem;
      background: rgba(231, 76, 60, 0.1);
      border-radius: 6px;
      border-left: 4px solid #e74c3c;
    }
    .password-input-container {
      position: relative;
      display: flex;
      align-items: center;
    }
    .password-toggle {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0;
      z-index: 1;
    }
    .password-toggle:hover {
      opacity: 0.7;
    }
  `]
})
export class LoginComponent {
  credentials: LoginRequest = { email: '', password: '' };
  loading = false;
  error = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin(): void {
    this.loading = true;
    this.error = '';
    
    this.authService.login(this.credentials).subscribe({
      next: () => {
        // Attendre que l'utilisateur soit chargé puis rediriger selon le rôle
        this.authService.currentUser$.subscribe(user => {
          if (user) {
            switch (user.role) {
              case 'ADMIN':
                this.router.navigate(['/dashboard']);
                break;
              case 'MEDECIN':
                this.router.navigate(['/medecin']);
                break;
              case 'SECRETAIRE':
                this.router.navigate(['/secretaire']);
                break;
              default:
                this.router.navigate(['/dashboard']);
            }
          }
        });
      },
      error: (err) => {
        this.error = 'Identifiants invalides';
        this.loading = false;
      }
    });
  }
}