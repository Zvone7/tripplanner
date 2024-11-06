using System.Data;
using Dapper;
using Domain.DbModels;
using Domain.Settings;
using Microsoft.Data.SqlClient;

public class OptionRepository{
    private readonly string _connectionString_;

    public OptionRepository(AppSettings appSettings)
    {
        _connectionString_ = appSettings.DbConnString;
    }

    public async Task<List<TripOptionDbm>> GetOptionsByTripIdAsync(int tripId, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        return (await db.QueryAsync<TripOptionDbm>("SELECT * FROM TripOption WHERE trip_id = @trip_id", new { trip_id = tripId })).AsList();
    }

    public async Task<TripOptionDbm?> GetOptionByIdAsync(int id, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        return await db.QuerySingleOrDefaultAsync<TripOptionDbm>("SELECT * FROM TripOption WHERE id = @id", new { id = id });
    }

    public async Task CreateOptionAsync(TripOptionDbm option, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        var sqlQuery = "INSERT INTO TripOption (trip_id, nickname, start_date, end_date, total_cost) VALUES (@trip_id, @nickname, @start_date, @end_date, @total_cost)";
        await db.ExecuteAsync(sqlQuery, option);
    }

    public async Task UpdateOptionAsync(TripOptionDbm option, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        var sqlQuery = "UPDATE TripOption SET trip_id = @trip_id, nickname = @nickname, start_date = @start_date, end_date = @end_date, total_cost = @total_cost WHERE id = @id";
        await db.ExecuteAsync(sqlQuery, option);
    }

    public async Task DeleteOptionAsync(int id, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        var sqlQuery = "DELETE FROM TripOption WHERE id = @id";
        await db.ExecuteAsync(sqlQuery, new { id = id });
    }
}