package com.example.gymmembershipapp.network

import com.example.gymmembershipapp.data.ApiResponse
import com.example.gymmembershipapp.data.AuthResponse
import com.example.gymmembershipapp.data.DashboardData
import com.example.gymmembershipapp.data.LoginRequest
import com.example.gymmembershipapp.data.MembershipDTO
import com.example.gymmembershipapp.data.PaymentDTO
import com.example.gymmembershipapp.data.PaymentRequest
import com.example.gymmembershipapp.data.PaymentResponse
import com.example.gymmembershipapp.data.RegisterRequest
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("api/v1/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<AuthResponse>>

    @POST("api/v1/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<ApiResponse<AuthResponse>>

    @POST("api/v1/auth/logout")
    suspend fun logout(@Body request: Map<String, String>): Response<ApiResponse<String>>

    @GET("api/v1/memberships")
    suspend fun getAllMemberships(): Response<ApiResponse<List<MembershipDTO>>>

    @GET("api/v1/memberships/{id}")
    suspend fun getMembershipById(@Path("id") id: Long): Response<ApiResponse<MembershipDTO>>

    @POST("api/v1/user/membership/select")
    suspend fun selectMembership(@Body body: Map<String, Long>): Response<ApiResponse<Any>>

    @POST("api/v1/payments")
    suspend fun createPayment(@Body request: PaymentRequest): Response<ApiResponse<PaymentResponse>>

    @GET("api/v1/payments/history")
    suspend fun getPaymentHistory(): Response<ApiResponse<List<PaymentDTO>>>

    @GET("api/v1/dashboard")
    suspend fun getDashboard(): Response<ApiResponse<DashboardData>>
}
