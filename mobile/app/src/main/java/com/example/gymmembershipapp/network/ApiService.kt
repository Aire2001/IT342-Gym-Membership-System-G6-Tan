package com.example.gymmembershipapp.network

import com.example.gymmembershipapp.data.AdminPaymentDTO
import com.example.gymmembershipapp.data.AdminUserDTO
import com.example.gymmembershipapp.data.ApiResponse
import com.example.gymmembershipapp.data.AuthResponse
import com.example.gymmembershipapp.data.DashboardData
import com.example.gymmembershipapp.data.LoginRequest
import com.example.gymmembershipapp.data.MembershipDTO
import com.example.gymmembershipapp.data.PaymentDTO
import com.example.gymmembershipapp.data.PaymentRequest
import com.example.gymmembershipapp.data.PaymentResponse
import com.example.gymmembershipapp.data.ProfileData
import com.example.gymmembershipapp.data.QuoteDTO
import com.example.gymmembershipapp.data.RegisterRequest
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // ── Auth ──────────────────────────────────────────────────────────────────
    @POST("api/v1/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<AuthResponse>>

    @POST("api/v1/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<ApiResponse<AuthResponse>>

    @POST("api/v1/auth/logout")
    suspend fun logout(@Body request: Map<String, String>): Response<ApiResponse<String>>

    @POST("api/v1/auth/oauth/google")
    suspend fun googleLogin(@Body request: Map<String, String>): Response<ApiResponse<AuthResponse>>

    // ── Memberships ───────────────────────────────────────────────────────────
    @GET("api/v1/memberships")
    suspend fun getAllMemberships(): Response<ApiResponse<List<MembershipDTO>>>

    @GET("api/v1/memberships/{id}")
    suspend fun getMembershipById(@Path("id") id: Long): Response<ApiResponse<MembershipDTO>>

    @POST("api/v1/memberships")
    suspend fun createMembership(@Body body: Map<String, Any>): Response<ApiResponse<MembershipDTO>>

    @PUT("api/v1/memberships/{id}")
    suspend fun updateMembership(@Path("id") id: Long, @Body body: Map<String, Any>): Response<ApiResponse<MembershipDTO>>

    @DELETE("api/v1/memberships/{id}")
    suspend fun deleteMembership(@Path("id") id: Long): Response<ApiResponse<String>>

    @POST("api/v1/user/membership/select")
    suspend fun selectMembership(@Body body: Map<String, Long>): Response<ApiResponse<Any>>

    // ── Payments ──────────────────────────────────────────────────────────────
    @POST("api/v1/payments")
    suspend fun createPayment(@Body request: PaymentRequest): Response<ApiResponse<PaymentResponse>>

    @GET("api/v1/payments/history")
    suspend fun getPaymentHistory(): Response<ApiResponse<List<PaymentDTO>>>

    // ── Dashboard ─────────────────────────────────────────────────────────────
    @GET("api/v1/dashboard")
    suspend fun getDashboard(): Response<ApiResponse<DashboardData>>

    // ── Quotes (external API proxy) ───────────────────────────────────────────
    @GET("api/v1/quotes/daily")
    suspend fun getQuote(): Response<ApiResponse<QuoteDTO>>

    // ── Profile ───────────────────────────────────────────────────────────────
    @GET("api/v1/profile")
    suspend fun getProfile(): Response<ApiResponse<ProfileData>>

    @PUT("api/v1/profile")
    suspend fun updateProfile(@Body body: Map<String, String>): Response<ApiResponse<ProfileData>>

    @POST("api/v1/profile/change-password")
    suspend fun changePassword(@Body body: Map<String, String>): Response<ApiResponse<String>>

    @POST("api/v1/profile/set-password")
    suspend fun setPassword(@Body body: Map<String, String>): Response<ApiResponse<String>>

    @PUT("api/v1/profile/email")
    suspend fun changeEmail(@Body body: Map<String, String>): Response<ApiResponse<String>>

    // ── Admin ─────────────────────────────────────────────────────────────────
    @GET("api/v1/admin/users")
    suspend fun getAdminUsers(): Response<ApiResponse<List<AdminUserDTO>>>

    @DELETE("api/v1/admin/users/{id}")
    suspend fun deleteAdminUser(@Path("id") id: Long): Response<ApiResponse<String>>

    @PUT("api/v1/admin/users/{id}/role")
    suspend fun updateUserRole(@Path("id") id: Long, @Body body: Map<String, String>): Response<ApiResponse<Any>>

    @GET("api/v1/admin/payments")
    suspend fun getAdminPayments(): Response<ApiResponse<List<AdminPaymentDTO>>>

    @PUT("api/v1/admin/payments/{id}/status")
    suspend fun updateAdminPaymentStatus(@Path("id") id: Long, @Body body: Map<String, String>): Response<ApiResponse<Any>>

    @DELETE("api/v1/admin/payments/{id}")
    suspend fun deleteAdminPayment(@Path("id") id: Long): Response<ApiResponse<String>>
}
