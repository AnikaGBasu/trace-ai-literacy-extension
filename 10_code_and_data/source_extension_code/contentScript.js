console.log("AI Extension: content script loaded (v4 - with debounce)");

const BYC_OVERLAY_ID = "before-you-copy-overlay";
const MAX_CLASSIFICATION_TEXT = 1500;
const MAX_AI_EXCERPT = 2000;
const CLASSIFIER_TIMEOUT_MS = 12000;
const EVALUATOR_TIMEOUT_MS = 12000;
const DEBUG_STATE_KEY = "beforeYouCopyDebugState";
const DEBUG_LOG_KEY = "beforeYouCopyDebugLog";

let saveTimer = null;
let modalOpen = false;
let programmaticCopyInProgress = false;
let copyBypassUntil = 0;
let suppressNextClick = false;
let lastAIResponseDetectedAt = null;
let lastUserPromptDetectedAt = null;

function nowIso() {
    return new Date().toISOString();
}

function extensionContextIsAvailable() {
    return Boolean(
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.id &&
        chrome.storage &&
        chrome.storage.local
    );
}

function updateDebugState(partialState, eventName, details) {
    if (!extensionContextIsAvailable()) {
        return;
    }

    const entry = {
        timestamp: nowIso(),
        event: eventName,
        details: details || {}
    };

    try {
        chrome.storage.local.get([DEBUG_STATE_KEY, DEBUG_LOG_KEY], (result) => {
            try {
                if (!extensionContextIsAvailable() || chrome.runtime.lastError) {
                    return;
                }

                const currentState = result[DEBUG_STATE_KEY] || {};
                const currentLog = Array.isArray(result[DEBUG_LOG_KEY]) ? result[DEBUG_LOG_KEY] : [];
                const nextState = Object.assign({}, currentState, partialState || {}, {
                    last_event: eventName,
                    last_event_at: entry.timestamp,
                    last_event_details: entry.details
                });

                currentLog.push(entry);
                chrome.storage.local.set({
                    [DEBUG_STATE_KEY]: nextState,
                    [DEBUG_LOG_KEY]: currentLog.slice(-80)
                });
            } catch (error) {
                // A reloaded extension invalidates existing content-script contexts.
            }
        });
    } catch (error) {
        console.warn("Before You Copy debug write failed.", error);
    }
}

function getAssistantDetectionSnapshot() {
    const roleNodes = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
    const markdownNodes = Array.from(document.querySelectorAll('[data-message-author-role="assistant"] .markdown'));
    const fallbackNodes = Array.from(document.querySelectorAll('main article, [data-testid^="conversation-turn-"]'))
        .filter((node) => {
            const text = (node.innerText || node.textContent || "").trim();
            return text.length > 20;
        });
    const lastRoleNode = roleNodes.length ? roleNodes[roleNodes.length - 1] : null;
    const lastMarkdownNode = lastRoleNode ? lastRoleNode.querySelector(".markdown") : null;
    const lastFallbackNode = fallbackNodes.length ? fallbackNodes[fallbackNodes.length - 1] : null;
    const selectedText = getCurrentSelectedPageText ? getCurrentSelectedPageText() : "";

    return {
        content_script_loaded: true,
        content_script_url: window.location.href,
        document_ready_state: document.readyState,
        role_node_count: roleNodes.length,
        markdown_node_count: markdownNodes.length,
        fallback_node_count: fallbackNodes.length,
        latest_role_text_length: lastRoleNode ? (lastRoleNode.innerText || lastRoleNode.textContent || "").trim().length : 0,
        latest_markdown_text_length: lastMarkdownNode ? (lastMarkdownNode.innerText || lastMarkdownNode.textContent || "").trim().length : 0,
        latest_fallback_text_length: lastFallbackNode ? (lastFallbackNode.innerText || lastFallbackNode.textContent || "").trim().length : 0,
        selected_text_length: selectedText.length,
        modal_open: modalOpen,
        body_text_length: (document.body && (document.body.innerText || document.body.textContent || "").trim().length) || 0
    };
}

updateDebugState({
    content_script_loaded: true,
    content_script_loaded_at: nowIso(),
    content_script_url: window.location.href,
    document_ready_state: document.readyState
}, "content_script_loaded");

function getLastAssistantMessage() {
    const detection = getAssistantDetectionSnapshot();
    // Select ALL assistant message containers
    const nodes = document.querySelectorAll('[data-message-author-role="assistant"]');
    let last = null;
    if (nodes.length === 0) {
        const fallbackNodes = Array.from(document.querySelectorAll('main article, [data-testid^="conversation-turn-"]'))
            .filter((node) => {
                const text = (node.innerText || node.textContent || "").trim();
                return text.length > 20;
            });

        if (fallbackNodes.length === 0) {
            updateDebugState(Object.assign({}, detection, {
                last_detection_result: "no_assistant_or_fallback_nodes",
                last_selector_used: "none",
                last_extracted_length: 0
            }), "assistant_scan_no_nodes");
            return null;
        }

        last = fallbackNodes[fallbackNodes.length - 1];
        console.log("AI Ext: Assistant role selector not found; using fallback conversation node.");
    } else {
        // Take the LAST one (latest response)
        last = nodes[nodes.length - 1];
    }

    // Find the text content inside the standard markdown container
    const content = last.querySelector('.markdown');
    const text = content
        ? content.innerText.trim()
        : last.innerText.trim();
    if (!text) {
        console.log("AI Ext: Assistant container found, but no readable text yet.");
        updateDebugState(Object.assign({}, detection, {
            last_detection_result: "node_found_but_empty",
            last_selector_used: content ? "assistant .markdown" : "assistant container or fallback",
            last_extracted_length: 0
        }), "assistant_scan_empty_text");
        return null;
    }

    updateDebugState(Object.assign({}, detection, {
        last_detection_result: "text_found",
        last_selector_used: content ? "assistant .markdown" : "assistant container or fallback",
        last_extracted_length: text.length
    }), "assistant_scan_text_found");
    console.log("AI Ext: Extracted text:", text.slice(0, 200));
    return text;
}

