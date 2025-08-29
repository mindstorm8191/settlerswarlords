/*  FarmersPost.jsx
    Allows workers to clear away grasses, and develop lands for farming
    For the game Settlers & Warlords
*/

import { game } from "../game.jsx";

// Grass - attached to the ground. Need a Scythe to remove
// Cut Grass - cut and can be transported

// Remember: Seeds are not guaranteed to sprout. We should have 33% or less chance of any seed becoming a sprout. Sprouts are also not guaranteed to grow into full plants.

export default function FarmersPost() {
    return {
        name: 'Farmers Post',
        image: 'farmerspost.png',
        tooltip: 'Clear grasses and grow crops',
        locked: 1,
        prereq: [['Flint Scythe']],
        canBuild: (tile) => {
            // Returns an empty string if this can be built on the selected tile, or an error string to show the user if not
            // This is only a post, it can be built anywhere
            return '';
        },
        create: (tile) => {
            let b = {
                name: 'Farmers Post',
                descr: `Edible plants are everywhere, but in the wild, they don't grow in enough places to be a reliable food supply. Farming
                    allows humans to cultivate crops on a larger scale, supporting more people.`,
                image: 'farmerspost.png',
                position: [tile.x, tile.y, tile.z],
                size: [1,1,1],
                id: game.getNextStructureId(),
                workProgress: 0,
                workerAssigned: null,
                recipe: null,
                recipes: [
                    {
                        name: 'Collect Grasses',
                        workerTime: 20*6, // 6 seconds per grass bundle
                        toolsNeeded: ['Flint Scythe'],
                        canAssign: ()=>true,
                        canWork: ()=> {
                            // This will function the same way as the Forest Post manages collecting Twine: so long as there is grasses around that can be cut,
                            // this can be assigned.

                            // Start with a list of grass types
                            let grasses = ['Wheat Grass', 'Oat Grass', 'Rye Grass', 'Barley Grass', 'Millet Grass'];

                            for(let z=b.position[0]-10; z<=b.position[0]+10; z++) {
                                for(let y=b.position[1]-1; y<=b.position[1]+1; y++) {
                                    for(let x=b.position[2]-10; x<=b.position[2]+10; x++) {
                                        if(
                                            typeof(game.tiles[x])==='undefined' ||
                                            typeof(game.tiles[x][y])==='undefined' ||
                                            typeof(game.tiles[x][y][z])==='undefined'
                                        )   continue;
                                        if(typeof(game.tiles[x][y][z].items)==='undefined') continue;

                                        // With the items list, do a double-search between the items list and types of grass
                                        if(game.tiles[x][y][z].items.some(item=>grasses.some(g=>item.name===g))) {
                                            return '';
                                        }
                                    }
                                }
                            }
                            return "Can't find grass in surrounding tiles";
                        }
                    }
                ]
            };
            return b;
        }
    };
}