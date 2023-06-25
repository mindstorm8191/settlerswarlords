/*  WaterSource.jsx
    Provides a means to collect water from the environment. The type of water returned will depend on where this building is placed; pond water
    will not be good for cooking, but creek water will. Water supplies are assumed to be infinite at this time, but may change in the future
    For the game Settlers & Warlords
*/

// This is another simple block type, so we don't need React
import { game } from "../game.jsx";
import { minimapTiles } from "../minimapTiles.js";

export function WaterSource() {
    // Provides a place to fill containers with water
    return {
        name: 'Water Source',
        image: 'watersource.png',
        tooltip: 'Fill containers with water',
        locked: 1,
        prereq: [['Wooden Bucket']],
        newFeatures: [],
        canBuild: tile => {
            // This can only be built on water tiles... there's only a few available
            //if(tile.newlandtype===-1) {
                if(minimapTiles.find(d=>d.name==='Still Water').id===tile.landtype) return '';
                if(minimapTiles.find(d=>d.name==='Stream').id === tile.landtype) return '';
                return 'Must place this in water';
            //}else{
            //    if(minimapTiles.find(d=>d.name==='Still Water').id===tile.newlandtype) return '';
            //    if(minimapTiles.find(d=>d.name==='Stream').id === tile.newlandtype) return '';
                // We will likely have other water types in the future, but that needs to be built, first
            //    return 'Must place this in water';
            //}
        },
        create: tile => {
            // Return a completed structure instance
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Water Source',
                descr: `Water is a valuable commodity, having many uses even in early tech`,
                usage: 'Provide liquid-holding containers to fill. Water type received depends on what water type this is placed on',
                image: 'watersource.png',
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                update: value => {
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Fill Wooden Bucket',
                        desc: 'Get water in your Wooden Buckets!',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [{options: [{name:'Wooden Bucket', qty:1}], role:'item', workSite:false}],
                        outputItems: ['Wooden Water Bucket'],
                        buildTime: 20, // only 1 second
                        hasQuantity: true,
                        canAssign: ()=>true, // can assign any time
                        onComplete: x=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            let slot = tile.items.findIndex(i=>i.name==='Wooden Bucket');
                            if(slot===-1) { console.log('Error: could not find Wooden Bucket'); return; }
                            tile.items.splice(slot,1);
                            //let land = (tile.newlandtype===-1?tile.landtype : tile.newlandtype);
                            switch(tile.landtype) {
                                case minimapTiles.find(d=>d.name==='Still Water').id:
                                    tile.items.push(game.createItem('Wooden Pond Water Bucket', 'item'));
                                break;
                                case minimapTiles.find(d=>d.name==='Stream').id:
                                    tile.items.push(game.createItem('Wooden Creek Water Bucket', 'item'));
                                break;
                                default:
                                    console.log('Error: land type id='+ tile.landtype +' not handled. Nothing was created');
                            }
                            tile.modified = true;
                        }
                    },{
                        name: 'Extract Clay from Dirt',
                        desc: 'Mash dirt in water to extract clay',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            {options: [{name:'Wooden Pond Water Bucket', qty:1}, {name:'Wooden Creek Water Bucket', qty:1}], role:'item', workSite:false},
                            {options: [{name:'Dirt Ball', qty:5}], role:'item', workSite:false}
                        ],
                        outputItems: ['Wooden Water Bucket', 'Clay Ball'],
                        buildTime: 20*60,
                        hasQuantity: true,
                        canAssign: ()=>true,
                        onComplete: worker=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);

                            // This is our first task that has two options for an item. We need to use the worker's task to extract which
                            // of the choices were actually chosen
                            // w.tasks[0].recipeChoices only holds an array slot number, which is related to w.tasks[0].task.itemsNeeded[x].options
                            // We are only concerned with the first option, so only check itemsNeeded[0].
                            let task = b.tasks.find(t=>t.name==='Extract Clay from Dirt');
                            console.log(task);
                            let options = task.itemsNeeded[0].options;
                            console.log(options, worker);
                            let picked = options[worker.tasks[0].recipeChoices[0]];
                            console.log(picked);
                            let bucketName = picked.name;
                            //let bucketName = b.tasks.find(t=>t.name==='Extract Clay from Dirt').
                            //    itemsNeeded[0].options[
                            //        worker.tasks[0].itemsNeeded[0]
                            //    ].name;
                            let slot = tile.items.find(i=>i.name===bucketName);
                            if(slot===-1) {
                                console.log('Error: could not find '+ bucketName +' at structure');
                                return;
                            }
                            tile.items.splice(slot,1);
                            // Next, we have 5 separate Dirt Balls to remove
                            for(let i=0; i<5; i++) {
                                slot = tile.items.find(i=>i.name==='Dirt Ball');
                                if(slot===-1) {
                                    console.log('Error: could not find Dirt Ball #'+ (i+1) +' at structure');
                                    return;
                                }
                                tile.items.splice(slot,1);
                            }
                            // Now produce the outputs
                            tile.items.push(
                                game.createItem('Wooden Bucket', 'item'),
                                game.createItem('Clay Ball', 'item')
                            );
                            tile.modified = true;
                        }
                    }
                ]
            };
            return b;
        }
    }
}