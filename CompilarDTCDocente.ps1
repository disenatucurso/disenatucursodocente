#https://stackoverflow.com/questions/19728555/node-js-require-doesnt-work-in-script
#https://stackoverflow.com/questions/35682131/electron-packager-cannot-find-module

# Inicialización de los targets (descomentados o comentados)
$targets = @(
    @{ Name = 'darwin-x64'; Compilar = $false },
    @{ Name = 'linux-x64'; Compilar = $false },
    @{ Name = 'win32-ia32'; Compilar = $true },
    @{ Name = 'win32-x64'; Compilar = $true } # Comienza comentado
)
function CompilarTarget($target){
    $raizProyectoCompilado="$PSScriptRoot\out\disena-tu-curso-docente-$($target.Name)"
    $dirBinarioCompilado = "$raizProyectoCompilado\resources\app\"
    $cursosDeDesarrollo="$raizProyectoCompilado\resources\app\dist\disena-tu-curso-docente\assets\schemasData\"

    write-host "-----------------------------------"
    write-host "COMPILANDO ELECTRON para $($target.Name)"
    #Si se está detrás de un firewall corporativo, el compilado puede fallar
    #Antes de correr el script ejecutar:
    #$env:NODE_TLS_REJECT_UNAUTHORIZED=0
    #Luego, volver a como estaba:
    #$env:NODE_TLS_REJECT_UNAUTHORIZED=1

    #arch=[ia32, x64, armv7l, arm64, mips64el, universal]
    #platform=[darwin, linux, mas, win32]

    #npm run package -- --platform=darwin --arch=ia32
    #WARNING: The platform/arch combination darwin/ia32 is not currently supported by Electron Packager

    #npm run package -- --platform=linux --arch=ia32
    #HTTP 404 https://github.com/electron/electron/releases/download/v20.0.1/electron-v20.0.1-linux-ia32.zip
    #Parece que no existe linux-ia32 para ninguna versión de Electron
    #https://www.electronjs.org/blog/linux-32bit-support

    $arrayTarget=$($target.Name) -split '-'
    $platform=$arrayTarget[0]
    $arch=$arrayTarget[1]

    npm run package -- --platform=$platform --arch=$arch

    #El compilador empaqueta todas las dependencias del proyecto.
    #No todas las dependencias del proyecto son necesarias para ejecutar el binario compilado.
    write-host "ELIMINANDO ARCHIVOS INNECESARIOS"
    switch ($($target.Name)) {
        "win32-x64"  {
            $dependencias="accepts,body-parser,call-bind,content-disposition,content-type,cookie,cookie-signature,cors,depd,destroy,ee-first,encodeurl,escape-html,etag,express,finalhandler,forwarded,fresh,function-bind,get-intrinsic,has,has-symbols,http-errors,iconv-lite,inherits,media-typer,merge-descriptors,methods,mime,mime-db,mime-types,negotiator,object-assign,object-inspect,on-finished,parseurl,path-to-regexp,proxy-addr,qs,range-parser,raw-body,safer-buffer,send,serve-static,setprototypeof,side-channel,statuses,toidentifier,type-is,unpipe,utils-merge,vary"
            break
        }
        "win32-ia32"   {
            $dependencias="accepts,body-parser,call-bind,content-disposition,content-type,cookie,cookie-signature,cors,depd,destroy,ee-first,encodeurl,escape-html,etag,express,finalhandler,forwarded,fresh,function-bind,get-intrinsic,has,has-symbols,http-errors,iconv-lite,inherits,media-typer,merge-descriptors,methods,mime,mime-db,mime-types,negotiator,object-assign,object-inspect,on-finished,parseurl,path-to-regexp,proxy-addr,qs,range-parser,raw-body,safer-buffer,send,serve-static,setprototypeof,side-channel,statuses,toidentifier,type-is,unpipe,utils-merge,vary"
            $dependencias+=",array-flatten,bytes,ipaddr.js,ms,safe-buffer"
            break
        }
        "linux-x64"  {
            #$dependencias="accepts,body-parser,call-bind,content-disposition,content-type,cookie,cookie-signature,cors,depd,destroy,ee-first,encodeurl,escape-html,etag,express,finalhandler,forwarded,fresh,function-bind,get-intrinsic,has,has-symbols,http-errors,iconv-lite,inherits,media-typer,merge-descriptors,methods,mime,mime-db,mime-types,negotiator,object-assign,object-inspect,on-finished,parseurl,path-to-regexp,proxy-addr,qs,range-parser,raw-body,safer-buffer,send,serve-static,setprototypeof,side-channel,statuses,toidentifier,type-is,unpipe,utils-merge,vary"
            #Copio script para ejecutar en Linux
            cp "$PSScriptRoot\abrir-disena-tu-curso-docente.sh" "$raizProyectoCompilado"
            break
        }
        "darwin-x64"  {
            $cursosDeDesarrollo="$PSScriptRoot\out\disena-tu-curso-docente-$($target.Name)\disena-tu-curso-docente.app\Contents\Resources\app\dist\disena-tu-curso-docente\assets\schemasData\"
            $dirBinarioCompilado = "$PSScriptRoot\out\disena-tu-curso-docente-$($target.Name)\disena-tu-curso-docente.app\Contents\Resources\app\"
            #$dependencias="accepts,body-parser,call-bind,content-disposition,content-type,cookie,cookie-signature,cors,depd,destroy,ee-first,encodeurl,escape-html,etag,express,finalhandler,forwarded,fresh,function-bind,get-intrinsic,has,has-symbols,http-errors,iconv-lite,inherits,media-typer,merge-descriptors,methods,mime,mime-db,mime-types,negotiator,object-assign,object-inspect,on-finished,parseurl,path-to-regexp,proxy-addr,qs,range-parser,raw-body,safer-buffer,send,serve-static,setprototypeof,side-channel,statuses,toidentifier,type-is,unpipe,utils-merge,vary"
            #Copio script para ejecutar en MacOS
            cp "$PSScriptRoot\disena-tu-curso-docente.sh" "$raizProyectoCompilado"
            break
        }
        default {
            write-host "Target $($target.Name) desconocido"
            continue
        }
    }
    #ELIMINACION DE DEPENDENCIAS PARA QUE PESE MENOS, EN LA NUEVA VERSION NO FUNCIONA DEL TODO BIEN
    #$arrayDep = $dependencias -split ','
    #Get-ChildItem "$dirBinarioCompilado\node_modules" -Exclude $arrayDep | Remove-Item -Recurse -Force
    
    Get-ChildItem "$dirBinarioCompilado" -Exclude dist,ElectronEntry.js,Backend.js,package.json,loading.html,node_modules | Remove-Item -Recurse -Force
    write-host "ELIMINO CURSOS QUE HAYAN VENIDO DESDE DESARROLLO"
    if(test-path -path "$cursosDeDesarrollo"){
        rm "$cursosDeDesarrollo\*"
    }
    else{
        mkdir "$cursosDeDesarrollo" | Out-Null
    }
}
# Función para mostrar el menú y permitir el toggle
function Mostrar-Menu {
    Clear-Host
    Write-Host "Seleccione los targets para compilar (toggle on/off):" -ForegroundColor Cyan
    $i = 1
    foreach ($target in $targets) {
        $status = if ($target.Compilar) { "[X]" } else { "[ ]" }
        Write-Host "$i. $status $($target.Name)"
        $i++
    }
    Write-Host "$i. Continuar con la compilación" -ForegroundColor Green
}

