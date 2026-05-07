package com.example.gymmembershipapp.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.gymmembershipapp.data.MembershipDTO
import com.example.gymmembershipapp.ui.screens.*
import com.example.gymmembershipapp.viewmodel.AuthViewModel
import com.example.gymmembershipapp.viewmodel.MembershipViewModel

sealed class Screen(val route: String) {
    object Login              : Screen("login")
    object Register           : Screen("register")
    object SuccessLogin       : Screen("success_login")
    object SuccessRegistration: Screen("success_registration")
    object Home               : Screen("home")
    object Payment            : Screen("payment/{planId}/{planName}/{price}/{duration}/{description}") {
        fun createRoute(plan: MembershipDTO) =
            "payment/${plan.id}/${plan.name}/${plan.price}/${plan.durationMonths}/${plan.description}"
    }
}

data class BottomNavItem(val label: String, val icon: ImageVector, val route: String)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNavigation(authViewModel: AuthViewModel, membershipViewModel: MembershipViewModel) {
    val navController = rememberNavController()
    val userInfo by authViewModel.userInfo.collectAsState()
    val isAdmin = userInfo?.role?.equals("ADMIN", ignoreCase = true) == true

    val startDestination = if (authViewModel.isLoggedIn()) Screen.Home.route else Screen.Login.route

    NavHost(navController = navController, startDestination = startDestination) {

        composable(Screen.Login.route) {
            LoginScreen(
                authViewModel = authViewModel,
                onNavigateToSuccess = {
                    navController.navigate(Screen.SuccessLogin.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToRegister = { navController.navigate(Screen.Register.route) }
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
                onNavigateToLogin = { navController.popBackStack() }
            )
        }

        composable(Screen.SuccessLogin.route) {
            SuccessfulLoginScreen(
                onNavigateToDashboard = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.SuccessLogin.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.SuccessRegistration.route) {
            SuccessfulRegistrationScreen(
                onNavigateToDashboard = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.SuccessRegistration.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Home.route) {
            HomeScreen(
                authViewModel = authViewModel,
                membershipViewModel = membershipViewModel,
                isAdmin = isAdmin,
                onLogout = {
                    authViewModel.logout()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                },
                onSelectPlan = { plan ->
                    navController.navigate(Screen.Payment.createRoute(plan))
                }
            )
        }

        composable(Screen.Payment.route) { backStack ->
            val planId   = backStack.arguments?.getString("planId")?.toLongOrNull() ?: 0L
            val name     = backStack.arguments?.getString("planName") ?: ""
            val price    = backStack.arguments?.getString("price")?.toDoubleOrNull() ?: 0.0
            val duration = backStack.arguments?.getString("duration")?.toIntOrNull() ?: 1
            val desc     = backStack.arguments?.getString("description") ?: ""
            val plan = MembershipDTO(planId, name, duration, price, desc)
            PaymentScreen(
                plan = plan,
                membershipViewModel = membershipViewModel,
                onBack = { navController.popBackStack() },
                onPaymentDone = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    authViewModel: AuthViewModel,
    membershipViewModel: MembershipViewModel,
    isAdmin: Boolean,
    onLogout: () -> Unit,
    onSelectPlan: (MembershipDTO) -> Unit
) {
    val navController = rememberNavController()
    val navItems = buildList {
        add(BottomNavItem("Dashboard", Icons.Default.Home, "dash"))
        add(BottomNavItem("Plans", Icons.Default.FitnessCenter, "plans"))
        add(BottomNavItem("History", Icons.Default.Receipt, "history"))
        if (isAdmin) add(BottomNavItem("Admin", Icons.Default.AdminPanelSettings, "admin"))
    }

    val navBackStack by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStack?.destination?.route

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text("FitLife Gym", fontWeight = FontWeight.ExtraBold)
                },
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.Logout, contentDescription = "Logout")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = androidx.compose.ui.graphics.Color.White,
                    actionIconContentColor = androidx.compose.ui.graphics.Color.White
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 8.dp
            ) {
                navItems.forEach { item ->
                    NavigationBarItem(
                        selected = currentRoute == item.route,
                        onClick = {
                            navController.navigate(item.route) {
                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(item.icon, contentDescription = item.label) },
                        label = { Text(item.label, fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    )
                }
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = "dash",
            modifier = Modifier.padding(paddingValues)
        ) {
            composable("dash") {
                DashboardScreen(
                    authViewModel = authViewModel,
                    membershipViewModel = membershipViewModel,
                    onNavigateToPlans = {
                        navController.navigate("plans") {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                        }
                    }
                )
            }
            composable("plans") {
                MembershipScreen(
                    membershipViewModel = membershipViewModel,
                    onSelectPlan = onSelectPlan
                )
            }
            composable("history") {
                PaymentHistoryScreen(membershipViewModel = membershipViewModel)
            }
            composable("admin") {
                DatabaseRecordScreen(onNavigateBack = { navController.popBackStack() })
            }
        }
    }
}
