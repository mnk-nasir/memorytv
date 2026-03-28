package com.memorytv.data

import com.memorytv.auth.GoogleAuthManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

data class MediaItem(
    val id:      String,
    val title:   String,
    val url:     String,
    val thumb:   String,
    val date:    String  = "",
    val type:    String  = "photo",   // "photo" | "video" | "album"
    val source:  String  = "drive",   // "drive" | "photos" | "apple" | "local"
    val loc:     String  = "",
    val people:  String  = "",
)

/**
 * MediaRepository
 * Single source of truth for media items across all connected sources.
 * Fetches from Google Photos API, Google Drive API, and Apple CloudKit.
 */
@Singleton
class MediaRepository @Inject constructor(
    private val googleAuth: GoogleAuthManager,
    private val httpClient: OkHttpClient,
    private val localCache: MediaDao,
) {

    // ── PHOTOS LIBRARY API ────────────────────────────────────────────
    suspend fun fetchGooglePhotos(
        pageToken: String? = null,
        personFilter: String? = null,
        albumId:  String? = null,
    ): List<MediaItem> = withContext(Dispatchers.IO) {

        val token = googleAuth.getAccessToken() ?: return@withContext emptyList()
        val bodyJson = buildString {
            append("{\"pageSize\":50")
            if (albumId != null) append(",\"albumId\":\"$albumId\"")
            if (pageToken != null) append(",\"pageToken\":\"$pageToken\"")
            append("}")
        }

        val request = Request.Builder()
            .url("https://photoslibrary.googleapis.com/v1/mediaItems:search")
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Content-Type", "application/json")
            .post(okhttp3.RequestBody.create(okhttp3.MediaType.parse("application/json"), bodyJson))
            .build()

        runCatching {
            val response = httpClient.newCall(request).execute()
            val json = JSONObject(response.body()!!.string())
            val items = json.optJSONArray("mediaItems") ?: return@withContext emptyList()

            (0 until items.length()).map { i ->
                val item = items.getJSONObject(i)
                val meta = item.optJSONObject("mediaMetadata") ?: JSONObject()
                val isVideo = item.optString("mimeType").startsWith("video/")
                MediaItem(
                    id     = item.getString("id"),
                    title  = item.optString("filename", "Untitled"),
                    url    = item.getString("baseUrl") + if (isVideo) "=dv" else "=d",
                    thumb  = item.getString("baseUrl") + "=w400-h240-c",
                    date   = meta.optString("creationTime", "").take(7),
                    type   = if (isVideo) "video" else "photo",
                    source = "photos",
                )
            }.also { cached -> localCache.insertAll(cached.map { it.toCacheEntity() }) }

        }.getOrElse { e ->
            e.printStackTrace()
            // Fall back to local cache
            localCache.getBySource("photos").map { it.toMediaItem() }
        }
    }

    // ── GOOGLE DRIVE API ──────────────────────────────────────────────
    suspend fun fetchGoogleDriveMedia(): List<MediaItem> = withContext(Dispatchers.IO) {
        val token = googleAuth.getAccessToken() ?: return@withContext emptyList()
        val query = "mimeType+contains+'image/'+or+mimeType+contains+'video/'"
        val fields = "files(id,name,mimeType,thumbnailLink,createdTime,imageMediaMetadata)"

        val request = Request.Builder()
            .url("https://www.googleapis.com/drive/v3/files?q=$query&fields=$fields&pageSize=50")
            .addHeader("Authorization", "Bearer $token")
            .build()

        runCatching {
            val response = httpClient.newCall(request).execute()
            val json  = JSONObject(response.body()!!.string())
            val files = json.optJSONArray("files") ?: return@withContext emptyList()

            (0 until files.length()).map { i ->
                val file    = files.getJSONObject(i)
                val isVideo = file.optString("mimeType").startsWith("video/")
                MediaItem(
                    id     = file.getString("id"),
                    title  = file.optString("name", "Untitled"),
                    url    = "https://drive.google.com/uc?id=${file.getString("id")}",
                    thumb  = file.optString("thumbnailLink", ""),
                    date   = file.optString("createdTime", "").take(7),
                    type   = if (isVideo) "video" else "photo",
                    source = "drive",
                )
            }
        }.getOrElse { emptyList() }
    }

    // ── APPLE CLOUDKIT ────────────────────────────────────────────────
    /**
     * Apple CloudKit requires:
     * 1. Apple Developer account
     * 2. CloudKit container configured at https://icloud.developer.apple.com
     * 3. CloudKit JS or native CloudKit framework
     *
     * On Android TV, use the web-based CloudKit JS via a WebView token exchange,
     * or implement server-side CloudKit API calls using your container's API token.
     *
     * Container: iCloud.com.yourapp.memorytv
     * API Token: Generate in CloudKit Dashboard → API Access
     */
    suspend fun fetchApplePhotos(apiToken: String): List<MediaItem> = withContext(Dispatchers.IO) {
        val containerID = "iCloud.com.yourapp.memorytv"
        val environment = "production"
        val url = "https://api.apple-cloudkit.com/database/1/$containerID/$environment/private/records/query"

        val bodyJson = """
            {
              "query": {
                "recordType": "CPLAsset",
                "filterBy": []
              },
              "resultsLimit": 50
            }
        """.trimIndent()

        val request = Request.Builder()
            .url(url)
            .addHeader("X-Apple-CloudKit-Request-KeyID", apiToken)
            .addHeader("Content-Type", "application/json")
            .post(okhttp3.RequestBody.create(okhttp3.MediaType.parse("application/json"), bodyJson))
            .build()

        runCatching {
            val response = httpClient.newCall(request).execute()
            val json    = JSONObject(response.body()!!.string())
            val records = json.optJSONArray("records") ?: return@withContext emptyList()

            (0 until records.length()).map { i ->
                val record = records.getJSONObject(i)
                val fields = record.optJSONObject("fields") ?: JSONObject()
                MediaItem(
                    id     = record.optString("recordName", "apple_$i"),
                    title  = fields.optJSONObject("originalFilename")?.optString("value", "Photo") ?: "Photo",
                    url    = fields.optJSONObject("resOriginalRes")?.optJSONObject("value")?.optString("downloadURL") ?: "",
                    thumb  = fields.optJSONObject("resJPEGThumbRes")?.optJSONObject("value")?.optString("downloadURL") ?: "",
                    date   = "",
                    type   = if (fields.optJSONObject("mediaSubtype") != null) "video" else "photo",
                    source = "apple",
                )
            }
        }.getOrElse { emptyList() }
    }

    // ── COMBINED FETCH ────────────────────────────────────────────────
    suspend fun fetchAll(): List<MediaItem> {
        val drive  = fetchGoogleDriveMedia()
        val photos = fetchGooglePhotos()
        return (photos + drive).sortedByDescending { it.date }
    }
}

// Extension helpers for Room cache
fun MediaItem.toCacheEntity() = MediaCacheEntity(id, title, url, thumb, date, type, source, loc, people)
fun MediaCacheEntity.toMediaItem() = MediaItem(id, title, url, thumb, date, type, source, loc, people)
