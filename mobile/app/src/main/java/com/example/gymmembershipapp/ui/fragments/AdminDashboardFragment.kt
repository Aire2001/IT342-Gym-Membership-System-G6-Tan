package com.example.gymmembershipapp.ui.fragments

import android.os.Bundle
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
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

        viewLifecycleOwner.lifecycleScope.launch {
            vm.adminUsers.collect { state ->
                when (state) {
                    is DataState.Loading -> binding.progress.visibility = View.VISIBLE
                    is DataState.Success -> {
                        binding.progress.visibility = View.GONE
                        val users = state.data
                        binding.tvMembers.text = "${users.count { it.role.equals("MEMBER", ignoreCase = true) }}"

                        binding.rvUsers.adapter = AdminUserAdapter(users,
                            onEditRole = { user, role -> vm.updateUserRole(user.id, role) },
                            onDelete = { user -> vm.deleteUser(user.id) }
                        )
                        binding.rvRecentUsers.adapter = AdminUserAdapter(users.takeLast(3),
                            onEditRole = { user, role -> vm.updateUserRole(user.id, role) },
                            onDelete = { user -> vm.deleteUser(user.id) }
                        )
                    }
                    is DataState.Error -> binding.progress.visibility = View.GONE
                    else -> {}
                }
            }
        }

        viewLifecycleOwner.lifecycleScope.launch {
            vm.adminPayments.collect { state ->
                if (state is DataState.Success) {
                    val payments = state.data
                    val completed = payments.filter { it.paymentStatus.equals("COMPLETED", ignoreCase = true) }
                    binding.tvRevenue.text = "₱${String.format("%,.0f", completed.sumOf { it.amount })}"
                    binding.tvCompleted.text = "${completed.size}"

                    binding.rvAdminPayments.adapter = AdminPaymentAdapter(payments,
                        onEditStatus = { p, status -> vm.updatePaymentStatus(p.paymentId, status) },
                        onDelete = { p -> vm.deletePayment(p.paymentId) }
                    )
                    binding.rvRecentPayments.adapter = AdminPaymentAdapter(payments.takeLast(3),
                        onEditStatus = { p, status -> vm.updatePaymentStatus(p.paymentId, status) },
                        onDelete = { p -> vm.deletePayment(p.paymentId) }
                    )
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

    private fun showTab(index: Int) {
        binding.tabOverview.visibility  = if (index == 0) View.VISIBLE else View.GONE
        binding.tabUsers.visibility     = if (index == 1) View.VISIBLE else View.GONE
        binding.tabPayments.visibility  = if (index == 2) View.VISIBLE else View.GONE
        binding.tabPlans.visibility     = if (index == 3) View.VISIBLE else View.GONE
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
