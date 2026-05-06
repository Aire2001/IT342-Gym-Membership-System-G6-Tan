package edu.cit.tan.GymMembershipPaymentSystem.repository;

import edu.cit.tan.GymMembershipPaymentSystem.entity.UserMembership;
import edu.cit.tan.GymMembershipPaymentSystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserMembershipRepository extends JpaRepository<UserMembership, Long> {
    // Find active membership for a user
    Optional<UserMembership> findByUserAndStatus(User user, String status);

    // Find all memberships for a user
    List<UserMembership> findByUser(User user);
}