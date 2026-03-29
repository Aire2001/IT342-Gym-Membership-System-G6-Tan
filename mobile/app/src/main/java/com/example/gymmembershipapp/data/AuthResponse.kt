package com.example.gymmembershipapp.data

data class AuthResponse(
    val token: String,
    val refreshToken: String?,
    val userId: String?,
    val email: String,
    val role: String?,
    val firstName: String?,
    val lastName: String?
)
