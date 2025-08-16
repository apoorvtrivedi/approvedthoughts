---
title: "The One Where I(?) Set Up a Website"
date: 2025-01-26
description: 
tags: ["post"]
draft: false
---

[This](https://approvedthoughts.com/) is the website in question. Bookmark it. Or don’t.

Many people are asking if this can even be called a website. These people are losers. Sad. The finest people I know think its a great website, maybe the best website in the history of the world. Nobody knows websites like I do.

Anyhoo.

It all began when I decided to shift this letter to a website last week. Having purchased a few web domains before, it took me only a few minutes to buy approvedthoughts.com from Cloudflare. Unlike GoDaddy etc. who offer a promotional price bundles and then jack it up on renewals, Cloudflare offers at-cost registration + renewals and I have good experience with some of their other services, so it was an easy choice.

For all my talk about using AI models, I hadn’t really used them for any type of programming project / tech support roles. I figured this was the perfect opportunity for me to try out if I could actually create something useful with the help of one of these models.

For context, while I have an undergraduate degree in Computer Applications, I have never programmed professionally and frankly did barely any programming during the course itself. I am probably a bit better than someone who has never done any programming, but not by a lot.

For context also, I could obviously just spend $20 on a paid service that would be absolutely trivial to set up and manage but where’s the fun in that?

This is how I started on Claude 3.5 Sonnet:

> I have recently purchased a domain for a website. I used cloudflare for purchasing the domain. I would now like to set up a Wordpress or other website at the domain. Walk me through the steps of doing this.

The Sonnet is the “most intelligent model” by Anthropic. It is the go to model at the moment for a lot of the people I follow and the only model I pay for.

The project went through multiple chats because after a while, in each chat, I would start getting this message:

![This chat is getting long.](assets/images/2025/Jan/image.png)

Here, for the first time, I used a trick I had recently seen (I think) on Twitter.

> ok - I have saved and deployed on cloudflare. However I am getting the message that this chat has become too long. Can you provide a status update that I can use with another AI chatbot to continue this work?

And it did! I pasted the update in another chat and the conversation continued there as if it was the same chat!

You can check out the first chat [here[](https://claude.ai/chat/1fd15f60-b8cb-49b1-835f-7c339e83aefb). I think / hope it has no confidential information. I won’t be sharing the remaining chats because they do have some of my account credentials. This one should provide enough context for most of what I am discussing here though.

So How’d it Go?
Well you’ve seen the “website”, so clearly not as well as I’d hoped. That said, I am continuing with the project and based on what I have learned so far, I am hopeful I will eventually get it working.

It is still remarkable that I got this far, considering that I have zero experience with the technologies / services involved. Claude successfully walked me through setting up 3 different services (Cloudflare, GitHub and Hugo) and had them work with each other to serve up the site.

All of this happened within a couple of hours and with me blindly following its instructions - copying and pasting code where it asked me to, choosing the options it asked me to and only making high level decisions, like which theme I liked for the blog, which require no technical sophistication.

For the most part, all of this was “one-shot”, meaning it told me to do something, in plain English, I did the thing and it all worked. Where it required a second shot, it was because I hadn’t provided the full context e.g. that I was using a Mac and not a PC. And once I clarified that, it adjusted the directions for all subsequent steps.

In fact, because I use Claude almost exclusively, I had forgotten how much better it is that some of the other models at being almost “human”. This chat is not very different from how I would interact with IT support engineer at work. Just randomly dropping bits of context or asides and having it be incorporated correctly into subsequent interactions as relevant.

In one of the subsequent chats, it seemed to me like Claude was stuck or going around in circles, without fixing the problem, so I decided to switch to the newly launched [DeepSeek-R1](https://chat.deepseek.com/) reasoning model. While the R1 made immediate progress where Claude was stuck, the experience of working with the R1 was just so much harder.

Unlike Claude, which “understood” that I was not technically sophisticated, and only gave tasks of a manageable size at each stage, the R1 would just throw a laundry list of complex tasks at me.

For e.g. there’s a set of 3 commands I needed to run on the Terminal app on my Mac, after every change to the code. This would “push” the changes to GitHub. Every time there would be only minor changes to these commands. Claude would provide these commands every time, unprompted. R1 would not.

Claude also seemed to just understand better where we were in the overall project at all times. So if it asked me to do three things and if I went back with a question about the first thing, it would help me fix that and then go back to the remaining two items in the list. R1 did not seem to have as good an “understanding” of the overall project and did not seem to “appreciate” that if I was asking a question about step 2 of 5, that steps 3-5 still needed to be done after it answered the question about step 2.

Of course, the answer to step 2 would have 5 steps, so now I have to scroll back and forth to figure out which step of which step I am on. So despite being a “stronger” model, I found it discouraging and just much harder with the R1 to have to keep track of where we were in the project.

What went wrong?

I suspect the website would be looking a lot better if I had just followed Claude’s guidance. In fact, even now, I think it is at a stage where I can post these weekly updates there with some extra effort.

But I knew I was going to be traveling for a few weeks and so after the site was ready for me to start posting content, I asked Claude if we could also set up a CMS, content management system, for the website. That way I could post from anywhere instead of just from my desktop and include links and images in the posts with minimal effort.

Things went off the rails pretty much immediately. Without getting into a lot of detail, we encountered a bug while setting up the authorization setup for the CMS. Claude kept suggesting various tweaks but nothing worked. It felt to me like we were going around in circles, trying the same things over and over again.

I even asked Claude to look at the entire conversation and figure out if it was going around in circles. It gave itself a clean chit. Of the 6 or so hours I have spend on this project, my guess is 4-5 have been trying to resolve this issue.

My suspicion is that Claude is trained on an older version of the various services / projects I am using and therefore could not fix these errors.

Eventually I gave up with Claude and took the project over to DeepSeek R1. It made some progress, identifying some errors Claude had made, e.g. key files located in wrong folders, wrong parameters etc. However since neither of the models can really take over and look at the code themselves, they may not be able to fix issues caused by my mistakes in implementing their directions.

Maybe AI agents will fix this issue in future. In any event, the project is on pause as I travel and I am wondering whether I should start from scratch with DeepSeek instead of trying to fix the current version.

What did I learn?
A lot.

Despite the hiccup, I feel comfortable that these models can help me do projects that I just couldn’t have done before. I intend to try more projects, and of course, finish this one.

Different models have very different “skills” and it’s important to figure out which model is the best for a given task.

While Claude is the easiest to talk to, almost like a person, it really helps to understand how to prompt other models to get the best out of them. Providing more context and better instructions can result in much better results.

Larger context windows will change everything. A model that can keep your entire life in context will be multiple orders of magnitude more helpful than the current models.

I am a little more skeptical than before about LLMs becoming generally intelligent or superintelligent. Their ability to deal with problems that are not in their training data seems limited. Maybe agentic models will overcome some of this but breakthroughs in for e.g. fundamental physics seem unlikely. Obviously I am extrapolating from a tiny sample but that’s the direction in which I have updated my priors.

What’s next?
I have a few ideas I want to work on once (not if!) I finish the website. I wonder if I can set up a web server on my old Mac and run a few basic services off it. For e.g. creating a URL shortening service (like Bitly) or a QR code generation service.

This from Simon Willison is my inspiration. 14 projects in 1 week. No rocket science but just small, useful things here and there. Or, if I am more ambitious, that custom Spaced Repetition app built by Andy Matuschak, I mentioned couple of weeks ago.

Is truly customized software possible? I hope it is.