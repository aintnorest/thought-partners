# Samples Directory

This directory contains curated sample recipes for Jacques.

## Layout

```txt
samples/
  cooklang/
    familiar/      recognizable baseline recipes judges understand immediately
    exotic/        unfamiliar ingredients and prep that benefit from coaching
    centerpiece/   intimidating technique-heavy recipes for advanced demos
```

## Recipe format

Recipes are written in Cooklang-style `.cook` files:

- metadata uses `>> key: value`
- ingredients use `@ingredient{qty%unit}`
- cookware/tools use `#tool{}`
- timers use `~{time%unit}`
- Watch Me visual targets use comment lines beginning with `-- watch:`

Example:

```cooklang
>> title: Buttermilk Pancakes
>> servings: 4
>> time: 25 minutes
>> tags: familiar, watchme, breakfast

-- watch: Pancake tops show many popped bubbles and edges look dry.
Pour @batter{1/4%cup} per pancake and cook for ~{2%minutes}.
```

## Watch Me cues

`-- watch:` comments are intentional. They are not standard Cooklang syntax for structured metadata, but they give Jacques explicit visual criteria for camera-assisted coaching.

Good cues are sensory and observable:

- color: `golden brown`, `pale garlic`, `no brown edges`
- texture: `glossy`, `soft curds`, `coats a spoon`
- shape: `even cubes`, `sealed pleats`, `thin slices across the grain`
- motion: `gentle bubbles`, `smooth ribbon`, `water drop dances`

Avoid cues that claim food safety or require hidden knowledge:

- internal doneness without a thermometer
- raw poultry safety guarantees
- knife-safety guarantees
- medical/nutrition claims

## Curation rules

When adding recipes:

1. Prefer 4–8 meaningful steps.
2. Include `title`, `servings`, `time`, and `tags` metadata.
3. Include at least one timer.
4. Include at least one `-- watch:` cue.
5. Use realistic home-kitchen tools and quantities.
6. Keep recipes demo-friendly: visually distinct, not too slow, not venue-hostile.
7. Tag by role: `familiar`, `exotic`, or `centerpiece`; add `watchme` when visual coaching is useful.

## Current sample intent

- `familiar/`: baseline recipes that prove Jacques handles ordinary cooking flows.
- `exotic/`: fruit, vegetables, or ingredients a typical home cook may not know how to prep.
- `centerpiece/`: recipes where carving, folding, stuffing, or whole-item handling makes live guidance valuable.
