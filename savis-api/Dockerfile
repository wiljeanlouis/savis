FROM maven:3.9.16-eclipse-temurin-25-alpine AS development
WORKDIR /app
RUN apk upgrade --no-cache

COPY pom.xml .
COPY src ./src

CMD ["mvn", "spring-boot:run", "-Dspring-boot.run.profiles=dev"]

FROM development AS build
RUN --mount=type=cache,target=/root/.m2 \
  mvn clean package -Dmaven.test.skip=true -B

FROM eclipse-temurin:25-jre-alpine-3.23 AS production
WORKDIR /app
COPY --from=build /app/target/*.jar /opt/app.jar
EXPOSE 8080
RUN apk upgrade --no-cache && addgroup -S spring && adduser -S spring -G spring
USER spring:spring
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/actuator/health/readiness || exit 1
ENTRYPOINT ["java", "-jar", "/opt/app.jar"]
