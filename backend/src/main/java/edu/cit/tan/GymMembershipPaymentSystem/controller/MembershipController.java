package edu.cit.tan.GymMembershipPaymentSystem.controller;

import edu.cit.tan.GymMembershipPaymentSystem.dto.ApiResponse;
import edu.cit.tan.GymMembershipPaymentSystem.dto.MembershipDTO;
import edu.cit.tan.GymMembershipPaymentSystem.entity.Membership;
import edu.cit.tan.GymMembershipPaymentSystem.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/memberships")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"})
public class MembershipController {

    @Autowired
    private MembershipRepository membershipRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<List<MembershipDTO>> getAllMemberships() {
        try {
            List<Membership> memberships = membershipRepository.findAll();

            List<MembershipDTO> dtos = memberships.stream()
                    .map(m -> new MembershipDTO(
                            m.getId(),
                            m.getName(),
                            m.getDurationMonths(),
                            m.getPrice(),
                            m.getDescription()
                    ))
                    .collect(Collectors.toList());

            return ApiResponse.success(dtos);
        } catch (Exception e) {
            return ApiResponse.error(
                    "DB-001",
                    "Error fetching memberships: " + e.getMessage(),
                    null
            );
        }
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ApiResponse<MembershipDTO> getMembership(@PathVariable Long id) {
        try {
            Membership membership = membershipRepository.findById(id)
                    .orElse(null);

            if (membership == null) {
                return ApiResponse.error(
                        "DB-001",
                        "Membership not found with id: " + id,
                        null
                );
            }

            MembershipDTO dto = new MembershipDTO(
                    membership.getId(),
                    membership.getName(),
                    membership.getDurationMonths(),
                    membership.getPrice(),
                    membership.getDescription()
            );

            return ApiResponse.success(dto);

        } catch (Exception e) {
            return ApiResponse.error(
                    "DB-001",
                    "Error fetching membership: " + e.getMessage(),
                    e.getCause() != null ? e.getCause().getMessage() : e.getMessage()
            );
        }
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<MembershipDTO>> createMembership(@RequestBody MembershipDTO membershipDTO) {
        try {
            Membership membership = new Membership(
                    membershipDTO.getName(),
                    membershipDTO.getDurationMonths(),
                    membershipDTO.getPrice(),
                    membershipDTO.getDescription()
            );
            Membership savedMembership = membershipRepository.save(membership);

            MembershipDTO dto = new MembershipDTO(
                    savedMembership.getId(),
                    savedMembership.getName(),
                    savedMembership.getDurationMonths(),
                    savedMembership.getPrice(),
                    savedMembership.getDescription()
            );
            return ResponseEntity.ok(ApiResponse.success(dto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("DB-001", "Error creating membership: " + e.getMessage(), null));
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<MembershipDTO>> updateMembership(@PathVariable Long id, @RequestBody MembershipDTO membershipDTO) {
        try {
            Membership membership = membershipRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Membership not found with id: " + id));

            membership.setName(membershipDTO.getName());
            membership.setDurationMonths(membershipDTO.getDurationMonths());
            membership.setPrice(membershipDTO.getPrice());
            membership.setDescription(membershipDTO.getDescription());

            Membership updated = membershipRepository.save(membership);
            MembershipDTO dto = new MembershipDTO(
                    updated.getId(),
                    updated.getName(),
                    updated.getDurationMonths(),
                    updated.getPrice(),
                    updated.getDescription()
            );
            return ResponseEntity.ok(ApiResponse.success(dto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("DB-001", "Error updating membership: " + e.getMessage(), null));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<String>> deleteMembership(@PathVariable Long id) {
        try {
            if (!membershipRepository.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("DB-001", "Membership not found with id: " + id, null));
            }
            membershipRepository.deleteById(id);
            return ResponseEntity.ok(ApiResponse.success("Membership deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("DB-001", "Error deleting membership: " + e.getMessage(), null));
        }
    }
}
