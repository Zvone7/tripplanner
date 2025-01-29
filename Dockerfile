# Stage 1: Build frontend
FROM node:18 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Build backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/ .
RUN dotnet restore TripPlanner/Web/Web.csproj
# Ignore warning CS8618 - non nullable properties are not initialized
# Ignore warning CS8602 - possible dereference of a null reference
# Ignore warning CS8604 - possible null reference argument
RUN dotnet publish TripPlanner/Web/Web.csproj -c Release -o /app/publish /p:NoWarn=CS8618 /p:NoWarn=CS8602 /p:NoWarn=CS8604

# Stage 3: Final container with both frontend & backend
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Install Node.js for the frontend
RUN apt-get update && apt-get install -y \
    curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Copy .NET backend
COPY --from=build /app/publish /app/backend

# Copy appsettings.json from the backend to the correct location
COPY --from=build /src/TripPlanner/Web/appsettings.json /app/

# Copy Next.js frontend
COPY --from=frontend-builder /app/frontend /app/frontend

# Install frontend dependencies for production
WORKDIR /app/frontend
RUN npm install --omit=dev

WORKDIR /app
EXPOSE 3000 5156

# Start both Next.js frontend and .NET backend
CMD ["sh", "-c", "dotnet /app/backend/Web.dll & npm start --prefix /app/frontend"]
