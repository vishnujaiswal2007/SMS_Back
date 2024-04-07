import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
var app = express()
import userRouters from './routes/userRouters.js'


app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5505');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(express.json({
    limit:'50mb'
}))

app.use(express.urlencoded({
    extended: false,
    limit:'50mb'
}))




app.use('/', userRouters)

//server creation and listening 
const port=process.env.port

var server = app.listen(port, ()=>{
    try {
        var host = server.address().address
        var port = server.address().port
        console.log("Server is ON at http:localhost//%s:%s", host, port);
    } catch (error) {
        console.log("Server Not connected and error is ", error);
    }
})