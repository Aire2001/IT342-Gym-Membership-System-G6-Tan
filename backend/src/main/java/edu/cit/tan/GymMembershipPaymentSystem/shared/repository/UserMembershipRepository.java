package edu.cit.tan.GymMembershipPaymentSystem.shared.repository;

import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.UserMembership;
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
public interface UserMembershipRepository extends JpaRepository<UserMembership, Long> {
    Optional<UserMembership> findByUserAndStatus(User user, String status);
    List<UserMembership> findByUser(User user);

    @Modifying
    @Transactional
    @Query("DELETE FROM UserMembership um WHERE um.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE UserMembership um SET um.membership = null WHERE um.membership.id = :membershipId")
    void nullifyMembershipById(@Param("membershipId") Long membershipId);
}