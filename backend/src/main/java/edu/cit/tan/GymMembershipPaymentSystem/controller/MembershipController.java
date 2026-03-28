package edu.cit.tan.GymMembershipPaymentSystem.controller;

import edu.cit.tan.GymMembershipPaymentSystem.dto.ApiResponse;
import edu.cit.tan.GymMembershipPaymentSystem.dto.MembershipDTO;
import edu.cit.tan.GymMembershipPaymentSystem.entity.Membership;
import edu.cit.tan.GymMembershipPaymentSystem.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/memberships")
@CrossOrigin(origins = "http://localhost:5173")
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