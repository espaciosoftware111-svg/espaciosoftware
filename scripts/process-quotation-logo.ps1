Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\aksha\.gemini\antigravity-ide\brain\e8ed6e41-3816-44a3-ae4b-dfd8d1cdb674\.user_uploaded\media_1791524572373.png"
$destLogoPng = "c:\Users\aksha\OneDrive\Desktop\erp espacio\public\espacio-logo.png"
$destBrandLogoPng = "c:\Users\aksha\OneDrive\Desktop\erp espacio\public\brand\espacio-logo.png"
$destPublicLogoPng = "c:\Users\aksha\OneDrive\Desktop\erp espacio\public\logo.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $src.Width
$height = $src.Height

# Find bounding box of actual logo content
$minX = $width
$maxX = 0
$minY = $height
$maxY = 0

for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $p = $src.GetPixel($x, $y)
        # Check if non-white pixel (brightness < 245)
        $brightness = ($p.R * 0.299 + $p.G * 0.587 + $p.B * 0.114)
        if ($brightness -lt 240) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

# Add small padding around cropped logo (10px)
$pad = 10
$cropX = [Math]::Max(0, $minX - $pad)
$cropY = [Math]::Max(0, $minY - $pad)
$cropW = [Math]::Min($width - $cropX, ($maxX - $minX) + ($pad * 2))
$cropH = [Math]::Min($height - $cropY, ($maxY - $minY) + ($pad * 2))

Write-Host "Cropping bounds: X=$cropX, Y=$cropY, W=$cropW, H=$cropH"

$destPng = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $cropH; $y++) {
    for ($x = 0; $x -lt $cropW; $x++) {
        $srcX = $cropX + $x
        $srcY = $cropY + $y
        $pixel = $src.GetPixel($srcX, $srcY)

        $r = $pixel.R
        $g = $pixel.G
        $b = $pixel.B

        # Calculate brightness / distance from pure white (255,255,255)
        # For a white background image, foreground is dark brown/gold
        $distFromWhite = [Math]::Sqrt(([Math]::Pow(255 - $r, 2) + [Math]::Pow(255 - $g, 2) + [Math]::Pow(255 - $b, 2)) / 3.0)

        # Thresholds:
        # distFromWhite == 0 -> pure white -> alpha = 0
        # distFromWhite > 40 -> solid logo -> alpha = 255
        # 0 <= distFromWhite <= 40 -> smooth anti-aliased edge
        if ($distFromWhite -le 4) {
            $destPng.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } elseif ($distFromWhite -ge 35) {
            $destPng.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $g, $b))
        } else {
            # Smooth anti-aliased edge
            $alpha = [int](($distFromWhite / 35.0) * 255)
            if ($alpha -gt 255) { $alpha = 255 }
            if ($alpha -lt 0) { $alpha = 0 }
            
            # Color decontamination to remove white fringe
            $aFrac = $alpha / 255.0
            $pureR = [int]([Math]::Max(0, [Math]::Min(255, ($r - 255 * (1.0 - $aFrac)) / [Math]::Max(0.01, $aFrac))))
            $pureG = [int]([Math]::Max(0, [Math]::Min(255, ($g - 255 * (1.0 - $aFrac)) / [Math]::Max(0.01, $aFrac))))
            $pureB = [int]([Math]::Max(0, [Math]::Min(255, ($b - 255 * (1.0 - $aFrac)) / [Math]::Max(0.01, $aFrac))))

            $destPng.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pureR, $pureG, $pureB))
        }
    }
}

$destPng.Save($destLogoPng, [System.Drawing.Imaging.ImageFormat]::Png)
$destPng.Save($destBrandLogoPng, [System.Drawing.Imaging.ImageFormat]::Png)
$destPng.Save($destPublicLogoPng, [System.Drawing.Imaging.ImageFormat]::Png)

$src.Dispose()
$destPng.Dispose()

Write-Host "Successfully processed transparent quotation logo at $destLogoPng"
