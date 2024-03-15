#ifndef DISPLAY_HPP
#define DISPLAY_HPP

#include <cstdint>

class VirtualDisplay {
    private:
    int width;
    int height;
    uint32_t* pixels;

    int textX;
    int textY;
    int textSize;
    bool textBold;
    bool textItalic;
    bool textUnderline;

    void drawChar(char c, uint32_t foreground, uint32_t background, bool useBackground);

    public:
    VirtualDisplay(int width, int height);

    void setPixel(int x, int y, uint32_t color);
    void setPixel(int x, int y, const char* color); // hex code colors

    void drawRectangle(int x, int y, int width, int height, uint32_t color);
    void setTextLocation(int x, int y); // pixel coordinates of top left of text
    void setTextSize(int size); // size of text, where size 1 corresponds to 8x7 (h x w) pixels, 2 corresponds to 16x14 pixels, etc.
    void setTextFormat(bool bold, bool italic, bool underline); // set text format
    void drawText(const char* format, uint32_t foreground, uint32_t background, ...); // printf style text drawing
    void drawTextOver(const char* format, uint32_t color, ...); // printf style text drawing (without background color)

    // Utility Functions
    uint32_t color(uint8_t r, uint8_t g, uint8_t b);

    void clear(uint32_t color);
};

#endif // DISPLAY_HPP