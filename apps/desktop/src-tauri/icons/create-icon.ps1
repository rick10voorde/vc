Add-Type -AssemblyName System.Drawing

# Create 512x512 bitmap
$bmp = New-Object System.Drawing.Bitmap(512, 512)
$graphics = [System.Drawing.Graphics]::FromImage($bmp)

# Enable anti-aliasing for smooth rendering
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

# Fill with dark background matching app theme (#18181b)
$graphics.Clear([System.Drawing.Color]::FromArgb(24, 24, 27))

# Draw lowercase "v" letter in light color
$font = New-Object System.Drawing.Font('Arial', 320, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(228, 228, 231))

# Measure the text to center it properly
$text = "v"
$size = $graphics.MeasureString($text, $font)
$x = (512 - $size.Width) / 2
$y = (512 - $size.Height) / 2 - 20  # Slight adjustment for visual centering

$graphics.DrawString($text, $font, $brush, $x, $y)

# Save as PNG
$bmp.Save("$PSScriptRoot\app-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Cleanup
$graphics.Dispose()
$bmp.Dispose()

Write-Host "Icon created successfully: app-icon.png"
Write-Host "  - Dark background"
Write-Host "  - Lowercase v centered"
Write-Host "  - Matches vochat.io branding"
