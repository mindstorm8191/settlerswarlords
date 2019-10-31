;;;;;;;;;;;;;
; Simple program to build a map for this game (settlers & warlords)

; Last modified 2017.10.15

Graphics 640,480
SeedRnd MilliSecs()

For i = 0 To 40000
  Select Rand(0,1)
    Case 0: Color 255,0,0
    Case 1: Color 0,0,255
  End Select

  Oval Rand(-8,648), Rand(-8,648), 8, 8, 1
Next

WaitKey()
End
