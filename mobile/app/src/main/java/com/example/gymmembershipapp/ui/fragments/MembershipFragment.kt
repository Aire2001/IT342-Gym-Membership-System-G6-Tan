package com.example.gymmembershipapp.ui.fragments

import android.content.Intent
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
import com.example.gymmembershipapp.data.MembershipDTO
import com.example.gymmembershipapp.databinding.FragmentMembershipBinding
import com.example.gymmembershipapp.ui.activities.MainActivity
import com.example.gymmembershipapp.ui.activities.PaymentActivity
import com.example.gymmembershipapp.ui.adapters.MembershipAdapter
import com.example.gymmembershipapp.viewmodel.AdminViewModel
import com.example.gymmembershipapp.viewmodel.DataState
import kotlinx.coroutines.launch

class MembershipFragment : Fragment() {

    private var _binding: FragmentMembershipBinding? = null
    private val binding get() = _binding!!

    private var allPlans: List<MembershipDTO> = emptyList()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentMembershipBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val activity = requireActivity() as MainActivity
        val vm = activity.membershipViewModel
        val adminVm = activity.adminViewModel
        val isAdmin = activity.tokenManager.isAdmin()

        if (isAdmin) {
            binding.cardAdminManagement.visibility = View.VISIBLE
            binding.btnAddPlan.setOnClickListener {
                showPlanDialog(adminVm, vm, null, "", 1, 0.0, "")
            }
        }

        binding.rvPlans.layoutManager = LinearLayoutManager(requireContext())

        binding.etSearchPlans.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) { applyPlanFilter(isAdmin, adminVm, vm, s?.toString() ?: "") }
        })

        vm.loadMemberships()

        viewLifecycleOwner.lifecycleScope.launch {
            vm.memberships.collect { state ->
                when (state) {
                    is DataState.Loading -> {
                        binding.progress.visibility = View.VISIBLE
                        binding.tvError.visibility = View.GONE
                    }
                    is DataState.Success -> {
                        binding.progress.visibility = View.GONE
                        allPlans = state.data
                        applyPlanFilter(isAdmin, adminVm, vm, binding.etSearchPlans.text?.toString() ?: "")
                    }
                    is DataState.Error -> {
                        binding.progress.visibility = View.GONE
                        binding.tvError.text = state.message
                        binding.tvError.visibility = View.VISIBLE
                        binding.tvError.postDelayed({ binding.tvError.visibility = View.GONE }, 3000)
                    }
                    else -> {}
                }
            }
        }
    }

    private fun applyPlanFilter(
        isAdmin: Boolean,
        adminVm: AdminViewModel,
        vm: com.example.gymmembershipapp.viewmodel.MembershipViewModel,
        query: String
    ) {
        val filtered = if (query.isBlank()) allPlans
        else allPlans.filter {
            val q = query.lowercase()
            it.name.lowercase().contains(q) || it.description.lowercase().contains(q)
        }
        binding.rvPlans.adapter = MembershipAdapter(
            filtered,
            isAdmin,
            onSelect = { plan ->
                Intent(requireContext(), PaymentActivity::class.java).also {
                    it.putExtra("planId", plan.id)
                    it.putExtra("planName", plan.name)
                    it.putExtra("planPrice", plan.price)
                    it.putExtra("planDuration", plan.durationMonths)
                    startActivity(it)
                }
            },
            onEdit = { plan ->
                showPlanDialog(adminVm, vm, plan.id, plan.name, plan.durationMonths, plan.price, plan.description)
            },
            onDelete = { plan ->
                AlertDialog.Builder(requireContext())
                    .setTitle("Delete Plan")
                    .setMessage("Delete plan \"${plan.name}\"? This cannot be undone.")
                    .setPositiveButton("Delete") { _, _ ->
                        adminVm.deletePlan(plan.id)
                        binding.root.postDelayed({ vm.loadMemberships() }, 500)
                    }
                    .setNegativeButton("Cancel", null)
                    .show()
            }
        )
        if (filtered.isEmpty() && allPlans.isNotEmpty()) {
            binding.tvEmptyPlans.text = "No plans matching \"$query\""
            binding.tvEmptyPlans.visibility = View.VISIBLE
        } else {
            binding.tvEmptyPlans.visibility = View.GONE
        }
    }

    private fun showPlanDialog(
        adminVm: AdminViewModel,
        vm: com.example.gymmembershipapp.viewmodel.MembershipViewModel,
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
                if (planId == null) adminVm.createPlan(n, d, p, desc)
                else adminVm.updatePlan(planId, n, d, p, desc)
                binding.root.postDelayed({ vm.loadMemberships() }, 500)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
