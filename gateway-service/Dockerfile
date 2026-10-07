# ================================
# Stage 1: Build the application
# ================================
FROM eclipse-temurin:21-jdk-jammy AS build

WORKDIR /workspace

# Copy the entire repository because this is a Gradle multi-module project
COPY . .

# Make Gradle wrapper executable
RUN chmod +x gradlew

# Build only the Gateway Service
RUN ./gradlew :gateway-service:bootJar --no-daemon


# ================================
# Stage 2: Run the application
# ================================
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy the executable Spring Boot JAR
COPY --from=build /workspace/gateway-service/build/libs/gateway-service-0.0.1-SNAPSHOT.jar app.jar

# JVM options
ENV JAVA_OPTS="-Djava.net.preferIPv4Stack=true -XX:+UseContainerSupport -Djava.security.egd=file:/dev/./urandom"

# Gateway runs on 9095
EXPOSE 9095

# Start the application
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]