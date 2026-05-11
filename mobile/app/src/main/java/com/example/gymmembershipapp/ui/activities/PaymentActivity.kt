package com.example.gymmembershipapp.ui.activities

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import com.example.gymmembershipapp.databinding.ActivityPaymentBinding
import com.example.gymmembershipapp.network.RetrofitClient
import com.example.gymmembershipapp.network.TokenManager
import com.example.gymmembershipapp.viewmodel.DataState
import com.example.gymmembershipapp.viewmodel.MembershipViewModel
import com.example.gymmembershipapp.viewmodel.MembershipViewModelFactory
import kotlinx.coroutines.launch

class PaymentActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPaymentBinding
    private lateinit var viewModel: MembershipViewModel

    private var planId: Long = 0L
    private var planName: String = ""
    private var planPrice: Double = 0.0
    private var planDuration: Int = 1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPaymentBinding.inflate(layoutInflater)
        setContentView(binding.root)

        planId = intent.getLongExtra("planId", 0L)
        planName = intent.getStringExtra("planName") ?: ""
        planPrice = intent.getDoubleExtra("planPrice", 0.0)
        planDuration = intent.getIntExtra("planDuration", 1)

        // Toolbar
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Confirm Payment"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }

        // Populate order summary
        binding.tvPlanName.text = planName
        binding.tvPlanDuration.text = "$planDuration month${if (planDuration != 1) "s" else ""}"
        binding.tvPlanPrice.text = "₱${String.format("%,.2f", planPrice)}"

        // Radio group: only one selected at a time
        val radioButtons = listOf(binding.rbGcash, binding.rbCredit, binding.rbBank)
        listOf(binding.cardGcash, binding.cardCredit, binding.cardBank).forEachIndexed { i, card ->
            card.setOnClickListener {
                radioButtons.forEach { it.isChecked = false }
                radioButtons[i].isChecked = true
            }
        }
        radioButtons.forEach { rb ->
            rb.setOnClickListener { radioButtons.forEach { it.isChecked = false }; rb.isChecked = true }
        }

        val tokenManager = TokenManager(this)
        val apiService = RetrofitClient.createService(tokenManager)
        viewModel = ViewModelProvider(this, MembershipViewModelFactory(apiService))[MembershipViewModel::class.java]

        binding.btnConfirm.setOnClickListener {
            val method = when {
                binding.rbCredit.isChecked -> "Credit Card"
                binding.rbBank.isChecked -> "Bank Transfer"
                else -> "GCash"
            }
            AlertDialog.Builder(this)
                .setTitle("Confirm Payment")
                .setMessage("Plan: $planName\nMethod: $method\nTotal: ₱${String.format("%,.2f", planPrice)}\n\nProceed?")
                .setPositiveButton("Yes, Pay Now") { _, _ ->
                    viewModel.createPayment(planId, planPrice, method)
                }
                .setNegativeButton("Cancel", null)
                .show()
        }

        lifecycleScope.launch {
            viewModel.paymentResult.collect { state ->
                when (state) {
                    is DataState.Loading -> {
                        binding.btnConfirm.isEnabled = false
                        binding.btnConfirm.text = "Processing…"
                    }
                    is DataState.Success -> {
                        showResult(
                            success = true,
                            title = if (state.data.paymentStatus?.uppercase() == "PENDING") "Payment Pending" else "Payment Successful!",
                            message = if (state.data.paymentStatus?.uppercase() == "PENDING")
                                "Your Bank Transfer is being processed."
                            else "Your $planName membership is now active!",
                            ref = state.data.paymentReference
                        )
                    }
                    is DataState.Error -> {
                        binding.btnConfirm.isEnabled = true
                        binding.btnConfirm.text = "Confirm Payment"
                        AlertDialog.Builder(this@PaymentActivity)
                            .setTitle("Payment Failed")
                            .setMessage(state.message)
                            .setPositiveButton("OK", null)
                            .show()
                    }
                    else -> {}
                }
            }
        }
    }

    private fun showResult(success: Boolean, title: String, message: String, ref: String?) {
        binding.layoutForm.visibility = View.GONE
        binding.layoutResult.visibility = View.VISIBLE
        binding.tvResultIcon.text = if (success) "✅" else "❌"
        binding.tvResultTitle.text = title
        binding.tvResultMessage.text = message
        if (ref != null) {
            binding.tvResultRef.text = ref
            binding.tvResultRef.visibility = View.VISIBLE
        }
        binding.toolbar.setNavigationOnClickListener { finish() }
    }
}
