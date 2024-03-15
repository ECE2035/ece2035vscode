# This is a small demo program to get you started.
# It calls the printf 1-argument ecall as defined in the starting assignment code,
# and will print the number 10 to the console.
#
# Click the green play button from VS-Code's debug pane on the left to try it out.

.data
DemoString: .ascii "This is a test %d\n"

.text
Entry: 
           addi a7, x0, 1234 # The ecall 1234
           addi a0, zero, 10
		   addi a1, gp, DemoString
           ecall

           jalr ra, ra, 0

           