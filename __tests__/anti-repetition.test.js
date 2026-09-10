/**
 * @jest-environment node
 *
 * Unit tests for checkForRepetition() — the keyword-overlap heuristic used by
 * api/chat.js to detect when Claude's recent replies are getting repetitive.
 * Pure function test, no network/API calls, no Azure Functions runtime involved.
 */
const { checkForRepetition } = require('../api/chat.js');

describe('checkForRepetition', () => {
    test('returns not repetitive when fewer than 2 responses given', () => {
        const result = checkForRepetition(['Only one response here']);
        expect(result.isRepetitive).toBe(false);
        expect(result.themes).toEqual([]);
    });

    test('flags heavily overlapping responses as repetitive', () => {
        const responses = [
            'JonEric built the ELM App which won a Microsoft automation award for municipal government.',
            'The ELM App from JonEric won a Microsoft automation award for municipal government workflows.',
            'JonEric created ELM App, a Microsoft award winning automation solution for municipal government.'
        ];
        const result = checkForRepetition(responses);
        expect(result.isRepetitive).toBe(true);
        expect(result.themes.length).toBeGreaterThan(0);
    });

    test('does not flag genuinely distinct responses as repetitive', () => {
        const responses = [
            'JonEric specializes in Power BI dashboards for municipal budgeting.',
            'ArcGIS Online powers his spatial analysis and mapping projects.',
            'He holds a PMP certification and leads agile project teams.'
        ];
        const result = checkForRepetition(responses);
        expect(result.isRepetitive).toBe(false);
    });
});
