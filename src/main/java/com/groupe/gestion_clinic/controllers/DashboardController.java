package com.groupe.gestion_clinic.controllers;

import com.groupe.gestion_clinic.repositories.PatientRepository;
import com.groupe.gestion_clinic.repositories.MedecinRepository;
import com.groupe.gestion_clinic.repositories.RendezvousRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final RendezvousRepository rendezVousRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // Statistiques de base
            stats.put("totalPatients", patientRepository.count());
            stats.put("totalMedecins", medecinRepository.count());
            stats.put("totalRendezVous", rendezVousRepository.count());
            
            // Rendez-vous d'aujourd'hui
            java.time.LocalDate today = java.time.LocalDate.now();
            long rdvAujourdhui = rendezVousRepository.findAll().stream()
                .filter(rdv -> rdv.getDateHeureDebut() != null && 
                              rdv.getDateHeureDebut().toLocalDate().equals(today))
                .count();
            stats.put("rendezVousAujourdhui", rdvAujourdhui);
            
            // Rendez-vous en attente (statut PLANIFIE)
            long rdvEnAttente = rendezVousRepository.findAll().stream()
                .filter(rdv -> rdv.getStatut() != null && 
                              rdv.getStatut().name().equals("PLANIFIE"))
                .count();
            stats.put("rendezVousEnAttente", rdvEnAttente);
            
        } catch (Exception e) {
            // Valeurs par défaut en cas d'erreur
            stats.put("totalPatients", 0L);
            stats.put("totalMedecins", 0L);
            stats.put("totalRendezVous", 0L);
            stats.put("rendezVousAujourdhui", 0L);
            stats.put("rendezVousEnAttente", 0L);
        }
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/recent-rendezvous")
    public ResponseEntity<?> getRecentRendezVous() {
        try {
            // Récupérer les 5 derniers rendez-vous
            java.util.List<java.util.Map<String, Object>> recentRdv = rendezVousRepository.findAll().stream()
                .filter(rdv -> rdv.getDateHeureDebut() != null)
                .sorted((a, b) -> b.getDateHeureDebut().compareTo(a.getDateHeureDebut()))
                .limit(5)
                .map(rdv -> {
                    Map<String, Object> rdvMap = new HashMap<>();
                    rdvMap.put("id", rdv.getId());
                    rdvMap.put("dateHeure", rdv.getDateHeureDebut().toString());
                    rdvMap.put("motif", rdv.getMotif());
                    rdvMap.put("statut", rdv.getStatut() != null ? rdv.getStatut().name() : "PLANIFIE");
                    
                    if (rdv.getPatient() != null) {
                        Map<String, Object> patient = new HashMap<>();
                        patient.put("nom", rdv.getPatient().getNom());
                        patient.put("prenom", rdv.getPatient().getPrenom());
                        rdvMap.put("patient", patient);
                    }
                    
                    if (rdv.getMedecin() != null) {
                        Map<String, Object> medecin = new HashMap<>();
                        medecin.put("nom", rdv.getMedecin().getNom());
                        medecin.put("prenom", rdv.getMedecin().getPrenom());
                        rdvMap.put("medecin", medecin);
                    }
                    
                    return rdvMap;
                })
                .collect(java.util.stream.Collectors.toList());
                
            return ResponseEntity.ok(recentRdv);
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
}