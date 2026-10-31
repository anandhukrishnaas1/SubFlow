import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsAskResponse } from './analytics.types';

@Injectable()
export class AnalyticsCopilotService {
  private readonly logger = new Logger(AnalyticsCopilotService.name);

  async explain(response: AnalyticsAskResponse): Promise<AnalyticsAskResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL;
    if (!apiKey || !model) {
      return {
        ...response,
        limitations: [
          ...response.limitations,
          'Language-model explanation is not configured; this answer uses deterministic analytics.',
        ],
      };
    }

    const safeContext = {
      verifiedAnswer: response.answer,
      reportingPeriod: response.period,
      numericEvidence: response.evidence.filter(
        (item) => typeof item.value === 'number' || item.value === null,
      ),
      dataLimitations: response.limitations,
    };

    try {
      const result = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: 'Explain only the supplied verified answer and numeric evidence in plain language. Do not recalculate, add facts, infer customer details, or introduce any numbers not in the evidence. If evidence is insufficient, state that clearly. Keep the explanation to two sentences.',
                },
              ],
            },
            contents: [{ role: 'user', parts: [{ text: JSON.stringify(safeContext) }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 160 },
          }),
        },
      );
      if (!result.ok) {
        throw new Error(`Gemini request failed with status ${result.status}`);
      }

      const payload = await result.json();
      const interpretation = payload.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || '')
        .join('')
        .trim();
      if (!interpretation) {
        throw new Error('Gemini returned no explanation text.');
      }

      return { ...response, interpretation, mode: 'gemini-grounded' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Grounded language-model explanation unavailable: ${message}`);
      return {
        ...response,
        limitations: [
          ...response.limitations,
          'Language-model explanation is unavailable; this answer uses deterministic analytics.',
        ],
      };
    }
  }
}
