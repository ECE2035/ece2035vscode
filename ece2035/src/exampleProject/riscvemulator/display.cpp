#include "display.hpp"
#include <cstdarg>
#include <cstdio>

VirtualDisplay::VirtualDisplay(int width, int height) {
    this->width = width;
    this->height = height;
    volatile int* widthVar = (int*)0x80003008;
    volatile int* heightVar = (int*)0x8000300C;
    *widthVar = width;
    *heightVar = height;
    this->pixels = (uint32_t*)0x80010000;

    this->textX = 0;
    this->textY = 0;
    this->textSize = 1;
    this->textBold = false;
    this->textItalic = false;
    this->textUnderline = false;
}

void VirtualDisplay::setPixel(int x, int y, uint32_t color) {
    if (x < 0 || x >= width || y < 0 || y >= height) {
        return;
    }

    int index = y * width + x;
    pixels[index] = color;
}

// Color MUST be 8 digits and no prefix
void VirtualDisplay::setPixel(int x, int y, const char* color) {
    // convert color from hex code to uint32_t
    uint32_t colorInt = 0;
    for (int i = 0; i < 8; i++) {
        colorInt <<= 4;
        if (color[i] >= '0' && color[i] <= '9') {
            colorInt |= color[i] - '0';
        } else if (color[i] >= 'a' && color[i] <= 'f') {
            colorInt |= color[i] - 'a' + 10;
        } else if (color[i] >= 'A' && color[i] <= 'F') {
            colorInt |= color[i] - 'A' + 10;
        }
    }

    int index = y * width + x;
    pixels[index] = colorInt;
}

void VirtualDisplay::clear(uint32_t color) {
    for (int i = 0; i < width * height; i += 4) {
        pixels[i] = color;
    }
}

uint32_t VirtualDisplay::color(uint8_t r, uint8_t g, uint8_t b) {
    return (uint32_t)r | ((uint32_t)g << 8) | ((uint32_t)b << 16) | ((uint32_t)0xFF << 24);
}

void VirtualDisplay::drawRectangle(int x, int y, int width, int height, uint32_t color) {
    uint32_t* setColorAndDraw = (uint32_t*)0x80002FEC;
    uint32_t* drawParams = (uint32_t*)0x80002FF0;

    // draw params 0 is x, 1 is y, 2 is width, 3 is height
    drawParams[0] = x;
    drawParams[1] = y;
    drawParams[2] = width;
    drawParams[3] = height;
    *setColorAndDraw = color; // set color and draw
}

extern const uint8_t* characters[95];

void VirtualDisplay::drawChar(char c, uint32_t foreground, uint32_t background, bool useBackground) {
    //assumes the position and attributes have already been set

	if (c < 32 || c > 126) {
		return; //any character outside this range does not have a mapping
	}

	int iIndex = c - ' '; //preparing to read the character from the image

    const uint8_t* fontImage = characters[iIndex];

	//starts from lower right corner, right because of how bolding works
	for (int y = 7; 0 <= y; y--) {
		for (int x = 6; 0 <= x; x--) {
			//reading from the font image, the result is grayscale
			unsigned char isOn = 0;
            if (x > 0 && x < 6) {
                isOn = fontImage[y * 5 + (x-1)];
            }

            if (!useBackground && !isOn) {
                continue;
            }

			uint32_t pColor = (this->textUnderline && y == 7) || isOn ? foreground : background;

			//font could have a width/height scalar
			for (int sy = 0; this->textSize > sy; sy++) {
				for (int sx = 0; this->textSize > sx; sx++) {
					int dispX = (this->textX + x * this->textSize) + sx;
					int dispY = (this->textY + y * this->textSize) + sy;

					if (this->textItalic) {
						//slightly offset dispX
						dispX += (8 * this->textSize - y * this->textSize + sy) / 2;
					}

					if (this->textBold && isOn) {
						//must write to both the current pixel and the adjacent one to the right
						setPixel(dispX, dispY, pColor);
						setPixel(dispX + this->textSize, dispY, pColor);
					} else {
						setPixel(dispX, dispY, pColor);
					}
				}
			}
		}
	}

	this->textX += 7 * this->textSize;
}

void VirtualDisplay::setTextLocation(int x, int y) {
    this->textX = x;
    this->textY = y;
}

void VirtualDisplay::setTextSize(int size) {
    this->textSize = size;
}

void VirtualDisplay::setTextFormat(bool bold, bool italic, bool underline) {
    this->textBold = bold;
    this->textItalic = italic;
    this->textUnderline = underline;
}

void VirtualDisplay::drawText(const char* format, uint32_t foreground, uint32_t background, ...) {
    va_list args;
    va_start(args, background);
    char buffer[256];
    vsnprintf(buffer, 256, format, args);
    va_end(args);

    int startX = this->textX;

    for (int i = 0; buffer[i] != '\0'; i++) {
        if (buffer[i] == '\n') {
            this->textY += 8 * this->textSize;
            this->textX = startX;
            continue;
        }
        drawChar(buffer[i], foreground, background, true);
    }
}

void VirtualDisplay::drawTextOver(const char* format, uint32_t color, ...) {
    va_list args;
    va_start(args, color);
    char buffer[256];
    vsnprintf(buffer, 256, format, args);
    va_end(args);

    int startX = this->textX;

    for (int i = 0; buffer[i] != '\0'; i++) {
        if (buffer[i] == '\n') {
            this->textY += 8 * this->textSize;
            this->textX = startX;
            continue;
        }
        drawChar(buffer[i], color, 0, false);
    }
}
