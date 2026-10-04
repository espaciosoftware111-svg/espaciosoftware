Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\aksha\.gemini\antigravity-ide\brain\2c604c18-ea18-4959-85e7-3cdeff34ea6f\.user_uploaded\media_1790099831034.jpg"
$destLogoPng = "c:\Users\aksha\OneDrive\Desktop\erp espacio\public\logo.png"
$destEspacioLogoPng = "c:\Users\aksha\OneDrive\Desktop\erp espacio\public\espacio-logo.png"
$destLogoJpg = "c:\Users\aksha\OneDrive\Desktop\erp espacio\public\logo.jpg"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $src.Width
$height = $src.Height

# Create 32bpp ARGB bitmap for transparent PNG
$destPng = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
# Create 24bpp RGB bitmap for clean white background JPG
$destJpg = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)

# Fill JPG background with pure white
$gJpg = [System.Drawing.Graphics]::FromImage($destJpg)
$gJpg.Clear([System.Drawing.Color]::White)
$gJpg.Dispose()

for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $pixel = $src.GetPixel($x, $y)
        $gray = [int](0.299 * $pixel.R + 0.587 * $pixel.G + 0.114 * $pixel.B)

        # Thresholds:
        # Gray >= 140 is background checkerboard -> transparent
        # Gray <= 50 is full black logo -> solid black (A=255)
        # 50 < Gray < 140 is anti-aliasing edge -> smoothly interpolated alpha
        if ($gray -ge 140) {
            $destPng.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            $destJpg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 255, 255))
        } elseif ($gray -le 50) {
            $destPng.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 0, 0, 0))
            $destJpg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 0, 0, 0))
        } else {
            # Smooth anti-aliased edge
            $alpha = [int]((140 - $gray) / 90.0 * 255)
            $destPng.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 0, 0, 0))
            
            # For JPG on white background:
            $jpgTone = [int](255 - $alpha)
            $destJpg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $jpgTone, $jpgTone, $jpgTone))
        }
    }
}

# Crop excess margins if needed or save full high-res
$destPng.Save($destLogoPng, [System.Drawing.Imaging.ImageFormat]::Png)
$destPng.Save($destEspacioLogoPng, [System.Drawing.Imaging.ImageFormat]::Png)
$destJpg.Save($destLogoJpg, [System.Drawing.Imaging.ImageFormat]::Jpeg)

$src.Dispose()
$destPng.Dispose()
$destJpg.Dispose()

Write-Host "Successfully processed transparent quotation logo files!"
