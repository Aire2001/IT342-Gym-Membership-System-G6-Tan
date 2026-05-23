package com.example.gymmembershipapp.network

import android.content.Context
import android.content.SharedPreferences

class TokenManager(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun saveEmail(email: String) {
        prefs.edit().putString(KEY_EMAIL, email).apply()
    }

    fun getEmail(): String? = prefs.getString(KEY_EMAIL, null)

    fun saveName(firstName: String, lastName: String) {
        prefs.edit()
            .putString(KEY_FIRST_NAME, firstName)
            .putString(KEY_LAST_NAME, lastName)
            .apply()
    }

    fun getFirstName(): String? = prefs.getString(KEY_FIRST_NAME, null)
    fun getLastName(): String? = prefs.getString(KEY_LAST_NAME, null)

    fun saveRole(role: String) {
        prefs.edit().putString(KEY_ROLE, role).apply()
    }

    fun getRole(): String = prefs.getString(KEY_ROLE, "USER") ?: "USER"

    fun isAdmin(): Boolean = getRole().equals("ADMIN", ignoreCase = true)

    fun saveProfilePicture(url: String?) {
        prefs.edit().putString(KEY_PROFILE_PICTURE, url).apply()
    }

    fun getProfilePicture(): String? = prefs.getString(KEY_PROFILE_PICTURE, null)

    fun saveIsOAuthUser(isOAuth: Boolean) {
        prefs.edit().putBoolean(KEY_IS_OAUTH, isOAuth).apply()
    }

    fun getIsOAuthUser(): Boolean = prefs.getBoolean(KEY_IS_OAUTH, false)

    fun clearAll() {
        prefs.edit().clear().apply()
    }

    fun isLoggedIn(): Boolean = !getToken().isNullOrEmpty()

    companion object {
        private const val PREFS_NAME = "gym_membership_prefs"
        private const val KEY_TOKEN = "jwt_token"
        private const val KEY_EMAIL = "user_email"
        private const val KEY_FIRST_NAME = "first_name"
        private const val KEY_LAST_NAME = "last_name"
        private const val KEY_ROLE = "user_role"
        private const val KEY_PROFILE_PICTURE = "profile_picture"
        private const val KEY_IS_OAUTH = "is_oauth_user"
    }
}
