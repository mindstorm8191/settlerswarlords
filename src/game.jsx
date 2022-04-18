/*  game.jsx
    Holds the core game object, controlling all functionality of the game operations
    For the game Settlers & Warlords
*/

function LeanTo(tile) {
    // Allows a new building to be created - our first! The lean-to is a crude shelter made from a fallen tree branch and leaves piled
    // on top. It is certainly not a great shelter, but can be made on the fly in the wilderness, and doesn't even require tools

    // Start by checking the land type chosen. Lean-tos can only be created from trees
    if(![5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].includes(parseInt(tile.newlandtype) === -1 ? tile.landtype : tile.newlandtype)) {
        return 'wrong land type';
    }
    // Next, create our object. We need to do this so the object can be modified (with Object Composition) before returning it
    let b = {
        id: game.getNextBlockId(),
        name: 'Lean-To',
        descr: `Before food, even before water, one must find shelter from the elements. It is the first requirement for survival;
                for the elements, at their worst, can defeat you faster than anything else. Consisting of a downed branch with leaves
                on top, this is fast & easy to set up, but wont last long in the elements itself.`,
        usage: `Your workers must set this up. Once built, it will function for a few nights, then have to be rebuilt`,
        image: 'leanto.png', // This is already set with the path to img/structures
        mode:'build',
        progressBar: 0,
        progressBarMax: 1800, // This totals 1.5 minutes. But with 4 workers building it, it'll be done in ~22 seconds
        progressBarColor: 'green'
    }
    return b;
}

export const game = {
    blockList: [], // All functioning buildings
    tiles: [], // All map tiles of the local map
    timerLoop: null, // This gets updated to a timer handle when the game starts
    updateWorkers: null, // This gets assigned to React's setWorkers call
    updateLocalMap: null, // This also gets assigned to a React callback
    workers: [], // List of all workers (with stats)
    tickTime: 0,
    timeout: null, // We keep this handle so that the timeout can be interrupted
    clockCheck: 0,
    lastBlockId: 0,
    getNextBlockId: ()=> {
        // Returns the next available block id (for this map area)
        game.lastBlockId++;
        return game.lastBlockId;
    },

    blockTypes: [
        {name:'Lean-To', image:'leanto.png', create:LeanTo, prereq:[], unlocked:0, newFeatures:[]}
    ],

    setupGame: (localTiles, localWorkers, funcUpdateTiles, funcUpdateWorkers) => {
        // A public function to set up game basics
        // parameters:
        //  localTiles - array of the local tiles, as received by the server
        //  localWorkers - array of the local workers, as received by the server
        //  funcUpdateTiles - callback function from React to update all game tiles
        //  funcUpdateWorkers - callback function from React to udpate all workers

        game.tiles = localTiles;
        game.workers = localWorkers;
        game.updateLocalMap = funcUpdateTiles;
        game.updateWorkers = funcUpdateWorkers;
    },

    startGame: () => {
        // A public function to handle starting the game's timer
        game.tickTime = new Date().valueOf();
        game.timeout = setTimeout(function () {
            window.requestAnimationFrame(game.tick);
        }, 50);
    },

    stopGame: () => {
        // A public function to stop the game
        clearTimeout(game.timeout);
        game.timeout = null;
    },

    tick: () => {
        // Handles updates to the local world. This function should run about once every 50 ticks, or 20 times a second

        // Do work here //
        game.clockCheck++;
        if (game.clockCheck % 20 === 0) console.log("tick...");

        // Handle time management
        let newTime = new Date().valueOf();
        let timeDiff = newTime - game.tickTime;
        game.tickTime = newTime;
        // timeDiff is the amount of time from last frame to this frame. It should be about 50 milliseconds, including the time
        // it took to complete the frame. If the game is running slow, this value will be larger; so we will need to reduce the
        // timeout length to compensate
        timeDiff -= 50;
        if (timeDiff < 0) timeDiff = 0;
        game.timeout = setTimeout(function () {
            window.requestAnimationFrame(game.tick);
        }, 50 - timeDiff);
    },
};