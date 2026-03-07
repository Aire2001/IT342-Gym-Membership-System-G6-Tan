package edu.cit.tan.GymMembershipPaymentSystem.exception;

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String message) {
        super(message);
    }
}