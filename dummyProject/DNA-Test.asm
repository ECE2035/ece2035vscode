.data
Search: .alloc 2 # allocate space for Search 
Sequence: .alloc 4800 # allocate space for Sequence, Change this value depending on ecall
          
          
.text
Entry: 
          #addi a2, x0, 2 
          addi a7, x0, 512 # The ecall 512
          addi a0, gp, Sequence #Contains the start of the sequence
          addi a1, gp, Search #Contains the sequence we are searching for
          ecall
          
          
          #loop over the sequence
          addi a2, x0, 0
          addi a3, x0, 2044
Loop: add a4, a0, a2
          lw a5, 0(a4)
          addi a2, a2, 4
          bne a2, a3, Loop
          addi a7, x0, 552
          addi a6, x0, 20
          ecall
          
          addi a6, x0, 22
          ecall
          
          addi a6, x0, 200
          ecall
          addi a6, x0, 2000
          addi a6, a6, 2000
          ecall
          addi a6, x0, 80
          ecall
          jalr ra, ra, 0
          
          