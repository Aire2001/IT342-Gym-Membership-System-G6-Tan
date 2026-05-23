package com.example.gymmembershipapp.ui.fragments

import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.example.gymmembershipapp.R
import com.example.gymmembershipapp.databinding.FragmentProfileBinding
import com.example.gymmembershipapp.network.RetrofitClient
import com.example.gymmembershipapp.ui.activities.MainActivity
import com.example.gymmembershipapp.viewmodel.DataState
import kotlinx.coroutines.launch

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!

    private var currentPhotoUrl: String? = null
    private var pendingRemove = false

    private val pickImage = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { handlePhotoSelected(it) }
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val activity = requireActivity() as MainActivity
        val vm = activity.adminViewModel
        val tokenManager = activity.tokenManager

        // Populate basic info from token cache
        val firstName = tokenManager.getFirstName() ?: ""
        val lastName = tokenManager.getLastName() ?: ""
        val email = tokenManager.getEmail() ?: ""
        val role = tokenManager.getRole()
        val cachedPhoto = tokenManager.getProfilePicture()
        val cachedIsOAuth = tokenManager.getIsOAuthUser()

        val initials = "${firstName.firstOrNull() ?: ""}${lastName.firstOrNull() ?: ""}".uppercase().ifEmpty { "?" }
        binding.tvAvatar.text = initials
        binding.tvFullName.text = "$firstName $lastName".trim()
        binding.tvEmail.text = email
        binding.tvRole.text = role

        binding.etFirstname.setText(firstName)
        binding.etLastname.setText(lastName)

        // Show cached photo and OAuth state immediately (before API loads)
        currentPhotoUrl = cachedPhoto
        showAvatar(cachedPhoto)
        binding.cardChangePw.visibility = if (cachedIsOAuth) View.GONE else View.VISIBLE
        binding.cardChangeEmail.visibility = if (cachedIsOAuth) View.GONE else View.VISIBLE
        binding.cardSetPw.visibility = if (cachedIsOAuth) View.VISIBLE else View.GONE

        // Load full profile from backend
        vm.loadProfile()
        viewLifecycleOwner.lifecycleScope.launch {
            vm.profile.collect { state ->
                if (state is DataState.Success) {
                    binding.etFirstname.setText(state.data.firstname ?: firstName)
                    binding.etLastname.setText(state.data.lastname ?: lastName)
                    val isOAuth = state.data.isOAuthUser == true
                    binding.cardChangePw.visibility = if (isOAuth) View.GONE else View.VISIBLE
                    binding.cardChangeEmail.visibility = if (isOAuth) View.GONE else View.VISIBLE
                    binding.cardSetPw.visibility = if (isOAuth) View.VISIBLE else View.GONE
                    // Load profile photo
                    val photoUrl = state.data.profilePicture?.takeIf { it.isNotBlank() }
                    currentPhotoUrl = photoUrl
                    showAvatar(photoUrl)
                }
            }
        }

        // Change photo — open gallery
        binding.btnPickPhoto.setOnClickListener {
            pickImage.launch("image/*")
        }

        // Remove photo
        binding.btnRemovePhoto.setOnClickListener {
            AlertDialog.Builder(requireContext())
                .setTitle("Remove Photo")
                .setMessage("Remove your profile picture?")
                .setPositiveButton("Remove") { _, _ ->
                    pendingRemove = true
                    currentPhotoUrl = null
                    tokenManager.saveProfilePicture(null)
                    showAvatar(null)
                    showMsg(binding.tvProfileMsg, "Photo removed. Tap Save Profile to apply.", isError = false)
                }
                .setNegativeButton("Cancel", null)
                .show()
        }

        // Save profile
        binding.btnSaveProfile.setOnClickListener {
            val fn = binding.etFirstname.text?.toString()?.trim() ?: ""
            val ln = binding.etLastname.text?.toString()?.trim() ?: ""
            if (fn.isBlank() || ln.isBlank()) {
                showMsg(binding.tvProfileMsg, "First and last name are required.", isError = true)
                return@setOnClickListener
            }
            binding.btnSaveProfile.isEnabled = false
            binding.btnSaveProfile.text = "Saving…"
            val photoToSend = if (pendingRemove) "" else null
            vm.updateProfile(fn, ln, photoToSend,
                onSuccess = {
                    binding.btnSaveProfile.isEnabled = true
                    binding.btnSaveProfile.text = "Save Profile"
                    binding.tvFullName.text = "$fn $ln"
                    pendingRemove = false
                    showMsg(binding.tvProfileMsg, "Profile updated!", isError = false)
                },
                onError = { msg ->
                    binding.btnSaveProfile.isEnabled = true
                    binding.btnSaveProfile.text = "Save Profile"
                    showMsg(binding.tvProfileMsg, msg, isError = true)
                }
            )
        }

        // Change password
        binding.btnChangePw.setOnClickListener {
            val cur = binding.etCurrentPw.text?.toString() ?: ""
            val new = binding.etNewPw.text?.toString() ?: ""
            val con = binding.etConfirmPw.text?.toString() ?: ""
            if (cur.isBlank() || new.isBlank() || con.isBlank()) {
                showMsg(binding.tvPwMsg, "All fields are required.", isError = true)
                return@setOnClickListener
            }
            if (new != con) {
                showMsg(binding.tvPwMsg, "Passwords do not match.", isError = true)
                return@setOnClickListener
            }
            if (new.length < 6) {
                showMsg(binding.tvPwMsg, "Password must be at least 6 characters.", isError = true)
                return@setOnClickListener
            }
            binding.btnChangePw.isEnabled = false
            vm.changePassword(cur, new, con,
                onSuccess = {
                    binding.btnChangePw.isEnabled = true
                    binding.etCurrentPw.setText("")
                    binding.etNewPw.setText("")
                    binding.etConfirmPw.setText("")
                    showMsg(binding.tvPwMsg, "Password updated!", isError = false)
                },
                onError = { msg ->
                    binding.btnChangePw.isEnabled = true
                    showMsg(binding.tvPwMsg, msg, isError = true)
                }
            )
        }

        // Set password (OAuth users)
        binding.btnSetPw.setOnClickListener {
            val newPw = binding.etSetNewPw.text?.toString() ?: ""
            val confirmPw = binding.etSetConfirmPw.text?.toString() ?: ""
            if (newPw.isBlank() || confirmPw.isBlank()) {
                showMsg(binding.tvSetPwMsg, "All fields are required.", isError = true)
                return@setOnClickListener
            }
            if (newPw.length < 6) {
                showMsg(binding.tvSetPwMsg, "Password must be at least 6 characters.", isError = true)
                return@setOnClickListener
            }
            if (newPw != confirmPw) {
                showMsg(binding.tvSetPwMsg, "Passwords do not match.", isError = true)
                return@setOnClickListener
            }
            binding.btnSetPw.isEnabled = false
            binding.btnSetPw.text = "Setting…"
            vm.setPassword(newPw, confirmPw,
                onSuccess = {
                    binding.btnSetPw.isEnabled = true
                    binding.btnSetPw.text = "Set Password"
                    binding.etSetNewPw.setText("")
                    binding.etSetConfirmPw.setText("")
                    binding.cardSetPw.visibility = View.GONE
                    binding.cardChangePw.visibility = View.VISIBLE
                    binding.cardChangeEmail.visibility = View.VISIBLE
                    showMsg(binding.tvSetPwMsg, "Password set! You can now log in with email.", isError = false)
                },
                onError = { msg ->
                    binding.btnSetPw.isEnabled = true
                    binding.btnSetPw.text = "Set Password"
                    showMsg(binding.tvSetPwMsg, msg, isError = true)
                }
            )
        }

        // Change email
        binding.btnChangeEmail.setOnClickListener {
            val newEmail = binding.etNewEmail.text?.toString()?.trim() ?: ""
            val password = binding.etEmailPassword.text?.toString() ?: ""
            if (newEmail.isBlank() || password.isBlank()) {
                showMsg(binding.tvEmailMsg, "All fields are required.", isError = true)
                return@setOnClickListener
            }
            if (!android.util.Patterns.EMAIL_ADDRESS.matcher(newEmail).matches()) {
                showMsg(binding.tvEmailMsg, "Invalid email address.", isError = true)
                return@setOnClickListener
            }
            AlertDialog.Builder(requireContext())
                .setTitle("Change Email")
                .setMessage("Are you sure? You will be signed out after changing your email.")
                .setPositiveButton("Yes, Change") { _, _ ->
                    binding.btnChangeEmail.isEnabled = false
                    binding.btnChangeEmail.text = "Saving…"
                    vm.changeEmail(newEmail, password,
                        onSuccess = {
                            binding.btnChangeEmail.isEnabled = true
                            binding.btnChangeEmail.text = "Update Email"
                            binding.etNewEmail.setText("")
                            binding.etEmailPassword.setText("")
                            showMsg(binding.tvEmailMsg, "Email updated! Signing you out…", isError = false)
                            binding.tvEmailMsg.postDelayed({ activity.logout() }, 2000)
                        },
                        onError = { msg ->
                            binding.btnChangeEmail.isEnabled = true
                            binding.btnChangeEmail.text = "Update Email"
                            showMsg(binding.tvEmailMsg, msg, isError = true)
                        }
                    )
                }
                .setNegativeButton("Cancel", null)
                .show()
        }

        // Logout
        binding.btnLogout.setOnClickListener {
            AlertDialog.Builder(requireContext())
                .setTitle("Sign Out")
                .setMessage("Are you sure you want to log out of FitLife Gym?")
                .setPositiveButton("Yes, Logout") { _, _ -> activity.logout() }
                .setNegativeButton("Cancel", null)
                .show()
        }
    }

    private fun handlePhotoSelected(uri: Uri) {
        val activity = requireActivity() as MainActivity
        val vm = activity.adminViewModel
        val tokenManager = activity.tokenManager
        binding.btnPickPhoto.isEnabled = false
        showMsg(binding.tvProfileMsg, "Uploading photo…", isError = false)
        vm.uploadPhoto(requireContext(), uri,
            onSuccess = { url ->
                currentPhotoUrl = url
                pendingRemove = false
                showAvatar(url)
                tokenManager.saveProfilePicture(url)
                binding.btnPickPhoto.isEnabled = true
                showMsg(binding.tvProfileMsg, "Photo uploaded! Tap Save Profile to keep it.", isError = false)
            },
            onError = { msg ->
                binding.btnPickPhoto.isEnabled = true
                showMsg(binding.tvProfileMsg, msg, isError = true)
            }
        )
    }

    private fun showAvatar(url: String?) {
        if (!url.isNullOrBlank()) {
            val fullUrl = if (url.startsWith("http")) url
                         else "${RetrofitClient.BASE_URL.trimEnd('/')}$url"
            binding.ivAvatar.visibility = View.VISIBLE
            binding.tvAvatar.visibility = View.GONE
            binding.btnRemovePhoto.visibility = View.VISIBLE
            Glide.with(this)
                .load(fullUrl)
                .circleCrop()
                .diskCacheStrategy(DiskCacheStrategy.NONE)
                .skipMemoryCache(true)
                .into(binding.ivAvatar)
        } else {
            binding.ivAvatar.visibility = View.GONE
            binding.tvAvatar.visibility = View.VISIBLE
            binding.btnRemovePhoto.visibility = View.GONE
        }
    }

    private fun showMsg(tv: android.widget.TextView, msg: String, isError: Boolean) {
        tv.text = msg
        tv.setBackgroundColor(if (isError) 0xFFFEE2E2.toInt() else 0xFFD1FAE5.toInt())
        tv.setTextColor(if (isError) 0xFFDC2626.toInt() else 0xFF065F46.toInt())
        tv.visibility = View.VISIBLE
        tv.removeCallbacks(null)
        tv.postDelayed({ tv.visibility = View.GONE }, 3000)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
