// nlp-rules.js — Rule-based analysis engine for the Indigenous Language Review web app.
// Detects seven themes from Wahpepah et al. (2024) systematic review of linguistic
// representation of Indigenous Peoples in academic literature.
// Runs entirely client-side. OCAP® compliant — no text leaves the browser.
// Exposes: window.NLPRules.analyse(text), .THEMES, .SAMPLE_TEXT

window.NLPRules = (() => {
  "use strict";

  // ── Seven themes from the reflexive thematic analysis ───────────────────
  var THEMES = [
    { key: "paternalistic", code: 1, label: "Paternalistic Attitudes & Justification for Intervention", positive: false },
    { key: "stereotyping",  code: 2, label: "Stereotyping",                                             positive: false },
    { key: "colonial",      code: 3, label: "Manifestation of Colonial Attitudes",                      positive: false },
    { key: "othering",      code: 4, label: "Othering",                                                 positive: false },
    { key: "respectful",    code: 5, label: "Respectful Practices",                                     positive: true  },
    { key: "revisionist",   code: 6, label: "Revisionist History",                                      positive: false },
    { key: "colorblind",    code: 7, label: "Egalitarian Color-Blindness",                              positive: false },
  ];

  // ── Proximity check — rules flagged with proximity:true only fire when
  //    within ±350 chars of an Indigeneity term. ──────────────────────────
  var INDIGENEITY_RE = /\b(indigenous|aboriginal|first\s+nations?|m[eé]tis|inuit|inuk|native\s+(?:peoples?|communities?|american)|anishinaabe|cree|ojibwe|haudenosaunee|dene|blackfoot|mi'?kmaq|algonquin|mohawk|two-spirit)\b/i;

  // ── Rule definitions ─────────────────────────────────────────────────────
  // Each rule: { theme, proximity, re, severity, label, explanation, suggestion }
  // severity: "high" | "medium" | "low" | "positive"
  var RULES = [

    // ════════════════════════════════════════════════════════════════════════
    // THEME 1 — Paternalistic Attitudes & Justification for Intervention
    // ════════════════════════════════════════════════════════════════════════
    {
      theme: "paternalistic", proximity: true,
      re: /\bdysfunctional\b/gi, severity: "high",
      label: "Deficit/paternalistic framing",
      explanation: "Labelling Indigenous communities as \"dysfunctional\" reproduces the settler-colonial narrative that they are inherently broken and require outside control. This language was used directly to justify emergency powers, forced removals, and the Northern Territory Emergency Response.",
      suggestion: "Acknowledge specific structural barriers (underfunding, colonial disruption) rather than attributing dysfunction to the community itself.",
    },
    {
      theme: "paternalistic", proximity: true,
      re: /\b(intervene|intervention|interventions)\b/gi, severity: "medium",
      label: "Intervention framing",
      explanation: "Framing institutional responses as \"intervention\" centres settler authority as the natural solution to Indigenous community needs, positioning Indigenous peoples as passive recipients of external rescue rather than self-determining peoples.",
      suggestion: "Consider \"community-led initiative\", \"collaborative support\", or \"partnership\" — language that centres Indigenous agency.",
    },
    {
      theme: "paternalistic", proximity: false,
      re: /\bearned\s+autonomy\b/gi, severity: "high",
      label: "Conditional autonomy language",
      explanation: "\"Earned autonomy\" implies Indigenous self-governance is a privilege the colonial state may grant contingent on compliance, rather than an inherent right. This directly contradicts UNDRIP and Canada's Bill C-15 (2021).",
      suggestion: "Indigenous self-determination, inherent right of self-governance, Treaty rights",
    },
    {
      theme: "paternalistic", proximity: true,
      re: /\b(comply|compliance|non-compliance)\b/gi, severity: "medium",
      label: "Compliance framing",
      explanation: "Applying \"compliance\" language to Indigenous communities and organisations reproduces colonial power hierarchies, positioning the state or funder as the authority and Indigenous peoples as subjects who must satisfy external expectations.",
      suggestion: "Mutual accountability, partnership obligations, agreed-upon reporting",
    },
    {
      theme: "paternalistic", proximity: true,
      re: /\bcapacity[- ]build(ing|er)?\b/gi, severity: "low",
      label: "Deficit capacity framing",
      explanation: "\"Capacity-building\" directed at Indigenous communities can imply they lack competence, framing the problem as internal rather than structural (e.g., chronic underfunding, jurisdictional exclusion from services).",
      suggestion: "Knowledge exchange, shared learning, community empowerment — or name the specific structural barrier being addressed.",
    },
    {
      theme: "paternalistic", proximity: true,
      re: /\b(supervision|oversight|monitoring)\b/gi, severity: "low",
      label: "Surveillance / oversight framing",
      explanation: "When applied to Indigenous communities or organisations, oversight and monitoring language can reproduce paternalistic control dynamics, particularly in funding and governance contexts.",
      suggestion: "Mutual accountability, collaborative review, shared governance",
    },
    {
      theme: "paternalistic", proximity: true,
      re: /\b(inferior|incapable|incompetent)\b/gi, severity: "high",
      label: "Deficit characterisation",
      explanation: "Describing Indigenous peoples as inferior or incapable reproduces the colonial hierarchies used to justify dispossession, residential schooling, and assimilation policies.",
      suggestion: "Remove entirely. Address specific structural barriers rather than attributing deficiency to people.",
    },
    {
      theme: "paternalistic", proximity: true,
      re: /\b(welfare\s+depend(ency|ent|ence)|welfare\s+trap)\b/gi, severity: "high",
      label: "Welfare dependency framing",
      explanation: "Framing Indigenous communities in terms of \"welfare dependency\" individualises structural poverty caused by colonial dispossession, and has been used to justify punitive social policies.",
      suggestion: "Describe structural causes: dispossession, underfunding, colonial disruption of economies.",
    },
    {
      theme: "paternalistic", proximity: true,
      re: /\bproblem\s+of\b/gi, severity: "medium",
      label: "Problem-framing of communities",
      explanation: "Framing social issues as \"the problem of\" Indigenous communities positions the community as the source of the problem rather than a context shaped by structural colonial harms.",
      suggestion: "Describe the structural barrier or colonial determinant directly.",
    },
    {
      theme: "paternalistic", proximity: true,
      re: /\bdeficit\s+(narrative|framing|discourse|perspective)\b/gi, severity: "medium",
      label: "Explicit deficit framing reference",
      explanation: "This text explicitly names deficit framing — a key critical concept in Indigenous scholarship. If this is being critiqued, retain. If it is being used to describe Indigenous communities, reconsider.",
      suggestion: "If critiquing, retain for analysis. If describing, reframe using structural language.",
    },
    {
      theme: "paternalistic", proximity: true,
      re: /\b(at[- ]risk|high[- ]risk\s+(?:youth|families|communities))\b/gi, severity: "medium",
      label: "Risk / deficit labelling",
      explanation: "\"At-risk\" labels applied to Indigenous youth or communities reproduce deficit discourse and treat Indigeneity as a risk factor rather than addressing structural causes (e.g., underfunding, racism).",
      suggestion: "Describe specific structural circumstances. Use strengths-based language alongside acknowledgment of challenges.",
    },

    // ════════════════════════════════════════════════════════════════════════
    // THEME 2 — Stereotyping
    // ════════════════════════════════════════════════════════════════════════
    {
      theme: "stereotyping", proximity: true,
      re: /\b(alcoholism|alcohol\s+abuse|alcohol\s+misuse)\b/gi, severity: "high",
      label: "Alcohol stereotype",
      explanation: "Associating Indigenous peoples with alcoholism as a group characteristic reinforces one of the most damaging and persistent colonial stereotypes. It obscures individual diversity and deflects from structural causes such as intergenerational trauma and deliberate colonial flooding of communities with alcohol.",
      suggestion: "If discussing substance use, cite specific data, contextualize with structural causes, and avoid group generalizations.",
    },
    {
      theme: "stereotyping", proximity: true,
      re: /\b(drug\s+abuse|substance\s+abuse|substance\s+misuse)\b/gi, severity: "medium",
      label: "Substance abuse stereotype",
      explanation: "Broad associations between Indigenous peoples and drug/substance abuse perpetuate stereotypes that ignore structural determinants of health and individual diversity within and across Nations.",
      suggestion: "Contextualize with colonial determinants of health. Avoid group-level associations without careful structural framing.",
    },
    {
      theme: "stereotyping", proximity: true,
      re: /\bgambling\s+(addiction|problem)\b/gi, severity: "medium",
      label: "Gambling stereotype",
      explanation: "Associating Indigenous communities with gambling addictions as a collective characteristic is a harmful stereotype that ignores structural poverty and individual diversity.",
      suggestion: "If discussing gambling-related harms, use specific data and structural framing.",
    },
    {
      theme: "stereotyping", proximity: true,
      re: /\b(drink too much|drinking problem)\b/gi, severity: "high",
      label: "Alcohol stereotype (colloquial)",
      explanation: "Characterising Indigenous peoples as drinking excessively is a harmful stereotype used to justify discrimination in healthcare, employment, and housing.",
      suggestion: "Remove. If clinically relevant, use specific, structurally contextualized language.",
    },
    {
      theme: "stereotyping", proximity: false,
      re: /\bmyths?\b/gi, severity: "medium",
      label: "Delegitimising Indigenous knowledge",
      explanation: "\"Myth\" implies fabrication and undermines Indigenous knowledge systems by suggesting they are less credible than academic or scientific knowledge.",
      suggestion: "Oral traditions, sacred narratives, traditional stories, or the specific story name if known",
    },
    {
      theme: "stereotyping", proximity: false,
      re: /\blegends?\b/gi, severity: "medium",
      label: "Delegitimising Indigenous knowledge",
      explanation: "\"Legend\" implies unverifiable hearsay, undermining the authority and sophistication of Indigenous oral traditions.",
      suggestion: "Oral traditions, traditional stories, sacred oral narratives",
    },
    {
      theme: "stereotyping", proximity: false,
      re: /\bfolklore\b/gi, severity: "medium",
      label: "Delegitimising Indigenous knowledge",
      explanation: "\"Folklore\" implies the knowledge is informal or non-rigorous rather than a sophisticated epistemological system.",
      suggestion: "Oral traditions, cultural knowledge, traditional knowledge systems",
    },
    {
      theme: "stereotyping", proximity: false,
      re: /\bshaman(?:s|ism|istic)?\b/gi, severity: "medium",
      label: "Inaccurate cultural role label",
      explanation: "\"Shaman\" is a Siberian Tungusic term inaccurately applied across hundreds of distinct traditions. It flattens diverse spiritual roles into a Hollywood-influenced stereotype.",
      suggestion: "Traditional healer, spiritual leader, Elder, ceremonial leader, or the specific role in the relevant Nation's tradition",
    },
    {
      theme: "stereotyping", proximity: false,
      re: /\bmedicine\s+man\b/gi, severity: "medium",
      label: "Reductive cultural role label",
      explanation: "\"Medicine man\" is a romanticised, inaccurate label that flattens diverse and distinct roles across hundreds of cultural traditions into a single stereotype.",
      suggestion: "Traditional healer, spiritual leader, Elder, or the specific role in the relevant tradition",
    },
    {
      theme: "stereotyping", proximity: false,
      re: /\bspirit\s+animals?\b/gi, severity: "medium",
      label: "Cultural appropriation / trivialisation",
      explanation: "In many Indigenous traditions, spirit or totem animals carry profound spiritual significance. Using this phrase casually appropriates and trivialises these sacred beliefs.",
      suggestion: "In non-cultural contexts: personal inspiration, guiding symbol, favourite thing",
    },
    {
      theme: "stereotyping", proximity: false,
      re: /\bpow[-\s]?wows?\b/gi, severity: "medium",
      label: "Cultural appropriation / trivialisation",
      explanation: "A pow wow is a specific, sacred cultural gathering in many Indigenous Nations. Using it to mean any informal meeting trivialises this living tradition.",
      suggestion: "Meeting, discussion, brainstorm, gathering",
    },
    {
      theme: "stereotyping", proximity: true,
      re: /\b(free\s+(?:education|university|tuition|land)|government\s+(?:grants|funds|money|handouts))\b/gi, severity: "medium",
      label: "\"Aboriginal advantage\" myth",
      explanation: "Framing Indigenous peoples' treaty entitlements as unearned government handouts perpetuates the \"Aboriginal advantage\" myth. This ignores treaty rights, constitutional entitlements, ongoing underfunding, and systemic inequities.",
      suggestion: "Treaty rights, constitutionally recognized entitlements, or describe the specific program and its legal basis accurately.",
    },
    {
      theme: "stereotyping", proximity: false,
      re: /\bnoble\s+savage\b/gi, severity: "high",
      label: "Noble savage trope",
      explanation: "The \"noble savage\" trope is a romanticising stereotype that denies Indigenous peoples full humanity and complexity — it is the mirror image of the dehumanising savage stereotype, and equally problematic.",
      suggestion: "Remove entirely. Describe specific knowledge systems, practices, or values accurately.",
    },
    {
      theme: "stereotyping", proximity: false,
      re: /\bvanishing\s+(race|culture|people)\b/gi, severity: "high",
      label: "Vanishing race narrative",
      explanation: "The \"vanishing race\" narrative portrays Indigenous peoples as inevitably disappearing, erasing living cultures and contemporary Indigenous resurgence movements.",
      suggestion: "Acknowledge living cultures, ongoing language and cultural revitalization, and population growth.",
    },

    // ════════════════════════════════════════════════════════════════════════
    // THEME 3 — Manifestation of Colonial Attitudes
    // ════════════════════════════════════════════════════════════════════════
    {
      theme: "colonial", proximity: false,
      re: /\bsavages?\b/gi, severity: "high",
      label: "Colonial dehumanisation",
      explanation: "\"Savage\" was the central dehumanising term used to justify colonization and violence against Indigenous peoples. It remains deeply offensive and has no place in respectful writing.",
      suggestion: "Remove entirely.",
    },
    {
      theme: "colonial", proximity: false,
      re: /\bprimitive\b/gi, severity: "high",
      label: "Evolutionary deficit language",
      explanation: "\"Primitive\" applies a colonial hierarchy of civilisational development to Indigenous cultures, implying inferiority and was used to justify assimilation policies and cultural destruction.",
      suggestion: "Traditional, ancestral, long-standing, or a specific accurate descriptor",
    },
    {
      theme: "colonial", proximity: false,
      re: /\bsquaw\b/gi, severity: "high",
      label: "Racial and sexual slur",
      explanation: "\"Squaw\" is a racial and sexual slur historically used to dehumanise and sexualise Indigenous women. It has no place in academic or professional writing.",
      suggestion: "Remove entirely. Use the person's name, role, or simply \"woman\" or \"Elder\".",
    },
    {
      theme: "colonial", proximity: false,
      re: /\bredskin\b/gi, severity: "high",
      label: "Racial slur",
      explanation: "\"Redskin\" is a racial slur historically connected to scalp bounties and the genocide of Indigenous peoples. Its use is condemned by Indigenous organisations across North America.",
      suggestion: "Remove entirely.",
    },
    {
      theme: "colonial", proximity: false,
      re: /\bEskimos?\b/gi, severity: "high",
      label: "Incorrect / offensive naming",
      explanation: "\"Eskimo\" is considered offensive by many Inuit and Yupik peoples and is rejected by the Inuit Circumpolar Council and other representative organisations.",
      suggestion: "Inuit (Canada/Greenland), Yupik (Alaska/Siberia), or the specific community name",
    },
    {
      theme: "colonial", proximity: false,
      re: /\bIndian\s+giver\b/gi, severity: "high",
      label: "Racial slur / colonial idiom",
      explanation: "This phrase is a racial slur that misrepresents Indigenous gifting customs — which were often reciprocal and communal — as deceptive.",
      suggestion: "Describe the actual behaviour (e.g., \"reneging on an offer\").",
    },
    {
      theme: "colonial", proximity: false,
      re: /\boff\s+the\s+reservation\b/gi, severity: "high",
      label: "Colonial idiom",
      explanation: "This phrase references the violent US government policy of confining Indigenous peoples to reservations, where leaving without permission was punishable. Using it casually ignores this traumatic history.",
      suggestion: "Off track, outside the norm, acting independently, going rogue",
    },
    {
      theme: "colonial", proximity: false,
      re: /\bcircle\s+the\s+wagons\b/gi, severity: "medium",
      label: "Colonial idiom",
      explanation: "This phrase romanticises a defensive tactic used against Indigenous peoples, framing colonial violence as heroic.",
      suggestion: "Rally together, regroup, go on the defensive",
    },
    {
      theme: "colonial", proximity: false,
      re: /\brain\s+dance\b/gi, severity: "medium",
      label: "Sacred ceremony trivialisation",
      explanation: "Rain ceremonies are sacred spiritual practices in many Indigenous traditions. Using this phrase casually trivialises those ceremonies.",
      suggestion: "Wishful thinking, hoping for the best, fingers crossed",
    },
    {
      theme: "colonial", proximity: true,
      re: /\btraining\b/gi, severity: "low",
      label: "Dehumanising / paternalistic language",
      explanation: "When applied to Indigenous peoples, \"training\" can reproduce colonial hierarchies — suggesting something is done to them rather than with them, echoing residential school and domestic service contexts.",
      suggestion: "Education, professional development, knowledge exchange, two-way learning",
    },
    {
      theme: "colonial", proximity: false,
      re: /\buncivilized|uncivilised\b/gi, severity: "high",
      label: "Colonial hierarchy language",
      explanation: "Describing peoples or cultures as \"uncivilised\" applies a Eurocentric civilisational standard used to justify colonization, cultural destruction, and genocide.",
      suggestion: "Remove entirely.",
    },
    {
      theme: "colonial", proximity: false,
      re: /\bInformants?\b/gi, severity: "medium",
      label: "Extractive research language",
      explanation: "\"Informant\" implies passive extraction of knowledge and is inconsistent with OCAP® principles. It frames community members as sources rather than research partners or knowledge holders.",
      suggestion: "Knowledge keeper, participant, collaborator, research partner, Elder (if applicable)",
    },
    {
      theme: "colonial", proximity: false,
      re: /\bIndians?\b(?!\s+(?:Ocean|ink|subcontinent|cuisine|restaurant|food|film|rupee|tea|summer|Act\b))/gi,
      severity: "medium",
      label: "Inaccurate / colonial naming",
      explanation: "\"Indian\" applied to Indigenous peoples of the Americas stems from a colonial geographic error. In Canadian academic writing it is widely outdated and inaccurate. Note: retains specific legal meaning in the Indian Act — review before changing in legal/historical contexts.",
      suggestion: "Indigenous, First Nations, or the specific Nation name. In Canadian law: check Indian Act applicability.",
    },

    // ════════════════════════════════════════════════════════════════════════
    // THEME 4 — Othering
    // ════════════════════════════════════════════════════════════════════════
    {
      theme: "othering", proximity: false,
      re: /\bthese\s+(Indigenous|Aboriginal|Native|First\s+Nations?)\s+people\b/gi, severity: "medium",
      label: "Othering language",
      explanation: "\"These [Indigenous] people\" creates social distance and positions Indigenous peoples as fundamentally different from the reader/speaker, reproducing an us/them binary central to colonial Othering.",
      suggestion: "Indigenous peoples, First Nations peoples, or the specific Nation name",
    },
    {
      theme: "othering", proximity: true,
      re: /\bthose\s+people\b/gi, severity: "medium",
      label: "Othering language",
      explanation: "\"Those people\" when referring to Indigenous peoples signals social distance and reinforces Othering, exoticisation, and marginalisation.",
      suggestion: "Use the specific Nation or group name",
    },
    {
      theme: "othering", proximity: true,
      re: /\b(exotic|exoticize[sd]?|exoticis(?:ing|ed)|exoticiz(?:ing|ed))\b/gi, severity: "medium",
      label: "Exoticisation",
      explanation: "Framing Indigenous peoples or their practices as exotic treats them as objects of curiosity for a settler gaze, rather than as communities with inherent rights and complex contemporary lives.",
      suggestion: "Describe specific practices or knowledge systems with respect and accuracy, without the exoticising frame.",
    },
    {
      theme: "othering", proximity: true,
      re: /\bfundamentally\s+different\b/gi, severity: "medium",
      label: "Essentialising difference",
      explanation: "Characterising Indigenous peoples as fundamentally different from the normative (settler) subject reinforces colonial Othering and can be used to justify exclusionary practices.",
      suggestion: "Describe specific cultural, legal, or historical distinctions without essentialising difference.",
    },
    {
      theme: "othering", proximity: true,
      re: /\b(?:along\s+with|as\s+well\s+as|and\s+other)\s+(?:visible\s+minorities|newcomers|immigrants|racialized\s+groups)\b/gi,
      severity: "low",
      label: "Bundling / flattening distinct status",
      explanation: "Bundling Indigenous peoples with other minority or racialized groups may flatten their distinct constitutional, Treaty, and Nation-to-Nation status in Canada. Indigenous peoples' rights arise from distinct legal and historical foundations.",
      suggestion: "Consider whether Indigenous peoples' distinct status warrants separate mention. If listing alongside others, acknowledge their distinct Treaty and constitutional status.",
    },
    {
      theme: "othering", proximity: false,
      re: /\bthe\s+(?:Indigenous|Aboriginal|Native)\s+(?:problem|issue|question)\b/gi, severity: "high",
      label: "Othering / deficit framing",
      explanation: "Framing Indigenous rights, identity, or presence as a \"problem\" or \"question\" for settler society to solve is a classic Othering move that positions Indigenous peoples as a burden or disruption to the colonial norm.",
      suggestion: "Describe specific policy challenges, Treaty obligations, or rights claims accurately.",
    },

    // ════════════════════════════════════════════════════════════════════════
    // THEME 5 — Respectful Practices  (positive — these are commendations)
    // ════════════════════════════════════════════════════════════════════════
    {
      theme: "respectful", proximity: false,
      re: /\bknowledge\s+keepers?\b/gi, severity: "positive",
      label: "Respectful: Knowledge Keeper recognition",
      explanation: "\"Knowledge Keepers\" correctly recognises the distinct role and authority of Indigenous knowledge holders. It aligns with OCAP® principles and reflects community-centred research practice.",
      suggestion: "Continue this respectful practice.",
    },
    {
      theme: "respectful", proximity: false,
      re: /\bself[- ]determination\b/gi, severity: "positive",
      label: "Respectful: Self-determination language",
      explanation: "Framing Indigenous rights as self-determination aligns with UNDRIP, Canada's Bill C-15 (2021), and Nation-to-Nation relationships.",
      suggestion: "Continue this rights-based framing.",
    },
    {
      theme: "respectful", proximity: false,
      re: /\bOCAP[®™]?\b/g, severity: "positive",
      label: "Respectful: OCAP® principles",
      explanation: "Referencing OCAP® (Ownership, Control, Access, Possession) demonstrates alignment with First Nations data sovereignty principles developed by the First Nations Information Governance Centre.",
      suggestion: "Continue this practice.",
    },
    {
      theme: "respectful", proximity: false,
      re: /\bUNDRIP\b/g, severity: "positive",
      label: "Respectful: UNDRIP citation",
      explanation: "Grounding analysis in the UN Declaration on the Rights of Indigenous Peoples reflects a rights-based approach and international legal standards.",
      suggestion: "Continue this practice.",
    },
    {
      theme: "respectful", proximity: false,
      re: /\breconciliation\b/gi, severity: "positive",
      label: "Respectful: Reconciliation framing",
      explanation: "Acknowledging reconciliation as a framework situates the analysis within Canada's ongoing obligations to Indigenous peoples.",
      suggestion: "Ensure reconciliation language is paired with concrete structural analysis and not used superficially (\"reconcili-washing\").",
    },
    {
      theme: "respectful", proximity: false,
      re: /\bdecoloni[sz](e[sd]?|ation|ing)\b/gi, severity: "positive",
      label: "Respectful: Decolonisation framing",
      explanation: "Using decolonisation language explicitly challenges colonial frameworks and power structures.",
      suggestion: "Ensure the term is used precisely (not metaphorically) per Tuck & Yang (2012).",
    },
    {
      theme: "respectful", proximity: false,
      re: /\bstrengths[- ]based\b/gi, severity: "positive",
      label: "Respectful: Strengths-based framing",
      explanation: "Strengths-based language acknowledges the inherent capabilities and resilience of Indigenous peoples, countering the deficit discourse that dominates much of the literature.",
      suggestion: "Continue this practice.",
    },
    {
      theme: "respectful", proximity: false,
      re: /\btwo[- ]eyed\s+seeing\b/gi, severity: "positive",
      label: "Respectful: Two-Eyed Seeing / Etuaptmumk",
      explanation: "Two-Eyed Seeing (Etuaptmumk) is a Mi'kmaw guiding principle from Elder Albert Marshall that honours both Indigenous and Western knowledge systems. Referencing it demonstrates deep engagement with Indigenous epistemologies.",
      suggestion: "Continue this respectful practice. Attribute to Elder Albert Marshall and the Mi'kmaw people.",
    },
    {
      theme: "respectful", proximity: false,
      re: /\bcultural\s+safety\b/gi, severity: "positive",
      label: "Respectful: Cultural safety framing",
      explanation: "Cultural safety goes beyond cultural awareness to examine power dynamics and structural inequity — it is the appropriate standard for Indigenous health and social service research.",
      suggestion: "Continue this practice.",
    },
    {
      theme: "respectful", proximity: false,
      re: /\btrauma[- ]informed\b/gi, severity: "positive",
      label: "Respectful: Trauma-informed approach",
      explanation: "A trauma-informed approach recognises the impact of colonial violence and intergenerational trauma without pathologising Indigenous peoples.",
      suggestion: "Continue this practice. Pair with structural analysis of colonial causes.",
    },
    {
      theme: "respectful", proximity: false,
      re: /\bfree,?\s+prior\s+and\s+informed\s+consent\b/gi, severity: "positive",
      label: "Respectful: FPIC",
      explanation: "Free, Prior and Informed Consent is a core UNDRIP principle protecting Indigenous communities' right to self-determination in research and development processes.",
      suggestion: "Continue this practice.",
    },
    {
      theme: "respectful", proximity: false,
      re: /\bNation[- ]to[- ]Nation\b/gi, severity: "positive",
      label: "Respectful: Nation-to-Nation framing",
      explanation: "Nation-to-Nation language recognises Indigenous peoples as distinct, self-governing peoples with whom the Canadian state holds Treaty relationships — not as subjects of its jurisdiction.",
      suggestion: "Continue this practice.",
    },

    // ════════════════════════════════════════════════════════════════════════
    // THEME 6 — Revisionist History
    // ════════════════════════════════════════════════════════════════════════
    {
      theme: "revisionist", proximity: false,
      re: /\bNew\s+World\b/gi, severity: "medium",
      label: "Discovery Doctrine / Eurocentric framing",
      explanation: "\"New World\" reflects a Eurocentric perspective — the Americas were \"new\" only to European colonizers. The Americas had been inhabited for at least 15,000 years before European contact.",
      suggestion: "The Americas, the Western Hemisphere, North and South America",
    },
    {
      theme: "revisionist", proximity: false,
      re: /\bbrought\s+civili[sz]ation\b/gi, severity: "high",
      label: "Civilising mission / saviour narrative",
      explanation: "Framing colonization as \"bringing civilization\" erases the sophisticated governance, trade networks, and knowledge systems that existed across the Americas, and reproduces the Doctrine of Discovery used to justify genocide.",
      suggestion: "Colonised, imposed colonial systems, disrupted existing governance and culture",
    },
    {
      theme: "revisionist", proximity: false,
      re: /\bcowboys?\s+and\s+Indians?\b/gi, severity: "high",
      label: "Trivialisation of colonial violence",
      explanation: "\"Cowboys and Indians\" frames colonial violence as a game or entertainment genre. The metaphor has been directly used by US and Australian soldiers to frame Indigenous peoples as targets.",
      suggestion: "Remove or contextualise critically.",
    },
    {
      theme: "revisionist", proximity: false,
      re: /\b(friendly|gentle)\s+(natives?|Indians?)\b/gi, severity: "high",
      label: "Sanitised contact narrative",
      explanation: "Describing Indigenous peoples as \"friendly\" or \"gentle\" in early contact narratives reduces complex political encounters to Disney-style harmony, erasing the violence and coercion that followed.",
      suggestion: "Describe the specific encounter accurately, including subsequent events.",
    },
    {
      theme: "revisionist", proximity: false,
      re: /\btwo\s+cultures?\s+(meeting|merging|coming\s+together)\b/gi, severity: "medium",
      label: "False equivalence / harmonising narrative",
      explanation: "Framing colonization as two equal cultures peacefully meeting erases the profound power asymmetry, coercion, and violence of colonial contact.",
      suggestion: "Describe the power dynamics accurately. Acknowledge the violence and dispossession that accompanied European settlement.",
    },
    {
      theme: "revisionist", proximity: true,
      re: /\bdiscover(ed|y|ing)\b/gi, severity: "medium",
      label: "Discovery Doctrine language",
      explanation: "Saying land was \"discovered\" implies it had no prior significant occupants. The Doctrine of Discovery was the legal instrument used to dispossess Indigenous peoples, and its legacy shapes land claims today.",
      suggestion: "Colonised, arrived at, reached, encountered, invaded",
    },
    {
      theme: "revisionist", proximity: true,
      re: /\b(triumph(al|ant|antly)?)\b/gi, severity: "medium",
      label: "Heroising colonisation",
      explanation: "Describing colonial exploration or settlement as \"triumphant\" romanticises colonial violence and erases Indigenous loss and ongoing dispossession.",
      suggestion: "Use neutral or critically framed language that acknowledges Indigenous perspectives.",
    },
    {
      theme: "revisionist", proximity: false,
      re: /\b(harmony|harmonious)\s+(between\s+settlers?|of\s+two\s+cultures?)\b/gi, severity: "medium",
      label: "Romanticised contact narrative",
      explanation: "Framing early colonial contact as harmonious erases the coercion, deception, and violence that characterised European settlement across the Americas.",
      suggestion: "Describe specific historical events accurately, including conflict and power asymmetry.",
    },

    // ════════════════════════════════════════════════════════════════════════
    // THEME 7 — Egalitarian Color-Blindness
    // ════════════════════════════════════════════════════════════════════════
    {
      theme: "colorblind", proximity: true,
      re: /\btreat\s+everyone\s+(the\s+same|equally)\b/gi, severity: "high",
      label: "Colour-blind equality claim",
      explanation: "Invoking \"treating everyone the same\" to oppose Indigenous-specific programs ignores Treaty rights, constitutional protections under s.35, and ongoing racial inequities. This framing has been used to justify exclusionary practices and oppose affirmative policy.",
      suggestion: "Acknowledge that equitable outcomes require addressing the specific rights and structural barriers faced by distinct groups.",
    },
    {
      theme: "colorblind", proximity: true,
      re: /\bacross\s+the\s+board\b/gi, severity: "medium",
      label: "Colour-blind universalism",
      explanation: "\"Across the board\" approaches applied in lieu of Indigenous-specific programs ignore the specific Treaty rights, constitutional protections, and historical injustices that form the basis for targeted programs.",
      suggestion: "Acknowledge that Treaty rights and constitutional protections are recognized rights, not \"special treatment\".",
    },
    {
      theme: "colorblind", proximity: true,
      re: /\b(why\s+(?:single\s+out|target|focus\s+on)\b)/gi, severity: "high",
      label: "Colour-blind challenge to targeted programs",
      explanation: "Questioning why Indigenous peoples are specifically addressed by programs ignores documented, ongoing racial inequity and Treaty obligations. This framing has been used to oppose rights-based affirmative policies.",
      suggestion: "Engage with the specific historical and structural basis for the program or policy.",
    },
    {
      theme: "colorblind", proximity: false,
      re: /\breverse\s+(?:racism|discrimination)\b/gi, severity: "high",
      label: "Reverse discrimination framing",
      explanation: "\"Reverse discrimination\" or \"reverse racism\" claims applied to Indigenous rights mischaracterise Treaty rights as unfair advantage and ignore the documented, ongoing inequities Indigenous peoples face.",
      suggestion: "Remove. If engagement is required, cite specific legal protections and structural inequity data.",
    },
    {
      theme: "colorblind", proximity: true,
      re: /\blevel\s+(?:the\s+)?playing\s+field\b/gi, severity: "medium",
      label: "False equality framing",
      explanation: "\"Level playing field\" language assumes structural inequities can be addressed through procedural equality alone, without accounting for centuries of dispossession and ongoing systemic racism.",
      suggestion: "Acknowledge the specific structural barriers that require targeted, rights-based responses.",
    },
    {
      theme: "colorblind", proximity: true,
      re: /\bhelp\s+everyone\s+equally\b/gi, severity: "medium",
      label: "False universalism",
      explanation: "Universal equality claims ignore the specific and unequal burdens borne by Indigenous peoples as a result of colonization, and the legal basis for Indigenous-specific programs under Treaty and s.35 of the Constitution Act, 1982.",
      suggestion: "Acknowledge the structural inequities that require targeted, rights-based responses.",
    },

  ]; // end RULES

  // ── Sample text demonstrating all 7 themes ─────────────────────────────
  var SAMPLE_TEXT = [
    "Indigenous communities in this region are frequently described as dysfunctional, requiring sustained government intervention, direct oversight, and compliance monitoring to address persistent social problems. At-risk Aboriginal youth lack the capacity to access services without intensive supervision, and communities may achieve earned autonomy once they demonstrate sustained compliance with funding requirements. These Aboriginal peoples, along with other disadvantaged groups such as visible minorities and newcomers, continue to face significant service barriers.",
    "Research consistently associates Aboriginal populations with high rates of alcoholism, drug abuse, and gambling addictions that are holding many back from progress. Indigenous informants were recruited using snowball sampling. Shamans and medicine men in these communities preserve traditional myths and legends, and community training programs are described as essential for addressing the problem of persistent dysfunction.",
    "Some service providers resist targeted programs: \"I just prefer to treat everyone the same \u2014 why are we singling out Aboriginal communities? We should help everyone equally and do this across the board for everyone. Anything else is just reverse discrimination.\"",
    "Historical accounts celebrate the triumphant discovery of the New World and describe how European explorers brought civilization to the friendly, gentle natives they encountered. The harmonious meeting of two cultures produced a prosperous new society on lands previously inhabited by fundamentally different peoples.",
    "In contrast, researchers who engage respectfully with these communities demonstrate meaningful commitments to reconciliation: consulting Elders and Knowledge Keepers, applying OCAP\u00ae principles, honouring UNDRIP obligations, and employing strengths-based, trauma-informed, and culturally safe methodologies that centre self-determination and decolonize research frameworks through genuine Nation-to-Nation partnerships.",
  ].join("\n\n");

  // ── Proximity window (chars) ─────────────────────────────────────────────
  var PROX_WINDOW = 350;

  // ── Core analyse function ─────────────────────────────────────────────────
  function analyse(text) {
    var findings = [];
    var seen = new Set();

    for (var ri = 0; ri < RULES.length; ri++) {
      var rule = RULES[ri];
      rule.re.lastIndex = 0;
      var match;
      while ((match = rule.re.exec(text)) !== null) {
        // Proximity check
        if (rule.proximity) {
          var start = Math.max(0, match.index - PROX_WINDOW);
          var end   = Math.min(text.length, match.index + PROX_WINDOW);
          var window = text.slice(start, end);
          if (!INDIGENEITY_RE.test(window)) continue;
        }
        var key = rule.theme + ":" + match[0].toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          phrase:      match[0],
          severity:    rule.severity,
          theme:       rule.theme,
          category:    rule.label,
          explanation: rule.explanation,
          suggestion:  rule.suggestion,
          startOffset: match.index,
        });
      }
    }

    // Sort: positive last; within non-positive: high→medium→low; then theme order; then position
    var sevOrd = { high: 0, medium: 1, low: 2, positive: 3 };
    var themeOrd = {};
    for (var ti = 0; ti < THEMES.length; ti++) themeOrd[THEMES[ti].key] = ti;
    findings.sort(function(a, b) {
      return (sevOrd[a.severity] - sevOrd[b.severity]) ||
             ((themeOrd[a.theme] || 0) - (themeOrd[b.theme] || 0)) ||
             ((a.startOffset || 0) - (b.startOffset || 0));
    });

    return findings;
  }

  return { analyse: analyse, THEMES: THEMES, SAMPLE_TEXT: SAMPLE_TEXT };

})();
