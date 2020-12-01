
//import { createWorker,RecognizeResult } from ("tesseract.js");
let pdfData;
let filename;
let down_pdf = document.getElementById("downloadPDF");
let text_extraction_progress = document.getElementById("progress");
let extracted_text = document.getElementById("text");
let recog_loader = document.getElementById('loader');
let Detection_Result_Div = document.getElementById('Detection_Result_Div');


function D_PDF() {
  if (down_pdf.value === "") {
    alert("First insert an image");
    return;
  }
  fetch("/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: filename, data: pdfData }),
  })
    .then((res) => res.blob())
    .then((resObj) => {
      // It is necessary to create a new blob object with mime-type explicitly set for all browsers except Chrome, but it works for Chrome too.
      const newBlob = new Blob([resObj], { type: "application/pdf" });

      // MS Edge and IE don't allow using a blob object directly as link href, instead it is necessary to use msSaveOrOpenBlob
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(newBlob);
      } else {
        // For other browsers: create a link pointing to the ObjectURL containing the blob.
        const objUrl = window.URL.createObjectURL(newBlob);

        let link = document.createElement("a");
        link.href = objUrl;
        link.target = "_blank"; //open in new tab
        link.download = `${filename}.pdf`;
        // link.download = resObj.filename;
        link.click();

        // For Firefox it is necessary to delay revoking the ObjectURL.
        setTimeout(() => {
          window.URL.revokeObjectURL(objUrl);
        }, 250);
      }
    })
    .catch((error) => {
      console.log("DOWNLOAD ERROR", error);
    });
}

function sendFile() {
  let files = document.getElementById("file").files;

  if (files.length == 0) {
    alert("Insert a File");
    return;
  }
  filename = files[0].name;
  var reader = new FileReader();
  reader.readAsDataURL(files[0]);
  reader.onload = function (event) {
    document.getElementById("image").src = event.target.result;
  };

  recognizetext(files[0]);

  //   const formData = new FormData();
  //   formData.append("fileUpload", files[0]);

  //   fetch("/uploadToServer", {
  //     method: "POST",
  //     body: formData,
  //   }).then((res) => res.text()).then((msg)=>{document.getElementById('text').innerHTML=msg})
  //   .then(()=>{document.getElementById('downloadpdf').style.display="block"});
}

function removeValues() {
  text_extraction_progress.textContent = "";
  extracted_text.textContent = "";
  down_pdf.style.display = "none";
}

function recognizetext(image) {
  const worker = Tesseract.createWorker({
    logger: (m) => {
      if (1) {
        text_extraction_progress.textContent = `${m.status} ${(
          m.progress * 100
        ).toFixed(2)} %`;
      }
    },
  });
  (async (image) => {
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    const {
      data: { text },
    } = await worker.recognize(image);

    extracted_text.innerHTML = `<h5> ${text} </h5>`;
    down_pdf.style.display = "inline";
    down_pdf.value = filename;
    const { data: Data } = await worker.getPDF("Tesseract OCR Result");
    pdfData = Data;
    await worker.terminate();
  })(image);             //self-executing anonymous function
}



function removeOldObjectsImages() {
  recog_loader.style.display = "none";
  Detection_Result_Div.style.display = "none";
   let image_area = document.getElementById("Object_Recog_Image");
  //removing_element.parentNode.removeChild(removing_element);
  image_area.style.display = "none";
  image_area.style.width = "none";
  image_area.style.height = "100%";
  let OldFrameDiv = document.getElementsByClassName('frame');

  //OldFrameDiv.forEach(elem=>{elem.parentNode.removeChild(elem);});
  while (OldFrameDiv.length) {
    OldFrameDiv[0].remove();
  }
  let color_match=document.getElementsByClassName("color_match");
  while(color_match.length)
  {
    color_match[0].remove();
  }
}

async function startDetection() {

  let files = document.getElementById("ObjImage").files;

  if (files.length == 0) {
    alert("Insert a File");
    return;
  }
  filename = files[0].name;
  recog_loader.style.display = "inline-block";

  var reader = new FileReader();
  reader.readAsDataURL(files[0]);
  reader.onload = function (event) {
    document.getElementById("Object_Recog_Image").src = event.target.result;
    document.getElementById("Object_Recog_Image").style.display="inline-block";
  };

  var formData = new FormData();
  formData.append("ObjImage", files[0]);
  await fetch("/ObjDetection", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((msg) => {
      document.getElementById('Objects_text').textContent = msg;
      recog_loader.style.display = "none";
      Detection_Result_Div.style.display = "inline-block";
      drawBoxes(JSON.parse(msg));
    })
    .catch((err) => console.log("\nError Fetch => \n" + err));
}

function drawBoxes(payload) {
  var colors = ['#2ECC40', '#FFDC00', '#0074D9', '#FF851B', '#39CCCC', '#DC143C', '#5E2D79', '#EC7063','#FFD8B3','#AEA8A0','#385E0F'];
  let count = 0;

  let dimension = payload["images"][0].dimensions;
  let detected_objects = payload.images[0].objects.collections[0].objects;
  

  let image = document.getElementById("Object_Recog_Image");
  image.style.width = dimension.width + "px";
  image.style.height = dimension.height + "px";

  let BoxesCol = document.getElementById("create_boxes_on_image");
  let color_to_object = document.getElementById("color_to_object");

  detected_objects.forEach(element => {
    let frame = document.createElement('div');
    frame.classList.add("frame");
    frame.style.position = "absolute";
    frame.style.width = element.location.width + "px";
    frame.style.height = element.location.height + "px";
    frame.style.left = element.location.left + "px";
    frame.style.top = element.location.top + "px";
    let color = (count < detected_objects.length) ? colors[count] : "black";
    frame.classList.add(color);
    frame.style.border = '3px solid ' + color;
    BoxesCol.appendChild(frame);


    let div = document.createElement('div');
    div.style.padding = '4px';
    div.style.marginTop = '4px';
    div.style.border = '1px solid';
    div.style.borderRadius = '15px';
    div.style.textAlign='left';
    div.classList.add("color_match");
    div.classList.add(color);
    div.addEventListener("mouseover", mouseOver);
    div.addEventListener("mouseout", mouseOut);

    let span = document.createElement('span');
    span.style.width = '25px';
    span.style.height = '25px';
    span.style.display = 'inline-block';
    span.style.borderRadius = '50%';
    span.style.marginRight = '6px';
    span.style.verticalAlign='middle';
    span.style.backgroundColor = color;

    div.appendChild(span);
    div.innerHTML += `<span style="font-weight:bold">Object</span> : ${element.object}  <span style="font-weight:bold">Score</span> : ${element.score}`;
    count++;

    color_to_object.appendChild(div);
    
  });
}


function mouseOver(event)
{
 
  let className= event.target.className.split(" ");
  if(className.includes('color_match'))
  {
  let elements=document.getElementsByClassName(className[1]);

  for(i=0;i<elements.length;i++)
  {
    elements[i].style.background =className[1];
    elements[i].style.opacity =0.5;
  }
}

}

function mouseOut(event)
{

  let className= event.target.className.split(" ");
  if(className.includes('color_match'))
  {
  let elements=document.getElementsByClassName(className[1]);

  for(i=0;i<elements.length;i++)
  {
    elements[i].style.background='none';
    elements[i].style.opacity =1;
  }
}

}
