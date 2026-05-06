package edu.cit.tan.GymMembershipPaymentSystem.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
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

    // Serialize id as "paymentId" to match frontend expectations
    @JsonProperty("paymentId")
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    // Hide nested User to prevent circular references and password exposure
    @JsonIgnore
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    // Hide nested Membership; expose flat fields instead
    @JsonIgnore
    public Membership getMembership() { return membership; }
    public void setMembership(Membership membership) { this.membership = membership; }

    // Flat computed fields for JSON responses
    @JsonProperty("userEmail")
    public String getUserEmail() { return user != null ? user.getEmail() : null; }

    @JsonProperty("membershipName")
    public String getMembershipName() { return membership != null ? membership.getName() : null; }

    @JsonProperty("membershipId")
    public Long getMembershipId() { return membership != null ? membership.getId() : null; }

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