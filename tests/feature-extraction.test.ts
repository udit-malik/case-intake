import { describe, it, expect } from 'vitest';
import { buildFeatures } from '../src/lib/ai/feature-extraction';

describe('Feature Extraction - hasAdmission', () => {
  it('should NOT match plain "I merged"', async () => {
    const text = 'I merged at the same time';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.booleans?.admission_of_fault).toBe(false);
  });

  it('should match "I merged too quickly"', async () => {
    const text = 'I merged too quickly';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.booleans?.admission_of_fault).toBe(true);
  });

  it('should match "I merged too fast"', async () => {
    const text = 'I merged too fast';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.booleans?.admission_of_fault).toBe(true);
  });

  it('should match "It was my fault"', async () => {
    const text = 'It was my fault';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.booleans?.admission_of_fault).toBe(true);
  });

  it('should match "I caused the accident"', async () => {
    const text = 'I caused the accident';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.booleans?.admission_of_fault).toBe(true);
  });

  it('should match "I ran a red light"', async () => {
    const text = 'I ran a red light';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.booleans?.admission_of_fault).toBe(true);
  });

  it('should match "I cut him off"', async () => {
    const text = 'I cut him off';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.booleans?.admission_of_fault).toBe(true);
  });

  it('should NOT match "We both merged and collided"', async () => {
    const text = 'We both merged and collided';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.booleans?.admission_of_fault).toBe(false);
  });

  it('should NOT match "I merged into the lane"', async () => {
    const text = 'I merged into the lane';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.booleans?.admission_of_fault).toBe(false);
  });

  it('should NOT match "I merged safely"', async () => {
    const text = 'I merged safely';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.booleans?.admission_of_fault).toBe(false);
  });
});

describe('Feature Extraction - Pain Level Extraction', () => {
  it('should extract "pain is five out of 10" as 5', async () => {
    const text = 'pain is five out of 10';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.numbers?.peak_pain_0_10).toBe(5);
  });

  it('should extract "pain five out of 10, spikes to six" as 6', async () => {
    const text = 'pain five out of 10, spikes to six';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.numbers?.peak_pain_0_10).toBe(6);
  });

  it('should extract "pain is 10 out of 10" as 10', async () => {
    const text = 'pain is 10 out of 10';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.numbers?.peak_pain_0_10).toBe(10);
  });

  it('should NOT extract "pain is five out of 10" as 10 (denominator)', async () => {
    const text = 'pain is five out of 10';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    // Should be 5, not 10 (the denominator)
    expect(features.numbers?.peak_pain_0_10).toBe(5);
  });

  it('should extract "pain is 7" from generic fallback', async () => {
    const text = 'pain is 7';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.numbers?.peak_pain_0_10).toBe(7);
  });

  it('should extract "hurt like 8" from generic fallback', async () => {
    const text = 'hurt like 8';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.numbers?.peak_pain_0_10).toBe(8);
  });

  it('should extract "ache was nine" from generic fallback', async () => {
    const text = 'ache was nine';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.numbers?.peak_pain_0_10).toBe(9);
  });

  it('should NOT extract "pain is 10" when nearby text has "/10"', async () => {
    const text = 'pain is 10 on a scale';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    // should extract 10 from generic fallback
    expect(features.numbers?.peak_pain_0_10).toBe(10);
  });

  it('should extract "pain is ten out of 10" as 10 (numerator)', async () => {
    const text = 'pain is ten out of 10';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    // extract 10 from the numerator, not skip it
    expect(features.numbers?.peak_pain_0_10).toBe(10);
  });

  it('should extract "pain is 10" when no denominator nearby', async () => {
    const text = 'pain is 10';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    expect(features.numbers?.peak_pain_0_10).toBe(10);
  });

  it('should NOT extract "pain is 10" when nearby text has "/10" (denominator test)', async () => {
    const text = 'pain is 10/10 scale';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    // Should extract 10 from the numerator (higher priority pattern)
    expect(features.numbers?.peak_pain_0_10).toBe(10);
  });

  it('should NOT extract "pain is ten" when nearby text has "out of 10" (denominator test)', async () => {
    const text = 'pain is ten out of 10';
    const features = await buildFeatures({ 
      transcript: text, 
      incidentDate: '2024-01-01', 
      now: new Date('2024-01-02') 
    });
    // Should extract 10 from the numerator (higher priority pattern)
    expect(features.numbers?.peak_pain_0_10).toBe(10);
  });
});
