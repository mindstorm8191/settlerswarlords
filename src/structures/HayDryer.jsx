/*  HayDryer.jsx
    Manages drying hay on open land plots
    For the game Settlers & Warlords
*/

import { game } from "../game.jsx";
import { minimapTiles } from "../minimapTiles.js";

export const hayTypes = [
    {grass: 'Wheat Grass',  in: 'Wheat Hay',  out: 'Dried Wheat Hay',  seed: 'Wheat Seed'},
    {grass: 'Oat Grass',    in: 'Oat Hay',    out: 'Dried Oat Hay',    seed: 'Oat Seed'},
    {grass: 'Rye Grass',    in: 'Rye Hay',    out: 'Dried Rye Hay',    seed: 'Rye Seed'},
    {grass: 'Barley Grass', in: 'Barley Hay', out: 'Dried Barley Hay', seed: 'Barley Seed'},
    {grass: 'Millet Grass', in: 'Millet Hay', out: 'Dried Millet Hay', seed: 'Millet Seed'}
];

// New strategy: Hay Dryer structures can only be placed on cleared tiles. They will only function from their own tile, and not use
// any outside tiles

// Process
// 1) Player places building. reservedTiles and activeItems are empty.
// 2) On first game tick, holdingTask is set to a new event. It can't be assigned
// 3) Player creates a Start Drying task
// 4) A worker is assigned the Start Drying task
// 5) No location is assigned to this task, so the worker needs to determine where the task should reside at. This is a special task type,
//    so the getWorkLocation function is called (as part of the building)
// 6) Worker takes one hay to the target location
// 7) On Complete, the tile selected is marked in reservedTiles and is given a new tile image. All items in that tile are checked for the
//    grass type, and added to the activeItems list.
// 8) The structure periodically checks if any hay items are eligible for the rotation task. Their cycle is set to an odd number, and a task
//    is created to rotate something at that structure
// 9) A worker gets assigned that task, and completes it. Upon complete, any one hay item with an odd cycle number is incremented to an even number.
// 10) After a hay item reaches cycle number 7 (which is 3 cycle tasks), that item will be turned into dried hay



