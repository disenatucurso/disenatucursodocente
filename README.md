# DisenaTuCursoDocente

Código fuente de una herramienta tecnológica que brinda apoyo a los docentes en el diseño de cursos de enseñanza superior. La herramienta proporciona un espacio tecnológico con textos de ayuda y sugerencias que acompañan al docente en el proceso, permitiendo la personalización de los cursos según las necesidades de cada institución.

## Configurar ambiente local
Para instalar las dependencias del proyecto, ejecutar el comando:
npm ci

Para compilar Frontend (necesario para generar la carpeta dist/) ejecutar comando:
ng build --configuration production --base-href ./

Si existe el archivo BanderaDesarrollo, Backend.js escribe en src/assets/ que es donde AplicacionAngular (al iniciarlo con ng serve) trabaja
AMBIENTE DESA
.
├── src/
│   ├── AplicacionAngular (ng serve)
│   └── assets/
│       ├── files/
│       ├── js/
│       ├── schemas/
│       └── puerto
├── BanderaDesarrollo
├── Backend.js (node Backend.js)
└── dist/
    └── disena-tu-curso-docente/
        └── assets/
            └── schemasData/

AMBIENTE PROD
.
└── disena-tu-curso-docente-win32-x64/
    ├── disena-tu-curso-docente.exe
    └── resources/
        └── app/
            ├── ElectronEntry.js
            ├── Backend.js
            └── dist/
                └── disena-tu-curso-docente/
                    ├── AplicacionAngular
                    └── assets/
                        ├── files/
                        ├── js/
                        ├── schemasData/
                        ├── schemas/
                        └── puerto

## Ejecutar solución en DESA
Necesitamos 2 terminales.
Terminal 1 ejecutar:
node .\Backend.js

Terminal 2 ejecutar:
ng serve


## Compilar Cliente Desktop
Paso 1: Copiar carpeta del proyecto a C:
Esto se debe a que si se compila desde una ruta mas "adentro", el Comando 2 falla porque intenta por código
crear archivos con una ruta absoluta que tiene más de 238 caracteres (limitante de Windows).

Comando 1: Compila la solución Angular y la guarda en dist/
ng build --configuration production --base-href ./

Comando 2: Compila la solución Electron y la guarda en out/
npm run make

Paso 2: Eliminar archivos no necesarios para el funcionamiento del compilado
En out\disena-tu-curso-docente-win32-x64\resources\app\ dejar solo:
    dist
    ElectronEntry.js
    Backend.js
    package.json
    loading.html
