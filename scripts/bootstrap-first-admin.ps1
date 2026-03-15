param(
  [string]$ApiBaseUrl = "https://agonanyakrom-api.onrender.com",
  [Parameter(Mandatory = $true)]
  [string]$BootstrapToken,
  [Parameter(Mandatory = $true)]
  [string]$Name,
  [Parameter(Mandatory = $true)]
  [string]$Email,
  [Parameter(Mandatory = $true)]
  [string]$Password
)

$normalizedApiBaseUrl = $ApiBaseUrl.TrimEnd('/')

$body = @{
  bootstrap_token = $BootstrapToken
  name = $Name
  email = $Email
  password = $Password
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "$normalizedApiBaseUrl/api/admin/auth/bootstrap" `
  -ContentType "application/json" `
  -Body $body
