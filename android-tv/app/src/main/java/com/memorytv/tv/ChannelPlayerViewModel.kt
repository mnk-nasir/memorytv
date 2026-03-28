package com.memorytv.tv

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.memorytv.data.MediaItem
import com.memorytv.data.MediaRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChannelPlayerViewModel @Inject constructor(
    private val repository: MediaRepository,
) : ViewModel() {

    private val _channelItems = MutableStateFlow<List<MediaItem>>(emptyList())
    val channelItems: StateFlow<List<MediaItem>> = _channelItems.asStateFlow()

    private val _currentItem = MutableStateFlow<MediaItem?>(null)
    val currentItem: StateFlow<MediaItem?> = _currentItem.asStateFlow()

    private val _isPlaying = MutableStateFlow(true)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _progress = MutableStateFlow(0f)
    val progress: StateFlow<Float> = _progress.asStateFlow()

    private var currentIndex = 0
    private var slideDurationMs = 8_000L
    private var shuffleEnabled = true
    private var slideJob: Job? = null
    private var progressJob: Job? = null

    fun loadChannel(channelId: String) {
        viewModelScope.launch {
            val items = repository.fetchAll()
            val list  = if (shuffleEnabled) items.shuffled() else items
            _channelItems.value = list
            if (list.isNotEmpty()) {
                _currentItem.value = list[0]
                startSlideshow()
            }
        }
    }

    fun next() {
        val items = _channelItems.value
        if (items.isEmpty()) return
        currentIndex = (currentIndex + 1) % items.size
        _currentItem.value = items[currentIndex]
        resetProgress()
        if (_isPlaying.value) startSlideshow()
    }

    fun prev() {
        val items = _channelItems.value
        if (items.isEmpty()) return
        currentIndex = (currentIndex - 1 + items.size) % items.size
        _currentItem.value = items[currentIndex]
        resetProgress()
        if (_isPlaying.value) startSlideshow()
    }

    fun jumpTo(index: Int) {
        val items = _channelItems.value
        if (index !in items.indices) return
        currentIndex = index
        _currentItem.value = items[currentIndex]
        resetProgress()
        if (_isPlaying.value) startSlideshow()
    }

    fun togglePlay() {
        if (_isPlaying.value) pause() else resume()
    }

    fun pause() {
        _isPlaying.value = false
        slideJob?.cancel()
        progressJob?.cancel()
    }

    fun resume() {
        _isPlaying.value = true
        startSlideshow()
    }

    fun toggleShuffle() {
        shuffleEnabled = !shuffleEnabled
        val current = _channelItems.value
        _channelItems.value = if (shuffleEnabled) current.shuffled() else current.sortedByDescending { it.date }
        currentIndex = 0
        _currentItem.value = _channelItems.value.firstOrNull()
    }

    private fun startSlideshow() {
        slideJob?.cancel()
        progressJob?.cancel()
        resetProgress()

        progressJob = viewModelScope.launch {
            val step = 50L
            val totalSteps = slideDurationMs / step
            var tick = 0
            while (tick <= totalSteps) {
                _progress.value = tick.toFloat() / totalSteps
                delay(step)
                tick++
            }
        }

        slideJob = viewModelScope.launch {
            delay(slideDurationMs)
            next()
        }
    }

    private fun resetProgress() {
        progressJob?.cancel()
        slideJob?.cancel()
        _progress.value = 0f
    }
}
