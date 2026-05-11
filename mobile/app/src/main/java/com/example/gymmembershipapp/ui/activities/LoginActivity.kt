package com.example.gymmembershipapp.ui.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import com.example.gymmembershipapp.databinding.ActivityLoginBinding
import com.example.gymmembershipapp.network.RetrofitClient
import com.example.gymmembershipapp.network.TokenManager
import com.example.gymmembershipapp.viewmodel.AuthState
import com.example.gymmembershipapp.viewmodel.AuthViewModel
import com.example.gymmembershipapp.viewmodel.AuthViewModelFactory
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var authViewModel: AuthViewModel
    private lateinit var tokenManager: TokenManager

    private val RC_GOOGLE = 9001

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tokenManager = TokenManager(this)

        // Skip login if already logged in
        if (tokenManager.isLoggedIn()) {
            goToMain()
            return
        }

        val apiService = RetrofitClient.createService(tokenManager)
        authViewModel = ViewModelProvider(
            this,
            AuthViewModelFactory(apiService, tokenManager)
        )[AuthViewModel::class.java]

        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text?.toString()?.trim() ?: ""
            val password = binding.etPassword.text?.toString() ?: ""
            if (email.isBlank() || password.isBlank()) {
                showError("Email and password are required.")
                return@setOnClickListener
            }
            authViewModel.login(email, password)
        }

        binding.tvRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        binding.btnGoogle.setOnClickListener {
            startGoogleSignIn()
        }

        lifecycleScope.launch {
            authViewModel.authState.collect { state ->
                when (state) {
                    is AuthState.Loading -> {
                        binding.btnLogin.isEnabled = false
                        binding.btnLogin.text = "Signing in…"
                        binding.tvError.visibility = View.GONE
                    }
                    is AuthState.Success -> {
                        goToMain()
                    }
                    is AuthState.Error -> {
                        binding.btnLogin.isEnabled = true
                        binding.btnLogin.text = "Sign In"
                        showError(state.message)
                    }
                    else -> {
                        binding.btnLogin.isEnabled = true
                        binding.btnLogin.text = "Sign In"
                    }
                }
            }
        }
    }

    private fun startGoogleSignIn() {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(com.example.gymmembershipapp.R.string.google_web_client_id))
            .requestEmail()
            .build()
        val client = GoogleSignIn.getClient(this, gso)
        startActivityForResult(client.signInIntent, RC_GOOGLE)
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == RC_GOOGLE) {
            try {
                val account = GoogleSignIn.getSignedInAccountFromIntent(data)
                    .getResult(ApiException::class.java)
                account.idToken?.let { authViewModel.googleSignIn(it) }
            } catch (e: ApiException) {
                showError("Google Sign-In failed: ${e.statusCode}")
            }
        }
    }

    private fun showError(msg: String) {
        binding.tvError.text = msg
        binding.tvError.visibility = View.VISIBLE
    }

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
