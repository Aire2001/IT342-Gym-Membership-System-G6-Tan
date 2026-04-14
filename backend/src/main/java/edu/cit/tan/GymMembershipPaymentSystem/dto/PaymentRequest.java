package edu.cit.tan.GymMembershipPaymentSystem.dto;

import java.math.BigDecimal;

public class PaymentRequest {
    private Long membershipId;
    private BigDecimal amount;
    private String paymentMethod;
    private String userEmail; // Optional: for unauthenticated requests

    public PaymentRequest() {}

    public PaymentRequest(Long membershipId, BigDecimal amount, String paymentMethod) {
        this.membershipId = membershipId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
    }

    public PaymentRequest(Long membershipId, BigDecimal amount, String paymentMethod, String userEmail) {
        this.membershipId = membershipId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.userEmail = userEmail;
    }

    public Long getMembershipId() { return membershipId; }
    public void setMembershipId(Long membershipId) { this.membershipId = membershipId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    @Override
    public String toString() {
        return "PaymentRequest{" +
                "membershipId=" + membershipId +
                ", amount=" + amount +
                ", paymentMethod='" + paymentMethod + '\'' +
                ", userEmail='" + userEmail + '\'' +
                '}';
    }
}