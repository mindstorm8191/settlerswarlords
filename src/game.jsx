/*  game.jsx
    Holds the core game object, controlling all functionality of game operations
    For the game Settlers & Warlords
*/

export const game = {
    runState: 0, // This gets set to 1 when the game is running
    tickTime: 0, // holds the last tick time
    timeout: null, // Holds the object received from setTimeout(), which is called in game.start()
    scrollXFunc: null, // Handle to the function that manages scrolling
    scrollX: 0,
    playerDirections: {
        up:0,down:0,left:0,right:0
    },
    playerUpdateFunc: null,
    playerPos: [],
    userName: '',
    workers: [],

    setup: (playerFunc, location, userName, workers) => {
        // Handles setting up various fields for the player's location to be updated
        game.playerUpdateFunc = playerFunc;
        game.playerPos = location;
        game.userName = userName;
//        game.workers = workers; // We will probably add more complexity to this, but for now we can at least have the workers
        game.workers = workers.map(w => {
            w.spot = JSON.parse(w.spot);
            return w;
        });
        console.log('Set workers:', game.workers);
    },

    start: ()=>{
        // A public function to get the game started, making the game ticks happen at regular intervals
        game.tickTime = new Date().valueOf();
        game.runState = 1;
        game.timeout = setTimeout(function() {
            window.requestAnimationFrame(game.tick);
        }, 50);
    },

    tick: () => {
        // Handles updating the world. This should run about once every 50 ticks, or 20 times a second

        if(game.runState===0) return; // Break the continuous cycle if the game should stop

        //Manage player movement
        if(game.playerDirections.up===1 && game.playerDirections.down!==1) game.playerPos[2]-=0.1; // move player up
        if(game.playerDirections.down===1 && game.playerDirections.up!==1) game.playerPos[2]+=0.1; // move player down
        if(game.playerDirections.left===1 && game.playerDirections.right!==1) game.playerPos[0]-=0.1; // move player left
        if(game.playerDirections.right===1 && game.playerDirections.left!==1) game.playerPos[0]+=0.1; // move player right
        if(game.playerUpdateFunc) game.playerUpdateFunc({name: game.userName, x:game.playerPos[0], y:game.playerPos[1], z:game.playerPos[2]});


        // Handle time management
        let newTime = new Date().valueOf();
        let timeDiff = newTime - game.tickTime;
        game.tickTime = newTime;
        // timeDiff is the amount of time from last frame to this frame. It should be about 50 milliseconds, including the time it took to
        // complete the frame. If the game is running slow, this will be larger; so we will need to reduce the timeout length to compensate
        timeDiff -= 50;
        if(timeDiff<0) timeDiff = 0;
        game.timeout = setTimeout(function() {
            window.requestAnimationFrame(game.tick);
        }, 50 - timeDiff);
    }
};