# Étape 1 : Compilation avec Maven
FROM maven:3.9.14-eclipse-temurin-21-alpine AS build
WORKDIR /app

RUN apk update && apk upgrade --no-cache

COPY pom.xml .

RUN mvn dependency:go-offline -B

COPY src ./src

RUN mvn clean package -DskipTests

# Étape 2 : Exécution de l'application
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar /opt/app.jar

EXPOSE 8080

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

ENTRYPOINT ["java", "-jar", "/opt/app.jar"]
