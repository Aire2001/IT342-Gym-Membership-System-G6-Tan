package com.example.gymmembershipapp.data

data class AdminUserDTO(
    val id: Long,
    val firstname: String?,
    val lastname: String?,
    val email: String,
    val role: String,
    val createdAt: String?
)

data class AdminPaymentDTO(
    val paymentId: Long,
    val paymentReference: String?,
    val userEmail: String?,
    val membershipName: String?,
    val paymentMethod: String?,
    val paymentDate: String?,
    val amount: Double,
    val paymentStatus: String
)

data class ProfileData(
    val userId: Long?,
    val email: String?,
    val firstname: String?,
    val lastname: String?,
    val role: String?,
    val createdAt: String?,
    val profilePicture: String? = null,
    val isOAuthUser: Boolean? = false
)

data class PhotoUploadResponse(val profilePicture: String?)
