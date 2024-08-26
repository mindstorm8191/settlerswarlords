<?php
// PHP test
// Determine if negative indexes in arrays show up with sizeof()

$rad = [];
$rad[-9] = 1;
$rad[-2] = 8;
$rad[-1] = 9;
$rad[0] = 77;
$rad[1] = 11;
$blue = [];
echo sizeof($rad) .', '. sizeof($blue);