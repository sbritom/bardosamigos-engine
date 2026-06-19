import { logAiError, logAiEvent } from '../utils/aiLogger'
import { removeSensitiveFields } from '../utils/aiSanitizer'

export async function saveAiLog(log = {}) {
  try {
    const safeLog = removeSensitiveFields(log)
    logAiEvent({
      event: 'ai_log_stub_saved',
      adapter: 'supabase',
      log: safeLog,
    })

    return {
      ok: true,
      data: safeLog,
      stub: true,
    }
  } catch (error) {
    logAiError(error, { adapter: 'supabase', operation: 'saveAiLog' })
    return { ok: false, data: null, error: error?.message || 'Unknown error', stub: true }
  }
}

export async function listAiLogs(filters = {}) {
  try {
    return {
      ok: true,
      data: [],
      filters: removeSensitiveFields(filters),
      stub: true,
    }
  } catch (error) {
    logAiError(error, { adapter: 'supabase', operation: 'listAiLogs' })
    return { ok: false, data: [], error: error?.message || 'Unknown error', stub: true }
  }
}

export async function saveAiFeedback(feedback = {}) {
  try {
    return {
      ok: true,
      data: removeSensitiveFields(feedback),
      stub: true,
    }
  } catch (error) {
    logAiError(error, { adapter: 'supabase', operation: 'saveAiFeedback' })
    return { ok: false, data: null, error: error?.message || 'Unknown error', stub: true }
  }
}

export async function getUserAiContext(userId, options = {}) {
  try {
    return {
      ok: true,
      data: {
        userId,
        preferences: {},
        history: [],
        options: removeSensitiveFields(options),
      },
      stub: true,
    }
  } catch (error) {
    logAiError(error, { adapter: 'supabase', operation: 'getUserAiContext' })
    return { ok: false, data: null, error: error?.message || 'Unknown error', stub: true }
  }
}
