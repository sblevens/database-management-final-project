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
        res.render("home.ejs", {data: result, title: "Uncompleted Tasks"});
    });
});

app.get("/all",(req,res)=>{
    var query = 'SELECT * '+
                'FROM TaskHandler ';
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
        res.render("home.ejs", {data: result, title: "All Tasks"});
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
            res.render("home.ejs", {data: result, title: "Uncompleted Tasks"});
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
            // console.log(result);
            for (const r of result) {
                r['due_date'] = r['due_date'].toLocaleDateString();
                if(r['date_assigned'])
                    r['date_assigned'] = r['date_assigned'].toLocaleDateString();
                if(r['assigned']==0)
                    r['assigned'] = false;
                else
                    r['assigned']=true;
                if(r['completed']==0){
                    r['completed'] = false;
                }else{
                    r['completed']=true;
                    r['date_completed'] = r['date_completed'].toLocaleDateString();
                }
            }
            var query2 = 'SELECT * FROM Rating WHERE id = ?';
            con.query(query2,[id],function(err,result2,fields){
                if(err) throw err;
                console.log("result 2");
                console.log(result2);
                for (const r of result2) {
                    r['rated_date'] = r['rated_date'].toLocaleDateString();
                }

                res.render("details.ejs", {data: result,ratings:result2});
            });
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
        var query2 = '(SELECT person_name FROM Person WHERE isActive=1 ) EXCEPT (SELECT person_name FROM AssignedTo WHERE id = ?)';
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
                        console.log("in results");
                        r['due_date'] = r['due_date'].toLocaleDateString();
                        console.log("due date");
                        if(r['date_assigned'])
                            r['date_assigned'] = r['date_assigned'].toLocaleDateString();
                        console.log("date assigned")
                        if(r['assigned']==0)
                            r['assigned'] = false;
                        else
                            r['assigned']=true;
                        if(r['completed']==0)
                            r['completed'] = false;
                        else
                            r['completed']=true;
                    }
                    var query2 = 'SELECT * FROM Rating WHERE id = ?';
                    con.query(query2,[id],function(err,result2,fields){
                        if(err) throw err;
                        console.log(result2.length);
                        for (const r of result2) {
                            console.log("rated date");
                            r['rated_date'] = r['rated_date'].toLocaleDateString();
                        }
                        res.render("details.ejs", {data: result,ratings:result2});
                    });
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
            res.render("home.ejs", {data: result, title: "Uncompleted Tasks"});
        });

    });
});


app.get("/review/:id",(req,res)=>{
    let id = req.params.id;
    
    //get all people
    var query = 'SELECT * from Person WHERE isActive = 1';
    con.query(query, function(err,result,fields){
        if(err) throw err;
        res.render("review.ejs",{people:result, id:id});
    });
});

app.post("/review",(req,res)=>{
    let id = req.body.id;
    let personList = req.body.personList;
    let stars = req.body.stars;

    let response = [
        id,
        personList,
        stars,
        new Date().toISOString().split('T')[0]
    ]

    var query = 'INSERT INTO Rating VALUES (?,?,?,?)';
    con.query(query,response,function(err,result,fields){
        if (err) throw err;

        //go back to details page
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
                
                var query2 = 'SELECT * FROM Rating WHERE id = ?';
                con.query(query,[id],function(err,result2,fields){
                    if(err) throw err;
                    for (const r of result2) {
                        r['rated_date'] = r['rated_date'].toLocaleDateString();
                    }
                    res.render("details.ejs", {data: result,ratings:result2});
                });
            });
        }
    });
});


app.get("/reports",(req,res)=>{
    //get list of tasks
    var query = 'SELECT task_name FROM TaskDetails';
    //get list of people
    var query2 = 'SELECT person_name FROM Person WHERE isActive = 1';
    con.query(query,function(err,result,fields){
        if(err) throw err;
        con.query(query2,function(err,result2,fields){
            if(err) throw err;
            res.render("reports.ejs",{tasks:result,people:result2});
        });
    });
});