export function HayDryer() {
    return {
        name: 'Hay Dryer',
        image: 'haydryer.png',
        tooltip: 'Dries out hay so it can be used',
        locked: 1,
        prereq: [hayTypes.map(n=>n.in)],
        newFeatures: [],
        canBuild: tile => (tile.landtype===minimapTiles.find(q=>q.name==='Grass').id)?'':'This must be placed on cleared grass',
        create: tile => {
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Hay Dryer',
                descr: `Natural hay has a variety of uses, and its food can last a very long time. But when first cut, it still contains
                        moisture, which must be removed. The simplest method is to let it sit in the sun, but requires regular turning.
                        Fortunately, rain doesn't bother this process much`,
                usage: 'Move freshly cut hay here and... leave it sit. Workers will need to turn these occasionally',
                image: 'haydryer.png',
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                holdingTask: null, // This task will be used to tag all hay elements currently being dried. This will be a task that cannot be
                // assigned to a worker (we will do this by setting the status to building-claimed). When the building is first placed, it
                // will generate one on its first tick
                activeItems: [], // keeps tabs on all items in all tiles
                    // Each entry contains:
                    // name - name of the item. Since this list will be aggregate, along with the tile's items, we don't need to be specific
                    //        about which item is which, as long as both get updated at the same time
                    // cycle - what mode this item is on. Each hay unit should be rotated 3 times. Cycle starts on zero, and increments when
                    //         it is ready to be rotated, and again when rotating is finished; so odd numbered cycle states are waiting for
                    //         rotation
                    // tick - what localmap time this hay item will need to be rotated. The localmap time is moving, so this can be static
                tick: ()=>{
                    if(b.holdingTask===null) {
                        // Create our holding task now
                        console.log('Create new holding task', b.holdingTask);
                        b.holdingTask = {
                            id: game.getNextTaskId(),
                            building: b,
                            task: null,
                            taskType: 'none',
                            //worker: ,
                            status: 'building-claimed',
                            targetx: null,
                            targety: null,
                            targetItem: '',
                            recipeChoices: [],
                            quantity: 0,
                            itemsTagged: [],
                            progress: 0
                        };
                        game.tasks.push(b.holdingTask);
                    }else{
                        if(typeof(b.holdingTask)==='number') {
                            // We need to change this from the task's ID to the actual task
                            b.holdingTask = game.tasks.find(ta=>ta.id===b.holdingTask);
                        }
                    }

                    // Now, we need to run through all our tagged items and determine if it is time to cycle any of them. For each one, we will
                    // need to create a new task for it
                    //console.log('There are '+ b.activeItems.length +' hay items drying');
                    for(let i=0; i<b.activeItems.length; i++) {
                        if(b.activeItems[i].tick<=game.mapTick && (b.activeItems[i].cycle%2===0)) {
                            b.activeItems[i].cycle++;
                            if(b.activeItems[i].cycle>=7) {
                                // This hay has been finished. We need to convert it now
                                let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                                let slot = tile.items.findIndex(u=>u.name===b.activeItems[i].name);
                                if(slot===-1) {
                                    console.log('Error: HayDryer couldnt find '+ b.activeItems[i].name +' at ['+ b.activeItems[i].x +','+ b.activeItems[i].y +']');
                                }else{
                                    tile.items.splice(slot, 1);
                                    let newItemName = hayTypes.find(r=>r.in===b.activeItems[i].name).out;
                                    tile.items.push(game.createItem(newItemName, 'item'));
                                    tile.modified = true;

                                    // Don't forget to remove this activeItems instance. We must also step-back the search index
                                    b.activeItems.splice(i,1); i--;
                                }
                            }else{
                                game.createTask(b, b.tasks.find(t=>t.name==='Turn Hay'), 1); // We can just leave this out there to be assigned by someone
                            }
                        }
                    }

                    b.blinkerValue++;
                    b.update(b.blinkerValue);
                },
                update: value => {
                    // Update is ONLY for updating the display - currently only from worker-triggered updates. Otherwise, this doesn't run
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Dry Hay',
                        desc: 'Move hay to this location for drying',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [{options: hayTypes.map(n=>({name:n.in, qty:1})), role:'item', workSite:false}],
                        outputItems: hayTypes.map(u=>u.out),
                        buildTime: 20, // 1 second to place the hay how it needs to be
                        hasQuantity: true,
                        canAssign: ()=>true, // this task is not assigned by the player
                        onComplete: x=>{
                            // We need to mark the hay item placed here - and all hay items - as being processed
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);

                            // For each hay type, get a count of the number of items in the tile, and number of items in the active items list
                            let compare = hayTypes.map(h=>({
                                name: h.in,
                                onTile: tile.items.filter(i=>i.name===h.in).length,
                                isActive: b.activeItems.filter(i=>i.name===h.in).length
                            }));

                            for(let i=0; i<compare.length; i++) {
                                if(compare[i].onTile > compare[i].isActive) {
                                    for(let j=0; j<compare[i].onTile - compare[i].isActive; j++) {
                                        b.activeItems.push({name: compare[i].name, cycle:0, tick:game.mapTick +20*60*3});
                                    }
                                }
                                // If onTile is less than isActive, we'll need to make other adjustments... I'm not sure what yet, though
                            }

                            // Note that all hay items here will need to be tagged with the structure's task, as well
                            let hayNames = hayTypes.map(r=>r.in);
                            let count = 0;
                            for(let i=0; i<tile.items.length; i++) {
                                if(hayNames.includes(tile.items[i].name)) {
                                    tile.items[i].inTask = b.holdingTask.id;
                                    count++;
                                } 
                            }
                            console.log('Marked '+ count +' hay items for this building');
                            //game.tiles.find(u=>u.x===game.structures.find(r=>r.name==='Hay Dryer').x && u.y===game.structures.find(r=>r.name==='Hay Dryer').y).items;
                        }
                    },{
                        name: 'Turn Hay',
                        desc: 'Turn hay over to dry the whole set more easily',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [
                            //{options: hayTypes.map(n=>({name:n.in, qty:1})), role:'item', workSite:false}, // We will be setting the coords for this task anyway
                            // We would normally mark each hay item here, but it's already tagged with the structure's task id. We could change the tag
                            // when this task is created, but the worker's code will be expecting to need to find one anyway. Better to merely leave this
                            // field blank
                            {options: [{name:'Wood Pitchfork', qty:1}], role:'tool', workSite:false}
                        ],
                        outputItems: [], // this task isn't considered when searching for item conversion opportunities
                        buildTime: 20*5,
                        hasQuantity: true,
                        canAssign: ()=>false,  // This task gets generated automatically by this building, when it's time to turn the hay
                        onComplete: worker=>{
                            //let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);

                            console.log('There are '+ b.activeItems.filter(r=>r.cycle%2===1).length +' hays to turn');

                            // Find an item in the activeItems list that is here and has an odd cycle number. There may be several here, but each
                            // should have its own task instance, we can turn any one of them
                            let plot = b.activeItems.findIndex(r=>r.cycle%2===1);
                            if(plot===-1) {
                                console.log('Error in Turn Hay: could not find valid item to turn');
                                return;
                            }
                            b.activeItems[plot].cycle++;
                            b.activeItems[plot].tick = game.mapTick + 20*60*3;
                            // Actually, that should be all we need here
                        }
                    }
                ],

                SidePanel: ()=>{
                    if(b.activeItems.length===0) {
                        return <div>Waiting for hay to be added</div>;
                    }
                    return (
                        <div>
                            Next hay update in {
                                Math.floor(b.activeItems.reduce((carry,item)=>
                                    Math.min(carry, (item.tick-game.mapTick>0)?item.tick-game.mapTick:99999),
                                999999)/20)
                            } seconds
                        </div>
                    );
                },

                onSave: ()=>{
                    // save key information specific to this structure type
                    return {
                        holdingTask: b.holdingTask.id,
                        activeItems: b.activeItems
                    };
                },

                onLoad: pack=>{
                    b.holdingTask = pack.holdingTask; // unfortunately, tasks are loaded after the structures are loaded. We will need
                    // to hold this task ID until the task can tick again, then pick up the correct task instance there
                    b.activeItems = pack.activeItems;
                }

            };
            return b;
        }
    }
}