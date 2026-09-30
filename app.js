import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
var app = express()
import userRouters from './routes/userRouters.js'
import cors from 'cors'
import path from 'path'

app.use(
    cors({
      exposedHeaders: ["x-message"]
    })
  );

// app.use(function (req, res, next) {
//     res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5505');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
//     res.setHeader('Access-Control-Allow-Credentials', true);
//     next();
// });

app.use(express.json({
    limit:'50mb'
}))

app.use(express.urlencoded({
    extended: false,
    limit:'50mb'
}))




app.use('/', userRouters)
app.use(
  "/Photo",
  express.static("/media/acc_inc/B/SMS/Photo")
);

app.use(
  "/Documents",
  express.static("/media/acc_inc/B/SMS/Documents")
);

app.use(
  "/:type/Documents",
  (req, res, next) => {
    const type = req.params.type;

    const allowedTypes = ["SST"];

    if (!allowedTypes.includes(type)) {
      return res.status(404).send("Invalid document type");
    }

    const documentFolder = path.join(
      "/media/acc_inc/B/SMS",
      type,
      "Documents"
    );

    // console.log("DocumentFolder", documentFolder)

    express.static(documentFolder)(req, res, next);
  }
);

app.use(
  "/:type/Photo/:year",
  (req, res, next) => {

    const type = req.params.type;
    const year = req.params.year;

    const allowedTypes = ["SST", "Bachelor of Commerce", "Bachelor of Arts", "Bachelor of Science"];

    if (!allowedTypes.includes(type)) {
      return res.status(404).send("Invalid document type");
    }

    const documentFolder = path.join(
      "/media/acc_inc/B/SMS",
      type,
      "Photo",
      year
    );

    const staticMiddleware = express.static(documentFolder);

    staticMiddleware(req, res, () => {

      const noImagePath = path.join(
        "/media/acc_inc/B/SMS",
        "NoImage.jpg"
      );

      res.sendFile(noImagePath);

    });
  }
);

//server creation and listening 
const port=process.env.PORT

var server = app.listen(port, "0.0.0.0", ()=>{
    try {
        var host = server.address().address
        var port = server.address().port
        console.log("Server is ON ", host, port);
    } catch (error) {
        console.log("Server Not connected and error is ", error);
    }
})