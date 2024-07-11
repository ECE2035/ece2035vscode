#include "riscvemulator/riscvemulator.h"
#include <stdio.h>
#include <stdlib.h>

void printfEcallHandler(Registers* registers) {
    // This is an example function that shows how one can use the register values.
    // a1 is used as a char pointer to the format string for printf, and a0 is used as the argument.
    printf((const char*) registers->a1, registers->a0);
}

void ecall_handler(Registers* registers) {
    // This function is called whenever an ecall instruction is executed
    // The registers struct contains the values of the registers at the time of the ecall,
    // and is read/write so you can modify the values of the registers and they will be updated
    // as seen by the assembly code.

    // By convention, the ecall number is stored in register a7.
    if (registers->a7 == 1234) {
        printfEcallHandler(registers);

	// if leave out, test case will have "Still Running" status
	// move this to ecall handler that checks student answer and
	// replace "true" with result of verifying the answer:
	set_solution_validity(true); 
    }
}

#ifndef C_AUTOGRADER
int main()
{
    // Always ensure that the random seed is set before running any code
    set_random_seed();

    // Set the function pointer for the ecall handler, see the example above
    set_ecall_handler(ecall_handler);

    return 0;
}
#endif
