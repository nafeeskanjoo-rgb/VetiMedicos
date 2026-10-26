# VetiCare - Simple Local HTTP Server
# Double-click this file (Run with PowerShell) to start server

$port = 5500
$root = $PSScriptRoot

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "   VetiCare Local Server Running!" -ForegroundColor Green
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Open browser and go to:" -ForegroundColor White
Write-Host "  http://localhost:$port" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor Gray
Write-Host ""

# Auto-open browser
Start-Process "http://localhost:$port"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $req     = $context.Request
        $res     = $context.Response

        # Build file path
        $urlPath = $req.Url.LocalPath.TrimStart('/')
        if ($urlPath -eq '' -or $urlPath -eq '/') { $urlPath = 'index.html' }
        $filePath = Join-Path $root $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext   = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime  = switch ($ext) {
                '.html' { 'text/html; charset=utf-8' }
                '.css'  { 'text/css; charset=utf-8' }
                '.js'   { 'application/javascript; charset=utf-8' }
                '.json' { 'application/json' }
                '.png'  { 'image/png' }
                '.jpg'  { 'image/jpeg' }
                '.jpeg' { 'image/jpeg' }
                '.gif'  { 'image/gif' }
                '.svg'  { 'image/svg+xml' }
                '.ico'  { 'image/x-icon' }
                '.webp' { 'image/webp' }
                '.woff' { 'font/woff' }
                '.woff2'{ 'font/woff2' }
                default { 'application/octet-stream' }
            }
            $res.ContentType   = $mime
            $res.ContentLength64 = $bytes.Length
            $res.StatusCode    = 200
            $res.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")
            $res.AddHeader("Pragma", "no-cache")
            $res.AddHeader("Expires", "0")
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $msg   = [System.Text.Encoding]::UTF8.GetBytes("404 - Not Found: $urlPath")
            $res.StatusCode = 404
            $res.ContentType = 'text/plain'
            $res.ContentLength64 = $msg.Length
            $res.OutputStream.Write($msg, 0, $msg.Length)
        }

        $res.OutputStream.Close()
        Write-Host "  [$(Get-Date -Format 'HH:mm:ss')] $($req.HttpMethod) $($req.Url.LocalPath)" -ForegroundColor DarkGray
    } catch {
        if ($listener.IsListening) {
            Write-Host "  Error: $_" -ForegroundColor Red
        }
    }
}
