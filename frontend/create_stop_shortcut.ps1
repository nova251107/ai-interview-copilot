# PowerShell script to create a desktop shortcut (Ctrl+Shift+C) that stops the mock‑interview servers
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'StopServers.lnk'
$target = "powershell.exe"
# Resolve the full path to stop_servers.ps1 (same directory as this script)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$scriptPath = Join-Path $scriptDir 'stop_servers.ps1'
$arguments = "-ExecutionPolicy Bypass -File `"$scriptPath`""

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $target
$shortcut.Arguments = $arguments
$shortcut.WorkingDirectory = $scriptDir
# Hotkey format: ^ for Ctrl, + for Shift, then the key (C). So '^+C'
$shortcut.Hotkey = '^+C'
$shortcut.WindowStyle = 1 # Normal window
$shortcut.IconLocation = "powershell.exe,0"
$shortcut.Save()
Write-Host "Desktop shortcut created at $shortcutPath with hotkey Ctrl+Shift+C"
