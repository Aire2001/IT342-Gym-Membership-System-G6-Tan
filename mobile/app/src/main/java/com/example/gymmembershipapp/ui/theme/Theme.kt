package com.example.gymmembershipapp.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// FitLife Gym – matches web blue/purple palette
val Blue600  = Color(0xFF2563EB)
val Blue50   = Color(0xFFEFF6FF)
val Indigo500 = Color(0xFF6366F1)
val Purple600 = Color(0xFF7C3AED)
val Gray50   = Color(0xFFF9FAFB)
val Gray900  = Color(0xFF111827)
val Gray500  = Color(0xFF6B7280)
val Emerald500 = Color(0xFF10B981)

private val LightColorScheme = lightColorScheme(
    primary              = Blue600,
    onPrimary            = Color.White,
    primaryContainer     = Blue50,
    onPrimaryContainer   = Color(0xFF1E3A8A),
    secondary            = Indigo500,
    onSecondary          = Color.White,
    secondaryContainer   = Color(0xFFEEF2FF),
    onSecondaryContainer = Color(0xFF312E81),
    tertiary             = Emerald500,
    onTertiary           = Color.White,
    tertiaryContainer    = Color(0xFFD1FAE5),
    onTertiaryContainer  = Color(0xFF064E3B),
    background           = Gray50,
    surface              = Color.White,
    onBackground         = Gray900,
    onSurface            = Gray900,
    onSurfaceVariant     = Gray500,
    outline              = Color(0xFFE5E7EB),
    error                = Color(0xFFEF4444),
    onError              = Color.White,
    errorContainer       = Color(0xFFFEE2E2),
    onErrorContainer     = Color(0xFF7F1D1D),
)

@Composable
fun GymMembershipAppTheme(
    content: @Composable () -> Unit
) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Blue600.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
