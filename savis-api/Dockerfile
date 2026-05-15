# Étape 1 : Environnement de compilation et développement
FROM maven:3.9.14-eclipse-temurin-21-alpine AS development
WORKDIR /app
RUN apk update && apk upgrade --no-cache

# Cache des dépendances Maven
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copie du code source
COPY src ./src

# Par défaut en dev, on lance Spring Boot via Maven
CMD ["mvn", "spring-boot:run", "-Dspring-boot.run.profiles=dev"]

# Étape 2 : Build pour la production
FROM development AS build
RUN mvn clean package -DskipTests

# Étape 3 : Image finale de production ultra-légère
FROM eclipse-temurin:21-jre-alpine AS production
WORKDIR /app
COPY --from=build /app/target/*.jar /opt/app.jar
EXPOSE 8080
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring
ENTRYPOINT ["java", "-jar", "/opt/app.jar"]