function getLastUserMessage() {
    const nodes = document.querySelectorAll('[data-message-author-role="user"]');
    if (nodes.length === 0) {
        return null;
    }

    const last = nodes[nodes.length - 1];
    const content = last.querySelector('.whitespace-pre-wrap, .break-words') || last;
    const text = (content.innerText || content.textContent || "").trim();
    if (!text) {
        return null;
    }

    console.log("AI Ext: Extracted latest user prompt:", text.slice(0, 120));
    return text;
}

function saveLatest() {
    const text = getLastAssistantMessage();
    if (!text) {
        console.log("AI Ext: No text found, not saving.");
        updateDebugState({
            last_save_result: "not_saved_no_text",
            last_save_attempt_at: nowIso()
        }, "save_latest_no_text");
        return null;
    }

    if (!extensionContextIsAvailable()) {
        console.warn("AI Ext: Extension context unavailable. Refresh the ChatGPT tab after reloading the extension.");
        return null;
    }

    try {
        const savedAt = new Date().toISOString();
        const savedAtMs = new Date(savedAt).getTime();
        lastAIResponseDetectedAt = savedAtMs;

        chrome.storage.local.set({
            lastAIOutput: text,
            lastAIOutputTimestamp: savedAt
        }, () => {
            if (chrome.runtime.lastError) {
                console.warn("AI Ext: Could not save lastAIOutput:", chrome.runtime.lastError.message);
                return;
            }

            console.log("AI Ext: Saved lastAIOutput to storage.");
            const userPrompt = getLastUserMessage();
            if (userPrompt) {
                lastUserPromptDetectedAt = savedAtMs;
                chrome.storage.local.set({
                    lastUserPrompt: userPrompt,
                    lastUserPromptTimestamp: savedAt
                });
            }
            updateDebugState({
                last_save_result: "saved",
                last_save_attempt_at: savedAt,
                last_saved_length: text.length,
                last_user_prompt_length: userPrompt ? userPrompt.length : 0,
                last_ai_output_timestamp: savedAt,
                last_ai_response_detected_at_ms: savedAtMs,
                last_user_prompt_detected_at_ms: lastUserPromptDetectedAt
            }, "save_latest_saved", { length: text.length, saved_at: savedAt });
        });
    } catch (error) {
        console.warn("AI Ext: Save failed because the extension context is unavailable. Refresh ChatGPT.", error);
        return null;
    }
    return text;
}

function normalizeForMatch(text) {
    return String(text || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function getExactCopyLikelihood(selectedText, lastAIOutput) {
    const selected = normalizeForMatch(selectedText);
    const output = normalizeForMatch(lastAIOutput);

    if (!selected || !output) {
        return "uncertain";
    }

    return output.includes(selected) ? "likely" : "uncertain";
}

function secondsSince(earlierIso, laterIso) {
    if (!earlierIso) {
        return null;
    }

    const earlier = new Date(earlierIso).getTime();
    const later = new Date(laterIso).getTime();
    if (!Number.isFinite(earlier) || !Number.isFinite(later)) {
        return null;
    }

    return Math.max(0, Math.round((later - earlier) / 1000));
}

function nodeIsInside(parent, node) {
    if (!parent || !node) {
        return false;
    }

    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return Boolean(element && parent.contains(element));
}

function selectionIsInsideModal(selection) {
    const overlay = document.getElementById(BYC_OVERLAY_ID);
    if (!overlay || !selection) {
        return false;
    }

    return nodeIsInside(overlay, selection.anchorNode) ||
        nodeIsInside(overlay, selection.focusNode);
}

function getCurrentSelectedPageText() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selectionIsInsideModal(selection)) {
        return "";
    }

    return selection.toString().trim();
}

function getButtonLikeElement(target) {
    if (!target || target.nodeType !== Node.ELEMENT_NODE) {
        return null;
    }

    return target.closest("button, [role='button']");
}

function isLikelyCopyButton(button) {
    if (!button || isBeforeYouCopyNode(button)) {
        return false;
    }

    const signal = [
        button.getAttribute("aria-label"),
        button.getAttribute("title"),
        button.getAttribute("data-testid"),
        button.getAttribute("data testid"),
        button.textContent
    ].filter(Boolean).join(" ").toLowerCase();

    return /\bcopy\b/.test(signal);
}

function findCodeTextNearButton(button) {
    let node = button;
    let depth = 0;

    while (node && depth < 8) {
        if (node.querySelectorAll) {
            const codeNodes = node.querySelectorAll("pre code, pre");
            for (const codeNode of codeNodes) {
                const text = (codeNode.innerText || codeNode.textContent || "").trim();
                if (text) {
                    return text;
                }
            }
        }

        node = node.parentElement;
        depth += 1;
    }

    return "";
}

function findAssistantTextNearButton(button) {
    const directAssistant = button.closest('[data-message-author-role="assistant"]');
    if (directAssistant) {
        const content = directAssistant.querySelector(".markdown") || directAssistant;
        const text = (content.innerText || content.textContent || "").trim();
        if (text) {
            return text;
        }
    }

    const article = button.closest("article");
    if (article) {
        const content = article.querySelector('[data-message-author-role="assistant"] .markdown, [data-message-author-role="assistant"]');
        const text = content ? (content.innerText || content.textContent || "").trim() : "";
        if (text) {
            return text;
        }
    }

    return getLastAssistantMessage() || "";
}

function getTextForCopyButton(button) {
    const selectedText = getCurrentSelectedPageText();
    if (selectedText) {
        return selectedText;
    }

    const signal = [
        button.getAttribute("aria-label"),
        button.getAttribute("title"),
        button.textContent
    ].filter(Boolean).join(" ").toLowerCase();

    if (signal.includes("code")) {
        const codeText = findCodeTextNearButton(button);
        if (codeText) {
            return codeText;
        }
    }

    return findAssistantTextNearButton(button);
}

function isBeforeYouCopyNode(node) {
    if (!node) {
        return false;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        return node.id === BYC_OVERLAY_ID || Boolean(node.closest(`#${BYC_OVERLAY_ID}`));
    }

    return Boolean(node.parentElement && node.parentElement.closest(`#${BYC_OVERLAY_ID}`));
}

