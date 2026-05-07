package com.example.gymmembershipapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.gymmembershipapp.data.PaymentDTO
import com.example.gymmembershipapp.viewmodel.DataState
import com.example.gymmembershipapp.viewmodel.MembershipViewModel

@Composable
fun PaymentHistoryScreen(membershipViewModel: MembershipViewModel) {
    val historyState by membershipViewModel.paymentHistory.collectAsState()

    var search by remember { mutableStateOf("") }
    var statusFilter by remember { mutableStateOf("All") }
    val filterOptions = listOf("All", "Completed", "Pending", "Failed")

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
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // ── Search bar ──────────────────────────────────────────────────────────
        OutlinedTextField(
            value = search,
            onValueChange = { search = it },
            placeholder = { Text("Search by reference, plan, method…", fontSize = 13.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(20.dp)) },
            trailingIcon = {
                if (search.isNotEmpty()) {
                    IconButton(onClick = { search = "" }) {
                        Icon(Icons.Default.Close, contentDescription = "Clear", modifier = Modifier.size(18.dp))
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)
            )
        )

        Spacer(Modifier.height(10.dp))

        // ── Status filter chips ─────────────────────────────────────────────────
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(filterOptions) { option ->
                FilterChip(
                    selected = statusFilter == option,
                    onClick = { statusFilter = option },
                    label = { Text(option, fontSize = 12.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.primary,
                        selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                    )
                )
            }
        }

        Spacer(Modifier.height(14.dp))

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
                val allPayments = state.data

                // Apply search + status filter
                val filtered = allPayments.filter { p ->
                    val matchesSearch = search.isBlank() ||
                        p.paymentReference?.contains(search, ignoreCase = true) == true ||
                        p.membershipName?.contains(search, ignoreCase = true) == true ||
                        p.paymentMethod?.contains(search, ignoreCase = true) == true
                    val matchesStatus = statusFilter == "All" ||
                        p.paymentStatus.equals(statusFilter, ignoreCase = true)
                    matchesSearch && matchesStatus
                }

                if (allPayments.isEmpty()) {
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
                    val totalPaid = allPayments
                        .filter { it.paymentStatus.equals("COMPLETED", ignoreCase = true) }
                        .sumOf { it.amount }
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 14.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        SummaryChip("${allPayments.size}", "Total", MaterialTheme.colorScheme.primary, Modifier.weight(1f))
                        SummaryChip(
                            "₱${String.format("%,.0f", totalPaid)}",
                            "Paid",
                            MaterialTheme.colorScheme.secondary,
                            Modifier.weight(1f)
                        )
                        SummaryChip(
                            "${allPayments.count { it.paymentStatus.equals("COMPLETED", ignoreCase = true) }}",
                            "Done",
                            MaterialTheme.colorScheme.tertiary,
                            Modifier.weight(1f)
                        )
                    }

                    if (filtered.isEmpty()) {
                        Box(Modifier.fillMaxWidth().padding(top = 32.dp), contentAlignment = Alignment.Center) {
                            Text(
                                "No results for "$search"",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 14.sp
                            )
                        }
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            items(filtered) { payment ->
                                PaymentCard(payment)
                            }
                        }
                    }
                }
            }
            else -> {}
        }
    }
}

// ── Summary chip ────────────────────────────────────────────────────────────────

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

// ── Payment card with View Receipt button ────────────────────────────────────────

@Composable
fun PaymentCard(payment: PaymentDTO) {
    var showReceipt by remember { mutableStateOf(false) }

    val status = payment.paymentStatus
        .lowercase()
        .replaceFirstChar { it.uppercase() }
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
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
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
                        fontFamily = FontFamily.Monospace
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

            Spacer(Modifier.height(10.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
            Spacer(Modifier.height(8.dp))

            // View Receipt button
            TextButton(
                onClick = { showReceipt = true },
                modifier = Modifier.align(Alignment.End),
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp)
            ) {
                Icon(
                    Icons.Default.Receipt,
                    contentDescription = null,
                    modifier = Modifier.size(15.dp)
                )
                Spacer(Modifier.width(4.dp))
                Text("View Receipt", fontSize = 12.sp)
            }
        }
    }

    if (showReceipt) {
        ReceiptDialog(payment = payment, onDismiss = { showReceipt = false })
    }
}

// ── Receipt dialog ────────────────────────────────────────────────────────────────

@Composable
fun ReceiptDialog(payment: PaymentDTO, onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(modifier = Modifier.padding(24.dp)) {

                // Header
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = MaterialTheme.colorScheme.primaryContainer,
                        modifier = Modifier.size(40.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                Icons.Default.Receipt,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("Payment Receipt", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                        Text("FitLife Gym", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                Spacer(Modifier.height(16.dp))
                HorizontalDivider()
                Spacer(Modifier.height(14.dp))

                // Receipt rows
                ReceiptRow("Reference", payment.paymentReference ?: "—")
                ReceiptRow("Plan", payment.membershipName ?: "—")
                ReceiptRow("Amount", "₱${String.format("%,.2f", payment.amount)}")
                ReceiptRow("Method", payment.paymentMethod ?: "—")
                ReceiptRow("Date", payment.paymentDate?.take(10) ?: "—")

                Spacer(Modifier.height(4.dp))

                // Status row with badge
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 5.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Status", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    val (statusColor, statusBg) = when (payment.paymentStatus.uppercase()) {
                        "COMPLETED" -> MaterialTheme.colorScheme.tertiary to MaterialTheme.colorScheme.tertiaryContainer
                        "PENDING"   -> Color(0xFFD97706) to Color(0xFFFEF3C7)
                        else        -> MaterialTheme.colorScheme.error to MaterialTheme.colorScheme.errorContainer
                    }
                    Surface(shape = RoundedCornerShape(999.dp), color = statusBg) {
                        Text(
                            payment.paymentStatus.lowercase().replaceFirstChar { it.uppercase() },
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = statusColor
                        )
                    }
                }

                Spacer(Modifier.height(16.dp))
                HorizontalDivider()
                Spacer(Modifier.height(14.dp))

                Text(
                    "Thank you for your payment!",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )

                Spacer(Modifier.height(16.dp))

                Button(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Close")
                }
            }
        }
    }
}

@Composable
private fun ReceiptRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 5.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface)
    }
}
