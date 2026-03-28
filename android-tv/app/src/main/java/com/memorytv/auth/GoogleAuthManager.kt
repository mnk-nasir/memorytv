package com.memorytv.auth

import android.content.Context
import android.content.Intent
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.FragmentActivity
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.Scope
import com.google.api.services.drive.DriveScopes
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.suspendCancellableCoroutine
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * GoogleAuthManager
 * Handles Google Sign-In with Drive + Photos scopes on Android TV.
 *
 * SETUP:
 * 1. Add your google-services.json to android-tv/app/
 *    (Download from Firebase Console or Google Cloud Console)
 * 2. Enable Google Drive API and Google Photos Library API
 *    at https://console.cloud.google.com/apis/library
 * 3. Add your Android app's SHA-1 fingerprint to the OAuth client
 */
@Singleton
class GoogleAuthManager @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    companion object {
        // Scopes required for Drive + Photos read access
        val REQUIRED_SCOPES = listOf(
            Scope(DriveScopes.DRIVE_READONLY),
            Scope("https://www.googleapis.com/auth/photoslibrary.readonly"),
        )
    }

    private val signInOptions: GoogleSignInOptions by lazy {
        GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestProfile()
            .apply { REQUIRED_SCOPES.forEach { requestScopes(it) } }
            .build()
    }

    val client: GoogleSignInClient by lazy {
        GoogleSignIn.getClient(context, signInOptions)
    }

    // ── SIGN IN ───────────────────────────────────────────────────────
    fun getSignInIntent(): Intent = client.signInIntent

    suspend fun handleSignInResult(data: Intent?): GoogleSignInAccount {
        return suspendCancellableCoroutine { cont ->
            GoogleSignIn.getSignedInAccountFromIntent(data)
                .addOnSuccessListener { account -> cont.resume(account) }
                .addOnFailureListener { e -> cont.resumeWithException(e) }
        }
    }

    // ── SIGN OUT ──────────────────────────────────────────────────────
    suspend fun signOut(): Unit = suspendCancellableCoroutine { cont ->
        client.signOut()
            .addOnCompleteListener { cont.resume(Unit) }
    }

    suspend fun revokeAccess(): Unit = suspendCancellableCoroutine { cont ->
        client.revokeAccess()
            .addOnCompleteListener { cont.resume(Unit) }
    }

    // ── STATE ─────────────────────────────────────────────────────────
    fun getLastSignedInAccount(): GoogleSignInAccount? =
        GoogleSignIn.getLastSignedInAccount(context)

    fun isSignedIn(): Boolean = getLastSignedInAccount() != null

    fun hasRequiredScopes(): Boolean {
        val account = getLastSignedInAccount() ?: return false
        return REQUIRED_SCOPES.all { GoogleSignIn.hasPermissions(account, it) }
    }

    // ── ACCESS TOKEN ──────────────────────────────────────────────────
    suspend fun getAccessToken(): String? = suspendCancellableCoroutine { cont ->
        val account = getLastSignedInAccount()
        if (account == null) { cont.resume(null); return@suspendCancellableCoroutine }

        // Use GoogleAuthUtil to get fresh token (handles refresh automatically)
        try {
            val scopeStr = REQUIRED_SCOPES.joinToString(" ") { it.scopeUri }
            val token = com.google.android.gms.auth.GoogleAuthUtil.getToken(
                context,
                account.account!!,
                "oauth2:$scopeStr"
            )
            cont.resume(token)
        } catch (e: Exception) {
            cont.resumeWithException(e)
        }
    }
}
