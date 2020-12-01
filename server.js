const express = require("express");
const app = express();
const bodyParser = require("body-parser");
var path = require("path");
const fs = require("fs");
const fileupload = require("express-fileupload");
const GetFile = fileupload();
const VisualRecognitionV4 = require("ibm-watson/visual-recognition/v4");
const { IamAuthenticator } = require("ibm-watson/auth");

let port = 3000;

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "views")));

app.get("/", (req, res) => {
  res.sendFile("./views/index.html");
});

app.post("/download", (req, res) => {
  fs.writeFileSync(`${req.body.name}.pdf`, Buffer.from(req.body.data));
  console.log("Pdf Generated");

  var data = fs.readFileSync(`${req.body.name}.pdf`);
  res.contentType("application/pdf");
  res.send(data);
  fs.unlinkSync(`${req.body.name}.pdf`);
});

app.post("/ObjDetection", GetFile, async (req, res) => {
  //console.log(req.files.ObjImage);  //req.files is the property from GetFile middleware and ObjImage is the name of the received file

  //Reading the Credential data from file
  try {
    const Bufferdata = fs.readFileSync("./credentials.json");
    const data=JSON.parse(Bufferdata);

    const visualRecognition = new VisualRecognitionV4({
      version: "2019-02-11",
      authenticator: new IamAuthenticator({
        apikey: data.apikey,
      }),
      serviceUrl:data.serviceURL,
    });

    const params = {
      imagesFile: [
        {
          data: req.files.ObjImage.data,
          contentType: "image/jpeg",
        },
      ],
      collectionIds: data.collectionIds, //modelID
      features: ["objects"],
      threshold: 0.16,
    };

    await visualRecognition
      .analyze(params)
      .then((response) => {
        res.json(JSON.stringify(response.result, null, 2));
      })
      .catch((err) => {
        console.log("error in analyze: \n", err);
        res.json({ status: "Error While Analyzing" });
      });
  } catch (err) {
    console.log(
      "\n\nError while Reading the Data from credentials File : \n" + err
    );
  }
});
console.log("\nRunning on Port " + port);
app.listen(port);
