package com.example.gymmembershipapp.ui.fragments

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.gymmembershipapp.data.PaymentDTO
import com.example.gymmembershipapp.databinding.FragmentPaymentHistoryBinding
import com.example.gymmembershipapp.ui.activities.MainActivity
import com.example.gymmembershipapp.ui.adapters.PaymentHistoryAdapter
import com.example.gymmembershipapp.viewmodel.DataState
import kotlinx.coroutines.launch

class PaymentHistoryFragment : Fragment() {

    private var _binding: FragmentPaymentHistoryBinding? = null
    private val binding get() = _binding!!

    private var allPayments: List<PaymentDTO> = emptyList()
    private var statusFilter = "All"

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentPaymentHistoryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val activity = requireActivity() as MainActivity
        val vm = activity.membershipViewModel

        binding.rvPayments.layoutManager = LinearLayoutManager(requireContext())

        // Search
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) { applyFilters(s?.toString() ?: "") }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })

        // Filter chips
        val chips = mapOf(
            binding.chipAll to "All",
            binding.chipCompleted to "Completed",
            binding.chipPending to "Pending",
            binding.chipFailed to "Failed"
        )
        chips.forEach { (chip, filter) ->
            chip.setOnClickListener {
                chips.keys.forEach { it.isChecked = false }
                chip.isChecked = true
                statusFilter = filter
                applyFilters(binding.etSearch.text?.toString() ?: "")
            }
        }

        vm.loadPaymentHistory()

        viewLifecycleOwner.lifecycleScope.launch {
            vm.paymentHistory.collect { state ->
                when (state) {
                    is DataState.Loading -> binding.progress.visibility = View.VISIBLE
                    is DataState.Success -> {
                        binding.progress.visibility = View.GONE
                        allPayments = state.data
                        applyFilters(binding.etSearch.text?.toString() ?: "")
                    }
                    is DataState.Error -> {
                        binding.progress.visibility = View.GONE
                        binding.tvEmpty.text = state.message
                        binding.tvEmpty.visibility = View.VISIBLE
                        binding.tvEmpty.postDelayed({ binding.tvEmpty.visibility = View.GONE }, 3000)
                    }
                    else -> {}
                }
            }
        }
    }

    private fun applyFilters(query: String) {
        val filtered = allPayments.filter { p ->
            val matchSearch = query.isBlank() ||
                p.paymentReference?.contains(query, true) == true ||
                p.membershipName?.contains(query, true) == true ||
                p.paymentMethod?.contains(query, true) == true
            val matchStatus = statusFilter == "All" ||
                p.paymentStatus.equals(statusFilter, true)
            matchSearch && matchStatus
        }

        if (filtered.isEmpty()) {
            binding.tvEmpty.visibility = View.VISIBLE
            binding.tvEmpty.text = if (allPayments.isEmpty()) "No payments yet." else "No results found."
            binding.rvPayments.visibility = View.GONE
        } else {
            binding.tvEmpty.visibility = View.GONE
            binding.rvPayments.visibility = View.VISIBLE
            binding.rvPayments.adapter = PaymentHistoryAdapter(filtered)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
