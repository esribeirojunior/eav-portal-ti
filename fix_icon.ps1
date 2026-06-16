Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\erisson.junior\Downloads\EAVTEST-main (4)\EAVTEST-main\public\logo.png"
$destPath = "c:\Users\erisson.junior\Downloads\EAVTEST-main (4)\EAVTEST-main\build\icon.ico"

# Load the source image
$srcBmp = New-Object System.Drawing.Bitmap($srcPath)
$srcW = $srcBmp.Width
$srcH = $srcBmp.Height

# Find the end of the emblem dynamically by searching for the first transparent column
# after the emblem (starting from x=150).
$emblemW = [int]($srcH * 2.125)
for ($x = 150; $x -lt $srcW; $x++) {
    $nonTrans = 0
    for ($y = 0; $y -lt $srcH; $y++) {
        if ($srcBmp.GetPixel($x, $y).A -gt 0) {
            $nonTrans++
        }
    }
    if ($nonTrans -eq 0) {
        $emblemW = $x
        break
    }
}

if ($emblemW -gt $srcW) { $emblemW = $srcW }

# Create a square bitmap of size $emblemW x $emblemW (adds transparent padding top/bottom)
$squareBmp = New-Object System.Drawing.Bitmap($emblemW, $emblemW)
$gSquare = [System.Drawing.Graphics]::FromImage($squareBmp)
$gSquare.Clear([System.Drawing.Color]::Transparent)

# Draw the emblem part (leftmost $emblemW x $srcH pixels) centered vertically
$yOffset = [int](($emblemW - $srcH) / 2)
$srcRegion = New-Object System.Drawing.Rectangle(0, 0, $emblemW, $srcH)
$destRegion = New-Object System.Drawing.Rectangle(0, $yOffset, $emblemW, $srcH)

$gSquare.DrawImage($srcBmp, $destRegion, $srcRegion, [System.Drawing.GraphicsUnit]::Pixel)
$gSquare.Dispose()

# ICO supports 256x256 PNG-compressed icon
$sizes = @(256)

# We'll write a proper ICO file manually using a MemoryStream
$ms = New-Object System.IO.MemoryStream

# ICO Header: reserved(2) + type(2=1 for icon) + count(2)
$count = $sizes.Count
$header = [byte[]](0,0, 1,0, $count,0)
$ms.Write($header, 0, $header.Length)

# We need to write the directory entries first, then image data
# First, generate all PNG image data for each size
$imageDataList = @()
foreach ($size in $sizes) {
    $resized = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($squareBmp, 0, 0, $size, $size)
    $g.Dispose()

    $imgStream = New-Object System.IO.MemoryStream
    $resized.Save($imgStream, [System.Drawing.Imaging.ImageFormat]::Png)
    $resized.Dispose()

    $imageDataList += , $imgStream.ToArray()
    $imgStream.Dispose()
}

$squareBmp.Dispose()
$srcBmp.Dispose()

# Calculate offsets: header(6) + directory entries (16 bytes each)
$dataOffset = 6 + ($count * 16)

# Write directory entries
foreach ($i in 0..($count - 1)) {
    $size = $sizes[$i]
    $imgData = $imageDataList[$i]
    $w = if ($size -eq 256) { 0 } else { $size }
    $h = if ($size -eq 256) { 0 } else { $size }
    $entry = [byte[]]($w, $h, 0, 0, 1, 0, 32, 0)
    $ms.Write($entry, 0, $entry.Length)
    # Image data size (4 bytes LE)
    $imgLen = [System.BitConverter]::GetBytes([uint32]$imgData.Length)
    $ms.Write($imgLen, 0, $imgLen.Length)
    # Image data offset (4 bytes LE)
    $offsetBytes = [System.BitConverter]::GetBytes([uint32]$dataOffset)
    $ms.Write($offsetBytes, 0, $offsetBytes.Length)
    $dataOffset += $imgData.Length
}

# Write actual image data
foreach ($imgData in $imageDataList) {
    $ms.Write($imgData, 0, $imgData.Length)
}

# Save ICO file
[System.IO.File]::WriteAllBytes($destPath, $ms.ToArray())
$ms.Dispose()

$fileSize = (Get-Item $destPath).Length
Write-Output "icon.ico gerado com sucesso sem distorcao!"
Write-Output "Tamanho: $fileSize bytes"
Write-Output "Caminho: $destPath"
