package com.example.gymmembershipapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.gymmembershipapp.navigation.AppNavigation
import com.example.gymmembershipapp.network.RetrofitClient
import com.example.gymmembershipapp.network.TokenManager
import com.example.gymmembershipapp.ui.theme.GymMembershipAppTheme
import com.example.gymmembershipapp.viewmodel.AuthViewModel
import com.example.gymmembershipapp.viewmodel.MembershipViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val tokenManager = TokenManager(applicationContext)
        val apiService = RetrofitClient.createService(tokenManager)

        val authFactory = object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                @Suppress("UNCHECKED_CAST")
                return when {
                    modelClass.isAssignableFrom(AuthViewModel::class.java) ->
                        AuthViewModel(apiService, tokenManager) as T
                    modelClass.isAssignableFrom(MembershipViewModel::class.java) ->
                        MembershipViewModel(apiService) as T
                    else -> throw IllegalArgumentException("Unknown ViewModel: ${modelClass.name}")
                }
            }
        }

        setContent {
            GymMembershipAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val authViewModel: AuthViewModel = viewModel(factory = authFactory)
                    val membershipViewModel: MembershipViewModel = viewModel(factory = authFactory)
                    AppNavigation(
                        authViewModel = authViewModel,
                        membershipViewModel = membershipViewModel
                    )
                }
            }
        }
    }
}
