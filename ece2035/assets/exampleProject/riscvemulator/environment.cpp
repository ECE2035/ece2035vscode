#include "riscvemulator.h"

void set_ecall_handler(ECALL_HANDLER handler) {
    volatile ECALL_HANDLER* ecall_handler_entry = (ECALL_HANDLER*)0x80003000;
    *ecall_handler_entry = handler;
}

void set_interrupt_handler(INTERRUPT_HANDLER handler) {
    volatile INTERRUPT_HANDLER* interrupt_handler_entry = (INTERRUPT_HANDLER*)0x80003010;
    *interrupt_handler_entry = handler;
}
