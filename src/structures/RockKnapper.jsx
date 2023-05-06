/*  RockKnapper.jsx
    Provides the Rock Knapper, a first method to create tools from stones
    For the game Settlers & Warlords
*/

import { game } from "../game.jsx";

export function RockKnapper() {
    // This provides the data structure used in the game object
    return {
        name: 'Rock Knapper',
        image: 'rockknapper.png',
        tooltip: 'Produce tools from rocks',
        locked: 0,
        prereqs: [],
        newFeatures: [],
        canBuild: (tile) => {
            if(tile.newlandtype===-1) {
                if(tile.landtype===21) return '';
            }else{
                if(tile.newlandtype===21) return '';
            }
            return 'This must be placed on a rocky surface';
        },
        create: tile => {
            // Returns a new structure instance
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,  // we mainly track this so we can save & load without trouble
                y: tile.y,
                name: 'Rock Knapper',
                descr: `Tools are critical to survival, and rocks are your first craftable tools. Rock knapping is the art of smashing
                        rocks into the shapes you need.`,
                usage: `Create a task for the tool you need. Your workers will craft it. Flint Knives and Stabbers don't need any extra
                        parts. Other tools require sticks & rope.`,
                image: 'rockknapper.png',
                activeTasks: [],
                blinker: null,
                blinkValue: 0,
                update: value => {
                    // Handles updating the display on state changes. This mostly triggers the Blinker function
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Craft Flint Knife',
                        desc: 'Make a Flint Knife from local rocks',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [],
                        outputItems: ['Flint Knife'],  // This is more for automating task assignments than anything
                        buildTime: 20*5, // we're gonna cheat here, to save time in debugging //20 * 20, // aka 20 seconds
                        hasQuantity: true,
                        canAssign: ()=>true, // this can always be assigned
                        onComplete: ()=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            tile.items.push(game.createItem('Flint Knife', 'tool', {efficiency:1, endurance:20*60})); // This lasts only a minute
                            tile.modified = true;  // Dont' forget to update this flag when a new item is placed here
                        }
                    },{
                        name: 'Craft Flint Stabber',
                        desc: 'Make a Flint Stabber. Good for cutting wood branches',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [],
                        outputItems: ['Flint Stabber'],
                        buildTime: 20 * 25,
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: ()=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            tile.items.push(game.createItem('Flint Stabber', 'tool', {efficiency:1, endurance:20*60}));
                            tile.modified = true;
                        }
                    }
                ]

                // Ya know, we really don't need all structures to have a customized display. It doesn't add anything here
                // We shouldn't need a load or save function either, since there's nothing extra to include
            };
            return b;
        }
    }
}


