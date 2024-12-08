// dancommon.js
// general-purpose functions of usefulness, created by me

export const DanCommon = {
    getRandomFrom(choicelist) {
        // Selects a random item from a list of choices.
        // choicelist - list of objects to select from
        // Example useage: myfood = randomfrom(['apple', 'mushroom', 'berry', 'treenut']); has 1 in 4 chance to return berry
        return choicelist[Math.floor(Math.random() * choicelist.length)];
    },

    multiReplace(workstring, target, replacewith) {
        // Works like string.replace(), but replaces all instances, instead of just one.
        // We need this function to turn output options (which is full item names with spaces) into DOM ids (which cannot contain spaces)
        if (typeof workstring != "string") {
            console.error("multiReplace works with strings. Got " + typeof workstring + ". workstring = " + workstring);
            return "";
        }
        let updated = workstring.replace(target, replacewith);
        while (updated !== workstring) {
            workstring = updated;
            updated = workstring.replace(target, replacewith);
        }
        return updated;
    },

    flatten(multidimlist) {
        // Flattens a 2D array into a 1D array. Useful when combining multiple lists (in a list) into one.
        return [].concat.apply([], multidimlist);
    },

    removeDuplicates(list) {
        // Removes duplicate items within an array.
        return [...new Set(list)];
    },

    manhattanDist(x1, y1, x2, y2) {
        // Returns the Manhattan Distance of two points.
        // The Manhattan distance is the different in X plus the difference in Y; as if you were traveling through city blocks.
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    },

    within(value, target, threshhold) {
        // Returns true if the given value is close to the target value, within the threshhold. Aka 193 is near 200 +/- 10
        if (value < target - threshhold) return false;
        if (value > target + threshhold) return false;
        return true;
    },

    hasAny(searchable, options) {
        // Returns true if any character in the options list is found in the searchable string
        return !options.split("").every((ele) => {
            return searchable.indexOf(ele) === -1;
        });
    },

    arraySplit(elements, callback) {
        // Splits an array into multiple parts, depending on the return value of callback. Think of this as using array.filter, but keeping
        // the fail states as well. This can split an array into more than 2 parts, though.
        // elements - array to split
        // callback - function called for each element of the array. Its return value determines what return object this goes into

        let outputs = {};
        for (let i = 0; i < elements.length; i++) {
            let result = callback(elements[i]);
            if (typeof outputs[result] === "undefined") {
                // This doesn't exist yet. Make it now.
                outputs[result] = [];
            }
            outputs[result].push(elements[i]);
        }
        return outputs;
    },

    doubleIncludes(longList, shortList) {
        // Returns true if any item from one list matches any item in the other list.

        for (let i = 0; i < longList.length; i++) {
            if (shortList.includes(longList[i])) return true;
        }
        return false;
    },

    myModulus(value, divider) {
        // Returns the modulus of the provided value
        // Regular modulus works differently for negative numbers. -5%4 will give you -1. This can throw off scaling when trying to grid things. Instead, we want -5%4 to
        // give us 3.
        // If this receives a positive number, it will perform modulus like normal
        if (value <= 0) {
            return (-value * divider + value) % divider;
        }
        return value % divider;
    },
};
