<?php
    // Simple modulus test
    $r = 17;
    $s = -17;
    echo(($r%4) .','. ($s%4) .','. ((-$s*4 + $s)%4));
    // Using modulus on negative numbers doesn't behave the same; it treats zero as a center point; in other words, the negative is removed
    // For applying this to a grid, we need to solve this in a different method (see output #3 above)
?>