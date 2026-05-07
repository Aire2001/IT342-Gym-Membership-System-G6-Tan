package com.example.gymmembershipapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.gymmembershipapp.data.PaymentDTO
import com.example.gymmembershipapp.viewmodel.DataState
import com.example.gymmembershipapp.viewmodel.MembershipViewModel

@Composable
fun PaymentHistoryScreen(membershipViewModel: MembershipViewModel) {
    val historyState by membershipViewModel.paymentHistory.collectAsState()

    LaunchedEffect(Unit) {
        membershipViewModel.loadPaymentHistory()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            "Payment History",
            fontSize = 24.sp,
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(bottom = 4.dp)
        )
        Text(
            "All your membership payment records",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 20.dp)
        )

        when (val state = historyState) {
            is DataState.Loading -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            }
            is DataState.Error -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                        Spacer(Modifier.height(12.dp))
                        Button(onClick = { membershipViewModel.loadPaymentHistory() }) {
                            Text("Retry")
                        }
                    }
                }
            }
            is DataState.Success -> {
                val payments = state.data
                if (payments.isEmpty()) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.Receipt,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
                            )
                            Spacer(Modifier.height(12.dp))
                            Text("No payments yet", fontWeight = FontWeight.SemiBold)
                            Text(
                                "Get a membership to start your journey",
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    // Summary chips
                    val totalPaid = payments.filter { it.paymentStatus.equals("COMPLETED", ignoreCase = true) }
                        .sumOf { it.amount }
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        SummaryChip("${payments.size}", "Total", MaterialTheme.colorScheme.primary, Modifier.weight(1f))
                        SummaryChip(
                            "₱${String.format("%,.0f", totalPaid)}",
                            "Paid",
                            MaterialTheme.colorScheme.secondary,
                            Modifier.weight(1f)
                        )
                        SummaryChip(
                            "${payments.count { it.paymentStatus.equals("COMPLETED", ignoreCase = true) }}",
                            "Done",
                            MaterialTheme.colorScheme.tertiary,
                            Modifier.weight(1f)
                        )
                    }
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(payments) { payment ->
                            PaymentCard(payment)
                        }
                    }
                }
            }
            else -> {}
        }
    }
}

@Composable
fun SummaryChip(value: String, label: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f))
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(value, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = color)
            Text(label, fontSize = 11.sp, color = color.copy(alpha = 0.7f))
        }
    }
}

@Composable
fun PaymentCard(payment: PaymentDTO) {
    val status = payment.paymentStatus.replaceFirstChar { it.uppercase() }.lowercase().replaceFirstChar { it.uppercase() }
    val (statusColor, statusBg) = when (payment.paymentStatus.uppercase()) {
        "COMPLETED" -> MaterialTheme.colorScheme.tertiary to MaterialTheme.colorScheme.tertiaryContainer
        "PENDING"   -> Color(0xFFD97706) to Color(0xFFFEF3C7)
        else        -> MaterialTheme.colorScheme.error to MaterialTheme.colorScheme.errorContainer
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = MaterialTheme.colorScheme.primaryContainer,
                modifier = Modifier.size(48.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Default.Receipt,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(26.dp)
                    )
                }
            }
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    payment.membershipName ?: "Membership",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
                Text(
                    payment.paymentReference ?: "",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                )
                Text(
                    "${payment.paymentMethod ?: ""} · ${payment.paymentDate?.take(10) ?: ""}",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    "₱${String.format("%,.2f", payment.amount)}",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 15.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(Modifier.height(4.dp))
                Surface(shape = RoundedCornerShape(999.dp), color = statusBg) {
                    Text(
                        status,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = statusColor
                    )
                }
            }
        }
    }
}
