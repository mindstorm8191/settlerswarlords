<?php
    /* weightedRandom.php
    A library by Danny Bartsch
    
    This library provides a means to select items at random, with more accuracy than a simple randomized selection.
    To explain it quickly, imagine a bag of marbles, with a decided number of different types (for example, 50 red, 15 blue, 1 white)
    Each colored marble has a different chance of being pulled, and that chance can be altered based on the number of marbles in the bag
    Marbles can also be removed from the bag (or added to it), altering the chances of every remaining marble

    We can output this as JSON by implementing the jsonserializable interface. More here:
    https://stackoverflow.com/questions/9896254/php-class-instance-to-json
    */

    class WeightedRandom {
        private $marbles; // This is an array of objects, pairing names with a value
        private $count;   // How many marbles total we have here (not the # of types, that is given by sizeof($marbles))
        private $cycleList = null;
        private $cycleCount;

        function __construct($startList) {
            // Creates a new weightedRandom class instance. Pass a list of marbles to start with, as names with amount. For example,
            // [['name'=>'red marble', 'amount'=>99],['name'=>'blue marble', 'amount'=>10]]

            $this->marbles = $startList;
            $this->count = 0;
            for($i=0; $i<sizeof($this->marbles); $i++) {
                $this->count += $this->marbles[$i]['amount'];
            }
        }

        function total() {
            // Returns the total number of marbles
            return $this->count;
        }

        function totalTypes() {
            // Returns the total types of marbles in the bag
            return sizeof($this->marbles);
        }

        function push($name, $amount=1) {
            // Adds a new element to the group. If it matches an existing, group, it is added to that one instead of creating a new group 
            $match = JSFind($this->marbles, function($ele) use ($name) {
                return ($ele['name']==$name);
            });
            if(gettype($match)=="NULL") {
                // Nothing was found. Push this item to as a new type to the end of the list
                array_push($this->marbles, ['name'=>$name, 'amount'=>$amount]);
            }else{
                // With the index, increase the marble count for that marble type
                $this->marbles[$match]['amount'] += $amount;
            }
            $this->count+= $amount;
        }

        function peek() {
            // Picks a random marble at random and returns its type. This does not alter the contents of the bag
            $selected = rand(0, $this->count);
            foreach($this->marbles as $ele) {
                if($ele['amount'] >= $selected) return $ele['name'];
                $selected -= $ele['amount'];
            }
        }

        function pull() {
            // Pick a random marble at random and returns its type, while also removing it from the bag.
            $selected = rand(0, $this->count);
            for($i=0; $i<sizeof($this->marbles); $i++) {
                if($this->marbles[$i]['amount'] < $selected) {
                    $selected -= $this->marbles[$i]['amount'];
                }else{
                    $this->count--;
                    $this->marbles[$i]['amount']--;
                    $grab = $this->marbles[$i]['name'];
                    if($this->marbles[$i]['amount']<=0) {
                        array_splice($this->marbles, $i, 1);
                    }
                    return $grab;
                }
            }
        }

        function cyclepull() {
            // This works like pull(), where items are removed from the bag. However, once all items are removed, pulling
            // again resets the whole bag and pulls from a fresh round. This guarantees a fixed number of each marble will
            // be pulled
            // Note that this isn't very compatible with pull() and peek()

            if(gettype($this->cycleList)=='NULL') {
                $this->cycleList = $this->marbles;
                $this->cycleCount = $this->count;
            }

            $selected = rand(0, $this->cycleCount);
            for($i=0; $i<sizeof($this->cycleList); $i++) {
                if($this->cycleList[$i]['amount'] < $selected) {
                    $selected -= $this->cycleList[$i]['amount'];
                }else{
                    $this->cycleCount--;
                    $this->cycleList[$i]['amount']--;
                    $grab = $this->cycleList[$i]['name'];
                    if($this->cycleList[$i]['amount']<=0) {
                        array_splice($this->cycleList, $i, 1);
                        if(sizeof($this->cycleList)==0) {
                            $this->cycleList = null;
                        }
                    }
                    return $grab;
                }
            }
        }
    }

    //
    // We need to include a few functions from our JSArray library
    //
    if(!function_exists('JSFind')) {
        function JSFind($array, $callable) {
            // Returns the first array element that passes the provided test (from $callable). If none pass the test, null will be returned
            if(sizeof($array)==0) return null;
            foreach($array as $value) {
                if($callable($value)) return $value;
            }
            return null;
        }
    }
?>


