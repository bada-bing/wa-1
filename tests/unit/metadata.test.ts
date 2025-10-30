import { describe, it, expect } from 'vitest';
import { generateSlug, sanitizeSummary } from '../../src/utils/prepareMetadata';

/**
 * Task Metadata Generation Tests
 *
 * These tests document how task metadata (slugs, sanitized summaries) are generated
 * from issue keys and summaries. The functions are used throughout the application
 * for creating branch names, file names, and URLs.
 */

describe('Task Metadata Generation', () => {
  describe('generateSlug - creates URL-friendly identifiers for tasks', () => {
    it('combines issue key and summary: "PROJ-123" + "Fix Bug" → "PROJ-123-fix_bug"', () => {
      const slug = generateSlug('PROJ-123', 'Fix Bug');
      expect(slug).toBe('PROJ-123-fix_bug');
    });

    it('lowercases the summary part but preserves issue key case', () => {
      const slug = generateSlug('ABC-456', 'UPPERCASE SUMMARY');
      expect(slug).toBe('ABC-456-uppercase_summary');
    });

    it('replaces spaces with underscores for file system compatibility', () => {
      const slug = generateSlug('TEST-1', 'Multiple   Spaces   Here');
      expect(slug).toBe('TEST-1-multiple_spaces_here');
    });

    it('removes special characters that are not file system safe', () => {
      const slug = generateSlug('SPEC-99', 'Update UI/UX @user!');
      expect(slug).toBe('SPEC-99-update_ui-ux_-user');
    });

    it('handles colons by converting them to underscores', () => {
      const slug = generateSlug('TASK-5', 'Feature: Add login');
      expect(slug).toBe('TASK-5-feature_add_login');
    });

    it('converts underscores to dashes in sanitization', () => {
      const slug = generateSlug('DASH-7', 'Too___Many___Underscores');
      // Underscores are special chars, get replaced with dashes, then spaces become underscores
      expect(slug).toBe('DASH-7-too-many-underscores');
    });

    it('shopping_cart pattern only matches if underscores survive sanitization', () => {
      // After sanitization, "shopping_cart" becomes "shopping-cart" so custom replacement doesn't apply
      const slug = generateSlug('CART-10', 'Fix shopping_cart bug');
      expect(slug).toBe('CART-10-fix_shopping-cart_bug');
    });

    it('removes noise words: " the " in text', () => {
      const slug = generateSlug('NOISE-1', 'Update the configuration');
      expect(slug).toBe('NOISE-1-update-configuration');
    });

    it('trims leading and trailing dashes and underscores', () => {
      const slug = generateSlug('TRIM-2', '___Leading and trailing___');
      expect(slug).toBe('TRIM-2-leading_and_trailing');
    });

    describe('Real-world examples from project', () => {
      it('Jira bug: "CART-123" + "Fix checkout button not responding on mobile"', () => {
        const slug = generateSlug('CART-123', 'Fix checkout button not responding on mobile');
        expect(slug).toBe('CART-123-fix_checkout_button_not_responding_on_mobile');
      });

      it('Jira story: "PROF-456" + "Add user profile customization options"', () => {
        const slug = generateSlug('PROF-456', 'Add user profile customization options');
        expect(slug).toBe('PROF-456-add_user_profile_customization_options');
      });

      it('Study task: "FM-typescript-101" + "TypeScript Fundamentals Course"', () => {
        const slug = generateSlug('FM-typescript-101', 'TypeScript Fundamentals Course');
        expect(slug).toBe('FM-typescript-101-typescript_fundamentals_course');
      });
    });
  });

  describe('sanitizeSummary - cleans text for use in file names and branches', () => {
    it('converts to lowercase', () => {
      expect(sanitizeSummary('HELLO WORLD')).toBe('hello_world');
    });

    it('replaces spaces with underscores', () => {
      expect(sanitizeSummary('Hello World Test')).toBe('hello_world_test');
    });

    it('replaces special characters with dashes and trims trailing', () => {
      expect(sanitizeSummary('Hello@World!')).toBe('hello-world');
    });

    it('replaces colons with underscores', () => {
      expect(sanitizeSummary('Feature: Add login')).toBe('feature_add_login');
    });

    it('collapses multiple consecutive underscores', () => {
      expect(sanitizeSummary('Too    Many    Spaces')).toBe('too_many_spaces');
    });

    it('trims leading and trailing special characters', () => {
      expect(sanitizeSummary('___Trimmed___')).toBe('trimmed');
      expect(sanitizeSummary('---Dashes---')).toBe('dashes');
    });

    it('custom replacement only works if pattern survives initial sanitization', () => {
      // Note: "shopping_cart" becomes "shopping-cart" during sanitization,
      // so the custom replacement pattern doesn't match
      expect(sanitizeSummary('Fix shopping_cart issue')).toBe('fix_shopping-cart_issue');
    });

    it('removes "_the_" as noise word after sanitization', () => {
      // "_the_" pattern is replaced with "-" after initial sanitization
      expect(sanitizeSummary('Update the configuration')).toBe('update-configuration');
    });

    describe('Edge cases', () => {
      it('handles empty string', () => {
        expect(sanitizeSummary('')).toBe('');
      });

      it('handles string with only special characters', () => {
        expect(sanitizeSummary('!@#$%^&*()')).toBe('');
      });

      it('handles string with only spaces', () => {
        expect(sanitizeSummary('     ')).toBe('');
      });

      it('preserves alphanumeric characters', () => {
        expect(sanitizeSummary('abc123XYZ')).toBe('abc123xyz');
      });

      it('handles mixed special characters and text', () => {
        expect(sanitizeSummary('Update UI/UX @user profile!')).toBe('update_ui-ux_-user_profile');
      });

      it('handles forward slashes', () => {
        expect(sanitizeSummary('Fix path/to/file')).toBe('fix_path-to-file');
      });

      it('handles numbers and letters together', () => {
        expect(sanitizeSummary('Update v2.0 API')).toBe('update_v2-0_api');
      });
    });

    describe('Common patterns in Jira summaries', () => {
      it('handles ticket format: "[Component] Fix bug"', () => {
        expect(sanitizeSummary('[Cart] Fix checkout bug')).toBe('cart-_fix_checkout_bug');
      });

      it('handles parenthetical notes: "Fix bug (urgent)"', () => {
        expect(sanitizeSummary('Fix bug (urgent)')).toBe('fix_bug_-urgent');
      });

      it('handles email-like references: "Update user@example.com permissions"', () => {
        expect(sanitizeSummary('Update user@example.com permissions')).toBe('update_user-example-com_permissions');
      });
    });
  });
});
