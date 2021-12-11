/*
    CPSC 321 - Final Project
    server.js
    Sami Blevens
*/
//requiring the express module
const express = require("express");
const app = express();

const PORT = 8080;

//set up mysql
var mysql = require('mysql');
const config = require('./config.json');
// create the connection
var con = mysql.createConnection(config);

// open the connection
con.connect(function(err) {
    if (err) throw err;
    console.log('>>> Connected to the database');
});

//method in express to recognize the incoming Request Object as strings or arrays.
//used for our POST method
app.use(express.urlencoded({
    extended: true
}));

//we want to use embedded javascript "template" files
app.set("view engine", "ejs");

//we want to start listening on PORT number specified, in this case :8080
app.listen(PORT, function () {
    console.log("Server listening on port " + PORT);
});

//respond to get requests to the root URL, e.g., /localhost:8080/
app.get("/", (req, res) => {
    let data = [];
    var query = 'SELECT * '+
                'FROM TaskHandler ' +
                'WHERE completed = 0';
    console.log(query);
    con.query(query, function(err, result, fields) {
        if (err) throw err;
        // data = result;
        console.log(result);
        for (const r of result) {
            r['due_date'] = r['due_date'].toLocaleDateString();
            if(r['assigned']==0)
                r['assigned'] = false;
            else
                r['assigned']=true;
        }
        res.render("home.ejs", {data: result});
    });
});

//respond to get requests to the specified path URL, e.g., /localhost:8080/test/
app.get("/test", (req, res) => {
    //using ejs, render the page as HTML    
    res.render("test.ejs");
});

//respond to POST requests to the specified path URL, e.g., /localhost:8080/show/
app.post("/show", (req, res) => {
    console.log(req.body);
    //we can parse this object or we can submit it directly
    //to our database if it conforms to the schema    
    //we would want to handle this to add to the database    

    //our POST data
    //can access because of "body-parser" <-- depreciated but part of express now
    let first = req.body.first;
    let last = req.body.last;
    let check1 = req.body.check1;
    let rating = req.body.rating;
    let agree = req.body.agree;

    let response = {
        first: first,
        last: last,
        check1: check1,
        rating: rating,
        agree: agree
    };

    //object passed to form and used to build the form output
    res.render("response.ejs", response);
});

//respond to get requests to the specified path URL, e.g., /localhost:8080/test/
app.get("/loopexample", (req, res) => {
    //using ejs, render the page as HTML   
    //for this response, I'm building a more complex object and will
    //use a loop in the rendered .ejs file

    let obj = {
        rowData: [{
            content: "First!",
            random: Math.floor((Math.random() * 1000) + 1)
        },
        {
            content: "Second!",
            random: Math.floor((Math.random() * 1000) + 1)
        },
        {
            content: "Third!",
            random: Math.floor((Math.random() * 1000) + 1)
        }
        ],
        somethingElse: "This is just some random text",
        anotherProperty: 3
    }

    //this is what we are replicating in the ejs

    /*

    console.log(obj.anotherProperty); //except write to HTML instead of console

    console.log(obj.somethingElse);  //except write to HTML instead of console

    let count = 0;

    for (const item of obj.rowData) {
        count++;
        console.log(item.content); //except write to HTML instead of console
        console.log(item.random); //except write to HTML instead of console
    }
    */
    res.render("showmore.ejs", obj);
});