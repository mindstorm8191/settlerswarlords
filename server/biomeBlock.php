<?php
    /*  bomeChunk.php
        Holds the BiomeChunk class, that manages the array extents of its content and adds slots where necessary
        For the game Settlers & Warlords
    */

    require_once("libs/common.php");

    class biomeBlock {
        public $minx = null;
        public $maxx = null;
        public $miny = null;
        public $maxy = null;
        public $tiles = [];
        public $debugging = false;

        //public __construct() {} // We might not need this, if we're not starting with any parameters

        public function set($x,$y,$content) {
            $x = intval($x);
            $y = intval($y);
            if(is_null($this->minx)) {
                $this->minx = $x;
                $this->maxx = $x;
                $this->miny = $y;
                $this->maxy = $y;
            }else{
                if($x<$this->minx) $this->minx = $x;
                if($x>$this->maxx) $this->maxx = $x;
                if($y<$this->miny) $this->miny = $y;
                if($y>$this->maxy) $this->maxy = $y;
            }
            if(gettype($x)!='integer') {
                reporterror('server/biomeChunk.php->biomeBlock->set()', 'Got unexpected X value type of '. gettype($x));
            }
            if(!array_key_exists($x, $this->tiles)) {
                $this->tiles[$x] = [];
            }
            if(!array_key_exists($y, $this->tiles[$x])) {
                $this->tiles[$x][$y] = [];
            }
            $this->tiles[$x][$y] = $content;
        }

        public function append($x, $y, $newParam, $newValue) {
            // For 2D arrays that store associative arrays, sets new values for the given fields

            $x = intval($x);
            $y = intval($y);
            
            // First see if the given index exists
            if(is_null($this->minx)) {
                $this->minx = $x;
                $this->maxx = $x;
                $this->miny = $y;
                $this->maxy = $y;
            }else{
                if($x<$this->minx) $this->minx = $x;
                if($x>$this->maxx) $this->maxx = $x;
                if($y<$this->miny) $this->miny = $y;
                if($y>$this->maxy) $this->maxy = $y;
            }
            if(!array_key_exists($x, $this->tiles)) {
                $this->tiles[$x] = [];
            }
            if(!array_key_exists($y, $this->tiles[$x])) {
                $this->tiles[$x][$y] = [];
            }
            $this->tiles[$x][$y][$newParam] = $newValue;
        }

        public function get($x,$y) {
            $x = intval($x);
            $y = intval($y);
            if($this->debugging==true) {
                reporterror('server/biomeChunk.php->biomeBlock->get()', 'Got '. $x .','. $y);
            }
            if(!array_key_exists($x, $this->tiles)) return null;
            if(!array_key_exists($y, $this->tiles[$x])) return null;
            return $this->tiles[$x][$y];
        }
    }
?>