# Función para manejar la selección del menú
function Toggle-Target {
    Mostrar-Menu
    $seleccion = Read-Host "Seleccione el número para cambiar (o continuar)"
    $seleccionInt = [int]$seleccion

    if ($seleccionInt -le $targets.Count) {
        $targets[$seleccionInt - 1].Compilar = -not $targets[$seleccionInt - 1].Compilar
        Toggle-Target
    } elseif ($seleccionInt -eq ($targets.Count + 1)) {
        Write-Host "Iniciando la compilación..." -ForegroundColor Yellow
    } else {
        Write-Host "Selección no válida, intente nuevamente." -ForegroundColor Red
        Toggle-Target
    }
}

# Compilación según los targets seleccionados
function Compilar {
    write-host "Run Compilar"
    write-host "COMPILANDO ANGULAR"
    ng build --configuration production --base-href ./
    foreach ($target in $targets) {
        if ($target.Compilar) {
            $raizProyectoCompilado = "$PSScriptRoot\out\disena-tu-curso-docente-$($target.Name)"
            Write-Host "Compilando para $($target.Name)..."
            CompilarTarget $target
            # Aquí iría tu comando de compilación
        } else {
            Write-Host "Omitiendo $($target.Name)..." -ForegroundColor Gray
        }
    }
}

# Ejecución del script
Toggle-Target
Compilar

