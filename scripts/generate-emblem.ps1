Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("c:\Users\aksha\OneDrive\Desktop\erp espacio\public\espacio-logo.png")
$width = $src.Width
$height = $src.Height

# The emblem is in the upper ~60% of the image, centered horizontally
$emblemCropX = [int]($width * 0.25)
$emblemCropY = 0
$emblemCropW = [int]($width * 0.50)
$emblemCropH = [int]($height * 0.65)

$crop = New-Object System.Drawing.Bitmap($emblemCropW, $emblemCropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($crop)
$srcRect = New-Object System.Drawing.Rectangle($emblemCropX, $emblemCropY, $emblemCropW, $emblemCropH)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $emblemCropW, $emblemCropH)

$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$crop.Save("c:\Users\aksha\OneDrive\Desktop\erp espacio\public\brand\espacio-emblem.png", [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Save("c:\Users\aksha\OneDrive\Desktop\erp espacio\public\emblem.png", [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$crop.Dispose()
$src.Dispose()

Write-Host "Emblem successfully created!"
