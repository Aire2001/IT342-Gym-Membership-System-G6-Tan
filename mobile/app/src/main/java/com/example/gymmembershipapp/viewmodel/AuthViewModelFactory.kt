package com.example.gymmembershipapp.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.example.gymmembershipapp.network.ApiService
import com.example.gymmembershipapp.network.TokenManager

class AuthViewModelFactory(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return AuthViewModel(apiService, tokenManager) as T
    }
}
