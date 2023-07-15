/*  ButcherShop.jsx
    Allows freshly killed animals to be slaughtered, to extract meats, along with other animal byproducts
    For the game Settlers & Warlords
*/

import { game } from "../game.jsx";

export function ButcherShop() {
    return {
        name: 'Butcher Shop',
        image: 'butchershop.png',
        tooltip: 'Chop meats from killed animals',
        locked: 1,
        prereq: [['Dead Boar', 'Dead Chicken', 'Dead Deer', 'Dead Wolf']],
        newFeatures: [],
        canBuild: ()=>'', // this can be built anywhere
        create: tile => {
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Butcher Shop',
                descr: `Animals can be cooked whole and provide plenty of meats. But butchering an animal first can allow the meats to be cooked
                        faster. Plus, byproducts such as animal skins and bones have lots of important uses.`,
                usage: `Butcher animals before cooking to maximize the benefits of an animal`,
                image: 'butchershop.png',
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                update: value => {
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Butcher an Animal',
                        desc: 'Butcher any animal available',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name:'Dead Boar', qty:1},
                                       {name:'Dead Chicken', qty:1},
                                       {name:'Dead Deer', qty:1},
                                       {name:'Dead Wolf', qty:1}], role:'item', workSite:false},
                            {options: [{name:'Flint Knife', qty:1}], role:'tool', workSite:false}],
                        outputItems:['Raw Boar Meat', 'Raw Chicken Meat', 'Raw Deer Meat', 'Raw Wolf Meat', 'Boar Skin', 'Deer Skin', 'Wolf Skin', 'Bone', 'Feather'],
                        buildTime: 20*60,
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: worker=>{
                            // Now we need to determine which item is being processed.
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            let targetName = worker.tasks[0].task.itemsNeeded[0].options[worker.tasks[0].recipeChoices[0]].name;
                            console.log('Butchering a '+ targetName);
                            let slot = tile.items.findIndex(i=>i.name===targetName);
                            if(slot===-1) {
                                console.log('Error in Butcher Shop: could not find target item of '+ targetName);
                                return;
                            }
                            tile.items.splice(slot,1);
                            // What we make next depends on what we had
                            switch(targetName) {
                                case 'Dead Boar':
                                    for(let i=0; i<12; i++) {
                                        tile.items.push(game.createItem('Raw Boar Meat', 'item'));
                                    }
                                    for(let i=0; i<7; i++) {
                                        tile.items.push(game.createItem('Bone', 'item'));
                                        // Boar horns will count under bone as well
                                    }
                                    for(let i=0; i<5; i++) {
                                        tile.items.push(game.createItem('Boar Skin', 'item'));
                                    }
                                break;
                                case 'Dead Chicken':
                                    for(let i=0; i<2; i++) {
                                        tile.items.push(game.createItem('Raw Chicken Meat', 'item'));
                                    }
                                    tile.items.push(game.createItem('Bone', 'item'));
                                    // Chickens won't have animal skins that can be used for anything. However, their feathers are useful
                                    for(let i=0; i<5; i++) {
                                        tile.items.push(game.createItem('Feather', 'item'));
                                    }
                                break;
                                case 'Dead Deer':
                                    for(let i=0; i<8; i++) {
                                        tile.items.push(game.createItem('Raw Deer Meat', 'item'));
                                    }
                                    for(let i=0; i<8; i++) {
                                        tile.items.push(game.createItem('Bone', 'item'));
                                    }
                                    for(let i=0; i<6; i++) {
                                        tile.items.push(game.createItem('Deer Skin', 'item'));
                                    }
                                break;
                                case 'Dead Wolf':
                                    for(let i=0; i<5; i++) {
                                        tile.items.push(game.createItem('Raw Wolf Meat', 'item'));
                                    }
                                    for(let i=0; i<4; i++) {
                                        tile.items.push(game.createItem('Bone', 'item'));
                                    }
                                    for(let i=0; i<4; i++) {
                                        tile.items.push(game.createItem('Wolf Skin', 'item'));
                                    }
                                break;
                                default:
                                    console.log('Error in Butcher Shop: onComplete not coded for item='+ targetName +'. Nothing created');
                            }
                            tile.modified = true;
                        }
                    }
                ]
            };
            return b;
        }
    }
}