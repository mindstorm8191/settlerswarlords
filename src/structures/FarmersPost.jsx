/*  FarmersPost.jsx
    Allow players to clear grasses and grow additional crops
    For the game Settlers & Warlords
*/

import { game } from "../game.jsx";

import { hayTypes } from "./HayDryer.jsx";

export function FarmersPost() {
    return {
        name: 'Farmers Post',
        image: 'farmerspost.png',
        tooltip: 'Grow crops to make food',
        locked: 1,
        prereq: [['Flint Scythe']],
        newFeatures: [],
        canBuild: tile => '', // being a post, we can place this anywhere
        create: tile => {
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Farmers Post',
                descr: `Local wildlife can provide only so much food. To truely advance, you need more workers, and that requires food. Plenty
                        of plant options can be cultivated to provide a wealth of food, if you're patient.`,
                usage: 'Clear & plow some lands, then plant crops and let them grow',
                image: 'farmerspost.png',
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                update: value => {
                    // Handles updating the display on state changes. This mostly triggers the Blinker function
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Clear Grasses',
                        desc: 'Cut grasses, leaving barren land',
                        taskType: 'craft',
                        workLocation: 'atItem',
                        itemsNeeded: [
                            {options: [
                                {name:'Wheat Grass', qty:1},
                                {name:'Oat Grass', qty:1},
                                {name:'Rye Grass', qty:1},
                                {name:'Barley Grass', qty:1},
                                {name:'Millet Grass', qty:1}], role:'item', workSite:true},
                            {options: [{name:'Flint Scythe', qty:1}], role:'tool', workSite:false}
                        ],
                        buildTime: 20*30, // 30 seconds to clear a one tile
                        hasQuantity: true,
                        canAssign: ()=>true, // can assign any time
                        onComplete: worker=>{
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);

                            // Even though we searched for only 1 item, we plan to clear the whole tile of that crop
                            let count = 0;
                            let grassType = '';
                            tile.items = tile.items.filter(item=>{
                                if(['Wheat Grass', 'Oat Grass', 'Rye Grass', 'Barley Grass', 'Millet Grass'].includes(item.name)) {
                                    count++
                                    grassType = item.name;
                                    return false;
                                }
                                return true; // We are keeping all other items
                            });
                            let output = '';
                            switch(grassType) {
                                case 'Wheat Grass': output = 'Wheat Hay'; break;
                                case 'Oat Grass': output = 'Oat Hay'; break;
                                case 'Rye Grass': output = 'Rye Hay'; break;
                                case 'Barley Grass': output = 'Barley Hay'; break;
                                case 'Millet Grass': output = 'Millet Hay'; break;
                            }
                            for(let i=0; i<count; i++) {
                                tile.items.push(game.createItem(output, 'item'));
                            }
                            // Now change the land type
                            tile.landtype = 42;
                            tile.modified = true;
                            //game.updateTiles([...game.tiles]);
                            game.updateTiles(game.tiles.map(t=>{
                                if(t.x===tile.x && t.y===tile.y) return tile;
                                return t;
                            }));
                        }
                    },{
                        name: 'Cut Seeds from Hay',
                        desc: 'Separate grass into seeds and straw',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: hayTypes.map(u=>({name:u.out, qty:1})), role:'item', workSite:false},
                            {options: [{name: 'Flint Knife', qty:1}], role:'tool', workSite:false}
                        ],
                        buildTime: 20*30, // a stack should take about 30 seconds each
                        hasQuantity: true,
                        canAssign: ()=>hayTypes.some(u=>game.unlockedItems.includes(u.out)),
                        onComplete: x=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            let hayPicked = '';
                            let hayNames = hayTypes.map(u=>u.out);
                            let slot = tile.items.findIndex(i=>{
                                if(hayNames.includes(i.name)) {
                                    hayPicked = i.name;
                                    return true;
                                }
                                return false;
                            });
                            if(slot===-1) {
                                console.log('Error in FarmersPost->Cut Seeds from Hay: could not find suitable hay to use');
                                return;
                            }
                            tile.items.splice(slot,1);
                            tile.items.push(game.createItem(hayTypes.find(u=>u.out===hayPicked).seed, 'item'),
                                            game.createItem('Straw', 'item'));
                            tile.modified = true;
                        }
                    },{
                        name: 'Craft Thatch Tiles',
                        desc: 'Use straw to make roofing tiles',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name: 'Straw', qty:1}], role:'item', workSite:false},
                            {options: [{name: 'Small Rope', qty:1}], role:'item', workSite:false}
                        ],
                        buildTime: 20*15, // 15 seconds
                        hasQuantity: true,
                        canAssign: ()=>game.unlockedItems.includes('Straw'),
                        onComplete: x=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            game.clearItems(tile, ['Straw', 'Small Rope'], 'Farmers Post->Craft Thatch Tiles');
                            //let item = game.createItem('Thatch Tile', 'item')
                            //console.log('We made a '+ item.name +'!');
                            tile.items.push(game.createItem('Thatch Tile', 'item'));
                            tile.modified = true;
                        }
                    }
                ]
            };
            return b;
        }
    }
}