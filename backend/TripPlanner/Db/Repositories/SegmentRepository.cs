using System.Data;
using Dapper;
using Domain.DbModels;
using Domain.Settings;
using Microsoft.Data.SqlClient;

public class SegmentRepository{
    private readonly string _connectionString_;

    public SegmentRepository(AppSettings appSettings)
    {
        _connectionString_ = appSettings.DbConnString;
    }

    public async Task<List<SegmentDbm>> GetSegmentsByTripIdAsync(int tripId, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        return (await db.QueryAsync<SegmentDbm>("SELECT * FROM Segment WHERE trip_id = @trip_id", new { trip_id = tripId })).AsList();
    }

    public async Task<SegmentDbm?> GetSegmentByIdAsync(int id, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        return await db.QuerySingleOrDefaultAsync<SegmentDbm>("SELECT * FROM Segment WHERE id = @id", new { id = id });
    }
    public async Task<List<SegmentDbm>> GetSegmentsByOptionIdAsync(int optionId, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        return (await db.QueryAsync<SegmentDbm>("SELECT * FROM Segment WHERE option_id = @option_id", new { option_id = optionId })).AsList();
    }

    public async Task AddSegmentAsync(SegmentDbm segment, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        var sqlQuery = "INSERT INTO Segment (trip_id, start_time, end_time, nickname, cost) VALUES (@trip_id, @start_time, @end_time, @nickname, @cost)";
        await db.ExecuteAsync(sqlQuery, segment);
    }

    public async Task UpdateSegmentAsync(SegmentDbm segment, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        var sqlQuery = "UPDATE Segment SET trip_id = @trip_id, start_time = @start_time, end_time = @end_time, nickname = @nickname, cost = @cost WHERE id = @id";
        await db.ExecuteAsync(sqlQuery, segment);
    }

    public async Task DeleteSegmentAsync(int id, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        var sqlQuery = "DELETE FROM Segment WHERE id = @id";
        await db.ExecuteAsync(sqlQuery, new { id = id });
    }
}