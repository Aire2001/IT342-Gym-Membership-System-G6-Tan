package edu.cit.tan.GymMembershipPaymentSystem.controller;

import edu.cit.tan.GymMembershipPaymentSystem.dto.ApiResponse;
import edu.cit.tan.GymMembershipPaymentSystem.dto.MembershipDTO;
import edu.cit.tan.GymMembershipPaymentSystem.entity.Membership;
import edu.cit.tan.GymMembershipPaymentSystem.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/memberships")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class MembershipController {

    @Autowired
    private MembershipRepository membershipRepository;

    @GetMapping
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

    // ── Admin CRUD ────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MembershipDTO>> createMembership(@RequestBody Map<String, Object> body) {
        try {
            Membership m = new Membership();
            m.setName((String) body.get("name"));
            m.setDurationMonths(Integer.parseInt(body.get("durationMonths").toString()));
            m.setPrice(new BigDecimal(body.get("price").toString()));
            m.setDescription((String) body.get("description"));
            m.setCreatedAt(LocalDateTime.now());
            Membership saved = membershipRepository.save(m);
            return ResponseEntity.ok(ApiResponse.success(
                new MembershipDTO(saved.getId(), saved.getName(), saved.getDurationMonths(), saved.getPrice(), saved.getDescription())
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ERR-001", e.getMessage(), null));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MembershipDTO>> updateMembership(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Membership m = membershipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));
            if (body.get("name") != null) m.setName((String) body.get("name"));
            if (body.get("durationMonths") != null) m.setDurationMonths(Integer.parseInt(body.get("durationMonths").toString()));
            if (body.get("price") != null) m.setPrice(new BigDecimal(body.get("price").toString()));
            if (body.get("description") != null) m.setDescription((String) body.get("description"));
            Membership saved = membershipRepository.save(m);
            return ResponseEntity.ok(ApiResponse.success(
                new MembershipDTO(saved.getId(), saved.getName(), saved.getDurationMonths(), saved.getPrice(), saved.getDescription())
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ERR-001", e.getMessage(), null));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteMembership(@PathVariable Long id) {
        try {
            membershipRepository.deleteById(id);
            return ResponseEntity.ok(ApiResponse.success("Membership plan deleted."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ERR-001", e.getMessage(), null));
        }
    }

    @GetMapping("/{id}")
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
                    null
            );
        }
    }
}