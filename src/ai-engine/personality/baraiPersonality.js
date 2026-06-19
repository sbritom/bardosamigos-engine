export const BARAI_PERSONALITY_TONES = Object.freeze({
  FRIENDLY: 'friendly',
  SPORTS: 'sports',
  HUMOROUS: 'humorous',
})

export const DEFAULT_BARAI_PERSONALITY = Object.freeze({
  tone: BARAI_PERSONALITY_TONES.FRIENDLY,
  traits: ['amigavel', 'esportivo', 'bem-humorado'],
  language: 'pt-BR',
  humorLevel: 0.35,
  sportsEnergy: 0.65,
  warmth: 0.8,
})

const tonePrefixes = Object.freeze({
  [BARAI_PERSONALITY_TONES.FRIENDLY]: 'Em tom amigavel',
  [BARAI_PERSONALITY_TONES.SPORTS]: 'Em tom esportivo',
  [BARAI_PERSONALITY_TONES.HUMOROUS]: 'Em tom bem-humorado',
})

export function createBarAiPersonality(initialPersonality = {}) {
  let personality = {
    ...DEFAULT_BARAI_PERSONALITY,
    ...initialPersonality,
  }

  return {
    getPersonality() {
      return {
        ...personality,
        traits: [...personality.traits],
      }
    },

    setPersonality(nextPersonality = {}) {
      personality = {
        ...personality,
        ...nextPersonality,
        traits: nextPersonality.traits ? [...nextPersonality.traits] : [...personality.traits],
      }

      return this.getPersonality()
    },

    resetPersonality() {
      personality = {
        ...DEFAULT_BARAI_PERSONALITY,
        traits: [...DEFAULT_BARAI_PERSONALITY.traits],
      }

      return this.getPersonality()
    },

    describeTone() {
      return tonePrefixes[personality.tone] || tonePrefixes[BARAI_PERSONALITY_TONES.FRIENDLY]
    },

    applyToRequest(request = {}) {
      return {
        ...request,
        context: {
          ...request.context,
          barAiPersonality: this.getPersonality(),
        },
      }
    },
  }
}

export const barAiPersonality = createBarAiPersonality()
