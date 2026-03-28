package com.memorytv.ui

import android.os.Bundle
import android.view.KeyEvent
import androidx.activity.viewModels
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import com.memorytv.databinding.ActivityMainBinding
import com.memorytv.tv.ChannelPlayerActivity
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

/**
 * MainActivity — Root TV launcher activity.
 * Hosts the home, channels, sources, and settings fragments.
 * Delegates D-pad / remote control key events to the active fragment.
 */
@AndroidEntryPoint
class MainActivity : FragmentActivity() {

    private lateinit var binding: ActivityMainBinding
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupNavigation()
        observeState()
    }

    private fun setupNavigation() {
        binding.navHome.setOnClickListener    { showFragment(HomeFragment()) }
        binding.navChannels.setOnClickListener { showFragment(ChannelsFragment()) }
        binding.navSources.setOnClickListener  { showFragment(SourcesFragment()) }
        binding.navSettings.setOnClickListener { showFragment(SettingsFragment()) }

        binding.btnPlayAll.setOnClickListener {
            ChannelPlayerActivity.launch(this, channelId = "all")
        }

        // Show home by default
        if (savedInstanceState == null) showFragment(HomeFragment())
    }

    private fun showFragment(fragment: androidx.fragment.app.Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(binding.fragmentContainer.id, fragment)
            .commit()
    }

    private fun observeState() {
        lifecycleScope.launch {
            viewModel.syncState.collect { state ->
                binding.syncIndicator.text = when (state) {
                    SyncState.SYNCING  -> "Syncing…"
                    SyncState.DONE     -> ""
                    SyncState.ERROR    -> "Sync error"
                    SyncState.IDLE     -> ""
                }
            }
        }
    }

    // ── D-PAD / REMOTE NAVIGATION ──────────────────────────────────────
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        return when (keyCode) {
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_ENTER,
            KeyEvent.KEYCODE_BUTTON_A -> {
                // Let the focused view handle selection
                super.onKeyDown(keyCode, event)
            }
            KeyEvent.KEYCODE_MEDIA_PLAY,
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                ChannelPlayerActivity.launch(this, channelId = "all")
                true
            }
            KeyEvent.KEYCODE_BACK -> {
                if (supportFragmentManager.backStackEntryCount > 0) {
                    supportFragmentManager.popBackStack(); true
                } else super.onKeyDown(keyCode, event)
            }
            else -> super.onKeyDown(keyCode, event)
        }
    }
}
