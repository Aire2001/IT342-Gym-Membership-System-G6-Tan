package edu.cit.tan.GymMembershipPaymentSystem.config;

import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.AuthToken;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.User;
import edu.cit.tan.GymMembershipPaymentSystem.shared.repository.AuthTokenRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
public class TokenAuthFilter extends OncePerRequestFilter {

    @Autowired
    private AuthTokenRepository authTokenRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                Optional<AuthToken> authTokenOpt = authTokenRepository.findByTokenAndIsValidTrue(token);

                if (authTokenOpt.isPresent()) {
                    AuthToken authToken = authTokenOpt.get();

                    if (!authToken.isExpired()) {
                        User user = authToken.getUser();
                        String role = "ROLE_" + user.getRole().toString();

                        List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));

                        UserDetails userDetails = org.springframework.security.core.userdetails.User
                                .withUsername(user.getEmail())
                                .password("")
                                .authorities(authorities)
                                .build();

                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(userDetails, null, authorities);

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        System.out.println("✅ Token authenticated for user: " + user.getEmail() + " with role: " + role);
                    } else {
                        System.out.println("⏰ Token expired for user: " + authToken.getUser().getEmail());
                    }
                } else {
                    System.out.println("⚠️ Invalid or not found token: " + token.substring(0, Math.min(20, token.length())) + "...");
                }
            } catch (Exception e) {
                System.err.println("❌ Token authentication error: " + e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
