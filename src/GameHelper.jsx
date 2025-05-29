//  GameHelper.jsx
//  A list of functions commonly used, to help make coding a little easier
//  For the game Settlers & Warlords

import { game } from "./game.jsx";

export const GameHelper = {
    removeItems: (tile, itemName, qty) => {
        // Removes a specific number of target items from the tile given
        tile.items = tile.items.filter(i=>{
            if(qty<=0) return true;
            if(i.name===itemName) {
                qty--;
                return false;
            }
            return true;
        });
    },

    getTile: (x,y,z,codeSpot) => {
        // Returns a tile from the tiles list, and provides an error if it fails
        let tile = game.tiles[x][y][z];
        if(typeof(tile)==='undefined') {
            console.log('Error in '+ codeSpot +': Could not load tile at ['+ x +','+ y +','+ z +']');
            return false;
        }
        return tile;
    }
}
