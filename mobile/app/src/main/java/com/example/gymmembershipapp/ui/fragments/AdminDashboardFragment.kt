package com.example.gymmembershipapp.ui.fragments

import android.os.Bundle
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.gymmembershipapp.data.AdminPaymentDTO
import com.example.gymmembershipapp.data.AdminUserDTO
import com.example.gymmembershipapp.databinding.FragmentAdminDashboardBinding
import com.example.gymmembershipapp.ui.activities.MainActivity
import com.example.gymmembershipapp.ui.adapters.AdminPaymentAdapter
import com.example.gymmembershipapp.ui.adapters.AdminPlanAdapter
import com.example.gymmembershipapp.ui.adapters.AdminUserAdapter
import com.example.gymmembershipapp.viewmodel.AdminViewModel
import com.example.gymmembershipapp.viewmodel.DataState
import com.google.android.material.tabs.TabLayout
import kotlinx.coroutines.launch

class AdminDashboardFragment : Fragment() {

    private var _binding: FragmentAdminDashboardBinding? = null
    private val binding get() = _binding!!

    private var allUsers: List<AdminUserDTO> = emptyList()
    private var allPayments: List<AdminPaymentDTO> = emptyList()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentAdminDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val activity = requireActivity() as MainActivity
        val vm = activity.adminViewModel

