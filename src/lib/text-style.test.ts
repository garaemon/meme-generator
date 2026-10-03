import { applyTextCase, isShadowEnabled } from './text-style';

describe('text-style', () => {
  it('should_uppercase_text_when_uppercase_enabled', () => {
    expect(applyTextCase('one does not simply', true)).toBe('ONE DOES NOT SIMPLY');
  });

  it('should_keep_text_as_is_when_uppercase_disabled', () => {
    expect(applyTextCase('Mixed Case', false)).toBe('Mixed Case');
  });

  it('should_preserve_length_when_uppercasing_so_caret_stays_in_place', () => {
    expect(applyTextCase('straße', true)).toHaveLength('straße'.length);
  });

  it('should_report_shadow_disabled_when_shadow_missing', () => {
    expect(isShadowEnabled(null)).toBe(false);
  });

  it('should_report_shadow_enabled_when_shadow_present', () => {
    expect(isShadowEnabled({ color: 'black' })).toBe(true);
  });
});
