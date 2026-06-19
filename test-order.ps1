# Health check
$r = Invoke-WebRequest -Uri "https://mobile-restaurant-api.onrender.com/api/health" -UseBasicParsing
Write-Host "=== Health ==="
Write-Host "Status:" $r.StatusCode

# Login
$loginBody = @{ email="giang1@gmail.com"; password="giang1" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "https://mobile-restaurant-api.onrender.com/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $login.data.accessToken
$headers = @{ Authorization = "Bearer $token" }
Write-Host "Logged in:" $login.data.user.fullName

# Get foods
$foods = Invoke-RestMethod -Uri "https://mobile-restaurant-api.onrender.com/api/menu/6a2d512ec6f0888cdd825828/foods" -Method GET
$realFoods = $foods.data | Where-Object { $_.name -ne "string" -and $_.price -gt 0 }
$f = $realFoods[0]

# Try creating order
Write-Host "`n=== Test Create Order ==="
$body = @{
    restaurantId = "6a2d512ec6f0888cdd825828"
    items = @(@{ foodId=$f._id; name=$f.name; price=$f.price; quantity=1; subtotal=$f.price })
    totalAmount = $f.price
    deliveryAddress = "1 Test"
    deliveryName = "Test User"
    deliveryPhone = "0901"
} | ConvertTo-Json -Depth 10

try {
    $o = Invoke-RestMethod -Uri "https://mobile-restaurant-api.onrender.com/api/orders" -Method POST -ContentType "application/json" -Headers $headers -Body $body
    Write-Host "SUCCESS! OrderCode:" $o.data.orderCode
} catch {
    $ex = $_.Exception.Response
    Write-Host "Error:" $ex.StatusCode
    $reader = [System.IO.StreamReader]::new($ex.GetResponseStream())
    Write-Host $reader.ReadToEnd()
    $reader.Close()
}

# Cleanup
Remove-Item check-be.ps1 -Force
