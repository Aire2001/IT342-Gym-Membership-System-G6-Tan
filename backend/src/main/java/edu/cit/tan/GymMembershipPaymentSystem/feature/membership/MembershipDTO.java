package edu.cit.tan.GymMembershipPaymentSystem.feature.membership;

import java.math.BigDecimal;

public class MembershipDTO {
    private Long id;
    private String name;
    private Integer durationMonths;
    private BigDecimal price;
    private String description;

    public MembershipDTO() {}

    public MembershipDTO(Long id, String name, Integer durationMonths, BigDecimal price, String description) {
        this.id = id;
        this.name = name;
        this.durationMonths = durationMonths;
        this.price = price;
        this.description = description;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getDurationMonths() { return durationMonths; }
    public void setDurationMonths(Integer durationMonths) { this.durationMonths = durationMonths; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}