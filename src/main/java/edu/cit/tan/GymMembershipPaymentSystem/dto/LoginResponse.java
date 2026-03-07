package edu.cit.tan.GymMembershipPaymentSystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String message;
    private boolean success;
    private UserResponse user;
    private String token;

    // Explicitly add isSuccess method if Lombok doesn't generate it
    public boolean isSuccess() {
        return success;
    }
}