import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  totalPatients: number;
  totalMedecins: number;
  totalRendezVous: number;
  rendezVousAujourdhui: number;
  rendezVousEnAttente: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  getRecentRendezVous(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dashboard/recent-rendezvous`);
  }
}