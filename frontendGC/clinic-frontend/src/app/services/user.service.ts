import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<User[]>(`${this.baseUrl}/users`, { headers });
  }

  getMedecins(): Observable<User[]> {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<User[]>(`${this.baseUrl}/medecins`, { headers });
  }

  getSecretaires(): Observable<User[]> {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<User[]>(`${this.baseUrl}/secretaires`, { headers });
  }
}