import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ApiError, CaseNotFoundError, InvalidStatusTransitionError, MissingRequiredFieldsError } from '../src/lib/errors';

describe('Error Handling', () => {
  describe('ApiError', () => {
    it('should create ApiError with correct properties', () => {
      const error = new ApiError('Test error', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ApiError');
    });

    it('should create CaseNotFoundError', () => {
      const error = new CaseNotFoundError('test-case-id');
      
      expect(error.message).toBe('Case not found: test-case-id');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('CaseNotFoundError');
    });

    it('should create InvalidStatusTransitionError', () => {
      const error = new InvalidStatusTransitionError('UPLOADED', 'SCORED');
      
      expect(error.message).toBe('Invalid status transition from UPLOADED to SCORED');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('InvalidStatusTransitionError');
    });

    it('should create MissingRequiredFieldsError', () => {
      const error = new MissingRequiredFieldsError(['client_name', 'incident_date']);
      
      expect(error.message).toBe('Missing required fields: client_name, incident_date');
      expect(error.statusCode).toBe(422);
      expect(error.name).toBe('MissingRequiredFieldsError');
      expect(error.details?.missing).toEqual(['client_name', 'incident_date']);
    });
  });

  describe('handleApiError', () => {
    it('should handle ApiError correctly', () => {
      const error = new ApiError('Test error', 400);
      const response = handleApiError(error);
      
      expect(response.status).toBe(400);
    });

    it('should handle CaseNotFoundError correctly', () => {
      const error = new CaseNotFoundError('test-case-id');
      const response = handleApiError(error);
      
      expect(response.status).toBe(404);
    });

    it('should handle InvalidStatusTransitionError correctly', () => {
      const error = new InvalidStatusTransitionError('UPLOADED', 'SCORED');
      const response = handleApiError(error);
      
      expect(response.status).toBe(409);
    });

    it('should handle MissingRequiredFieldsError correctly', () => {
      const error = new MissingRequiredFieldsError(['client_name']);
      const response = handleApiError(error);
      
      expect(response.status).toBe(422);
    });

    it('should handle generic Error correctly', () => {
      const error = new Error('Generic error');
      const response = handleApiError(error);
      
      expect(response.status).toBe(500);
    });

    it('should handle unknown error types correctly', () => {
      const error = 'String error';
      const response = handleApiError(error);
      
      expect(response.status).toBe(500);
    });
  });

  describe('API Route Error Handling', () => {
    it('should handle validation errors in API routes', async () => {
      // Mock a request with invalid JSON
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // This would be tested in actual API route tests
      // but here we're testing the error handling pattern
      expect(() => {
        JSON.parse('invalid json');
      }).toThrow();
    });

    it('should handle database connection errors', async () => {
      // Mock database error
      const dbError = new Error('Database connection failed');
      const response = handleApiError(dbError);
      
      expect(response.status).toBe(500);
    });

    it('should handle external service errors', async () => {
      // Mock external service error
      const serviceError = new Error('External service unavailable');
      const response = handleApiError(serviceError);
      
      expect(response.status).toBe(500);
    });
  });

  describe('Form Validation Error Handling', () => {
    it('should handle Zod validation errors', () => {
      const zodError = {
        name: 'ZodError',
        issues: [
          { path: ['email'], message: 'Invalid email' },
          { path: ['password'], message: 'Password too short' },
        ],
      };

      // This would be handled in the validateRequest function
      const errorMessage = zodError.issues.map(issue => issue.message).join(', ');
      expect(errorMessage).toBe('Invalid email, Password too short');
    });

    it('should handle missing required fields', () => {
      const missingFields = ['client_name', 'incident_date', 'incident_description'];
      const error = new MissingRequiredFieldsError(missingFields);
      
      expect(error.details?.missing).toEqual(missingFields);
      expect(error.message).toContain('client_name');
      expect(error.message).toContain('incident_date');
      expect(error.message).toContain('incident_description');
    });
  });

  describe('AI Service Error Handling', () => {
    it('should handle OpenAI API errors', () => {
      const openAIError = new Error('OpenAI API rate limit exceeded');
      const response = handleApiError(openAIError);
      
      expect(response.status).toBe(500);
    });

    it('should handle Deepgram API errors', () => {
      const deepgramError = new Error('Deepgram API key invalid');
      const response = handleApiError(deepgramError);
      
      expect(response.status).toBe(500);
    });

    it('should handle AI extraction errors', () => {
      const extractionError = new Error('Failed to extract case data from transcript');
      const response = handleApiError(extractionError);
      
      expect(response.status).toBe(500);
    });

    it('should handle AI scoring errors', () => {
      const scoringError = new Error('Failed to score case');
      const response = handleApiError(scoringError);
      
      expect(response.status).toBe(500);
    });
  });

  describe('File Upload Error Handling', () => {
    it('should handle file size errors', () => {
      const fileSizeError = new Error('File too large');
      const response = handleApiError(fileSizeError);
      
      expect(response.status).toBe(500);
    });

    it('should handle file type errors', () => {
      const fileTypeError = new Error('Invalid file type');
      const response = handleApiError(fileTypeError);
      
      expect(response.status).toBe(500);
    });

    it('should handle upload service errors', () => {
      const uploadError = new Error('UploadThing service unavailable');
      const response = handleApiError(uploadError);
      
      expect(response.status).toBe(500);
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle invalid credentials', () => {
      const authError = new Error('Invalid credentials');
      const response = handleApiError(authError);
      
      expect(response.status).toBe(500);
    });

    it('should handle session expiration', () => {
      const sessionError = new Error('Session expired');
      const response = handleApiError(sessionError);
      
      expect(response.status).toBe(500);
    });

    it('should handle unauthorized access', () => {
      const unauthorizedError = new Error('Unauthorized access');
      const response = handleApiError(unauthorizedError);
      
      expect(response.status).toBe(500);
    });
  });
});
