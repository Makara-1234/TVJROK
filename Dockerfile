FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY TVJROK.slnx ./

COPY src/TVJROK.API/TVJROK.API.csproj src/TVJROK.API/
COPY src/TVJROK.Application/TVJROK.Application.csproj src/TVJROK.Application/
COPY src/TVJROK.Domain/TVJROK.Domain.csproj src/TVJROK.Domain/
COPY src/TVJROK.Infrastructure/TVJROK.Infrastructure.csproj src/TVJROK.Infrastructure/
COPY src/TVJROK.Migrations.Postgres/TVJROK.Migrations.Postgres.csproj src/TVJROK.Migrations.Postgres/

RUN dotnet restore TVJROK.slnx

COPY . .

RUN dotnet publish src/TVJROK.API/TVJROK.API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "TVJROK.API.dll"]
