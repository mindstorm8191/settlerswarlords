/*  Campfire.jsx
    Provides a way to cook things, starting with meats
    For the game Settlers & Warlords
*/

// I hope to eventually use this campfire early in the game, to allow workers to stay warm.

import { game } from "../game.jsx";
import { minimapTiles } from "../minimapTiles.js";

const decayRate = 0.1; // How much the temperature decays per tick, which is 2 degrees per second
const fuelRate = 0.2; // How much the temperature rises per tick. Coupled with the constant decay, this is .1/tick = 2 degrees per second

const fuelOptions = [
    {name: 'Fallen Stick'}, {name: 'Fallen Branch'}, {name: 'Fallen Log'}, {name:'Debarked Fallen Log'}, {name:'Firewood'}
];

const cookOptions = [
    {name: 'Dead Deer', cookTime:20*60, result: "Cooked Deer Meat", qty:8, overcook:20*60*2, fail: "Burnt Meat"},
    {name: 'Dead Boar', cookTime:20*90, result: "Cooked Boar Meat", qty:12, overcook:20*60*4, fail: "Burnt Meat"},
    {name: 'Dead Wolf', cookTime:20*30, result: "Cooked Wolf Meat", qty:5, overcook:20*30*3, fail: "Burnt Meat"},
    {name: 'Dead Chicken', cookTime:20*20, result: "Cooked Chicken Meat", qty:2, overcook:20*60, fail: "Burnt Meat"},
    {name: 'Raw Boar Meat', cookTime:20*10, result: "Cooked Boar Meat", qty:1, overcook:20*60, fail: "Burnt Meat"},
    {name: "Raw Chicken Meat", cookTime:20*10, result: "Cooked Chicken Meat", qty:1, overcook:20*60, fail: "Burnt Meat"},
    {name: 'Raw Deer Meat', cookTime:20*10, result: "Cooked Deer Meat", qty:1, overcook:20*60, fail: "Burnt Meat"},
    {name: 'Raw Wolf Meat', cookTime:20*10, result: "Cooked Wolf Meat", qty:1, overcook:20*60, fail: "Burnt Meat"}
];
// cookTime is how long, in ticks, it takes to cook this, when the temp is at 250. Progress will scale gradually, starting from 100

