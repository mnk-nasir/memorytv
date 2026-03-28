package com.memorytv.auth

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.viewModels
import androidx.lifecycle.lifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

/**
 * OAuthCallbackActivity
 * Receives the OAuth redirect deep link: memorytv://oauth
 * Extracts the auth code / token and passes it back to the calling activity.
 */
@AndroidEntryPoint
class OAuthCallbackActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleIntent(it) }
    }

    private fun handleIntent(intent: Intent) {
        val uri = intent.data ?: run { finish(); return }

        when {
            // Google OAuth implicit flow token
            uri.fragment?.contains("access_token") == true -> {
                val fragment = Uri.parse("?" + uri.fragment)
                val token      = fragment.getQueryParameter("access_token")
                val expiresIn  = fragment.getQueryParameter("expires_in")?.toLongOrNull() ?: 3600L
                if (token != null) {
                    broadcastToken("google", token, expiresIn)
                }
            }
            // Google Auth Code flow
            uri.getQueryParameter("code") != null && uri.getQueryParameter("state") == "google" -> {
                val code = uri.getQueryParameter("code")!!
                broadcastAuthCode("google", code)
            }
            // Apple Sign In
            uri.getQueryParameter("code") != null && uri.getQueryParameter("state") == "apple" -> {
                val code    = uri.getQueryParameter("code")!!
                val idToken = uri.getQueryParameter("id_token")
                broadcastAuthCode("apple", code, idToken)
            }
        }
        finish()
    }

    private fun broadcastToken(provider: String, token: String, expiresIn: Long) {
        val intent = Intent("com.memorytv.OAUTH_TOKEN").apply {
            putExtra("provider",   provider)
            putExtra("token",      token)
            putExtra("expires_in", expiresIn)
        }
        sendBroadcast(intent)
    }

    private fun broadcastAuthCode(provider: String, code: String, idToken: String? = null) {
        val intent = Intent("com.memorytv.OAUTH_CODE").apply {
            putExtra("provider", provider)
            putExtra("code",     code)
            idToken?.let { putExtra("id_token", it) }
        }
        sendBroadcast(intent)
    }
}
