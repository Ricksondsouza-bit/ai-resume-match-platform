param(
    [string]$AdminUser = "postgres",
    [string]$HostName = "localhost",
    [string]$Port = "5432",
    [string]$AppDatabase = "resume_match",
    [string]$AppUser = "resume_match",
    [string]$AppPassword = "resume_match"
)

$ErrorActionPreference = "Stop"

function Resolve-Psql {
    $command = Get-Command psql -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $candidates = @(
        "$env:ProgramFiles\PostgreSQL\18\bin\psql.exe",
        "$env:ProgramFiles\PostgreSQL\17\bin\psql.exe",
        "$env:ProgramFiles\PostgreSQL\16\bin\psql.exe",
        "$env:ProgramFiles\PostgreSQL\15\bin\psql.exe",
        "$env:ProgramFiles\PostgreSQL\14\bin\psql.exe",
        "$env:ProgramFiles\PostgreSQL\13\bin\psql.exe"
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    throw "Could not find psql. Add PostgreSQL bin to PATH or update this script with your psql.exe path."
}

function Invoke-PsqlScalar {
    param(
        [string]$Database,
        [string]$Sql
    )

    $result = & $psql -h $HostName -p $Port -U $AdminUser -d $Database -tAc $Sql
    if ($LASTEXITCODE -ne 0) {
        throw "Could not connect as PostgreSQL admin user '$AdminUser'. Check that the password is correct, or pass a different admin user with -AdminUser."
    }

    return $result
}

function Invoke-PsqlCommand {
    param(
        [string]$Database,
        [string[]]$Arguments
    )

    & $psql -h $HostName -p $Port -U $AdminUser -d $Database -v ON_ERROR_STOP=1 @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL command failed while connected to database '$Database'."
    }
}

function Invoke-PsqlCommandAsAppUser {
    param(
        [string]$Database,
        [string[]]$Arguments
    )

    $previousPassword = $env:PGPASSWORD
    try {
        $env:PGPASSWORD = $AppPassword
        & $psql -h $HostName -p $Port -U $AppUser -d $Database -v ON_ERROR_STOP=1 @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "PostgreSQL command failed while connected as app user '$AppUser'."
        }
    }
    finally {
        $env:PGPASSWORD = $previousPassword
    }
}

$psql = Resolve-Psql
$repoRoot = Split-Path -Parent $PSScriptRoot
$initSql = Join-Path $repoRoot "database\init.sql"

Write-Host "Using psql: $psql"
Write-Host "You may be prompted for the PostgreSQL admin password for user '$AdminUser'."
Write-Host "Password input is invisible while typing. Type it and press Enter."

$roleExists = Invoke-PsqlScalar -Database "postgres" -Sql "SELECT 1 FROM pg_roles WHERE rolname = '$AppUser';"
if (-not $roleExists -or -not $roleExists.Trim()) {
    Write-Host "Creating PostgreSQL role '$AppUser'..."
    Invoke-PsqlCommand -Database "postgres" -Arguments @("-c", "CREATE USER $AppUser WITH PASSWORD '$AppPassword';")
}
else {
    Write-Host "Role '$AppUser' already exists."
}

$databaseExists = Invoke-PsqlScalar -Database "postgres" -Sql "SELECT 1 FROM pg_database WHERE datname = '$AppDatabase';"
$createdDatabase = $false
if (-not $databaseExists -or -not $databaseExists.Trim()) {
    Write-Host "Creating PostgreSQL database '$AppDatabase'..."
    Invoke-PsqlCommand -Database "postgres" -Arguments @("-c", "CREATE DATABASE $AppDatabase OWNER $AppUser;")
    $createdDatabase = $true
}
else {
    Write-Host "Database '$AppDatabase' already exists."
}

Write-Host "Granting database privileges to '$AppUser'..."
Invoke-PsqlCommand -Database "postgres" -Arguments @("-c", "ALTER DATABASE $AppDatabase OWNER TO $AppUser;")
Invoke-PsqlCommand -Database $AppDatabase -Arguments @("-c", "GRANT ALL ON SCHEMA public TO $AppUser;")
Invoke-PsqlCommand -Database $AppDatabase -Arguments @("-c", "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $AppUser;")
Invoke-PsqlCommand -Database $AppDatabase -Arguments @("-c", "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $AppUser;")
Invoke-PsqlCommand -Database $AppDatabase -Arguments @("-c", "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO $AppUser;")
Invoke-PsqlCommand -Database $AppDatabase -Arguments @("-c", "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO $AppUser;")

if ($createdDatabase) {
    Write-Host "Applying database schema..."
    Invoke-PsqlCommandAsAppUser -Database $AppDatabase -Arguments @("-f", $initSql)
}
else {
    Write-Host "Database already existed; permissions were refreshed and schema reapply was skipped."
}

Write-Host "Local PostgreSQL is ready."
