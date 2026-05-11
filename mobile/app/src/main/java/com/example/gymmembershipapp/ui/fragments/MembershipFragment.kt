package com.example.gymmembershipapp.ui.fragments

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.gymmembershipapp.databinding.FragmentMembershipBinding
import com.example.gymmembershipapp.ui.activities.MainActivity
import com.example.gymmembershipapp.ui.activities.PaymentActivity
import com.example.gymmembershipapp.ui.adapters.MembershipAdapter
import com.example.gymmembershipapp.viewmodel.DataState
import kotlinx.coroutines.launch

class MembershipFragment : Fragment() {

    private var _binding: FragmentMembershipBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentMembershipBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val activity = requireActivity() as MainActivity
        val vm = activity.membershipViewModel
        val isAdmin = activity.tokenManager.isAdmin()

        if (isAdmin) binding.cardAdminWarning.visibility = View.VISIBLE

        binding.rvPlans.layoutManager = LinearLayoutManager(requireContext())

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
                        val adapter = MembershipAdapter(state.data, isAdmin) { plan ->
                            if (!isAdmin) {
                                Intent(requireContext(), PaymentActivity::class.java).also {
                                    it.putExtra("planId", plan.id)
                                    it.putExtra("planName", plan.name)
                                    it.putExtra("planPrice", plan.price)
                                    it.putExtra("planDuration", plan.durationMonths)
                                    startActivity(it)
                                }
                            }
                        }
                        binding.rvPlans.adapter = adapter
                    }
                    is DataState.Error -> {
                        binding.progress.visibility = View.GONE
                        binding.tvError.text = state.message
                        binding.tvError.visibility = View.VISIBLE
                    }
                    else -> {}
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
