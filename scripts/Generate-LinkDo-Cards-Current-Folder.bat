@echo off
setlocal

set "TARGET=%~1"
if "%TARGET%"=="" set "TARGET=%~dp0"

set "LINKDO_BAT_PATH=%~f0"
set "LINKDO_TARGET=%TARGET%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $bat=$env:LINKDO_BAT_PATH; $target=$env:LINKDO_TARGET; $text=[System.IO.File]::ReadAllText($bat, [System.Text.Encoding]::UTF8); $marker='# POWERSHELL_PAYLOAD'; $idx=$text.LastIndexOf($marker); if ($idx -lt 0) { throw 'Missing PowerShell payload.' }; $code=$text.Substring($idx + $marker.Length); & ([scriptblock]::Create($code)) -Path $target"
set "RESULT=%ERRORLEVEL%"
echo.

if "%RESULT%"=="0" (
  echo Done. Import linkdo-cards.txt from this folder.
  goto :pause_and_exit
)

if "%RESULT%"=="2" (
  echo Finished with warning. Some cards are over the length limit.
  goto :pause_and_exit
)

echo Failed. Check the messages above.

:pause_and_exit
if not "%LINKDO_NO_PAUSE%"=="1" pause
exit /b %RESULT%

# POWERSHELL_PAYLOAD
param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [string]$Output = "linkdo-cards.txt",

    [int]$MaxLength = 5600
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$resolved = @(Resolve-Path -LiteralPath $Path)
if ($resolved.Count -ne 1) {
    throw "Path must resolve to exactly one item: $Path"
}

$item = Get-Item -LiteralPath $resolved[0].Path
$directory = if ($item.PSIsContainer) { $item.FullName } else { $item.DirectoryName }

$files = @(Get-ChildItem -LiteralPath $directory -Filter "*.json" -File | Sort-Object FullName)
if ($files.Count -eq 0) {
    throw "No .json files found in: $directory"
}

$rows = New-Object System.Collections.Generic.List[object]
$failures = New-Object System.Collections.Generic.List[object]

foreach ($file in $files) {
    try {
        $raw = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
        $json = $raw | ConvertFrom-Json
        $line = $json | ConvertTo-Json -Compress -Depth 100

        $rows.Add([pscustomobject]@{
            Name = $file.Name
            Length = $line.Length
            Line = $line
        })
    }
    catch {
        $failures.Add([pscustomobject]@{
            Name = $file.Name
            Error = $_.Exception.Message
        })
    }
}

if ($failures.Count -gt 0) {
    Write-Host "Invalid JSON files:"
    foreach ($failure in $failures) {
        Write-Host ("  - {0}: {1}" -f $failure.Name, $failure.Error)
    }

    throw "Stopped because one or more JSON files could not be converted."
}

$outputPath = Join-Path $directory $Output
$lines = [string[]]($rows | ForEach-Object { $_.Line })
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($outputPath, $lines, $utf8NoBom)

$overLimit = @($rows | Where-Object { $_.Length -gt $MaxLength })
$maxLengthValue = ($rows | Measure-Object -Property Length -Maximum).Maximum

Write-Host ("Output: {0}" -f $outputPath)
Write-Host ("Cards: {0}" -f $rows.Count)
Write-Host ("Max length: {0}" -f $maxLengthValue)
Write-Host "UTF-8 BOM: false"

if ($overLimit.Count -gt 0) {
    Write-Host ("Over limit ({0} chars): {1}" -f $MaxLength, $overLimit.Count)
    foreach ($row in $overLimit) {
        Write-Host ("  - {0}: {1}" -f $row.Name, $row.Length)
    }

    exit 2
}

Write-Host "All cards are within length limit."
