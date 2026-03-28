package com.memorytv

import android.app.Application
import androidx.room.Room
import com.memorytv.data.MediaDao
import com.memorytv.data.MemoryTVDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.HiltAndroidApp
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@HiltAndroidApp
class MemoryTVApp : Application()

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides @Singleton
    fun provideOkHttpClient(): OkHttpClient =
        OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG)
                    HttpLoggingInterceptor.Level.BODY
                else
                    HttpLoggingInterceptor.Level.NONE
            })
            .build()

    @Provides @Singleton
    fun provideDatabase(app: Application): MemoryTVDatabase =
        Room.databaseBuilder(app, MemoryTVDatabase::class.java, MemoryTVDatabase.DB_NAME)
            .fallbackToDestructiveMigration()
            .build()

    @Provides @Singleton
    fun provideMediaDao(db: MemoryTVDatabase): MediaDao = db.mediaDao()
}
