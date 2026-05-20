package edu.cit.tan.GymMembershipPaymentSystem.feature.profile;

import edu.cit.tan.GymMembershipPaymentSystem.shared.dto.ApiResponse;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/profile")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile() {
        try {
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("email", user.getEmail());
            data.put("firstname", user.getFirstname());
            data.put("lastname", user.getLastname());
            data.put("role", user.getRole().toString());
            data.put("profilePicture", user.getProfilePicture());
            data.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
            data.put("isOAuthUser", user.getPasswordHash() != null && user.getPasswordHash().startsWith("OAUTH_"));

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("ERR-001", e.getMessage(), null));
        }
    }

    @PutMapping
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @RequestBody Map<String, String> request) {
        try {
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String firstname = request.get("firstname");
            String lastname = request.get("lastname");
            String profilePicture = request.get("profilePicture");

            if (firstname != null && !firstname.isBlank()) user.setFirstname(firstname.trim());
            if (lastname != null && !lastname.isBlank()) user.setLastname(lastname.trim());
            if (profilePicture != null) user.setProfilePicture(profilePicture);

            userRepository.save(user);

            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("email", user.getEmail());
            data.put("firstname", user.getFirstname());
            data.put("lastname", user.getLastname());
            data.put("role", user.getRole().toString());
            data.put("profilePicture", user.getProfilePicture());

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("ERR-001", e.getMessage(), null));
        }
    }

    @PostMapping("/change-password")
    @Transactional
    public ResponseEntity<ApiResponse<?>> changePassword(@RequestBody Map<String, String> request) {
        try {
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getPasswordHash() != null && user.getPasswordHash().startsWith("OAUTH_")) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("OAUTH-001", "You signed in with Google. Use 'Set Password' to create a password first.", null));
            }

            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");
            String confirmPassword = request.get("confirmPassword");

            if (currentPassword == null || newPassword == null || confirmPassword == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "All password fields are required", null));
            }
            if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("AUTH-001", "Current password is incorrect", null));
            }
            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-002", "New password must be at least 6 characters", null));
            }
            if (!newPassword.equals(confirmPassword)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-003", "New passwords do not match", null));
            }

            user.setPasswordHash(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("ERR-001", e.getMessage(), null));
        }
    }

    @PostMapping("/set-password")
    @Transactional
    public ResponseEntity<ApiResponse<?>> setPassword(@RequestBody Map<String, String> request) {
        try {
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getPasswordHash() == null || !user.getPasswordHash().startsWith("OAUTH_")) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "You already have a password. Use Change Password instead.", null));
            }

            String newPassword = request.get("newPassword");
            String confirmPassword = request.get("confirmPassword");

            if (newPassword == null || newPassword.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-002", "Password is required.", null));
            }
            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-003", "Password must be at least 6 characters.", null));
            }
            if (!newPassword.equals(confirmPassword)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-004", "Passwords do not match.", null));
            }

            user.setPasswordHash(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            return ResponseEntity.ok(ApiResponse.success("Password set successfully. You can now log in with email and password."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("ERR-001", e.getMessage(), null));
        }
    }

    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPreferences() {
        try {
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow(() -> new RuntimeException("User not found"));
            Map<String, Object> data = new HashMap<>();
            data.put("notifEmail", user.isNotifEmail());
            data.put("notifPaymentReminders", user.isNotifPaymentReminders());
            data.put("notifMembershipAlerts", user.isNotifMembershipAlerts());
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("ERR-001", e.getMessage(), null));
        }
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<Map<String, Object>>> savePreferences(@RequestBody Map<String, Boolean> request) {
        try {
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow(() -> new RuntimeException("User not found"));
            if (request.containsKey("notifEmail")) user.setNotifEmail(request.get("notifEmail"));
            if (request.containsKey("notifPaymentReminders")) user.setNotifPaymentReminders(request.get("notifPaymentReminders"));
            if (request.containsKey("notifMembershipAlerts")) user.setNotifMembershipAlerts(request.get("notifMembershipAlerts"));
            userRepository.save(user);
            Map<String, Object> data = new HashMap<>();
            data.put("notifEmail", user.isNotifEmail());
            data.put("notifPaymentReminders", user.isNotifPaymentReminders());
            data.put("notifMembershipAlerts", user.isNotifMembershipAlerts());
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("ERR-001", e.getMessage(), null));
        }
    }

    @PostMapping("/upload-photo")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadPhoto(
            @RequestParam("photo") MultipartFile file) {
        try {
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "File is empty", null));
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-002", "Only image files are allowed", null));
            }

            Path uploadPath = Paths.get("uploads/profile-photos/");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
            if (ext == null || ext.isBlank()) ext = "jpg";
            String filename = user.getId() + "." + ext.toLowerCase();
            Path dest = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            String photoUrl = "/uploads/profile-photos/" + filename;
            user.setProfilePicture(photoUrl);
            userRepository.save(user);

            Map<String, Object> data = new HashMap<>();
            data.put("profilePicture", photoUrl);

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("ERR-002", "File upload failed: " + e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("ERR-001", e.getMessage(), null));
        }
    }

    @PutMapping("/email")
    @Transactional
    public ResponseEntity<ApiResponse<?>> changeEmail(@RequestBody Map<String, String> request) {
        try {
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getPasswordHash() != null && user.getPasswordHash().startsWith("OAUTH_")) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("OAUTH-001", "Your email is managed by Google and cannot be changed here.", null));
            }

            String newEmail = request.get("newEmail");
            String password = request.get("password");

            if (newEmail == null || newEmail.isBlank() || password == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "Email and password are required", null));
            }
            if (!newEmail.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-002", "Invalid email format", null));
            }
            if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("AUTH-001", "Password is incorrect", null));
            }
            if (userRepository.findByEmail(newEmail).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-003", "Email is already in use", null));
            }

            user.setEmail(newEmail);
            userRepository.save(user);

            return ResponseEntity.ok(ApiResponse.success("Email updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("ERR-001", e.getMessage(), null));
        }
    }
}