function clearNode(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    if (text !== undefined && text !== null) {
        element.textContent = text;
    }
    return element;
}

function withTimeout(promise, timeoutMs, message) {
    let timeoutId = null;
    const timeout = new Promise((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => {
        if (timeoutId) {
            window.clearTimeout(timeoutId);
        }
    });
}

function timeoutClassification(error) {
    return window.BeforeYouCopy.classifier.classificationFromTaskType("unknown", {
        risk_level: "medium",
        risk_factors: ["LLM classification timed out"],
        reason: error.message || "The classifier took too long, so the extension needs the student to choose the closest task type.",
        classification_source: "timeout",
        requires_task_choice: true
    });
}

function getInterventionMode(settings) {
    return settings && settings.interventionMode === "as_needed" ? "as_needed" : "constant";
}

function shouldShowIntervention(copyContext) {
    if (getInterventionMode(copyContext.settings) === "constant") {
        return true;
    }

    return copyContext.classification && copyContext.classification.risk_level === "high";
}

function timeoutEvaluation(studentResponse, intervention, error) {
    const hasResponse = Boolean((studentResponse || "").trim());
    return {
        response_score: hasResponse ? 1 : 0,
        response_label: hasResponse ? "partial" : "empty",
        reason: error.message || "The evaluator took too long, so a non-blocking fallback was used.",
        feedback: hasResponse ? intervention.feedbackIfGood : "Try adding one specific detail before you copy.",
        unlock_recommendation: hasResponse ? "allow" : "follow_up"
    };
}

function createModalShell() {
    const overlay = createElement("div");
    overlay.id = BYC_OVERLAY_ID;
    overlay.dataset.beforeYouCopyModal = "true";

    const panel = createElement("div", "byc-panel");
    const header = createElement("div", "byc-header");
    const title = createElement("h2", "byc-title", "Pause before using this AI output");
    const subtitle = createElement("p", "byc-subtitle", "This is a quick reflection to help you use GenAI responsibly.");
    const body = createElement("div", "byc-body");

    header.append(title, subtitle);
    panel.append(header, body);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    return { overlay, body };
}

function removeModal() {
    const overlay = document.getElementById(BYC_OVERLAY_ID);
    if (overlay) {
        overlay.remove();
    }
    modalOpen = false;
}

function renderLoadingModal(shell) {
    clearNode(shell.body);
    const text = createElement("p", "byc-text", "Preparing a short reflection...");
    shell.body.appendChild(text);
}

function renderExtensionContextError(shell, error) {
    clearNode(shell.body);

    const title = createElement("h3", "byc-family", "Extension refresh needed");
    const bodyText = createElement("p", "byc-text", "The extension context was invalidated while the page was open. Refresh this ChatGPT tab or reload the extension to resume the reflection prompt.");
    const hint = createElement("p", "byc-text", "If you just reloaded the extension, a page refresh is the quickest fix.");
    const actions = createElement("div", "byc-actions");
    const reloadButton = createElement("button", "byc-button", "Reload page");
    const dismissButton = createElement("button", "byc-button byc-button-secondary", "Close");

    reloadButton.addEventListener("click", () => {
        window.location.reload();
    });
    dismissButton.addEventListener("click", () => {
        removeModal();
    });

    actions.append(reloadButton, dismissButton);
    shell.body.append(title, bodyText, hint, actions);

    if (error && error.message) {
        const detail = createElement("p", "byc-text", `Details: ${error.message}`);
        detail.style.marginTop = "10px";
        detail.style.opacity = "0.8";
        shell.body.appendChild(detail);
    }
}

function getSelectedRadioValue(container) {
    const selected = container.querySelector("input[type='radio']:checked");
    return selected ? selected.value : "";
}

function appendWhySection(body, classification) {
    const details = createElement("details", "byc-details");
    const summary = createElement("summary", "", "Why am I seeing this?");
    const text = createElement("p", "", "Before You Copy appears when you copy text from a generative AI page. It is designed to support reflection and learning. It does not permanently block copying.");
    details.append(summary, text);
    if (classification && classification.reason) {
        const reason = createElement("p", "", `Classifier reason: ${classification.reason}`);
        details.appendChild(reason);
    }
    body.appendChild(details);
}

const TASK_TYPE_CHOICES = [
    {
        taskType: "explanation",
        label: "Explanation",
        description: "The AI is explaining a concept or idea."
    },
    {
        taskType: "factual_lookup",
        label: "Factual Lookup",
        description: "The AI gives facts, dates, claims, sources, or statistics."
    },
    {
        taskType: "writing_generation",
        label: "Writing Generation",
        description: "The AI drafted wording that could become final writing."
    },
    {
        taskType: "revision",
        label: "Revision",
        description: "The AI edited or improved writing you already had."
    },
    {
        taskType: "problem_solving",
        label: "Problem Solving",
        description: "The AI solved a math, science, or reasoning problem."
    },
    {
        taskType: "coding_help",
        label: "Coding Help",
        description: "The AI wrote, fixed, or explained code."
    },
    {
        taskType: "summarization",
        label: "Summarization",
        description: "The AI condensed information into a summary."
    },
    {
        taskType: "brainstorming",
        label: "Brainstorming",
        description: "The AI generated ideas or options."
    },
    {
        taskType: "argumentation",
        label: "Argumentation",
        description: "The AI made a claim, argument, or persuasive case."
    },
    {
        taskType: "translation",
        label: "Translation",
        description: "The AI translated text or explained language choices."
    },
    {
        taskType: "unknown",
        label: "Not Sure",
        description: "Use the general responsible-use reflection."
    }
];

function formatTaskType(taskType) {
    const choice = TASK_TYPE_CHOICES.find((item) => item.taskType === taskType);
    return choice ? choice.label : "Unknown";
}

async function writeSelectedTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch (error) {
            console.warn("Before You Copy: navigator.clipboard failed, trying fallback.", error);
        }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.left = "-1000px";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    programmaticCopyInProgress = true;
    const success = document.execCommand("copy");
    window.setTimeout(() => {
        programmaticCopyInProgress = false;
    }, 0);

    textarea.remove();

    if (!success) {
        throw new Error("Clipboard write failed.");
    }
}

