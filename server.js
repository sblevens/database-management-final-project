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

app.get("/add_todo", (req, res) => {
    //get task details
    var query = 'SELECT task_name '+
                'FROM TaskDetails ';
    con.query(query, function(err, result, fields) {
        if (err) throw err;

        res.render("add_todo.ejs", {data:result});
    });
});

//respond to POST requests to the specified path URL, e.g., /localhost:8080/show/
app.post("/add_todo", (req, res) => {

    //our POST data
    let taskList = req.body.taskList;
    let due = req.body.due;
    let difficulty = req.body.difficulty;
    let time_estimate = req.body.time_estimate;
    let location = req.body.location;

    let response = [
        taskList,
        time_estimate,
        difficulty,
        due,
        location
    ];

    console.log(response);

    //insert query
    var query = 'INSERT INTO TaskHandler ' +
    '(task_name,time_estimate,difficulty,due_date,task_location,completed,date_completed,assigned) '+
                'VALUES ( ? , ? , ? , ? , ? ,0,NULL,0) ';

    //insert query
    con.query(query, response, function(err, result, fields) {
        if (err) throw err;
        console.log(result);

        //once finished - go back to home and get uncompleted tasks
        var query = 'SELECT * '+
                    'FROM TaskHandler ' +
                    'WHERE completed = 0';
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
    
});

app.get("/details/:id",(req,res)=> {
    console.log("in details");
    let id = parseInt(req.params.id);
    console.log(id);
    //get info about specific task
    if(id){
        var query = 'SELECT * '+
                'FROM TaskHandler LEFT OUTER JOIN AssignedTo USING (id) ' +
                ' JOIN TaskDetails USING (task_name) ' +
                'WHERE id = ?';
        console.log(query);
        con.query(query, [id], function(err, result, fields) {
            if (err) throw err;
            console.log(result);
            for (const r of result) {
                r['due_date'] = r['due_date'].toLocaleDateString();
                if(r['date_assigned'])
                    r['date_assigned'] = r['date_assigned'].toLocaleDateString();
                if(r['assigned']==0)
                    r['assigned'] = false;
                else
                    r['assigned']=true;
                if(r['completed']==0)
                    r['completed'] = false;
                else
                    r['completed']=true;
            }
            res.render("details.ejs", {data: result});
        });
    }
    
});

app.get("/assign/:id",(req,res)=>{
    let id = req.params.id;
    //display current people assigned
    var query1 = 'SELECT * FROM AssignedTo WHERE id = ?'
    con.query(query1,[id],function(err,result,fields){
        if(err) throw err;
        for (const r of result) {
            r['date_assigned'] = r['date_assigned'].toLocaleDateString();
        }
        var query2 = '(SELECT person_name FROM Person) EXCEPT (SELECT person_name FROM AssignedTo WHERE id = ?)';
        con.query(query2, [id], function(err,result2,fields){
            if (err) throw err;

            res.render("add_assign.ejs",{data: result, dataList: result2, id: id});
        })

    })
    
    //have a form to add more
});

app.post("/assign",(req,res)=>{
    let personList = req.body.personList;
    let id = req.body.id;
    console.log(new Date().toISOString().split('T')[0]);

    let response = [
        id,
        personList,
        new Date().toISOString().split('T')[0]
    ];

    var query = 'INSERT INTO AssignedTo VALUES (?,?,?)';
    //insert query
    con.query(query, response, function(err, result, fields) {
        if (err) throw err;
        console.log(result);

        //set task to be assigned in TaskHandler
        var query2 = 'UPDATE TaskHandler SET assigned = 1 WHERE id = ?';
        con.query(query2,[id],function(err,result,fields){
            if (err) throw err;
            //once finished - go back to details
            if(id){
                var query = 'SELECT * '+
                        'FROM TaskHandler LEFT OUTER JOIN AssignedTo USING (id) ' +
                        ' JOIN TaskDetails USING (task_name) ' +
                        'WHERE id = ?';
                console.log(query);
                con.query(query, [id], function(err, result, fields) {
                    if (err) throw err;
                    console.log(result);
                    for (const r of result) {
                        r['due_date'] = r['due_date'].toLocaleDateString();
                        if(r['date_assigned'])
                            r['date_assigned'] = r['date_assigned'].toLocaleDateString();
                        if(r['assigned']==0)
                            r['assigned'] = false;
                        else
                            r['assigned']=true;
                        if(r['completed']==0)
                            r['completed'] = false;
                        else
                            r['completed']=true;
                    }
                    res.render("details.ejs", {data: result});
                });
            }
        });
    });
});

app.post("/complete",(req,res)=>{
    let date = req.body.date_completed;
    let id = req.body.id;
    console.log(req.body.id);
    
    let response = [
        date,
        id
    ];

    var query1 = 'UPDATE TaskHandler SET completed = 1, date_completed = ? WHERE id = ?';
    con.query(query1,response,function(err,result,fields){
        if (err) throw err;
        
        //once finished - go back to home and get uncompleted tasks
        var query = 'SELECT * '+
                    'FROM TaskHandler ' +
                    'WHERE completed = 0';
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
});
