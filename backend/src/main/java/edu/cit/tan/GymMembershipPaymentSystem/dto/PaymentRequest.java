package edu.cit.tan.GymMembershipPaymentSystem.dto;

import java.math.BigDecimal;

public class PaymentRequest {
    private Long membershipId;
    private BigDecimal amount;
    private String paymentMethod;

    public PaymentRequest() {}

    public PaymentRequest(Long membershipId, BigDecimal amount, String paymentMethod) {
        this.membershipId = membershipId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
    }

    public Long getMembershipId() { return membershipId; }
    public void setMembershipId(Long membershipId) { this.membershipId = membershipId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    @Override
    public String toString() {
        return "PaymentRequest{" +
                "membershipId=" + membershipId +
                ", amount=" + amount +
                ", paymentMethod='" + paymentMethod + '\'' +
                '}';
    }
}