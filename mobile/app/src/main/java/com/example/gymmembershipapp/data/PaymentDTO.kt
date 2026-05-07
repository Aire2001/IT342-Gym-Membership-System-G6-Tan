package com.example.gymmembershipapp.data

data class PaymentDTO(
    val paymentId: Long,
    val paymentReference: String?,
    val membershipName: String?,
    val paymentMethod: String?,
    val paymentDate: String?,
    val amount: Double,
    val paymentStatus: String
)

data class PaymentRequest(
    val membershipId: Long,
    val amount: Double,
    val paymentMethod: String
)

data class PaymentResponse(
    val paymentId: Long?,
    val paymentStatus: String?,
    val paymentReference: String?
)
