package edu.cit.tan.GymMembershipPaymentSystem.shared.repository;

import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}