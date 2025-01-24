#include "riscvemulator/riscvemulator.h"
#include <stdio.h>
#include <stdlib.h>


#ifdef C_AUTOGRADER

uint32_t c_squares[9];

#endif
int sequenceCount = 0; //Global Variable that keeps track of how many times the sequence appears in the DNA
int sequenceTracker = -2; //Global Variable that keeps track of if the sequence has been generated yet
VirtualDisplay* display = new VirtualDisplay(640, 640);
/*
* handleGenDNAWord is a version of the assignment where each letter is in it's own 32 bit word.
*/
void handleGenDNAWord(Registers* registers, uint32_t* dstOpt){
    // register a0 contains the pointer to the block of DNA
    uint32_t* ptr;
    
    if (!dstOpt) {
        ptr = (uint32_t*)registers->a0;
    } else {
        ptr = dstOpt;
    }

    //generate random DNA sequence
    for (int i = 0; i < 4800; i++){
        ptr[i] = rand() % 4;
    }

    //generate a random 3-7 length sequence to find
    uint32_t* sequence = (uint32_t*)registers->a1;
    int sequenceLength = (rand() % 5) + 3;
    //from the length, generate a random sequence to find
    for(int i = 0; i < sequenceLength; i++){
        sequence[i] = rand() % 4;
    }

    //draw the DNA sequence
    for (int i = 0; i < 4800; i++){
        display->setTextLocation((i % 64)*8, (i / 64)*8);
        if(ptr[i] == 0){
            display->drawTextOver("A", 0x000000FF);
        }
        else if(ptr[i] == 1){
            display->drawTextOver("C", 0x00FFFF00);
        }
        else if(ptr[i] == 2){
            display->drawTextOver("G", 0x0000FF00);
        }
        else if(ptr[i] == 3){
            display->drawTextOver("T", 0x0000FFFF);
        }
        else{
            //error case, draw an 'X' 
            display->drawTextOver("X", 0x00FFFFFF);
        }
    }

    //draw the sequence to find at the bottom of the screen
    //display->setTextLocation(256, 280);
    for(int i = 0; i < sequenceLength; i++){
        display->setTextLocation(312 + (i * 8), 520);
        if(sequence[i] == 0){
            display->drawTextOver("A", 0x000000FF);
        }
        else if(sequence[i] == 1){
            display->drawTextOver("C", 0x00FFFF00);
        }
        else if(sequence[i] == 2){
            display->drawTextOver("G", 0x0000FF00);
        }
        else if(sequence[i] == 3){
            display->drawTextOver("T", 0x0000FFFF);
        }
        else{
            //error case, draw an 'X' 
            display->drawTextOver("X", 0x00FFFFFF);
        }
    }

    //find how many times the sequence appears in the DNA
    for(int i = 0; i < 4800 - sequenceLength; i++){
        bool match = true;
        for(int j = 0; j < sequenceLength; j++){
            if(ptr[i + j] != sequence[j]){
                match = false;
                break;
            }
        }
        if(match){
            sequenceCount++;
        }
    }
}

