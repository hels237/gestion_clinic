package com.groupe.gestion_clinic.controllers;

import com.groupe.gestion_clinic.dto.PatientDto;
import com.groupe.gestion_clinic.services.PatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Patient Management", description = "Operations related to Patient management")
@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "http://localhost:4203")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;


    @Operation(summary = "Create a new Patient", description = "Saves a new Patient entity")
    @PostMapping("/save")
    public ResponseEntity<PatientDto> savePatient( @RequestBody PatientDto patientDto) {
        return ResponseEntity.ok(patientService.createPatient(patientDto));
    }

    @Operation(summary = "Update an existing Patient", description = "Updates an existing Patient entity by ID")
    @PutMapping("/update/{patientId}")
    public ResponseEntity<PatientDto> updatePatient( @PathVariable Integer patientId, @RequestBody PatientDto patientDto) {
        return ResponseEntity.ok(patientService.updatePatient(patientId, patientDto));
    }

    @Operation(summary = "Find Patient by ID", description = "Retrieves a Patient entity by its ID")
    @GetMapping("/{patientId}")
    public ResponseEntity<PatientDto> updatePatient( @PathVariable Integer patientId) {
        return ResponseEntity.ok(patientService.findById(patientId));
    }

    @Operation(summary = "Find all Patients", description = "Retrieves a list of all Patient entities")
    @GetMapping("/all")
    public ResponseEntity<List<PatientDto>> findAllPatient(){
        return ResponseEntity.ok(patientService.findAll());
    }

    @Operation(summary = "Delete Patient by ID", description = "Deletes a Patient entity by its ID")
    @DeleteMapping("/{patientId}")
    public ResponseEntity<PatientDto> deletePatient(@PathVariable Integer patientId) {
        patientService.deletePatient(patientId);
        return ResponseEntity.noContent().build();
    }


}
