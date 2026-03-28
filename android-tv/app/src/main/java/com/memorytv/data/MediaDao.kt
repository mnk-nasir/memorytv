package com.memorytv.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "media_cache")
data class MediaCacheEntity(
    @PrimaryKey val id:     String,
    val title:  String,
    val url:    String,
    val thumb:  String,
    val date:   String = "",
    val type:   String = "photo",
    val source: String = "drive",
    val loc:    String = "",
    val people: String = "",
)

@Dao
interface MediaDao {
    @Query("SELECT * FROM media_cache ORDER BY date DESC")
    fun observeAll(): Flow<List<MediaCacheEntity>>

    @Query("SELECT * FROM media_cache ORDER BY date DESC")
    suspend fun getAll(): List<MediaCacheEntity>

    @Query("SELECT * FROM media_cache WHERE source = :source ORDER BY date DESC")
    suspend fun getBySource(source: String): List<MediaCacheEntity>

    @Query("SELECT * FROM media_cache WHERE people LIKE '%' || :name || '%'")
    suspend fun getByPerson(name: String): List<MediaCacheEntity>

    @Query("SELECT * FROM media_cache WHERE loc LIKE '%' || :location || '%'")
    suspend fun getByLocation(location: String): List<MediaCacheEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<MediaCacheEntity>)

    @Query("DELETE FROM media_cache WHERE source = :source")
    suspend fun deleteBySource(source: String)

    @Query("DELETE FROM media_cache")
    suspend fun clearAll()
}

@Database(entities = [MediaCacheEntity::class], version = 1, exportSchema = false)
abstract class MemoryTVDatabase : RoomDatabase() {
    abstract fun mediaDao(): MediaDao

    companion object {
        const val DB_NAME = "memorytv.db"
    }
}
