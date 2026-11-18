# GPU DIAGNOSE - Windows read-only baseline
# Version 1.0. Reads Windows, BIOS, GPU PnP IDs and display drivers.
# No administrative rights, driver changes, RGB writes or network access.
$ErrorActionPreference = 'Stop'
try {
    $os = Get-CimInstance Win32_OperatingSystem
    $bios = Get-CimInstance Win32_BIOS
    $board = Get-CimInstance Win32_BaseBoard
    $display = @(Get-PnpDevice -Class Display | Select-Object FriendlyName, Status, InstanceId)
    $drivers = @(Get-CimInstance Win32_PnPSignedDriver |
        Where-Object { $_.DeviceClass -eq 'DISPLAY' } |
        Select-Object DeviceName, Manufacturer, DriverVersion, DriverDate, InfName)
    $report = [ordered]@{
        Tool = 'GPU-DIAG Windows Read-only 1.0'
        CapturedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
        OperatingSystem = [ordered]@{
            Caption = $os.Caption
            Build = $os.BuildNumber
            Version = $os.Version
        }
        BIOS = [ordered]@{
            Manufacturer = $bios.Manufacturer
            Version = $bios.SMBIOSBIOSVersion
            ReleaseDate = if ($bios.ReleaseDate) { $bios.ReleaseDate.ToString('yyyy-MM-dd') } else { '' }
        }
        Mainboard = [ordered]@{
            Manufacturer = $board.Manufacturer
            Product = $board.Product
        }
        DisplayAdapters = $display
        DisplayDrivers = $drivers
    }
    Write-Output 'GPU-DIAG-BEGIN'
    $report | ConvertTo-Json -Depth 8
    Write-Output 'GPU-DIAG-END'
} catch {
    Write-Output ('GPU-DIAG-ERROR: ' + $_.Exception.Message)
}
