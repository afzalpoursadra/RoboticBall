plugins {
    `java-gradle-plugin`
}

gradlePlugin {
    plugins {
        create("rust") {
            id = "rust"
            implementationClass = "RustPlugin"
        }
    }
}

repositories {
    maven { url = uri("https://maven.myket.ir") }
    google()
    mavenCentral()
}

dependencies {
    implementation(gradleApi())
    implementation("com.android.tools.build:gradle:8.11.0")
}
