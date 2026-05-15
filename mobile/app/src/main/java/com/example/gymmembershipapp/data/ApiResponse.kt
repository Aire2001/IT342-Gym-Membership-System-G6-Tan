package com.example.gymmembershipapp.data

data class ErrorData(
    val code: String?,
    val message: String?
)

data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val error: ErrorData?,
    val message: String? = null,
    val errorCode: String? = null,
    val errors: Map<String, String>? = null
)
