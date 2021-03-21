/*  game.jsx
    General objects & functions for managing the game
    For the game Settlers & Warlords
*/

let cardinalDirections = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];

export let game = {
    isRunning: false,
    foodCounter: 180,   // Players start with a 3-minute lead time to get food production going
    tiles: [],          // all the tiles of the map
    blocks: [],         // All buildings or other structures on the map
    items: [],          // All items that have been generated. This list is kept so that items with decay can decay properly... all this
                        // needs to be ironed out though
    updateReact: null,  // This gets updated when the game begins, allowing us to trigger map updates every game tick
    timerLoop: null,    // Handle to the setInterval object, so we can edit this when needed

    getNextBlockId: ()=> {
        if(game.blocks.length===0) return 1;
        return game.blocks.reduce((carry,block)=>{
            if(block.id>carry) return block.id;
            return carry;
        }, 1) +1;
    },
    getNeighbors: (x,y) => {
        // Returns an array holding all neighboring blocks (in cardinal directions)
        return cardinalDirections.map(dir=>{
            return game.blocks.find(ele=>ele.tileX===x+dir.x && ele.tileY===y+dir.y);
        }).filter(ele => {
            return typeof(ele)!=='undefined';
        });
    },
    createItem: (buildingId, name, group, extras) => {
        // Handles creating a new item, while also adding it to the global itemsList structure
        let item = { id: game.items.length === 0 ? 1 : game.items[game.items.length - 1] + 1, name, group, ...extras };
        game.items.push(item);
        return item;
    },
    update: ()=>{
        if (!game.isRunning) return;

        // So, from this vantage point, we actually cannot see any of the React useState variables. They're null. However, that
        // doesn't stop us from setting these values through the respective function calls.
        // So to do this effectively, we need to keep the primary data structure away from React. React will be provided a new copy
        // on every game tick, where everything can be re-rendered

        // Start with managing food consumption
        game.foodCounter--;
        if (game.foodCounter <= 0) {
            // Find a suitable food item to consume
            let foodList = game.items.filter((ele) => ele.group === "food");
            let foodSlot = Math.floor(Math.random() * foodList.length);
            let food = foodList[foodSlot];
            // With the food picked up from the food list, we also need to find (and remove) it from the block it's in
            let foundFood = game.blocks.forEach((building) => {
                if (typeof building.onhand === "undefined") return false;
                let slot = building.onhand.findIndex((i) => i.id === food.id);
                if (slot === -1) return false; // Our target food wasn't found in this building block
                building.onhand.splice(slot, 1);
                return true;
            });
            foodList.splice(foodSlot, 1);
            game.foodCounter += 120 / 4; // 4 is our population... we need to make population accessible from this setInterval location
        }

        game.blocks.forEach((block) => {
            block.update();
            // With this building updated, update the correct tile in gameLocalTiles
            if (typeof block.progressBar !== "undefined") {
                let tile = game.tiles.find((t) => t.buildid === block.id);
                tile.progressBar = (block.progressBar * 60.0) / block.progressBarMax;
                tile.progressBarColor = block.progressBarColor;
            }
        });
        // Now plug in the updated gameLocalTiles into React
        game.updateReact([...game.tiles]);
    }
};