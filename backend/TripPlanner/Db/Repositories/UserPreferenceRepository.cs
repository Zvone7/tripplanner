using System.Data;
using Dapper;
using Domain.Settings;
using Microsoft.Data.SqlClient;

namespace Db.Repositories;

public class UserPreferenceRepository
{
    private readonly string _connectionString_;
    public UserPreferenceRepository(AppSettings appSettings)
    {
        _connectionString_ = appSettings.DbConnString;
    }

    public async Task<UserPreference?> GetAsync(int userId, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        return await db.QueryFirstOrDefaultAsync<UserPreference>(
            "SELECT * FROM user_preference WHERE app_user_id = @userId", new { userId = userId });
    }

    public async Task<UserPreference> CreateAsync(UserPreference userPreference, int userId, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        await db.ExecuteAsync(
            "INSERT INTO user_preference (app_user_id, preferred_utc_offset) " +
            "VALUES (@app_user_id, @preferred_utc_offset)",
            new { 
                app_user_id = userId, 
                userPreference.preferred_utc_offset });
        return userPreference;
    }

    public async Task<UserPreference> UpdateAsync(UserPreference userPreference, int userId, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        await db.ExecuteAsync(
            "UPDATE user_preference SET preferred_utc_offset = @preferred_utc_offset " +
            "WHERE app_user_id = @userId", new { 
                userPreference.preferred_utc_offset,
                userId });
        return userPreference;
    }

}