/*  ForagePost.jsx
    Provides a means for early settlers to collect foods from the wilderness surrounding them
    For the game Settlers & Warlords
*/

import { game } from "../game.jsx";
import { itemStats } from "../itemstats.js";


// Fruit trees will take a lot longer to process, but each time will generate a lot more foods. Each tree cleared this way will become a barren
// tree of the same type; this triggers an eventual update for that tile to turn it back into a normal fruit tree

export function ForagePost() {
    // Provides a way to collect foods from the local environment
    return {
        name: 'Forage Post',
        image: 'foragepost.png',
        tooltip: 'Collect foods from the local land',
        locked: 0,
        prereq: [],
        newFeatures: [],
        canBuild: tile=>'', // we can build this anywhere
        create: tile => {
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Forage Post',
                descr: `All around you is a world teeming with life - and food. It is there for the taking, you just have to find it.`,
                usage: `Collects edible foods from the surrounding environment. There is only so much food available; you will need to
                        find new sources soon`,
                image: 'foragepost.png',
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                update: value => {
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Gather Food',
                        desc: 'Collect food from available sources in the area',
                        taskType: 'gatherfood',
                        workLocation: 'atItem',
                        itemsNeeded: [{
                            options: itemStats.filter(g=>g.role==='food' || g.role==='foodprovider').map(g=>({name: g.name, qty:1})),
                            role:'item',
                            workSite:true
                        }],
                        outputItems: ['Cherries', 'Apple', 'Pear', 'Orange', 'Carrots', 'Potato', 'Tomatoes', 'Turnip', 'Peanuts', 'Corn',
                                      'Beans', 'Onion', 'Broccoli', 'Pumpkin', 'Mushroom'],
                        buildTime: 20*10,   // we'll mark this as 10 seconds, but each one will actually be different, based on what food is collected
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: worker=>{
                            // This is only called after the worker gets back to the structure's location
                            // ...which won't ever actually be called, because it finishes with an itemMove operation
                        }
                    },{
                        name: 'Eat Food',
                        desc: 'Have workers eat food',
                        taskType: 'craft',
                        workLocation: 'atItem',
                        itemsNeeded: [{options: itemStats.filter(g=>g.role==='food').map(g=>({name:g.name, qty:1})), role:'item', workSite:true}],
                        outputItems: [],
                        buildTime: 20*2,
                        hasQuantity: false,
                        canAssign: ()=>false,
                        onComplete: worker=>{
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);

                            // Start by figuring out what food type the worker is trying to eat. We can determine what item they picked
                            // by worker.task[0].recipeChoices
                            let choice = worker.tasks[0].recipeChoices[0];
                            let foodName = worker.tasks[0].task.itemsNeeded[0].options[choice].name;
                            let stats = itemStats.find(g=>g.name===foodName);


                            //worker.foodTimer += 20*60*2;
                            worker.foodTimer += stats.foodTime;
                            console.log(worker.name +' has food for='+ (worker.foodTimer-game.mapTick) +' ticks');

                            // Don't forget to delete the eaten item!
                            let slot = tile.items.find(i=>i.name===foodName && i.inTask===worker.tasks[0].id);
                            if(slot===-1) {
                                console.log('Did not find any food item in task. Trying name only');
                                slot = tile.items.find(i=>i.name===foodName);
                                if(slot===-1) {
                                    console.log('Still did not find correct food item');
                                    return;
                                }
                            }
                            tile.items.splice(slot,1);
                            tile.modified = true;
                        }
                    }
                ]
            };
            return b;
        }
    }
}


