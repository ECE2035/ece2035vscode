# the compiler: gcc for C program, define as g++ for C++
CC = C:\\SysGCC\\risc-v\\bin\\riscv64-unknown-elf-g++.exe

# compiler flags:
#  -g    adds debugging information to the executable file
#  -Wall turns on most, but not all, compiler warnings
CFLAGS  = -g -march=rv32im -mabi=ilp32
BUILD_AUTOGARDER_CFLAGS = -DAVOID_DISPLAY
STUDENT_ASSIGNMENT_CFLAGS = -DSTUDENT_ASSIGNMENT

# the build target executable:
TARGET = EmulatorCPPBase

SOURCES = $(wildcard *.cpp)
SOURCES += $(wildcard riscvemulator/*.cpp)

all: $(TARGET)

$(TARGET): main.cpp

build_autograder: $(TARGET)
	$(CC) $(CFLAGS) $(BUILD_AUTOGARDER_CFLAGS) -o $(TARGET).elf $(SOURCES)

c_autograder:
	$(info ${SOURCES})

student_assignment: $(TARGET)
	$(CC) $(CFLAGS) $(STUDENT_ASSIGNMENT_CFLAGS) -o $(TARGET).elf $(SOURCES)

clean:
	$(RM) $(TARGET).elf