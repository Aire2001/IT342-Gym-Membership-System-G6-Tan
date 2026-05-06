package com.example.gymmembershipapp.network

import com.example.gymmembershipapp.data.ApiResponse
import com.example.gymmembershipapp.data.AuthResponse
import com.example.gymmembershipapp.data.LoginRequest
import com.example.gymmembershipapp.data.MembershipDTO
import com.example.gymmembershipapp.data.RegisterRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

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
}
