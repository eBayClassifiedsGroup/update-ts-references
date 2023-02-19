Invoke-Expression "yarn link"
Remove-Item .\test-run -Confirm:$false -Force -Recurse -ErrorAction Ignore
Copy-Item .\test-scenarios -Destination .\test-run -Recurse
$prevLocation = Get-Location
Get-ChildItem .\test-run | ForEach-Object { Set-Location $_.FullName; Invoke-Expression "yarn link update-ts-references" }
Set-Location $prevLocation