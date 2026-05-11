package com.example.gymmembershipapp.data

import com.google.gson.annotations.SerializedName

data class AuthResponse(
    @SerializedName("accessToken") val token: String,
    val refreshToken: String?,
    val userId: String?,
    val email: String,
    val role: String?,
    @SerializedName("firstname") val firstName: String?,
    @SerializedName("lastname") val lastName: String?
)
