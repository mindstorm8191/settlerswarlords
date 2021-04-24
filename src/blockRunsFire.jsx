/*  blockRunsFires.jsx
    For all blocks that use fire to get work done
    For the game Settlers & Warlords
*/

import {game} from "./game.jsx";

export const blockRunsFire = state => ({
    // Allows blocks to manage a fire, keeping temperature up by adding new fuel. Temperature is maintained so long as there are
    // workers to add fuel, and items to cook

    // Attributes required from the root block:
    // fireDecay - rate at which the fire cools on its own. Note that this decays even when there is fuel burning
    // fireBoost - How much temperature is added by fuel
    // cookChoices - List of items that can be accepted as input, and can be cooked
    //      name - name of the item to hold
    //      cookTime: How much time is needed to complete cooking of this item, while at 100% heat
    //      burnTime: How much time after cookTime ends for when this item is too burned and is ruined
    //      minTemp:  Minimum temperature to make progress on cooking time
    //      maxTemp:  Ideal cooking temperature. When the fire's temp is at/above this, new fuel won't be added
    //      outItem:  Name of item produced when cooking is finished. Note a worker must remove the item from the fire for this to be made
    //      outGroup: Item group for the output item
    //      outExtras: Extra attributes for the completed item
    //      burnItem:  Name of the item produced if this item is kept on the fire too long

    inFuel: [],     // Array holding all fuel items
    overFire: null,  // Single item that is currently cooking on the fire.
    cookProgress: 0, // How much time has been made on cooking this item
    fuelTime: 0,    // How many game ticks this fire has until it starts cooling
    fireTemp: 0,    // Zero is normal 'room' temperature, most fires get up to 100. Cooking can start at 50
    fuelBoost: 0,   // Current temp boost provided by the currently burning fuel. This is reset each time a new fuel item is added
    manageFire: ()=>{
        if(isNaN(state.fireTemp)) {
            console.log('Error: fireTemp set to NaN. Resetting fire');
            state.fireTemp = 0;
        }
        if(isNaN(state.fuelBoost) || typeof(state.fuelBoost)==='undefined') {
            console.log('Error: fuelBoost set to invalid number. Resetting boost');
            state.fuelBoost = 1;
        }
        // Handles updating the fire state, even if there are no workers available
        state.fireTemp = Math.max(0, state.fireTemp-state.fireDecay);
        if(state.fuelTime>0) {
            //console.log()
            state.fuelTime--;
            state.fireTemp += state.fuelBoost;
        }

        // Also handle items currently over the fire
        if(state.overFire!==null) {
            let source = state.cookChoices.find(e=>e.name===state.overFire.name);
            if(source===null) {
                console.log('Error in blockRunsFire: Item over fire ('+ state.overFire.name +') is not on cookChoices list');
                return;
            }
            if(state.fireTemp>source.minTemp) {
                // Well we can make at least some progress. Calculate how much, and add it to the cook time
                let adjustedTemp = state.fireTemp - source.minTemp;
                let workRange = source.maxTemp - source.minTemp;
                let rate = adjustedTemp / workRange;
                if(rate>1.0) rate = 1.0;    // This accounts for when the temp is above maximum
                state.cookProgress += rate;
            }
        }
    },
    manageFuel: ()=>{
        // Handles managing the fuel for this fire; adding more when needed, collecting fuel when the stash isn't full
        // Returns true if work was done (thus needing work points to be deducted) or false if not

        // Before adding fuel to the fire, first determine if there's anything to cook. Don't leave a fire burning fuel
        // if there's no work to be done
        if(state.inItems.length!==0) {
            if(state.fuelTime<=0 && state.inFuel.length>0 && state.overFire!==null) {
                // Also check if the fire is already hot enough for our current item. We want to keep the fire at around the item's
                // maximum cooking temperature. If it's already there, we can hold off on adding more fuel (for now)
                let choice = state.cookChoices.find(e=>e.name===state.overFire.name);
                if(typeof(choice)==='undefined') {
                    console.log('Error in blockRunsFire->manageFuel: current cooking item ('+ state.overFire.name +') not found in cook Choices');
                    return;
                }
                if(state.fireTemp<choice.maxTemp) {

                    // Toss the next item onto the fire
                    let picked = null;
                    while(picked===null) {
                        picked = state.fuelChoices.find(p=>p.name===state.inFuel[0].name);
                        if(picked===null) {
                            console.log('Warning in blockRunsFire: item picked is not an accepted fuel type');
                            game.deleteItem(state.inFuel[0].id);
                            state.inFuel.splice(0,1);
                        }
                        if(state.inFuel.length===0) {
                            // All options failed
                            console.log('Error in blockRunsFire: ran out of possible fuel options. Aborting');
                            return false;
                        }
                    }
                    state.fuelBoost = picked.fuelBoost;
                    state.fuelTime  = picked.fuelTime;
                    game.deleteItem(state.inFuel[0].id);
                    state.inFuel.splice(0,1);
                    return true;
                }
            }
        }

        // Otherwise, search neighbor blocks for fuel items to collect
        if(state.inFuel.length>=state.fuelMax) return false; // we're already at our desired fuel level

        // First, reduce our fuel choices to a list of item names
        let needsList = state.fuelChoices.map(e=>e.name);
        return game.getNeighbors(state.tileX, state.tileY).some(n=>{
            // If any neighbor has an item we need, we can return true to stop searching
            if(typeof(n.onhand)==='undefined') return false; // This block has no output list
            let pickup = n.getItemFrom(needsList);
            if(pickup===null) return false;
            // We got a hit! Put it in our fuel inventory
            state.inFuel.push(pickup);
            game.moveItem(pickup.id, state.id);
            return true;
        });
    },
    manageCraft: ()=>{
        // Manages cooking of items, removing finished items and adding new ones
        // Returns true if work was done, or false if not

        // First, determine if the current item is done cooking
        let source = null;
        if(state.overFire!==null) {
            source = state.cookChoices.find(e=>e.name===state.overFire.name);
            if(source===null) {
                console.log('Error in manageCraft: item over fire ('+ state.overFire.name +') not found in cookChoices. Deleting item');
                state.overFire = null;
                return false;
            }
            // First, see if this item burned
            if(state.cookProgress>=source.cookTime+source.burnTime) {
                state.onhand.push(game.createItem(state.id, source.burnItem, 'item', {}));
                game.deleteItem(state.overFire.id);
                state.overFire = null;
                state.cookProgress = 0;
                return true;
            }
            if(state.cookProgress>=source.cookTime) {
                for(let i=0;i<source.outQty;i++) {
                    state.onhand.push(game.createItem(state.id, source.outItem, source.outGroup, source.outExtras));
                }
                game.deleteItem(state.overFire.id);
                state.overFire = null;
                state.cookProgress -= source.cookTime;
                return true;
            }
        }

        // Figure out if we have anything on hand to cook next
        if(state.inItems.length!==0 && state.overFire===null) {
            // Toss the next item onto the fire!
            state.overFire = state.inItems.splice(0,1)[0];  // Splice returns the item that was removed from the array... as an array, though
            return true;
        }

        // No work to do with the fire. Now, see if we can locate any cookable items nearby
        let pickup = state.findItems(state.cookChoices.map(e=>e.name));
        if(pickup!==null) {
            state.inItems.push(pickup);
            game.moveItem(pickup.id, state.id);
            return true;
        }
        return false;
    },
    showCookProgress() {
        // Returns a value between 0 and 100, representing the cooking progress of the current item
        if(state.overFire===null) return 0;
        let source = state.cookChoices.find(e=>e.name===state.overFire.name);
        if(source===null) return 'Invalid Item';
        return Math.floor((state.cookProgress / source.cookTime) * 100);
    }
});