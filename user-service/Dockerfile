# Use lightweight official OpenJDK 21 base image (community edition)
FROM eclipse-temurin:21-jdk-jammy

# Set environment variables for JVM
# -XX:+UseContainerSupport → JVM respects container (Pod/EC2 memory limits)
# -Djava.security.egd → faster startup
ENV JAVA_OPTS="-Djava.net.preferIPv4Stack=true -XX:+UseContainerSupport -Djava.security.egd=file:/dev/./urandom"

# Expose app port
EXPOSE 8080

# Create and set working directory
WORKDIR /app

# Copy Spring Boot JAR
COPY build/libs/*.jar app.jar

# Health check (works for EC2 and EKS)
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run your app
ENTRYPOINT ["java", "-Djava.net.preferIPv4Stack=true", "-XX:+UseContainerSupport", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app/app.jar"]
 