async function logStudyEvent(state, clipboardError) {
    const storage = window.BeforeYouCopy.storage;
    const context = state.copyContext;
    const classification = context.classification;
    const log = {
        participant_id: await storage.ensureParticipantId(),
        event_id: context.eventId,
        timestamp: context.timestamp,
        url: context.pageUrl,
        selected_text_length: context.selectedText.length,
        time_since_response: context.timeSinceResponse,
        task_type: classification.task_type,
        cognitive_risk: classification.cognitive_risk,
        intervention_family: classification.intervention_family,
        risk_level: classification.risk_level,
        risk_factors: classification.risk_factors || [],
        intervention_mode: getInterventionMode(context.settings),
        intervention_shown: state.interventionShown !== false,
        intervention_decision: state.interventionDecision || "shown",
        mode: state.effectiveMode,
        selected_mode: context.settings.mode,
        response_score: state.responseScore,
        followup_used: state.followupUsed,
        skipped: state.skipped,
        skip_reason: state.skipReason || "",
        unlocked: state.unlocked,
        student_response: state.studentResponse || "",
        exact_copy_likelihood: context.exactCopyLikelihood
    };

    if (context.settings.saveSelectedExcerpts) {
        log.selected_text = context.selectedText;
    }

    if (clipboardError) {
        log.clipboard_error = clipboardError.message || String(clipboardError);
    }

    await storage.appendStudyLog(log);
}

async function finalizeCopyWithoutIntervention(copyContext) {
    const state = {
        copyContext,
        effectiveMode: window.BeforeYouCopy.unlockPolicy.resolveMode(
            copyContext.settings.mode,
            copyContext.classification.risk_level
        ),
        responseScore: null,
        followupUsed: false,
        skipped: false,
        skipReason: "",
        unlocked: true,
        studentResponse: "",
        interventionShown: false,
        interventionDecision: "allowed_risk_below_high"
    };

    try {
        await writeSelectedTextToClipboard(copyContext.selectedText);
        await logStudyEvent(state);
        updateDebugState({
            last_intervention_decision: state.interventionDecision,
            last_intervention_risk_level: copyContext.classification.risk_level,
            last_intervention_mode: getInterventionMode(copyContext.settings)
        }, "intervention_allowed_without_modal");
    } catch (error) {
        console.error("Before You Copy: clipboard write failed without intervention.", error);
        await logStudyEvent(state, error);
        copyBypassUntil = Date.now() + 10000;
        updateDebugState({
            last_intervention_decision: state.interventionDecision,
            last_intervention_risk_level: copyContext.classification.risk_level,
            last_intervention_mode: getInterventionMode(copyContext.settings),
            last_clipboard_error: error.message || String(error)
        }, "intervention_allowed_clipboard_failed");
    } finally {
        removeModal();
    }
}

async function finalizeCopy(state, feedbackBox, errorBox) {
    state.unlocked = true;
    errorBox.textContent = "";

    try {
        await writeSelectedTextToClipboard(state.copyContext.selectedText);
        await logStudyEvent(state);
        removeModal();
    } catch (error) {
        console.error("Before You Copy: clipboard write failed.", error);
        await logStudyEvent(state, error);
        copyBypassUntil = Date.now() + 10000;
        feedbackBox.classList.add("is-visible");
        errorBox.textContent = "The reflection is complete, but the clipboard write failed. Try copying again within the next 10 seconds.";
    }
}

function showFeedback(feedbackBox, evaluation, intervention, includeTakeaway) {
    clearNode(feedbackBox);

    const feedbackTitle = createElement("p", "byc-section-title", "Feedback");
    const feedbackText = createElement("p", "byc-text", evaluation.feedback || intervention.feedbackIfGood);
    feedbackBox.append(feedbackTitle, feedbackText);

    if (includeTakeaway) {
        const takeawayTitle = createElement("p", "byc-section-title", "Takeaway");
        const takeawayText = createElement("p", "byc-text", intervention.takeaway);
        takeawayTitle.style.marginTop = "12px";
        feedbackBox.append(takeawayTitle, takeawayText);
    }

    feedbackBox.classList.add("is-visible");
}

function renderSkipPanel(state, container, feedbackBox, errorBox, required) {
    clearNode(container);
    showFeedback(feedbackBox, {
        feedback: "Skipping is allowed. The goal is reflection, not punishment."
    }, state.intervention, true);

    const label = createElement("p", "byc-section-title", required ? "Reason" : "Optional Reason");
    const prompt = createElement("p", "byc-text", required
        ? "Briefly say why you want to continue now."
        : "You can add a short reason before continuing.");
    const textarea = createElement("textarea", "byc-textarea");
    textarea.placeholder = "Example: I only need a short phrase, or I will revise it later.";

    const actions = createElement("div", "byc-actions");
    const continueButton = createElement("button", "byc-button", "Continue / Copy");
    actions.appendChild(continueButton);

    container.append(label, prompt, textarea, actions);
    continueButton.addEventListener("click", () => {
        const reason = textarea.value.trim();
        if (required && !reason) {
            errorBox.textContent = "Add a short reason to continue in High mode.";
            return;
        }

        state.skipped = true;
        state.skipReason = reason;
        state.studentResponse = state.studentResponse || "";
        finalizeCopy(state, feedbackBox, errorBox);
    });
}

async function evaluateStudentResponse(state, studentResponse, question, feedbackBox, errorBox) {
    const evaluator = window.BeforeYouCopy.responseEvaluator;
    try {
        return await withTimeout(evaluator.evaluateResponse({
            intervention: state.intervention,
            intervention_family: state.copyContext.classification.intervention_family,
            cognitive_risk: state.copyContext.classification.cognitive_risk,
            risk_level: state.copyContext.classification.risk_level,
            mode: state.effectiveMode,
            application_question: question,
            student_response: studentResponse
        }), EVALUATOR_TIMEOUT_MS, "LLM evaluation timed out.");
    } catch (error) {
        console.warn("Before You Copy: evaluator timeout fallback used.", error);
        return timeoutEvaluation(studentResponse, state.intervention, error);
    }
}

