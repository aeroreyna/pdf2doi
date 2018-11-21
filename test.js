const pdf2doi = require("./index.js");
const doi2bib = require('doi2bib');

pdf2doi.verbose = true;

pdf2doi.fromFile(process.argv[2] || "./497514.pdf").then((doi)=>{
  console.log(doi);
  if(doi.doi) doi2bib.getCitation(doi.doi).then(console.log);
})

//This is for saving the text in a file with the same name...
/*let pathO = path.parse(process.argv[2]);
pathO.ext = ".txt";
pathO.base = "";
fs.writeFile(path.format(pathO), data.text, function(err) {
  if(err) {
      return console.log(err);
  }
  console.log("The file was saved!");
});
*/
