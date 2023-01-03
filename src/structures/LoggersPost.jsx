/*  LoggersPost.jsx
    Handles the Loggers Post structure, that handles any work done in forests
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "../game.jsx";

/*
Sticks
Users will need long & short sticks; fallen sticks will only be useable for firewood, so they must cut them fresh from the trees.
Each tree will have a set number of long sticks on them; they can be removed from standing trees, leaving a 'removed stick' at the location.
When the tree is finally cut down, it will generate that many fewer sticks than its original amount.
Workers can only cut down long sticks; they can then cut them into two short sticks.
For now, we will stick to a flat number for all trees: 6 sticks.
*/

const treesList = ['Maple Tree', 'Birch Tree', 'Oak Tree', 'Mahogany Tree', 'Pine Tree', 'Cedar Tree', 'Fir Tree', 'Hemlock Tree',
                   'Cherry Tree', 'Apple Tree', 'Pear Tree', 'Orange Tree', 'Hawthorn Tree', 'Dogwood Tree', 'Locust Tree', 'Juniper Tree'];

const treeData = [
    {tileId: 5, name: 'Maple Tree', logs: 15, sticks: 20},
    {tileId: 6, name: 'Birch Tree', logs: 1, sticks: 6},
    {tileId: 7, name: 'Oak Tree', logs: 12, sticks: 16},
    {tileId: 8, name: 'Mahogany Tree', logs: 8, sticks: 20},
    {tileId: 9, name: 'Pine Tree', logs: 8, sticks: 6},
    {tileId: 10, name: 'Cedar Tree', logs: 6, sticks: 6},
    {tileId: 11, name: 'Fir Tree', logs: 4, sticks: 4},
    {tileId: 12, name: 'Hemlock Tree', logs: 7, sticks: 15},
    {tileId: 13, name: 'Cherry Tree', logs: 0, sticks: 8},
    {tileId: 14, name: 'Apple Tree', logs: 1, sticks: 12},
    {tileId: 15, name: 'Pear Tree', logs: 0, sticks: 6},
    {tileId: 16, name: 'Orange Tree', logs: 1, sticks: 10},
    {tileId: 17, name: 'Hawthorn Tree', logs: 4, sticks: 12},
    {tileId: 18, name: 'Dogwood Tree', logs: 0, sticks: 6},
    {tileId: 19, name: 'Locust Tree', logs: 10, sticks: 24},
    {tileId: 20, name: 'Juniper Tree', logs: 3, sticks: 6}
];

