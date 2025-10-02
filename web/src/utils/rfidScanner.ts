// RFID Scanner utility for handling RFID card scanning
export class RFIDScanner {
  private isScanning = false;
  private scanCallback: ((rfid: string) => void) | null = null;
  private scanTimeout: NodeJS.Timeout | null = null;
  private keyBuffer = '';
  private keyTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Listen for keyboard events globally when scanning
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  // Start scanning for RFID cards
  startScanning(callback: (rfid: string) => void, timeout = 10000) {
    if (this.isScanning) {
      this.stopScanning();
    }

    console.log('🔍 RFID Scanner: Starting scan...');
    this.isScanning = true;
    this.scanCallback = callback;
    this.keyBuffer = '';

    // Add global keydown listener
    document.addEventListener('keydown', this.handleKeyPress);
    
    // Set scanning timeout
    this.scanTimeout = setTimeout(() => {
      console.log('⏰ RFID Scanner: Scan timeout');
      this.stopScanning();
    }, timeout);

    return true;
  }

  // Stop scanning
  stopScanning() {
    console.log('🛑 RFID Scanner: Stopping scan');
    this.isScanning = false;
    this.scanCallback = null;
    
    // Clear timeouts
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    
    if (this.keyTimeout) {
      clearTimeout(this.keyTimeout);
      this.keyTimeout = null;
    }

    // Remove global listener
    document.removeEventListener('keydown', this.handleKeyPress);
    this.keyBuffer = '';
  }

  // Handle keyboard input from RFID reader
  private handleKeyPress(event: KeyboardEvent) {
    if (!this.isScanning || !this.scanCallback) return;

    // Prevent default behavior for all keys during scanning
    event.preventDefault();
    event.stopPropagation();

    const key = event.key;

    // RFID readers typically send data ending with Enter
    if (key === 'Enter') {
      if (this.keyBuffer.length > 0) {
        const rfid = this.keyBuffer.trim();
        console.log('📱 RFID Scanner: Card detected:', rfid);
        
        // Call the callback with the scanned RFID
        this.scanCallback(rfid);
        this.stopScanning();
      }
      return;
    }

    // Ignore special keys
    if (key.length > 1 && key !== 'Backspace') {
      return;
    }

    // Handle backspace
    if (key === 'Backspace') {
      this.keyBuffer = this.keyBuffer.slice(0, -1);
      return;
    }

    // Add character to buffer
    this.keyBuffer += key;

    // Reset key timeout - if no key is pressed for 100ms, clear buffer
    if (this.keyTimeout) {
      clearTimeout(this.keyTimeout);
    }
    
    this.keyTimeout = setTimeout(() => {
      // If buffer gets too long without Enter, it might not be RFID
      if (this.keyBuffer.length > 50) {
        console.log('⚠️ RFID Scanner: Buffer too long, clearing');
        this.keyBuffer = '';
      }
    }, 100);
  }

  // Check if currently scanning
  isCurrentlyScanning() {
    return this.isScanning;
  }

  // Get current buffer (for debugging)
  getCurrentBuffer() {
    return this.keyBuffer;
  }
}

// Create a singleton instance
export const rfidScanner = new RFIDScanner();
