let express = require("express");
let appp = express();
let fs = require("fs");
appp.use(express.json({limit: '50mb'}));
appp.use(express.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}));

const cors = require("cors");
const { arch } = require("os");
const corsOptions = {
  origin: "http://localhost:4200",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
appp.use(cors(corsOptions));

var ambienteDesarrollo = fs.existsSync('BanderaDesarrollo');
console.log("¿Es ambiente de Desarrollo? : "+ambienteDesarrollo);

appp.post("/cursos", function (req, res) {
  fs.writeFile(
    __dirname + "/dist/disena-tu-curso-docente/assets/schemasData/" + `curso_${req.body.curso.id}.json`,
    JSON.stringify(req.body.curso),
    (err) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      } else {
        res.status(201).send();
      }
    }
  );
});

appp.get("/cursos/:id", function (req, res) {
  const { id } = req.params;
  fs.readFile(
    __dirname + "/dist/disena-tu-curso-docente/assets/schemasData/" + `curso_${id}.json`,
    "utf8",
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      } else {
        const json = JSON.parse(data);
        res.status(200).send(json);
      }
    }
  );
});

appp.get("/cursos", function (req, res) {
  const cursos = [];
  fs.readdir(__dirname + "/dist/disena-tu-curso-docente/assets/schemasData", (err, archivoCursos) => {
    if (err) console.log(err);
    archivoCursos?.forEach((archivoCurso, i) =>
      fs.readFile(
        __dirname + "/dist/disena-tu-curso-docente/assets/schemasData/" + `${archivoCurso}`,
        "utf8",
        (err, data) => {
          if (err) {
            console.log(err);
            res.status(400).send(err);
          } else {
            const json = JSON.parse(data);
            cursos.push(json);
          }
        }
      )
    );
  });
  setTimeout(() => res.status(200).send(cursos), 100);
});

appp.put("/cursos/:id", function (req, res) {
  const { id } = req.params;
  const cursoActualizado = req.body.curso;
  fs.writeFile(
    __dirname + "/dist/disena-tu-curso-docente/assets/schemasData/" + `curso_${id}.json`,
    JSON.stringify(cursoActualizado),
    (err) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      } else {
        res.status(200).send();
      }
    }
  );
});

appp.post("/archivos", function (req, res) {
    const base64 = req.body.file;
    const fileBinary = Buffer.from(base64, 'base64');
    
    let writeRoute = null;
    if(ambienteDesarrollo){
        writeRoute = __dirname + "/src/assets/files/";
    }
    else{
        writeRoute = __dirname + "/dist/disena-tu-curso-docente/assets/files/";
    }
    //Elimino archivo anterior
    /*let archivoAnterior = req.body.archivoAnterior;
    if(archivoAnterior !== null){
        if(fs.existsSync(writeRoute+archivoAnterior)){
            fs.unlinkSync(writeRoute+archivoAnterior);
        }
    }*/

    //Guardo archivo nuevo
    let fileNameOriginal = req.body.nombre;
    let fileNameIterador = req.body.nombre;
    let indice = 1;
    while(fs.existsSync(writeRoute+fileNameIterador)){
        
        const split = fileNameOriginal.split('.');
        let ext = split.pop();
        fileNameIterador = split.join('.')+'_('+indice+').'+ext;
        indice++;
    }

    fs.writeFile(
        writeRoute + fileNameIterador,
        fileBinary,
        (err) => {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {
                res.status(200).send({rutaRelativa: "assets/files/" + fileNameIterador});
            }
        }
    );
});

let server = appp.listen(0, function () {
    let host = server.address().address;
    let port = server.address().port;
    //Escribo puerto en archivo de texto para el Frontend
    let writeRoute = null;
    if(ambienteDesarrollo){
        writeRoute = __dirname + "/src/assets/";
    }
    else{
        writeRoute = __dirname + "/dist/disena-tu-curso-docente/assets/";
    }
    fs.writeFileSync(
        writeRoute+"puerto",
        port.toString(),
        (err) => { }
    );
    console.log("Example app listening at http://%s:%s", host, port);
    //Pausa de prueba
    //setTimeout(continueExecution, 10000);
    if(!ambienteDesarrollo){
        process.send('Termino de levantar el Backend');
    }
});

/*function continueExecution(){
    process.send('Termine de levantar el server');
}*/
