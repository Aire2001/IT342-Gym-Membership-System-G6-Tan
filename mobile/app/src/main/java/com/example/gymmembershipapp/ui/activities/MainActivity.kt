package com.example.gymmembershipapp.ui.activities

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.example.gymmembershipapp.R
import com.example.gymmembershipapp.databinding.ActivityMainBinding
import com.example.gymmembershipapp.network.RetrofitClient
import com.example.gymmembershipapp.network.TokenManager
import com.example.gymmembershipapp.ui.fragments.AdminDashboardFragment
import com.example.gymmembershipapp.ui.fragments.DashboardFragment
import com.example.gymmembershipapp.ui.fragments.MembershipFragment
import com.example.gymmembershipapp.ui.fragments.PaymentHistoryFragment
import com.example.gymmembershipapp.ui.fragments.ProfileFragment
import com.example.gymmembershipapp.viewmodel.AdminViewModel
import com.example.gymmembershipapp.viewmodel.AdminViewModelFactory
import com.example.gymmembershipapp.viewmodel.AuthViewModel
import com.example.gymmembershipapp.viewmodel.AuthViewModelFactory
import com.example.gymmembershipapp.viewmodel.MembershipViewModel
import com.example.gymmembershipapp.viewmodel.MembershipViewModelFactory

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    lateinit var tokenManager: TokenManager
    lateinit var authViewModel: AuthViewModel
    lateinit var membershipViewModel: MembershipViewModel
    lateinit var adminViewModel: AdminViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tokenManager = TokenManager(this)

        if (!tokenManager.isLoggedIn()) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        val apiService = RetrofitClient.createService(tokenManager)
        authViewModel = ViewModelProvider(this, AuthViewModelFactory(apiService, tokenManager))[AuthViewModel::class.java]
        membershipViewModel = ViewModelProvider(this, MembershipViewModelFactory(apiService))[MembershipViewModel::class.java]
        adminViewModel = ViewModelProvider(this, AdminViewModelFactory(apiService, tokenManager))[AdminViewModel::class.java]

        val isAdmin = tokenManager.isAdmin()

        // Build bottom nav
        binding.bottomNav.menu.clear()
        if (isAdmin) {
            binding.bottomNav.inflateMenu(R.menu.bottom_nav_menu)
            // Add admin tab
            binding.bottomNav.menu.add(0, R.id.nav_admin, 4, "Admin")
        } else {
            binding.bottomNav.inflateMenu(R.menu.bottom_nav_menu)
        }

        if (savedInstanceState == null) {
            showDashboard(isAdmin)
        }

        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_dashboard -> { showDashboard(isAdmin); true }
                R.id.nav_plans -> { showFragment(MembershipFragment()); true }
                R.id.nav_history -> { showFragment(PaymentHistoryFragment()); true }
                R.id.nav_profile -> { showFragment(ProfileFragment()); true }
                R.id.nav_admin -> { showFragment(AdminDashboardFragment()); true }
                else -> false
            }
        }
    }

    private fun showDashboard(isAdmin: Boolean) {
        showFragment(if (isAdmin) AdminDashboardFragment() else DashboardFragment())
    }

    fun showFragment(fragment: androidx.fragment.app.Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .commit()
    }

    fun logout() {
        authViewModel.logout()
        startActivity(Intent(this, LoginActivity::class.java))
        finishAffinity()
    }
}
