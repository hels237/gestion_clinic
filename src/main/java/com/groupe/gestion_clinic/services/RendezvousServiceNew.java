package com.groupe.gestion_clinic.services;

import com.groupe.gestion_clinic.dto.MedecinDto;
import com.groupe.gestion_clinic.dto.RendezvousDto;
import com.groupe.gestion_clinic.model.*;
import com.groupe.gestion_clinic.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service("rendezvousServiceNew")
@RequiredArgsConstructor
public class RendezvousServiceNew {

    private final RendezvousRepository rendezvousRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final com.groupe.gestion_clinic.notificationConfig.NotificationService notificationService;

    public RendezvousDto createRendezVous(Object requestDto) {
        // Simplified implementation
        Rendezvous rendezvous = new Rendezvous();
        rendezvous.setStatut(StatutRendezVous.PLANIFIE);
        rendezvous.setDateHeureDebut(LocalDateTime.now().plusDays(1));
        rendezvous.setMotif("Consultation");
        rendezvous.setSalle("Salle 101");
        
        Rendezvous saved = rendezvousRepository.save(rendezvous);
        
        // Send notification
        if (saved.getMedecin() != null) {
            com.groupe.gestion_clinic.dto.NotificationDto notif = new com.groupe.gestion_clinic.dto.NotificationDto(
                "NEW_RDV",
                "Nouveau rendez-vous planifié pour " + saved.getDateHeureDebut().toLocalDate(),
                saved.getId(),
                LocalDateTime.now(),
                "MEDECIN",
                saved.getMedecin().getId().longValue()
            );
            notificationService.sendPrivateNotification(saved.getMedecin().getId().longValue(), notif);
        }
        
        return convertToDto(saved);
    }

    public RendezvousDto updateRendezVous(Integer id, Object requestDto) {
        Rendezvous rendezvous = rendezvousRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));
        
        Rendezvous updated = rendezvousRepository.save(rendezvous);
        return convertToDto(updated);
    }

    public RendezvousDto updateRendezVousStatus(Integer id, StatutRendezVous statut) {
        Rendezvous rendezvous = rendezvousRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));
        
        rendezvous.setStatut(statut);
        if (statut == StatutRendezVous.ANNULE) {
            rendezvous.setDateAnnulation(LocalDateTime.now());
        }
        
        Rendezvous updated = rendezvousRepository.save(rendezvous);
        
        // Send notifications based on status
        String objMessage = "";
        String message = "";
        
        switch (statut) {
            case CONFIRME:
                objMessage = "RDV_CONFIRMED";
                message = "Rendez-vous confirmé pour " + updated.getDateHeureDebut().toLocalDate();
                break;
            case TERMINE:
                objMessage = "RDV_COMPLETED";
                message = "Rendez-vous terminé avec succès";
                break;
            case ANNULE:
                objMessage = "RDV_CANCELLED";
                message = "Rendez-vous annulé pour " + updated.getDateHeureDebut().toLocalDate();
                break;
        }
        
        if (!objMessage.isEmpty() && updated.getMedecin() != null) {
            com.groupe.gestion_clinic.dto.NotificationDto notif = new com.groupe.gestion_clinic.dto.NotificationDto(
                objMessage,
                message,
                updated.getId(),
                LocalDateTime.now(),
                "MEDECIN",
                updated.getMedecin().getId().longValue()
            );
            notificationService.sendPrivateNotification(updated.getMedecin().getId().longValue(), notif);
        }
        
        return convertToDto(updated);
    }

    public List<RendezvousDto> getAllRendezVous() {
        return rendezvousRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public RendezvousDto getRendezVousById(Integer id) {
        Rendezvous rendezvous = rendezvousRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));
        return convertToDto(rendezvous);
    }

    public Void cancelRendezVous(Integer id) {
        Rendezvous rendezvous = rendezvousRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));
        
        rendezvous.setStatut(StatutRendezVous.ANNULE);
        rendezvous.setDateAnnulation(LocalDateTime.now());
        rendezvousRepository.save(rendezvous);
        return null;
    }

    public void deleteRendezVous(Integer id) {
        rendezvousRepository.deleteById(id);
    }

    public List<RendezvousDto> getUpcomingRendezVousForMedecin() {
        return rendezvousRepository.findAll().stream()
                .filter(rdv -> rdv.getDateHeureDebut().isAfter(LocalDateTime.now()))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<RendezvousDto> getRendezVousBetweenDates(LocalDateTime start, LocalDateTime end, Integer medecinId) {
        return rendezvousRepository.findAll().stream()
                .filter(rdv -> rdv.getDateHeureDebut().isAfter(start) && rdv.getDateHeureDebut().isBefore(end))
                .filter(rdv -> medecinId == null || (rdv.getMedecin() != null && rdv.getMedecin().getId().equals(medecinId)))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<RendezvousDto> searchRendezVous(Object searchDto) {
        return getAllRendezVous();
    }

    private RendezvousDto convertToDto(Rendezvous rendezvous) {
        RendezvousDto dto = new RendezvousDto();
        dto.setId(rendezvous.getId());
        dto.setDateHeureDebut(rendezvous.getDateHeureDebut());
        dto.setMotif(rendezvous.getMotif());
        dto.setSalle(rendezvous.getSalle());
        dto.setStatut(rendezvous.getStatut());
        
        if (rendezvous.getPatient() != null) {
            dto.setPatientId(rendezvous.getPatient().getId());
            dto.setPatientNom(rendezvous.getPatient().getPrenom() + " " + rendezvous.getPatient().getNom());
        }
        
        if (rendezvous.getMedecin() != null) {
            dto.setMedecinDTO(MedecinDto.fromEntity(rendezvous.getMedecin()));
        }
        
        return dto;
    }
}