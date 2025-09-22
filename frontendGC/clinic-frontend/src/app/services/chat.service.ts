import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WebSocketService } from './websocket.service';

export interface ChatMessage {
  id?: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatMessageRequest {
  receiverId: number;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'http://localhost:8080/api/chat';
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private unreadCountsSubject = new BehaviorSubject<Map<number, number>>(new Map());

  public messages$ = this.messagesSubject.asObservable();
  public unreadCounts$ = this.unreadCountsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private webSocketService: WebSocketService
  ) {
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners(): void {
    // Listen for incoming messages via WebSocket
    this.webSocketService.client?.subscribe('/user/queue/chat', (message) => {
      const chatMessage: ChatMessage = JSON.parse(message.body);
      this.addMessage(chatMessage);
      this.updateUnreadCounts();
    });
  }

  sendMessage(request: ChatMessageRequest): void {
    const token = localStorage.getItem('token');
    if (this.webSocketService.client?.connected) {
      this.webSocketService.client.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(request),
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  }

  getConversation(otherUserId: number): Observable<ChatMessage[]> {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/conversation/${otherUserId}`, { headers });
  }

  getUnreadMessages(): Observable<ChatMessage[]> {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/unread`, { headers });
  }

  getUnreadCounts(): Observable<Map<number, number>> {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<{[key: number]: number}>(`${this.baseUrl}/unread/counts`, { headers })
      .pipe(
        map(counts => new Map(Object.entries(counts).map(([k, v]) => [+k, v])))
      );
  }

  markAsRead(senderId: number): void {
    const token = localStorage.getItem('token');
    if (this.webSocketService.client?.connected) {
      this.webSocketService.client.publish({
        destination: '/app/chat.markAsRead',
        body: JSON.stringify({ senderId }),
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  }

  private addMessage(message: ChatMessage): void {
    const current = this.messagesSubject.value;
    this.messagesSubject.next([...current, message]);
  }

  private updateUnreadCounts(): void {
    this.getUnreadCounts().subscribe(counts => {
      this.unreadCountsSubject.next(counts);
    });
  }

  loadConversation(otherUserId: number): void {
    this.getConversation(otherUserId).subscribe(messages => {
      this.messagesSubject.next(messages);
    });
  }
}