#include "riscvemulator.h"
#include <stdlib.h>
#include <cstdio>

void set_random_seed() {
    uint32_t* seedSrc = (uint32_t*)0x80003014;
    uint32_t seed = *seedSrc;
    srand(seed);
}

void set_solution_validity(bool valid) {
    #ifndef C_AUTOGRADER
    uint32_t* validDst = (uint32_t*)0x80003018;
    if (valid) {
        *validDst = 0x2; // valid
    } else {
        *validDst = 0x1; // invalid, 0 means never validated
    }
    #else
    // C_AUTOGRADER_KEY is the key that is populated at compile time by the autograder to
    // prevent students from falsely claiming their code is correct.
    printf("%d student correctness: %d\n", C_AUTOGRADER_KEY, valid ? 1 : 0);
    #endif
}