/**********************************************************************
 * NAME: Sami Blevens
 * CLASS: CPSC 321 Fall 2021
 * DATE: 11.6.2021
 * HOMEWORK: HW 7
 * DESCRIPTION: version 2 of project - tasks - updated from hw6
 **********************************************************************/


-- TODO: add drop table statements
DROP TABLE IF EXISTS Rating;
DROP TABLE IF EXISTS AssignedTo;
DROP TABLE IF EXISTS TaskHandler;
DROP TABLE IF EXISTS TaskDetails;
DROP TABLE IF EXISTS Person;


-- TODO: add create table statements
/* Information for each person in the system - can be assigned and can rate */
CREATE TABLE Person(
    person_name varchar(100),
    created_date DATE NOT NULL,
    isActive BIT NOT NULL, /* assuming not active persons are not assigned to new tasks */
    PRIMARY KEY (person_name)
); 

/*task details */
CREATE TABLE TaskDetails(
    task_name varchar(100),
    task_description TINYTEXT NOT NULL,
    PRIMARY KEY (task_name)
);

/* TaskHandler table - information about task, completetion, and assignment */
CREATE TABLE TaskHandler(
    task_name varchar(100),
    time_estimate TIME NOT NULL, /*time estimated to complete task */
    difficulty INT NOT NULL, /*difficulty estimate 1: not difficult -> 10: very difficult */
    due_date DATE, /* task must be completed by or on this date */ 
    task_location varchar(100) NOT NULL, /* where the task will be performed */
    completed BOOL NOT NULL, /* 0: not completed, 1: completed */
    date_completed DATE NULL,
    assigned BOOl NOT NULL,
    PRIMARY KEY (task_name,due_date),
    FOREIGN KEY (task_name)
        REFERENCES TaskDetails(task_name)
);

CREATE TABLE AssignedTo(
    task_name varchar(100),
    due_date DATE,
    person_name varchar(100) NULL, /*person task is assigned to */
    date_assigned DATE NULL, /* date person was assigned to task */
    PRIMARY KEY (task_name,due_date,person_name),
    FOREIGN KEY (task_name,due_date) REFERENCES TaskHandler(task_name,due_date),
    FOREIGN KEY (person_name) REFERENCES Person(person_name)
);


/* apply ratings to specific compelted tasks */
CREATE TABLE Rating(
    task_name varchar(100),
    due_date DATE,
    person_name varchar(100),
    stars INT, /* int 0-5 */
    rated_date DATE NOT NULL,
    PRIMARY KEY (task_name, due_date, person_name, stars),
    FOREIGN KEY (task_name,due_date)
        REFERENCES TaskHandler(task_name,due_date),
    FOREIGN KEY (person_name)
        REFERENCES Person(person_name)
);


-- TODO: add insert statements
/* init Person */
INSERT INTO Person VALUES ('Sam','2021-10-25',1), 
('Kim','2021-10-25',1),('Tori','2021-10-25',1),
('Katie','2021-10-25',1), ('Hannah','2021-10-25',0);

/*adding details */
INSERT INTO TaskDetails VALUES ('Garbage','take garbage out'),
('Clean Kitchen','clean kitchen counter, sink, and stove'),
('Clean Floors','Vacuum and swifter the floors'),
('Clean Bathroom','Clean bathroom sink, floors, and toilet'),
('Grocery Shopping','buy groceries needed for the house')
;

/*adding tasks */
/*unassigned easy task */
INSERT INTO TaskHandler VALUES ('Garbage','00:05:00', 3, '2021-12-31', 'Kitchen', 
 0,NULL,0);
/* unassigned difficult task */
INSERT INTO TaskHandler VALUES ('Clean Kitchen','00:30:00', 6, '2021-12-31', 'Kitchen', 
 0,NULL,0);
/*task completed on time */
INSERT INTO TaskHandler VALUES ('Clean Floors','00:15:00', 4, '2021-11-18', 'House', 
 1,'2021-11-15',1);
/* task not completed on time */
INSERT INTO TaskHandler VALUES ('Clean Bathroom','00:30:00', 6, '2021-11-18', 'Bathroom', 
 0, NULL,1);
/* task completed on time */
INSERT INTO TaskHandler VALUES ('Clean Floors','00:15:00', 4, '2021-11-30', 'House', 
 1,'2021-11-28',1);


/* assign to task */
INSERT INTO AssignedTo VALUES ('Clean Floors', '2021-11-18', 'Sam', '2021-11-01');
INSERT INTO AssignedTo VALUES ('Clean Bathroom', '2021-11-18', 'Tori', '2021-11-01');
INSERT INTO AssignedTo VALUES ('Clean Bathroom', '2021-11-18', 'Sam', '2021-11-01');
INSERT INTO AssignedTo VALUES ('Clean Floors', '2021-11-30', 'Kim', '2021-11-15');

/*adding ratings */
INSERT INTO Rating VALUES ('Clean Floors','2021-11-18','Katie',4, '2021-11-20'),
('Clean Floors', '2021-11-18', 'Kim', 5, '2021-11-21'),
('Clean Floors', '2021-11-30', 'Sam', 2, '2021-11-29');


/*added data for HW7 */

INSERT INTO TaskHandler VALUES ('Garbage','00:05:00',3,'2021-11-18','Kitchen',1,'2021-11-15',1),
('Clean Bathroom','00:30:00',6, '2021-11-14','Bathroom',1,'2021-11-04',1),
('Clean Floors', '00:15:00',4,'2021-12-15','House',1,'2021-12-16',1)
;

/* assign to task */
INSERT INTO AssignedTo VALUES ('Garbage', '2021-11-18', 'Tori','2021-11-01');
INSERT INTO AssignedTo VALUES ('Clean Bathroom', '2021-11-14', 'Tori', '2021-11-01');
INSERT INTO AssignedTo VALUES ('Clean Floors', '2021-12-15', 'Tori','2021-12-01');

INSERT INTO Rating VALUES ('Clean Bathroom', '2021-11-14','Kim',3,'2021-11-15'),
('Clean Floors','2021-12-15','Kim',4,'2021-12-17')
;



-- TODO: add select statements (to print tables)
select * from Person;
select * from TaskDetails;
select * from TaskHandler;
select * from Rating;
select * from AssignedTo;


