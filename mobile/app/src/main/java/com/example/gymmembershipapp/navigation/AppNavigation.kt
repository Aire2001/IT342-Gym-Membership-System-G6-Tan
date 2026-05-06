package com.example.gymmembershipapp.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.gymmembershipapp.ui.screens.DashboardScreen
import com.example.gymmembershipapp.ui.screens.DatabaseRecordScreen
import com.example.gymmembershipapp.ui.screens.LoginScreen
import com.example.gymmembershipapp.ui.screens.RegistrationScreen
import com.example.gymmembershipapp.ui.screens.SuccessfulLoginScreen
import com.example.gymmembershipapp.ui.screens.SuccessfulRegistrationScreen
import com.example.gymmembershipapp.viewmodel.AuthViewModel

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object SuccessLogin : Screen("success_login")
    object SuccessRegistration : Screen("success_registration")
    object Dashboard : Screen("dashboard")
    object DatabaseRecord : Screen("database_record")
}

@Composable
fun AppNavigation(authViewModel: AuthViewModel) {
    val navController = rememberNavController()

    // Determine the start destination based on login state
    val startDestination = if (authViewModel.isLoggedIn()) {
        Screen.Dashboard.route
    } else {
        Screen.Login.route
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                authViewModel = authViewModel,
                onNavigateToSuccess = {
                    navController.navigate(Screen.SuccessLogin.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate(Screen.Register.route)
                }
            )
        }

        composable(Screen.Register.route) {
            RegistrationScreen(
                authViewModel = authViewModel,
                onNavigateToSuccess = {
                    navController.navigate(Screen.SuccessRegistration.route) {
                        popUpTo(Screen.Register.route) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.popBackStack()
                }
            )
        }

        composable(Screen.SuccessLogin.route) {
            SuccessfulLoginScreen(
                onNavigateToDashboard = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.SuccessLogin.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.SuccessRegistration.route) {
            SuccessfulRegistrationScreen(
                onNavigateToDashboard = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.SuccessRegistration.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Dashboard.route) {
            DashboardScreen(
                authViewModel = authViewModel,
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Dashboard.route) { inclusive = true }
                    }
                },
                onNavigateToDatabase = {
                    navController.navigate(Screen.DatabaseRecord.route)
                }
            )
        }

        composable(Screen.DatabaseRecord.route) {
            DatabaseRecordScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
