package edu.cit.tan.GymMembershipPaymentSystem.feature.auth;

import edu.cit.tan.GymMembershipPaymentSystem.shared.dto.UserResponse;

public class LoginResponse {
    private String message;
    private boolean success;
    private UserResponse user;
    private String token;

    public LoginResponse() {
    }

    public LoginResponse(String message, boolean success, UserResponse user, String token) {
        this.message = message;
        this.success = success;
        this.user = user;
        this.token = token;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }


    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}