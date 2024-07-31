#Script MacOS
if [ ${BASH_SOURCE:0:1} == "." ]; then
  rutaScript=$(pwd)
else
  rutaScript=${BASH_SOURCE}
  IFS='/' read -ra splitArray <<< "$rutaScript"
  ultimoValor=${#splitArray[@]}
  rutaScript="/"
  if [ $ultimoValor -ne 2 ]; then
    unset rutaScript
    for (( i=1; i<=$((${ultimoValor}-2)); i++ )); do
      rutaScript="${rutaScript}/${splitArray[$i]}"
    done
  fi
fi

eval "${rutaScript}/disena-tu-curso-docente.app/Contents/MacOS/disena-tu-curso-docente"
