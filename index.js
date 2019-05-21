const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');
const crossRef = require('crossref');

let biggestHeight = 0;
let possibleTitle = "";

let pdfOptions = {};
pdfOptions.version = 'v2.0.550';
pdfOptions.max = 1;
pdfOptions.pagerender = function(pageData) {
    let render_options = {
        //replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
        normalizeWhitespace: false,
        //do not attempt to combine same line TextItem's. The default value is `false`.
        disableCombineTextItems: false,
    }

    return pageData.getTextContent(render_options)
        .then(function(textContent) {
            let last, text = '';

            debugger;
            for (let item of textContent.items) {
                if (!last || last.transform[5] == item.transform[5]){
                  if(!last || last.transform[4] + last.width - item.transform[4] > -10){
                    text += item.str;
                  }
                  else{
                    text += " " + item.str;
                  }
                }
                else{
                    text += '\n' + item.str;
                }
                //this code look for the title, by assuming is will be the biggest text height
                if( biggestHeight < item.height  ){
                  biggestHeight = item.height;
                  possibleTitle = item.str
                } else {
                  if ( biggestHeight == item.height  ){
                    possibleTitle += " " + item.str;
                  }
                }
                last = item;
            }
            //console.log(possibleTitle, biggestHeight);
            return text;
        });
}

let pdf2doi = { verbose:false };

pdf2doi.fromData = function(dataBuffer){
  return new Promise((resolve, reject)=>{
    pdf(dataBuffer, pdfOptions).then((data)=> {
        let doi = {doi:"", inFileDOI: "", crossRefDOI: ""};
        //DOI Regex
        let doiRegex = new RegExp('(?:' + '(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?![%"#? ])\\S)+)' + ')', 'g');

        let inFileDOI = data.text.match( doiRegex );
        doi.inFileDOI = inFileDOI ? inFileDOI[0] : inFileDOI; //it should be the first one found

        let lines = data.text.split('\n');
        if( this.verbose ) console.log(lines);

        while(lines[0] && !lines[0].match(/[A-z]/)){
          lines.shift(); //pdf-parse add two blank lines
        }

        let searchString = "";

        if(lines[0] && lines[1] && lines[2] && lines[3]){
          let firstLine = lines[0].match(/[A-z]/);
          lines[0] = lines[0].slice(firstLine.index); //removes page number if found first

          searchString = lines[0] + " " + lines[1] + " " + lines[2] + " " + lines[3]; //this should contain the journal, title and authors.
          searchString = searchString.toLowerCase().replace(/\s\s+/g, ' ');
        }

        //adds possible title found in the text when parsing
        possibleTitle = possibleTitle.toLowerCase().replace(/\s\s+/g, ' ');
        if( possibleTitle && searchString.indexOf(possibleTitle) == -1 ) searchString += " " + possibleTitle.toLowerCase(); //adds possible title

        if( this.verbose ) console.log("Search String for CrossRef:\n" + searchString);

        //Feeling looky, just check the first match
        crossRef.works({ query: searchString, rows: 1 }, (err, objs, nextOpts, done) => {
          if (err){
            console.error("Fail to load information from CrossRef"); //err
            doi.doi = doi.inFileDOI;
            resolve(doi);
          }
          if( this.verbose ){
            console.log("CrossRefInf:\n");
            console.log("Title: " + objs[0].title[0] + "\n");
            console.log("Journal: " + JSON.stringify(objs[0]['container-title'][0]) + "\n");
            console.log("Authors: " + JSON.stringify(objs[0].author) + "\n");
            console.log("DOI: " + objs[0].DOI + "\n");
          }

          if(objs[0] && objs[0].title && searchString.indexOf(objs[0].title[0].toLowerCase())!=-1){
            if( this.verbose ) console.log("Titles match: DOI found!");
            doi.crossRefDOI = objs[0].DOI;
            doi.doi = objs[0].DOI;
            resolve(doi);
          } else {
            doi.doi = doi.inFileDOI ? doi.inFileDOI.toLowerCase() : "";
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
