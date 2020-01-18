<?php
    // jsarray.php
    // A list of functions for managing arrays using callbacks.
    // Javascript has a few more tools to allow developers to manipulate arrays, which php lacks. I found that troubling, so I created these

    function JSSome($array, $callable) {
        // Returns true if any element in the array returns true (from the called function). If the array is empty, this will return false.
        if(sizeof($array)==0) return false; // Aka nothing was found in this array
        foreach($array as $value) {
            if($callable($value)) return true;
        }
        return false;
    }

    function JSEvery($array, $callable) {
        // Returns true if every item in the array passes the test (from $callable)
        if(sizeof($array)==0) return false; // Aka no elements in the array
        foreach($array as $value) {
            if(!$callable($value)) return false;
        }
        return true;
    }

    function JSFind($array, $callable) {
        // Returns the first array element that passes the provided test (from $callable). If none pass the test, null will be returned
        if(sizeof($array)==0) return null;
        foreach($array as $value) {
            if($callable($value)) return $value;
        }
        return null;
    }

    function JSMapWithKeys($array, $callable) {
        // Returns an array that has been modified by the $callable function. Note that this provides the keys to the root array as well,
        // which is something PHP's array_map() does not provide.

        if(sizeof($array)==0) return null;
        $build = array();
        foreach($array as $key => $value) {

            $collected = $callable($value, $key);
            $returnedkey = $collected[0];
            $returnedvalue = $collected[1];
            if(!$returnedkey) $returnedkey = $key;  // allow null keys to be provided, whenever the output key matches the input key
            $build[$returnedkey] = $returnedvalue;
            //array_push($build, $callable($value, $key));
        }
        return $build;
    }

    function forrange($start, $end, $step, $callable) {
        // Generates an array based on a range of values
        // $start - low end of range, inclusive
        // $end - high end of range, inclusive. Note that a range from 0 to 1 will give you two results
        // $step - separation of values
        // $callable - function called for the target value. This will receive one parameter, which is the value within the range

        $outp = array();
        for($i=$start; $i<=$end; $i+=$step) {
            $outp[$i] = $callable($i);
        }
        return $outp;
    }

    function getRandomFrom($list) {
        // Accepts an array of elements, and returns one of the items in the array, selected at random.
        // $list - array of items (of any type) to select from. This function assumes element keys are 0 to (n-1)
        return $list[rand(0, sizeof($list))];
    }

    function includesAll($pond, $fish) {
        // Compares two different arrays, and returns true only if all the elements of $fish can be found in $pond
        return JSEvery($fish, function($ele) use ($pond) {
            return in_array($ele, $pond);
        });
    }
?>