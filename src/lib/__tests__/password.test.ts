import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../password';

describe('Password Module', () => {
  describe('hashPassword', () => {
    it('should return a hash string with iterations:salt:hash format', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const parts = hash.split(':');
      expect(parts).toHaveLength(3);

      // Check iterations (should be 100000)
      expect(parts[0]).toBe('100000');

      // Check salt is 32 hex chars (16 bytes)
      expect(parts[1]).toHaveLength(32);
      expect(parts[1]).toMatch(/^[0-9a-f]+$/);

      // Check hash is 64 hex chars (32 bytes)
      expect(parts[2]).toHaveLength(64);
      expect(parts[2]).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different hashes for the same password due to random salt', async () => {
      const password = 'samePassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);

      // But both should still verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');

      expect(hash).toBeTruthy();
      expect(hash.split(':')).toHaveLength(3);
      expect(await verifyPassword('', hash)).toBe(true);
    });

    it('should handle special characters in password', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';
      const hash = await hashPassword(password);

      expect(hash).toBeTruthy();
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const password = '密码テスト🔐';
      const hash = await hashPassword(password);

      expect(hash).toBeTruthy();
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it('should handle very long passwords', async () => {
      const password = 'a'.repeat(1000);
      const hash = await hashPassword(password);

      expect(hash).toBeTruthy();
      expect(await verifyPassword(password, hash)).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'correctPassword';
      const hash = await hashPassword(password);

      const result = await verifyPassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'correctPassword';
      const hash = await hashPassword(password);

      const result = await verifyPassword('wrongPassword', hash);

      expect(result).toBe(false);
    });

    it('should return false for malformed hash string - missing parts', async () => {
      const result = await verifyPassword('anyPassword', 'invalid:hash');

      expect(result).toBe(false);
    });

    it('should return false for malformed hash string - empty string', async () => {
      const result = await verifyPassword('anyPassword', '');

      expect(result).toBe(false);
    });

    it('should return false for malformed hash string - invalid iterations', async () => {
      const result = await verifyPassword(
        'anyPassword',
        'notanumber:00112233445566778899aabbccddeeff:0011223344556677889900112233445566778899001122334455667788990011'
      );

      expect(result).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const password = 'CaseSensitive';
      const hash = await hashPassword(password);

      expect(await verifyPassword('casesensitive', hash)).toBe(false);
      expect(await verifyPassword('CASESENSITIVE', hash)).toBe(false);
      expect(await verifyPassword('CaseSensitive', hash)).toBe(true);
    });

    it('should handle leading/trailing whitespace in password', async () => {
      const passwordWithSpaces = '  password  ';
      const hash = await hashPassword(passwordWithSpaces);

      // Whitespace is significant
      expect(await verifyPassword('password', hash)).toBe(false);
      expect(await verifyPassword('  password  ', hash)).toBe(true);
    });

    it('should handle different iteration counts in stored hash', async () => {
      // Test with a pre-computed hash with custom iteration count
      // This simulates upgrading/migrating password hashes
      const password = 'testPassword';
      const hash = await hashPassword(password);

      // Extract salt and hash, create new hash with different iterations
      const [, salt, hashPart] = hash.split(':');

      // With wrong iterations, verification should fail
      const fakeHash = `50000:${salt}:${hashPart}`;
      expect(await verifyPassword(password, fakeHash)).toBe(false);
    });
  });

  describe('timing safety', () => {
    it('should have consistent verification time for correct vs incorrect passwords', async () => {
      const password = 'testPassword';
      const hash = await hashPassword(password);

      // Warm up
      await verifyPassword(password, hash);
      await verifyPassword('wrongPassword', hash);

      // Measure correct password verification
      const correctTimes: number[] = [];
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await verifyPassword(password, hash);
        correctTimes.push(performance.now() - start);
      }

      // Measure wrong password verification
      const wrongTimes: number[] = [];
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await verifyPassword('wrongPassword', hash);
        wrongTimes.push(performance.now() - start);
      }

      // Calculate averages
      const avgCorrect = correctTimes.reduce((a, b) => a + b, 0) / correctTimes.length;
      const avgWrong = wrongTimes.reduce((a, b) => a + b, 0) / wrongTimes.length;

      // Times should be similar (within 50% of each other)
      // This is a loose check since timing can vary in test environments
      const ratio = avgCorrect / avgWrong;
      expect(ratio).toBeGreaterThan(0.5);
      expect(ratio).toBeLessThan(2);
    });
  });
});
