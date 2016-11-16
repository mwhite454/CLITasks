  var prompt = require('prompt');
  var fs = require('fs');
  var tasks = [];
  var nowish = new Date();
  var logFile = './tasks.json';
  var logJSON = {id: 0, title: "", priority: "", status: "", created:"", completed: ""};

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

function logTask(task, priority){
  logJSON.id = tasks.length + 1;
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
    console.log('It\'s saved!');
  });
}

function readTasks(file){
 tasks = JSON.parse(fs.readFileSync(file, 'utf8'));
    for(var i=0; i<tasks.length; i++){
      var task = JSON.parse(JSON.stringify(tasks[i]));
      if(task.status === 0){
        var currStatus = "Incomplete";
        var displayDate = new Date(task.created);
        console.log("Task ID: " + task.id + " | " + task.title.toProperCase() + " | Status: " + currStatus + " | Started on: " + displayDate.toLocaleString());
      }

    }
    //callPrompt();
}

function callPromptAdd(){
    prompt.start();
    prompt.get(['task', 'priority'], function (err, result) {
      //
      // Log the results.
      //
      logTask(result.task, result.priority);
      console.log('Command-line input received:');
      console.log('  task: ' + result.task);
      console.log('  priority: ' + result.priority);
    });
}

function callPromptDone(){
    prompt.start();
    console.log('Which task ID is finished?');
    prompt.get('id', function (err, result) {
      completeTask(result.id);

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

  if(process.argv.length < 3){
    //console.log(process.argv.length);
    readTasks(logFile);
  } else if (process.argv[2] === 'add'){
    readTasks(logFile);
    callPromptAdd();
  } else if (process.argv[2] === 'done'){
    readTasks(logFile);
    callPromptDone();
  }
/*process.argv.forEach((val, index) => {

    console.log(`${index}: ${val}`);
});*/
