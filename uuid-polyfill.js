// Simple polyfill for UUID v4 functionality
// This avoids the need for the uuid package

// Main UUID v4 implementation
function v4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { v4 };
}

// For ES modules
export { v4 };
export default { v4 }; 