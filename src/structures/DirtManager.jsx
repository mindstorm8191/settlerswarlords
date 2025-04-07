/*  DirtManager.jsx
    Allows players to specify where to pick up dirt and where to place it.
    For the game Settlers & Warlords

    Managing tile movement will happen 10 shovel-fulls at a time. We will also have to accomodate sloped tiles, now. Sloped tiles will always use 5 scoops of dirt; full tiles will
    need 10. Sloped tiles can turned into full tiles with an additional 5 scoops.

    One tile marked for dirt deposit; can only hold 5 dirt. More would mean dirt spilling over
    |__|__|__|
    |__|uu|__|
    |__|__|__|

    Two tiles marked. Can only hold 10 dirt
    |__|__|__|__|
    |__|uu|uu|__|
    |__|__|__|__|

    Four tiles can also only hold 20 dirt
    |__|__|__|__|
    |__|uu|uu|__|
    |__|uu|uu|__|
    |__|__|__|__|

    A 3x3 tile section can hold much more dirt: 50 scoops
    |__|__|__|__|__|
    |__|uu|uu|uu|__|
    |__|uu|ff|uu|__|
    |__|uu|uu|uu|__|
    |__|__|__|__|__|

    A 3x4 tile section can have two full tiles: 70 scoops
    |__|__|__|__|__|__|
    |__|uu|uu|uu|uu|__|
    |__|uu|ff|ff|uu|__|
    |__|uu|uu|uu|uu|__|
    |__|__|__|__|__|__|

    A 3x5 can hold 90 dirt
    |__|__|__|__|__|__|__|
    |__|uu|uu|uu|uu|uu|__|
    |__|uu|ff|ff|ff|uu|__|
    |__|uu|uu|uu|uu|uu|__|
    |__|__|__|__|__|__|__|

    A 4x4 can hold 100 dirt
    |__|__|__|__|__|__|
    |__|uu|uu|uu|uu|__|
    |__|uu|ff|ff|uu|__|
    |__|uu|ff|ff|uu|__|
    |__|uu|uu|uu|uu|__|
    |__|__|__|__|__|__|

    Larger areas can show be used to make elevated level surfaces, using 370 scoops, but can also be stacked up a second level, holding 420 scoops
    |__|__|__|__|__|__|__|__|__|
    |__|uu|uu|uu|uu|uu|uu|uu|__|
    |__|uu|ff|ff|ff|ff|ff|uu|__|
    |__|uu|ff|mm|mm|mm|ff|uu|__|
    |__|uu|ff|mm|22|mm|ff|uu|__|
    |__|uu|ff|mm|mm|mm|ff|uu|__|
    |__|uu|ff|ff|ff|ff|ff|uu|__|
    |__|uu|uu|uu|uu|uu|uu|uu|__|
    |__|__|__|__|__|__|__|__|__|
    
    Workers will try to fill the closest tiles they can. They will not be able to add to a sloped tile until all neighboring tiles are also sloped
*/

import React from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { textureURL } from "../App.js";

import { game } from "../game.jsx";

export default function DirtManager() {
    // Returns an object that can generate new DirtManager structures. This allows players to move dirt or forage-covered tiles to new locations

    return {
        name: 'Dirt Manager',
        image: 'dirtmanager.png',
        tooltip: 'Terraform dirt',
        locked: 1,
        prereq: [['Flint Shovel']],
        canBuild: (tile) => '',
        create: (tile) => {
            let b = {
                name: 'Dirt Manager',
                descr: `Nature puts dirt where it works best; usually for draining rainwater. That isn't always ideal for your needs, such as growing crops or making factories.
                        Now that you have shovels, we can fix that`,
                image: 'dirtmanager.png',
                position: [tile.x, tile.y, tile.z],
                size: [1,1,1],
                id: game.getNextStructureId(),
                workProgress: 0,
                workerAssigned: null,
                recipe: null,
                pickupList: [],  // list of tile locations where dirt will be picked up from. Once these tiles are completed, they will be removed from the list
                dropoffList: [], // list of tile locations where dirt will be placed down at. Will be emptied as they get completed
                recipes: [
                    {
                        name: 'Move Dirt',
                        workerTime: 20, // 1 second to pick up dirt, 1 second to pack it down where it goes
                        toolsNeeded: ['Flint Shovel'],
                        canAssign: ()=>true, // This can be assigned at any time
                        canWork: ()=> {
                            // Returns true if there is work that workers can do
                            
                            // For now, we can't work until there are pickup and dropoff locations. Come back to this later
                            return false;
                        },
                        workLocation: (tile,position) => {
                            // returns true if the given tile is suitable for work.
                            // Come back to this later, too
                            return false;
                        },
                        doWork: ()=>{
                            // Lets workers perform actions at the given tile
                            // Come back to this later as well
                        }
                    }
                ],
                Render: ()=>{
                    const texture = useLoader(TextureLoader, textureURL +"structures/itemhauler.png");
                    return (
                        <mesh position={[b.position[0], .1, b.position[2]]} rotation={[-Math.PI/2,0,0]}>
                            <planeGeometry args={[1,1]} />
                            <React.Suspense fallback={<meshPhongMaterial color={"brown"} />}>
                                <meshStandardMaterial map={texture} />
                            </React.Suspense>
                        </mesh>
                    );
                },
                RightPanel: ()=> {
                    const [interactionState, setInteractionState] = React.useState('none');
                    switch(interactionState) {
                        case 'none': return (
                            <div>
                                Pickup: 0 unfilled <span className="fakelink" style={{marginBottom:10}}>Pick Pickup Sites</span><br />
                                Dropoff: 0 unfilled <span className="fakelink">Pick Dropoff Sites</span>
                            </div>
                        );
                        case 'pickup': return (
                            <div>
                                Select map tiles to remove dirt from, then click <span className="fakelink">Done</span>
                            </div>
                        );
                        case 'dropoff': return (
                            <div>
                                Select map tiles to add dirt to, then click <span className="fakelink">Done</span>
                            </div>
                        );
                        default: return <div>Error: interactionState of {interactionState} is not valid.</div>
                    }
                },
                save: ()=> {
                    // Saves content relavent to this structure to the database
                    console.log('Dont forget the save method for Dirt Manager!');
                }
            };
            tile.structure = b.id;
            tile.modified = 1;
            return b;
        }
    }
}

