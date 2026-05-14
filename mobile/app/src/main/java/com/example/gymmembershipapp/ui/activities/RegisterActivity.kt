package com.example.gymmembershipapp.ui.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import com.example.gymmembershipapp.databinding.ActivityRegisterBinding
import com.example.gymmembershipapp.network.RetrofitClient
import com.example.gymmembershipapp.network.TokenManager
import com.example.gymmembershipapp.viewmodel.AuthState
import com.example.gymmembershipapp.viewmodel.AuthViewModel
import com.example.gymmembershipapp.viewmodel.AuthViewModelFactory
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private lateinit var authViewModel: AuthViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val tokenManager = TokenManager(this)
        val apiService = RetrofitClient.createService(tokenManager)
        authViewModel = ViewModelProvider(
            this,
            AuthViewModelFactory(apiService, tokenManager)
        )[AuthViewModel::class.java]

        binding.btnRegister.setOnClickListener {
            val first = binding.etFirstname.text?.toString()?.trim() ?: ""
            val last = binding.etLastname.text?.toString()?.trim() ?: ""
            val email = binding.etEmail.text?.toString()?.trim() ?: ""
            val pw = binding.etPassword.text?.toString() ?: ""
            val cpw = binding.etConfirmPassword.text?.toString() ?: ""

            if (first.isBlank() || last.isBlank() || email.isBlank() || pw.isBlank()) {
                showError("All fields are required.")
                return@setOnClickListener
            }
            if (pw != cpw) {
                showError("Passwords do not match.")
                return@setOnClickListener
            }
            if (pw.length < 6) {
                showError("Password must be at least 6 characters.")
                return@setOnClickListener
            }
            authViewModel.register(first, last, email, pw, cpw)
        }

        binding.tvLogin.setOnClickListener { finish() }

        lifecycleScope.launch {
            authViewModel.authState.collect { state ->
                when (state) {
                    is AuthState.Loading -> {
                        binding.btnRegister.isEnabled = false
                        binding.btnRegister.text = "Creating account…"
                        binding.tvError.visibility = View.GONE
                    }
                    is AuthState.Success -> {
                        startActivity(Intent(this@RegisterActivity, MainActivity::class.java))
                        finishAffinity()
                    }
                    is AuthState.Error -> {
                        binding.btnRegister.isEnabled = true
                        binding.btnRegister.text = "Create Account"
                        showError(state.message)
                    }
                    else -> {
                        binding.btnRegister.isEnabled = true
                        binding.btnRegister.text = "Create Account"
                    }
                }
            }
        }
    }

    private fun showError(msg: String) {
        binding.tvError.text = msg
        binding.tvError.visibility = View.VISIBLE
        binding.tvError.removeCallbacks(null)
        binding.tvError.postDelayed({ binding.tvError.visibility = View.GONE }, 3000)
    }
}
