/*  DirtSource.jsx
    Provides a means for dirt to be collected, especially for early players
    For the game Settlers & Warlords
*/

// This is another simple block type, so we don't need React
import { game } from "../game.jsx";

export function DirtSource() {
    // Dirt is readily available, but a worker must clear out the vegetation growing on it first
    return {
        name: 'Dirt Source',
        image: 'dirtsource.png',
        tooltip: 'Collect dirt from a vegetation-free space',
        locked: 1,
        prereq: [['Flint Shovel']],
        newFeatures: [],
        canBuild: tile => {
            // This can only be built on non-forest and non-rock tiles
            //if(tile.newlandtype===-1) {
            //    if(tile.landtype<=4) return '';
            //    return 'Must place this on light vegetation';
            //}else{
            //    if(tile.newlandtype<=4) return '';
            //    if(tile.newlandtype===42) return '';
            //    if(tile.newlandtype===44) return '';
            //    return 'Must place this on light vegetation';
            //}
            if(tile.landtype<=4) return '';
            if(tile.landtype===42) return '';
            if(tile.landtype===44) return '';
            return 'Must place this on light vegetation';
        },
        create: tile => {
            // Return a completed structure instance
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Dirt Source',
                descr: `Even the dirt you stand on has value to it. The first of its usefulness is acquiring clay`,
                usage: 'Once vegetation is cleared, dirt can be collected with ease',
                image: 'dirtsource.png',
                areaCleared: false,
                activeTasks: [],
                blinker: null,
                blinkerValue: 0,
                update: value => {
                    if(b.blinker!==null) b.blinker(value);
                },
                tasks: [
                    {
                        name: 'Clear Vegetation',
                        desc: 'Remove vegetation before reaching the dirt',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [{options: [{name: 'Flint Shovel', qty:1}], role:'tool', workSite:false}],
                        outputItems: [],
                        buildTime: 20 * 45, // 45 seconds
                        hasQuantity: false,
                        canAssign: ()=>!b.areaCleared, // can only assign if the area hasn't been cleared first
                        onComplete: x=>{
                            b.areaCleared = true;

                            // We also need to go through and erase all vegetation items, anything else here can stay
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            tile.items = tile.items.filter(i=>{
                                return !['Wheat Grass', 'Oat Grass', 'Rye Grass', 'Barley Grass', 'Millet Grass'].includes(i.name);
                            });
                            tile.modified = true;
                        }
                    },{
                        name: 'Collect Dirt',
                        desc: 'Get a ball of dirt. Has... some uses',
                        taskType: 'craft',
                        workLocation: 'structure',
                        itemsNeeded: [{options: [{name: 'Flint Shovel', qty:1}], role:'tool', workSite:false}],
                        outputItems: ['Dirt Ball'],
                        buildTime: 20 * 5, // 5 seconds... shoveling up a ball of dirt wouldn't take very long
                        hasQuantity: true,
                        canAssign: ()=>b.areaCleared, // can only assign if the area has been cleared first
                        onComplete: x=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            tile.items.push(game.createItem('Dirt Ball', 'item'));
                            tile.modified = true;
                        }
                    }
                ],
                onSave: ()=>{
                    return {areaCleared: (b.areaCleared?1:0)};
                    // I don't have a reliable way to store boolean values in JSON on the database, so it is better to pass a 0 or 1
                },
                onLoad: pack=>{
                    b.areaCleared = (pack.areaCleared===1);
                }
            };
            return b;
        }
    }
}