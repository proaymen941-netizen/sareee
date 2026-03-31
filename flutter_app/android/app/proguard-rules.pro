# Flutter WebView
-keep class io.flutter.** { *; }
-keep class io.flutter.embedding.** { *; }
-keep class io.flutter.plugin.** { *; }
-dontwarn io.flutter.**

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# WebView
-keep class * extends android.webkit.WebViewClient { *; }
-keep class * extends android.webkit.WebChromeClient { *; }

# App
-keep class com.tamtom.store.** { *; }

# Kotlin
-keep class kotlin.** { *; }
-dontwarn kotlin.**

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
