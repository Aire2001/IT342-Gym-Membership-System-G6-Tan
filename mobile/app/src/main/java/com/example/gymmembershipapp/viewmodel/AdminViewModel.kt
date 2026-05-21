package com.example.gymmembershipapp.viewmodel

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.gymmembershipapp.data.AdminPaymentDTO
import com.example.gymmembershipapp.data.AdminUserDTO
import com.example.gymmembershipapp.data.MembershipDTO
import com.example.gymmembershipapp.data.ProfileData
import com.example.gymmembershipapp.network.ApiService
import com.example.gymmembershipapp.network.TokenManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

class AdminViewModel(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) : ViewModel() {

    // ── Admin data ─────────────────────────────────────────────────────────────
    private val _adminUsers = MutableStateFlow<DataState<List<AdminUserDTO>>>(DataState.Idle)
    val adminUsers: StateFlow<DataState<List<AdminUserDTO>>> = _adminUsers.asStateFlow()

    private val _adminPayments = MutableStateFlow<DataState<List<AdminPaymentDTO>>>(DataState.Idle)
    val adminPayments: StateFlow<DataState<List<AdminPaymentDTO>>> = _adminPayments.asStateFlow()

    private val _plans = MutableStateFlow<DataState<List<MembershipDTO>>>(DataState.Idle)
    val plans: StateFlow<DataState<List<MembershipDTO>>> = _plans.asStateFlow()

    private val _actionState = MutableStateFlow<DataState<String>>(DataState.Idle)
    val actionState: StateFlow<DataState<String>> = _actionState.asStateFlow()

    // ── Profile data ───────────────────────────────────────────────────────────
    private val _profile = MutableStateFlow<DataState<ProfileData>>(DataState.Idle)
    val profile: StateFlow<DataState<ProfileData>> = _profile.asStateFlow()

    private val _profileAction = MutableStateFlow<DataState<String>>(DataState.Idle)
    val profileAction: StateFlow<DataState<String>> = _profileAction.asStateFlow()

    // ── Load all admin data ────────────────────────────────────────────────────
    fun loadAll() {
        loadUsers()
        loadPayments()
        loadPlans()
    }

    fun loadUsers() {
        viewModelScope.launch {
            _adminUsers.value = DataState.Loading
            try {
                val res = apiService.getAdminUsers()
                if (res.isSuccessful && res.body()?.success == true) {
                    _adminUsers.value = DataState.Success(res.body()?.data ?: emptyList())
                } else {
                    _adminUsers.value = DataState.Error("Failed to load users")
                }
            } catch (e: Exception) {
                _adminUsers.value = DataState.Error("Cannot reach server")
            }
        }
    }

    fun loadPayments() {
        viewModelScope.launch {
            _adminPayments.value = DataState.Loading
            try {
                val res = apiService.getAdminPayments()
                if (res.isSuccessful && res.body()?.success == true) {
                    _adminPayments.value = DataState.Success(res.body()?.data ?: emptyList())
                } else {
                    _adminPayments.value = DataState.Error("Failed to load payments")
                }
            } catch (e: Exception) {
                _adminPayments.value = DataState.Error("Cannot reach server")
            }
        }
    }

    fun loadPlans() {
        viewModelScope.launch {
            _plans.value = DataState.Loading
            try {
                val res = apiService.getAllMemberships()
                if (res.isSuccessful && res.body()?.success == true) {
                    _plans.value = DataState.Success(res.body()?.data ?: emptyList())
                } else {
                    _plans.value = DataState.Error("Failed to load plans")
                }
            } catch (e: Exception) {
                _plans.value = DataState.Error("Cannot reach server")
            }
        }
    }

    fun deleteUser(id: Long) {
        viewModelScope.launch {
            try {
                apiService.deleteAdminUser(id)
                val current = (_adminUsers.value as? DataState.Success)?.data ?: return@launch
                _adminUsers.value = DataState.Success(current.filter { it.id != id })
            } catch (_: Exception) {}
        }
    }

    fun updateUserRole(id: Long, role: String) {
        viewModelScope.launch {
            try {
                apiService.updateUserRole(id, mapOf("role" to role))
                val current = (_adminUsers.value as? DataState.Success)?.data ?: return@launch
                _adminUsers.value = DataState.Success(current.map { if (it.id == id) it.copy(role = role) else it })
            } catch (_: Exception) {}
        }
    }

    fun updatePaymentStatus(id: Long, status: String) {
        viewModelScope.launch {
            try {
                apiService.updateAdminPaymentStatus(id, mapOf("status" to status))
                val current = (_adminPayments.value as? DataState.Success)?.data ?: return@launch
                _adminPayments.value = DataState.Success(current.map { if (it.paymentId == id) it.copy(paymentStatus = status.uppercase()) else it })
            } catch (_: Exception) {}
        }
    }

    fun deletePayment(id: Long) {
        viewModelScope.launch {
            try {
                apiService.deleteAdminPayment(id)
                val current = (_adminPayments.value as? DataState.Success)?.data ?: return@launch
                _adminPayments.value = DataState.Success(current.filter { it.paymentId != id })
            } catch (_: Exception) {}
        }
    }

