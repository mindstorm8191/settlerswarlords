/*  DanCarousel.jsx
    A React element to show slides, transitioning between each one after a period of time
    Built for the game Settlers & Warlords
*/

// ToDo List
// 1) Update code to use the new showTime & transitionTime values
// 2) Set default times to 6 seconds per slide and 2 seconds to transition

import React from "react";

export function DanCarousel(props) {
    // Handles displaying a series of pictures in a cyclic manner
    // prop fields - child elements: each individual slide of the carousel to show
    // prop fields - styles: This will be applied to the container element of the slide show. Individual styles can be applied to the
    //      child elements to affect each child
    // prop fields - data:
    //      displayTime - int; how long each slide is displayed for, in milliseconds
    //      transitionTime - int; how long it takes to transition between each slide, in milliseconds
    //      showProgressBar

    //    entries - array of output content to display

    const [tick, setTick] = React.useState(0);
    const [mode, setMode] = React.useState(0);
    const [offset, setOffset] = React.useState(0);
    const [display, setDisplay] = React.useState(typeof props.startFrame === "undefined" ? 0 : props.startFrame);
    let displayTime = typeof props.displayTime === "undefined" ? 5 : props.displayTime;
    let transitionTime = typeof props.transitionTime === "undefined" ? 1 : props.transitionTime;
    let width = typeof props.style.maxWidth === "undefined" ? 500 : props.style.maxWidth;

    const slides = React.Children.toArray(props.children);

    // tick will actually contain the progress needed between sessions... we should probably reset it once it reaches the next 'frame'

    let carouselTimeout;
    let carouselTime;
    let carouselStart;
    let carouselRootTimeout = null;
    let othermode = 0;

    React.useEffect(() => {
        // I was going to set up a setInterval loop, but we should keep this running using requestAnimationFrame()
        if (carouselRootTimeout === null) {
            carouselTime = new Date().valueOf();
            carouselTimeout = setTimeout(function () {
                window.requestAnimationFrame(CarouselTick);
            }, 50);
            carouselStart = new Date().valueOf();
            carouselRootTimeout = setTimeout(CarouselFlip, 5000);
        }
        return ()=> {
            console.log('Carousel unmounted');
            clearTimeout(carouselTimeout);
            clearTimeout(carouselRootTimeout);
            carouselRootTimeout = null;
        }
    }, []);

    function CarouselFlip() {
        setMode((mode) => 1 - mode);
        if (othermode === 0) {
            console.log("Long");
            othermode = 1;
            carouselRootTimeout = setTimeout(CarouselFlip, 1000);
        } else {
            othermode = 0;
            console.log("Short");
            carouselRootTimeout = setTimeout(CarouselFlip, 5000);
            setDisplay((display) => display + 1);
        }
    }

    function CarouselTick() {
        // Do work
        let curTime = new Date().valueOf();
        setTick(Math.floor(curTime - carouselStart));

        // `tick` might be useful to show progress between slides, but won't help us (directly) to transition between them. We still need
        // to use curTime
        let elapsed = (Math.floor(curTime - carouselStart) % 6000) - 5000;
        if (elapsed > 0) {
            // This is the transitioning period
            setOffset((elapsed / 1000.0) * 470);
        } else {
            setOffset(0);
        }

        // Handle time management
        let newTime = new Date().valueOf();
        let diff = newTime - carouselTime;
        carouselTime = newTime;
        // diff is now the amount of time from last frame to this frame.
        diff -= 50;
        if (diff < 0) diff = 0;
        carouselTimeout = setTimeout(function () {
            window.requestAnimationFrame(CarouselTick);
        }, 50 - diff);
    }

    return (
        <div style={{ position: "relative", overflow: "hidden", ...props.style, width: 460, height: 400 }}>
            {slides.map((slide, key) => (
                <div
                    key={key}
                    style={{
                        display: "block",
                        position: "absolute",
                        top: 0,
                        left: (key - (display % slides.length)) * 470 - offset,
                        width: 460,
                        backgroundColor: "white",
                    }}
                >
                    {slide}
                </div>
            ))}
        </div>
    );
}