# pdf2doi

This is a node.js tool to find the DOI of pdf scientific articles. It tries to first find it in the document, and also search for information with the CrossRef api.

Install:
```bash
npm i pdf2doi
```

Usage:

```js
const pdf2doi = require("pdf2doi.js");
const doi2bib = require('doi2bib');

pdf2doi.fromFile("./497514.pdf").then((doi)=>{
  console.log(doi);
  if(doi.doi) doi2bib.getCitation(doi.doi).then(console.log);
})
```

It returns an obj with the most trusted DOI information, between the alternatives found in the file, and by the CrossRef search.

```json
{
  doi: '10.1155/2014/497514',
  inFileDOI: '10.1155/2014/497514',
  crossRefDOI: '10.1155/2014/497514'
}
```

The doi2bib package can be used to return the full information of the founded DOI.

```bib
@article{DOI:10.1155/2014/497514,
        doi = {10.1155/2014/497514},
        url = {https://doi.org/10.1155%2F2014%2F497514},
        year = 2014,
        publisher = {Hindawi Limited},
        volume = {2014},
        pages = {1--20},
        author = {Erik Cuevas and Adolfo Reyna-Orta},
        title = {A Cuckoo Search Algorithm for Multimodal Optimization},
        journal = {The Scientific World Journal}
}
```

The pdf provided to test in this package was extracted from [hindawi.com](https://www.hindawi.com/journals/tswj/2014/497514/abs/). (Some good stuff).