export function Campfire() {
    return {
        name: 'Campfire',
        image: 'campfire.png',
        tooltip: 'Cook things over a fire',
        locked: 1,
        prereq: [['Dead Boar', 'Dead Chicken', 'Dead Deer', 'Dead Wolf']], // We will need to include all dead animals, but we're not there yet
        newFeatures: [],
        canBuild: tile => {
            let tileFacts = minimapTiles.find(r=>r.id===tile.landtype);
            if(tileFacts.name.indexOf('Tree')!==-1) return 'Campfires in trees is dangerous';
            if(tileFacts.name==='Still Water') return "Can't place in water";
            if(tileFacts.name==='Stream') return "Can't place in water";
            if(tileFacts.name==='Swamp') return "Can't place in water";
            return '';
        },
        create: tile => {
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Campfire',
                descr: `Fire is man's ultimate tool, even in primitive times. Not only does it provide warmth, it cooks food, unlocking
                        nutrients that would otherwise be inaccessible to the body. Such easy access to nutrients allows humans to do more.`,
                usage: `Needs a steady supply of firewood to maintain heat. Once hot, cooking speeds will be based on fire heat. Workers
                        won't start the fire until it is needed`,
                image: 'campfire.png',
                temp: 0, // we will treat ambient temperature as zero, for now. Maybe we'll have tiles with specific temperatures later
                         // on, but that'll be a lot of work
                fuelTime: 0, // how many more game ticks this fuel will increase the heat by. We will treat this as a constant, even if it
                // isn't in real life
                holdingTask: null, // tags all important items here, so they can be used
                cookTime: 0,       // how many ticks the current cooking item has completed. This will be a 
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                update: value => {
                    if(b.blinker!==null) b.blinker(value);
                },
                tick: ()=>{
                    // Start by ensuring this structure has a functioning task
                    if(b.holdingTask===null) {
                        // This hasn't been created yet. Create it now
                        b.holdingTask = {
                            id: game.getNextTaskId(),
                            building: b,
                            task: null,
                            taskType: 'none',
                            status: 'building-claimed',
                            targetx: null,
                            targety: null,
                            targetItem: '',
                            recipeChoices: [],
                            quantity: 0,
                            itemsTagged: [], // This is the only real reason we have this part
                            progress: 0
                        };
                        game.tasks.push(b.holdingTask);
                    }else{
                        if(typeof(b.holdingTask)==='number') {
                            // When the game is loaded, structures are generated completely before tasks are. The holding task will remain
                            // a number after load. We need to convert it back to the correct task
                            b.holdingTask = game.tasks.find(ta=>ta.id===b.holdingTask);
                        }
                    }

                    // Next, manage fire temperature
                    b.temp = Math.max(0, b.temp-decayRate);
                    if(b.fuelTime>0) {
                        b.fuelTime--;
                        b.temp += fuelRate;
                    }
                    if(b.temp>0) b.update(b.blinker+1);

                    // Now, determine if there are new things to cook (or burn) here
                    let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                    let cookNames = cookOptions.map(c=>c.name);
                    let fuelNames = fuelOptions.map(c=>c.name);
                    for(let i=0; i<tile.items.length; i++) {
                        if((cookNames.includes(tile.items[i].name) || fuelNames.includes(tile.items[i].name)) && tile.items[i].inTask===0) {
                            console.log('Adding '+ tile.items[i].name +' to structure task');
                            tile.items[i].inTask = b.holdingTask.id;
                            b.holdingTask.itemsTagged.push(tile.items[i]);
                        }
                    }

                    // If there is nothing to cook, we are finished here
                    if(!tile.items.some(i=>cookNames.includes(i.name))) return (b.temp>0);

                    // Ensure we have sufficient fire supplies to start or continue the fire. To do this, we also need to consider any existing
                    // tasks that is searching for fuels.
                    // This gets a little harder because the structure only keeps a task id; we will need to fetch it from the game's task list
                    let tasksNeeded = 5 - (tile.items.filter(i=>i.name==='Fallen Log' || i.name==='Debarked Fallen Log').length +
                                           b.activeTasks.filter(t=>game.tasks.find(u=>u.id===t).task.name==='Gather Fallen Log').length);
                    if(tasksNeeded>0) {    
                        console.log('We need '+ tasksNeeded +' fallen log tasks');
                        for(let u=0; u<tasksNeeded; u++) {
                            game.createTask(b, b.tasks.find(t=>t.name==='Gather Fallen Log'), 1);
                        }
                    }
                    // Repeat for the other fuel categories
                    tasksNeeded = 5 - (tile.items.filter(i=>i.name==='Fallen Branch' || i.name==='Firewood').length +
                                       b.activeTasks.filter(t=>game.tasks.find(u=>u.id===t).task.name==='Gather Fallen Branch').length);
                    if(tasksNeeded>0) {
                        console.log('We need '+ tasksNeeded +' fallen branch tasks');
                        for(let u=0; u<tasksNeeded; u++) {
                            game.createTask(b, b.tasks.find(t=>t.name==='Gather Fallen Branch'), 1);
                        }
                    }
                    tasksNeeded = 5 - (tile.items.filter(i=>i.name==='Fallen Stick').length +
                                       b.activeTasks.filter(t=>game.tasks.find(u=>u.id===t).task.name==='Gather Fallen Stick').length);
                    if(tasksNeeded>0) {
                        console.log('We need '+ tasksNeeded +' fallen stick tasks');
                        for(let u=0; u<tasksNeeded; u++) {
                            game.createTask(b, b.tasks.find(t=>t.name==='Gather Fallen Stick'), 1);
                        }
                    }

                    if(b.temp===0) {
                        // We don't want to start the fire until all the above tasks are completed, or if we are already starting the fire
                        if(b.activeTasks.some(t=>{
                            let realTask = game.tasks.find(u=>u.id===t);
                            return realTask.task.name==='Gather Fallen Log' ||
                                   realTask.task.name==='Gather Fallen Branch' ||
                                   realTask.task.name==='Gather Fallen Stick' ||
                                   realTask.task.name==='Start Fire';
                        })) return false;
                        game.createTask(b, b.tasks.find(t=>t.name==='Start Fire'), 1);
                        console.log('Start the fire!');
                        return false;
                    }
                    
                    // The fire is going!  We have already ensured we have new firewood coming to this structure. Now, determine if we need to
                    // add wood to the fire
                    if(b.temp < 250 && b.fuelTime<=0 && !b.activeTasks.some(t=>game.tasks.find(u=>u.id===t).task.name==='Tend To Fire')) {
                        game.createTask(b, b.tasks.find(t=>t.name==='Tend To Fire'), 1);
                    }

                    // Check for progress on the current item. Cook times will vary based on what item is being cooked.
                    let cookItem = tile.items.findIndex(i=>cookNames.includes(i.name));
                    let targetCook = cookOptions.find(u=>u.name===tile.items[cookItem].name).cookTime;
                    //let cookFacts = cookOptions.find(u=>u.name===b.cookableItems[0].name);
                    b.cookTime += Math.max(0,
                        (Math.min(b.temp,250)-100.0)/150
                    );

                    // See if the food is ready to be removed. If so, find a worker to do that work
                    if(b.cookTime>=targetCook && !b.activeTasks.some(t=>game.tasks.find(u=>u.id===t).task.name==="Tend Fire Products")) {
                        game.createTask(b, b.tasks.find(t=>t.name==="Tend Fire Products"), 1);
                    }
                    return true;
                    // That should be all we need to do. where the meats get burnt will be checked when pulled from the fire
                },
                tasks: [
                    {
                        name: 'Gather Firewood',
                        desc: "Gather wood so it's available when needed",
                        taskType: 'gatheritems',
                        workLocation: 'atItem',
                        itemsNeeded: [{options: [{name:'Debarked Fallen Log', qty:1},
                                                 {name:'Fallen Branch', qty:1},
                                                 {name:'Fallen Stick', qty:1},
                                                 {name:'Fallen Log', qty:1}], role:'item', workSite:true}],
                        outputItems: [],
                        buildTime: 1,
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: ()=>true    // we don't seem to need an onComplete task here
                    },{
                        name: 'Gather Fallen Log',
                        desc: "Gather large firewood when it's needed",
                        taskType: 'gatheritems',
                        workLocation: 'atItem',
                        itemsNeeded: [{options: [{name: 'Debarked Fallen Log', qty:1},{name: 'Fallen Log', qty:1}], role:'item', workSite: true}],
                        outputItems: [],
                        buildTime: 1,
                        hasQuantity: true,
                        canAssign: ()=>false,
                        onComplete: ()=>true
                    },{
                        name: 'Gather Fallen Branch',
                        desc: "Gather branches for firewood when it's needed",
                        taskType: 'gatheritems',
                        workLocation: 'atItem',
                        itemsNeeded: [{options: [{name: 'Fallen Branch', qty:1}], role:'item', workSite:true}],
                        outputItems: [],
                        buildTime: 1,
                        hasQuantity: true,
                        canAssign: ()=>false,
                        onComplete: ()=>true
                    },{
                        name: 'Gather Fallen Stick',
                        desc: "Gather sticks for firewood when it's needed",
                        taskType: 'gatheritems',
                        workLocation: 'atItem',
                        itemsNeeded: [{options: [{name: 'Fallen Stick', qty:1}], role:'item', workSite:true}],
                        outputItems: [],
                        buildTime: 1,
                        hasQuantity: true,
                        canAssign: ()=>false,
                        onComplete: ()=>true
                    },{
                        name: 'Tend To Fire',
                        desc: 'Handle small tasks to keep the fire going',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [],
                        outputItems: [],
                        buildTime: 20*2, // 2 seconds to add wood to the fire
                        hasQuantity: false,
                        canAssign: ()=>false, // These tasks are generated by the structure, not the player
                        onComplete: ()=>{
                            // Based on the heat level of the fire, we will add a certain type of wood to it, thus increasing the fuel-time
                            // value.
                            // sticks - fire temperature 0 to 100. Will use 2 at a time. Duration is 15 seconds. It is assumed that we can
                            //          gather kindling from the surrounding area, it won't be considered here
                            // branches - fire temperature 100 to 200. One used at a time. Duration is 40 seconds
                            // logs - fire temperature 200 & up. Duration is 3 minutes. Note that debarked fallen logs and normal fallen logs
                            //      will behave the same here
                            // dried firewood will be usable as well. It will fit into the branches category, but can be cut down to be sticks,
                            // too. When fallen logs get fully used up, dried firewood can be used instead
                            // If the campfire doesn't have the correct size of lumber, it will go to the next smallest. It will still work
                            // Target cooking temperatue will be 250. Fires hotter than that will not bother anything. Cooking will begin
                            // at 100, and scale up to full rate at target temperature
                            // to heat the fire, but run out that much faster
                            // So long as the fuel-time is positive, the fire will increase in temperature. Once it runs out, it will idle
                            // for a little while.
                            // When the fuel-time reaches zero, and the fire temperature is still low, a new Tend To Fire task will be
                            // generated. If the temperature is high enough, the workers will let it idle until it gets low again
                            // This will also generate additional Gather tasks, to ensure the campfire has sufficient wood supplies to
                            // keep running

                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            let slot;
                            // Start with checking the temperature
                            if(b.temp<100) {
                                // Find 2 fallen sticks. If the block can only find 1, just use that
                                let stickCount = 0;
                                slot = tile.items.findIndex(i=>i.name==='Fallen Stick');
                                if(slot===-1) {
                                    console.log('Need fallen sticks for campfire, found none');
                                    return; // Nothing more we can do here anyway
                                }
                                stickCount++;
                                tile.items.splice(slot, 1);
                                slot = tile.items.findIndex(i=>i.name==='Fallen Stick');
                                if(slot===-1) {
                                    // Looks like there's only one stick to use here
                                    console.log('Ran out of fallen sticks for campfire');
                                }else{
                                    stickCount++;
                                    tile.items.splice(slot,1);
                                }
                                
                                // Next, apply our sticks to increase the fuel time
                                b.fuelTime += 20 * 7.5 * stickCount;
                            }else if(b.temp>=100 && b.temp<200) {
                                slot = tile.items.findIndex(i=>i.name==='Fallen Branch');
                                if(slot===-1) {
                                    console.log('Need fallen branch for campfire, none found');
                                    return;
                                }
                                tile.items.splice(slot,1);
                                b.fuelTime += 20 * 15;
                            }else {
                                slot = tile.items.findIndex(i=>i.name==='Fallen Log' || i.name==='Debarked Fallen Log');
                                if(slot===-1) {
                                    console.log('Need fallen log for campfire, none found');
                                    return;
                                }
                                tile.items.splice(slot,1);
                                b.fuelTime += 20 * 60 * 3;
                            }
                            tile.modified = true;
                        }
                    },{
                        name: 'Start Fire',
                        desc: 'Get a fire going',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [],
                        outputItems: [],
                        buildTime: 20*30, // 30 seconds
                        hasQuantity: false,
                        canAssign: ()=>false, // This will be auto-generated whenever there is something to start cooking
                        onComplete: ()=>{
                            b.temp = 30;
                            // From here, we will need to tend to the fire, again
                        }
                    },{
                        name: 'Cook Meats',
                        desc: 'Starts to cook meats over the fire',
                        taskType: 'gatheritems',
                        workLocation: 'atItem',
                        itemsNeeded: [{options: cookOptions.map(u=>({name:u.name, qty:1})), role:'item', workSite:true}],
                        outputItems: ['Cooked Deer Meat', 'Cooked Boar Meat', 'Cooked Wolf Meat', 'Cooked Chicken Meat'],
                        buildTime: 1,
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: ()=>true
                    },{
                        name: 'Tend Fire Products',
                        desc: 'Handle moving products to keep from overcooking items, and put new items on to cook',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [],
                        outputItems: [],
                        buildTime: 20*2, // 2 seconds to make the changes needed
                        hasQuantity: false,
                        canAssign: ()=>false, // can only be declared by the structure
                        onComplete: ()=>{
                            // It isn't until here where we can potentially move foods off the heat, and add another one on
                            // (well, adding another one on is kind of automatic)
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            let cookFacts;
                            let slot = tile.items.findIndex(i=>cookOptions.some(u=>{
                                if(u.name!==i.name) return false;
                                cookFacts = u;
                                return true;
                            }));

                            if(slot===-1) {
                                console.log('Error in Tend Fire Products: did not find valid food item');
                                return;
                            }

                            // Ensure we have completed the cook time needed
                            if(b.cookTime<cookFacts.cookTime) {
                                console.log('Error in Tend Fire Products: not enough cook time elapsed. current='+ b.cookTime +', target='+ cookFacts.cookTime);
                                return;
                            }

                            tile.items.splice(slot,1);
                            // See if this item is too cooked
                            if(b.cookTime>=cookFacts.overcook) {
                                tile.items.push(game.createItem('Burnt Meat', 'item'));
                            }else{
                                for(let i=0; i<cookFacts.qty; i++) {
                                    tile.items.push(game.createItem(cookFacts.result, 'item'));
                                }
                            }
                            // don't forget to reset the cooking time
                            b.cookTime = 0;
                            tile.modified = true;
                        }
                    }
                ],
                SidePanel: ()=>{
                    return (
                        <div>
                            <p className='singleline'>Temperature: {b.temp}</p>
                            <p className='singleline'>FuelTime: {b.fuelTime}</p>
                            <p className='singleline'>CookTime: {b.cookTime}</p>
                        </div>
                    )
                },
                onSave: ()=>{
                    // Save key information specific to this structure
                    return {
                        holdingTask: b.holdingTask.id,
                        temp: b.temp,
                        fuelTime: b.fuelTime,
                        cookTime: b.cookTime
                    };
                },
                onLoad: pack => {
                    b.holdingTask = pack.holdingTask; // We still have to convert this from an id to the actual task
                    b.temp = pack.temp;
                    b.fuelTime = pack.fuelTime;
                    b.cookTime = pack.cookTime;
                }
            };
            return b;
        }
    }
}