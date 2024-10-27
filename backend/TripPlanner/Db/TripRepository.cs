using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Domain.DbModels;

public class TripRepository
{
    private readonly string _connectionString;

    public TripRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<List<TripDbm>> GetAllTripsAsync(CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString);
        return (await db.QueryAsync<TripDbm>("SELECT * FROM Trip WHERE is_active = 1")).AsList();
    }

    public async Task<TripDbm?> GetTripByIdAsync(int id, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString);
        return await db.QuerySingleOrDefaultAsync<TripDbm>("SELECT * FROM Trip WHERE Id = @Id", new { Id = id });
    }

    public async Task AddTripAsync(TripDbm trip, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString);
        var sqlQuery = "INSERT INTO Trip (Name, Description, is_active) VALUES (@Name, @Description, @is_active)";
        await db.ExecuteAsync(sqlQuery, trip);
    }

    public async Task UpdateTripAsync(TripDbm trip, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString);
        var sqlQuery = "UPDATE Trip SET Name = @Name, Description = @Description, is_active = @is_active WHERE Id = @Id";
        await db.ExecuteAsync(sqlQuery, trip);
    }

    public async Task DeleteTripAsync(int id, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString);
        var sqlQuery = "DELETE FROM Trip WHERE Id = @Id";
        await db.ExecuteAsync(sqlQuery, new { Id = id });
    }
}