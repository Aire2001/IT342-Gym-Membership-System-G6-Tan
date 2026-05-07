package com.example.gymmembershipapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.gymmembershipapp.data.DashboardData
import com.example.gymmembershipapp.viewmodel.AuthViewModel
import com.example.gymmembershipapp.viewmodel.DataState
import com.example.gymmembershipapp.viewmodel.MembershipViewModel

@Composable
fun DashboardScreen(
    authViewModel: AuthViewModel,
    membershipViewModel: MembershipViewModel,
    onNavigateToPlans: () -> Unit
) {
    val userInfo by authViewModel.userInfo.collectAsState()
    val dashboardState by membershipViewModel.dashboard.collectAsState()
    val displayName = if (!userInfo?.firstName.isNullOrBlank())
        "${userInfo?.firstName} ${userInfo?.lastName}".trim() else "Member"

    LaunchedEffect(Unit) {
        membershipViewModel.loadDashboard()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Welcome
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Row(
                    modifier = Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = RoundedCornerShape(999.dp),
                        color = Color.White.copy(alpha = 0.2f),
                        modifier = Modifier.size(52.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                userInfo?.firstName?.firstOrNull()?.toString() ?: "M",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White
                            )
                        }
                    }
                    Spacer(Modifier.width(14.dp))
                    Column {
                        Text(
                            "Welcome back,",
                            fontSize = 13.sp,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                        Text(
                            displayName,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                    }
                }
            }
        }

        // Dashboard data
        item {
            when (val state = dashboardState) {
                is DataState.Loading -> {
                    Box(Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    }
                }
                is DataState.Error -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                    ) {
                        Text(
                            state.message,
                            modifier = Modifier.padding(16.dp),
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
                is DataState.Success -> {
                    DashboardContent(data = state.data, onNavigateToPlans = onNavigateToPlans)
                }
                else -> {}
            }
        }
    }
}

@Composable
fun DashboardContent(data: DashboardData, onNavigateToPlans: () -> Unit) {
    val membershipStatus = data.membershipStatus ?: "None"
    val isActive = membershipStatus.equals("Active", ignoreCase = true)
    val statusColor = when {
        isActive -> MaterialTheme.colorScheme.tertiary
        membershipStatus.equals("Pending", ignoreCase = true) -> Color(0xFFD97706)
        else -> MaterialTheme.colorScheme.error
    }
    val statusBg = when {
        isActive -> MaterialTheme.colorScheme.tertiaryContainer
        membershipStatus.equals("Pending", ignoreCase = true) -> Color(0xFFFEF3C7)
        else -> MaterialTheme.colorScheme.errorContainer
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        // Stat row
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatInfoCard(
                value = "${data.totalPayments ?: 0}",
                label = "Payments",
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.weight(1f)
            )
            StatInfoCard(
                value = "₱${String.format("%,.0f", data.totalSpent ?: 0.0)}",
                label = "Total Spent",
                color = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.weight(1f)
            )
            StatInfoCard(
                value = membershipStatus,
                label = "Status",
                color = statusColor,
                modifier = Modifier.weight(1f)
            )
        }

        // Membership Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Current Membership", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Surface(shape = RoundedCornerShape(999.dp), color = statusBg) {
                        Text(
                            membershipStatus,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = statusColor
                        )
                    }
                }
                Spacer(Modifier.height(6.dp))
                Text(
                    data.membershipName ?: "No Active Plan",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.primary
                )
                if (data.expirationDate != null) {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "Expires: ${data.expirationDate.take(10)}",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (data.startDate != null) {
                    Text(
                        "Started: ${data.startDate.take(10)}",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = onNavigateToPlans,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.Upgrade, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(if (isActive) "Upgrade Plan" else "Get a Plan", fontWeight = FontWeight.Bold)
                }
            }
        }

        // Payment status card
        if (data.paymentReference != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Receipt,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.secondary,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("Last Payment", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f))
                        Text(
                            data.paymentReference,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun StatInfoCard(value: String, label: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.08f))
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(value, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = color, maxLines = 1)
            Text(label, fontSize = 10.sp, color = color.copy(alpha = 0.7f))
        }
    }
}
