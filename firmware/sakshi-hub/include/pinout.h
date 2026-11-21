#pragma once

// Sakshi Hub ESP32-C3 Hardware Bus & Pinout Definition
#define PIN_I2C_SDA        8   // Shared bus: ATECC608B (0x60), SHT40 (0x44), RV-3028 (0x52)
#define PIN_I2C_SCL        9

#define PIN_SPI_MOSI       7   // W25Q128 16 MB SPI NOR Flash (Offline Ring Buffer)
#define PIN_SPI_MISO       2
#define PIN_SPI_SCK        6
#define PIN_FLASH_CS      10

#define PIN_ADC_ETHYLENE   0   // Winsen ME3-C2H4 continuous <1 uA TIA output
#define PIN_ADC_BATTERY    1   // BQ25570 / LTO buffer voltage divider
#define PIN_TAMPER_INT     4   // Enclosure reed/microswitch wakeup interrupt

#define PIN_LTE_TX        21   // Quectel EC200U LTE Cat-1 UART
#define PIN_LTE_RX        20
