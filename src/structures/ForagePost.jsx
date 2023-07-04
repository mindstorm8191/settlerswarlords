/*  ForagePost.jsx
    Provides a means for early settlers to collect foods from the wilderness surrounding them
    For the game Settlers & Warlords
*/

import { game } from "../game.jsx";
import { foodOptions } from "../foodOptions.js";


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
                        itemsNeeded: [
                            {options: foodOptions.filter(g=>g.purpose==='food').map(g=>({name: g.name, qty:1})), role:'item', workSite:true}
                        ],
                        outputItems: ['Cherries', 'Apple', 'Pear', 'Orange', 'Carrots', 'Potato', 'Tomatoes', 'Turnip', 'Peanuts', 'Corn',
                                      'Beans', 'Onion', 'Broccoli', 'Pumpkin', 'Mushroom'],
                        buildTIme: 20*10,   // we'll mark this as 10 seconds, but each one will actually be different, based on what food is collected
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: worker=>{
                            // This is only called after the worker gets back to the structure's location
                            // ...which won't ever actually be called, because it finishes with an itemMove operation
                        }
                    }
                ]
            };
            return b;
        }
    }
}


