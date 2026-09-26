param(
    [string]$VaultRoot,
    [string]$OutputPath,
    [int]$MaxPosts = 0
)

$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$siteRoot = (Resolve-Path (Join-Path $scriptRoot "..")).Path

if ([string]::IsNullOrWhiteSpace($VaultRoot)) {
    if (-not [string]::IsNullOrWhiteSpace($env:KANYO_OBSIDIAN_VAULT)) {
        $VaultRoot = $env:KANYO_OBSIDIAN_VAULT
    } else {
        $VaultRoot = Join-Path $siteRoot "..\..\note"
    }
}

$vaultRootPath = (Resolve-Path -LiteralPath $VaultRoot).Path

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = Join-Path $siteRoot "blog-data.json"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputPath)) {
    $OutputPath = Join-Path $siteRoot $OutputPath
}

$outputPathFull = [System.IO.Path]::GetFullPath($OutputPath)
$assetRoot = Join-Path $siteRoot "blog-assets"
New-Item -ItemType Directory -Force -Path $assetRoot | Out-Null

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$copiedAssets = @{}
$assetCount = 0

function Get-Sha1Text {
    param([string]$Text)

    $sha1 = [System.Security.Cryptography.SHA1]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
        $hash = $sha1.ComputeHash($bytes)
        return (($hash | ForEach-Object { $_.ToString("x2") }) -join "")
    } finally {
        $sha1.Dispose()
    }
}

