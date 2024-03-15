#include <stdio.h>

#ifndef C_AUTOGRADER

extern "C" int _write(int file, char* ptr, int len)
{
    if (file != 1 && file != 2) {
        return -1;
    }

    volatile char* stdoutBuffer = (char*)0x80003004;
    for (int i = 0; i < len; i++) {
        *stdoutBuffer = *ptr;
        ptr++;
    }
    return len;
}

extern "C" int _fstat(int fd, struct stat *st) {
  (void) fd, (void) st;
  return -1;
}

void* heapPtr = (void*)0x10000000;
extern "C" void* _sbrk(int incr) {
    void* prevHeapPtr = heapPtr;

    // limit the heap pointer to 0x20000000, which is 256MB
    if ((int)heapPtr + incr > 0x20000000) {
        return (void*)-1;
    }

    heapPtr = (void*)((int)heapPtr + incr);
    return prevHeapPtr;
}

extern "C" int _close(int fd) {
  (void) fd;
  return -1;
}

extern "C" int _isatty(int fd) {
  (void) fd;
  return 1;
}

extern "C" int _read(int fd, char *ptr, int len) {
  (void) fd, (void) ptr, (void) len;
  return -1;
}

extern "C" int _lseek(int fd, int ptr, int dir) {
  (void) fd, (void) ptr, (void) dir;
  return 0;
}

extern "C" void * _mmap (void *address, size_t length, int protect, int flags, int filedes, size_t offset) {
    return 0;
}

#endif