export function LoggersPost() {
    return {
        name: 'Loggers Post',
        image: 'loggerspost.png',
        prereq: [['Flint Knife', 'Flint Stabber']], // Player needs one of either item
        locked: 1,
        featuresUnlocked: false,
        newFeatures: [],
        primary: true,
        create: (tile) => {
            // Create & returns a Loggers Post block instance.
            let b = {
                id:game.getNextBlockId(),
                x: tile.x,
                y: tile.y,
                name: 'Loggers Post',
                descr: 'Wood is a valuable asset for producing many tools and other things',
                image: 'loggerspost.png',
                progressBar: 0,
                progressBarMax: 20,
                progressBarColor: 'brown',
                blinkState: 0,
                blinker:null,
                hasNewTasks: ['Flint Hatchet'],
                activeTasks:[],
                tasks: [
                    {
                        name:'Get Twine from Aged Wood',
                        taskType: 'work at location',
                        canAssign: ()=>true,    // This can be assigned at any point
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: true,
                        validLocations: (tile)=>{
                            // Returns true if this tile is a valid location for this task to be performed at
                            if(tile.newlandtype===-1) {
                                if(tile.landtype>=5 && tile.landtype<=20) {
                                    // Look for fallen logs here
                                    return tile.items.some(i=>i.name==='Fallen Log');
                                    //return true;
                                } 
                                return false;
                            }
                            if(tile.newlandtype>5 && tile.newlandtype<=20) return tile.items.some(i=>i.name==='Fallen Log');
                            return false;
                        },
                        itemsNeeded: [],
                        toolsNeeded: ['Flint Knife'],
                        buildTime: 20*25, // aka 25 seconds
                        outputItems: ['Twine Strips', 'Debarked Fallen Log'],
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Get Twine from Aged Wood'),
                                taskType: 'workAtLocation',
                                toolsNeeded: [{hasTool: false, tools: ['Flint Knife']}],
                                ticksToComplete: 20*25
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        findLocation: (worker)=>{
                            // Determines a location for this task to be performed at. Or, if a location cannot be found, will return
                            // an item that needs to be crafted first. Or, if no item can be crafted, will return an empty string to
                            // denote this task cannot be completed

                            // For this, we need to find a forest tile with a fallen log in it
                            const [x,y] = game.findItem(worker.x, worker.y, 'Fallen Log', false);
                            if(x===-1) {
                                console.log('Could not locate any Fallen Logs');
                                return {result:'fail', message:'No fallen logs remaining on map'}; // If there are no fallen logs, this task can't be completed anyway
                            }
                            return {result:'pass', x:x, y:y, item:'Fallen Log'};
                        },
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: (worker)=>{
                            // Allows state changes when this task is complete
                            // We want to leave the twine shavings here
                            //let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            //let slot = worker.carrying.findIndex(i=>i.name==='Twine Strips');
                            //tile.items.push(worker.carrying.splice(slot,1));
                            if(game.tutorialModes[game.tutorialState].name==='rope1') game.advanceTutorial();

                            let tile = game.tiles.find(t=>t.x === worker.x && t.y===worker.y);
                            let logSlot = tile.items.findIndex(i=>i.name==='Fallen Log');
                            if(logSlot===-1) {
                                console.log('Error in LoggersPost: Fallen log not found at ['+ worker.x +','+ worker.y +']');
                            }else{
                                tile.items.splice(logSlot,1);
                            }
                            // Unlike previous design, we want to add each debarked log portion individually
                            tile.items.push(game.createItem('Debarked Fallen Log', 'item', {}));
                            tile.items.push(game.createItem('Twine Strips', 'item', {}));
                        }
                    },{
                        name: 'Cut Long Stick',
                        // We will have a collection of sticks where there are fallen logs. Users will also be able to cut sticks off existing trees.
                        // This will generate a 'missing stick' item; When a tree is later cut down, it will not generate as many sticks from its
                        // branches
                        taskType: 'work at location',
                        canAssign: ()=>true, // this can be worked any time... for now. We'll see later
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: true,
                        validLocations: (tile) =>{
                            // Returns true if the given tile is a valid location for this task
                            // To make this easier, check the tile type first
                            if(tile.newlandtype===-1) {
                                if(tile.landtype<5 && tile.landtype>20) return false;
                            }
                            if(tile.newlandtyle<5 && tile.newlandtype>20) return false;

                            // Count the number of trees here, and compare it with the number of removed sticks
                            let removed = tile.items.findIndex(i=>i.name==='Removed Stick');
                            let treeSlot = tile.items.findIndex(i=>treeData.map(t=>t.name).includes(i.name));
                            if(treeSlot===-1) return false; // We found no trees here at all
                            let sticksPotential = treeData.find(t=>t.name===tile.items[treeSlot].name).sticks * tile.items[treeSlot].amount;
                            if(removed===-1) {
                                // There are no removed sticks here to compare against
                                return sticksPotential > 0;
                            }
                            return tile.items[removed].amount < sticksPotential;
                        },
                        itemsNeeded: [],
                        toolsNeeded: ['Flint Stabber'],
                        buildTime: 20*40,  // 40 seconds
                        outputItems: ['Long Stick'],
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Cut Long Stick'),
                                taskType: 'workAtLocation',
                                toolsNeeded: [{hasTool: false, tools:['Flint Hatchet', 'Flint Stabber']}],
                                ticksToComplete: 20*40 // 40 seconds
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        findLocation: (worker) => {
                            // Search for a tile with a valid tree that we can pull limbs from
                            // Unfortunately, this will require a 'custom' findItemsFromList function. That function would work for a
                            // while, but if there are too many sticks removed, we'll have to continue our search

                            function checkForTrees(x,y) {
                                // returns true if this location has what we need
                                if(x<0 || x>41) return '';
                                if(y<0 || y>41) return '';

                                let tile = game.tiles.find(t=>t.x===x && t.y===y);
                                if(typeof(tile)==='undefined') return '';

                                let slot = tile.items.findIndex(i=>treeData.map(r=>r.name).includes(i.name));
                                if(slot===-1) return ''; // No trees found here
                                // we have a valid tree type at tile.items[slot]
                                let removedCount = tile.items.filter(i=>i.name==='Removed Stick').length;
                                if(removedCount===-1) {
                                    // No removed sticks here, currently. Since we've already found one tree, we should be fine here
                                    return tile.items[slot].name;
                                }
                                // Now we need an actual count of the trees here
                                let count = tile.items.filter(i=>i.name===tile.items[slot].name).length;
                                if(treeData.find(t=>t.name===tile.items[slot].name).sticks * count > removedCount) {
                                    return tile.items[slot].name;
                                }
                                return '';
                                //return (treeData.find(t=>t.name===tile.items[slot].name).sticks * count > removedCount);
                            }

                            let distance = 1;
                            let i = checkForTrees(worker.x,worker.y);
                            if(i!=='') return {result:'pass', x:worker.x, y:worker.y, item:i};
                            while(true) {
                                for(let line=-distance; line<distance; line++) {
                                    i = checkForTrees(worker.x+line, worker.y-distance);
                                    if(i!=='') return {result:'pass', x:worker.x+line, y:worker.y-distance, item:i};
                                    i = checkForTrees(worker.x+distance, worker.y+line);
                                    if(i!=='') return {result:'pass', x:worker.x+distance, y:worker.y+line, item:i};
                                    i = checkForTrees(worker.x-line, worker.y+distance);
                                    if(i!=='') return {result:'pass', x:worker.x-line, y:worker.y+distance, item:i};
                                    i = checkForTrees(worker.x-distance, worker.y-line);
                                    if(i!=='') return {result:'pass', x:worker.x-distance, y:worker.y-line, item:i};
                                }
                                distance++;
                                if(worker.x+distance>41 && worker.x-distance<0 && worker.y+distance>41 && worker.y-distance<0)
                                    return {result:'fail', message:'There are no trees left to chop down'};
                            }
                        },
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: (worker)=>{
                            // Create the stick - and the removedStick item
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);
                            if(typeof(tile.items)==='undefined') tile.items = [];
                            tile.items.push(game.createItem('Long Stick', 'item', {}), game.createItem('Removed Stick', 'item', {}));
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        }
                    },{
                        name: 'Cut Short Stick',
                        taskType: 'workAtBuilding', // I'm not actually using this field... maybe get rid of it?
                        canAssign: ()=>true,
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: true,
                        validLocations: tile=>{
                            // This time, we need to find a long stick within the tile's inventory
                            return (tile.items.findIndex(i=>i.name==='Long Stick')!==-1);
                        },
                        itemsNeeded: [
                            {name: 'Long Stick', qty:1, hasItem:false}
                        ],
                        toolsNeeded: ['Flint Stabber'],
                        buildTime: 20*40, // 40 seconds
                        outputItems: ['Short Stick'],
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Cut Short Stick'),
                                taskType: 'workAtBuilding', // We don't really need to perform this at the location of a long stick. Go
                                    // ahead and move it to the building location
                                toolsNeeded: [{hasTool: false, tools:['Flint Hatchet', 'Flint Stabber']}],
                                itemsNeeded: [{name: 'Long Stick', qty: 1, hasItem: false}],
                                ticksToComplete: 20*40, // 40 seconds
                                targetx: b.x,
                                targety: b.y
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        
                        /*getTask: (worker,tile='') => {
                            if(tile!=='') return {subtask:'workatspot', targetx:tile.x, targety:tile.y};

                            // Locate a Long Stick on the map
                            const [targetx, targety] = game.findItem(worker.x, worker.y, 'Long Stick', true);
                            if(targetx===-1 && targety===-1) {
                                // We couldn't find a Long Stick. We should be able to craft one, though. Return this task without a target location.
                                // Another portion of code will be able to assign the task to create the Long Stick
                                return {subtask:'workatspot'};
                            }
                            return {subtask:'workatspot', targetx:targetx, targety:targety};
                        },*/
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: worker=>{
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);
                            // Delete the long stick
                            let slot = tile.items.findIndex(i=>i.name==='Long Stick');
                            if(slot===-1) {
                                console.log('Made short sticks, but couldnt find long stick to delete');
                            }else{
                                tile.items.splice(slot, 1);
                            }

                            // Create the short stick!
                            tile.items.push(game.createItem('Short Stick', 'item', {}), game.createItem('Short Stick', 'item', {}));
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        }
                    },{
                        name: 'Cut Down Tree',
                        canAssign: ()=>game.unlockedItems.includes('Flint Hatchet'),
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: true,
                        validLocations: tile=>{
                            // Determine if this tile has any trees (from the trees list) in its list
                            return (tile.items.findIndex(item => {
                                return treesList.includes(item.name);
                            })!==-1);
                        },
                        itemsNeeded: [],
                        toolsNeeded: ['Flint Hatchet'],
                        buildTime: 20*60*2, // 2 minutes
                        outputItems: ['Connected Log', 'Long Stick'],
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Cut Down Tree'),
                                taskType: 'workAtLocation',
                                toolsNeeded: [{hasTool: false, tools:['Flint Hatchet']}],
                                ticksToComplete: 20*60*2 // 1.5 minutes
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        findLocation: (worker)=>{
                            // Finds a valid location to perform this task at
                            // This time, we only need to locate a valid tree. That'll be enough
                            // Returns an object, having different properties depending on results
                            //  if successful:
                            //      result - will be 'pass'
                            //      x - x coordinate to do the work at
                            //      y - y coordinate to do the work at
                            //      item - target item to look for at the job site
                            //  if no existing item can be found, but one can be crafted:
                            //      result - will be 'needItem'
                            //      item - item name needed to be crafted
                            //  if no suitable locations can be found:
                            //      result - will be 'fail'
                            //      message - message to display to the user
                            const [x,y,item] = game.findItemFromList(worker.x, worker.y, treeData.map(i=>i.name), true, worker.tasks[0]);
                            if(x===-1) {
                                // could not find any trees at all (?!?)
                                return {result:'fail', message:'There are no trees to cut down'};
                            }
                            return {result:'pass', x:x, y:y, item:item};
                        },
                        getTask: (worker,tile='') => {
                            if(tile!='') return {subtask:'workatspot', targetx:tile.x, targety:tile.y};
                            
                            // Locate a tree tile with sticks on it. Some trees are better suited for felling, but... we'll worry about that later
                            const [targetx, targety] = game.findItemFromList(worker.x, worker.y, treesList);
                            if(targetx===-1 && targety===-1)
                                return {subtask:'cantwork', toolNeeded:false, targetx:worker.x, targety:worker.y, message:`We couldn't find any sticks anywhere! Try something else`};
                            return {subtask:'workatspot', targetx:targetx, targety:targety};
                        },
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: worker => {
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);
                            
                            // We need to define how many logs and long sticks each type of tree has here. It would be better to have a range, but...
                            // Fortunately, there is only one tree type per tile
                            //let slot = tile.items.findIndex(i=>treesList.includes(i.name));
                            let slot = tile.items.findIndex(i=>i.name===worker.tasks[0].targetItem);
                            let dataSlot = 0;
                            if(slot!==-1) {
                                dataSlot = treeData.findIndex(t=>t.name===worker.tasks[0].targetItem);
                            }else{
                                console.log('Error in LoggersPost: could not find correct tree type of '+ worker.tasks[0].targetItem);
                                slot = tile.items.findIndex(i=>treeData.map(n=>n.name).includes(i.name));
                                dataSlot = treeData.findIndex(t=>t.name===tile.items[slot].name);
                            }

                            // Go ahead and remove one of the tree instances
                            tile.items.splice(slot,1);

                            // Determine if there are any trees left here. If not, this land type will change
                            if(!tile.items.some(i=>treeData.map(n=>n.name).includes(i.name))) {
                                tile.newlandtype = 32;
                            }

                            if(treeData[dataSlot].logs>1) {
                                for(let i=0; i<treeData[dataSlot].logs; i++) {
                                    tile.items.push(game.createItem('Connected Log', 'item', {}));
                                }
                            }else if(treeData[dataSlot].logs===1) {
                                // Produce a single log piece. It can be moved by a worker
                                tile.items.push(game.createItem('Log Chunk', 'item', {}));
                            }
                            // Sticks can be removed before the actual tree is
                            let removedCount = tile.items.filter(i=>i.name==='Removed Stick').length;
                            for(let i=0; i<treeData[dataSlot].sticks-removedCount; i++) {
                                tile.items.push(game.createItem('Long Stick', 'item', {}));
                            }
                            /*
                            let logs = 1, sticks = 1;
                            console.log('Changing item slot='+ slot);
                            switch(tile.items[slot].name) {
                                case 'Maple Tree':    logs = 15; sticks = 20; break;
                                case 'Birch Tree':    logs = 1;  sticks = 6; break;
                                case 'Oak Tree':      logs = 12; sticks = 16; break;
                                case 'Mahogany Tree': logs = 8;  sticks = 20; break;
                                case 'Pine Tree':     logs = 8;  sticks = 6; break;
                                case 'Cedar Tree':    logs = 6;  sticks = 6; break;
                                case 'Fir Tree':      logs = 4;  sticks = 4; break;
                                case 'Hemlock Tree':  logs = 7;  sticks = 15; break;
                                case 'Cherry Tree':   logs = 0;  sticks = 8; break;
                                case 'Apple Tree':    logs = 1;  sticks = 12; break;
                                case 'Pear Tree':     logs = 0;  sticks = 6; break;
                                case 'Orange Tree':   logs = 1;  sticks = 10; break;
                                case 'Hawthorn Tree': logs = 4;  sticks = 12; break;
                                case 'Dogwood Tree':  logs = 0;  sticks = 6; break;
                                case 'Locust Tree':   logs = 10; sticks = 24; break;
                                case 'Juniper Tree':  logs = 3;  sticks = 6; break;
                                default: console.log('Error: got tree type of '+ tile.items[slot].name +', not in trees list');
                            }
                            // Trees arrive in type & amount, not individually. So we need to reduce its amount, then remove it if it is zero.
                            tile.items[slot].amount--;
                            if(tile.items[slot].amount===0) {
                                tile.items.splice(slot, 1);
                                // Hmm, we should probably change the land type here too, since it no longer has trees
                                // The empty grass tile type is #32
                                tile.newlandtype = 32;
                            }

                            if(logs>0) {
                                if(logs===1) {
                                    // Produce a single log piece, that can be moved by a worker
                                    tile.items.push(game.createItem('Log Chunk', 'item', {}));
                                }else{
                                    // These will all be connected; workers will have to cut them free before using them
                                    tile.items.push(game.createItem('Connected Log', 'item', {amount:logs}));
                                }
                            }
                            // Sticks will be a little simpler
                            tile.items.push(game.createItem('Long Stick', 'item', {amount:sticks}));
                            */
                        }
                    },{
                        name: 'Cut Log Chunk',
                        canAssign: ()=>game.unlockedItems.includes('Connected Log'),
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: true,
                        validLocations: tile=>{
                            return tile.items.some(i=>i.name==='Connected Log');
                        },
                        itemsNeeded: ['Connected Log'],
                        toolsNeeded: ['Flint Hatchet'],
                        buildTime: 20*90, // 1.5 minutes
                        outputItems: ['Log Chunk'],
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                taskType: 'workAtLocation',
                                toolsNeeded: [{hasTool: false, tools: ['Flint Hatchet']}],
                                ticksToComplete: 20*90
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        findLocation: worker=>{
                            const [x,y] = game.findItem(worker.x, worker.y, 'Connected Log', true);
                            if(x===-1) {
                                // Could not find any existing connected logs, but we can still cut down a new tree
                                return {result:'needItem', item:'Connected Log'};
                            }
                            return {result:'pass', x:x, y:y, item:'Connected Log'};
                        },
                        /*getTask: (worker,tile='') => {
                            if(tile!=='') return {subtask:'workatspot', targetx:tile.x, targety:tile.y};

                            // Find a Connected Log on the map
                            const [targetx, targety] = game.findItem(worker.x, worker.y, 'Connected Log');
                            if(targetx===-1 && targety===-1) {
                                // Can't find any connected logs
                                return {subtask:'cantwork', toolNeeded:false, targetx:worker.x, targety:worker.y, message:'Cant find connected log for cutting log chunk'};
                            }

                            return {subtask:'workatspot', targetx:targetx, targety:targety, targetitem:'Connected Log'};
                        },*/
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: (worker)=>{
                            // Allows state changes when this task is complete.
                            // Delete a conected log, and create a log chunk. Or, if there is currently 2 connected logs, create 2 log chunks instead
                            let tile = game.tiles.find(t=>t.x === worker.x && t.y===worker.y);
                            let logSlot = tile.items.findIndex(i=>i.name==='Connected Log');
                            // This should have an amount greater than 1
                            if(tile.items[logSlot].amount>2) {
                                // We can only recover one log chunk from this... that's fine
                                tile.items[logSlot].amount--;
                                tile.items.push(game.createItem('Log Chunk', 'item', {}));
                            }else{
                                if(tile.items[logSlot].amount<=1) {
                                    console.log('We found '+ tile.items[logSlot].amount +' connected logs, it should be >=2');
                                    // Go ahead and create one log chunk anyway
                                    tile.items.push(game.createItem('Log Chunk', 'item', {}));
                                }else{
                                    tile.items.splice(logSlot);
                                    tile.items.push(game.createItem('Log Chunk', 'item', {amount:2}));
                                }
                            }
                        }
                    },{
                        name: 'Cut Wooden Bucket',
                        canAssign: ()=>game.unlockedItems.includes('Log Chunk'),
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: false,
                        itemsNeeded: ['Log Chunk'],
                        toolsNeeded: ['Flint Hatchet'],
                        buildTime: 20*60, // 1 minute
                        outputItems: ['Wooden Bucket'],
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Cut Wooden Buket'),
                                taskType: 'workAtBuilding',
                                itemsNeeded: [{name: 'Log Chunk', qty:1, hasItem:false}],
                                toolsNeeded: [{hasTool: false, tools: ['Flint Hatchet']}],
                                ticksToComplete: 20*60
                            });
                            b.activeTasks.push(task);
                            return task;
                        }
                    }
                ],
                SidePanel: ()=>{
                    let tile = game.tiles.find(e=>e.x===b.x && e.y===b.y);
                    if(typeof(tile)==='undefined') {
                        return <>Error: Block's tile not found. Cannot access items</>;
                    }
                    return (
                        <>
                            <p className="singleline">Items on hand:</p>
                            {game.groupItems(tile.items).map((item,key)=>(
                                <p className="singleline" key={key} style={{marginLeft:5}}>{item.name} x{item.qty}</p>
                            ))}
                        </>
                    );
                }
            };
            return b;
        }
    }
}


