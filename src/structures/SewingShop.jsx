/*  Sewing Shop
    Allows clothing and other products to be created
    For the game Settlers & Warlords
*/

import { game } from "../game.jsx";

export function SewingShop() {
    return {
        name: 'Sewing Shop',
        image: 'sewingshop.png',
        tooltip: 'Craft clothes and other materials from fabrics',
        locked: 1,
        prereq: [['Boar Skin', 'Deer Skin', 'Wolf Skin']],  // I would include Bone in this, but (currently) players will access bone at the same time
        newFeatures: [],
        canBuild: ()=>'',
        create: tile => {
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Sewing Shop',
                descr: `Humans have thin skin; they require clothing to survive, and what your workers have won't last. Fortunately, bones make
                        good needles, and animal skins are suitable for the job. Plus, clothing has even more uses beyond just wearing them.`,
                usage: 'Craft a needle, then use animal skins and rope to craft clothes',
                image: 'sewingshop.png',
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                update: value => {
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Craft Bone Needle',
                        desc: 'Your first needles',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name:'Bone', qty:1}], role:'item', workSite:false},
                            {options: [{name:'Flint Knife', qty:1}], role:'tool', workSite:false}
                        ],
                        outputItems: ['Bone Needle'],
                        buildTime: 20*20, // 20 seconds should do it
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: () => {
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            let slot = tile.items.findIndex(i=>i.name==='Bone');
                            if(slot===-1) {
                                console.log('Error: could not find Bone at Sewing Shop (crafting Bone Needle)');
                                return;
                            }
                            tile.items.splice(slot,1);
                            tile.items.push(game.createItem('Bone Needle', 'tool', {efficiency:1, endurance:20*60*2})); // 2 minutes of use
                            tile.modified = true;
                        }
                    },{
                        name: 'Craft Animalskin Shirt',
                        desc: 'A modest cover',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name:'Boar Skin', qty:3}, {name:'Deer Skin', qty:3}, {name:'Wolf Skin', qty:3}], role:'item', workSite:false},
                            {options: [{name:'Small Rope', qty:2}], role:'item', workSite:false},
                            {options: [{name:'Flint Knife', qty:1}], role:'tool', workSite:false},
                            {options: [{name:'Bone Needle', qty:1}], role:'tool', workSite:false}
                        ],
                        outputItems: ['Animalskin Shirt'],
                        buildTime: 20*60, // a minute of game time
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Bone Needle'),
                        onComplete: worker=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            // Determine what items we're looking for based on the selected recipe
                            let targetName = worker.tasks[0].task.itemsNeeded[0].options[worker.tasks[0].recipeChoices[0]].name;
                            game.clearItems(tile, [{name:targetName, qty:3},{name:'Small Rope', qty:2}]);
                            tile.items.push(game.createItem('Animalskin Shirt', 'item'));
                            tile.modified = true;
                        }
                    },{
                        name: 'Craft Animalskin Pants', // why is pants always plural? I don't know...
                        desc: 'A modest cover',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name:'Boar Skin', qty:3}, {name:'Deer Skin', qty:3}, {name:'Wolf Skin', qty:3}], role:'item', workSite:false},
                            {options: [{name:'Small Rope', qty:3}], role:'item', workSite:false},
                            {options: [{name:'Flint Knife', qty:1}], role:'tool', workSite:false},
                            {options: [{name:'Bone Needle', qty:1}], role:'tool', workSite:false}
                        ],
                        outputItems: ['Animalskin Pants'],
                        buildTime: 20*60, // a minute, again
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Bone Needle'),
                        onComplete: worker=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            // Determine what items we're looking for based on the selected recipe
                            let targetName = worker.tasks[0].task.itemsNeeded[0].options[worker.tasks[0].recipeChoices[0]].name;
                            game.clearItems(tile, [{name:targetName, qty:3},{name:'Small Rope', qty:3}]);
                            tile.items.push(game.createItem('Animalskin Pants', 'item'));
                            tile.modified = true;
                        }
                    },{
                        name: 'Craft Animalskin Shoes',  // not quite moccasins, those are made of Leather
                        desc: 'Basic protection for your feet',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name:'Boar Skin', qty:1}, {name:'Deer Skin', qty:1}, {name:'Wolf Skin', qty:1}], role:'item', workSite:false},
                            {options: [{name:'Small Rope', qty:1}], role:'item', workSite:false},
                            {options: [{name:'Flint Knife', qty:1}], role:'tool', workSite:false},
                            {options: [{name:'Bone Needle', qty:1}], role:'tool', workSite:false}
                        ],
                        outputItems: ['Animalskin Shoes'],
                        buildTime: 20*40, // 40 seconds is long enough
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Bone Needle'),
                        onComplete: worker=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            // Determine what items we're looking for based on the selected recipe
                            let targetName = worker.tasks[0].task.itemsNeeded[0].options[worker.tasks[0].recipeChoices[0]].name;
                            game.clearItems(tile, [{name:targetName, qty:1},{name:'Small Rope', qty:1}]);
                            tile.items.push(game.createItem('Animalskin Shoes', 'item'));
                            tile.modified = true;
                        }
                    },{
                        name: 'Craft Animalskin Hat', // These are to keep workers warm in cold weather
                        desc: 'Keeps your head warm',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name:'Boar Skin', qty:1}, {name:'Deer Skin', qty:1}, {name:'Wolf Skin', qty:1}], role:'item', workSite:false},
                            {options: [{name:'Small Rope', qty:1}], role:'item', workSite:false},
                            {options: [{name:'Flint Knife', qty:1}], role:'tool', workSite:false},
                            {options: [{name:'Bone Needle', qty:1}], role:'tool', workSite:false}
                        ],
                        outputItems: ['Animalskin Hat'],
                        buildTime: 20*30, // 30 seconds
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Bone Needle'),
                        onComplete: worker=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            // Determine what items we're looking for based on the selected recipe
                            let targetName = worker.tasks[0].task.itemsNeeded[0].options[worker.tasks[0].recipeChoices[0]].name;
                            game.clearItems(tile, [{name:targetName, qty:1},{name:'Small Rope', qty:1}]);
                            tile.items.push(game.createItem('Animalskin Hat', 'item'));
                            tile.modified = true;
                        }
                    },{
                        name: 'Craft Straw Hat',  // For keeping cool. We will still need the bone needle for this. But we also need dried straw
                        desc: 'Keeps your head cool',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name:'Straw', qty:1}], role:'item', workSite:false}, // one bundle of staw should do it here
                            {options: [{name:'Small Rope', qty:1}], role:'item', workSite:false},
                            {options: [{name:'Flint Knife', qty:1}], role:'tool', workSite:false},
                            {options: [{name:'Bone Needle', qty:1}], role:'tool', workSite:false}
                        ],
                        outputItems: ['Straw Hat'],
                        buildTime: 20*35, // a little longer for the straw-work
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Bone Needle') && game.unlockedItems.includes('Straw'),
                        onComplete: worker=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            // Determine what items we're looking for based on the selected recipe
                            let targetName = worker.tasks[0].task.itemsNeeded[0].options[worker.tasks[0].recipeChoices[0]].name;
                            game.clearItems(tile, [{name:targetName, qty:1},{name:'Small Rope', qty:1}]);
                            tile.items.push(game.createItem('Straw Hat', 'item'));
                            tile.modified = true;
                        }
                    },{
                        name: 'Craft Animalskin Satchel', // This is the important item! It lets us carry additional things when going on journeys
                        desc: 'Helps you carry items',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name:'Boar Skin', qty:1}, {name:'Deer Skin', qty:1}, {name:'Wolf Skin', qty:1}], role:'item', workSite:false},
                            {options: [{name:'Small Rope', qty:2}], role:'item', workSite:false},
                            {options: [{name:'Flint Knife', qty:1}], role:'tool', workSite:false},
                            {options: [{name:'Bone Needle', qty:1}], role:'tool', workSite:false}
                        ],
                        outputItems: ['Animalskin Satchel'],
                        buildTime: 20*30, // 30 seconds
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Bone Needle'),
                        onComplete: worker => {
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            // Determine what items we're looking for based on the selected recipe
                            let targetName = worker.tasks[0].task.itemsNeeded[0].options[worker.tasks[0].recipeChoices[0]].name;
                            game.clearItems(tile, [{name:targetName, qty:1},{name:'Small Rope', qty:2}]);
                            tile.items.push(game.createItem('Animalskin Satchel', 'item'));
                            tile.modified = true;
                        }
                    }
                ]
            }
            return b;
        }
    }
}