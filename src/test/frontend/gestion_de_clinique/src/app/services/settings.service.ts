import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, of } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  avatar?: string;
  lastLogin: string;
  isActive: boolean;
}

export interface SecuritySettings {
  requirePasswordChange: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  twoFactorEnabled: boolean;
  passwordExpiryDays: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  systemAlerts: boolean;
  marketingEmails: boolean;
}

export interface SystemSettings {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  timezone: string;
  language: string;
  currency: string;
  dateFormat: string;
  backupFrequency: string;
  maintenanceMode: boolean;
}

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: string;
  backupRetention: number;
  lastBackup: string;
  nextBackup: string;
  backupLocation: string;
}

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  darkMode: boolean;
  compactMode: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = `${API_CONFIG.BASE_URL}/api`;

  constructor(private http: HttpClient) {}

  // Récupérer le profil utilisateur
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/settings/profile`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement du profil:', error);
          return of(this.getDemoUserProfile());
        })
      );
  }

  // Mettre à jour le profil utilisateur
  updateUserProfile(profile: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiUrl}/settings/profile`, profile)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la mise à jour du profil:', error);
          throw error;
        })
      );
  }

  // Changer le mot de passe
  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/settings/change-password`, {
      oldPassword,
      newPassword
    });
  }

  // Récupérer les paramètres de sécurité
  getSecuritySettings(): Observable<SecuritySettings> {
    return this.http.get<SecuritySettings>(`${this.apiUrl}/settings/security`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des paramètres de sécurité:', error);
          return of(this.getDemoSecuritySettings());
        })
      );
  }

  // Mettre à jour les paramètres de sécurité
  updateSecuritySettings(settings: Partial<SecuritySettings>): Observable<SecuritySettings> {
    return this.http.patch<SecuritySettings>(`${this.apiUrl}/settings/security`, settings);
  }

  // Récupérer les paramètres de notification
  getNotificationSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${this.apiUrl}/settings/notifications`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des paramètres de notification:', error);
          return of(this.getDemoNotificationSettings());
        })
      );
  }

  // Mettre à jour les paramètres de notification
  updateNotificationSettings(settings: Partial<NotificationSettings>): Observable<NotificationSettings> {
    return this.http.patch<NotificationSettings>(`${this.apiUrl}/settings/notifications`, settings);
  }

  // Récupérer les paramètres système
  getSystemSettings(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(`${this.apiUrl}/settings/system`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des paramètres système:', error);
          return of(this.getDemoSystemSettings());
        })
      );
  }

  // Mettre à jour les paramètres système
  updateSystemSettings(settings: Partial<SystemSettings>): Observable<SystemSettings> {
    return this.http.patch<SystemSettings>(`${this.apiUrl}/settings/system`, settings);
  }

  // Récupérer les paramètres de sauvegarde
  getBackupSettings(): Observable<BackupSettings> {
    return this.http.get<BackupSettings>(`${this.apiUrl}/settings/backup`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des paramètres de sauvegarde:', error);
          return of(this.getDemoBackupSettings());
        })
      );
  }

  // Mettre à jour les paramètres de sauvegarde
  updateBackupSettings(settings: Partial<BackupSettings>): Observable<BackupSettings> {
    return this.http.patch<BackupSettings>(`${this.apiUrl}/settings/backup`, settings);
  }

  // Récupérer les paramètres de thème
  getThemeSettings(): Observable<ThemeSettings> {
    return this.http.get<ThemeSettings>(`${this.apiUrl}/settings/theme`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des paramètres de thème:', error);
          return of(this.getDemoThemeSettings());
        })
      );
  }

  // Mettre à jour les paramètres de thème
  updateThemeSettings(settings: Partial<ThemeSettings>): Observable<ThemeSettings> {
    return this.http.patch<ThemeSettings>(`${this.apiUrl}/settings/theme`, settings);
  }

  // Exporter les paramètres
  exportSettings(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/settings/export`, { responseType: 'blob' });
  }

  // Importer les paramètres
  importSettings(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('settings', file);
    return this.http.post(`${this.apiUrl}/settings/import`, formData);
  }

  // Données de démonstration
  private getDemoUserProfile(): UserProfile {
    return {
      id: '1',
      username: 'admin',
      email: 'admin@gmail.com',
      fullName: 'Mr Kamdem',
      role: 'admin',
      avatar: '👨‍💻',
      lastLogin: 'Il y a 2h',
      isActive: true
    };
  }

  private getDemoSecuritySettings(): SecuritySettings {
    return {
      requirePasswordChange: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      twoFactorEnabled: false,
      passwordExpiryDays: 90
    };
  }

  private getDemoNotificationSettings(): NotificationSettings {
    return {
      emailNotifications: true,
      smsNotifications: false,
      appointmentReminders: true,
      systemAlerts: true,
      marketingEmails: false
    };
  }

  private getDemoSystemSettings(): SystemSettings {
    return {
      clinicName: 'Bon Secours',
      clinicAddress: '123 Rue de la Santé, Douala, Cameroun',
      clinicPhone: '+237 123 456 789',
      clinicEmail: 'contact@bonsecours.cm',
      timezone: 'Africa/Douala',
      language: 'fr',
      currency: 'FCFA',
      dateFormat: 'DD/MM/YYYY',
      backupFrequency: 'daily',
      maintenanceMode: false
    };
  }

  private getDemoBackupSettings(): BackupSettings {
    return {
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30,
      lastBackup: 'Il y a 6h',
      nextBackup: 'Dans 18h',
      backupLocation: '/backups/'
    };
  }

  private getDemoThemeSettings(): ThemeSettings {
    return {
      primaryColor: '#1fa183',
      secondaryColor: '#2a80ec',
      darkMode: false,
      compactMode: false
    };
  }
} 