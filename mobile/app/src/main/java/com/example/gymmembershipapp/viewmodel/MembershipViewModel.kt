package com.example.gymmembershipapp.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.gymmembershipapp.data.DashboardData
import com.example.gymmembershipapp.data.MembershipDTO
import com.example.gymmembershipapp.data.PaymentDTO
import com.example.gymmembershipapp.data.PaymentRequest
import com.example.gymmembershipapp.data.PaymentResponse
import com.example.gymmembershipapp.network.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class DataState<out T> {
    object Idle : DataState<Nothing>()
    object Loading : DataState<Nothing>()
    data class Success<T>(val data: T) : DataState<T>()
    data class Error(val message: String) : DataState<Nothing>()
}

class MembershipViewModel(private val apiService: ApiService) : ViewModel() {

    private val _memberships = MutableStateFlow<DataState<List<MembershipDTO>>>(DataState.Idle)
    val memberships: StateFlow<DataState<List<MembershipDTO>>> = _memberships.asStateFlow()

    private val _paymentHistory = MutableStateFlow<DataState<List<PaymentDTO>>>(DataState.Idle)
    val paymentHistory: StateFlow<DataState<List<PaymentDTO>>> = _paymentHistory.asStateFlow()

    private val _dashboard = MutableStateFlow<DataState<DashboardData>>(DataState.Idle)
    val dashboard: StateFlow<DataState<DashboardData>> = _dashboard.asStateFlow()

    private val _paymentResult = MutableStateFlow<DataState<PaymentResponse>>(DataState.Idle)
    val paymentResult: StateFlow<DataState<PaymentResponse>> = _paymentResult.asStateFlow()

    fun loadMemberships() {
        viewModelScope.launch {
            _memberships.value = DataState.Loading
            try {
                val res = apiService.getAllMemberships()
                if (res.isSuccessful && res.body()?.success == true) {
                    _memberships.value = DataState.Success(res.body()?.data ?: emptyList())
                } else {
                    _memberships.value = DataState.Error("Failed to load plans")
                }
            } catch (e: Exception) {
                _memberships.value = DataState.Error("Cannot reach server")
            }
        }
    }

    fun loadPaymentHistory() {
        viewModelScope.launch {
            _paymentHistory.value = DataState.Loading
            try {
                val res = apiService.getPaymentHistory()
                if (res.isSuccessful && res.body()?.success == true) {
                    _paymentHistory.value = DataState.Success(res.body()?.data ?: emptyList())
                } else {
                    _paymentHistory.value = DataState.Error("Failed to load history")
                }
            } catch (e: Exception) {
                _paymentHistory.value = DataState.Error("Cannot reach server")
            }
        }
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _dashboard.value = DataState.Loading
            try {
                val res = apiService.getDashboard()
                if (res.isSuccessful && res.body()?.success == true) {
                    _dashboard.value = DataState.Success(res.body()!!.data!!)
                } else {
                    _dashboard.value = DataState.Error("Failed to load dashboard")
                }
            } catch (e: Exception) {
                _dashboard.value = DataState.Error("Cannot reach server")
            }
        }
    }

    fun createPayment(membershipId: Long, amount: Double, paymentMethod: String) {
        viewModelScope.launch {
            _paymentResult.value = DataState.Loading
            try {
                val res = apiService.createPayment(PaymentRequest(membershipId, amount, paymentMethod))
                if (res.isSuccessful && res.body()?.success == true) {
                    _paymentResult.value = DataState.Success(res.body()!!.data!!)
                } else {
                    _paymentResult.value = DataState.Error(res.body()?.message ?: "Payment failed")
                }
            } catch (e: Exception) {
                _paymentResult.value = DataState.Error("Cannot reach server")
            }
        }
    }

    fun resetPaymentResult() {
        _paymentResult.value = DataState.Idle
    }
}
