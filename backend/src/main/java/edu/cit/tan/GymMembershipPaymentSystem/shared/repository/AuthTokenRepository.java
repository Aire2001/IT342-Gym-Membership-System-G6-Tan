package edu.cit.tan.GymMembershipPaymentSystem.shared.repository;

import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.AuthToken;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {
    Optional<AuthToken> findByTokenAndIsValidTrue(String token);
    void deleteByToken(String token);
    List<AuthToken> findByUser(User user);

    @Modifying
    @Transactional
    @Query("DELETE FROM AuthToken t WHERE t.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
