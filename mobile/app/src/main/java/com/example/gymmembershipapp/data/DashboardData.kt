package com.example.gymmembershipapp.data

data class DashboardData(
    val membershipStatus: String?,
    val membershipName: String?,
    val membershipPrice: Double?,
    val membershipDurationMonths: Int?,
    val membershipDescription: String?,
    val startDate: String?,
    val expirationDate: String?,
    val paymentStatus: String?,
    val totalSpent: Double?,
    val totalPayments: Int?,
    val lastPaymentDate: String?,
    val paymentReference: String?
)
