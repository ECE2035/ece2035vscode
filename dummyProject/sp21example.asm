.data
Reference: .alloc 1 # allocate space for reference pattern
Candidates: .alloc 8 # allocate space for puzzle candidates
DbgString1: .ascii "This is a test %p\n"
            
.text
Entry: 
            addi a7, x0, 582 # The ecall 582
            addi a0, gp, Reference
            ecall
            
            addi a7, x0, 1234
            addi a1, gp, DbgString1
            ecall
            
            # duplicating reference
            lw t6, 0(a0) # loading the reference from memory
            slli t4, t6, 16 # shifting reference by 16 bits
            or t1, t6, t4 # combining original and shifted to yield the duplicated reference
            
            # flipping the reference horizontally
            lui t0, 0x0C0C # loading constant 0xC0C0 into t0
            srli t0, t0, 12
            and t5, t1, t0 # extract first pair and store into the flip result register $4
            srli t1, t1, 4 # shift the normal copy by 2 colors (4 pixels)
            andi t3, t1, 0x0303 # extract second pair and store into the temp register $3
            or t5, t5, t3 # or together the result and the temp
            srli t1, t1, 4 # shift the normal copy by 2 colors
            lui t0, 0xC0C0 # loading constant 0xC0C0 into t0
            srli t0, t0, 12
            and t3, t1, t0 # extract third pair and store into the temp register $3
            or t5, t5, t3 # or together the result and the temp
            srli t1, t1, 4 # shift the normal copy by 2 colors
            lui t0, 0x3030 # loading constant 0x3030 into t0
            srli t0, t0, 12
            and t3, t1, t0 # extract the fourth pair and store into the temp register $3
            or t5, t5, t3 # or together the result and the temp and store in the flipped register
            
            # finding the candidate by looping through candidates until one is found
            addi t3, x0, 28 # initializing the answer pointer
            # decrementing because it is both safer and I have observed that pseudo-randomization
            # favors 28 out of all the possible answers, between 2-4% more often than the others.
            
LoopStart: add t0, gp, t3
            lw t1, Candidates(t0)# loading the candidate
            slli t4, t1, 16 # shifting candidate to prepare for duplication
            or t1, t1, t4 # duplicating the candidate
            
SLStart: srli t1, t1, 4 # rotating the candidate by 90 degrees
            lui t0, 0xFFFF # loading constant 0xFFFF into t0
            srli t0, t0, 12
            and t4, t1, t0 # extract lower 16 bits of the rotated candidate
            beq t4, t6, End # if those lower 16 bits equals the reference, then the candidate was found
            beq t4, t5, End # if those lower 16 bits equals the flipped reference, then the candidate was found
            bne t1, t4, SLStart # if not all 4 rotations have been performed, keep testing rotations
            
            addi t3, t3, -4 # decrementing the answer pointer
            bne t3, x0, LoopStart # candidate was not successful, try the next
            
            # wrapping up
            
End: addi a7, x0, 583 # The ecall 583
            addi a1, t3, 0
            ecall
            jalr ra, ra, 0
            
            