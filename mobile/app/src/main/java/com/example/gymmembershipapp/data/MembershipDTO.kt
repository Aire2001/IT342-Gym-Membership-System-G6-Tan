package com.example.gymmembershipapp.data

data class MembershipDTO(
    val id: Long,
    val name: String,
    val durationMonths: Int,
    val price: Double,
    val description: String
)
