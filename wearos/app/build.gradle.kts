plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.compose.compiler)
}

android {
    namespace = "com.medisync.wear"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.medisync.wear"
        minSdk = 30 // Wear OS 3+
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("com.google.android.gms:play-services-wearable:18.2.0")
    implementation("androidx.wear.compose:compose-material:1.3.1")
    implementation("androidx.wear.compose:compose-foundation:1.3.1")
    implementation("androidx.wear.compose:compose-navigation:1.3.1")
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation("androidx.wear.tiles:tiles:1.3.0")
    implementation("com.google.android.horologist:horologist-tiles:0.6.14")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.8.1")
}