app.post("/assignedTasks",(req,res)=>{
    let question = req.body.question;
    let most = req.body.most;
    console.log(most);
    if(most==1){
        console.log("in most");
        var query = 'SELECT task_name, COUNT(person_name) FROM TaskHandler ' +
                'LEFT OUTER JOIN AssignedTo USING (id) ' +
                'GROUP BY task_name ' +
                'HAVING COUNT(person_name) >= ALL(SELECT COUNT(person_name) FROM TaskHandler ' +
                'LEFT OUTER JOIN AssignedTo USING (id) GROUP BY task_name) ' 

    } else {
        var query = 'SELECT task_name, COUNT(person_name) FROM TaskHandler ' +
                'LEFT OUTER JOIN AssignedTo USING (id) ' +
                'GROUP BY task_name ' +
                'HAVING COUNT(person_name) <= ALL(SELECT COUNT(person_name) FROM TaskHandler ' +
                'LEFT OUTER JOIN AssignedTo USING (id) GROUP BY task_name) ' 

    }

    con.query(query,function(err,result,fields){
        if(err) throw err;
        res.render("answer.ejs",{question: question, data: result});
    });

});

app.post("/assignedPerson",(req,res)=>{
    let question = req.body.question;
    let most = req.body.most;
    if(most==1){
        var query = 'SELECT person_name, COUNT(*) From AssignedTo ' +
                    'GROUP BY person_name HAVING COUNT(*) >= ALL(SELECT COUNT(*) ' +
                    'FROM AssignedTo GROUP BY person_name) ';
    } else {
        var query = 'SELECT person_name, COUNT(*) From AssignedTo ' +
        'GROUP BY person_name HAVING COUNT(*) <= ALL(SELECT COUNT(*) ' +
        'FROM AssignedTo GROUP BY person_name) ';
    }

    con.query(query, function(err,result,fields){
        if(err) throw err;
        res.render("answer.ejs",{question:question, data:result});
    });
});

app.post("/overdueTask",(req,res)=>{
    let question = req.body.question;
    let most = req.body.most;
    if(most==1){
        var query = 'SELECT task_name, due_date, count(*) FROM TaskHandler WHERE ' +
        '(date_completed IS NULL AND due_date < CURDATE()) OR ' +
        '(date_completed IS NOT NULL AND date_completed > due_date) GROUP BY task_name HAVING COUNT(*) >= ALL( ' +
        'SELECT COUNT(*) FROM TaskHandler where (date_completed IS NULL and due_date < CURDATE()) ' +
        'OR (date_completed IS NOT NULL AND date_completed > due_date) Group By task_name)';
    } else {
        var query = 'SELECT task_name, due_date, count(*) FROM TaskHandler WHERE ' +
        '(date_completed IS NULL AND due_date < CURDATE()) OR ' +
        '(date_completed IS NOT NULL AND date_completed > due_date) GROUP BY task_name HAVING COUNT(*) <= ALL( ' +
        'SELECT COUNT(*) FROM TaskHandler where (date_completed IS NULL and due_date < CURDATE()) ' +
        'OR (date_completed IS NOT NULL AND date_completed > due_date) Group By task_name)';
    }
    console.log(query);
    con.query(query, function(err,result,fields){
        if(err) throw err;
        console.log(result);
        res.render("answer.ejs",{question:question, data:result});
    });
});

app.post("/overduePerson",(req,res)=>{
    let question = req.body.question;
    let most = req.body.most;
    if(most==1){
        var query = 'SELECT person_name, count(*) FROM TaskHandler Join AssignedTo USING (id) WHERE ' +
        '(date_completed IS NULL AND due_date < CURDATE()) OR ' +
        '(date_completed IS NOT NULL AND date_completed > due_date) GROUP BY person_name HAVING COUNT(*) >= ALL( ' +
        'SELECT COUNT(*) FROM TaskHandler JOIN AssignedTo USING (id) where (date_completed IS NULL and due_date < CURDATE()) ' +
        'OR (date_completed IS NOT NULL AND date_completed > due_date) Group By person_name)';
    } else {
        var query = 'SELECT person_name, count(*) FROM TaskHandler Join AssignedTo USING (id) WHERE ' +
        '(date_completed IS NULL AND due_date < CURDATE()) OR ' +
        '(date_completed IS NOT NULL AND date_completed > due_date) GROUP BY person_name HAVING COUNT(*) <= ALL( ' +
        'SELECT COUNT(*) FROM TaskHandler JOIN AssignedTo USING (id) where (date_completed IS NULL and due_date < CURDATE()) ' +
        'OR (date_completed IS NOT NULL AND date_completed > due_date) Group By person_name)';
    }

    con.query(query,function(err,result,fields){
        if(err) throw err;
        res.render("answer.ejs",{question:question, data:result});
    });
});


