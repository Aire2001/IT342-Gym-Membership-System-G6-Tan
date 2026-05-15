package com.example.gymmembershipapp.ui.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.gymmembershipapp.data.DashboardData
import com.example.gymmembershipapp.databinding.FragmentDashboardBinding
import com.example.gymmembershipapp.network.RetrofitClient
import com.example.gymmembershipapp.ui.activities.MainActivity
import com.example.gymmembershipapp.viewmodel.DataState
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Calendar

class DashboardFragment : Fragment() {

    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val activity = requireActivity() as MainActivity
        val vm = activity.membershipViewModel
        val tokenManager = activity.tokenManager

        // Avatar + greeting
        val firstName = tokenManager.getFirstName() ?: "Member"
        val lastName = tokenManager.getLastName() ?: ""
        val initials = "${firstName.firstOrNull() ?: ""}${lastName.firstOrNull() ?: ""}".uppercase().ifEmpty { "?" }
        binding.tvAvatar.text = initials

        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        binding.tvGreeting.text = when {
            hour < 12 -> "Good morning,"
            hour < 18 -> "Good afternoon,"
            else -> "Good evening,"
        }
        binding.tvName.text = "$firstName $lastName".trim()
        binding.tvDate.text = LocalDate.now().format(DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy"))

        // Quick action buttons
        binding.btnUpgrade.setOnClickListener { activity.showFragment(MembershipFragment()) }
        binding.btnHistory.setOnClickListener { activity.showFragment(PaymentHistoryFragment()) }

        // Load dashboard data
        vm.loadDashboard()

        viewLifecycleOwner.lifecycleScope.launch {
            vm.dashboard.collect { state ->
                when (state) {
                    is DataState.Loading -> binding.progress.visibility = View.VISIBLE
                    is DataState.Success -> {
                        binding.progress.visibility = View.GONE
                        populateDashboard(state.data)
                    }
                    is DataState.Error -> binding.progress.visibility = View.GONE
                    else -> {}
                }
            }
        }

        // Fetch motivational quote via Retrofit
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = RetrofitClient.createService(tokenManager).getQuote()
                if (response.isSuccessful) {
                    val data = response.body()?.data
                    if (!data?.quote.isNullOrEmpty()) {
                        binding.tvQuote.text = data!!.quote
                        binding.tvQuoteAuthor.text = "— ${data.author}"
                        binding.cardQuote.visibility = View.VISIBLE
                    }
                }
            } catch (_: Exception) {}
        }
    }

    private fun populateDashboard(data: DashboardData) {
        // Plan badge
        binding.tvPlanName.text = data.membershipName ?: "No Plan"
        binding.tvPlanStatus.text = "● ${data.membershipStatus ?: "Inactive"}"

        // Stat cards
        binding.tvStatPayments.text = "${data.totalPayments ?: 0}"
        binding.tvStatSpent.text = "₱${String.format("%,.0f", data.totalSpent ?: 0.0)}"

        val daysActive = if (data.startDate != null) {
            try {
                val start = LocalDate.parse(data.startDate.take(10))
                ChronoUnit.DAYS.between(start, LocalDate.now()).coerceAtLeast(0)
            } catch (_: Exception) { 0L }
        } else 0L
        binding.tvStatDays.text = "$daysActive"

        // Membership card
        binding.tvMembershipName.text = data.membershipName ?: "—"
        binding.tvMembershipStatus.text = data.membershipStatus ?: "—"
        binding.tvMembershipPrice.text = data.membershipPrice?.let { "₱${String.format("%,.2f", it)}" } ?: "—"
        binding.tvMembershipDuration.text = data.membershipDurationMonths?.let { "$it month${if (it != 1) "s" else ""}" } ?: "—"

        // Period progress
        binding.tvStartDate.text = data.startDate?.take(10) ?: "—"
        binding.tvEndDate.text = data.expirationDate?.take(10) ?: "—"

        if (data.startDate != null && data.expirationDate != null) {
            try {
                val start = LocalDate.parse(data.startDate.take(10))
                val end = LocalDate.parse(data.expirationDate.take(10))
                val total = ChronoUnit.DAYS.between(start, end).toInt()
                val daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), end).coerceAtLeast(0).toInt()
                val pct = if (total > 0) ((total - daysLeft).toFloat() / total * 100).toInt() else 0

                binding.progressPeriod.progress = pct
                binding.tvPctUsed.text = "$pct% used"
                binding.tvDaysLeft.text = if (daysLeft > 0) "$daysLeft days left" else "Expired"
            } catch (_: Exception) {}
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