function renderFollowup(state, inputContainer, feedbackBox, errorBox) {
    clearNode(inputContainer);
    state.followupUsed = true;

    const title = createElement("p", "byc-section-title", "Follow-Up");
    const followupQuestion = state.effectiveMode === "high" && !state.additionalStepCompleted
        ? `${state.intervention.followup}\nAdditional check: ${state.intervention.highExtra}`
        : state.intervention.followup;
    const prompt = createElement("p", "byc-text", followupQuestion);
    const textarea = createElement("textarea", "byc-textarea");
    const actions = createElement("div", "byc-actions");
    const submitButton = createElement("button", "byc-button", "Submit Follow-Up");
    const skipButton = createElement("button", "byc-button byc-button-secondary", "Skip for Now");

    actions.append(submitButton, skipButton);
    inputContainer.append(title, prompt, textarea, actions);

    submitButton.addEventListener("click", async () => {
        const followupResponse = textarea.value.trim();
        if (!followupResponse) {
            errorBox.textContent = "Add a quick follow-up response or use Skip for Now.";
            return;
        }

        errorBox.textContent = "";
        submitButton.disabled = true;
        submitButton.textContent = "Checking...";

        const combinedResponse = [state.studentResponse, followupResponse].filter(Boolean).join("\nFollow-up: ");
        const evaluationQuestion = state.effectiveMode === "high"
            ? `${state.intervention.apply}\nAdditional check: ${state.intervention.highExtra}\nFollow-up: ${followupQuestion}`
            : followupQuestion;
        const evaluation = await evaluateStudentResponse(
            state,
            combinedResponse,
            evaluationQuestion,
            feedbackBox,
            errorBox
        );

        state.responseScore = evaluation.response_score;
        state.studentResponse = combinedResponse;
        showFeedback(feedbackBox, evaluation, state.intervention, true);

        const decision = window.BeforeYouCopy.unlockPolicy.decide({
            mode: state.effectiveMode,
            response_score: evaluation.response_score,
            followup_used: true,
            additional_step_completed: state.additionalStepCompleted || evaluation.response_score === 2,
            skipped: false
        });

        if (decision.action === "unlock") {
            renderContinuePanel(state, inputContainer, feedbackBox, errorBox);
        } else {
            renderSkipPanel(state, inputContainer, feedbackBox, errorBox, false);
        }
    });

    skipButton.addEventListener("click", () => {
        renderSkipPanel(state, inputContainer, feedbackBox, errorBox, false);
    });
}

function renderContinuePanel(state, inputContainer, feedbackBox, errorBox) {
    clearNode(inputContainer);
    const text = createElement("p", "byc-text", "Your reflection is complete.");
    const actions = createElement("div", "byc-actions");
    const continueButton = createElement("button", "byc-button", "Continue / Copy");

    actions.appendChild(continueButton);
    inputContainer.append(text, actions);

    continueButton.addEventListener("click", () => {
        finalizeCopy(state, feedbackBox, errorBox);
    });
}

function renderMainInput(state, inputContainer, feedbackBox, errorBox) {
    const applyTitle = createElement("p", "byc-section-title", "Apply");
    const applyText = createElement("p", "byc-text", state.intervention.apply);
    const responseArea = createElement("div");
    const actions = createElement("div", "byc-actions");
    const submitButton = createElement("button", "byc-button", "Submit Reflection");
    const skipButton = createElement("button", "byc-button byc-button-secondary", "Skip for Now");

    inputContainer.append(applyTitle, applyText, responseArea, actions);
    actions.append(submitButton, skipButton);

    let getResponse = null;
    let question = state.intervention.apply;
    let additionalStepCompleted = () => true;

    if (state.effectiveMode === "gentle") {
        const questionText = createElement("p", "byc-text", state.intervention.gentleQuestion);
        const options = createElement("div", "byc-options");
        const name = `byc-option-${state.copyContext.eventId}`;

        state.intervention.gentleOptions.forEach((option) => {
            const label = createElement("label", "byc-option");
            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = name;
            radio.value = option;
            const span = createElement("span", "", option);
            label.append(radio, span);
            options.appendChild(label);
        });

        responseArea.append(questionText, options);
        question = state.intervention.gentleQuestion;
        getResponse = () => getSelectedRadioValue(options);
    } else {
        const textarea = createElement("textarea", "byc-textarea");
        textarea.placeholder = "Write one or two sentences.";
        responseArea.appendChild(textarea);

        if (state.effectiveMode === "high") {
            const extraTitle = createElement("p", "byc-section-title", "Additional Check");
            const extraPrompt = createElement("p", "byc-text", state.intervention.highExtra);
            const extraTextarea = createElement("textarea", "byc-textarea");
            extraTextarea.placeholder = "Add one more specific check.";
            additionalStepCompleted = () => Boolean(extraTextarea.value.trim());
            question = `${state.intervention.apply}\nAdditional check: ${state.intervention.highExtra}`;
            extraTitle.style.marginTop = "12px";
            responseArea.append(extraTitle, extraPrompt, extraTextarea);
            getResponse = () => {
                const main = textarea.value.trim();
                const extra = extraTextarea.value.trim();
                return [main, extra ? `Additional check: ${extra}` : ""].filter(Boolean).join("\n");
            };
        } else {
            getResponse = () => textarea.value.trim();
        }
    }

    submitButton.addEventListener("click", async () => {
        const studentResponse = getResponse();
        if (!studentResponse) {
            errorBox.textContent = state.effectiveMode === "gentle"
                ? "Choose one option or use Skip for Now."
                : "Add a quick reflection or use Skip for Now.";
            return;
        }

        errorBox.textContent = "";
        submitButton.disabled = true;
        submitButton.textContent = "Checking...";

        const evaluation = await evaluateStudentResponse(
            state,
            studentResponse,
            question,
            feedbackBox,
            errorBox
        );

        state.responseScore = evaluation.response_score;
        state.studentResponse = studentResponse;
        state.additionalStepCompleted = additionalStepCompleted();
        showFeedback(feedbackBox, evaluation, state.intervention, true);

        const decision = window.BeforeYouCopy.unlockPolicy.decide({
            mode: state.effectiveMode,
            response_score: evaluation.response_score,
            followup_used: false,
            additional_step_completed: additionalStepCompleted(),
            skipped: false
        });

        if (decision.action === "follow_up") {
            renderFollowup(state, inputContainer, feedbackBox, errorBox);
            return;
        }

        renderContinuePanel(state, inputContainer, feedbackBox, errorBox);
    });

    skipButton.addEventListener("click", () => {
        renderSkipPanel(state, inputContainer, feedbackBox, errorBox, false);
    });
}