        binding.tabLayout.addTab(binding.tabLayout.newTab().setText("Overview"))
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText("Users"))
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText("Payments"))
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText("Plans"))

        showTab(0)

        binding.tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab) { showTab(tab.position) }
            override fun onTabUnselected(tab: TabLayout.Tab) {}
            override fun onTabReselected(tab: TabLayout.Tab) {}
        })

        binding.rvRecentPayments.layoutManager = LinearLayoutManager(requireContext())
        binding.rvRecentUsers.layoutManager = LinearLayoutManager(requireContext())
        binding.rvUsers.layoutManager = LinearLayoutManager(requireContext())
        binding.rvAdminPayments.layoutManager = LinearLayoutManager(requireContext())
        binding.rvPlans.layoutManager = LinearLayoutManager(requireContext())

        vm.loadAll()

        binding.etSearchUsers.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) { applyUserFilter(vm, s?.toString() ?: "") }
        })

        binding.etSearchPayments.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) { applyPaymentFilter(vm, s?.toString() ?: "") }
        })

        viewLifecycleOwner.lifecycleScope.launch {
            vm.adminUsers.collect { state ->
                when (state) {
                    is DataState.Loading -> binding.progress.visibility = View.VISIBLE
                    is DataState.Success -> {
                        binding.progress.visibility = View.GONE
                        allUsers = state.data
                        binding.tvMembers.text = "${allUsers.count { it.role.equals("MEMBER", ignoreCase = true) }}"
                        binding.rvRecentUsers.adapter = AdminUserAdapter(
                            allUsers.takeLast(3),
                            onEditRole = { user, role -> vm.updateUserRole(user.id, role) },
                            onDelete = { user -> vm.deleteUser(user.id) },
                            onItemClick = { user -> showUserProfileDialog(user) }
                        )
                        applyUserFilter(vm, binding.etSearchUsers.text?.toString() ?: "")
                    }
                    is DataState.Error -> binding.progress.visibility = View.GONE
                    else -> {}
                }
            }
        }

        viewLifecycleOwner.lifecycleScope.launch {
            vm.adminPayments.collect { state ->
                if (state is DataState.Success) {
                    allPayments = state.data
                    val completed = allPayments.filter { it.paymentStatus.equals("COMPLETED", ignoreCase = true) }
                    binding.tvRevenue.text = "₱${String.format("%,.0f", completed.sumOf { it.amount })}"
                    binding.tvCompleted.text = "${completed.size}"
                    binding.rvRecentPayments.adapter = AdminPaymentAdapter(
                        allPayments.takeLast(3),
                        onEditStatus = { p, status -> vm.updatePaymentStatus(p.paymentId, status) },
                        onDelete = { p -> vm.deletePayment(p.paymentId) },
                        onItemClick = { p ->
                            val user = allUsers.find { it.email.equals(p.userEmail, ignoreCase = true) }
                                ?: AdminUserDTO(id = -1, firstname = "", lastname = "", email = p.userEmail ?: "—", role = "USER", createdAt = null)
                            showUserProfileDialog(user)
                        }
                    )
                    applyPaymentFilter(vm, binding.etSearchPayments.text?.toString() ?: "")
                }
            }
        }

        viewLifecycleOwner.lifecycleScope.launch {
            vm.plans.collect { state ->
                if (state is DataState.Success) {
                    val plans = state.data
                    binding.tvPlansCount.text = "${plans.size}"
                    binding.rvPlans.adapter = AdminPlanAdapter(plans,
                        onEdit = { plan -> showPlanDialog(vm, plan.id, plan.name, plan.durationMonths, plan.price, plan.description) },
                        onDelete = { plan -> vm.deletePlan(plan.id) }
                    )
                }
            }
        }

        binding.btnAddPlan.setOnClickListener {
            showPlanDialog(vm, null, "", 1, 0.0, "")
        }
    }

    private fun applyUserFilter(vm: AdminViewModel, query: String) {
        val filtered = if (query.isBlank()) allUsers
        else allUsers.filter {
            val q = query.lowercase()
            it.firstname?.lowercase()?.contains(q) == true ||
            it.lastname?.lowercase()?.contains(q) == true ||
            it.email.lowercase().contains(q) ||
            it.role.lowercase().contains(q)
        }
        binding.rvUsers.adapter = AdminUserAdapter(filtered,
            onEditRole = { user, role -> vm.updateUserRole(user.id, role) },
            onDelete = { user -> vm.deleteUser(user.id) }
        )
        if (filtered.isEmpty()) {
            binding.tvEmptyUsers.text = if (query.isBlank()) "No users found." else "No users matching \"$query\""
            binding.tvEmptyUsers.visibility = View.VISIBLE
        } else {
            binding.tvEmptyUsers.visibility = View.GONE
        }
    }

    private fun applyPaymentFilter(vm: AdminViewModel, query: String) {
        val filtered = if (query.isBlank()) allPayments
        else allPayments.filter {
            val q = query.lowercase()
            it.paymentReference?.lowercase()?.contains(q) == true ||
            it.userEmail?.lowercase()?.contains(q) == true ||
            it.membershipName?.lowercase()?.contains(q) == true ||
            it.paymentStatus.lowercase().contains(q)
        }
        binding.rvAdminPayments.adapter = AdminPaymentAdapter(filtered,
            onEditStatus = { p, status -> vm.updatePaymentStatus(p.paymentId, status) },
            onDelete = { p -> vm.deletePayment(p.paymentId) }
        )
        if (filtered.isEmpty()) {
            binding.tvEmptyPayments.text = if (query.isBlank()) "No payments found." else "No payments matching \"$query\""
            binding.tvEmptyPayments.visibility = View.VISIBLE
        } else {
            binding.tvEmptyPayments.visibility = View.GONE
        }
    }

    private fun showTab(index: Int) {
        binding.tabOverview.visibility  = if (index == 0) View.VISIBLE else View.GONE
        binding.tabUsers.visibility     = if (index == 1) View.VISIBLE else View.GONE
        binding.tabPayments.visibility  = if (index == 2) View.VISIBLE else View.GONE
        binding.tabPlans.visibility     = if (index == 3) View.VISIBLE else View.GONE
    }

    private fun showUserProfileDialog(user: AdminUserDTO) {
        val ctx = requireContext()
        val first = user.firstname ?: ""
        val last = user.lastname ?: ""
        val fullName = "$first $last".trim().ifEmpty { "—" }
        val userPayments = allPayments.filter { it.userEmail?.equals(user.email, ignoreCase = true) == true }
        val totalSpent = userPayments.filter { it.paymentStatus.equals("COMPLETED", ignoreCase = true) }.sumOf { it.amount }

        val sb = StringBuilder()
        sb.appendLine("📧  ${user.email}")
        sb.appendLine("🏷️  Role: ${user.role}")
        if (user.createdAt != null) sb.appendLine("📅  Joined: ${user.createdAt.take(10)}")
        if (user.id > 0) sb.appendLine("🔑  Account ID: #${user.id}")
        sb.appendLine()
        sb.appendLine("💳  Total Payments: ${userPayments.size}")
        sb.appendLine("💰  Total Spent: ₱${String.format("%,.2f", totalSpent)}")
        if (userPayments.isNotEmpty()) {
            sb.appendLine()
            sb.appendLine("── Payment History ──")
            userPayments.sortedByDescending { it.paymentDate }.forEach { p ->
                val status = when (p.paymentStatus.uppercase()) {
                    "COMPLETED" -> "✅"
                    "PENDING" -> "⏳"
                    else -> "❌"
                }
                sb.appendLine("$status  ${p.membershipName ?: "—"}  ₱${String.format("%,.2f", p.amount)}")
                sb.appendLine("      ${p.paymentDate?.take(10) ?: "—"}  ${p.paymentMethod ?: ""}")
            }
        }

        AlertDialog.Builder(ctx)
            .setTitle(fullName)
            .setMessage(sb.toString().trim())
            .setPositiveButton("Close", null)
            .show()
    }

    private fun showPlanDialog(
        vm: AdminViewModel,
        planId: Long?,
        name: String,
        durationMonths: Int,
        price: Double,
        description: String
    ) {
        val ctx = requireContext()
        val layout = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(64, 24, 64, 8)
        }
        val etName = EditText(ctx).apply { hint = "Plan Name"; setText(name) }
        val etDuration = EditText(ctx).apply {
            hint = "Duration (months)"
            inputType = InputType.TYPE_CLASS_NUMBER
            setText(if (durationMonths > 0) "$durationMonths" else "")
        }
        val etPrice = EditText(ctx).apply {
            hint = "Price (₱)"
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
            setText(if (price > 0) "$price" else "")
        }
        val etDesc = EditText(ctx).apply { hint = "Description"; setText(description) }
        layout.addView(etName)
        layout.addView(etDuration)
        layout.addView(etPrice)
        layout.addView(etDesc)

        AlertDialog.Builder(ctx)
            .setTitle(if (planId == null) "Add Plan" else "Edit Plan")
            .setView(layout)
            .setPositiveButton(if (planId == null) "Create" else "Save") { _, _ ->
                val n = etName.text.toString().trim()
                if (n.isBlank()) return@setPositiveButton
                val d = etDuration.text.toString().toIntOrNull() ?: 1
                val p = etPrice.text.toString().toDoubleOrNull() ?: 0.0
                val desc = etDesc.text.toString().trim()
                if (planId == null) vm.createPlan(n, d, p, desc)
                else vm.updatePlan(planId, n, d, p, desc)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
