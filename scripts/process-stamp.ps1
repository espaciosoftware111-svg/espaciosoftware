Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\aksha\.gemini\antigravity-ide\brain\2c604c18-ea18-4959-85e7-3cdeff34ea6f\.user_uploaded\media_1790092634021.png"
$destStampPng = "c:\Users\aksha\OneDrive\Desktop\erp espacio\public\stamp.png"
$destSealPng = "c:\Users\aksha\OneDrive\Desktop\erp espacio\public\seal.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $src.Width
$height = $src.Height

# Create high quality transparent 32bpp ARGB bitmap
$dest = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $pixel = $src.GetPixel($x, $y)
        # Calculate grayscale intensity
        $gray = [int](0.299 * $pixel.R + 0.587 * $pixel.G + 0.114 * $pixel.B)
        
        # If very close to white (or transparent original), make transparent
        if ($pixel.A -lt 10 -or $gray -ge 245) {
            $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } elseif ($gray -ge 200) {
            # Smooth anti-aliased edge
            $alpha = [int]((245 - $gray) / 45.0 * 255)
            $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
        } else {
            $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $pixel.R, $pixel.G, $pixel.B))
        }
    }
}

$dest.Save($destStampPng, [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Save($destSealPng, [System.Drawing.Imaging.ImageFormat]::Png)

$src.Dispose()
$dest.Dispose()

Write-Host "Successfully processed new stamp and seal PNG files!"
