package edu.cit.tan.GymMembershipPaymentSystem.shared.exception;

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String message) {
        super(message);
    }
}