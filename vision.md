## Jacques: Agentic Sous Chef

Agentic sous chef that coaches home cooks through recipes in real-time.

## Features

- Takes a recipe and converts to an optimal series of tasks to be executed.
- Real-time step-by-step generated UI that walks a home cook through executing a recipe.
- Generates visuals (either image or sketch) on-the-fly to demonstrate what the result should look like. For example, how an onion should be diced or what cutting an onion "pole-to-pole" looks like.
- Prompts home cook with suggested question cards they can click to get more info about a recipe step.
- Vision mode. User can take a picture of cooking in progress and get feedback if the result looks correct.
- Voice mode. Sous chef talks the recipe steps out loud and can respond in real-time converstaion with the user as they cook.
- Heart beat. Periodically checks in on progress during a step to see how the home cook is doing. For example, during a longer step, like simmering.

## Ideas

- Standardize on a recipe data format, like [Cooklang](https://cooklang.org/).
- Diet-friendly recipes (vegan, etc.)
- Nutrition fact generation (grounded in search / facts)
- Exoctic ingredients that people don't know how to work with (like dragon fruit). Or how to use them / combine them.
- General information about the kitchen, like what kind of knife to use for a given task.

## Tasks

- Recipe parsing & conversion
- Decide on agent SDK to use
- Generating UI steps and building design system / components
- Server / host setup for agent runtime
- Create/configure basic sous chef agent (instructions, etc.)
- Agent Q&A handling
- Voice mode / OpenAI real-time API integration?