function renderTaskTypeChooser(shell, copyContext) {
    clearNode(shell.body);

    const title = createElement("h3", "byc-family", "Choose the closest AI-use moment");
    const text = createElement("p", "byc-text", "The automatic classifier is unavailable or unsure. Pick the closest match so the reflection uses the right GenAI literacy scaffold.");
    const classifierIssue = createElement(
        "p",
        "byc-text",
        copyContext.classification.llm_error
            ? `Classifier issue: ${copyContext.classification.llm_error}`
            : copyContext.classification.reason
    );
    const options = createElement("div", "byc-options");
    const errorBox = createElement("div", "byc-error");
    const actions = createElement("div", "byc-actions");
    const continueButton = createElement("button", "byc-button", "Continue");
    const name = `byc-task-type-${copyContext.eventId}`;

    TASK_TYPE_CHOICES.forEach((choice) => {
        const label = createElement("label", "byc-option");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = name;
        radio.value = choice.taskType;

        const span = createElement("span");
        const strong = createElement("strong", "", choice.label);
        const description = createElement("span", "", ` - ${choice.description}`);
        span.append(strong, description);
        label.append(radio, span);
        options.appendChild(label);
    });

    actions.appendChild(continueButton);
    classifierIssue.style.marginTop = "8px";
    shell.body.append(title, text, classifierIssue, options, actions, errorBox);
    appendWhySection(shell.body, copyContext.classification);

    continueButton.addEventListener("click", () => {
        const taskType = getSelectedRadioValue(options);
        if (!taskType) {
            errorBox.textContent = "Choose the closest task type to continue.";
            return;
        }

        copyContext.classification = window.BeforeYouCopy.classifier.classificationFromTaskType(taskType, {
            risk_level: copyContext.classification.risk_level || "medium",
            risk_factors: [
                "student selected task type",
                `mapped to ${window.BeforeYouCopy.classifier.ROUTING[taskType].intervention_family}`
            ],
            reason: `Student selected ${taskType}; routed through the Before You Copy task map.`,
            classification_source: "manual_task_choice"
        });

        updateDebugState({
            manual_task_type_choice: taskType,
            manual_intervention_family: copyContext.classification.intervention_family
        }, "manual_task_type_choice", {
            task_type: taskType,
            intervention_family: copyContext.classification.intervention_family
        });

        renderInterventionModal(shell, copyContext);
    });
}

function renderDebugInputSummary(shell, copyContext) {
    const summary = createElement("div", "byc-section");
    summary.style.border = "1px solid rgba(255,255,255,0.15)";
    summary.style.borderRadius = "8px";
    summary.style.padding = "10px 12px";
    summary.style.margin = "12px 0";
    summary.style.background = "rgba(255,255,255,0.02)";

    const title = createElement("p", "byc-section-title", "Debug input");
    summary.appendChild(title);

    const rows = [
        ["student_prompt", copyContext.lastUserPromptExcerpt || ""],
        ["ai_response_excerpt", copyContext.lastAIOutputExcerpt || ""],
        ["selected_text", copyContext.selectedText || ""],
        ["event_type", "copy"],
        ["time_since_response", copyContext.timeSinceResponse != null ? `${copyContext.timeSinceResponse}s` : "n/a"],
        ["selected_text_length", String(copyContext.selectedText ? copyContext.selectedText.length : 0)],
        ["user_mode", copyContext.settings && copyContext.settings.mode ? copyContext.settings.mode : "medium"]
    ];

    rows.forEach(([label, value]) => {
        const row = document.createElement("div");
        row.style.display = "grid";
        row.style.gridTemplateColumns = "140px 1fr";
        row.style.columnGap = "8px";
        row.style.margin = "6px 0";
        row.style.fontSize = "12px";
        row.style.lineHeight = "1.5";

        const key = document.createElement("strong");
        key.textContent = `${label}:`;
        key.style.opacity = "0.9";

        const val = document.createElement("span");
        val.textContent = value || "";
        val.style.wordBreak = "break-word";

        row.append(key, val);
        summary.appendChild(row);
    });

    shell.body.appendChild(summary);
}

function renderClassificationDebugSummary(shell, copyContext) {
    const summary = createElement("div", "byc-section");
    summary.style.border = "1px solid rgba(255,255,255,0.2)";
    summary.style.borderRadius = "8px";
    summary.style.padding = "10px 12px";
    summary.style.margin = "12px 0";
    summary.style.background = "rgba(80, 140, 255, 0.06)";

    const title = createElement("p", "byc-section-title", "Classifier output");
    summary.appendChild(title);

    const classification = copyContext.classification || {};
    const rows = [
        ["task_type", classification.task_type || ""],
        ["subject_area", classification.subject_area || ""],
        ["student_goal", classification.student_goal || ""],
        ["cognitive_process", classification.cognitive_process || ""],
        ["intervention_family", classification.intervention_family || ""],
        ["cognitive_risk", classification.cognitive_risk || ""],
        ["offloading_risk", classification.offloading_risk || ""],
        ["risk_score", classification.risk_score != null ? String(classification.risk_score) : ""]
    ];

    rows.forEach(([label, value]) => {
        const row = document.createElement("div");
        row.style.display = "grid";
        row.style.gridTemplateColumns = "140px 1fr";
        row.style.columnGap = "8px";
        row.style.margin = "6px 0";
        row.style.fontSize = "12px";
        row.style.lineHeight = "1.5";

        const key = document.createElement("strong");
        key.textContent = `${label}:`;
        key.style.opacity = "0.9";

        const val = document.createElement("span");
        val.textContent = value || "";
        val.style.wordBreak = "break-word";

        row.append(key, val);
        summary.appendChild(row);
    });

    shell.body.appendChild(summary);
}

