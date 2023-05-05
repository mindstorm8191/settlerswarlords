// Worker task management plans

if(w.tasks[0].targetx===null) {
  let group = -- get itemsNeeded instance containing worker location field
  let outcome = worker.pathToItem(group.options.map(o=>o.name);
  if(outcome. result = "fail") {
    console. log('Could not find any of '+ group. options. map(o=>o. name). join(', ));
    // find a structure that can create this
    let taskId = -1;
    let task building = game. structures. find(st=>{
      let task = st. tasks. findIndex(t=>{
        return DanCommon.doubleIncludes(t.outputItems, group.options.map(I=>i.name));
      });
      if(task!==-1) {
        taskId = task;
        return true;
      }
      return false;
    });
    if(taskId==-1) {
      // item can't be crafted
    }
    let newTask = game. create task(taskBuilding, taskBuilding.tasks[taskId]);
    w.assign First(newTask);
  }else{
    w.tasks[0].taggedItems.push(outcome.item);
    w.tasls[0].targetx = outcome.locationx;
    w.tasks[0].targety = outcome.locationy;
  }
}

function game.createPickupTask(worker, item, fromTile, toTile) {
  // 

  // Existing task generator needs renamed to createBuildingTask.
  // Add a createBasicTask that provides an empty data structure
  let newtask = {
    id: game.getNextTaskId(),
    building: null,
    task: null,
    status: 'assigned',
    taskType: 'move item',
    worker: worker,
    targetx: targetx,
    targety: targety,
    //itemsNeeded: [] - this data will be pulled as static information from the root task object. No need to keep it here
    quantity: quantity, // this value will go down as we complete each unit
    itemsTagged: [],
    progress: 0,
    //ticksToComplete - this will also be from the root task object (as buildTime). If no root task is associated to this task,
    // its value will be 1 instead. };
}

if(w.tasks[0].task.itemsNeeded.length!==0) {
  let option choices = [];
  // This will contain:
  // groupId - which of the recipe parts this is for
  // optionId - which choice of that recipe this is for
  // hasAllItems - true if all items can be accounted for
  // items - list of items that can be accessed, along with their distance and coordinates
  for(let group=0; group<=w.tasks[0].task.itemsNeeded; group++) {
    for(let choice=0; choice<=w.tasks[0].task.itemsNeeded[group]. length; choice++) {
      let working = true;
      let build = {groupId: group, optionId: choice, has All Items: false};
      while(working) {
        let outcome = game.pathToItem();
        if(outcome. result===false) {
          working = false;
          build. has All Items = false;
        } else{ 
          build. items. push({item: outcome. item, etc});
          if(build. items. length>=w.tasks[0].itemsNeeded[group].options[choice].qty) {
            working = false;
          }
        }
      }
    }
  }
  
  // This should have our list completed
  // Separate each section into its own group, then pick the best one
  for(let group=0; group<=w. tasks[0].task.itemsNeeded.length; group++) {
    let choices = optionChoices.filter(ch => ch.groupId === group);
    let valid = choices.find(ch => ch.hasAllItems);
    if(typeof(valid)==="undefined") {
      // we didn't find any completed lists
      // use the list with the highest percent of ready parts
      // Tag all other parts before resuming
     } else{
       // Tag all these parts. we will need to move each to the job site
     }
  }
}















  
  