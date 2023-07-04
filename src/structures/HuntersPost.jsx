/*  Hunters Post
    Allows workers to hunt for animals, providing meats and better nutrition
    For the game Settlers & Warlords
*/

import { game } from "../game.jsx";
import { DanCommon } from "../libs/DanCommon.js";

export function HuntersPost() {
    return {
        name: 'Hunters Post',
        image: 'huntingpost.png',
        tooltip: 'Hunt for meats around your area',
        locked: 1,
        prereq: [['Flint Spear']],
        newFeatures: [],
        canBuild: tile => '', // this can be built anywhere
        create: tile => {
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Hunters Post',
                descr: `Humans are not herbivores.  They require meats equally as much as plants. Without good sources of both, the body will
                        struggle to survive. Fortunately, there are plenty of huntable animals around you`,
                usage: `Send workers to surrounding lands with a spear to kill animals. They can be hauled back and cooked over a fire`,
                image: 'huntingpost.png',
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                update: value => {
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Go Hunt',
                        desc: 'Venture out and attempt to kill an animal',
                        taskType: 'craft',
                        workLocation: 'custom',
                        pickLocation: worker => {
                            // We will have the workers to to one of the corners of the map for hunting. Figure out which corner is closest
                            return [
                                (worker.x>20)?40:0,
                                (worker.y>20)?40:0
                            ];
                            // Well... that's a whole lot easier than searching for items!
                        },
                        itemsNeeded: [{options: [{name:'Flint Spear', qty:1}], role:'tool', workSite:false}],
                        outputItems: ['Dead Deer', 'Dead Wolf', 'Dead Chicken', 'Dead Boar'],
                        // We'll probably have more, I think, but this'll do for now
                        buildTime: 20*5, //20*60*3, // out for 3 minutes each time
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: worker => {
                            // Firstly, there will be a 50% chance of success with hunting (this number will go vary based on the frequency of
                            // hunting).
                            if(Math.random()<0.5) {
                                console.log('Hunting venture failed');
                                return;
                            }
                            
                            // Next, we will generate a random dead item and place it on the map.
                            let rile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);
                            let newItemName = DanCommon.getRandomFrom(['Dead Deer', 'Dead Wolf', 'Dead Chicken', 'Dead Boar'])
                            console.log('Hunting successful! We got a '+ newItemName);
                            rile.items.push(game.createItem(newItemName, 'item'));
                            rile.modified = true;

                            // Now, create an itemMove task for this worker, so they can carry it to the Hunters Post. We also need to delete
                            // this current task
                            game.deleteTask(worker.tasks[0]);
                            let newTask = game.createItemMoveTask(rile.items[rile.items.length-1], worker.x, worker.y, b.x, b.y);
                            worker.tasks.unshift(newTask);
                            newTask.worker = worker;
                        }
                    }
                ]
            };
            return b;
        }
    }
}