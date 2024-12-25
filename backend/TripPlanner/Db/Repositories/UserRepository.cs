using System.Data;
using Dapper;
using Domain.Settings;
using Microsoft.Data.SqlClient;

namespace Db.Repositories;

public class UserRepository
{
    private readonly string _connectionString_;

    public UserRepository(AppSettings appSettings)
    {
        _connectionString_ = appSettings.DbConnString;
    }

    public async Task<AppUser> CreateAsync(AppUser user, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        await db.ExecuteAsync(
            "INSERT INTO app_user (name, email, role, created_at_utc) " + 
            "VALUES (@name, @email, @role, @created_at_utc)", user);
        return user;
    }

    public async Task<AppUser?> GetAsync(int id, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        return await db.QueryFirstOrDefaultAsync<AppUser>("SELECT * FROM app_user WHERE id = @id", new { id = id });
    }

    public async Task<AppUser?> GetAsync(string email, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(_connectionString_);
        return await db.QueryFirstOrDefaultAsync<AppUser>("SELECT * FROM app_user WHERE email = @email", new { email = email });
    }
}