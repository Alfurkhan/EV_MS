# ================================
# Stage 1: Build the application
# ================================
FROM eclipse-temurin:21-jdk-jammy AS build

WORKDIR /workspace

# Copy the entire repository because this is a Gradle multi-module project
COPY . .

# Make Gradle wrapper executable
RUN chmod +x gradlew

# Build only the Email Service
RUN ./gradlew :email-service:bootJar --no-daemon


# ================================
# Stage 2: Run the application
# ================================
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy the executable Spring Boot JAR
COPY --from=build /workspace/email-service/build/libs/email-service-0.0.1-SNAPSHOT.jar app.jar

# JVM options
ENV JAVA_OPTS="-Djava.net.preferIPv4Stack=true -XX:+UseContainerSupport -Djava.security.egd=file:/dev/./urandom"

# Render provides the PORT environment variable
EXPOSE 9091

# Start the application
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]