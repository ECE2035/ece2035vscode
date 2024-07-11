# ECE 2035 Class VSCode Extension

The companion extension to GaTech ECE 2035 Programming HW/SW Systems class. Supports RISC-V assembly development.

## Related Repositories

Emulator repository: [Here](https://github.gatech.edu/ECEInnovation/RISC-V-Emulator)

Example assignment repository: [Here](https://github.gatech.edu/ECEInnovation/2035-Emulator-CPP-Base)

## Getting Started

This guide assumes you are looking to develop the extension or test a development preview of the extension.

Clone the repository and download/install Node.js on your computer. You can download that from [here](https://nodejs.org/en). Once Node.js is installed, navigate to the `ece2035` directory inside the repository from your terminal. Run the line `npm install` to download the dependencies and prepare for building the extension. Once npm has finished installing dependency packages, open the directory `ece2035` from VSCode. If successful, the Run/Debug panel on the left should have a green arrow to launch the extension at the top of the screen. Click this button to build and run a version of VSCode with the development extension enabled. To test the extension, you can make/open a .asm file, or open the example project folder `exampleProject` in the subdirectory `ece2035\assets\` .

**IMPORTANT:** You *must* have the RISC-V emulator built on your computer, and you must update the path inside the extension's source code prior to launching it. Open the file `ece2035\src\extension.ts` and edit `localEmulatorPath` on line 27 to the absolute path of your RISC-V emulator executable, and edit line 26 to set `useLocalEmulator = true`. Once this is done, you may launch the extension.

## Current Features

Currently, the following features are working:
* Live warnings/errors of RISC-V assembly files