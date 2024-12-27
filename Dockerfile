# Stage 1: Build frontend
FROM node:18 AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Build backend
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/ .
RUN dotnet restore TripPlanner/Web/Web.csproj
RUN dotnet publish TripPlanner/Web/Web.csproj -c Release -o /app/publish

# Stage 3: Combine frontend and backend
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=frontend-builder /app/out ./wwwroot
ENTRYPOINT ["dotnet", "TripPlanner.dll"]
