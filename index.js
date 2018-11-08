const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');
const crossRef = require('crossref');


let pdf2doi = {};

pdf2doi.fromData = function(dataBuffer){
  return new Promise((resolve, reject)=>{
    pdf(dataBuffer).then(function(data) {
        let doi = {doi:"", inFileDOI: "", crossRefDOI: ""};
        //DOI Regex
        let doiRegex = new RegExp('(?:' + '(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?![%"#? ])\\S)+)' + ')', 'g');

        let inFileDOI = data.text.match( doiRegex );
        doi.inFileDOI = inFileDOI ? inFileDOI[0] : inFileDOI; //it should be the first one found

        let lines = data.text.split('\n');
        while(!lines[0].match(/[A-z]/)) lines.shift(); //pdf-parse add two blank lines

        let firstLine = lines[0].match(/[A-z]/);
        lines[0] = lines[0].slice(firstLine.index); //removes page number if found first

        let searchString = lines[0] + " " + lines[1] + " " + lines[2] + " " + lines[3]; //this should contain the journal, title and authors.
        //console.log("search:" + searchString);

        //Feeling looky, just check the first match
        crossRef.works({ query: searchString, rows: 1 }, (err, objs, nextOpts, done) => {
          if (err){
            console.error("Fail to load information from CrossRef"); //err
            doi.doi = doi.inFileDOI;
            resolve(doi);
          }
          //console.log("CrossRefInf:\n");
          //console.log("Title: " + objs[0].title[0] + "\n");
          //console.log("Journal: " + JSON.stringify(objs[0]['container-title'][0]) + "\n");
          //console.log("Authors: " + JSON.stringify(objs[0].author) + "\n");
          //console.log("DOI: " + objs[0].DOI + "\n");

          if(objs[0].title && searchString.indexOf(objs[0].title[0])!=-1){ //console.log("titles match");
            doi.crossRefDOI = objs[0].DOI;
            doi.doi = objs[0].DOI;
            resolve(doi);
          } else {
            doi.doi = doi.inFileDOI;
            resolve(doi);
          }
        });
    });
  });
}

pdf2doi.fromFile = function(fileName){
  let dataBuffer = fs.readFileSync(fileName); //change this to asinc
  return this.fromData(dataBuffer);
}

module.exports = pdf2doi;
