package com.example.gymmembershipapp.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.example.gymmembershipapp.network.ApiService
import com.example.gymmembershipapp.network.TokenManager

class AdminViewModelFactory(
    private val apiService: ApiService,
    private val tokenManager: TokenManager? = null
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return if (tokenManager != null) {
            AdminViewModel(apiService, tokenManager) as T
        } else {
            throw IllegalArgumentException("AdminViewModel requires a TokenManager")
        }
    }
}
