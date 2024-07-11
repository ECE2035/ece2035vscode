# Emulator Base C++ Project

Clone this repository for an example assignment for students. The example is based on Spring 2021's Project 1. A working solution is in the file `sp21example.asm`.

## Introduction

For the RISC-V emulator, it can run C++ code as an "operating system" of sorts. The emulator invokes the C++ code before emulation of the student's assembly begins to allow the "OS" to initialize itself and register all appropriate actions with the emulator. This C++ code is distributed with assignments and is loaded into the emulator at run time. The emulator's RISC-V virtual machine runs the compiled C++ code, so the memory map for the student's assembly and the OS C++ code is the same. Protections have been put in place to avoid abuse of this. The emulator is fast enough to run fairly complex programs - on a high performance computer, it will emulate with a clock frequency of 20MHz.

Even though the C++ code runs natively on the RISC-V emulator, it supports all major C++ functions including `printf` and dynamic memory allocation with the `new` keywords and via `malloc`. There is plenty of memory (256MB heap memory), but do note that as with any C++ project, memory usage should be minimal.

## Creating Assignments

### Getting the toolchain

To begin with, clone this repository, everything you need is self-contained here. Alternatively, in VS Code, type cntl-shift-P and type into the dialog box: "Create New RISCV Assignment". This prompts you to create/select a destination folder and then auto-populates it with a framework of files needed to create an assignment. 

A makefile has been provided for you, and to obtain the toolchain, please [Visit the GNU website](https://gnutoolchains.com/risc-v/). This website will give you an installer to download, and go ahead and run the installer and complete the installation. When this is complete, update the makefile with the compiler location. If you already have make on your system path, you can run it as a command (make student_assignment), otherwise run `C:\SysGCC\risc-v\bin\make.exe student_assignment` from the project root directory to build the ELF file. By default, the ELF file will be named `EmulatorCPPBase.elf`. ELF, Extensible and Linkable Format, files are compiled outputs with binary executable code. They are self-contained and portable. Thus, in practice all you need to do is include the ELF file in the student distributable folder with the assignment shell code to run in the emulator.

### Interfacing with the emulator

The assembly code interfaces with the OS via ECALL instructions. When the OS is initializing, it registers its ECALL handler with `set_ecall_handler`. The ECALL handler has access to registers a0 - a7 provided via a struct pointer. This interface is read/writable and is the only means of accessing registers from the assembly code (since the C++ compiler may use whichever registers it so pleases). By convention, ECALL commands should be identified by the a7 register's value, with all others reserved for arguments. Arguments can include simple values to pointers to memory.

The OS is initialized in its `main` function. This is a required function and the compiler will fail to compile without it. `main` will be allowed to run in its entirety before the assembly code is invoked by the emulator. All memory, including heap memory, will remain valid until the end of the student's assembly code. This can be used for global data that persists across ECALL requests.

### Assignment management

Ultimately, students need to be graded and the emulator has a mechanism for the OS code to report solution validity back to the hypervisor. Call the function `set_solution_validity` to have the emulator store the validity result in a protected variable that is safe from students from trying to hack the emulator. Do note, however, that this function may be called multiple times from the OS code and as such, it is your responsibility to make sure ECALL requests are locked down and safe from exploit.

Also, randomization is a key part of good assignments, since the OS has no natural sources of randomization inside the emulator, and artifical seed source has been created and can be easily applied. Call the `set_random_seed` function as the first line in your main function to ensure that all randomization is using a new seed each run. Note, however, that the hypervisor reserves the right to fix the random seed should the user request running a specific sample again. In this case, the assignment should be the exact same scenario. This should be the case without any additional work from you.

### Peripherals - Display

The emulator features a virtual display. The display can be whatever size you so please, as long as it is less than 2,000,000 pixels in area (~1400 px square). Do note, however, that it is recommended to stay below 800x800 pixels because this is the minimum size most users should be able to display on their computers without a problem. Refer to `riscvemulator/display.hpp` for API.

### Peripherals - Console

The emulator pipes STDOUT to a virtual console. While developing assignments, this console is available on the same page you access the display on. In "production", this will be the VS code debug console. You may be free to use the console for whatever purpose you want, including printing information that students can use while interacting with the assignment (for example: "Correct!"). To print to the console, just use `printf` as you are used to. The console is the recommended way of debugging new assignments.

## Running in the emulator

Please see the [emulator's repository](https://github.gatech.edu/ECEInnovation/RISC-V-Emulator) for usage instructions.