(function () {
  const root = window.BeforeYouCopy || (window.BeforeYouCopy = {});

  const SYSTEM_PROMPT = `You are evaluating a student's brief reflection in a K-12 GenAI literacy scaffold.

This step happens immediately after the student answers the intervention prompt and before the extension unlocks copying.

Your job is twofold:
1) Score the response using the rubric below.
2) Generate brief, personalized, non-punitive feedback that helps the student improve their GenAI literacy.

Rubric:
0 for no meaningful engagement, including empty, irrelevant, or filler responses;
1 for partial engagement that is relevant but vague or incomplete; and
2 for meaningful engagement that is specific and complete.

The evaluator considers relevance, specificity, use of the student's own words, recognition of uncertainty or verification needs, and evidence of effort.

Return only valid JSON:
{
  "response_score": 2,
  "response_label": "meaningful",
  "reason": "The student identified the key issue and explained it in their own words.",
  "feedback": "Good - you explained the idea in your own words and noticed the important detail.",
  "unlock_recommendation": "allow"
}`;

  function clampScore(value) {
    const score = Number(value);
    if (!Number.isFinite(score)) {
      return 0;
    }
    return Math.max(0, Math.min(2, Math.round(score)));
  }

  function fallbackEvaluation(response, intervention, error) {
    const trimmed = (response || "").trim();
    const score = trimmed ? 1 : 0;
    return {
      response_score: score,
      response_label: trimmed ? "partial" : "empty",
      reason: error && error.message === "LLM_NOT_CONFIGURED"
        ? "No LLM evaluator is configured, so the extension used a minimal non-blocking fallback."
        : "The LLM evaluator was unavailable, so the extension used a minimal non-blocking fallback.",
      feedback: trimmed
        ? intervention.feedbackIfGood
        : "Try adding one specific detail before you copy.",
      unlock_recommendation: trimmed ? "allow" : "follow_up",
      llm_error: error ? error.message : ""
    };
  }

  function sanitizeEvaluation(result, intervention) {
    const score = clampScore(result.response_score);
    const label = score === 2 ? "meaningful" : score === 1 ? "partial" : "empty";
    return {
      response_score: score,
      response_label: result.response_label || label,
      reason: result.reason || "The response was evaluated with the GenAI literacy rubric.",
      feedback: result.feedback || (score >= 1
        ? intervention.feedbackIfGood
        : "Try adding one specific detail before you copy."),
      unlock_recommendation: result.unlock_recommendation || (score >= 1 ? "allow" : "follow_up")
    };
  }

  async function evaluateResponse(context) {
    const intervention = context.intervention;
    const payload = {
      intervention_family: context.intervention_family,
      cognitive_risk: context.cognitive_risk,
      risk_level: context.risk_level,
      mode: context.mode,
      application_question: context.application_question,
      student_response: context.student_response || "",
      rubric: "0 for no meaningful engagement, 1 for partial engagement that is relevant but vague or incomplete, 2 for meaningful engagement that is specific and complete"
    };

    try {
      const result = await root.llmClient.callJson({
        task: "reflection_evaluator",
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: JSON.stringify(payload, null, 2),
        temperature: 0.1
      });

      return sanitizeEvaluation(result, intervention);
    } catch (error) {
      console.warn("Before You Copy: evaluator fallback used.", error);
      return fallbackEvaluation(context.student_response, intervention, error);
    }
  }

  root.responseEvaluator = {
    SYSTEM_PROMPT,
    evaluateResponse,
    sanitizeEvaluation
  };
})();
