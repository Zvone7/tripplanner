using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Domain.DbModels;
using Domain.Settings;

public class TripRepository
{
    private readonly string _connectionString_;

    public TripRepository(AppSettings appSettings)
    {
        _connectionString_ = appSettings.DbConnString;
    }

    public async Task<List<TripDbm>> GetAllTripsAsync(CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        return (await db.QueryAsync<TripDbm>("SELECT * FROM Trip WHERE is_active = 1")).AsList();
    }

    public async Task<TripDbm?> GetTripByIdAsync(int id, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        return await db.QuerySingleOrDefaultAsync<TripDbm>("SELECT * FROM Trip WHERE Id = @Id", new { Id = id });
    }

    public async Task<TripDbm> CreateTripAsync(TripDbm trip, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        var sqlQuery = "INSERT INTO Trip (Name, Description, is_active) VALUES (@Name, @Description, @is_active)";
        await db.ExecuteAsync(sqlQuery, trip);
        var createdTrip = await db.QuerySingleOrDefaultAsync<TripDbm>("SELECT * FROM Trip WHERE Name = @Name AND Description = @Description", trip);
        return createdTrip;
    }

    public async Task<TripDbm> UpdateTripAsync(TripDbm trip, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        var sqlQuery = "UPDATE Trip SET Name = @Name, Description = @Description, is_active = @is_active WHERE Id = @Id";
        await db.ExecuteAsync(sqlQuery, trip);
        var updatedTrip = await db.QuerySingleOrDefaultAsync<TripDbm>("SELECT * FROM Trip WHERE Id = @Id", new { Id = trip.Id });
        return updatedTrip;
    }

    public async Task DeleteTripAsync(int id, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        // instead of delete set as inactive
        var sqlQuery = "UPDATE Trip SET is_active = 0 WHERE Id = @Id";
        await db.ExecuteAsync(sqlQuery, new { Id = id });
    }
}