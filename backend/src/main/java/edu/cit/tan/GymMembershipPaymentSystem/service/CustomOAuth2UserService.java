package edu.cit.tan.GymMembershipPaymentSystem.service;

import edu.cit.tan.GymMembershipPaymentSystem.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.entity.UserRole;
import edu.cit.tan.GymMembershipPaymentSystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // Fetch user data from Google
        String email = oAuth2User.getAttribute("email");
        String firstname = oAuth2User.getAttribute("given_name");
        String lastname = oAuth2User.getAttribute("family_name");

        if (email == null) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }
        if (firstname == null) {
            firstname = "Google";
        }
        if (lastname == null) {
            lastname = "User";
        }

        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            // New user, create them with a random hashed dummy password
            String randomPassword = UUID.randomUUID().toString();
            String passwordHash = passwordEncoder.encode(randomPassword);

            User newUser = new User(firstname, lastname, email, passwordHash, UserRole.USER);
            userRepository.save(newUser);
        }

        return oAuth2User;
    }
}
