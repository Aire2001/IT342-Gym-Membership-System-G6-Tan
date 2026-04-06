package edu.cit.tan.GymMembershipPaymentSystem.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "membership_id", nullable = false)
    private Membership membership;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_reference", nullable = false, unique = true)
    private String paymentReference;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;

    @Column(name = "payment_status", nullable = false)
    private String paymentStatus;

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    // Constructors
    public Payment() {}

    public Payment(User user, Membership membership, BigDecimal amount, String paymentReference,
                   String paymentMethod, String paymentStatus) {
        this.user = user;
        this.membership = membership;
        this.amount = amount;
        this.paymentReference = paymentReference;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.paymentDate = LocalDateTime.now();
    }

    // Builder Pattern
    public static class Builder {
        private User user;
        private Membership membership;
        private BigDecimal amount;
        private String paymentReference;
        private String paymentMethod;
        private String paymentStatus;

        public Builder user(User user) {
            this.user = user;
            return this;
        }

        public Builder membership(Membership membership) {
            this.membership = membership;
            return this;
        }

        public Builder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public Builder paymentReference(String paymentReference) {
            this.paymentReference = paymentReference;
            return this;
        }

        public Builder paymentMethod(String paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public Builder paymentStatus(String paymentStatus) {
            this.paymentStatus = paymentStatus;
            return this;
        }

        public Payment build() {
            Payment payment = new Payment(user, membership, amount, paymentReference, paymentMethod, paymentStatus);
            payment.setPaymentDate(LocalDateTime.now());
            return payment;
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Membership getMembership() { return membership; }
    public void setMembership(Membership membership) { this.membership = membership; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }
}