app.post("/mostAssignedToTask",(req,res)=>{
    let question = req.body.question;
    let task = req.body.taskList;

    var query = 'SELECT task_name, person_name, count(*) FROM TaskHandler JOIN AssignedTo USING (id) '+
    'WHERE task_name = ? GROUP BY person_name HAVING COUNT(*) >= ALL(SELECT COUNT(*) FROM '+
    'TaskHandler JOIN AssignedTo USING (id) WHERE task_name = ? GROUP BY person_name) ';

    con.query(query,[task,task],function(err,result,fields){
        if(err) throw err;
        res.render("answer.ejs",{question:question, data:result});
    });

});

app.post("/mostTaskAssignedTo",(req,res)=>{
    let question = req.body.question;
    let person = req.body.personList;

    var query = 'SELECT task_name, person_name, date_assigned, count(*) FROM ' +
    'TaskHandler JOIN AssignedTo USING (id) WHERE person_name = ? GROUP BY ' +
    'task_name HAVING COUNT(*) >= ALL(SELECT COUNT(*) FROM TaskHandler JOIN AssignedTo '+ 
    'USING (id) WHERE person_name = ? GROUP BY task_name)';

    con.query(query,[person,person],function(err,result,fields){
        if(err) throw err;
        res.render("answer.ejs",{question:question, data:result});
    });
});

app.post("/avgTimeToComplete",(req,res)=>{
    let question = req.body.question;
    let task = req.body.avgTaskList;
    let person = req.body.AvgPersonList;
    let response = [];
    response.push(1);

    var query = 'SELECT AVG(DATEDIFF(date_completed, date_assigned)) as avg_time '+
    'FROM TaskHandler JOIN AssignedTo USING (id) WHERE '+
    'completed = ? ';

    if(task.localeCompare("All")!=0){
        query = query + ' AND task_name = ? ';
        response.push(task);
    }
    if(person.localeCompare("All")!=0){
        query = query + ' AND person_name = ? ';
        response.push(person);
    }
    console.log(query);
    console.log(response);
    con.query(query,response,function(err,result,fields){
        if(err) throw err;
        console.log(result);
        res.render("answer.ejs",{question:question,data:result});
    });
});

app.post("/moreThanAvgRating",(req,res)=>{
    let question = req.body.question;
    var query = 'SELECT task_name, due_date, COUNT(*) AS total FROM TaskHandler '+
    'JOIN Rating USING (id) GROUP BY id HAVING COUNT(*) >= (SELECT AVG(tot_rat) FROM ' +
    '(SELECT COUNT(*) as tot_rat FROM TaskHandler JOIN Rating USING (id) GROUP BY id) as co) ';

    con.query(query,function(err,result,fields){
        if(err) throw err;
        res.render("answer.ejs",{question:question, data:result});
    });
})


app.get("/search",(req,res)=>{
    res.render("search.ejs");
});

app.post("/getSearch",(req,res)=>{
    let start = req.body.start_date;
    let end = req.body.end_date;

    console.log(start);

    let response = [
        start,
        end
    ];

    var query = 'SELECT * FROM TaskHandler WHERE due_date > ? AND  due_date < ?';
    con.query(query,response,function(err,result,fields){
        if(err) throw err;
        console.log(query);
        console.log(result);
        res.render("home.ejs",{data:result, title: "Tasks"});
    });
});
