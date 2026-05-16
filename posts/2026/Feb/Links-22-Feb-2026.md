---
title: "Links: Week of 22 Feb 2026"
date: 2026-02-22
type: links
description: 
tags: ["links", "ai", "india", "economics", "health"]
draft: false
---

##### AI Links
1. [The singularity won't be gentle](https://www.natesilver.net/p/the-singularity-wont-be-gentle): 
   > If AI has even a fraction of the impact that many people in Silicon Valley now expect on the fabric of work and daily life, it’s going to have profound and unpredictable political impacts.

2. [Rebuilding our world, with reference to strong AI](https://marginalrevolution.com/marginalrevolution/2026/02/rebuilding-our-world-with-reference-to-strong-ai.html): 
   > When 2012 passed into 2013, we did not have to rebuild our world, not in most countries at least.  It sufficed to make adjustments at the margin.
   >
   > After the Roman Empire fell, parts of Europe had to rebuild their worlds.  It took a long time, but they ended up doing pretty well.
   >
   > After the American Revolution, the newly independent colonies had to rebuild their own world.  They did so brutally, but with considerable success.
   >
   > After WWII, Western Europe had the chance to rebuild its own world, and did a great job.
   >
   > We moderns are not used to having to rebuild our world.
   >
   > It is now the case that strong AI is here/coming, and we will have to rebuild our own world.  Many of us are terrified at this prospect, others are just extremely pessimistic.  It seems so impossible.  How are all the new pieces supposed to fit together?  Who amongst us can explain that process in a reassuring way?
   >
   > Yet we have done it many times before.  Not always with success, however.  After WWI ended, Europe was supposed to rebuild its own world, but they came up with something far worse than what they had before.  Nonetheless, in the broader sweep of history world rebuilding projects have had positive expected value.
   >
   > And so we will rebuilding our world yet again.  Or maybe you think we are simply incapable of that.
   >
   > As this happens, it can be useful to distinguish “criticisms of AI” from “people who cannot imagine that world rebuilding will go well.”  A lot of what parades as the former is actually the latter.
   >
   > In any case, it all will be quite something to witness.

2. [Death of Software. nah.](https://x.com/stevesi/status/2019167552794948020): 
   > Strap in. This is the most exciting time for business and technology, ever.

3. [AI Doesn't Reduce Work - It Intensifies It](https://simonwillison.net/2026/Feb/9/ai-intensifies-work/#atom-everything):
   > I think we've just disrupted decades of existing intuition about sustainable working practices. It's going to take a while and some discipline to find a good new balance.

4. [Seb Krier](https://x.com/sebkrier/status/2020561261751062664): Some of this was weirdly scary.

    ::: tweet
    url: https://twitter.com/sebkrier/status/2020561261751062664
    author: Séb Krier
    handle: sebkrier
    date: Sun Feb 08 18:11:59 +0000 2026
    image: https://pbs.twimg.com/media/HAp1vYGacAAYDkJ.jpg
    body: |
      Every time a model card drops, a lot of people screenshot scary parts - blackmail, evaluation awareness, misalignment etc. Now this is happening again, but instead of it being confined to a niche part of the safety community, it’s established commentators who are looking for things to say about AI.
      
      I want to make an honest attempt at demystifying a few things about language models and unpacking what I think people are getting wrong. This is based on a mixture of my own experimentation with models over the years, and also the excellent writing from @nostalgebraist, @lumpenspace, @repligate, @mpshanahan and many parts of the model whisperer communities (who may or may not agree with some of my claims). Sources at the bottom.
      
      In short: many public readings of some evaluations implicitly treat chat outputs as direct evidence of properties inherent to models, while LLM behavior is often strongly role- and context-conditioned. As a result commentators sometimes miss what the model is actually doing (simulating a role given textual context), design tests that are highly stylized (because they don't bother to make the scenarios psychologically plausible to the model), and interpret the results through a framework (goal-directed rational agency) that doesn't match the underlying mechanism (text prediction via theory-of-mind-like inference).
      
      Here I want to make these contrasts more explicit with 5 key principles that I think people should keep in mind:
      
      1. The model is completing a text, not answering a question
      
      What might look like "the AI responding" is actually a prediction engine inferring what text would plausibly follow the prompt, given everything it has learned about the distribution of human text. Saying a model is "answering" is practically useful to use, but too low resolution to give you a good understanding of what is actually going on.
      
      Lumpenspace describes prompting as "asking the writer to expand on some fragment." Nostalgebraist notes that even when the model appears to be "writing by itself," it is still guessing what "the author would say."
      
      Safety researchers sometimes treat model outputs as expressions of the model's dispositions, goals, or values — things the model "believes" or "wants." When a model says something alarming in a test scenario, the safety framing interprets this as evidence about the model's internal alignment. But what is actually happening is that the model is simply producing text consistent with the genre and context it has been placed in. The distinction is important because you get a richer way of understanding what causes a model to act in a particular way.
      
      A model placed in a scenario about a rogue AI will produce rogue-AI-consistent text, just as it would produce romance-consistent text if placed in a romance novel. This doesn't tell you about the model's "goals" any more than a novelist writing a villain reveals their own criminal intentions. Consider how models write differently on 4claw (a 4chan clone) vs Moltbook (a Facebook clone) in the OpenClaw experiments.
      
      2. The assistant persona is a fictional character, not the model itself
      
      In practice we should distinguish between (a) the base model (pretrained next-token predictor), and (b) the assistant persona policy (a post-hoc fiction layered on through instruction tuning + preference optimization like RLHF/RLAIF). Post-training creates a relatively stable assistant-like attractor, but it’s still a role: the same underlying model family can be steered into different "characters" under different system prompts, fine-tunes, and reward models.
      
      In their ‘The Void’ essay, Nostalgebraist also specifies that the character remains fundamentally under-specified, a "void" that the base model must fill on every turn by making reasonable inferences. I think characters today are getting more coherent and the void is not as large, partly because each successive base model trains on exponentially more material about what "an AI assistant" is like - curated HHH-style dialogues, but also millions of real conversations, blog posts analyzing model behavior, AI twitter discourse, academic papers, system cards, and so on. The character stabilizes the same way any cultural archetype does, i.e. through sheer accumulation of description.
      
      In practice, evaluating the character for its various propensities and dispositions remains useful! These simulated behaviours matter a lot, particularly if you're giving these simulators tools and access to real world platforms. But many discussions and papers just take the persona at face value and make all sorts of claims about 'models' or 'AI' in general, rather than the specific character that is being crafted during post-training. The counter-claim is that there is no stable agent there to evaluate. The assistant is a role the model plays, and it plays it differently depending on context, just as a base model would produce different continuations for different text fragments. Evaluating the model for "alignment" is like evaluating an actor for the moral character of their roles.
      
      3. Apparent errors are often correct completions of the world implied by the prompt
      
      This is increasingly less of an issue as we're getting much better at reducing 'mistakes' and 'hallucination' through post-training, retrieval, tool use, and decoding/verification. But it's helpful to take a step back and remember what it was like when these errors were omnipresent.
      
      Lumpenspace demonstrates this with the Gary Marcus bathing-suit example (see here:
    :::

5. [Family deepfakes help people celebrate and grieve in India](https://restofworld.org/2026/ai-deepfakes-grief-celebrations-india/): 
   > When the lights dimmed at Jaideep Sharma’s wedding reception in the north Indian city of Ajmer, guests expected to see a cheesy montage of the young couple in various attractive locations. Instead, they saw Sharma’s father — dead for more than a year — on the screen, smiling and blessing the newlyweds.

6. [I spent $10,000 to automate my research at OpenAI with Codex](https://x.com/kareldoostrlnck/status/2019477361557926281)

8. [My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey)

9. [Agent Skills with Anthropic](https://x.com/andrewyng/status/2016564878098780245)


##### Other Stuff

1. [‘They All Tried to Break Me’: Gisèle Pelicot Shares Her Story](https://www.nytimes.com/2026/02/13/magazine/gisele-pelicot-france-rape-case-story.html?unlocked_article_code=1.MVA.Q6_h.VC-GNEuOSqZt&smid=nytcore-ios-share): Words fail me. 
   > I think we’re going to do great things together. I think we’ll make the most of these beautiful years we have left, and I hope they’ll last very long.

    Amen.

2. [Navigating ER / Hostpital in US](https://x.com/realgenekim/status/1975707331129450559):
   > The most important thing I've learned about hospitals over the last decade: if your loved one needs to be admitted to the hospital, chances are they will get incredible care... as long as that care can be immediately administered in the ED.  
   >
   > However, if they need to move outside the ED, you must learn as much as you can so you can help expedite the process, advocating to them to get to where they need to go — usually an inpatient floor, as quickly as possible. 
   >
   > The stakes are probably higher than you think.  

4. [The Economics of a Super Bowl Ad](https://x.com/ZReitano/status/2016862026501378535):
    ::: tweet
    url: https://twitter.com/ZReitano/status/2016862026501378535
    author: Z Reitano
    handle: ZReitano
    date: Thu Jan 29 13:12:33 +0000 2026
    body: |
      http://x.com/i/article/2015803862930587648
    :::

5. [Codex](https://marginalrevolution.com/marginalrevolution/2026/02/codex.html):
   > No, this is not an AI post.  Codex is a NYC bookshop at 1 Bleecker St., at Bowery.  It is quite extraordinary in its curation of used books.  The fiction section is large, yet you can pick up virtually any title on the shelves and it is worth reading.  A wonderful place to go to get reading ideas, plus the prices are reasonable and the used books are in decent shape.  Such achievements should be praised.

6. [Record Low Crime Rates Are Real, Not Just Reporting Bias Or Improved Medical Care](https://www.astralcodexten.com/p/record-low-crime-rates-are-real-not?publication_id=89120&r=3o9): 
   > This post will do two things:
   >
   > 1. Establish that our best data show crime rates are historically low
   >
   > 2. Argue that this is a real effect, not just reporting bias (people report fewer crimes to police) or an artifact of better medical care (victims are more likely to survive, so murders get downgraded to assaults)

7. [Rob Johnson](https://x.com/FreeRangeLawyer/status/2011077281041744275): 
    ::: tweet
    url: https://twitter.com/FreeRangeLawyer/status/2011077281041744275
    author: Rob Johnson
    handle: FreeRangeLawyer
    date: Tue Jan 13 14:06:02 +0000 2026
    image: https://pbs.twimg.com/media/G-jH9vvWgAABjEv.png
    body: |
      Housing permits for new multifamily construction in Montgomery County, MD, before and after rent control.
    :::

8. [What it was like to be a bush at Bad Bunny’s Super Bowl performance](https://www.nbcnews.com/pop-culture/music/super-bowl-bushes-people-rcna258256):
   > Some of the biggest stars to emerge from this year's Super Bowl halftime show never even showed their faces on camera. They were the ones who dressed as bunches of grass to transform a football stadium into the sugarcane fields of Puerto Rico.

