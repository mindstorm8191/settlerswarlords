/*  LeanTo.jsx
    Provides a lean-to, a primitive structure that can be built anywhere with trees. Consists only of a stick leaning against a tree,
    with leafy branches laid on top
    For the game Settlers & Warlords
*/

import React from "react";
import { game } from "../game.jsx";

export function LeanTo() {
    // Returns an object that can generate new game structures
    return {
        name: 'Lean-To',
        image:'leanto.png',
        canBuild: (tile)=>{
            // Returns true if this structure can be built here
            // Any tile with trees in it will do
            if(tile.newlandtype===-1) {
                if(tile.landtype>=5 && tile.landtype<=20) return '';
                return 'This must be placed on a tile with trees';
            }
            if(tile.newlandtype>=5 && tile.newlandtype<=20) return '';
            return 'This must be placed on a tile with trees';
        },
        create: (tile)=>{
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Lean-To',
                descr: `Before food, even before water, one must find shelter from the elements. It is the first requirement for survival;
                        for the elements, at their worst, can defeat you faster than anything else. Consisting of a downed branch with leaves
                        on top, this is fast & easy to set up, but wont last long in the elements itself.`,
                usage: `Your workers must set this up. Once built, it will function for a few nights, then need to be rebuilt. Or you can
                        repair it before it fails`,
                image: 'leanto.png',
                mode: 'build',
                activeTasks: [],
                SidePanel: ()=>{
                    return <div>Mode: {b.mode}</div>;
                }
            };
            return b;
        }
    };
}