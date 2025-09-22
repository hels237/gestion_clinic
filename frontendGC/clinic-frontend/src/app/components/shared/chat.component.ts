import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-overlay" *ngIf="isVisible" (click)="close()"></div>
    <div class="chat-container" *ngIf="isVisible" (click)="$event.stopPropagation()">
      <div class="chat-header">
        <h4>💬 Chat avec {{ otherUser?.prenom }} {{ otherUser?.nom }}</h4>
        <button (click)="close()" class="close-btn">✕</button>
      </div>
      
      <div class="chat-messages" #messagesContainer>
        <div *ngFor="let message of messages" 
             class="message" 
             [class.own-message]="message.senderId === currentUser?.id"
             [class.other-message]="message.senderId !== currentUser?.id">
          <div class="message-content">{{ message.content }}</div>
          <div class="message-time">{{ message.timestamp | date:'HH:mm' }}</div>
        </div>
        <div *ngIf="messages.length === 0" class="no-messages">
          Aucun message. Commencez la conversation !
        </div>
      </div>
      
      <div class="chat-input">
        <input [(ngModel)]="newMessage" 
               (keyup.enter)="sendMessage()" 
               placeholder="Tapez votre message..."
               class="message-input">
        <button (click)="sendMessage()" 
                [disabled]="!newMessage.trim()" 
                class="send-btn">Envoyer</button>
      </div>
    </div>
  `,
  styles: [`
    .chat-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.3);
      z-index: 998;
    }
    .chat-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      z-index: 999;
      display: flex;
      flex-direction: column;
    }
    .chat-header {
      padding: 1rem;
      background: #007bff;
      color: white;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .chat-header h4 {
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
    .chat-messages {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .message {
      max-width: 80%;
      padding: 0.75rem;
      border-radius: 12px;
      word-wrap: break-word;
    }
    .own-message {
      align-self: flex-end;
      background: #007bff;
      color: white;
    }
    .other-message {
      align-self: flex-start;
      background: #f1f3f4;
      color: #333;
    }
    .message-content {
      margin-bottom: 0.25rem;
    }
    .message-time {
      font-size: 0.7rem;
      opacity: 0.7;
    }
    .no-messages {
      text-align: center;
      color: #666;
      font-style: italic;
      margin-top: 2rem;
    }
    .chat-input {
      padding: 1rem;
      border-top: 1px solid #eee;
      display: flex;
      gap: 0.5rem;
    }
    .message-input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 20px;
      outline: none;
    }
    .send-btn {
      padding: 0.75rem 1.5rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
    }
    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class ChatComponent implements OnInit {
  @Input() isVisible = false;
  @Input() otherUser: User | null = null;
  @Output() closed = new EventEmitter<void>();

  messages: ChatMessage[] = [];
  newMessage = '';
  currentUser: User | null = null;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.chatService.messages$.subscribe(messages => {
      this.messages = messages;
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  ngOnChanges(): void {
    if (this.isVisible && this.otherUser) {
      this.loadConversation();
      this.markAsRead();
    }
  }

  loadConversation(): void {
    if (this.otherUser?.id) {
      this.chatService.loadConversation(this.otherUser.id);
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.otherUser?.id) return;

    this.chatService.sendMessage({
      receiverId: this.otherUser.id,
      content: this.newMessage.trim()
    });

    this.newMessage = '';
  }

  markAsRead(): void {
    if (this.otherUser?.id) {
      this.chatService.markAsRead(this.otherUser.id);
    }
  }

  close(): void {
    this.isVisible = false;
    this.closed.emit();
  }

  private scrollToBottom(): void {
    const container = document.querySelector('.chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}