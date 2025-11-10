// sidebar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RoleService } from '../../services/role.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

interface SidebarItem {
  label: string;
  icon?: string; 
  route: string;
  roles: string[]; 
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  role = '';
  private userSubscription?: Subscription;
  filteredMenuItems: SidebarItem[] = [];
  menu: SidebarItem[] = [
    // Admin
    { label: 'Tableau de Bord', icon: '📊', route: '/dashboard', roles: ['admin'] },
    { label: 'Gestion des utilisateurs', icon: '👥', route: '/users', roles: ['admin'] },
    { label: 'Rapports & Statistiques', icon: '📈', route: '/reports', roles: ['admin'] },
    { label: 'Paramètres', icon: '⚙️', route: '/settings', roles: ['admin'] },
    // Médecin
    { label: 'Tableau de Bord', icon: '🏥', route: '/dashboard-medecin', roles: ['medecin'] },
    { label: 'Patients', icon: '🧑‍🤝‍🧑', route: '/patients', roles: ['medecin'] },
    { label: 'Rendez-vous', icon: '📅', route: '/rendezvous', roles: ['medecin'] },
    { label: 'Prescription', icon: '💊', route: '/prescription', roles: ['medecin'] },
    { label: 'Calendrier', icon: '🗓️', route: '/calendar-rdv', roles: ['medecin'] },
    { label: 'Chat', icon: '💬', route: '/chat', roles: ['medecin'] },

    // Secrétaire
    { label: 'Tableau de Bord', icon: '📋', route: '/dashboard-secretaire', roles: ['secretaire'] },
    { label: 'Gestion des Patients', icon: '🧑‍🤝‍🧑', route: '/patients', roles: ['secretaire'] },
    { label: 'Gestion des Rendez-Vous', icon: '📅', route: '/rendezvous', roles: ['secretaire'] },
    { label: 'Calendrier', icon: '🗓️', route: '/calendar-rdv', roles: ['secretaire'] },
    { label: 'Chat', icon: '💬', route: '/chat', roles: ['secretaire'] },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private roleService: RoleService
  ) {}

  ngOnInit() {
    // S'abonner aux changements de l'utilisateur connecté
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      console.log('User changed:', user);
      this.role = user?.role || '';
      console.log('Current role:', this.role);
      this.updateFilteredMenu();
    });
  }

  ngOnDestroy() {
    // Se désabonner pour éviter les fuites mémoire
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private updateFilteredMenu() {
    console.log('Updating filtered menu for role:', this.role);
     const currentRole = this.role.toLowerCase();
    this.filteredMenuItems = this.menu.filter(item => {
      const hasRole = item.roles.includes(currentRole);
      console.log(`Item: ${item.label}, Roles: [${item.roles.join(',')}], Current role: '${currentRole}', Included: ${hasRole}`);
      return hasRole;
    });
    console.log('Total filtered items:', this.filteredMenuItems.length);
    console.log('Filtered items:', this.filteredMenuItems.map(item => item.label));
  }

  get filteredMenu(): SidebarItem[] {
    return this.filteredMenuItems;
  }

  getMenuLabels(): string {
    return this.filteredMenuItems.map(item => item.label).join(', ');
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
