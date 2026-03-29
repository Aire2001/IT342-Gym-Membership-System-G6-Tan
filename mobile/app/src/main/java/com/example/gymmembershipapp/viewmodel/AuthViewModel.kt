package com.example.gymmembershipapp.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.gymmembershipapp.data.LoginRequest
import com.example.gymmembershipapp.data.RegisterRequest
import com.example.gymmembershipapp.network.ApiService
import com.example.gymmembershipapp.network.TokenManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class Success(val message: String) : AuthState()
    data class Error(val message: String) : AuthState()
}

data class UserInfo(
    val firstName: String,
    val lastName: String,
    val email: String,
    val role: String
)

class AuthViewModel(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private val _userInfo = MutableStateFlow<UserInfo?>(null)
    val userInfo: StateFlow<UserInfo?> = _userInfo.asStateFlow()

    init {
        // Restore user info from prefs if already logged in
        if (tokenManager.isLoggedIn()) {
            _userInfo.value = UserInfo(
                firstName = tokenManager.getFirstName() ?: "Member",
                lastName = tokenManager.getLastName() ?: "",
                email = tokenManager.getEmail() ?: "",
                role = "USER"
            )
        }
    }

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _authState.value = AuthState.Error("Email and password are required.")
            return
        }
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val response = apiService.login(LoginRequest(email.trim(), password))
                if (response.isSuccessful && response.body()?.success == true) {
                    val authData = response.body()?.data
                    tokenManager.saveToken(authData?.token ?: "")
                    tokenManager.saveEmail(authData?.email ?: email)
                    tokenManager.saveName(
                        authData?.firstName ?: "",
                        authData?.lastName ?: ""
                    )
                    _userInfo.value = UserInfo(
                        firstName = authData?.firstName ?: "",
                        lastName = authData?.lastName ?: "",
                        email = authData?.email ?: email,
                        role = authData?.role ?: "USER"
                    )
                    _authState.value = AuthState.Success("Login successful")
                } else {
                    val msg = response.body()?.message ?: "Invalid credentials."
                    _authState.value = AuthState.Error(msg)
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Error(
                    "Cannot reach server. Make sure the backend is running."
                )
            }
        }
    }

    fun register(
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        confirmPassword: String
    ) {
        if (firstName.isBlank() || lastName.isBlank() || email.isBlank() || password.isBlank()) {
            _authState.value = AuthState.Error("All fields are required.")
            return
        }
        if (password != confirmPassword) {
            _authState.value = AuthState.Error("Passwords do not match.")
            return
        }
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val request = RegisterRequest(
                    firstName.trim(), lastName.trim(), email.trim(), password, confirmPassword
                )
                val response = apiService.register(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    val authData = response.body()?.data
                    tokenManager.saveToken(authData?.token ?: "")
                    tokenManager.saveEmail(authData?.email ?: email)
                    tokenManager.saveName(
                        authData?.firstName ?: firstName,
                        authData?.lastName ?: lastName
                    )
                    _userInfo.value = UserInfo(
                        firstName = authData?.firstName ?: firstName,
                        lastName = authData?.lastName ?: lastName,
                        email = authData?.email ?: email,
                        role = authData?.role ?: "USER"
                    )
                    _authState.value = AuthState.Success("Registration successful")
                } else {
                    val fieldError = response.body()?.errors?.values?.firstOrNull()
                    val msg = fieldError ?: response.body()?.message ?: "Registration failed."
                    _authState.value = AuthState.Error(msg)
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Error(
                    "Cannot reach server. Make sure the backend is running."
                )
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            try {
                val email = tokenManager.getEmail() ?: ""
                if (email.isNotEmpty()) {
                    apiService.logout(mapOf("email" to email))
                }
            } catch (_: Exception) {
                // Ignore network errors on logout
            } finally {
                tokenManager.clearAll()
                _userInfo.value = null
                _authState.value = AuthState.Idle
            }
        }
    }

    fun resetState() {
        _authState.value = AuthState.Idle
    }

    fun isLoggedIn(): Boolean = tokenManager.isLoggedIn()
}