/*
*  handleGenDNA is a version of the assignment where each letter is in 2 bits of a 32 bit word, where the top 16 bits are 0.
*  The first letter in a word is in the lower 2 bits, then the next letter is in the next 2 bits, etc.
*  It will display the DNA sequence and the sequence to find on the screen. The DNA sequence is 4800 nucleotides long, and the sequence to find is 3-7 nucleotides long.
*  The DNA sequence is represented as a 80 * 60, with 80 columns and 60 rows. The sequence to find is represented as a horizontal line at the bottom of the screen.
*/
void handleGenDNA(Registers* registers, uint32_t* dstOpt) {
    sequenceTracker = 1; //so we can ecall 513 without getting yelled at
    //printf("hello\n");
    // register a0 contains the pointer to the block of DNA
    uint32_t* ptr;
    
    if (!dstOpt) {
        ptr = (uint32_t*)registers->a0;
    } else {
        ptr = dstOpt;
    }

   
    //generate random DNA sequence, but each array entry should have 4 values, so the first value goes at the lower 8 bits, the second at the next 8 bits, etc.
    for (int i = 0; i < 600; i++){
        //ptr[i] = 0x00000000;
        for(int j = 0; j < 8; j++){
            ptr[i] |= (rand() % 4) << (j * 2);
        }
    }

    //generate a random 3-7 length sequence to find
    uint32_t* sequence = (uint32_t*)registers->a1;
    int sequenceLength = (rand() % 5) + 3;
    //sequenceLength = 7; //for testing
    registers->a2 = sequenceLength;
    printf("Sequence Length: %d\n", sequenceLength);
    //generate random DNA sequence, but each array entry should have 4 values, so the first value goes at the lower 8 bits, the second at the next 8 bits, etc. 
    //However, the sequence may not be a multiple of 4, so any leftover space should be a 0.
    int j = 0;
    while(j < sequenceLength){
        sequence[0] |= (rand() % 4) << (j * 2); //rand 1 for testing, rand 4 for actual
        j++;
    }

    int merged = 0;
    //count how many times the sequence appears in the DNA
    for(int i = 0; i < 600; i++){ //was minus sequence length, caused a bug whoops
        if(i == 599){
            merged = ptr[599]; //check the last 8 characters
            
        }
        else{
            merged = (ptr[i+1] << 16) | ptr[i];
        }
        for(int k = 0; k < 8; k++){
            if(i == 599 && k == 8 - sequenceLength + 1){
                break;
            }
            bool match = true;
            for(int j = 0; j < sequenceLength; j++){
                if((((merged >> (k*2)) >> (j * 2)) & 0x3) != ((sequence[0] >> (j * 2)) & 0x3)){
                    match = false;
                    break;
                }   
            }
            if(match){
                sequenceCount++;
                //draw a pixel at the location of the sequence
                printf("Match at i:%d j:%d k:%d\n", i, j, k ); //another debugging statement
                //display->setTextLocation((k+(i*8 % 80))*8, ((i*8 / 80))*8); //remove when not debugging
                //display->drawTextOver("X", 0x00FFFFFF);
            }
        }     
        
        merged = 0;
    }

    //turn sequenceCount into a string variable
    char sequenceCountString[10];
    sprintf(sequenceCountString, "%d", sequenceCount);
   
    //draw the DNA sequence, each int in ptr has 4 values, so we need to extract each value and draw it
    
    for (int i = 0; i < 600; i++){    
        for(int j = 0; j < 8; j++){
            display->setTextLocation((j+(i*8 % 80))*8, ((i*8 / 80))*8);
            if(((ptr[i] >> (j * 2)) & 0x3)== 0){ //use bitmask to extract the value
                display->drawTextOver("A", 0x000000FF);
            }
            else if(((ptr[i] >> (j * 2)) & 0x3) == 1){
                display->drawTextOver("C", 0x00FFFF00);
            }
            else if(((ptr[i] >> (j * 2)) & 0x3)== 2){
                display->drawTextOver("G", 0x0000FF00);
            }
            else if(((ptr[i] >> (j * 2)) & 0x3)== 3){
                display->drawTextOver("T", 0x0000FFFF);
            }
            else{
                //don't draw anything

            }
        }
    }

    //draw the sequence to find at the bottom of the screen, each int in ptr has 4 values, so we need to extract each value and draw it
    //display->setTextLocation(256, 280);
    j = 0;
    while(j < sequenceLength){
        display->setTextLocation(312 + (j * 8), 500);
        if(((sequence[0] >> (j * 2)) & 0x3) == 0){
            display->drawTextOver("A", 0x000000FF);
        }
        else if(((sequence[0] >> (j * 2)) & 0x3) == 1){
            display->drawTextOver("C", 0x00FFFF00);
        }
        else if(((sequence[0] >> (j * 2)) & 0x3) == 2){
            display->drawTextOver("G", 0x0000FF00);
        }
        else if(((sequence[0] >> (j * 2)) & 0x3) == 3){
            display->drawTextOver("T", 0x0000FFFF);
        }
        else{
            //just in case
            break;
        }
        j++;
    }

    display->setTextLocation(320, 550);
    display->drawTextOver(sequenceCountString, 0x00FFFFFF);
    // AVOID_DISPLAY will be provided by the makefile or autograder.
    // it is provided when running student's c code or when running the autograder for assembly.
    #ifndef AVOID_DISPLAY
    //displayPuzzle(ptr, solution);
    #endif
}
/*
* Highlight the letter by drawing a white box around it at the index passed in the register
*/
void highlightLetter(Registers* registers){
    // register a6 contains the pointer to index of the letter to be highlighted
    int index = registers->a6;

    //highlight the letter at the index passed in the register 
    for(int i = 0; i < 7; i++){
        display->setPixel((index % 80)*8 + i, (index / 80)*8 + 7, 0x00FFFFFF);
    }
    for(int i = 0; i < 7; i++){
        display->setPixel((index % 80)*8 + 7, (index / 80)*8 + i, 0x00FFFFFF);
    }
    for(int i = 0; i < 7; i++){
        display->setPixel((index % 80)*8 + i, (index / 80)*8, 0x00FFFFFF); //some of these lines were AI generated.
    }
    for(int i = 0; i < 7; i++){
        display->setPixel((index % 80)*8, (index / 80)*8 + i, 0x00FFFFFF);
    }
    


    
}
/*
* verifySolutionDNA is a function that checks if the solution is correct. It will print out if the solution is correct or not, and if it is not correct, 
* it will print out the correct solution. It also has checks to ensure the students don't call it before the solution is generated, or call it more than once.
*/
void verifySolutionDNA(Registers* registers) {
    if (sequenceTracker == -2) {
        // solution not generated yet
        printf("Error: ECALL 513 called before ECALL 512.\n");
        return;
    } else if (sequenceTracker == 10) {
        printf("Error: ECALL 513 called more than once.\n");
        return;
    }

    // the solution is stored in register a3
    uint32_t proposedMatches = registers->a3;

    bool match = proposedMatches == sequenceCount;
    set_solution_validity(match);
    if (match) {
        printf("Correct!\n");
    } else {
        printf("Incorrect. Guessed %d, correct is %d\n", proposedMatches, sequenceCount);
    }

    sequenceTracker = 10; //to ensure we are not called again
}

