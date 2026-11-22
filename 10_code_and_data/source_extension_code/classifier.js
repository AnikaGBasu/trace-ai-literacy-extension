(function () {
  const root = window.BeforeYouCopy || (window.BeforeYouCopy = {});

  const SYSTEM_PROMPT = `You are a strict classifier for a K-12 generative AI literacy extension.

Goal: identify the student's AI-use task from a copy event, and assign a subject area.

Do not classify the student, do not guess personal information, and do not use full conversation history. Use only the available event inputs: student prompt, AI response excerpt, selected text, event type, time since response, selected text length, and mode.

Your output must include only two fields:
1. task_type
2. subject_area

Allowed task_type values:
["explanation", "factual_lookup", "writing_generation", "revision", "problem_solving", "coding_help", "summarization", "brainstorming", "argumentation", "translation", "unknown"]

Use these rules carefully:
- explanation: asks AI to teach, explain, clarify, define a concept, process, or relationship
- factual_lookup: asks for a fact, date, statistic, definition, person, place, event, or direct answer
- writing_generation: asks AI to draft or compose new writing for an assignment or submission
- revision: asks AI to improve, polish, shorten, expand, or rewrite existing writing
- problem_solving: asks AI to solve a math, science, logic, or step-based problem
- coding_help: asks AI to write, debug, explain, or fix code
- summarization: asks AI to condense, outline, or synthesize reading or source material
- brainstorming: asks AI for ideas, options, topics, titles, plans, or possibilities
- argumentation: asks AI to support, critique, or build an argument or claim
- translation: asks AI to translate or explain language meaning/grammar
- unknown: unclear, mixed, or does not fit the categories

Allowed subject_area values:
["math", "science", "writing", "coding", "social_studies", "language_learning", "general"]

Use the latest prompt and the AI output excerpt as the strongest signal. If it's ambiguous, choose the closest category with the best evidence.

Return only valid JSON:
{
  "task_type": "...",
  "subject_area": "..."
}`;

  const ROUTING = {
    explanation: {
      cognitive_risk: "passive comprehension",
      intervention_family: "active_recall"
    },
    factual_lookup: {
      cognitive_risk: "hallucination risk",
      intervention_family: "verification"
    },
    information_lookup: {
      cognitive_risk: "hallucination risk",
      intervention_family: "verification"
    },
    writing_generation: {
      cognitive_risk: "authorship loss",
      intervention_family: "authorship_reflection"
    },
    revision: {
      cognitive_risk: "loss of voice",
      intervention_family: "revision_comparison"
    },
    problem_solving: {
      cognitive_risk: "reasoning bypass",
      intervention_family: "step_reconstruction"
    },
    coding_help: {
      cognitive_risk: "debugging bypass",
      intervention_family: "error_explanation"
    },
    summarization: {
      cognitive_risk: "shallow synthesis",
      intervention_family: "main_idea_recall"
    },
    brainstorming: {
      cognitive_risk: "passive idea acceptance",
      intervention_family: "selection_rationale"
    },
    argumentation: {
      cognitive_risk: "one-sided reasoning",
      intervention_family: "counterargument"
    },
    translation: {
      cognitive_risk: "language-learning bypass",
      intervention_family: "meaning_grammar_check"
    },
    unknown: {
      cognitive_risk: "general overreliance",
      intervention_family: "general_reflection"
    }
  };

  const ALLOWED_TASKS = Object.keys(ROUTING);
  const ALLOWED_RISKS = ["low", "medium", "high"];

  const TASK_BYPASS_SCORE = {
    factual_lookup: 0,
    explanation: 1,
    revision: 1,
    summarization: 1,
    brainstorming: 1,
    translation: 1,
    unknown: 1,
    writing_generation: 2,
    problem_solving: 2,
    argumentation: 2,
    coding_help: 1,
    default: 1
  };

  const TASK_RULES = {
    explanation: {
      student_goal: "understand_concept",
      cognitive_process: "comprehension",
      intervention_family: "active_recall",
      cognitive_risk: "passive comprehension"
    },
    factual_lookup: {
      student_goal: "verify_claim",
      cognitive_process: "evidence_checking",
      intervention_family: "verification",
      cognitive_risk: "hallucination risk"
    },
    writing_generation: {
      student_goal: "compose_own_response",
      cognitive_process: "authorship",
      intervention_family: "authorship_reflection",
      cognitive_risk: "authorship loss"
    },
    revision: {
      student_goal: "keep_own_voice",
      cognitive_process: "comparison",
      intervention_family: "revision_comparison",
      cognitive_risk: "loss of voice"
    },
    problem_solving: {
      student_goal: "reconstruct_reasoning",
      cognitive_process: "step_tracking",
      intervention_family: "step_reconstruction",
      cognitive_risk: "reasoning bypass"
    },
    coding_help: {
      student_goal: "understand_bug",
      cognitive_process: "debugging",
      intervention_family: "error_explanation",
      cognitive_risk: "debugging bypass"
    },
    summarization: {
      student_goal: "identify_main_idea",
      cognitive_process: "synthesis",
      intervention_family: "main_idea_recall",
      cognitive_risk: "shallow synthesis"
    },
    brainstorming: {
      student_goal: "evaluate_options",
      cognitive_process: "selection",
      intervention_family: "selection_rationale",
      cognitive_risk: "passive idea acceptance"
    },
    argumentation: {
      student_goal: "weigh_evidence",
      cognitive_process: "argument_evaluation",
      intervention_family: "counterargument",
      cognitive_risk: "one-sided reasoning"
    },
    translation: {
      student_goal: "understand_meaning",
      cognitive_process: "language_analysis",
      intervention_family: "meaning_grammar_check",
      cognitive_risk: "language-learning bypass"
    },
    unknown: {
      student_goal: "reflect_on_use",
      cognitive_process: "responsible_use",
      intervention_family: "general_reflection",
      cognitive_risk: "general overreliance"
    }
  };

  function normalizeTaskType(taskType) {
    if (!taskType) {
      return "unknown";
    }
    const normalized = String(taskType).trim();
    if (normalized === "information_lookup") {
      return "factual_lookup";
    }
    return ALLOWED_TASKS.includes(normalized) ? normalized : "unknown";
  }

  function applyTaskTypeRules(taskType) {
    const normalizedTaskType = normalizeTaskType(taskType);
    return TASK_RULES[normalizedTaskType] || TASK_RULES.unknown;
  }

  function estimateReadingTimeSeconds(text) {
    if (!text || !String(text).trim()) {
      return 0;
    }

    const wordCount = String(text)
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    if (!wordCount) {
      return 0;
    }

    return (wordCount / 238) * 60;
  }

  function getCopyProportionScore(selectedTextLength, fullAiResponseLength) {
    const selectedLength = Number(selectedTextLength) || 0;
    const fullLength = Number(fullAiResponseLength) || 0;

    if (!fullLength || !selectedLength) {
      return 1;
    }

    const ratio = selectedLength / fullLength;
    if (ratio > 0.75) {
      return 2;
    }
    if (ratio >= 0.25) {
      return 1;
    }
    return 0;
  }

  function getCopyLatencyScore(timeBeforeCopySeconds, selectedText) {
    if (!Number.isFinite(timeBeforeCopySeconds) || timeBeforeCopySeconds < 0) {
      return 1;
    }

    const readingTimeSeconds = estimateReadingTimeSeconds(selectedText);
    if (!readingTimeSeconds) {
      return 1;
    }

    const ratio = timeBeforeCopySeconds / readingTimeSeconds;
    if (ratio >= 0.75) {
      return 0;
    }
    if (ratio >= 0.25) {
      return 1;
    }
    return 2;
  }

  function getTaskBypassScore(taskType) {
    const normalizedTaskType = normalizeTaskType(taskType);
    return TASK_BYPASS_SCORE[normalizedTaskType] ?? TASK_BYPASS_SCORE.default;
  }

  function deriveRiskLevelFromScore(score) {
    // Apply the manuscript's two-decimal bands to a two-decimal score.
    const bandScore = Math.round(score * 100) / 100;
    if (bandScore <= 0.33) {
      return "low";
    }
    if (bandScore <= 0.66) {
      return "medium";
    }
    return "high";
  }

  function computeOffloadingRisk(context, taskType) {
    const selectedTextLength = Number(context.selected_text_length) || 0;
    const aiResponseLength = Number(context.ai_response_length) || 0;
    const timeBeforeCopySeconds = context.time_since_response == null
      ? NaN : Number(context.time_since_response);
    const selectedText = context.selected_text || context.selected_text_for_classification || "";

    const copyProportionScore = getCopyProportionScore(selectedTextLength, aiResponseLength);
    const copyLatencyScore = getCopyLatencyScore(timeBeforeCopySeconds, selectedText);
    const taskScore = getTaskBypassScore(taskType);
    const rawScore = (copyProportionScore + copyLatencyScore + taskScore) / 6;
    const normalizedScore = Math.max(0, Math.min(1, rawScore));
    const riskLevel = deriveRiskLevelFromScore(normalizedScore);

    return {
      risk_score: normalizedScore,
      risk_score_rounded: Number(normalizedScore.toFixed(2)),
      risk_level: riskLevel,
      copy_proportion_score: copyProportionScore,
      copy_latency_score: copyLatencyScore,
      task_score: taskScore,
      offloading_risk: riskLevel
    };
  }

  function classificationFromTaskType(taskType, options = {}) {
    const normalizedTaskType = normalizeTaskType(taskType);
    const route = applyTaskTypeRules(normalizedTaskType);
    const riskLevel = ALLOWED_RISKS.includes(options.risk_level)
      ? options.risk_level
      : "medium";

    return {
      task_type: normalizedTaskType,
      subject_area: options.subject_area || "general",
      student_goal: options.student_goal || route.student_goal,
      cognitive_process: options.cognitive_process || route.cognitive_process,
      intervention_family: options.intervention_family || route.intervention_family,
      cognitive_risk: route.cognitive_risk,
      risk_level: riskLevel,
      risk_score: Number.isFinite(options.risk_score) ? Number(options.risk_score) : 0.5,
      offloading_risk: ALLOWED_RISKS.includes(options.offloading_risk)
        ? options.offloading_risk
        : riskLevel,
      risk_factors: Array.isArray(options.risk_factors)
        ? options.risk_factors.map(String).slice(0, 5)
        : [],
      reason: options.reason || "The intervention was routed through the Before You Copy task map.",
      classification_source: options.classification_source || "manual_task_choice",
      requires_task_choice: Boolean(options.requires_task_choice)
    };
  }

  function sanitizeClassification(result) {
    const taskType = normalizeTaskType(result.task_type);
    const route = applyTaskTypeRules(taskType);
    const riskLevel = ALLOWED_RISKS.includes(result.risk_level)
      ? result.risk_level
      : "medium";

    return {
      task_type: taskType,
      subject_area: result.subject_area || "general",
      student_goal: result.student_goal || route.student_goal,
      cognitive_process: result.cognitive_process || route.cognitive_process,
      intervention_family: result.intervention_family || route.intervention_family,
      cognitive_risk: route.cognitive_risk,
      risk_level: riskLevel,
      risk_score: Number.isFinite(result.risk_score) ? Number(result.risk_score) : 0.5,
      offloading_risk: ALLOWED_RISKS.includes(result.offloading_risk)
        ? result.offloading_risk
        : riskLevel,
      risk_factors: Array.isArray(result.risk_factors)
        ? result.risk_factors.map(String).slice(0, 5)
        : [],
      reason: result.reason || "The copy event needs a brief responsible-use reflection.",
      classification_source: result.classification_source || "llm",
      requires_task_choice: false
    };
  }

  function fallbackClassification(error) {
    const route = applyTaskTypeRules("unknown");
    return {
      task_type: "unknown",
      subject_area: "general",
      student_goal: route.student_goal,
      cognitive_process: route.cognitive_process,
      intervention_family: route.intervention_family,
      cognitive_risk: route.cognitive_risk,
      risk_level: "medium",
      risk_score: 0.5,
      offloading_risk: "medium",
      risk_factors: ["LLM classification unavailable"],
      reason: error && error.message === "LLM_NOT_CONFIGURED"
        ? "No LLM access is configured, so the extension needs the student to choose the closest task type."
        : "The classifier was unavailable, so the extension needs the student to choose the closest task type.",
      llm_error: error ? error.message : "",
      classification_source: "fallback",
      requires_task_choice: true
    };
  }

  async function classifyCopyEvent(context) {
    const payload = {
      student_prompt: context.student_prompt || context.latest_user_prompt_excerpt || "",
      ai_response_excerpt: context.ai_response_excerpt || context.last_ai_output_excerpt || "",
      selected_text: context.selected_text || context.selected_text_for_classification || "",
      event_type: context.event_type || "copy",
      time_since_response: context.time_since_response ?? null,
      selected_text_length: Number.isFinite(context.selected_text_length)
        ? context.selected_text_length
        : 0,
      user_mode: context.user_mode || context.selected_mode || "medium"
    };

    if (!payload.selected_text && context.selected_text_for_classification) {
      payload.selected_text = context.selected_text_for_classification;
    }

    try {
      const result = await root.llmClient.callJson({
        task: "copy_event_classifier",
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: JSON.stringify(payload, null, 2),
        temperature: 0.1
      });

      const llmClassification = sanitizeClassification(result || {});
      const ruleBased = applyTaskTypeRules(llmClassification.task_type);
      const riskDetails = computeOffloadingRisk({
        selected_text_length: payload.selected_text_length,
        ai_response_length: context.ai_response_length ?? (payload.ai_response_excerpt || "").length,
        time_since_response: payload.time_since_response,
        selected_text: context.selected_text_for_risk ?? payload.selected_text ?? ""
      }, llmClassification.task_type);

      const finalClassification = {
        ...llmClassification,
        student_goal: llmClassification.student_goal || ruleBased.student_goal,
        cognitive_process: llmClassification.cognitive_process || ruleBased.cognitive_process,
        intervention_family: llmClassification.intervention_family || ruleBased.intervention_family,
        cognitive_risk: llmClassification.cognitive_risk || ruleBased.cognitive_risk,
        risk_score: riskDetails.risk_score,
        risk_score_rounded: riskDetails.risk_score_rounded,
        risk_level: riskDetails.risk_level,
        offloading_risk: riskDetails.offloading_risk,
        risk_factors: [
          `copy_proportion_score:${riskDetails.copy_proportion_score}`,
          `copy_latency_score:${riskDetails.copy_latency_score}`,
          `task_score:${riskDetails.task_score}`
        ],
        reason: llmClassification.reason || "The task was classified by the model and mapped to the rule-based intervention family."
      };

      return finalClassification;
    } catch (error) {
      console.warn("Before You Copy: classifier fallback used.", error);
      return fallbackClassification(error);
    }
  }

  root.classifier = {
    SYSTEM_PROMPT,
    TASK_BYPASS_SCORE,
    TASK_RULES,
    computeOffloadingRisk,
    deriveRiskLevelFromScore,
    estimateReadingTimeSeconds,
    ROUTING,
    classifyCopyEvent,
    sanitizeClassification,
    classificationFromTaskType
  };
})();
