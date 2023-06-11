/*  RopeMaker.jsx
    Allows players to create and meld ropes
    For the game Settlers & Warlords
*/

import {game} from "../game.jsx";

export function RopeMaker() {
    return {
        name: 'Rope Maker',
        image: 'ropemaker.png',
        tooltip: 'Craft ropes from fibers',
        locked: 1,
        prereq: [['Bark Fibers']],
        newFeatures: [],
        canBuild: tile => '',  // This can be built anywhere
        create: tile => {
            // Returns a new structure instance
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Rope Maker',
                descr: `Rope is an essential tool, providing hundreds of potential uses to get things done. It has been used for thousands of years,
                and is still in use today. Your early rope sources will be limited, and large ropes will be costly, but some tasks cannot be done
                without it. Crafting rope does not require tools, but can go much faster with them.`,
                usage: `Collect twine from fallen trees, then turn it into a length of rope. Rope strength can be doubled by halving its length`,
                image: 'ropemaker.png',
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                update: value => {
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Craft Rope from Bark Fibers',
                        desc: 'Create rope from available materials',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name: 'Bark Fibers', qty:1}], role:'item', workSite:false}
                        ],
                        outputItems: ['Small Rope'],  // about 1 foot of 5 pound rope
                        buildTime: 20 * 40, // 40 seconds
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: x => {
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            // Delete the Bark Fibers, add the Small Rope
                            let slot = tile.items.findIndex(i=>i.name==='Bark Fibers');
                            if(slot===-1) {
                                console.log('Error: Could not find Bark Fibers at structure');
                                return;
                            }
                            tile.items.splice(slot, 1);
                            tile.items.push(game.createItem('Small Rope', 'item'));
                            tile.modified = true;
                        }
                    }
                ]
            };
            return b;
        }
    }
}


