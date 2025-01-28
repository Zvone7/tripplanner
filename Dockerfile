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
EXPOSE 5156

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/ .
RUN dotnet restore TripPlanner/Web/Web.csproj
# ignore warning CS8618 - non nullable properties are not initialized
# ignore warning CS8602 - possible dereference of a null reference
# ignore warning CS8604 - possible null reference argument
RUN dotnet publish TripPlanner/Web/Web.csproj -c Release -o /app/publish /p:NoWarn=CS8618 /p:NoWarn=CS8602 /p:NoWarn=CS8604

# Stage 3: Combine frontend and backend
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=frontend-builder /app/.next ./wwwroot


# Expose Next.js frontend port
# For the frontend
EXPOSE 3000  

ENTRYPOINT ["dotnet", "Web.dll"]
