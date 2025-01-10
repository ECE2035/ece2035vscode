#ifndef RISCVEMULATOR_H
#define RISCVEMULATOR_H

// HEADER FILES
#include "display.hpp"

// ENVIRONMENT

typedef struct {
    int32_t a7;
    int32_t a6;
    int32_t a5;
    int32_t a4;
    int32_t a3;
    int32_t a2;
    int32_t a1;
    int32_t a0;
} Registers;

typedef void (*ECALL_HANDLER)(Registers* registers);

/*
 * Sets the handler for the ecall instruction.
 * The argument registers are provided to the handler. The handler can modify the registers and they will be updated in the emulator upon return.
 */
void set_ecall_handler(ECALL_HANDLER handler);

typedef void (*INTERRUPT_HANDLER)(int id, void* data);

void set_interrupt_handler(INTERRUPT_HANDLER handler);

// ASSIGNMENT UTIL

void set_random_seed();

void set_solution_validity(bool valid);

#endif // RISCVEMULATOR_H
