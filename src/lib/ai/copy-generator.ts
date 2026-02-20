import OpenAI from 'openai';

export interface CopyInput {
    slidesCount: number;
    niche: string;
    theme: string;
    objective: string;
    tone: string;
    cta: string;
}

export interface SlideCopy {
    idx: number;
    headline: string;
    subheadline: string;
    bullets: string[];
    cta: string;
}

export interface CopyOutput {
    slides: SlideCopy[];
}

const SYSTEM_PROMPT = `Você é copywriter especialista em carrosséis de redes sociais.
Crie textos claros, curtos e persuasivos.
Retorne APENAS JSON válido, sem markdown, sem code fences.`;

function buildUserPrompt(input: CopyInput): string {
    return `Gere um carrossel com ${input.slidesCount} lâminas.
Nicho: ${input.niche}
Tema: ${input.theme}
Objetivo: ${input.objective}
Tom: ${input.tone}
CTA final: ${input.cta}

Regras:
- Lâmina 1: gancho forte que prende atenção
- Lâminas intermediárias: construção lógica de valor
- Última lâmina: CTA claro
- headline até 52 caracteres
- subheadline até 110 caracteres
- bullets: 0 a 3 por lâmina, até 40 chars cada
- Português do Brasil

Retorne JSON neste formato exato:
{
  "slides": [
    {
      "idx": 1,
      "headline": "",
      "subheadline": "",
      "bullets": [],
      "cta": ""
    }
  ]
}`;
}

function generateFallbackCopy(input: CopyInput): CopyOutput {
    const slides: SlideCopy[] = [];
    for (let i = 1; i <= input.slidesCount; i++) {
        if (i === 1) {
            slides.push({
                idx: i,
                headline: `${input.theme}`,
                subheadline: `Descubra como ${input.objective.toLowerCase()} no nicho de ${input.niche}`,
                bullets: [],
                cta: '',
            });
        } else if (i === input.slidesCount) {
            slides.push({
                idx: i,
                headline: input.cta || 'Comece agora!',
                subheadline: `Transforme seu ${input.niche.toLowerCase()} hoje`,
                bullets: [],
                cta: input.cta || 'Siga para mais dicas',
            });
        } else {
            slides.push({
                idx: i,
                headline: `Dica ${i - 1} sobre ${input.theme}`,
                subheadline: `Estratégia prática para ${input.objective.toLowerCase()}`,
                bullets: [`Ponto importante ${i}`],
                cta: '',
            });
        }
    }
    return { slides };
}

export async function generateCarouselCopy(input: CopyInput): Promise<CopyOutput> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === 'sk-your-key') {
        console.log('[AI Copy] No OpenAI API key configured, using fallback copy');
        return generateFallbackCopy(input);
    }

    try {
        const openai = new OpenAI({ apiKey });

        const response = await openai.chat.completions.create({
            model: process.env.LLM_MODEL || 'gpt-4o',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: buildUserPrompt(input) },
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            console.error('[AI Copy] Empty response from LLM');
            return generateFallbackCopy(input);
        }

        const parsed: CopyOutput = JSON.parse(content);

        // Validate structure
        if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length !== input.slidesCount) {
            console.error('[AI Copy] Invalid response structure, using fallback');
            return generateFallbackCopy(input);
        }

        // Ensure all slides have correct idx
        parsed.slides = parsed.slides.map((slide, i) => ({
            ...slide,
            idx: i + 1,
            headline: slide.headline || `Slide ${i + 1}`,
            subheadline: slide.subheadline || '',
            bullets: Array.isArray(slide.bullets) ? slide.bullets : [],
            cta: slide.cta || '',
        }));

        console.log(`[AI Copy] Successfully generated ${parsed.slides.length} slides`);
        return parsed;
    } catch (error) {
        console.error('[AI Copy] Error calling LLM:', error);
        return generateFallbackCopy(input);
    }
}
