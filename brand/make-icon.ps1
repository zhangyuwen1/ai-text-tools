Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap(512,512)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAliasGridFit'
$g.Clear([System.Drawing.Color]::Transparent)

# 圆角黑色方块
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$r=110; $x=16;$y=16;$w=480;$h=480
$path.AddArc($x,$y,$r,$r,180,90)
$path.AddArc($x+$w-$r,$y,$r,$r,270,90)
$path.AddArc($x+$w-$r,$y+$h-$r,$r,$r,0,90)
$path.AddArc($x,$y+$h-$r,$r,$r,90,90)
$path.CloseFigure()
$black = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(24,24,27))
$g.FillPath($black,$path)

# 白色 T 居中
$font = New-Object System.Drawing.Font('Arial',250,([System.Drawing.FontStyle]::Bold),([System.Drawing.GraphicsUnit]::Pixel))
$white = [System.Drawing.Brushes]::White
$size = $g.MeasureString('T',$font)
$g.DrawString('T',$font,$white,(256-$size.Width/2-24),(256-$size.Height/2-14))

# 绿色圆点右下
$green = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(5,150,105))
$g.FillEllipse($green,352,352,124,124)

$g.Dispose()
$bmp.Save('D:\project\test\ai-text-tools\brand\product-icon.png',[System.Drawing.Imaging.ImageFormat]::Png)
Write-Output 'saved'