    fun createPlan(name: String, durationMonths: Int, price: Double, description: String) {
        viewModelScope.launch {
            try {
                val body = mapOf<String, Any>("name" to name, "durationMonths" to durationMonths, "price" to price, "description" to description)
                val res = apiService.createMembership(body)
                if (res.isSuccessful && res.body()?.success == true) {
                    val newPlan = res.body()?.data
                    if (newPlan != null) {
                        val current = (_plans.value as? DataState.Success)?.data ?: emptyList()
                        _plans.value = DataState.Success(current + listOf(newPlan))
                        _actionState.value = DataState.Success("Plan created")
                    }
                } else {
                    _actionState.value = DataState.Error(res.body()?.error?.message ?: "Failed to create plan")
                }
            } catch (e: Exception) {
                _actionState.value = DataState.Error("Cannot reach server")
            }
        }
    }

    fun updatePlan(id: Long, name: String, durationMonths: Int, price: Double, description: String) {
        viewModelScope.launch {
            try {
                val body = mapOf<String, Any>("name" to name, "durationMonths" to durationMonths, "price" to price, "description" to description)
                val res = apiService.updateMembership(id, body)
                if (res.isSuccessful && res.body()?.success == true) {
                    val updated = res.body()?.data
                    if (updated != null) {
                        val current = (_plans.value as? DataState.Success)?.data ?: emptyList()
                        _plans.value = DataState.Success(current.map { if (it.id == id) updated else it })
                        _actionState.value = DataState.Success("Plan updated")
                    }
                } else {
                    _actionState.value = DataState.Error(res.body()?.error?.message ?: "Failed to update plan")
                }
            } catch (e: Exception) {
                _actionState.value = DataState.Error("Cannot reach server")
            }
        }
    }

    fun deletePlan(id: Long) {
        viewModelScope.launch {
            try {
                apiService.deleteMembership(id)
                val current = (_plans.value as? DataState.Success)?.data ?: return@launch
                _plans.value = DataState.Success(current.filter { it.id != id })
            } catch (_: Exception) {}
        }
    }

    fun resetActionState() { _actionState.value = DataState.Idle }

    // ── Profile ────────────────────────────────────────────────────────────────
    fun loadProfile() {
        viewModelScope.launch {
            _profile.value = DataState.Loading
            try {
                val res = apiService.getProfile()
                if (res.isSuccessful && res.body()?.success == true) {
                    val data = res.body()?.data
                    if (data != null) _profile.value = DataState.Success(data)
                    else _profile.value = DataState.Error("Failed to load profile")
                } else {
                    _profile.value = DataState.Error("Failed to load profile")
                }
            } catch (e: Exception) {
                _profile.value = DataState.Error("Cannot reach server")
            }
        }
    }

    fun updateProfile(firstname: String, lastname: String, profilePicture: String? = null, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val body = mutableMapOf("firstname" to firstname, "lastname" to lastname)
                if (profilePicture != null) body["profilePicture"] = profilePicture
                val res = apiService.updateProfile(body)
                if (res.isSuccessful && res.body()?.success == true) {
                    tokenManager.saveName(firstname, lastname)
                    onSuccess()
                } else {
                    onError(res.body()?.error?.message ?: "Failed to update profile")
                }
            } catch (e: Exception) {
                onError("Cannot reach server")
            }
        }
    }

    fun changePassword(current: String, new: String, confirm: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val res = apiService.changePassword(mapOf("currentPassword" to current, "newPassword" to new, "confirmPassword" to confirm))
                if (res.isSuccessful && res.body()?.success == true) {
                    onSuccess()
                } else {
                    onError(res.body()?.error?.message ?: "Failed to change password")
                }
            } catch (e: Exception) {
                onError("Cannot reach server")
            }
        }
    }

    fun setPassword(newPassword: String, confirmPassword: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val res = apiService.setPassword(mapOf("newPassword" to newPassword, "confirmPassword" to confirmPassword))
                if (res.isSuccessful && res.body()?.success == true) {
                    onSuccess()
                } else {
                    onError(res.body()?.error?.message ?: "Failed to set password")
                }
            } catch (e: Exception) {
                onError("Cannot reach server")
            }
        }
    }

    fun uploadPhoto(context: Context, uri: Uri, onSuccess: (String) -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val stream = context.contentResolver.openInputStream(uri) ?: run { onError("Cannot read image"); return@launch }
                val mimeType = context.contentResolver.getType(uri) ?: "image/jpeg"
                val ext = when { mimeType.contains("png") -> "png"; mimeType.contains("gif") -> "gif"; else -> "jpg" }
                val bytes = stream.readBytes()
                stream.close()
                val requestBody = bytes.toRequestBody(mimeType.toMediaTypeOrNull())
                val part = MultipartBody.Part.createFormData("photo", "photo.$ext", requestBody)
                val res = apiService.uploadPhoto(part)
                if (res.isSuccessful && res.body()?.success == true) {
                    onSuccess(res.body()?.data?.profilePicture ?: "")
                } else {
                    onError(res.body()?.error?.message ?: "Failed to upload photo")
                }
            } catch (e: Exception) {
                onError("Cannot reach server")
            }
        }
    }

    fun changeEmail(newEmail: String, password: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val res = apiService.changeEmail(mapOf("newEmail" to newEmail, "password" to password))
                if (res.isSuccessful && res.body()?.success == true) {
                    onSuccess()
                } else {
                    onError(res.body()?.error?.message ?: "Failed to update email")
                }
            } catch (e: Exception) {
                onError("Cannot reach server")
            }
        }
    }

    fun resetProfileAction() { _profileAction.value = DataState.Idle }
}