function CompilarTarget(){
    $raizProyectoCompilado="$PSScriptRoot\out\disena-tu-curso-docente-$($target.Name)"
    $dirBinarioCompilado = "$raizProyectoCompilado\resources\app\"
    $cursosDeDesarrollo="$raizProyectoCompilado\resources\app\dist\disena-tu-curso-docente\assets\schemasData\"

    write-host "-----------------------------------"
    write-host "COMPILANDO ELECTRON para $($target.Name)"
    #Si se está detrás de un firewall corporativo, el compilado puede fallar
    #Antes de correr el script ejecutar:
    #$env:NODE_TLS_REJECT_UNAUTHORIZED=0
    #Luego, volver a como estaba:
    #$env:NODE_TLS_REJECT_UNAUTHORIZED=1

    #arch=[ia32, x64, armv7l, arm64, mips64el, universal]
    #platform=[darwin, linux, mas, win32]

    #npm run package -- --platform=darwin --arch=ia32
    #WARNING: The platform/arch combination darwin/ia32 is not currently supported by Electron Packager

    #npm run package -- --platform=linux --arch=ia32
    #HTTP 404 https://github.com/electron/electron/releases/download/v20.0.1/electron-v20.0.1-linux-ia32.zip
    #Parece que no existe linux-ia32 para ninguna versión de Electron
    #https://www.electronjs.org/blog/linux-32bit-support

    $arrayTarget=$($target.Name) -split '-'
    $platform=$arrayTarget[0]
    $arch=$arrayTarget[1]

    npm run package -- --platform=$platform --arch=$arch

    #El compilador empaqueta todas las dependencias del proyecto.
    #No todas las dependencias del proyecto son necesarias para ejecutar el binario compilado.
    write-host "ELIMINANDO ARCHIVOS INNECESARIOS"
    switch ($($target.Name)) {
        "win32-x64"  {
            $dependencias="accepts,body-parser,call-bind,content-disposition,content-type,cookie,cookie-signature,cors,depd,destroy,ee-first,encodeurl,escape-html,etag,express,finalhandler,forwarded,fresh,function-bind,get-intrinsic,has,has-symbols,http-errors,iconv-lite,inherits,media-typer,merge-descriptors,methods,mime,mime-db,mime-types,negotiator,object-assign,object-inspect,on-finished,parseurl,path-to-regexp,proxy-addr,qs,range-parser,raw-body,safer-buffer,send,serve-static,setprototypeof,side-channel,statuses,toidentifier,type-is,unpipe,utils-merge,vary"
            break
        }
        "win32-ia32"   {
            $dependencias="accepts,body-parser,call-bind,content-disposition,content-type,cookie,cookie-signature,cors,depd,destroy,ee-first,encodeurl,escape-html,etag,express,finalhandler,forwarded,fresh,function-bind,get-intrinsic,has,has-symbols,http-errors,iconv-lite,inherits,media-typer,merge-descriptors,methods,mime,mime-db,mime-types,negotiator,object-assign,object-inspect,on-finished,parseurl,path-to-regexp,proxy-addr,qs,range-parser,raw-body,safer-buffer,send,serve-static,setprototypeof,side-channel,statuses,toidentifier,type-is,unpipe,utils-merge,vary"
            $dependencias+=",array-flatten,bytes,ipaddr.js,ms,safe-buffer"
            break
        }
        "linux-x64"  {
            #$dependencias="accepts,body-parser,call-bind,content-disposition,content-type,cookie,cookie-signature,cors,depd,destroy,ee-first,encodeurl,escape-html,etag,express,finalhandler,forwarded,fresh,function-bind,get-intrinsic,has,has-symbols,http-errors,iconv-lite,inherits,media-typer,merge-descriptors,methods,mime,mime-db,mime-types,negotiator,object-assign,object-inspect,on-finished,parseurl,path-to-regexp,proxy-addr,qs,range-parser,raw-body,safer-buffer,send,serve-static,setprototypeof,side-channel,statuses,toidentifier,type-is,unpipe,utils-merge,vary"
            #Copio script para ejecutar en Linux
            cp "$PSScriptRoot\abrir-disena-tu-curso-docente.sh" "$raizProyectoCompilado"
            break
        }
        "darwin-x64"  {
            $cursosDeDesarrollo="$PSScriptRoot\out\disena-tu-curso-docente-$($target.Name)\disena-tu-curso-docente.app\Contents\Resources\app\dist\disena-tu-curso-docente\assets\schemasData\"
            $dirBinarioCompilado = "$PSScriptRoot\out\disena-tu-curso-docente-$($target.Name)\disena-tu-curso-docente.app\Contents\Resources\app\"
            #$dependencias="accepts,body-parser,call-bind,content-disposition,content-type,cookie,cookie-signature,cors,depd,destroy,ee-first,encodeurl,escape-html,etag,express,finalhandler,forwarded,fresh,function-bind,get-intrinsic,has,has-symbols,http-errors,iconv-lite,inherits,media-typer,merge-descriptors,methods,mime,mime-db,mime-types,negotiator,object-assign,object-inspect,on-finished,parseurl,path-to-regexp,proxy-addr,qs,range-parser,raw-body,safer-buffer,send,serve-static,setprototypeof,side-channel,statuses,toidentifier,type-is,unpipe,utils-merge,vary"
            #Copio script para ejecutar en MacOS
            cp "$PSScriptRoot\disena-tu-curso-docente.sh" "$raizProyectoCompilado"
            break
        }
        default {
            write-host "Target $($target.Name) desconocido"
            continue
        }
    }
    #ELIMINACION DE DEPENDENCIAS PARA QUE PESE MENOS, EN LA NUEVA VERSION NO FUNCIONA DEL TODO BIEN
    $arrayDep = $dependencias -split ','
    Get-ChildItem "$dirBinarioCompilado\node_modules" -Exclude $arrayDep | Remove-Item -Recurse -Force
    
    Get-ChildItem "$dirBinarioCompilado" -Exclude dist,ElectronEntry.js,Backend.js,package.json,loading.html,node_modules | Remove-Item -Recurse -Force
    write-host "ELIMINO CURSOS QUE HAYAN VENIDO DESDE DESARROLLO"
    if(test-path -path "$cursosDeDesarrollo"){
        rm "$cursosDeDesarrollo\*"
    }
    else{
        mkdir "$cursosDeDesarrollo" | Out-Null
    }
}

#cd "$PSScriptRoot"
