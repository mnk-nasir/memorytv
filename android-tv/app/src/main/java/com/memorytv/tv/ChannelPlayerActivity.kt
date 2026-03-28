package com.memorytv.tv

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import androidx.activity.viewModels
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import coil.load
import com.memorytv.data.MediaItem as AppMediaItem
import com.memorytv.databinding.ActivityChannelPlayerBinding
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

/**
 * ChannelPlayerActivity
 * Full-screen immersive TV slideshow / video player.
 * Supports:
 *  - Photo slideshow with configurable duration
 *  - Video playback via ExoPlayer
 *  - D-pad prev/next/play/pause
 *  - Progress bar, channel strip, captions overlay
 *  - Auto-hide controls after inactivity
 */
@AndroidEntryPoint
class ChannelPlayerActivity : FragmentActivity() {

    companion object {
        const val EXTRA_CHANNEL_ID   = "channel_id"
        const val CONTROLS_HIDE_MS   = 4_000L

        fun launch(context: Context, channelId: String) {
            context.startActivity(
                Intent(context, ChannelPlayerActivity::class.java)
                    .putExtra(EXTRA_CHANNEL_ID, channelId)
            )
        }
    }

    private lateinit var binding: ActivityChannelPlayerBinding
    private val viewModel: ChannelPlayerViewModel by viewModels()

    private var exoPlayer: ExoPlayer? = null
    private val handler = Handler(Looper.getMainLooper())
    private val hideControlsRunnable = Runnable { hideControls() }

    // ── LIFECYCLE ─────────────────────────────────────────────────────
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        keepScreenOn()
        hideSystemUI()

        binding = ActivityChannelPlayerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val channelId = intent.getStringExtra(EXTRA_CHANNEL_ID) ?: "all"
        viewModel.loadChannel(channelId)

        setupControls()
        observePlayback()
    }

    override fun onResume() {
        super.onResume()
        exoPlayer?.play()
        viewModel.resume()
    }

    override fun onPause() {
        super.onPause()
        exoPlayer?.pause()
        viewModel.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        exoPlayer?.release()
        exoPlayer = null
        handler.removeCallbacksAndMessages(null)
    }

    // ── SETUP ─────────────────────────────────────────────────────────
    private fun setupControls() {
        binding.btnPrev.setOnClickListener       { viewModel.prev(); resetHideTimer() }
        binding.btnNext.setOnClickListener       { viewModel.next(); resetHideTimer() }
        binding.btnPlayPause.setOnClickListener  { viewModel.togglePlay(); resetHideTimer() }
        binding.btnShuffle.setOnClickListener    { viewModel.toggleShuffle() }
        binding.btnExit.setOnClickListener       { finish() }
        binding.root.setOnClickListener          { showControls(); resetHideTimer() }
    }

    private fun observePlayback() {
        lifecycleScope.launch {
            viewModel.currentItem.collect { item ->
                item?.let { renderItem(it) }
            }
        }
        lifecycleScope.launch {
            viewModel.progress.collect { pct ->
                binding.progressBar.progress = (pct * 100).toInt()
            }
        }
        lifecycleScope.launch {
            viewModel.isPlaying.collect { playing ->
                binding.btnPlayPause.text = if (playing) "⏸" else "▶"
            }
        }
        lifecycleScope.launch {
            viewModel.channelItems.collect { items ->
                updateChannelStrip(items)
            }
        }
    }

    // ── RENDERING ─────────────────────────────────────────────────────
    private fun renderItem(item: AppMediaItem) {
        if (item.type == "video") {
            renderVideo(item)
        } else {
            renderPhoto(item)
        }

        // Captions
        binding.tvTitle.text    = item.title
        binding.tvSubtitle.text = buildString {
            if (item.loc.isNotBlank())    append("📍 ${item.loc}  ")
            if (item.people.isNotBlank()) append("👤 ${item.people}  ")
            if (item.date.isNotBlank())   append("📅 ${item.date}")
        }
        binding.tvChannel.text = "▶ MEMORYTV"
    }

    private fun renderPhoto(item: AppMediaItem) {
        binding.playerView.visibility = View.GONE
        binding.photoView.visibility  = View.VISIBLE
        exoPlayer?.stop()

        binding.photoView.load(item.url) {
            crossfade(600)
            placeholder(com.memorytv.R.drawable.placeholder)
        }
    }

    private fun renderVideo(item: AppMediaItem) {
        binding.photoView.visibility  = View.GONE
        binding.playerView.visibility = View.VISIBLE

        if (exoPlayer == null) {
            exoPlayer = ExoPlayer.Builder(this).build().also {
                binding.playerView.player = it
            }
        }
        exoPlayer?.apply {
            setMediaItem(MediaItem.fromUri(item.url))
            prepare()
            play()
        }
    }

    private fun updateChannelStrip(items: List<AppMediaItem>) {
        binding.channelStrip.removeAllViews()
        items.take(12).forEachIndexed { index, item ->
            val thumb = layoutInflater.inflate(
                com.memorytv.R.layout.item_channel_thumb,
                binding.channelStrip, false
            )
            thumb.setOnClickListener { viewModel.jumpTo(index) }
            binding.channelStrip.addView(thumb)
        }
    }

    // ── CONTROLS VISIBILITY ───────────────────────────────────────────
    private fun showControls() {
        binding.controlsBar.animate().alpha(1f).setDuration(200).start()
        binding.captionsOverlay.animate().alpha(1f).setDuration(200).start()
    }

    private fun hideControls() {
        binding.controlsBar.animate().alpha(0f).setDuration(600).start()
    }

    private fun resetHideTimer() {
        showControls()
        handler.removeCallbacks(hideControlsRunnable)
        handler.postDelayed(hideControlsRunnable, CONTROLS_HIDE_MS)
    }

    // ── SYSTEM UI ─────────────────────────────────────────────────────
    private fun keepScreenOn() {
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    @Suppress("DEPRECATION")
    private fun hideSystemUI() {
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_FULLSCREEN
        )
    }

    // ── D-PAD KEYS ────────────────────────────────────────────────────
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        resetHideTimer()
        return when (keyCode) {
            KeyEvent.KEYCODE_DPAD_RIGHT,
            KeyEvent.KEYCODE_MEDIA_NEXT        -> { viewModel.next(); true }
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_MEDIA_PREVIOUS    -> { viewModel.prev(); true }
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
            KeyEvent.KEYCODE_MEDIA_PLAY        -> { viewModel.togglePlay(); true }
            KeyEvent.KEYCODE_MEDIA_PAUSE       -> { viewModel.pause(); true }
            KeyEvent.KEYCODE_BACK              -> { finish(); true }
            else                               -> super.onKeyDown(keyCode, event)
        }
    }
}
