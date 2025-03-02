# Playlight (SDK)
Playlight is an integrable game discovery platform.

## Installation
Please refer to [the docs](https://playlight.dev/docs).

Quick start:
```html
<!-- Include the script tag -->
<script src="https://sdk.playlight.dev/playlight-sdk.iife.js"></script>
<script>
  // Initialize the SDK (async)
  window.PlaylightSDK.init();
</script>
```

## Developing

The Playlight SDK uses [Svelte](https://svelte.dev) together with [Tailwind CSS](https://tailwindcss.com/) and [Shadcn-Svelte components](https://next.shadcn-svelte.com/).

Run `npm run build` to create a fresh build, and test the SDK using the `index.html` file found in the `/example`folder. 
To view it, start a live server (e.g. with the live server VSCode extension).