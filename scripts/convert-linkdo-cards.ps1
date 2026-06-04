<#
.SYNOPSIS
Converts account JSON files into one-line-per-card TXT for LinkDo/chain-shop card import.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File .\convert-linkdo-cards.ps1 -Path "C:\Users\You\Desktop\codex pool\10-1"

.EXAMPLE
powershell -ExecutionPolicy Bypass -File .\convert-linkdo-cards.ps1 -Path "C:\Users\You\Desktop\codex pool\10-1" -Output "linkdo-cards.txt"

.EXAMPLE
powershell -ExecutionPolicy Bypass -File .\convert-linkdo-cards.ps1 -Path "C:\Users\You\Desktop\codex pool\10-1" -WithEmailPrefix

.EXAMPLE
powershell -ExecutionPolicy Bypass -STA -File .\convert-linkdo-cards.ps1 -PickFolder
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Path = (Get-Location).Path,

    [string]$Output = "linkdo-cards.txt",

    [int]$MaxLength = 5600,

    [switch]$WithEmailPrefix,

    [switch]$Recursive,

    [switch]$PickFolder
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-SinglePath {
    param([string]$LiteralPath)

    $resolved = @(Resolve-Path -LiteralPath $LiteralPath)
    if ($resolved.Count -ne 1) {
        throw "Path must resolve to exactly one item: $LiteralPath"
    }

    return $resolved[0].Path
}

function Get-JsonFiles {
    param(
        [string]$InputPath,
        [switch]$UseRecursive
    )

    $item = Get-Item -LiteralPath $InputPath
    if (-not $item.PSIsContainer) {
        if ($item.Extension -ne ".json") {
            throw "Input file is not a .json file: $InputPath"
        }

        return @($item)
    }

    $params = @{
        LiteralPath = $item.FullName
        Filter      = "*.json"
        File        = $true
    }

    if ($UseRecursive) {
        $params["Recurse"] = $true
    }

    return @(Get-ChildItem @params | Sort-Object FullName)
}

function Get-OutputPath {
    param(
        [string]$InputPath,
        [string]$OutputValue
    )

    if ([System.IO.Path]::IsPathRooted($OutputValue)) {
        return $OutputValue
    }

    $item = Get-Item -LiteralPath $InputPath
    $baseDir = if ($item.PSIsContainer) { $item.FullName } else { $item.DirectoryName }

    return Join-Path $baseDir $OutputValue
}

if ($PickFolder) {
    Add-Type -AssemblyName System.Windows.Forms

    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = "Select the folder containing account JSON files"
    $dialog.ShowNewFolderButton = $false

    if (Test-Path -LiteralPath $Path) {
        $initialItem = Get-Item -LiteralPath $Path
        $dialog.SelectedPath = if ($initialItem.PSIsContainer) {
            $initialItem.FullName
        } else {
            $initialItem.DirectoryName
        }
    }

    if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
        Write-Host "Canceled."
        exit 1
    }

    $Path = $dialog.SelectedPath
}

$inputPath = Resolve-SinglePath -LiteralPath $Path
$files = @(Get-JsonFiles -InputPath $inputPath -UseRecursive:$Recursive)
if ($files.Count -eq 0) {
    throw "No .json files found in: $inputPath"
}

$rows = New-Object System.Collections.Generic.List[object]
$failures = New-Object System.Collections.Generic.List[object]

foreach ($file in $files) {
    try {
        $raw = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
        $json = $raw | ConvertFrom-Json
        $line = $json | ConvertTo-Json -Compress -Depth 100

        if ($WithEmailPrefix) {
            $emailProp = $json.PSObject.Properties["email"]
            $label = if ($null -ne $emailProp -and -not [string]::IsNullOrWhiteSpace([string]$emailProp.Value)) {
                [string]$emailProp.Value
            } else {
                $file.BaseName
            }

            $line = "$label $line"
        }

        $rows.Add([pscustomobject]@{
            Name   = $file.Name
            Length = $line.Length
            Line   = $line
        })
    } catch {
        $failures.Add([pscustomobject]@{
            Name  = $file.Name
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

$outputPath = Get-OutputPath -InputPath $inputPath -OutputValue $Output
$outputDir = Split-Path -Parent $outputPath
if (-not [string]::IsNullOrWhiteSpace($outputDir) -and -not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$lines = [string[]]($rows | ForEach-Object { $_.Line })
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($outputPath, $lines, $utf8NoBom)

$overLimit = @($rows | Where-Object { $_.Length -gt $MaxLength })
$maxLengthValue = ($rows | Measure-Object -Property Length -Maximum).Maximum

Write-Host ("Output: {0}" -f $outputPath)
Write-Host ("Cards: {0}" -f $rows.Count)
Write-Host ("Max length: {0}" -f $maxLengthValue)
Write-Host ("UTF-8 BOM: false")

if ($overLimit.Count -gt 0) {
    Write-Host ("Over limit ({0} chars): {1}" -f $MaxLength, $overLimit.Count)
    foreach ($row in $overLimit) {
        Write-Host ("  - {0}: {1}" -f $row.Name, $row.Length)
    }

    exit 2
}

Write-Host "All cards are within length limit."