function Get-RelativeVaultPath {
    param(
        [string]$Root,
        [string]$Path
    )

    $rootWithSlash = $Root
    if (-not $rootWithSlash.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
        $rootWithSlash += [System.IO.Path]::DirectorySeparatorChar
    }

    $rootUri = New-Object System.Uri($rootWithSlash)
    $pathUri = New-Object System.Uri($Path)
    return [System.Uri]::UnescapeDataString($rootUri.MakeRelativeUri($pathUri).ToString()).Replace("/", "\")
}

function Split-FrontMatter {
    param([string]$Text)

    if ($Text -match "(?s)\A---\r?\n(.*?)\r?\n---\r?\n?(.*)\z") {
        return @{
            Front = $matches[1]
            Body = $matches[2]
        }
    }

    return @{
        Front = ""
        Body = $Text
    }
}

function Get-FrontMatterValues {
    param([string]$FrontMatter)

    $values = @{}
    $lines = $FrontMatter -split "\r?\n"
    for ($i = 0; $i -lt $lines.Count; $i += 1) {
        $line = $lines[$i]
        if ($line -match "^\s*([A-Za-z0-9_-]+):\s*(.*)\s*$") {
            $key = $matches[1].ToLowerInvariant()
            $value = $matches[2].Trim()
            if ($value.StartsWith("[") -and $value.EndsWith("]")) {
                $items = $value.Trim("[", "]").Split(",") | ForEach-Object { $_.Trim().Trim('"', "'") } | Where-Object { $_ }
                $values[$key] = @($items)
            } elseif ([string]::IsNullOrWhiteSpace($value)) {
                $items = @()
                $j = $i + 1
                while ($j -lt $lines.Count -and $lines[$j] -match "^\s*-\s*(.+)\s*$") {
                    $items += $matches[1].Trim().Trim('"', "'")
                    $j += 1
                }
                if ($items.Count -gt 0) {
                    $values[$key] = @($items)
                    $i = $j - 1
                } else {
                    $values[$key] = ""
                }
            } else {
                $values[$key] = $value.Trim('"', "'")
            }
        }
    }

    return $values
}

function Test-IsPrivateFrontMatter {
    param([hashtable]$FrontMatter)

    foreach ($key in @("draft", "private", "unlisted")) {
        if ($FrontMatter.ContainsKey($key)) {
            $value = [string]$FrontMatter[$key]
            if ($value -match "^(true|yes|1)$") {
                return $true
            }
        }
    }

    if ($FrontMatter.ContainsKey("publish")) {
        $value = [string]$FrontMatter["publish"]
        if ($value -match "^(false|no|0)$") {
            return $true
        }
    }

    if ($FrontMatter.ContainsKey("privacy")) {
        $value = [string]$FrontMatter["privacy"]
        if ($value -match "private|secret") {
            return $true
        }
    }

    return $false
}

function Test-ShouldSkipNote {
    param(
        [string]$RelativePath,
        [hashtable]$FrontMatter
    )

    $path = $RelativePath.Replace("\", "/")
    $name = [System.IO.Path]::GetFileNameWithoutExtension($RelativePath)
    $publicPrefixes = @("0x00", "0x01", "0x02", "0x03", "0x04")
    $isPublicPrefix = $false

    foreach ($prefix in $publicPrefixes) {
        if ($path.StartsWith($prefix)) {
            $isPublicPrefix = $true
            break
        }
    }

    if (-not $isPublicPrefix) {
        return $true
    }

    if (Test-IsPrivateFrontMatter $FrontMatter) {
        return $true
    }

    $indexNoteName = -join ([char]0x7d22, [char]0x5f15)
    if ($name -eq "README" -or $name -like "ALL-IN-ONE*" -or $name -eq $indexNoteName) {
        return $true
    }

    $skipTerms = @(
        ".obsidian/",
        ".git/",
        "pet-runs/",
        "_raw_sources",
        "_assets",
        "Templates",
        "Daily"
    )

    foreach ($term in $skipTerms) {
        if ($path.Contains($term)) {
            return $true
        }
    }

    return $false
}

function Get-CategoryName {
    param([string]$RelativePath)

    $path = $RelativePath.Replace("\", "/")
    switch -Wildcard ($path) {
        "0x00*" { return "Security / CTF" }
        "0x01*" { return "Computer Systems" }
        "0x02*" { return "Embedded / IoT" }
        "0x03*" { return "Programming / Tools" }
        "0x04*" { return "General Study" }
        "0x05*" { return "Writing / Output" }
        default { return "Vault Notes" }
    }
}

function Get-NoteTitle {
    param(
        [string]$Body,
        [hashtable]$FrontMatter,
        [string]$FallbackName
    )

    if ($FrontMatter.ContainsKey("title") -and -not [string]::IsNullOrWhiteSpace([string]$FrontMatter["title"])) {
        return [string]$FrontMatter["title"]
    }

    $heading = [regex]::Match($Body, "(?m)^\s*#\s+(.+?)\s*$")
    if ($heading.Success) {
        return $heading.Groups[1].Value.Trim()
    }

    return $FallbackName
}

function ConvertTo-PlainText {
    param([string]$Markdown)

    $text = [regex]::Replace($Markdown, '(?s)```.*?```', " ")
    $text = [regex]::Replace($text, "<[^>]+>", " ")
    $text = [regex]::Replace($text, "!\[\[([^\]\|]+)(?:\|[^\]]+)?\]\]", " ")
    $text = [regex]::Replace($text, "\[\[([^\]\|]+)\|([^\]]+)\]\]", '$2')
    $text = [regex]::Replace($text, "\[\[([^\]\|]+)\]\]", '$1')
    $text = [regex]::Replace($text, "!\[[^\]]*\]\([^)]+\)", " ")
    $text = [regex]::Replace($text, "\[([^\]]+)\]\([^)]+\)", '$1')
    $text = [regex]::Replace($text, "[#>*_`~\-\|\[\]\(\)]", " ")
    $text = [regex]::Replace($text, "\s+", " ").Trim()
    return $text
}

function Get-Summary {
    param([string]$Markdown)

    $withoutCode = [regex]::Replace($Markdown, '(?s)```.*?```', " ")
    $blocks = $withoutCode -split "\r?\n\s*\r?\n"
    foreach ($block in $blocks) {
        $candidate = $block.Trim()
        if ([string]::IsNullOrWhiteSpace($candidate)) { continue }
        if ($candidate -match '^\s*(#|```|\||---|>|!\[|!\[\[)') { continue }
        if ($candidate -match '^\s*```') { continue }

        $plain = ConvertTo-PlainText $candidate
        if ($plain.Length -ge 18) {
            if ($plain.Length -gt 132) {
                return $plain.Substring(0, 132).Trim() + "..."
            }
            return $plain
        }
    }

    $fallback = ConvertTo-PlainText $Markdown
    if ($fallback.Length -gt 132) {
        return $fallback.Substring(0, 132).Trim() + "..."
    }
    return $fallback
}

function Resolve-AssetPath {
    param(
        [string]$Target,
        [string]$NoteDirectory,
        [hashtable]$AssetByName
    )

    $clean = $Target.Trim().Trim("<", ">")
    if ($clean -match "^[a-zA-Z][a-zA-Z0-9+.-]*:") {
        return $null
    }

    $clean = [System.Uri]::UnescapeDataString(($clean -split "#")[0])
    if ([string]::IsNullOrWhiteSpace($clean)) {
        return $null
    }

    $candidate = if ([System.IO.Path]::IsPathRooted($clean)) {
        $clean
    } else {
        Join-Path $NoteDirectory $clean
    }

    if (Test-Path -LiteralPath $candidate -PathType Leaf) {
        return (Resolve-Path -LiteralPath $candidate).Path
    }

    $fileName = [System.IO.Path]::GetFileName($clean)
    if ($AssetByName.ContainsKey($fileName)) {
        return $AssetByName[$fileName][0]
    }

    return $null
}

function Copy-BlogAsset {
    param(
        [string]$SourcePath,
        [string]$Slug,
        [string]$SiteRoot,
        [string]$AssetRoot
    )

    $key = "$Slug|$SourcePath"
    if ($script:copiedAssets.ContainsKey($key)) {
        return $script:copiedAssets[$key]
    }

    $slugAssetDir = Join-Path $AssetRoot $Slug
    New-Item -ItemType Directory -Force -Path $slugAssetDir | Out-Null

    $script:assetCount += 1
    $extension = [System.IO.Path]::GetExtension($SourcePath).ToLowerInvariant()
    if ([string]::IsNullOrWhiteSpace($extension)) {
        $extension = ".bin"
    }

    $assetName = ("{0:d3}-{1}{2}" -f $script:assetCount, (Get-Sha1Text $SourcePath).Substring(0, 12), $extension)
    $destPath = Join-Path $slugAssetDir $assetName
    Copy-Item -LiteralPath $SourcePath -Destination $destPath -Force

    $relative = ("blog-assets/{0}/{1}" -f $Slug, $assetName)
    $script:copiedAssets[$key] = $relative
    return $relative
}

function Rewrite-AssetLinks {
    param(
        [string]$Markdown,
        [string]$NoteDirectory,
        [string]$Slug,
        [hashtable]$AssetByName,
        [string]$SiteRoot,
        [string]$AssetRoot
    )

    $imagePattern = "!\[([^\]]*)\]\(([^)\r\n]+)\)"
    $markdown = [regex]::Replace($Markdown, $imagePattern, [System.Text.RegularExpressions.MatchEvaluator]{
        param($match)

        $alt = $match.Groups[1].Value
        $target = $match.Groups[2].Value.Trim()
        $source = Resolve-AssetPath -Target $target -NoteDirectory $NoteDirectory -AssetByName $AssetByName
        if (-not $source) {
            return $match.Value
        }

        $webPath = Copy-BlogAsset -SourcePath $source -Slug $Slug -SiteRoot $SiteRoot -AssetRoot $AssetRoot
        return "![${alt}]($webPath)"
    })

    $obsidianPattern = "!\[\[([^\]\|]+)(?:\|[^\]]+)?\]\]"
    $markdown = [regex]::Replace($markdown, $obsidianPattern, [System.Text.RegularExpressions.MatchEvaluator]{
        param($match)

        $target = $match.Groups[1].Value.Trim()
        $source = Resolve-AssetPath -Target $target -NoteDirectory $NoteDirectory -AssetByName $AssetByName
        if (-not $source) {
            return $match.Value
        }

        $webPath = Copy-BlogAsset -SourcePath $source -Slug $Slug -SiteRoot $SiteRoot -AssetRoot $AssetRoot
        $alt = [System.IO.Path]::GetFileNameWithoutExtension($source)
        return "![${alt}]($webPath)"
    })

    return $markdown
}

function Get-GitValue {
    param(
        [string]$Repo,
        [string[]]$Arguments
    )

    try {
        $result = & git -C $Repo @Arguments 2>$null
        if ($LASTEXITCODE -eq 0 -and $result) {
            return (($result | Select-Object -First 1) -as [string]).Trim()
        }
    } catch {
        return ""
    }

    return ""
}

$assetExtensions = @(".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".avif", ".pdf")
$assetByName = @{}
Get-ChildItem -LiteralPath $vaultRootPath -Recurse -File |
    Where-Object { $assetExtensions -contains $_.Extension.ToLowerInvariant() } |
    ForEach-Object {
        if (-not $assetByName.ContainsKey($_.Name)) {
            $assetByName[$_.Name] = @()
        }
        $assetByName[$_.Name] += $_.FullName
    }

$posts = @()
$skipped = 0

Get-ChildItem -LiteralPath $vaultRootPath -Recurse -File -Filter "*.md" | ForEach-Object {
    $relativePath = Get-RelativeVaultPath -Root $vaultRootPath -Path $_.FullName
    $raw = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
    $split = Split-FrontMatter $raw
    $front = Get-FrontMatterValues $split.Front

    if (Test-ShouldSkipNote -RelativePath $relativePath -FrontMatter $front) {
        $script:skipped += 1
        return
    }

    $hash = (Get-Sha1Text $relativePath).Substring(0, 12)
    $slug = "p-$hash"
    $title = Get-NoteTitle -Body $split.Body -FrontMatter $front -FallbackName $_.BaseName
    $content = Rewrite-AssetLinks -Markdown $split.Body -NoteDirectory $_.DirectoryName -Slug $slug -AssetByName $assetByName -SiteRoot $siteRoot -AssetRoot $assetRoot
    $plain = ConvertTo-PlainText $content
    $readMinutes = [Math]::Max(1, [Math]::Ceiling($plain.Length / 700))
    $tags = @()

    if ($front.ContainsKey("tags")) {
        if ($front["tags"] -is [array]) {
            $tags = @($front["tags"])
        } elseif (-not [string]::IsNullOrWhiteSpace([string]$front["tags"])) {
            $tags = @([string]$front["tags"])
        }
    }

    $posts += [ordered]@{
        id = $slug
        title = $title
        category = Get-CategoryName $relativePath
        tags = @($tags | ForEach-Object { ([string]$_).Trim("#") } | Where-Object { $_ } | Select-Object -Unique)
        summary = Get-Summary $content
        sourcePath = $relativePath.Replace("\", "/")
        updatedAt = $_.LastWriteTimeUtc.ToString("o")
        size = $_.Length
        readingMinutes = [int]$readMinutes
        content = $content
    }
}

$posts = @($posts | Sort-Object { [datetime]$_.updatedAt } -Descending)
if ($MaxPosts -gt 0) {
    $posts = @($posts | Select-Object -First $MaxPosts)
}

$categories = @(
    $posts |
        Group-Object { $_.category } |
        Sort-Object Count -Descending |
        ForEach-Object {
            [ordered]@{
                name = $_.Name
                count = $_.Count
            }
        }
)

$sourceBranch = Get-GitValue -Repo $vaultRootPath -Arguments @("branch", "--show-current")
$sourceCommit = Get-GitValue -Repo $vaultRootPath -Arguments @("rev-parse", "--short", "HEAD")
$sourceRemote = Get-GitValue -Repo $vaultRootPath -Arguments @("remote", "get-url", "origin")
$dirtyState = (& git -C $vaultRootPath status --porcelain=v1 2>$null)
$isDirty = $false
if ($LASTEXITCODE -eq 0 -and $dirtyState) {
    $isDirty = $true
}

$data = [ordered]@{
    version = 1
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    source = [ordered]@{
        vault = "note-vault"
        remote = $sourceRemote
        branch = $sourceBranch
        commit = $sourceCommit
        dirty = $isDirty
        includedFolders = @("0x00", "0x01", "0x02", "0x03", "0x04")
    }
    sync = [ordered]@{
        vaultScript = ".codex/sync-obsidian-vault.ps1"
        schedule = "09:20 / 13:20 / 18:20 / 23:20"
    }
    stats = [ordered]@{
        posts = $posts.Count
        skipped = $skipped
        copiedAssets = $assetCount
    }
    categories = $categories
    posts = $posts
}

$json = $data | ConvertTo-Json -Depth 16
[System.IO.File]::WriteAllText($outputPathFull, $json, $utf8NoBom)

Write-Host ("Exported {0} posts and {1} assets to {2}" -f $posts.Count, $assetCount, $outputPathFull)