void printfEcallHandler(Registers* registers) {
    printf((const char*) registers->a1, registers->a0);
}

/*
* ecall_handler is a function that handles the ecall instructions. It will call the appropriate function based on the value in register a7.
*/
void ecall_handler(Registers* registers) {
    if (registers->a7 == 1234) {
        printfEcallHandler(registers);
    }
	else if(registers->a7 == 512){
		handleGenDNA(registers, nullptr); //Generate the puzzle and solution
	}
    else if(registers->a7 == 612){
        handleGenDNAWord(registers, nullptr); //Generate the puzzle and solution for the word version
    }
    else if(registers->a7 == 513){
         verifySolutionDNA(registers); //Verify the solution
    }
    else if(registers->a7 == 613){
         verifySolutionDNA(registers); //for now, the word and regular share the same solution checker
    }
    else if (registers->a7 == 552){
        highlightLetter(registers); //highlight the letter at the index passed in the register
    }
    else {
        printf("Error: ECALL %d not implemented.\n", registers->a7);
    }
}

#ifndef C_AUTOGRADER
int main()
{
    set_random_seed();
    set_ecall_handler(ecall_handler);
    return 0;
}
#else
// C autograder functions to interface with the student's c code without giving any information about autograding implementation

extern "C" int autograder_generate_reference(char* seed) {
    // convert the seed to an integer
    int s = 0;
    for (int i = 0; 8 > i && seed[i] != 0; i++) {
        s <<= 4;
        s |= seed[i];
    }

    srand(s);

    // generate the reference square
    Registers fakeRegs;
    handleGenPuzzle(&fakeRegs, c_squares);

    return (int)c_squares[0];
}

extern "C" int autograder_generate_candidates(int* candidates) {
    for (int i = 0; 8 > i; i++) {
        candidates[i] = c_squares[i + 1];
    }

    return 8;
}

extern "C" void autograder_report_answer(int position) {
    Registers fakeRegs;
    fakeRegs.a1 = position * 4;
    verifySolution(&fakeRegs);
}

#endif