import { describe, it, expect } from 'vitest';
import { getCurrentTimestamp, isValidServerId, sanitizeToId } from '../scripts/utils.js';

describe('Utils', () => {
  describe('getCurrentTimestamp', () => {
    it('should return a unix timestamp', () => {
      const timestamp = getCurrentTimestamp();
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
      // Should be within the last second
      expect(Math.abs(Date.now() / 1000 - timestamp)).toBeLessThan(1);
    });
  });

  describe('isValidServerId', () => {
    it('should accept valid server IDs', () => {
      expect(isValidServerId('filesystem')).toBe(true);
      expect(isValidServerId('brave_search')).toBe(true);
      expect(isValidServerId('my_server_123')).toBe(true);
      expect(isValidServerId('ABC123')).toBe(true);
    });

    it('should reject invalid server IDs', () => {
      expect(isValidServerId('fs')).toBe(false); // too short
      expect(isValidServerId('file-system')).toBe(false); // contains dash
      expect(isValidServerId('file system')).toBe(false); // contains space
      expect(isValidServerId('file@system')).toBe(false); // contains special char
      expect(isValidServerId('file.system')).toBe(false); // contains dot
      expect(isValidServerId('')).toBe(false); // empty
    });
  });

  describe('sanitizeToId', () => {
    it('should convert names to valid IDs', () => {
      expect(sanitizeToId('File System')).toBe('File_System');
      expect(sanitizeToId('brave-search')).toBe('brave_search');
      expect(sanitizeToId('My Cool Server!')).toBe('My_Cool_Server');
      expect(sanitizeToId('test@example.com')).toBe('testexamplecom');
    });

    it('should handle edge cases', () => {
      expect(sanitizeToId('___test___')).toBe('test');
      expect(sanitizeToId('   spaced   ')).toBe('spaced');
      expect(sanitizeToId('multiple   spaces')).toBe('multiple_spaces');
      expect(sanitizeToId('multiple___underscores')).toBe('multiple_underscores');
    });

    it('should preserve valid characters', () => {
      expect(sanitizeToId('valid_id_123')).toBe('valid_id_123');
      expect(sanitizeToId('ABC123')).toBe('ABC123');
    });
  });
});