function renderChatContextHelper(copyContext) {
    const contextBox = createElement("div", "byc-context-box");
    const toggle = createElement("button", "byc-button byc-button-secondary byc-context-toggle", "See chat context");
    const panel = createElement("div", "byc-context-panel");
    const recentPrompt = createElement("div", "byc-context-card");
    const recentPromptTitle = createElement("p", "byc-context-label", "Recent prompt");
    const recentPromptText = createElement("p", "byc-text", copyContext.lastUserPromptExcerpt || "No recent prompt was detected.");
    const recentAnswer = createElement("div", "byc-context-card");
    const recentAnswerTitle = createElement("p", "byc-context-label", "Recent AI answer");
    const recentAnswerText = createElement("p", "byc-text", copyContext.lastAIOutputExcerpt || "No recent AI response was detected.");

    recentPrompt.append(recentPromptTitle, recentPromptText);
    recentAnswer.append(recentAnswerTitle, recentAnswerText);
    panel.append(recentPrompt, recentAnswer);
    panel.hidden = true;

    toggle.addEventListener("click", () => {
        const shouldShow = panel.hidden;
        panel.hidden = !shouldShow;
        toggle.textContent = shouldShow ? "Hide chat context" : "See chat context";
    });

    contextBox.append(toggle, panel);
    return contextBox;
}

function renderInterventionModal(shell, copyContext) {
    const byc = window.BeforeYouCopy;
    const classification = copyContext.classification;
    if (classification.requires_task_choice ||
        (classification.task_type === "unknown" && classification.classification_source !== "manual_task_choice")) {
        renderTaskTypeChooser(shell, copyContext);
        return;
    }

    const intervention = byc.interventions.getIntervention(classification.intervention_family);
    const effectiveMode = byc.unlockPolicy.resolveMode(copyContext.settings.mode, classification.risk_level);
    const state = {
        copyContext,
        intervention,
        effectiveMode,
        responseScore: null,
        followupUsed: false,
        skipped: false,
        skipReason: "",
        unlocked: false,
        studentResponse: "",
        interventionShown: true,
        interventionDecision: "shown"
    };

    clearNode(shell.body);

    const familyTitle = createElement("h3", "byc-family", intervention.title);
    const meta = createElement("div", "byc-meta");
    const modeChip = createElement("span", "byc-chip", `Mode: ${effectiveMode}`);
    const taskChip = createElement("span", "byc-chip", `Task: ${formatTaskType(classification.task_type)}`);
    const riskChip = createElement("span", "byc-chip", `Focus: ${classification.cognitive_risk}`);
    const teachSection = createElement("div", "byc-section");
    const teachTitle = createElement("p", "byc-section-title", "Teach");
    const teachText = createElement("p", "byc-text", intervention.teach);
    const chatHelper = renderChatContextHelper(copyContext);
    const inputContainer = createElement("div", "byc-section");
    const feedbackBox = createElement("div", "byc-feedback");
    const errorBox = createElement("div", "byc-error");

    meta.append(modeChip, taskChip, riskChip);
    teachSection.append(teachTitle, teachText);
    shell.body.append(familyTitle, meta, teachSection, chatHelper, inputContainer, feedbackBox, errorBox);

    renderMainInput(state, inputContainer, feedbackBox, errorBox);
    appendWhySection(shell.body, classification);
}

async function prepareCopyContext(selectedText, timestamp) {
    const byc = window.BeforeYouCopy;
    const storage = byc.storage;
    const [settings, latest, priorLowEffortResponses] = await Promise.all([
        storage.getSettings(),
        storage.getLastAIOutput(),
        storage.countPriorLowEffortResponses()
    ]);

    const lastAIOutput = latest.lastAIOutput || "";
    const lastResponseTimestampIsolated = latest.lastAIOutputTimestamp ||
        (lastAIResponseDetectedAt ? new Date(lastAIResponseDetectedAt).toISOString() : null);
    const exactCopyLikelihood = getExactCopyLikelihood(selectedText, lastAIOutput);
    const shouldSendSelectedText = settings.saveSelectedExcerpts || exactCopyLikelihood === "uncertain";
    const selectedTextForClassification = shouldSendSelectedText
        ? selectedText.slice(0, MAX_CLASSIFICATION_TEXT)
        : "";

    return {
        eventId: storage.generateId("event"),
        timestamp,
        pageUrl: window.location.href,
        selectedText,
        selectedTextForClassification,
        lastAIOutput,
        lastAIOutputExcerpt: lastAIOutput.slice(0, MAX_AI_EXCERPT),
        lastUserPrompt: latest.lastUserPrompt || "",
        lastUserPromptExcerpt: (latest.lastUserPrompt || "").slice(0, 800),
        timeSinceResponse: secondsSince(lastResponseTimestampIsolated, timestamp),
        exactCopyLikelihood,
        priorLowEffortResponses,
        settings
    };
}

