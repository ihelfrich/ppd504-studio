/* PPD 504 Studio - practice_extra.js (AUTO-GENERATED from the practice-expand
   workflow). Conceptual/interpretive problems appended to each module's bank.
   Regenerate via scripts/build_practice.workflow.js. Do not hand-edit. */
(function () {
  var P = window.PPD504 = window.PPD504 || {};
  P.practiceBank = P.practiceBank || {};
  var X = {
 "w1-sampling": [
  {
   "q": "A city HR director wants to know the average commute time of all 4,200 city employees. She emails a survey to 300 randomly selected employees and gets a mean commute of 27 minutes. Identify the population, the sample, and whether 27 minutes is a parameter or a statistic.",
   "hint": "A parameter describes the whole group you care about; a statistic comes from the subset you actually measured. Ask which one 27 came from.",
   "a": "The population is all 4,200 city employees, the group the director actually wants to describe. The sample is the 300 randomly selected employees who answered. The 27 minutes is a <b>statistic</b>, because it was computed from the sample, not from all 4,200 people. The true average commute across all employees is the parameter. It is fixed but unknown here, and the director is using the 27-minute statistic to estimate it."
  },
  {
   "q": "A council member says: \"This survey only reached 300 of our 4,200 employees, so it tells us nothing about the other 3,900.\" The sample was drawn at random. Is the council member right? Explain in one or two sentences you could say out loud in the meeting.",
   "hint": "The point of random sampling is that the sample stands in for the whole group, so you do not need to measure everyone.",
   "a": "The council member is wrong. Because the sample was drawn at random, every employee had an equal chance of being picked, so the 300 respondents are representative of the full 4,200 and the sample average is a fair estimate of the overall average. We will not know the exact figure without surveying everyone, but a random sample of 300 gives a reliable estimate, which is the opposite of nothing."
  },
  {
   "q": "Two analysts each estimate the share of residents who used the public library last year. Analyst A surveys 50 randomly chosen residents; Analyst B surveys 500 randomly chosen residents. Both used proper random sampling. Whose estimate should you trust to be closer to the true citywide share, and why?",
   "hint": "With random sampling, the only thing differing here is sample size. Think about how sample size relates to how much an estimate bounces around.",
   "a": "Trust Analyst B, who surveyed 500 residents. Both estimates are unbiased because both samples were random, so neither systematically over- or under-shoots. The difference is precision: a larger random sample varies less from the true population value, so Analyst B's estimate is likely closer to the real citywide share. Analyst A's estimate from only 50 people could land further off just from the luck of who happened to be chosen, since fewer respondents means more of that random wobble."
  }
 ],
 "w1-bias": [
  {
   "q": "A city parks department posts a survey link on a sign at each dog park asking \"How satisfied are you with our parks?\" and gets 4,000 responses, with 88% saying \"very satisfied.\" A council member says the large sample proves residents love the parks. What is the sampling problem, and does the large number of responses fix it?",
   "hint": "Ask who could possibly fill out a survey posted only at one kind of park, and whether more of the same kind of respondent removes a tilt.",
   "a": "Two problems overlap here. First is undercoverage, meaning the sampling frame (the set of people the survey can actually reach) is limited to people who already visit dog parks, so residents who never go, or who stopped going because they dislike the parks, can never appear in the data. Second is voluntary response, meaning the people who bother to stop, scan the link, and answer tend to be the ones with strong feelings, which here skews toward satisfied dog owners. Bias is a systematic tilt in one direction, so collecting 4,000 responses instead of 400 just gathers more of the same skewed group. <b>The large sample does not fix the bias, and the 88% figure cannot be read as resident-wide satisfaction.</b>"
  },
  {
   "q": "A program manager studies which job-training graduates ended up employed by surveying only the graduates who still answer their old program phone numbers two years later. She reports a high employment rate. Name the bias and explain why it likely inflates her number.",
   "hint": "Think about who falls off the contact list over two years, and whether the people you can still reach are a random slice of all graduates.",
   "a": "This is survivorship bias: the analysis looks only at the graduates who \"survived\" in the contact list, and they are systematically different from those who dropped off. The mechanism is nonresponse plus undercoverage, because graduates who kept stable housing and the same phone number are easy to reach, while those whose lives got harder and whose service was disconnected quietly fall out of the data. The missing group is plausibly worse off on employment, so the reachable survivors tilt the result upward. <b>The reported employment rate is likely too high, because the hardest cases are exactly the ones who left the sample.</b>"
  },
  {
   "q": "Two surveys ask about the same housing policy. Survey A asks: \"Do you support spending more to keep families from losing their homes?\" Survey B asks: \"Do you support raising taxes to fund a new housing handout?\" Both use good random samples of the same city. Why might they report very different support levels, and is this a sampling problem?",
   "hint": "Both samples are fine, so look at the words and the feelings each version attaches to the same policy.",
   "a": "The gap comes from question-wording bias (a form of response bias), not from how people were selected. Survey A attaches sympathetic framing (\"keep families from losing their homes\"), while Survey B attaches loaded framing (\"taxes,\" \"handout\"), and those cues push answers in opposite directions even when the respondents are identical. A random sample gives you no protection here, because the tilt lives in the instrument (the wording of the question) rather than in the frame (who got asked). <b>This is response bias from wording, and the fix is neutral phrasing tested across versions, not a bigger sample.</b>"
  }
 ],
 "w1-confounding": [
  {
   "q": "A city reports that neighborhoods with more public libraries have higher average reading test scores, and a council member concludes that building libraries raises test scores. Name one lurking variable that could produce this pattern without libraries causing anything, and say what kind of study would settle the question.",
   "hint": "Ask what else differs between neighborhoods that happen to have many libraries and those that have few.",
   "a": "Neighborhood income (or parental education) is a plausible lurking variable. A lurking variable is a third factor tied to both the supposed cause and the supposed effect. Wealthier areas tend to get more libraries <i>and</i> tend to have higher test scores, so the correlation can appear with no causal link from libraries to scores. This is an observational comparison, so it cannot separate the two explanations. To settle it you want a randomized experiment: place new libraries in a randomly chosen set of comparable neighborhoods and compare score changes against the neighborhoods that were not chosen. <b>Answer: income or parental education is a confounder, and a randomized experiment is the clean way to isolate the library effect.</b>"
  },
  {
   "q": "True or false, with a reason: \"Because we randomly assigned 400 residents to a new job-training program or to a control group, any difference in their later earnings must be caused by the training.\" Treat the random assignment as done correctly.",
   "hint": "Random assignment buys you one kind of validity. Think about what could still go wrong inside this particular study.",
   "a": "False as stated, because the word \"must\" is too strong. Randomization makes the two groups alike on average before treatment, so it rules out confounding and gives strong <i>internal validity</i> (the difference reflects the program, not pre-existing differences between the people). But two things still break the \"must.\" Chance alone can produce an earnings gap even when the training does nothing. And practical problems, such as people dropping out of the training group, can reintroduce bias after assignment. <b>Answer: false. Randomization supports a causal reading but does not make it a certainty.</b>"
  },
  {
   "q": "A pilot study of a new homelessness-services model ran in one wealthy suburb with 30 volunteers and showed strong results. The agency wants to roll it out citywide. Explain to the agency director, using the terms internal validity and external validity, why the strong pilot result is not enough.",
   "hint": "Distinguish \"did it work here\" from \"will it work elsewhere.\"",
   "a": "Internal validity asks whether the result is real <i>inside the study</i>: did the model truly cause the improvement for those 30 people. External validity asks whether the result <i>generalizes</i> to other people and settings. A wealthy suburb staffed by willing volunteers can differ from the rest of the city in income, in housing availability, and in who agreed to take part, so a finding that is internally valid there can still fail to transfer. <b>Answer: a strong pilot can have good internal validity yet weak external validity, so the citywide effect stays unknown until it is tested on a population that looks like the whole city.</b>"
  }
 ],
 "w1-ethics": [
  {
   "q": "A county health office runs a voluntary diabetes screening program and wants to publish a report showing results by ZIP code. One rural ZIP code had only 3 participants. A staffer suggests including that ZIP code's average blood sugar in the public table. What is the ethics problem, and what should they do instead?",
   "hint": "Think about why 'only group summaries are public' protects people, and what happens when the group is tiny.",
   "a": "Publishing a summary for a group of only 3 people can let a reader back out individual identities and private health data. Anyone who knows who participated in that small ZIP code could match the published average to specific neighbors, and with 3 people a single known value almost gives away the other two. The rule that only group summaries are made public assumes the groups are large enough to hide any one person, which fails when the cell is this small. The office should suppress or combine cells below a minimum count: merge that ZIP code with an adjacent one, or report it as 'fewer than 5, suppressed.' <b>Answer: do not publish the 3-person average; aggregate or suppress small cells until no individual can be re-identified.</b>"
  },
  {
   "q": "A city surveys tenants about landlord retaliation and promises 'confidentiality.' A council member says, 'Just make it anonymous instead, that is the same thing and even safer.' Explain the difference between confidentiality and anonymity, and why the city likely cannot promise anonymity here.",
   "hint": "Anonymity means the researcher cannot link a response to a person at all; confidentiality means they can but will not.",
   "a": "Anonymity means no one, including the research team, can connect a response back to the person who gave it, so there is no identifying link that could ever be leaked. Confidentiality means the team can identify respondents, for example to follow up or to track who has answered, but commits to not revealing that link. A retaliation survey usually needs follow-up contact or address-level detail to be useful, so each response is tied to an identity. That makes it confidential, not anonymous. <b>Answer: they are not the same; the city can honestly offer confidentiality, but it cannot call the survey anonymous as long as any identifying link exists.</b>"
  },
  {
   "q": "In the Tuskegee syphilis study, the U.S. Public Health Service withheld effective treatment from Black men for decades without telling them, in order to keep studying the disease. True or false: the central failure was that the study used a biased sample. Give the reason.",
   "hint": "Ask what an IRB and informed consent are designed to protect, and whose interests are supposed to come first.",
   "a": "False. The central failure was ethical, not statistical. The men were deceived, never gave informed consent, and were denied treatment that already existed, so the study put scientific knowledge ahead of the subjects' own welfare. This is what later rules respond to: Institutional Review Board (IRB) approval, which vets the risks of a study before it runs, and informed consent, which requires that subjects understand and agree to what will happen to them. The guiding principle that came out of these abuses is that the interests of the subject come first, above the study's goals. <b>Answer: False; the failure was the absence of consent and the deliberate harm to subjects, not sampling bias.</b>"
  }
 ],
 "w2-vartypes": [
  {
   "q": "A city housing survey records each respondent's satisfaction with their building inspector as Very dissatisfied, Dissatisfied, Neutral, Satisfied, or Very satisfied. An analyst codes these 1 through 5 and reports the mean as 3.4. What variable type is satisfaction, and what is the problem with reporting that mean?",
   "hint": "Ask whether the numeric codes have equal, meaningful spacing between them.",
   "a": "Satisfaction here is <b>ordinal</b>: the categories have a clear order, but the gaps between them are not known to be equal, so the distance from Dissatisfied to Neutral need not match the distance from Satisfied to Very satisfied. A mean treats the codes 1 through 5 as evenly spaced interval numbers, so the value 3.4 builds in an equal-spacing assumption the data do not support. The defensible summaries are the <b>median</b> or the <b>mode</b>, plus the percentage of respondents in each category."
  },
  {
   "q": "For a transit study, classify each of these variables: (1) the bus route number a rider takes, (2) the number of passengers boarding at a stop, and (3) the wait time in minutes until the next bus. State for each whether it is nominal, ordinal, or interval/quantitative, and whether it is discrete or continuous.",
   "hint": "First decide if numbers label categories or measure an amount; then ask if the values can be counted or can take any value on a scale.",
   "a": "(1) Route number is <b>nominal</b>: the digits are labels for routes, so route 42 is not larger than route 7 in any quantitative sense. (2) Passengers boarding is <b>quantitative and discrete</b>: it is a count, so it takes whole-number values like 0, 1, 2 with nothing in between. (3) Wait time is <b>quantitative and continuous</b>: it is measured on a scale and can take any value, such as 3.7 minutes, limited only by how precisely we record it. Note that discrete versus continuous applies only to quantitative variables, which is why the nominal route number gets neither label."
  },
  {
   "q": "True or false, with a reason: A colleague says \"ZIP code is a quantitative variable because it is made of numbers, so I can compute the average ZIP code of our program participants to find their typical location.\"",
   "hint": "Decide whether arithmetic on the values produces something meaningful.",
   "a": "<b>False.</b> ZIP code is a <b>nominal</b> variable: the digits identify an area but carry no quantitative magnitude, so adding or averaging them is not interpretable. An \"average\" of 90210 and 10001 is 50105.5, which names no real place and no typical location. The right summary for a nominal variable is a frequency table or the mode (the most common ZIP code), or a map of where participants live, not a mean."
  }
 ],
 "w2-histogram": [
  {
   "q": "A city analyst wants to chart two variables from a recent report: (1) the number of 911 calls in each of the city's 6 council districts, and (2) the response time in minutes for 200 individual 911 calls. For each variable, should she use a bar graph or a histogram, and why?",
   "hint": "Ask whether each variable's categories are named groups or measured amounts on a number line.",
   "a": "Council district is a categorical variable: the districts are named groups with no numeric order, so the call counts by district belong in a <b>bar graph</b>, drawn with gaps between the bars. Response time in minutes is a quantitative variable measured on a number line, so the 200 individual times belong in a <b>histogram</b>. To build the histogram she sorts the times into equal-width minute bins and lets the bars touch. The touching bars signal a continuous scale, while the gaps in a bar graph signal that the categories are separate groups rather than points along a measurement scale."
  },
  {
   "q": "A housing office histograms the sale prices of 500 homes. The bars pile up on the left (lots of homes in the lower price bins) and trail off in a long thin tail to the right (a few very expensive homes). Describe the shape, and explain to your director why the mean sale price will sit above the median here.",
   "hint": "Name the direction the tail points, then think about which summary gets pulled by extreme values.",
   "a": "The shape is <b>right-skewed</b> (also called positively skewed), because the long tail points toward the high end. The mean is the balance point of all the values, so the handful of very expensive homes in the right tail pull it upward. The median is just the middle home once the prices are sorted, and it does not care how far out those extreme values sit, only that they are above the middle. That is why the mean lands above the median. Reporting only the mean would overstate what a typical home costs, so the median is the safer summary to give the director."
  },
  {
   "q": "An analyst built a histogram of staff commute times but chose bins of unequal width: 0 to 10 minutes, then 10 to 50 minutes, then 50 to 60 minutes. The middle bar towers over the others, and she concludes most staff have a moderate commute. What is the flaw, and what is the fix?",
   "hint": "Before trusting how tall a bar looks, check how wide its bin is.",
   "a": "The flaw is that the bins are not equal width, so bar height is misleading. The middle bin spans 40 minutes while the others span only 10, so it collects more people simply by covering four times as much range, not because that commute length is unusually common. When bins differ in width, a tall bar can just mean a wide bin, and the eye gets fooled into seeing a pattern that may not be there. The fix is to redraw the histogram with <b>equal-width bins</b> (for example, every 10 minutes), so that each bar's height can be read directly as how many staff fall in that interval."
  }
 ],
 "w2-meanmedian": [
  {
   "q": "A city housing office reports that the <i>mean</i> household income in a neighborhood is $92,000 but the <i>median</i> is $54,000. A council member asks you which number better describes a typical household for the purpose of setting a rent-assistance cutoff. Which do you recommend, and what does the gap between the two numbers tell you?",
   "hint": "Think about which measure a few very high values can pull, and what mean-above-median signals about the shape of the data.",
   "a": "Recommend the median ($54,000). The median is the middle value, so it is resistant: a handful of very high earners cannot drag it upward. The mean uses every value, so those same large incomes pull it well above where most households actually sit. The fact that the mean sits far above the median is the signature of a right-skewed distribution, meaning a long tail of high incomes on the upper end. For a benefits cutoff, the median is the fairer description of a typical household."
  },
  {
   "q": "Five branch libraries report daily walk-in counts of 40, 45, 50, 55, and 60. A data-entry error then records the fifth value as 600 instead of 60. State what happens to the mean and to the median, and which one you would trust before the error is fixed.",
   "hint": "Find both summaries for the correct values first. Then ask which one even depends on the size of that last value.",
   "a": "With the correct values the mean is (40+45+50+55+60)/5 = 250/5 = 50, and the median, the middle of the sorted list, is also 50. After the error the mean becomes (40+45+50+55+600)/5 = 790/5 = 158, while the median is still 50 because the middle value did not move. Trust the median (50). It resists the single bad value, whereas the mean is not resistant and is badly distorted by the outlier."
  },
  {
   "q": "A manager says: \"Our permit-processing times are right-skewed, so the mean wait must be lower than the median wait.\" True or false, and explain to the manager in one or two sentences.",
   "hint": "Right-skew means a long tail on the high side. Ask which summary that tail pulls.",
   "a": "False. In a right-skewed distribution the long tail sits on the high (slow) side, and because the mean uses every value it gets pulled toward that tail. So the mean exceeds the median, not the other way around. A few very slow permits raise the average wait above the typical (middle) wait, which is exactly why the median is often the better headline number for skewed service times."
  }
 ],
 "w2-spread": [
  {
   "q": "A city HR director reports that the standard deviation of employee tenure in her department is exactly 0 years. What does this tell you about the tenure values, and is it possible for a standard deviation to be negative?",
   "hint": "Recall what s measures and the one situation that forces it to equal 0.",
   "a": "Standard deviation s measures how far values spread around their mean, so s = 0 means there is no spread at all: every employee has the exact same tenure. A standard deviation can never be negative. It is built by squaring each value's distance from the mean (a squared number is never negative), averaging those squares, and taking a square root (the square root of a non-negative number is non-negative). So s is always at least 0, and it equals 0 only when all the values are identical."
  },
  {
   "q": "Two neighborhoods each have an average household income of $60,000. Neighborhood A has a standard deviation of $4,000; Neighborhood B has a standard deviation of $38,000. You are designing a flat $500 utility rebate. Explain to a city-council member why the two neighborhoods are not really alike despite the identical means.",
   "hint": "The mean tells you the center; s tells you how mixed the situation is around that center.",
   "a": "The mean is the same, but s tells you how tightly incomes cluster around that center, and the two neighborhoods differ sharply. In A (s = $4,000), most households earn close to $60,000, so they are a fairly uniform group and a flat rebate lands on similar people. In B (s = $38,000), incomes are spread widely above and below $60,000, so the same neighborhood holds both comfortable and struggling households, and a flat rebate ignores that mix. A single average can hide a wide spread, and s is the number that reveals it."
  },
  {
   "q": "An analyst computes the standard deviation of nightly shelter occupancy (in number of beds used) for a month. A data-entry error then records one night as 9,000 beds used instead of 90. True or false, with a reason: this single error will barely move the standard deviation because it is only one of about 30 nights.",
   "hint": "Think about whether s is resistant to outliers, and what squaring does to a far-off value.",
   "a": "False. Standard deviation is not resistant to outliers, so one extreme value can move it a lot. The calculation takes each value's distance from the mean and squares it. A value of 9,000 (when the rest sit near 90) lies enormously far from the mean, so its squared distance dominates the whole sum, and s ends up far larger than the real night-to-night variation. That is exactly why you screen for data-entry errors before reporting spread. Because s carries the same units as the data, the inflated figure here is in beds, which makes the impossible value easy to spot."
  }
 ],
 "w2-boxplot": [
  {
   "q": "A city manager reports that for last month's 911 response times the median was 7 minutes, Q1 was 5 minutes, and Q3 was 9 minutes, and says \"half our calls came in between 5 and 9 minutes, so that is our normal range.\" Is the \"half\" claim right, and what does the 5-to-9 range actually describe?",
   "hint": "Think about what fraction of the data sits between Q1 and Q3, and what the gap from Q1 to Q3 measures.",
   "a": "The \"half\" claim is right, and it is exact, not just approximate. Q1 (the first quartile) cuts off the bottom 25% of calls and Q3 (the third quartile) cuts off the bottom 75%, so the values from Q1 to Q3 are exactly the middle 50% of all calls. That means half of all calls did fall between 5 and 9 minutes. The width of that band, Q3 minus Q1 = 9 - 5 = 4 minutes, is the interquartile range (IQR), a measure of how spread out the middle half of the data is. The IQR is a spread, not a count: it tells you the middle 50% is squeezed into a 4-minute window, not how many calls were fast or slow. Calling 5 to 9 the \"normal range\" is fair shorthand, as long as everyone remembers a quarter of calls were faster than 5 minutes and a quarter were slower than 9."
  },
  {
   "q": "An analyst has the sorted permit-processing times (in days) for 7 applications: 2, 4, 5, 8, 11, 14, 30. Using the course method (median of each half, excluding the overall median when n is odd), find Q1, the median, and Q3, then state the five-number summary.",
   "hint": "With n = 7 the overall median is the 4th value; set it aside, then take the median of each three-value half.",
   "a": "The overall median is the 4th value, 8 days. Setting it aside, the lower half is 2, 4, 5 with median 4, and the upper half is 11, 14, 30 with median 14, so Q1 = 4 days and Q3 = 14 days. The five-number summary is minimum 2, Q1 4, median 8, Q3 14, maximum 30 (all in days). The large gap between Q3 at 14 and the maximum at 30 is a hint that the 30-day case may be unusually slow, which the next step checks formally."
  },
  {
   "q": "Continuing from the permit data with Q1 = 4 days and Q3 = 14 days, a colleague says the 30-day application \"is obviously an outlier, just look at it.\" Apply the 1.5 x IQR rule to check whether 30 counts as a suspected outlier, and explain what that rule actually flags.",
   "hint": "Compute the IQR, then the upper fence Q3 + 1.5 x IQR, and compare 30 to it.",
   "a": "The IQR is Q3 - Q1 = 14 - 4 = 10 days, so 1.5 x IQR = 15 days. The upper fence is Q3 + 1.5 x IQR = 14 + 15 = 29 days, and the lower fence is Q1 - 1.5 x IQR = 4 - 15 = -11 days. Because 30 sits above the upper fence of 29, the rule flags it as a suspected outlier. The rule does not prove the value is an error or that it should be deleted. It only marks a point far enough from the middle 50% of the data to deserve a closer look at why that application took so long."
  }
 ],
 "w3-longrun": [
  {
   "q": "A city's 311 line answered 8 of its first 10 calls within 30 seconds this morning. The manager wants to put \"80% of calls answered within 30 seconds\" in the annual report. Why should you push back, and what does \"probability\" actually mean here?",
   "hint": "Ask how many repetitions stand behind the 80%, and how much a proportion from only 10 trials can swing.",
   "a": "Treat the probability of a fast answer as the long-run proportion of calls answered within 30 seconds if you watched the system handle a huge number of calls. Ten calls is a tiny, noisy sample, so the observed 80% is not a trustworthy estimate of that long-run rate. With only 10 calls the proportion bounces around: a true rate of 60% or 90% can both produce 8 out of 10 fairly often. So 80% is an accurate count of what happened this morning, but reporting it as the program's answer rate overstates how much you actually know. Base the reported percentage on a large number of calls (ideally thousands, spread across many days and shifts) before treating it as the system's true rate."
  },
  {
   "q": "A budget analyst says, \"Our grant program has been approved 7 years running, so by the law of averages it's due for a rejection this year.\" Is the long-run idea being used correctly here?",
   "hint": "Two issues: does the long-run idea require independent trials, and does it ever make a specific next outcome \"due\"?",
   "a": "No. This is the gambler's fallacy. The law of large numbers says that as you pile up many independent trials, the observed proportion of an event settles toward its true probability. It says nothing about making any single next outcome \"due\" to balance out the past, because past results do not change the odds of an independent future trial. Even if each year were like an independent coin flip, a streak of 7 approvals would not raise the chance of a rejection this year. Grant approvals are not independent anyway (the same strong proposal and relationships carry forward), so there is even less reason to expect the streak to \"correct\" itself."
  },
  {
   "q": "A council member assigns a personal probability of 0.7 that a new bus route will hit its ridership target, and also 0.5 that it will miss. Set aside whether 0.7 is the right number. What rule is broken, and why does it matter that this is a personal probability?",
   "hint": "Hit and miss are the only two possible outcomes. What must the two probabilities sum to?",
   "a": "Personal (subjective) probabilities still have to obey the basic rules of probability, and these numbers break one of them. \"Hit\" and \"miss\" are mutually exclusive (cannot both happen) and exhaustive (one of them must happen), so their probabilities have to add to 1. Here 0.7 plus 0.5 equals 1.2, which is impossible. A coherent set of beliefs would be 0.7 for hitting the target and 0.3 for missing it. Calling a probability personal means the degree of belief can be subjective, but it does not exempt the numbers from arithmetic."
  }
 ],
 "w3-benford": [
  {
   "q": "A city's 311 service line logs every call into exactly one category. The reported probabilities are: pothole 0.30, noise complaint 0.25, water leak 0.20, parking 0.15, and \"other\" 0.15. A council member uses these to plan staffing. Is anything wrong with this probability model?",
   "hint": "Check the two basic rules every probability model must satisfy: the range of each value, and what they must add up to.",
   "a": "Each value is between 0 and 1, so Rule 1 holds. But the five probabilities sum to 0.30 + 0.25 + 0.20 + 0.15 + 0.15 = 1.05, which breaks Rule 2. Rule 2 says that for a set of outcomes that is complete (covers every possibility) and non-overlapping (no call counts twice), the probabilities must add to exactly 1. Since every call falls in exactly one category, these should total 1. They total 1.05, so at least one figure is mismeasured or some calls are double-counted. The model is invalid as stated, and the staffing plan built on it is unreliable."
  },
  {
   "q": "In a housing-voucher lottery, the probability a randomly drawn applicant is approved on the first review is 0.18. A reporter writes: \"So there is an 82 percent chance the applicant is rejected.\" The program actually has three outcomes per applicant: approved, rejected, or sent back for more documents. Is the reporter's claim correct?",
   "hint": "The complement of an event is everything that is not that event. Ask whether \"not approved\" is a single outcome or a bundle of outcomes here.",
   "a": "The complement rule gives P(not approved) = 1 - P(approved) = 1 - 0.18 = 0.82, so 82 percent is the chance of \"not approved on first review.\" The problem is that \"not approved\" is not a single outcome. The sample space has three outcomes, so \"not approved\" bundles two of them: rejected and sent back for documents. That makes 0.82 the probability of (rejected OR sent back), not the rejection probability alone. The reporter mislabeled a combined complement as one specific outcome. The true rejection probability is somewhere below 0.82, and you cannot recover it without knowing how often applicants are sent back."
  },
  {
   "q": "An auditor checks a vendor's expense report and finds that the leading digit is 1 in only 5 percent of the line items, while 7, 8, and 9 each lead about 15 percent of the time. The amounts span from a few dollars to tens of thousands and arise from many unrelated transactions. Explain to a skeptical finance director why this pattern is a red flag, citing Benford's law.",
   "hint": "Benford's law predicts how often each digit 1 through 9 appears first in many naturally occurring datasets that range across several orders of magnitude. Recall which digit it expects most often.",
   "a": "Benford's first-digit law says that in many real datasets spanning several orders of magnitude, small leading digits are much more common than large ones: roughly 30 percent of values start with 1 and only about 5 percent start with 9, with the frequency declining steadily as the digit rises. The vendor's report flips this. A 1 leads only 5 percent of the time (about where a 9 should be) while 7, 8, and 9 lead far more often than expected. Wide-ranging amounts from unrelated transactions are exactly the kind of data Benford's law tends to describe, so the inversion is suspicious. One caution: Benford's law does not prove fraud. Some legitimate data, such as figures capped at a limit or tightly clustered around one value, simply do not follow it. The right next step is to flag the report for closer manual review, not to declare wrongdoing."
  }
 ],
 "w3-density": [
  {
   "q": "A city analyst draws a density curve for household commute times in a county. A council member asks, \"What does the area under this whole curve add up to, and what would the area between 20 and 40 minutes tell me?\" Answer both parts.",
   "hint": "Think about what a density curve is scaled to represent, and what a slice of that total area stands for.",
   "a": "The total area under any density curve is exactly 1, because every household falls somewhere on the time axis, so the whole curve accounts for 100 percent of the cases. The area above the 20 to 40 minute range equals the proportion of households whose commute falls in that interval. If that slice covers 0.35 of the total area, then 35 percent of households commute between 20 and 40 minutes."
  },
  {
   "q": "A department reports that the density curve of grant award sizes is right-skewed, meaning it has a long tail stretching toward large awards. A skeptical council member says, \"So the mean and the median are basically the same number, right?\" True or false, and explain which one is larger.",
   "hint": "Picture the median as the point that splits the area in half, and the mean as the balance point of the curve.",
   "a": "False. The median is the point that splits the area under the curve into two equal halves, so it is not affected by how far out the tail stretches. The mean is the balance point of the curve, so a few very large awards in the long right tail pull it toward those high values. With right skew the mean sits above the median. That gap is why a typical award is described better by the median than by the mean here."
  },
  {
   "q": "Two neighborhoods have wait-time density curves for a 311 service line. Curve A is symmetric and bell-shaped. Curve B is right-skewed, with a long tail toward very long waits. Both curves have the same mean wait of 12 minutes. A manager says, \"Same mean, so service is equally good in both.\" Spot the flaw.",
   "hint": "For a symmetric curve the mean and median coincide, but for a skewed curve they separate, so equal means can hide different typical experiences.",
   "a": "The flaw is treating an equal mean as proof of an equal typical experience. In symmetric Curve A the mean and median both sit at 12 minutes, so the average describes a typical caller well. In right-skewed Curve B the long tail pulls the mean up to 12, which means the median (the wait that splits callers into a faster half and a slower half) sits below 12. So a typical caller in neighborhood B actually waits less than 12 minutes, while a minority in the tail endure very long waits that inflate the mean. Equal means do not imply equal experience: B has both a faster-than-A typical wait and a worse-off tail group, and the manager should report the median and the tail separately rather than leaning on the mean alone."
  }
 ],
 "w3-normal": [
  {
   "q": "Two city departments report annual employee commute times. Both have a mean of 28 minutes, but the Sanitation curve is tall and narrow while the Parks curve is short and wide. A council member asks what differs between the two departments. Answer in terms of mu and sigma.",
   "hint": "One parameter sets where the curve is centered; the other sets how wide it is. Which is which here?",
   "a": "Both curves share the same mu, the mean of 28 minutes, so they are centered at the same place. They differ in sigma, the standard deviation, which controls spread. Sanitation has a smaller sigma, so most of its commutes cluster tightly near 28 minutes. Parks has a larger sigma, so its commutes are more spread out, and more employees have unusually short or long commutes even though the average is identical. The height difference follows from this: a narrow curve has to be taller because the total area under any normal curve is fixed at 1."
  },
  {
   "q": "A normal curve for monthly water bills has mu = 60 dollars and sigma = 12 dollars. A colleague says 'the curve bends right at 48 and 72 dollars.' Is that a meaningful statement, and what do those points represent?",
   "hint": "A normal curve changes the direction of its bend at a fixed distance from the mean. How is that distance related to sigma?",
   "a": "Yes, it is meaningful. A normal curve has two inflection points, the places where it switches from bending downward (near the peak) to bending upward (out in the tails), and they sit exactly one sigma on each side of the mean. Here that is 60 minus 12 = 48 dollars and 60 plus 12 = 72 dollars. So sigma is not just an abstract number. You can read it off the picture as the horizontal distance from the peak to where the curve changes its bend."
  },
  {
   "q": "Standardized reading scores for a district are approximately normal with mu = 500 and sigma = 50. A board member wants to know roughly what fraction of students score between 400 and 600. Estimate it without a calculator and explain how.",
   "hint": "First convert 400 and 600 into a number of sigma away from the mean. Then recall what the empirical rule says about that distance.",
   "a": "First, measure each endpoint in units of sigma. 400 is two sigma below the mean (500 minus 2 times 50), and 600 is two sigma above (500 plus 2 times 50). The empirical rule, also called the 68-95-99.7 rule, says that for a normal distribution about 95 percent of values fall within two standard deviations of the mean. So roughly 95 percent of students score between 400 and 600, leaving about 5 percent split between the two tails (about 2.5 percent below 400 and 2.5 percent above 600)."
  }
 ],
 "w3-zscore": [
  {
   "q": "A city runs two job-training programs that grade on different final exams. In Program A, scores have mean 70 and standard deviation 5, and Maria scored 80. In Program B, scores have mean 60 and standard deviation 20, and Devon scored 84. Each wants to claim they did better relative to their own program. Whose performance is stronger relative to their own distribution, and why can't you answer that by comparing the raw scores 80 and 84?",
   "hint": "Convert each raw score to a z-score with z = (x - mu) / sigma. The z-score reports how many standard deviations above the mean a person sits, which puts both scores on the same scale.",
   "a": "You cannot compare 80 and 84 directly because the two programs have different means and different spreads, so a point in Program A is not worth the same as a point in Program B. Standardizing fixes that. Maria's z-score is (80 - 70) / 5 = 2.0, so she sits 2 standard deviations above her program's mean. Devon's z-score is (84 - 60) / 20 = 1.2, so he sits 1.2 standard deviations above his. Devon's raw score is higher, but Maria stands farther out within her own distribution. <b>Maria has the stronger relative performance (z = 2.0 versus z = 1.2).</b>"
  },
  {
   "q": "A council member reads a report and says: \"This neighborhood's average commute time has a z-score of -1.5, so the commute must be a year and a half shorter than normal.\" Is that interpretation right or wrong, and how would you correct it?",
   "hint": "A z-score is counted in standard deviations, not in the data's original units like minutes or years. To get back to real units, ask what one standard deviation of commute time is worth.",
   "a": "The interpretation is wrong. A z-score of -1.5 means the value sits 1.5 standard deviations below the mean. It does not mean 1.5 years, or 1.5 of any time unit, because the number 1.5 counts standard deviations, not minutes. To translate it back into real units you multiply by the actual standard deviation. If commute times have a standard deviation of 6 minutes, then -1.5 standard deviations is 1.5 times 6, or 9 minutes below the average commute. <b>The -1.5 counts standard deviations, and you need sigma to convert it back to minutes.</b>"
  },
  {
   "q": "A housing agency reports that an applicant's income has a z-score of 0 against the local income distribution. A reviewer reads this and concludes the applicant earns nothing. True or false, and what does z = 0 actually tell you about where the income falls?",
   "hint": "Substitute z = 0 into z = (x - mu) / sigma and solve for x. Then think about which point of the distribution that x lands on.",
   "a": "False. Setting (x - mu) / sigma = 0 forces x - mu = 0, so x = mu. The applicant earns exactly the local average income, not zero. A z-score of 0 always marks the mean of the distribution. If the distribution is symmetric and bell-shaped, the mean is also the 50th percentile, meaning the value that roughly half the incomes fall below, so about half of applicants earn more and half earn less. (In a skewed distribution the mean need not sit at the 50th percentile, so the percentile reading only holds when the shape is symmetric.) <b>z = 0 means \"right at the average income,\" not \"zero income.\"</b>"
  }
 ],
 "w4-scatter": [
  {
   "q": "A city analyst measures the relationship between neighborhood median income and 911 response time, then reports r = 0.04. A council member says \"so income barely affects response time.\" Is r the right basis for that claim? Explain what an r near 0 does and does not tell you.",
   "hint": "r measures only one specific kind of relationship. Picture the scatterplot before you trust a near-zero r.",
   "a": "An r near 0 means there is almost no <i>linear</i> relationship: as income rises, response time does not steadily rise or steadily fall in a straight-line way. It does not mean \"no relationship at all.\" The pattern could be curved. For example, response times might be worst at both the poorest and the richest edges and fastest in the middle, and a U-shaped pattern like that can produce an r near 0 even though a real association exists. So r = 0.04 only rules out a strong straight-line pattern. The analyst should look at the scatterplot before concluding that income barely affects response time."
  },
  {
   "q": "An office records employee commute times in minutes and finds r = -0.6 between commute time and a job-satisfaction score. A colleague converts every commute from minutes to hours (dividing by 60) and recomputes r, expecting it to shrink. What value will the new r be, and why?",
   "hint": "Dividing a variable by a constant is a rescaling. Think about what r is built to ignore.",
   "a": "The new r will still be -0.6. Correlation is unit-free: dividing x or y by a positive constant (here dividing minutes by 60) does not change r, because r is computed from how far each point sits from its mean in standardized terms rather than from the raw units. The minus sign also stays, since dividing by a positive number does not flip the direction of the relationship. So switching minutes to hours leaves both the strength (0.6) and the direction (negative) untouched."
  },
  {
   "q": "Two scatterplots of housing-program data both show a clear upward pattern. In Plot A the points hug a rising line tightly; in Plot B the points still rise but scatter widely around the line. Which plot has the r closer to +1, and what would an r of exactly +1 mean?",
   "hint": "r measures how tightly the points cluster around a straight line, not just whether they go up.",
   "a": "Plot A has the r closer to +1, because its points hug the rising line tightly, and r measures how closely the points cluster around a straight line rather than merely whether the trend goes up. Plot B is also positive, so its r is above 0, but the wide scatter pulls its r down toward the middle of the 0-to-1 range. An r of exactly +1 would mean every point lies precisely on one upward-sloping straight line, with no scatter at all, which almost never happens with real program data. So both plots have positive r, and the tighter one (A) is the one nearer +1."
  }
 ],
 "w4-traps": [
  {
   "q": "A city analyst studies how the number of staff on duty at a permit office relates to the average processing time per applicant. The relationship looks like a U: with very few staff, processing is slow (backlog); with very many staff, it is also slow (coordination overhead); and it is fastest in the middle. Her software reports r = 0.04, so she concludes that staffing has no bearing on processing time. What did she get wrong?",
   "hint": "Think about what shape of relationship r is built to detect.",
   "a": "The correlation coefficient r measures only the strength of a <i>straight-line</i> (linear) relationship between two variables. A U-shaped pattern is strong but not linear: the rising half and the falling half pull r in opposite directions and cancel out, so r lands near 0 even though staffing clearly affects processing time. An r near 0 means \"no linear association,\" not \"no association at all.\" The fix is to plot the data before trusting the single number."
  },
  {
   "q": "A housing office records the median rent and median household income across 12 neighborhoods. Eleven of them follow a mild positive pattern (higher income, higher rent), but one luxury enclave sits far out, with extremely high income and extremely high rent. An analyst reports r = 0.86 and tells the council that income strongly predicts rent. Why should the council be cautious about that single number?",
   "hint": "Consider how much one unusual point can move a correlation.",
   "a": "The statistic r is not resistant to outliers: a single point far from the rest can pull it up or down by a lot. The luxury enclave sits far out on both variables and lined up with the positive direction, so it can produce most of the r = 0.86 on its own, while the other eleven neighborhoods show only a mild pattern. The reported correlation may describe one neighborhood more than it describes the city. The analyst should show the scatterplot and report r both with and without that point, so the council can see whether the relationship holds for typical neighborhoods."
  },
  {
   "q": "A staffer notices that across city districts, months with more public library visits also have more reported cases of heatstroke (r = 0.71). He proposes cutting library hours in summer to protect public health. In plain terms, explain what is likely going on.",
   "hint": "Ask what third factor could be raising both counts at the same time.",
   "a": "This looks like a spurious correlation driven by a lurking variable, a third factor that moves both measures together. Hot summer weather raises heatstroke cases and also drives people indoors to air-conditioned libraries, so visits and heatstroke rise together without either one causing the other. Correlation is not causation, and cutting library hours would not lower heatstroke. The honest check is to bring temperature in as a control and see whether any library-to-heatstroke link survives once weather is accounted for."
  }
 ],
 "w4-twoway": [
  {
   "q": "A city surveyed 200 residents, cross-tabulating <b>borough</b> (North, South) against <b>support for a new bus line</b> (Support, Oppose). The cell for North/Support holds 60 people. Of the three distribution types (joint, marginal, conditional), which one does the statement \"30% of all surveyed residents are North-borough supporters\" describe, and how do you get 30%?",
   "hint": "Ask what the percentage is a share OF: one cell out of the whole sample, a single row or column total, or a slice within one group.",
   "a": "This is a <b>joint</b> distribution, because it reports one cell as a share of the grand total of all 200 people. You divide the cell count by the grand total: 60 / 200 = 0.30, which is 30%. As a check, the joint percentages of all four cells add up to 100%, since every one of the 200 residents falls in exactly one cell."
  },
  {
   "q": "Using the same survey, suppose the North borough has 100 residents in the sample and 60 of them support the bus line, while the South has 100 residents with 40 supporters. A council member says \"Support is clearly higher in the North.\" To back that claim, should you compare joint percentages or conditional percentages, and what are the right numbers?",
   "hint": "To compare two groups fairly, hold the group fixed and look within it. That means conditioning on borough before you compare.",
   "a": "Use <b>conditional</b> distributions: condition on borough, then compare the support rate inside each one. North support is 60 / 100 = 60%, and South support is 40 / 100 = 40%, so support is higher in the North. The two boroughs happen to have the same sample size here, so the raw cell counts (60 versus 40) rank the boroughs the same way the conditional rates do. That agreement is a coincidence of equal group sizes. Conditioning on borough is the method that stays correct when the groups differ in size, because it divides each count by its own group total and removes the effect of how many people are in each borough."
  },
  {
   "q": "A two-way table cross-classifies <b>housing tenure</b> (Own, Rent) by <b>filed a noise complaint</b> (Yes, No). An analyst finds that 70% of all noise complaints came from renters and concludes \"Renters are far more likely to complain than owners.\" Explain why this conclusion may be wrong.",
   "hint": "The 70% conditions on complaints (the wrong group to hold fixed), and it says nothing about how many renters exist in the first place.",
   "a": "The 70% is a conditional distribution computed in the backward direction. It is the share of complainers who rent, not the share of renters who complain. If renters make up most of the city's households, they can account for most complaints while still complaining at a lower per-person rate than owners. To support the claim, condition on tenure instead of on complaints: compute (renter complaints / total renters) and (owner complaints / total owners), then compare those two rates. A larger group can dominate the raw counts without having the higher rate."
  }
 ],
 "w4-ols": [
  {
   "q": "A city analyst fits a least-squares line predicting a household's monthly water bill (in dollars) from the number of people in the household, using data from 200 homes. The result is y-hat = 18 + 7x, where x is the number of people. A council member reads this as \"a one-person household pays $25.\" Is that a correct reading of the line, and what does the slope of 7 actually tell us?",
   "hint": "The intercept is the predicted y when x = 0; the slope is the predicted change in y for a one-unit increase in x. Note that y-hat is a prediction, not the exact bill for any one home.",
   "a": "The arithmetic checks out: y-hat = 18 + 7(1) = 25 dollars. But two things are off in the council member's reading. First, $25 is the line's <b>predicted average</b> bill for one-person homes, not what any single one-person household actually pays. Second, the quantity that matters most is the <b>slope</b>, which the member skipped. The slope of 7 means each additional person in the household is associated with about $7 more in predicted monthly bill. The intercept of 18 is the predicted bill at x = 0, a zero-person household, which has no real meaning here and just sets where the line starts."
  },
  {
   "q": "Two analysts model annual road-repair spending (y, in dollars) against the number of reported potholes (x) for 30 districts. Analyst A's line has the smaller sum of squared residuals. Analyst B's line passes exactly through the two districts with the most extreme values. Which line is the ordinary least-squares (OLS) line, and what does \"least squares\" actually minimize?",
   "hint": "OLS picks the single line that makes the total of the squared vertical gaps between the points and the line as small as possible, using all the points.",
   "a": "Analyst A's line is the OLS line. <b>OLS minimizes the sum of squared residuals</b>, where a residual is the vertical distance between an actual data point and the line's predicted value for that point. By construction, no other straight line produces a smaller sum of those squared gaps, so the line with the smallest sum is the least-squares line. Analyst B's line is built to touch just two districts and ignores the other 28, so it can easily fit the full set of points worse, which is exactly why a smaller residual sum, not passing through particular points, is the test."
  },
  {
   "q": "An analyst regresses neighborhood average test scores (y) on median household income (x) across many neighborhoods and reports R-squared = 0.41. A board member says, \"So income decides 41 percent of how kids score.\" Explain what the 0.41 does and does not mean.",
   "hint": "R-squared is the share of the variation (the spread) in y that the line accounts for. It measures fit, and it says nothing about cause.",
   "a": "R-squared = 0.41 means the line explains about <b>41 percent of the variation in test scores across neighborhoods</b>, leaving 59 percent unexplained by income alone. Two corrections for the board member. The word \"decides\" claims cause, but R-squared only measures fit: income is correlated with scores here, and other factors that move with income, such as school funding or parents' own education, could be doing much of the real work. And R-squared is about explaining the spread across neighborhoods, not about each individual child. A fair reading is that income accounts for a moderate share, roughly two fifths, of how much average scores differ from one neighborhood to the next."
  }
 ],
 "w4-residuals": [
  {
   "q": "A city analyst fits a line predicting a household's monthly water bill from household size. For one 5-person household, the model predicts a bill of $84, but the actual bill was $71. What is this household's residual, and what does its sign tell you?",
   "hint": "Residual equals the observed value minus the predicted value. Once you have the number, ask whether the line guessed too high or too low for this household.",
   "a": "The residual is the observed bill minus the predicted bill: $71 minus $84 equals -$13. A residual is the part of the actual value the line did not account for. Because it is negative, the actual bill came in below what the line predicted, so the model over-predicted for this household. That means this household spent less than the line expects for its size, though the line only uses household size, so other factors (a low-water-use household, a leak-free month, conservation) could be behind the gap. The answer is a residual of <b>-$13</b>."
  },
  {
   "q": "A colleague reports the residuals from her regression of commute time on distance and notes that they sum to about zero. She says this proves her line is a good fit. True or false, and why?",
   "hint": "Ask what always forces ordinary least squares residuals to sum to zero, and whether that property depends on how well the line fits.",
   "a": "False. When a least squares line includes an intercept, its residuals always average to zero (so they sum to about zero) by construction, whether the line fits well or badly. The sum being zero confirms the fitting procedure ran correctly; it says nothing about whether the relationship is actually linear. To judge fit she should look at how large the residuals are (their spread) and at a residual plot to check for leftover pattern. The claim is <b>false</b>."
  },
  {
   "q": "An analyst plots residuals against predicted values for a model of program cost versus number of clients served. The points form a clear U-shape: positive at low and high predicted values, negative in the middle. What does this pattern signal, and what should she do?",
   "hint": "A residual plot with no pattern suggests a line fits; visible structure left in the plot suggests it does not. Read what a U-shape implies about the true curve.",
   "a": "A U-shaped residual plot means a straight line is missing real structure: the line sits below the true relationship at the low and high ends (positive residuals there) and above it in the middle (negative residuals there), which is the signature of a relationship that curves. Cost is probably a curved (nonlinear) function of clients served rather than a fixed amount per client. She should fit a curved model instead, for example by adding a squared term for clients or transforming a variable, then re-check the residual plot. The takeaway: <b>the linear model is mis-specified and a nonlinear form is needed</b>."
  }
 ]
};
  for (var id in X) { (P.practiceBank[id] = P.practiceBank[id] || []).push.apply(P.practiceBank[id], X[id]); }
})();
