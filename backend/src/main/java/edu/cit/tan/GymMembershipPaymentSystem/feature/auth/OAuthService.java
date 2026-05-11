package edu.cit.tan.GymMembershipPaymentSystem.feature.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import edu.cit.tan.GymMembershipPaymentSystem.config.JwtUtils;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.AuthToken;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.UserRole;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.AuthTokenRepository;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID; // still used for OAuth password hash placeholder

@Service
public class OAuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthTokenRepository authTokenRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Value("${google.client.id:}")
    private String googleClientId;

    public Map<String, Object> googleLogin(String idTokenString) throws Exception {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new IllegalStateException("Google OAuth is not configured on this server.");
        }

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken = verifier.verify(idTokenString);
        if (idToken == null) {
            throw new IllegalArgumentException("Invalid Google ID token");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String firstName = payload.get("given_name") != null ? payload.get("given_name").toString() : "";
        String lastName = payload.get("family_name") != null ? payload.get("family_name").toString() : "";
        String picture = payload.get("picture") != null ? payload.get("picture").toString() : null;

        // Find existing user or create a new one
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = new User();
            user.setFirstname(firstName);
            user.setLastname(lastName);
            user.setEmail(email);
            // OAuth users get an unusable random password hash
            user.setPasswordHash("OAUTH_" + UUID.randomUUID());
            user.setRole(UserRole.USER);
            if (picture != null) {
                user.setProfilePicture(picture);
            }
            user = userRepository.save(user);
        }

        // Generate signed JWT and persist it (enables server-side invalidation on logout)
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().toString());
        authTokenRepository.save(new AuthToken(token, user));

        Map<String, Object> data = new HashMap<>();
        // Return both field variants for frontend (accessToken) and mobile (token) compatibility
        data.put("accessToken", token);
        data.put("token", token);
        data.put("refreshToken", UUID.randomUUID().toString());
        data.put("userId", user.getId());
        data.put("email", user.getEmail());
        data.put("role", user.getRole().toString());
        data.put("firstname", user.getFirstname());
        data.put("lastname", user.getLastname());
        data.put("firstName", user.getFirstname());
        data.put("lastName", user.getLastname());
        if (user.getProfilePicture() != null) {
            data.put("profilePicture", user.getProfilePicture());
        }

        System.out.println("✅ Google OAuth login: " + email);
        return data;
    }
}
