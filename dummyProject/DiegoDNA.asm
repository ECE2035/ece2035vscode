.data
Search: .alloc 2 # allocate space for Search 
Sequence: .alloc 600 # allocate space for Sequence, Change this value depending on ecall
               
               
.text
Entry: 
               addi a7, x0, 512 # The ecall 512, which initializes the problem
               addi a0, gp, Sequence # Contains the start of the sequence
               addi a1, gp, Search # Contains the sequence we are searching for
               ecall
               
               addi a4, x0, 599
               lw a1, 0(a1) # a1 now has the sequence
               #addi a4, a4, 1372 
               addi a3, x0, 0 # Hold the amount of matches to report
               
               slli a5, a2, 1 # need 2 times pattern length for a trick
               addi a6, x0, 32 # need 32 for a trick
               sub a5, a6, a5 # need 32 - 2 * pattern length for a trick
               
               addi x5, x0, 0 # loop index
               addi x6, x0, 0 # inner loop index
               
Loop: slt x24, x5, a4 #Outerloop logic
               beq x24, x0, Done # If we are done, go to done
               #add a0, x5, a0 
               lw x19, 0(a0) # Load the bottom 8 characters
               addi a0, a0, 4
               lw x20, 0(a0) # Load the top 8 characters
               slli x20, x20, 16
               or x19, x19, x20 # Combine the top and bottom 8 characters
               
InnerLoop: slti x24, x6, 8 #Innerloop logic
               beq x24, x0, InnerEndBreak 
               xor x21, a1, x19 # XOR the search pattern with the sequence
               sll x21, x21, a5 # shift so we only have the actual pattern length of letters
               beq x21, x0, InnerMatch # If the XOR is 0, we have a match
MatchBack: addi x6, x6, 1 # Increment the inner loop index
               srli x19, x19, 2 #iff not a match on current iteration, then shift the 8 characters by 1
               jal x22, InnerLoop # this should be equivalent to a jump it got mad again
               
InnerMatch: addi a3, a3, 1 # Increment the amount of matches
               addi a7, x0, 552 # The ecall 552, which highlights a location
               addi a6, x5, 0
               slli a6, a6, 3
               add a6, a6, x6 # Gets the index of the match and use ecall to highlight it
               ecall
               jal x22, MatchBack # this should be equivalent to a jump
               
               
InnerEndBreak: addi x5, x5, 1
               addi x6, x0, 0 # Reset the inner loop index
               jal x22, Loop # this should be equivalent to a jump
               
Done: addi a7, x0, 513 # The ecall 513, which verifies the solution     
               ecall
               jalr ra, ra, 0 # Return to OS
               
               
               