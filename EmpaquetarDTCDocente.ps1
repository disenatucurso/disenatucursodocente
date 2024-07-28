#Hay que tener 7z en el path para que reconozca el comando 7z
#Scipt que toma las carpeta compiladas de out/ y genera los comprimidos para subir a drive
$targets = @()
$targets += 'darwin-x64'
$targets += 'linux-x64'
$targets += 'win32-ia32'
#$targets += 'win32-x64'

$version = Read-Host "Ingresar indentificador de version (ej: V2)"
cd "$PSScriptRoot\out"
foreach ($target in $targets) {
    $newName = "disena-tu-curso-docente-$target-$version"
    Rename-Item -path "$PSScriptRoot\out\disena-tu-curso-docente-$target" -NewName "$newName"

    switch ($target) {
        { "win32-x64", "win32-ia32" -eq $_ } {
            7z a -tzip "$newName.zip" "$PSScriptRoot\out\$newName"
            break
        }
        { "linux-x64", "darwin-x64" -eq $_ } {
            7z a -ttar "$newName.tar" "$PSScriptRoot\out\$newName"
            7z a -tgzip "$newName.tar.gz" "$PSScriptRoot\out\$newName.tar"
            Remove-Item "$PSScriptRoot\out\$newName.tar"
            break
        }
        default {
            write-host "Target $target desconocido"
            continue
        }
    }
}
cd "$PSScriptRoot"
