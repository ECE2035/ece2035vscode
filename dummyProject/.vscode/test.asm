.data
TestMem: .alloc 1

.text
Start:          addi    $3, $0, 27
                sll     $3, $3, 2
                addiu   $5, $31, 0
                jal     SubFunc
                addiu   $31, $5, 0
                jr      $31

SubFunc:        addi    $4, $0, 0xFFFF
                addi    $7, $0, 2
                div     $4, $8
                ori     $4, $4, 0x7
                jr      $31