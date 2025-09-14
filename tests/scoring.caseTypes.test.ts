import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { scoreCase, buildFeatures } from '../src/lib/ai';
import { CaseType } from '../src/lib/ai/types';

// set deterministic mode
beforeAll(() => {
  process.env.SCORING_USE_LLM = 'false';
});

const fixturesDir = join(__dirname, '../src/fixtures');

function loadFixture(filename: string): string {
  return readFileSync(join(fixturesDir, filename), 'utf-8').trim();
}

const minimalIntake = {
  client_name: 'Test Client',
  date_of_birth: '1990-01-01',
  phone_number: '555-1234',
  email: 'test@example.com',
  incident_date: '2024-01-15',
  incident_description: 'Test incident',
  incident_location: 'Test Location',
  injuries: 'Test injuries',
  treatment_providers: ['Test Provider'],
  pain_level: 5,
  days_missed_work: 0,
  estimated_value: 10000,
  insurance_provider: 'Test Insurance',
  insurance_policy_number: 'POL123456',
  employer: 'Test Company',
  clarification_needed: []
};

const fixedDate = new Date('2024-01-20');

describe('Scoring Case Types', () => {
  it('should detect pedestrian/bicycle case type and apply profile overrides', async () => {
    const transcript = loadFixture('ped_crosswalk.txt');
    
    // Test case type detection
    const features = await buildFeatures({ transcript, incidentDate: '2024-01-15', now: fixedDate });
    expect(features.case_type).toBe(CaseType.PEDESTRIAN_OR_BICYCLE);
    
    // Test scoring with profile overrides
    const result = await scoreCase({ intake: minimalIntake, transcript, now: fixedDate });
    
    // Should have higher police report weight (8 instead of 6)
    const policeReportBreakdown = result.breakdown.find(b => b.factor === 'police_report');
    expect(policeReportBreakdown?.delta).toBe(8);
    
    // Should not have minor damage penalty (not applied for pedestrian cases)
    const minorDamageBreakdown = result.breakdown.find(b => b.factor === 'minor_damage');
    expect(minorDamageBreakdown).toBeUndefined();
    
    // Test determinism - run multiple times
    const results = await Promise.all(
      Array(15).fill(null).map(() => 
        scoreCase({ intake: minimalIntake, transcript, now: fixedDate })
      )
    );
    
    const firstResult = results[0];
    results.forEach(result => {
      expect(result.score).toBe(firstResult.score);
      expect(result.decision).toBe(firstResult.decision);
    });
  });

  it('should detect rideshare case type and apply profile overrides', async () => {
    const transcript = loadFixture('uber_passenger.txt');
    
    // Test case type detection
    const features = await buildFeatures({ transcript, incidentDate: '2024-01-15', now: fixedDate });
    expect(features.case_type).toBe(CaseType.RIDESHARE_MVA);
    
    // Test scoring with profile overrides
    const result = await scoreCase({ intake: minimalIntake, transcript, now: fixedDate });
    
    // Should have higher police report weight (8 instead of 6)
    const policeReportBreakdown = result.breakdown.find(b => b.factor === 'police_report');
    expect(policeReportBreakdown?.delta).toBe(8);
    
    // Should still have minor damage penalty (-4, not zeroed)
    const minorDamageBreakdown = result.breakdown.find(b => b.factor === 'minor_damage');
    expect(minorDamageBreakdown?.delta).toBe(-4);
    
    // Test determinism - run multiple times
    const results = await Promise.all(
      Array(15).fill(null).map(() => 
        scoreCase({ intake: minimalIntake, transcript, now: fixedDate })
      )
    );
    
    const firstResult = results[0];
    results.forEach(result => {
      expect(result.score).toBe(firstResult.score);
      expect(result.decision).toBe(firstResult.decision);
    });
  });

  it('should maintain determinism across different case types', async () => {
    const fixtures = [
      'ped_crosswalk.txt',
      'uber_passenger.txt', 
      'commercial_tbone.txt',
      'hit_and_run_um.txt',
      'dui_other_driver.txt',
      'cyclist_no_helmet.txt'
    ];
    
    for (const fixture of fixtures) {
      const transcript = loadFixture(fixture);
      
      // Run 10 times to test determinism
      const results = await Promise.all(
        Array(10).fill(null).map(() => 
          scoreCase({ intake: minimalIntake, transcript, now: fixedDate })
        )
      );
      
      const firstResult = results[0];
      results.forEach((result, index) => {
        expect(result.score).toBe(firstResult.score);
        expect(result.decision).toBe(firstResult.decision);
        expect(result.reasons).toEqual(firstResult.reasons);
        expect(result.breakdown).toEqual(firstResult.breakdown);
      });
    }
  });
});
