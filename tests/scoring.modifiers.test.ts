import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { scoreCase } from '../src/lib/ai';
import { CaseType } from '../src/lib/ai/types';

// Set deterministic mode
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

describe('Scoring Modifiers', () => {
  it('should apply pedestrian/crosswalk modifiers correctly', async () => {
    const transcript = loadFixture('ped_crosswalk.txt');
    
    // Test determinism
    const results = await Promise.all(
      Array(10).fill(null).map(() => 
        scoreCase({ intake: minimalIntake, transcript, now: fixedDate })
      )
    );
    
    const firstResult = results[0];
    
    // All results should be identical
    results.forEach(result => {
      expect(result.score).toBe(firstResult.score);
      expect(result.decision).toBe(firstResult.decision);
    });
    
    // Should include pedestrian and crosswalk modifiers
    expect(firstResult.reasons).toContain('+ Pedestrian/bicyclist case');
    expect(firstResult.reasons).toContain('+ In crosswalk');
    
    // Check breakdown for correct deltas
    const pedestrianBreakdown = firstResult.breakdown.find(b => b.factor === 'pedestrian_or_bicyclist');
    expect(pedestrianBreakdown?.delta).toBe(6);
    
    const crosswalkBreakdown = firstResult.breakdown.find(b => b.factor === 'crosswalk_bonus');
    expect(crosswalkBreakdown?.delta).toBe(4);
    
    // Combined delta should be 10 (6 + 4)
    const combinedDelta = (pedestrianBreakdown?.delta || 0) + (crosswalkBreakdown?.delta || 0);
    expect(combinedDelta).toBe(10);
  });

  it('should apply rideshare modifier correctly', async () => {
    const transcript = loadFixture('uber_passenger.txt');
    
    const result = await scoreCase({ intake: minimalIntake, transcript, now: fixedDate });
    
    expect(result.reasons).toContain('+ Rideshare case');
    
    const rideshareBreakdown = result.breakdown.find(b => b.factor === 'rideshare');
    expect(rideshareBreakdown?.delta).toBe(5);
  });

  it('should apply commercial vehicle modifier correctly', async () => {
    const transcript = loadFixture('commercial_tbone.txt');
    
    const result = await scoreCase({ intake: minimalIntake, transcript, now: fixedDate });
    
    expect(result.reasons).toContain('+ Commercial vehicle');
    
    const commercialBreakdown = result.breakdown.find(b => b.factor === 'commercial_vehicle');
    expect(commercialBreakdown?.delta).toBe(6);
  });

  it('should apply hit and run and UM/UIM modifiers correctly', async () => {
    const transcript = loadFixture('hit_and_run_um.txt');
    
    const result = await scoreCase({ intake: minimalIntake, transcript, now: fixedDate });
    
    expect(result.reasons).toContain('- Hit and run');
    expect(result.reasons).toContain('+ UM/UIM applicable');
    
    const hitAndRunBreakdown = result.breakdown.find(b => b.factor === 'hit_and_run');
    expect(hitAndRunBreakdown?.delta).toBe(-6);
    
    const umUimBreakdown = result.breakdown.find(b => b.factor === 'um_uim_applicable');
    expect(umUimBreakdown?.delta).toBe(4);
  });

  it('should apply DUI other driver modifier correctly', async () => {
    const transcript = loadFixture('dui_other_driver.txt');
    
    const result = await scoreCase({ intake: minimalIntake, transcript, now: fixedDate });
    
    expect(result.reasons).toContain('+ Other driver DUI');
    
    const duiBreakdown = result.breakdown.find(b => b.factor === 'dui_other_driver');
    expect(duiBreakdown?.delta).toBe(4);
  });

  it('should apply helmet penalty for cyclist without helmet', async () => {
    const transcript = loadFixture('cyclist_no_helmet.txt');
    
    const result = await scoreCase({ intake: minimalIntake, transcript, now: fixedDate });
    
    expect(result.reasons).toContain('- No helmet worn');
    
    const helmetBreakdown = result.breakdown.find(b => b.factor === 'no_helmet_penalty');
    expect(helmetBreakdown?.delta).toBe(-2);
    
    // Should only appear once (no double counting)
    const helmetCount = result.breakdown.filter(b => b.factor === 'no_helmet_penalty').length;
    expect(helmetCount).toBe(1);
  });

  it('should apply airbag deployed and severe damage bonus', async () => {
    const transcript = loadFixture('commercial_tbone.txt');
    
    const result = await scoreCase({ intake: minimalIntake, transcript, now: fixedDate });
    
    expect(result.reasons).toContain('+ Airbag deployed');
    expect(result.reasons).toContain('+ Severe property damage');
    
    const airbagBreakdown = result.breakdown.find(b => b.factor === 'airbag_deployed');
    expect(airbagBreakdown?.delta).toBe(3);
    
    const severeDamageBreakdown = result.breakdown.find(b => b.factor === 'severe_damage_bonus');
    expect(severeDamageBreakdown?.delta).toBe(3);
  });
});
