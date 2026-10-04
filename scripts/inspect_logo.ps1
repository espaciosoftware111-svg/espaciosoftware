Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\aksha\.gemini\antigravity-ide\brain\2c604c18-ea18-4959-85e7-3cdeff34ea6f\.user_uploaded\media_1790099831034.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

Write-Host "Image Size: $($bmp.Width) x $($bmp.Height)"
$p1 = $bmp.GetPixel(10, 10)
$p2 = $bmp.GetPixel(25, 10)
Write-Host "Pixel (10,10): R=$($p1.R), G=$($p1.G), B=$($p1.B)"
Write-Host "Pixel (25,10): R=$($p2.R), G=$($p2.G), B=$($p2.B)"

# Find darkest and lightest pixels
$minGray = 255
$maxGray = 0
for ($y = 0; $y -lt $bmp.Height; $y += 10) {
    for ($x = 0; $x -lt $bmp.Width; $x += 10) {
        $p = $bmp.GetPixel($x, $y)
        $gray = [int](0.299 * $p.R + 0.587 * $p.G + 0.114 * $p.B)
        if ($gray -lt $minGray) { $minGray = $gray }
        if ($gray -gt $maxGray) { $maxGray = $gray }
    }
}
Write-Host "Min Gray: $minGray, Max Gray: $maxGray"
$bmp.Dispose()
