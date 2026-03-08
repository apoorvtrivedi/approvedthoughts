---
title: "Links: Weeks of 01 Mar 2026"
date: 2026-03-08
type: links
description: 
tags: ["links"]
draft: false
---

#### Links
1. 
    ![SavithaShan](/assets/images/2026/Mar/Moar%20Updatez.webp)

    > Savitha Shan, an undergrad double major here in economics and information systems, who was [murdered over the weekend](https://scottaaronson.blog/?p=9606) by an Islamist terrorist who started randomly shooting people on Sixth Street, apparently angry about the war in Iran. Two other innocents were also killed.

    So senseless. And the 180 schoolgirls Minab, Iran. Did any of them know it was their time? Did they get to live a full life? Will I? It's one thing to know this and another to feel it in your bones. But the worst is when you start feeling it and your instinct kicks in - allowing the feelings to only go in so deep and no more. RIP.

2. [The Brand Age](https://paulgraham.com/brandage.html): Worth reading the whole thing just for this sentence but there's a lot more and it ends in a very different place from where it starts. 
    > This is an instance of what I call the comb-over effect: when a series of individually small changes takes you from something that's a little bit off to something that's freakishly wrong.

3. [The Hidden Advantage of Being Over 50 in the Age of AI](https://www.inc.com/joel-comm/the-hidden-advantage-of-being-over-50-in-the-age-of-ai/91312602): Hope & cope?
    > The leaders who win this era won’t just be 22‑year‑olds building AI‑native startups. They’ll also be experienced operators who integrate AI quietly and intelligently into systems they already understand. If you’re over 50 and feeling behind, you might actually be early. Because when the tools get easier, experience becomes more powerful—not less. And this time, that experience may finally be the competitive edge.

4. 
    ![embed](https://x.com/FundamentEdge/status/2029726670375317624)

    ![embed](https://x.com/fundamentedge/status/2029991048806883480)


5. 
    ![embed](https://x.com/chapinc/status/2028156012511846733)

6. I wouldn't stand there.
    ![IWouldntStandThere](/assets/images/2026/Mar/I%20wouldn't%20stand%20there.jpeg)


#### Feeling the AGI

I have been following the AI revolution almost since the day ChatGPT launched in Nov 2022. That this was a transformational technology has also been clear to me for almost as long. I even sensed the ["vibe shift"](https://approvedthoughts.com/posts/2026/links-10-jan-2026) in early Jan. 

But so far I didn't really "feel the AGI". Last week I did. 

AGI stands for Artificial General Intelligence. Here's how Claude defines it: 
   
"An AI system capable of performing any intellectual task that a human can — reasoning, learning, and adapting across domains without being specifically programmed for each one." - Claude Sonnet 4.6 

It is also worth knowing the related concept of ASI, Artificial Superintelligence. 

"An AI that surpasses the cognitive abilities of all humans combined across every domain, including scientific reasoning, social intelligence, and creative problem-solving."

Last week we finally signed up for Claude Code at work and I started playing with it. 

Claude Code works via the CLI (command line interface) or the terminal - the black screen with white text used by all the movie nerds. It can be a little intimidating if you are not a programmer but really once you set up Claude Code, it works just like the chat window. 

It is so much more powerful though. It can manipulate files on your computer and run the code it writes. This means it is not restricted to recommendations or single steps any more. It can generate an entire plan of action and execute and implement the thing by itself. It can be more than a little freaky when you see the output of a particularly complex task. 

Let me share a couple of examples that blew my mind. 

At work we have a database that stores our financial projections for a company we cover. The investment team can use custom functions in excel to then download this data. This is useful to create reports for analysis - say comparing 5 companies across a few metrics. There are different functions for different types of data and the IT team has created an excel file with about 20 sheets listing the syntax for each function, the list of values that can go in each function etc. 

I pointed Claude Code to this help file and asked it to create a "skill" for itself that would allow it to create reports in excel using these formulas. I gave it the same context as the previous paragraph - maybe a little more technical but nothing a lay person wouldn't understand. 

With that single command, in maybe 3-5 minutes, the skill was ready. Now when we need to create a report we can just ask Claude Code to use the skill, the data we want in the report and it creates a fully formatted excel file with the (usually) correct formulas. Tasks that would take me or my team members 20-60 minutes, automated permanently. Using English sentences, no technical knowledge.

Second example. We wanted to perform some statistical analysis on 20 year historical performance of 600 stocks to identify specific episodes / time periods and then dig deeper into specific episodes to understand their fundamental causes. 

An analyst spent probably 5-6 hours to download the data in excel, process it so we could start identifying the qualifying episodes / time periods in different markets. At this point we were somewhat stumped about how to isolate the relevant episodes from this vast data. Probably a trivial problem for a data scientist but not for us. 

In the past, we would have spent probably another 5-10 hours trying to either eyeball the data using charts or some other way to get our answer. Over the last couple of years, we would have asked Claude or ChatGPT to suggest a better way. 

But since we had Claude Code, I pointed it to the existing file, with all its messy sheets and structure and explained what we were trying to do and asked it to identify the episodes. It whirred away for about 20 min, an occasional question here or a permission there and then it spat out a report. 

But the report didn't just have the episodes identified. It also identified potential causes for each episode (based on web searches presumably), linked patterns across multiple episodes, gave charts and commentary that helped us understand the relevance of each episode, limitations of the analysis, suggested next steps etc. 

Now we have all seen more than enough AI slop to not be impressed by the sheer volume of content these tools can spit out. But we spent a few hours verifying the numbers and conclusions. So far it all checks out. You have to take my word for it, but man, this was not slop. If a junior associate had put this out I would be proud of them. There were parts that I would have been proud to create and, of course, large parts that we simply couldn't have created at all. 

And those were not the only thing Claude Code did last week that blew my mind. 

So, let it be noted on this 8th of March, 2026, I felt the AGI last week. I may even have felt the ASI. 
