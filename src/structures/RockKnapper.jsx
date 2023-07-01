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
        newFeatures: ['Small Rope'],
        canBuild: (tile) => {
            //if(tile.newlandtype===-1) {
                if(tile.landtype===21) return '';
            //}else{
            //    if(tile.newlandtype===21) return '';
            //}
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
                        buildTime: 20*20, // 20 seconds
                        hasQuantity: true,
                        canAssign: ()=>true, // this can always be assigned
                        onComplete: ()=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            tile.items.push(game.createItem('Flint Knife', 'tool', {efficiency:1, endurance:20*60})); // This lasts only a minute
                            tile.modified = true;  // Dont' forget to update this flag when a new item is placed here
                            if(game.tutorialModes[game.tutorialState].name==='tools1') game.advanceTutorial();
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
                            if(game.tutorialModes[game.tutorialState].name==='tools1') game.advanceTutorial();
                        }
                    },{
                        name: 'Craft Flint Hatchet',
                        desc: 'Make a Flint Hatchet. Much better than a Stabber',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name: 'Short Stick', qty:1}], role:'item', workSite:false},
                            {options: [{name: 'Small Rope', qty:1}], role:'item', workSite:false}
                        ],
                        outputItems: ['Flint Hatchet'],
                        buildTime: 20 * 30, // 30 seconds... after getting a suitable piece of flint, wrapping it with rope goes pretty quick
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Small Rope'),
                        onComplete: x=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            // Find the small rope and delete it
                            let slot = tile.items.findIndex(i=>i.name==='Small Rope');
                            if(slot===-1) {
                                console.log('Error: could not find Small Rope at building');
                                return;
                            }
                            tile.items.splice(slot,1);
                            slot = tile.items.findIndex(i=>i.name==='Short Stick');
                            if(slot===-1) {
                                console.log('Error: could not find Short Stick at building. Small Rope has already been deleted');
                                return;
                            }
                            tile.items.splice(slot,1);
                            tile.items.push(game.createItem('Flint Hatchet', 'tool', {efficiency:1, endurance:20*60*5}));
                            tile.modified = true;
                        }
                    },{
                        name: 'Craft Flint Shovel',
                        desc: 'Make a Flint Shovel. Good for moving dirt',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name:'Long Stick', qty:1}], role:'item', workSite:false},
                            {options: [{name:'Small Rope', qty:1}], role:'item', workSite:false}
                        ],
                        outputItems: ['Flint Shovel'],
                        buildTime: 20 * 30, // 30 seconds
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Small Rope'),
                        onComplete: x=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            let slot = tile.items.findIndex(i=>i.name==='Small Rope');
                            if(slot===-1) { console.log('Error: Could not find Small Rope at building'); return; }
                            tile.items.splice(slot,1);
                            slot = tile.items.findIndex(i=>i.name==='Long Stick');
                            if(slot===-1) { console.log('Error: Could not find Long Stick at building. Small Rope has already been deleted'); }
                            tile.items.splice(slot, 1);
                            tile.items.push(game.createItem('Flint Shovel', 'tool', {efficiency:1, endurance:20*60*5}));
                            tile.modified = true;
                        }
                    },{
                        name: 'Craft Flint Spear',
                        desc: 'Make a Flint Spear, for hunting and... defense',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name: 'Long Stick', qty:1}], role:'item', workSite:false},
                            {options: [{name: 'Small Rope', qty:1}], role:'item', workSite:false}
                        ],
                        outputItems: ['Flint Spear'],
                        buildTime: 20 * 30, // 30 seconds
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Small Rope'),
                        onComplete: x=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            let slot = tile.items.findIndex(i=>i.name==='Small Rope');
                            if(slot===-1) { console.log('Error: Could not find Small Rope at building'); return; }
                            tile.items.splice(slot,1);
                            slot = tile.items.findIndex(i=>i.name==='Long Stick');
                            if(slot===-1) { console.log('Error: Could not find Long Stick at building. Small Rope has already been deleted'); }
                            tile.items.splice(slot, 1);
                            tile.items.push(game.createItem('Flint Spear', 'tool', {efficiency:1, endurance:20*60*5}));
                            tile.modified = true;
                        }
                    },{
                        name: 'Craft Flint Scythe',
                        desc: 'Make a Scythe, a tool to cut grasses',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name: 'Long Stick', qty:1}], role:'item', workSite:false},
                            {options: [{name: 'Short Stick', qty:1}], role:'item', workSite:false},
                            {options: [{name: 'Small Rope', qty:2}], role:'item', workSite:false}
                        ],
                        outputItems: ['Flint Scythe'],
                        buildTime: 20 * 55, // 55 seconds, because it takes longer to attach 2 ropes instead of 1
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Small Rope'),
                        onComplete: x=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            game.clearItems(tile, [{name: 'Long Stick', qty:1}, {name: 'Short Stick', qty:1}, {name:'Small Rope', qty:2}],
                                            'src/structures/RockKnapper.jsx->task Craft Flint Scythe');
                            tile.items.push(game.createItem('Flint Scythe', 'tool', {efficiency:1, endurance:20*60*8})); // 8 minutes
                            tile.modified = true;
                        }
                    },{
                        name: 'Craft Wood Pitchfork',
                        desc: 'Make a Pitchfork, for turning hay',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name: 'Long Stick', qty:1}], role:'item', workSite:false},
                            {options: [{name: 'Short Stick', qty:2}], role:'item', workSite:false},
                            {options: [{name: 'Small Rope', qty:2}], role:'item', workSite:false}
                        ],
                        outputItems: ['Wood Pitchfork'],
                        buildTime: 20 * 60, // 1 minute
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Flint Scythe'),
                        onComplete: x=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            game.clearItems(tile, [{name:'Long Stick', qty:1}, {name:'Short Stick', qty:2}, {name:'Small Rope', qty:2}],
                                            'src/structures/RockKnapper.jsx->task Craft Flint Pitchfork');
                            tile.items.push(game.createItem('Wood Pitchfork', 'tool', {efficiency:1, endurance:20*60*5})); // 5 minutes
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


