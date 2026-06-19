$loginBody = @{ email="giang1@gmail.com"; password="giang1" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "https://mobile-restaurant-api.onrender.com/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $login.data.accessToken
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

$body = @{
    restaurantId = "6a2d512ec6f0888cdd825828"
    items = @(
        @{ foodId = "6a32333179d7f7a2ee7b8dba"; name = "Thuc don set 1"; quantity = 1 }
    )
} | ConvertTo-Json

$resp = Invoke-RestMethod -Uri "https://mobile-restaurant-api.onrender.com/api/menu/validate-cart" -Method POST -Headers $headers -Body $body
$resp | ConvertTo-Json -Depth 10
