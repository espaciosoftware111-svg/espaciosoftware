Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\aksha\.gemini\antigravity-ide\brain\2c604c18-ea18-4959-85e7-3cdeff34ea6f\.user_uploaded\media_1790140274708.jpg"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $src.Width
$height = $src.Height

# 1. Find bounding box of actual logo pixels (where gray <= 120)
$minX = $width
$maxX = 0
$minY = $height
$maxY = 0

for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $pixel = $src.GetPixel($x, $y)
        $gray = [int](0.299 * $pixel.R + 0.587 * $pixel.G + 0.114 * $pixel.B)
        if ($gray -lt 120) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Logo Bounding Box: X=[$minX, $maxX], Y=[$minY, $maxY]"

# Add 16px safety padding
$pad = 16
$cropX = [Math]::Max(0, $minX - $pad)
$cropY = [Math]::Max(0, $minY - $pad)
$cropW = [Math]::Min($width - $cropX, ($maxX - $minX) + ($pad * 2))
$cropH = [Math]::Min($height - $cropY, ($maxY - $minY) + ($pad * 2))

Write-Host "Crop Dimensions: $cropW x $cropH at ($cropX, $cropY)"

$destPng = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$destJpg = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)

$gJpg = [System.Drawing.Graphics]::FromImage($destJpg)
$gJpg.Clear([System.Drawing.Color]::White)
$gJpg.Dispose()

for ($destY = 0; $destY -lt $cropH; $destY++) {
    $srcY = $cropY + $destY
    for ($destX = 0; $destX -lt $cropW; $destX++) {
        $srcX = $cropX + $destX
        $pixel = $src.GetPixel($srcX, $srcY)
        $gray = [int](0.299 * $pixel.R + 0.587 * $pixel.G + 0.114 * $pixel.B)

        if ($gray -ge 140) {
            $destPng.SetPixel($destX, $destY, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            $destJpg.SetPixel($destX, $destY, [System.Drawing.Color]::FromArgb(255, 255, 255, 255))
        } elseif ($gray -le 50) {
            $destPng.SetPixel($destX, $destY, [System.Drawing.Color]::FromArgb(255, 0, 0, 0))
            $destJpg.SetPixel($destX, $destY, [System.Drawing.Color]::FromArgb(255, 0, 0, 0))
        } else {
            $alpha = [int]((140 - $gray) / 90.0 * 255)
            $destPng.SetPixel($destX, $destY, [System.Drawing.Color]::FromArgb($alpha, 0, 0, 0))
            $jpgTone = [int](255 - $alpha)
            $destJpg.SetPixel($destX, $destY, [System.Drawing.Color]::FromArgb(255, $jpgTone, $jpgTone, $jpgTone))
        }
    }
}

$destPng.Save("c:\Users\aksha\OneDrive\Desktop\erp espacio\public\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$destPng.Save("c:\Users\aksha\OneDrive\Desktop\erp espacio\public\espacio-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$destPng.Save("c:\Users\aksha\OneDrive\Desktop\erp espacio\public\brand\espacio-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$destJpg.Save("c:\Users\aksha\OneDrive\Desktop\erp espacio\public\logo.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)

$src.Dispose()
$destPng.Dispose()
$destJpg.Dispose()

Write-Host "Successfully generated tightly cropped transparent logo assets!"
