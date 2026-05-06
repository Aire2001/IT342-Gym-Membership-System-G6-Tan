package edu.cit.tan.GymMembershipPaymentSystem.repository;

import edu.cit.tan.GymMembershipPaymentSystem.entity.AuthToken;
import edu.cit.tan.GymMembershipPaymentSystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {
    Optional<AuthToken> findByTokenAndIsValidTrue(String token);
    void deleteByToken(String token);
    List<AuthToken> findByUser(User user);
}
