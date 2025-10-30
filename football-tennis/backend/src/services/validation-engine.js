/**
 * Answer Validation Engine
 *
 * Validates player answers using:
 * 1. Fuzzy name matching to find the entity
 * 2. Rule-based fact checking against database
 * 3. LLM fallback for ambiguous cases
 */

import Fuse from 'fuse.js';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Normalize answer for matching
 */
function normalizeAnswer(answer) {
  return answer
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalize accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize spaces
}

/**
 * Find entity by fuzzy matching name
 *
 * @param {string} answer - Player's answer
 * @param {object} supabase - Supabase client
 * @param {string} entityType - Type filter ('player', 'club', etc.)
 * @returns {object|null} - Matched entity or null
 */
export async function findEntityByName(answer, supabase, entityType = null) {
  const normalized = normalizeAnswer(answer);

  // Fetch entities from database
  let query = supabase
    .from('entities')
    .select('*')
    .eq('active', true);

  if (entityType) {
    query = query.eq('type', entityType);
  }

  const { data: entities, error } = await query;

  if (error) {
    console.error('Error fetching entities:', error);
    return null;
  }

  if (!entities || entities.length === 0) {
    return null;
  }

  // Setup Fuse.js for fuzzy matching
  const fuse = new Fuse(entities, {
    keys: ['name'],
    threshold: 0.3, // 0 = perfect match, 1 = match anything
    includeScore: true,
    shouldSort: true
  });

  // Search
  const results = fuse.search(normalized);

  if (results.length === 0) {
    // Try exact substring match as fallback
    const exactMatch = entities.find(e =>
      normalizeAnswer(e.name).includes(normalized) ||
      normalized.includes(normalizeAnswer(e.name))
    );
    return exactMatch || null;
  }

  // Return best match
  return results[0].item;
}

/**
 * Check if entity satisfies category predicate
 *
 * @param {object} entity - The matched entity
 * @param {object} category - Category with predicate
 * @param {object} supabase - Supabase client
 * @returns {object} - { valid: boolean, reason: string, facts: array }
 */
export async function checkEntityAgainstPredicate(entity, category, supabase) {
  const predicate = category.predicate;

  // Type check
  if (predicate.type && entity.type !== predicate.type) {
    return {
      valid: false,
      reason: `${entity.name} is a ${entity.type}, not a ${predicate.type}`,
      facts: []
    };
  }

  // Check all conditions
  const conditions = predicate.conditions || [];
  const matchedFacts = [];
  const failedConditions = [];

  for (const condition of conditions) {
    // Fetch facts for this condition
    let query = supabase
      .from('facts')
      .select('*')
      .eq('entity_id', entity.id)
      .eq('fact_type', condition.fact_type);

    if (condition.scope) {
      query = query.eq('scope', condition.scope);
    }

    if (condition.season) {
      query = query.eq('season', condition.season);
    }

    const { data: facts, error } = await query;

    if (error) {
      console.error('Error fetching facts:', error);
      failedConditions.push(condition);
      continue;
    }

    // Check if any fact satisfies the condition
    const satisfyingFact = facts?.find(fact => {
      const value = parseFloat(fact.value);
      const target = parseFloat(condition.value);

      switch (condition.op) {
        case '>=': return value >= target;
        case '>': return value > target;
        case '<=': return value <= target;
        case '<': return value < target;
        case '==': return value === target;
        case '!=': return value !== target;
        default: return false;
      }
    });

    if (satisfyingFact) {
      matchedFacts.push(satisfyingFact);
    } else {
      failedConditions.push(condition);
    }
  }

  // All conditions must be satisfied
  if (failedConditions.length === 0 && conditions.length > 0) {
    return {
      valid: true,
      reason: `${entity.name} meets all requirements`,
      facts: matchedFacts
    };
  } else {
    return {
      valid: false,
      reason: `${entity.name} doesn't meet all requirements`,
      facts: matchedFacts,
      failedConditions
    };
  }
}

/**
 * LLM fallback validation
 *
 * @param {string} answer - Player's answer
 * @param {object} category - Category object
 * @param {object} entity - Matched entity (if any)
 * @returns {object} - { valid: boolean, reason: string, confidence: number }
 */
