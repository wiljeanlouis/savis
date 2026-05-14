# Étape 1 : Compilation avec Maven
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Optionnel : pour corriger les vulnérabilités de l'image de build
RUN apk update && apk upgrade --no-cache

COPY pom.xml .
# Télécharge les dépendances en cache
RUN mvn dependency:go-offline -B

COPY src ./src

RUN mvn clean package -DskipTests

# Étape 2 : Exécution de l'application
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copie le fichier .jar généré à l'étape précédente
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Exécution en mode non-root pour la sécurité
RUN addgroup -S spring && adduser -S spring -G spring

USER spring:spring

ENTRYPOINT ["java", "-jar", "app.jar"]
