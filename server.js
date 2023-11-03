const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs/promises');
const fss = require('fs');
var cors = require('cors');
const { NetCDFReader } = require("netcdfjs");
const parseGeoraster = require("georaster");
const moment = require("moment")

// const file = "./IDR310A1.RF3.20231004232000.nc"
const tifDir = "./tifFiles";
const jsonLtsDir = "./json";

const port = process.env.NODE_PORT || 8080;

const root = path.join(__dirname, 'dist', 'x-dash');


// app.get('/' ,function(req, res) {
//   fs.stat(root + req.path, function(err){
//     if(err){
//         res.sendFile("index.html", { root });
//     }else{
//         res.sendFile(req.path, { root });
//     }
//   })
// });

app.use(cors());

app.listen(port);
console.log('Listening on port : '+ port);

async function convertImageToBase64(file) {
  const data = await fs.readFile(file);
  let base64Image = Buffer.from(data, 'binary').toString('base64');
  
  return base64Image;
}

async function getLocalFiles(type, ltsFileWarped) {
  let files = [];
  const dir = await fs.readdir(tifDir)
  for (const file of dir) {
    let fileSplit = file.split(".");
    if( fileSplit[0] === type ){ // filter by prefix
      if( file === ltsFileWarped ){
        files.push({
          file,
          fileDir: await convertImageToBase64(`${tifDir}/${file}`),
        })
      }
    }
    
    // let fileSplit = file.split(".");
    // if( fileSplit[0] === type ){ // filter by prefix
    //   const stats =  await fs.stat(`${tifDir}/${file}`);
    //   console.log( stats )
    //   if( parseFloat( startDateTime ) <= parseFloat( stats.mtimeMs ) && parseFloat( endDateTime ) >= parseFloat( stats.mtimeMs ) ){

    //     files.push({
    //       file,
    //       fileDir: await convertImageToBase64(`${tifDir}/${file}`),
    //       date: stats.birthtime
    //     })
    //   }      
    // }
  }
  return files;
}

app.get('/getAccumulationRainPrecipitation', async (req, res) => {
  let latestFile = ''
  let latestFileWarped = ''

  // ** 
  // ** get the latest file inserted
  // ** and convert the file name to the correct format
  // **

  if( req.query.type === 'IDR310AR' ){
    latestFile = await  JSON.parse( fss.readFileSync( `${jsonLtsDir}/IDR310AR.json`, 'utf8' ) );
    let fileNameSplit = latestFile.name.split(".");
    latestFileWarped = `${fileNameSplit[0]}.${fileNameSplit[1]}.${fileNameSplit[2]}-warped.tif`
  }
  if( req.query.type === 'IDR310A1' ){
    latestFile = await JSON.parse( fss.readFileSync( `${jsonLtsDir}/IDR310A1.json`, 'utf8' ) );
    let fileNameSplit = latestFile.name.split(".");
    latestFileWarped = `${fileNameSplit[0]}.${fileNameSplit[1]}.${fileNameSplit[2]}-warped.tif`
  }
  if( req.query.type === 'IDR310A9' ){
    latestFile = await JSON.parse( fss.readFileSync( `${jsonLtsDir}/IDR310A9.json`, 'utf8' ) );
    let fileNameSplit = latestFile.name.split(".");
    latestFileWarped = `${fileNameSplit[0]}.${fileNameSplit[1]}.${fileNameSplit[2]}-warped.tif`
  }
  if( req.query.type === 'IDR310AD' ){
    latestFile = await JSON.parse( fss.readFileSync( `${jsonLtsDir}/IDR310AD.json`, 'utf8' ) );
    let fileNameSplit = latestFile.name.split(".");
    latestFileWarped = `${fileNameSplit[0]}.${fileNameSplit[1]}.${fileNameSplit[2]}-warped.tif`
  }

  // console.log( latestFileWarped )
  // let filteredFiles = await getLocalFiles(req.query.type, req.query.startDateTime, req.query.endDateTime, latestFileWarped);
  let filteredFiles = await getLocalFiles(req.query.type, latestFileWarped);
  res.json( filteredFiles );
})  