export async function llmValidation(answer, category, entity = null) {
  if (!openai) {
    console.warn('OpenAI API key not configured, skipping LLM validation');
    return {
      valid: false,
      reason: 'LLM validation unavailable',
      confidence: 0
    };
  }

  try {
    const prompt = `You are a football knowledge expert. Validate if this answer is correct for the given category.

Category: ${category.title}
Answer: ${answer}
${entity ? `Matched Entity: ${entity.name} (${entity.type})` : ''}

Rules to check:
${JSON.stringify(category.predicate, null, 2)}

Respond with a JSON object:
{
  "valid": true/false,
  "reason": "explanation",
  "confidence": 0-1 (how confident are you?)
}

Consider current season (2024-2025) statistics and Premier League data.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a football statistics expert. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('LLM validation error:', error);
    return {
      valid: false,
      reason: 'LLM validation failed',
      confidence: 0
    };
  }
}

/**
 * Main validation function
 *
 * @param {string} answer - Player's answer
 * @param {object} category - Category object
 * @param {array} usedAnswers - Already used answers in this rally
 * @param {object} supabase - Supabase client
 * @returns {object} - Validation result
 */
export async function validateAnswer(answer, category, usedAnswers, supabase) {
  const normalized = normalizeAnswer(answer);

  // Step 1: Check for duplicates
  const isDuplicate = usedAnswers.some(
    used => normalizeAnswer(used.answer) === normalized
  );

  if (isDuplicate) {
    return {
      valid: false,
      reason: 'This answer has already been used',
      method: 'duplicate_check',
      entity: null
    };
  }

  // Step 2: Find entity by name
  const entityType = category.predicate?.type || null;
  const entity = await findEntityByName(answer, supabase, entityType);

  if (!entity) {
    // No entity found - try LLM fallback
    const llmResult = await llmValidation(answer, category, null);

    if (llmResult.valid && llmResult.confidence > 0.7) {
      return {
        valid: true,
        reason: llmResult.reason,
        method: 'llm_fallback',
        entity: null,
        needsVerification: true
      };
    }

    return {
      valid: false,
      reason: 'Could not find a matching player or club',
      method: 'entity_lookup',
      entity: null
    };
  }

  // Step 3: Check against predicate
  const predicateCheck = await checkEntityAgainstPredicate(
    entity,
    category,
    supabase
  );

  if (predicateCheck.valid) {
    return {
      valid: true,
      reason: predicateCheck.reason,
      method: 'rule_based',
      entity: entity,
      facts: predicateCheck.facts
    };
  }

  // Step 4: LLM fallback if rule-based check fails
  const llmResult = await llmValidation(answer, category, entity);

  if (llmResult.valid && llmResult.confidence > 0.8) {
    // LLM confirmed it's valid - add fact to database for future
    return {
      valid: true,
      reason: llmResult.reason,
      method: 'llm_verified',
      entity: entity,
      needsFactCreation: true,
      confidence: llmResult.confidence
    };
  }

  // Final: Invalid answer
  return {
    valid: false,
    reason: predicateCheck.reason || llmResult.reason,
    method: 'failed_validation',
    entity: entity,
    failedConditions: predicateCheck.failedConditions
  };
}

/**
 * Create fact from LLM verification
 */
export async function createVerifiedFact(entity, category, supabase) {
  // Extract fact type from category predicate
  const conditions = category.predicate?.conditions || [];

  const factsToCreate = conditions.map(condition => ({
    entity_id: entity.id,
    fact_type: condition.fact_type,
    value: condition.value,
    scope: condition.scope || 'Verified',
    season: condition.season || '2024-2025',
    verified: true,
    source: 'llm_verified'
  }));

  if (factsToCreate.length > 0) {
    const { error } = await supabase
      .from('facts')
      .upsert(factsToCreate, {
        onConflict: 'entity_id,fact_type,scope,season',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error creating verified fact:', error);
    }
  }
}

export default {
  validateAnswer,
  findEntityByName,
  checkEntityAgainstPredicate,
  llmValidation,
  createVerifiedFact,
  normalizeAnswer
};