async function runIntervention(selectedText) {
    const timestamp = new Date().toISOString();
    let shell = null;

    try {
        const copyContext = await prepareCopyContext(selectedText, timestamp);
        const interventionMode = getInterventionMode(copyContext.settings);
        if (interventionMode === "constant") {
            shell = createModalShell();
            renderLoadingModal(shell);
        }

        const classificationPayload = {
            student_prompt: copyContext.lastUserPromptExcerpt,
            ai_response_excerpt: copyContext.lastAIOutputExcerpt,
            selected_text: copyContext.selectedTextForClassification || selectedText.slice(0, MAX_CLASSIFICATION_TEXT),
            event_type: "copy",
            time_since_response: copyContext.timeSinceResponse,
            selected_text_length: selectedText.length,
            ai_response_length: copyContext.lastAIOutput.length,
            selected_text_for_risk: selectedText,
            user_mode: copyContext.settings.mode
        };

        try {
            copyContext.classification = await withTimeout(
                window.BeforeYouCopy.classifier.classifyCopyEvent(classificationPayload),
                CLASSIFIER_TIMEOUT_MS,
                "LLM classification timed out."
            );
        } catch (error) {
            console.warn("Before You Copy: classifier timeout fallback used.", error);
            copyContext.classification = timeoutClassification(error);
        }

        if (!shouldShowIntervention(copyContext)) {
            await finalizeCopyWithoutIntervention(copyContext);
            return;
        }

        if (!shell) {
            shell = createModalShell();
        }

        renderInterventionModal(shell, copyContext);
    } catch (error) {
        console.error("Before You Copy: could not start intervention.", error);
        if (shell) {
            const message = error && error.message ? error.message : String(error || "");
            if (message.includes("Extension context") || message.includes("invalidated") || message.includes("context is unavailable") || message.includes("chrome.runtime")) {
                renderExtensionContextError(shell, error);
                return;
            }
        }

        copyBypassUntil = Date.now() + 10000;
        removeModal();
        try {
            await writeSelectedTextToClipboard(selectedText);
        } catch (clipboardError) {
            console.error("Before You Copy: fallback copy failed.", clipboardError);
        }
    }
}

function handleCopyEvent(event) {
    updateDebugState({
        last_copy_event_at: nowIso(),
        last_copy_event_seen: true
    }, "copy_event_seen");

    if (programmaticCopyInProgress || Date.now() < copyBypassUntil) {
        updateDebugState({
            last_copy_event_ignored_reason: programmaticCopyInProgress ? "programmatic_copy" : "temporary_bypass"
        }, "copy_event_ignored");
        return;
    }

    const selectedText = getCurrentSelectedPageText();
    if (!selectedText) {
        updateDebugState({
            last_copy_event_ignored_reason: "empty_selection",
            selected_text_length: 0
        }, "copy_event_empty_selection");
        return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    if (modalOpen) {
        updateDebugState({
            last_copy_event_ignored_reason: "modal_already_open",
            selected_text_length: selectedText.length
        }, "copy_event_modal_already_open");
        return;
    }

    updateDebugState({
        last_copy_event_result: "starting_intervention",
        selected_text_length: selectedText.length
    }, "copy_event_starting_intervention");
    modalOpen = true;
    runIntervention(selectedText);
}

function handleCopyButtonPointerDown(event) {
    if (programmaticCopyInProgress || Date.now() < copyBypassUntil || modalOpen) {
        return;
    }

    const button = getButtonLikeElement(event.target);
    if (!isLikelyCopyButton(button)) {
        return;
    }

    updateDebugState({
        last_copy_button_pointerdown_at: nowIso(),
        last_copy_button_signal: [
            button.getAttribute("aria-label"),
            button.getAttribute("title"),
            button.getAttribute("data-testid"),
            button.textContent
        ].filter(Boolean).join(" ").slice(0, 120)
    }, "copy_button_pointerdown_seen");

    const textToCopy = getTextForCopyButton(button);
    if (!textToCopy) {
        updateDebugState({
            last_copy_button_result: "no_text_found"
        }, "copy_button_no_text_found");
        return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    suppressNextClick = true;
    window.setTimeout(() => {
        suppressNextClick = false;
    }, 500);

    updateDebugState({
        last_copy_button_result: "starting_intervention",
        last_copy_button_text_length: textToCopy.length
    }, "copy_button_starting_intervention");
    modalOpen = true;
    runIntervention(textToCopy);
}

function handleCopyButtonClick(event) {
    const button = getButtonLikeElement(event.target);
    if (suppressNextClick && isLikelyCopyButton(button)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
    }

    if (programmaticCopyInProgress || Date.now() < copyBypassUntil || modalOpen) {
        return;
    }

    if (!isLikelyCopyButton(button)) {
        return;
    }

    const textToCopy = getTextForCopyButton(button);
    if (!textToCopy) {
        updateDebugState({
            last_copy_button_click_result: "no_text_found"
        }, "copy_button_click_no_text_found");
        return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    updateDebugState({
        last_copy_button_click_result: "starting_intervention",
        last_copy_button_text_length: textToCopy.length
    }, "copy_button_click_starting_intervention");
    modalOpen = true;
    runIntervention(textToCopy);
}

const observer = new MutationObserver((mutations) => {
    // Clear the timer on every change to 'debounce' the save action.
    // This ensures we only run saveLatest() 1 second *after* the last change.
    if (saveTimer) {
        clearTimeout(saveTimer);
    }
    
    saveTimer = setTimeout(() => {
        console.log("AI Ext: Changes stopped, saving latest response.");
        saveLatest();
        saveTimer = null;
    }, 1000); // Wait 1 second (1000ms) after last mutation
});

console.log("AI Ext: Starting observer.");
observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true // Watch for text content changing (streaming)
});

document.addEventListener("copy", handleCopyEvent, true);
document.addEventListener("pointerdown", handleCopyButtonPointerDown, true);
document.addEventListener("click", handleCopyButtonClick, true);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) {
        return false;
    }

    updateDebugState({
        last_runtime_message_at: nowIso(),
        last_runtime_message_type: message.type
    }, "runtime_message_received", { type: message.type });

    if (message.type === "BYC_FORCE_SAVE_LATEST") {
        const text = saveLatest();
        sendResponse({
            ok: true,
            detected: Boolean(text),
            length: text ? text.length : 0,
            debug: getAssistantDetectionSnapshot()
        });
        return false;
    }

    if (message.type === "BYC_DEBUG_STATUS") {
        const text = saveLatest();
        sendResponse({
            ok: true,
            detected: Boolean(text),
            length: text ? text.length : 0,
            debug: getAssistantDetectionSnapshot()
        });
        return false;
    }

    if (message.type === "BYC_TEST_MODAL") {
        if (!modalOpen) {
            modalOpen = true;
            runIntervention("Debug test copy text from Before You Copy.");
        }
        sendResponse({
            ok: true,
            modalOpen: true,
            debug: getAssistantDetectionSnapshot()
        });
        return false;
    }

    return false;
});

// Run once on load to get any existing text
saveLatest();
