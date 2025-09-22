import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-chat-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="contacts-overlay" *ngIf="isVisible" (click)="close()"></div>
    <div class="contacts-container" *ngIf="isVisible" (click)="$event.stopPropagation()">
      <div class="contacts-header">
        <h4>💬 Messagerie</h4>
        <button (click)="close()" class="close-btn">✕</button>
      </div>
      
      <div class="contacts-search">
        <input [(ngModel)]="searchTerm" 
               (input)="filterContacts()" 
               placeholder="Rechercher un contact..."
               class="search-input">
      </div>
      
      <div class="contacts-list">
        <div *ngFor="let contact of filteredContacts" 
             class="contact-item" 
             (click)="selectContact(contact)">
          <div class="contact-avatar">
            <img *ngIf="contact.avatarUrl; else defaultAvatar" [src]="contact.avatarUrl" alt="Avatar">
            <ng-template #defaultAvatar>
              {{ contact.role === 'MEDECIN' ? '👨‍⚕️' : '👤' }}
            </ng-template>
          </div>
          <div class="contact-info">
            <div class="contact-name">{{ contact.prenom }} {{ contact.nom }}</div>
            <div class="contact-role">{{ getRoleDisplay(contact.role) }}</div>
          </div>
          <div class="unread-badge" *ngIf="getUnreadCount(contact.id) > 0">
            {{ getUnreadCount(contact.id) }}
          </div>
        </div>
        <div *ngIf="filteredContacts.length === 0" class="no-contacts">
          Aucun contact trouvé
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contacts-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.3);
      z-index: 996;
    }
    .contacts-container {
      position: fixed;
      top: 80px;
      right: 20px;
      width: 350px;
      max-height: 70vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      z-index: 997;
      overflow: hidden;
    }
    .contacts-header {
      padding: 1rem;
      background: #28a745;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .contacts-header h4 {
      margin: 0;
      font-size: 1rem;
    }
    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
    }
    .contacts-search {
      padding: 1rem;
      border-bottom: 1px solid #eee;
    }
    .search-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 20px;
      outline: none;
      box-sizing: border-box;
    }
    .contacts-list {
      max-height: 400px;
      overflow-y: auto;
    }
    .contact-item {
      padding: 1rem;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .contact-item:hover {
      background: #f8f9fa;
    }
    .contact-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e9ecef;
      font-size: 1.2rem;
    }
    .contact-avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
    .contact-info {
      flex: 1;
    }
    .contact-name {
      font-weight: bold;
      color: #333;
    }
    .contact-role {
      font-size: 0.8rem;
      color: #666;
    }
    .unread-badge {
      background: #dc3545;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: bold;
    }
    .no-contacts {
      padding: 2rem;
      text-align: center;
      color: #666;
    }
  `]
})
export class ChatContactsComponent implements OnInit {
  @Input() isVisible = false;
  @Output() closed = new EventEmitter<void>();
  @Output() contactSelected = new EventEmitter<User>();

  contacts: User[] = [];
  filteredContacts: User[] = [];
  searchTerm = '';
  unreadCounts = new Map<number, number>();
  currentUser: User | null = null;

  constructor(
    private userService: UserService,
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadContacts();
      }
    });

    this.chatService.unreadCounts$.subscribe(counts => {
      this.unreadCounts = counts;
    });
  }

  ngOnChanges(): void {
    if (this.isVisible) {
      this.loadContacts();
      this.loadUnreadCounts();
    }
  }

  loadContacts(): void {
    if (!this.currentUser) return;

    // Load different contacts based on user role
    if (this.currentUser.role === 'MEDECIN') {
      // Medecins can chat with secretaires and other medecins
      this.userService.getSecretaires().subscribe(secretaires => {
        this.userService.getMedecins().subscribe(medecins => {
          this.contacts = [...secretaires, ...medecins.filter(m => m.id !== this.currentUser?.id)];
          this.filteredContacts = this.contacts;
        });
      });
    } else if (this.currentUser.role === 'SECRETAIRE') {
      // Secretaires can chat with medecins and other secretaires
      this.userService.getMedecins().subscribe(medecins => {
        this.userService.getSecretaires().subscribe(secretaires => {
          this.contacts = [...medecins, ...secretaires.filter(s => s.id !== this.currentUser?.id)];
          this.filteredContacts = this.contacts;
        });
      });
    }
  }

  loadUnreadCounts(): void {
    this.chatService.getUnreadCounts().subscribe(counts => {
      this.unreadCounts = counts;
    });
  }

  filterContacts(): void {
    if (!this.searchTerm) {
      this.filteredContacts = this.contacts;
    } else {
      this.filteredContacts = this.contacts.filter(contact =>
        contact.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        contact.prenom.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  selectContact(contact: User): void {
    this.contactSelected.emit(contact);
    this.close();
  }

  getUnreadCount(userId: number): number {
    return this.unreadCounts.get(userId) || 0;
  }

  getRoleDisplay(role: string): string {
    switch (role) {
      case 'MEDECIN': return 'Médecin';
      case 'SECRETAIRE': return 'Secrétaire';
      case 'ADMIN': return 'Administrateur';
      default: return role;
    }
  }

  close(): void {
    this.isVisible = false;
    this.closed.emit();
  }
}