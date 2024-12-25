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

    public async Task<List<TripDbm>> GetAllActiveAsync(int userId, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        return (await db.QueryAsync<TripDbm>("SELECT * FROM Trip t " +
                                             "inner join app_user_to_trip aut on aut.trip_id = t.id " +
                                             "WHERE t.is_active = 1 " +
                                             "and aut.app_user_id=@userId", new { userId = userId })).AsList();
    }

    public async Task<TripDbm?> GetAsync(int tripId, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        return await db.QuerySingleOrDefaultAsync<TripDbm>("SELECT * FROM Trip WHERE id = @Id ", new { Id = tripId });
    }

    public async Task<TripDbm> CreateAsync(int userId, TripDbm trip, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        var sqlQuery = "INSERT INTO Trip (Name, Description, is_active) VALUES (@Name, @Description, @is_active)";
        await db.ExecuteAsync(sqlQuery, trip);
        var createdTrip = await db.QuerySingleOrDefaultAsync<TripDbm>("SELECT * FROM Trip WHERE Name = @Name AND Description = @Description", trip);
        var sqlQuery2 = "INSERT INTO app_user_to_trip (app_user_id, trip_id) VALUES (@userId, @tripId)";
        await db.ExecuteAsync(sqlQuery2, new { userId = userId, tripId = createdTrip.Id });
        return createdTrip;
    }

    public async Task<TripDbm> UpdateAsync(TripDbm trip, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        var sqlQuery = "UPDATE Trip SET Name = @Name, Description = @Description, is_active = @is_active WHERE Id = @Id";
        await db.ExecuteAsync(sqlQuery, trip);
        var updatedTrip = await db.QuerySingleOrDefaultAsync<TripDbm>("SELECT * FROM Trip WHERE Id = @Id", new { Id = trip.Id });
        return updatedTrip;
    }

    public async Task DeleteAsync(int tripId, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        // instead of delete set as inactive
        var sqlQuery = "UPDATE Trip SET is_active = 0 WHERE Id = @Id";
        await db.ExecuteAsync(sqlQuery, new { Id = tripId });
    }

    public async Task<bool> ThrowIfUserDoesntHaveAccessToTripAsync(int userId, int tripId, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        var isUSerOwnedTrip = await db.QuerySingleOrDefaultAsync<int>("SELECT top 1 * FROM app_user_to_trip WHERE app_user_id = @userId AND trip_id = @Id", new { userId = userId, Id = tripId });
        return isUSerOwnedTrip == 1;
    }
}