package edu.cit.tan.GymMembershipPaymentSystem.feature.user;

import edu.cit.tan.GymMembershipPaymentSystem.shared.dto.ApiResponse;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.UserMembership;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.UserRepository;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.UserMembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/user")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserMembershipRepository userMembershipRepository;

    /**
     * Get the current logged-in user's active membership
     */
    @GetMapping("/membership")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentMembership() {
        try {
            System.out.println("🎫 Fetching current user membership...");

            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Optional<UserMembership> activeMembership = userMembershipRepository.findByUserAndStatus(user, "Active");

            if (activeMembership.isEmpty()) {
                System.out.println("⚠️ No active membership for user: " + user.getEmail());
                return ResponseEntity.ok(ApiResponse.success(null));
            }

            UserMembership um = activeMembership.get();
            Map<String, Object> data = new HashMap<>();
            data.put("id", um.getId());
            data.put("userId", user.getId());
            data.put("membershipId", um.getMembership().getId());
            data.put("startDate", um.getStartDate().toString());
            data.put("endDate", um.getEndDate().toString());
            data.put("status", um.getStatus());
            data.put("membership", Map.of(
                    "id", um.getMembership().getId(),
                    "name", um.getMembership().getName(),
                    "durationMonths", um.getMembership().getDurationMonths(),
                    "price", um.getMembership().getPrice(),
                    "description", um.getMembership().getDescription()
            ));

            System.out.println("✅ Active membership found: " + um.getMembership().getName() + 
                               " - Expires: " + um.getEndDate());

            return ResponseEntity.ok(ApiResponse.success(data));

        } catch (Exception e) {
            System.err.println("❌ Error fetching user membership: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("DB-001", "Error fetching membership: " + e.getMessage(), null));
        }
    }

    /**
     * Get current user's profile
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile() {
        try {
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("email", user.getEmail());
            profile.put("firstname", user.getFirstname());
            profile.put("lastname", user.getLastname());
            profile.put("role", user.getRole().toString());

            return ResponseEntity.ok(ApiResponse.success(profile));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("DB-001", "Error fetching profile: " + e.getMessage(), null));
        }
    }

    /**
     * Select/assign a membership plan (after payment)
     */
    @PostMapping("/membership/select")
    public ResponseEntity<ApiResponse<Map<String, Object>>> selectMembership(@RequestBody Map<String, Object> request) {
        try {
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Please use the payment endpoint /api/v1/payments to acquire a membership");
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("DB-001", "Error: " + e.getMessage(), null));
        }
    }
}
