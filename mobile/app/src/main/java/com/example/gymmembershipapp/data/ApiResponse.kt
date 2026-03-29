package com.example.gymmembershipapp.data

data class ApiResponse<T>(
    val success: Boolean,
    val message: String?,
    val data: T?,
    val errorCode: String?,
    val errors: Map<String, String>?
)
