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