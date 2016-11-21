var prompt = require('prompt')
var fs = require('fs');
var colors = require("colors");
var tasks = [];
var nowish = new Date();
var logFile = './tasks.json';
var archiveFile = './archive.json';
var logJSON = {id: 0, title: "", priority: "", status: "", created:"", completed: ""};
var maxID = 0;


prompt.delimiter = colors.cyan(">>");
prompt.start();

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    };
}

function logTask(task, priority){
  logJSON.id = maxID + 1;
  logJSON.title = task;
  logJSON.priority = priority;
  logJSON.status = 0;
  logJSON.created = nowish.toJSON();
  tasks.push(logJSON);
  updateLog();
}


function updateLog(){
    fs.writeFile(logFile, JSON.stringify(tasks), function(err) {
    if (err) throw err;
    console.log(colors.red('It\'s saved!'));
    readTasks(logFile);
  });
}

function getDays(date){
  var age = Math.floor((nowish - date) / (1000*60*60*24));
  return age;
}

function getDaysMsg(date){
  var age = getDays(date);
  var ageMsg = "";
  if (age < 1) {
    ageMsg = "Less than a day old.";
  } else if (age < 2 ) {
    ageMsg = "About a day old.";
  } else {
    ageMsg = age + " days old.";
    if(age>3 && age<10){
      ageMsg = colors.yellow(ageMsg);
    } else if (age>=10){
      ageMsg = colors.red(ageMsg);
    }
  }
  return ageMsg;
}

function fillArchive(){
   tasks = JSON.parse(fs.readFileSync(logFile, 'utf8'));
   var toArchive = [];
   var toKeep = [];
   for(var i=0; i<tasks.length; i++){
     var task = JSON.parse(JSON.stringify(tasks[i]));
     if(task.status === 0){
       toKeep.push(task);
     } else {
       toArchive.push(task);
     }
   }
  tasks = toKeep;
  fs.writeFile(archiveFile, JSON.stringify(toArchive), function(err) {
    if (err) throw err;
    console.log(toArchive.length + " items Archived. " + toKeep.length + " tasks remain.");
  });
  updateLog();
}

function readTasks(file, statusType){
 var counter = 0;
 var oldMax = 0;
 if(statusType === undefined){
   statusType = 0;
 } else {
   statusType = 1;
 }

 tasks = JSON.parse(fs.readFileSync(file, 'utf8'));
 if (tasks.length > 1){
 tasks = tasks.sort(dynamicSort("ID"));
    for(var i=0; i<tasks.length; i++){
      var task = JSON.parse(JSON.stringify(tasks[i]));
      var response = "";
      oldMax = Math.max(oldMax, task.id);
      if (maxID < oldMax){
        maxID = oldMax;
      }
      if(task.status === statusType){
        counter +=1;
        var currStatus = "Incomplete";
        var displayDate = new Date(task.created);
        response = "ID: " + task.id + " | " + task.title.toProperCase() + " | " + getDaysMsg(displayDate);
        if (task.priority === 1){
          console.log(colors.bgRed.black(response));
        } else if(task.priority === 2){
          console.log(colors.bgWhite.black(response));
        } else {
          console.log(colors.white(response));
        }
      }
    }
    //console.log(counter + " of " + tasks.length + " are incomplete.");
  }
    callPromptQuery();
}

function callPromptQuery(){
  prompt.message = colors.cyan("What would you like to do? \n\r  (add) New Task \n\r  (done:id) Complete Specified Task ID \n\r  (see) See Current Tasks - see:1 to see completed tasks \n\r  (archive) To Move Completed Items to backup file \n\r  (stop) End Process \n\r");
  var actionSchema = {
    properties: {
      action: {
                description: colors.cyan("What's Next?"),
                type: 'string',
                message: colors.red("Type stop if you'd like to stop task.js \n\r Otherwise provide an action to perform..."),
                required: true}
    }
  };
  prompt.get(actionSchema, function (err, result) {
    var req = result.action.split(":");
    //route the action
      if (req[0] == "add"){
        callPromptAdd();
      } else if (req[0] == "done"){
        completeTask(req[1]);
      }else if (req[0] == "see"){
        readTasks(logFile, req[1]);
      } else if (req[0] == "stop"){

      } else if (req[0] == "archive"){
        fillArchive();
      } else {
        console.log(colors.bgRed.white("I didn't get that..."));
        callPromptQuery();
      }
  });
}

function callPromptAdd(){
    prompt.message = "<-Task.js->";
    var schema = {
      properties: {
      task: {
        description: colors.cyan("Let's add a task"),
        type: 'string',
        message: colors.red("Can't make an empty task. You can't do nothing!"),
        required: true},
      priority: {
        description: colors.red(" 1 - High, 2 - Medium, 3 - Low"),
        type: 'number',
        required: true,
        default: 3
      }
    }
    };
    prompt.get(schema, function (err, result) {
      logTask(result.task, result.priority);
    });
}


function completeTask(sentID){
      for(var i=0; i<tasks.length; i++){
        var task = JSON.parse(JSON.stringify(tasks[i]));
        if(task.id == sentID){
          tasks[i].status = 1;
          tasks[i].completed = nowish.toJSON();
        }
      }
      updateLog();
}

readTasks(logFile);
