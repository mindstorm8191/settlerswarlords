<?php
    // jsarray.php
    // A list of functions for managing arrays using callbacks.
    // Javascript has a few more tools to allow developers to manipulate arrays, which php lacks. I found that troubling, so I created these

    function JSFilter($array, $callable) {
        // Returns all elements in an array where the callback function returns true. If no elements return true from the callback, this
        // will return an empty array.
        if(sizeof($array)===0) return [];
        $outs = [];
        for($i=0;$i<sizeof($array);$i++) {
            if($callable($array[$i])) array_push($outs, $array[$i]);
        }
        return $outs;
    }

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

    function JSFindIndex($array, $callable) {
        // Returns the array index of the first element that passes the provided function ($callable). If none passes the test, null
        // will be returned
        // Note: If your source array is only a list of basic data types, just use array_search($target, $array); it's built into php

        // Note that when testing against null (aka result!=null), zero will count as null. To check properly, do gettype($result)!="NULL"
        if(gettype($array)!='array') return null;
        if(sizeof($array)==0) return null;
        for($i=0; $i<sizeof($array); $i++) {
            if($callable($array[$i])) return $i;
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

    function JSNextId($array, $idField) {
        // Returns the next available ID for the array provided
        // $array - what array to get the next ID for. If this is empty, JSNextId will return 1.
        // $idField - name of the field to get the id value from the existing array. For example, if your object has its id named
        //            'databaseid', pass that
        if(gettype($array)!='array') return 1;
        if(sizeof($array)==0) return 1;
        return array_reduce($array, function($last, $item) use ($idField) {
            return max($last, $item[$idField]);
        }, 0)+1;
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

    // We need this function to grab the first existing element of an array, after it has been modified... It exists
    // in future versions of PHP, but not this version. This is needed for the next function
    if (!function_exists('array_key_first')) {
        function array_key_first(array $arr) {
            foreach($arr as $key => $unused) {
                return $key;
            }
            return NULL;
        }
    }

    function splitArray($arr, $fieldName) {
        // Splits an array into multiple parts, each part containing the matching value in fieldname

        $out = [];
        while(sizeof($arr)>0) {
            if($arr==null) {
                reporterror('server/jsarray.php->splitArray()', 'working array found to be null');
                return $out;
            }
            $lastSize=sizeof($arr);

            // Note: trying to select the element at slot 0 of this array doesn't work on the second pass. Even with 
            // array_filter, the keys of the array don't change.
            //$value = $arr[array_key_first($arr)][$fieldName];
            $value = $arr[0][$fieldName];

            // Step one: push a list of matching objects to the output array. We use array_values to reset the keys of the
            // array that array_filter outputs - it will use the old keys if we don't
            array_push($out, array_values(array_filter($arr, function($ele) use ($fieldName, $value) {
                return $ele[$fieldName] == $value;
            })));
            // Step two: filter OUT the items that matched the previous filter. Note that we must also reset the array keys
            // here too
            $arr = array_values(array_filter($arr, function($ele) use ($fieldName, $value) {
                return $ele[$fieldName] != $value;
            }));

            if(sizeof($arr)==$lastSize) {
                reporterror('server/jsarray.php->splitArray()', 'size did not change. Comparing '. $fieldName .' for value '. $value );
                return $out;
            }
        }
        return $out;

        /* This is the equivalent in Javascript!
        let out = [];
        while(arr.length>0) {
            let value = arr[0][fieldname];
            out.push(arr.filter(ele => ele[fieldname]===value));
            arr = arr.filter(ele => ele[fieldname]!==value));
        }
        return out;
        */
    }

    function JSFilterSplit($target, $callback) {
        // This functions a lot like filter_array, but will return the values that failed the test in a separate array
        $pass = [];
        $fail = [];
        foreach($target as $ele) {
            if($callback($ele)) {
                array_push($pass, $ele);
            }else{
                array_push($fail, $ele);
            }
        }
        return [$pass, $fail];
    }

    function JSFilterSplitBy($large, $small, $callback) {
        // Splits the array into two parts. The first has all the elements where $callback returns true, the other where
        // $callback returns false.
        $pass = [];
        $fail = [];
        foreach($large as $ele) {
            if(JSSome($small, function($item) use ($ele, $callback) {
                return $callback($item, $ele);
            })) {
                array_push($pass, $ele);
            }else{
                array_push($fail, $ele);
            }
        }
        return [$pass, $fail];
    }

    function compareObjects($base, $updated) {
        // Compares to arrays of objects to determine which fields are different.
        // While PHP has array_diff(), this compares the keys of an array, not their values
        // Returns a new array of objects, containing only the new fields

        $output = [];
        foreach($base as $key => $value) {
            // Find the matching key in the 'new' array
            if(isset($updated[$key])) {
                if($value!=$updated[$key]) {
                    $output[$key] = $value;
                }
                unset($updated[$key]);
            }
        }
        // We also want to include any remaining elements not listed in $base.
        // Since we were removing found elements from $updated, we can just merge them.
        return array_merge($output, $updated);
    }
?>