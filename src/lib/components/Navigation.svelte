<script>
	import { onMount } from "svelte";
	import { fly, scale } from "svelte/transition";
	import { elasticOut } from "svelte/easing";
	import { flip } from "svelte/animate";
	import { Search, ChevronDown } from "lucide-svelte";
	import { playSound } from "../playSound.js";
	let { categories = [], selectedCategory = $bindable() } = $props();

	// Local state for the component
	let isOpen = $state(false);
	let displayCategory = $derived(selectedCategory || (categories.length > 0 ? categories[0] : "..."));
	let searchTerm = $state("");
	let dropdownRef = $state();
	let titleRef;

	// Filter categories based on search term
	let filteredCategories = $derived(
		searchTerm ? categories.filter((cat) => cat.toLowerCase().includes(searchTerm.toLowerCase())) : categories,
	);

	// Random leading phrases - only change when explicitly selecting a new category
	const leadingPhrases = ["Looking for", "Interested in", "Searching for", "Fancy some", "What about these"];

	// Current random phrase
	let currentPhrase = $state(leadingPhrases[0]);

	// Change leading phrase randomly only when explicitly selecting a category
	let lastRandomIndex;
	function updateRandomPhrase() {
		let randomIndex;
		randomIndex = Math.floor(Math.random() * leadingPhrases?.length);
		while (randomIndex == lastRandomIndex) randomIndex = Math.floor(Math.random() * leadingPhrases?.length);
		currentPhrase = leadingPhrases[randomIndex];
		lastRandomIndex = randomIndex;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event) {
		if (dropdownRef && !dropdownRef.contains(event.target) && titleRef && !titleRef.contains(event.target)) {
			isOpen = false;
		}
	}

	onMount(updateRandomPhrase);
</script>

<svelte:document onclick={handleClickOutside} />

<div
	transition:scale={{
		duration: 600,
		delay: 50,
		easing: elasticOut,
		start: 0.95,
	}}
	class="flex w-full flex-col py-2"
>
	<!-- Interactive title that serves as the dropdown trigger -->
	<h1 class="mb-0! py-2 text-center text-2xl font-bold text-white drop-shadow-xl lg:text-4xl">
		<span>{currentPhrase}</span>
		<!-- Interactive category dropdown trigger -->
		<button
			bind:this={titleRef}
			class="group mx-1 inline-flex cursor-pointer items-center bg-white px-3 py-1 text-black transition hover:rotate-5"
			onclick={() => {
				searchTerm = "";
				isOpen = !isOpen;
			}}
		>
			<span class="max-w-[40vw] truncate">{displayCategory}</span>
			<ChevronDown
				size={25}
				strokeWidth={3}
				class="mt-1 ml-1 text-black group-hover:text-gray-700 {isOpen
					? 'rotate-180 transform'
					: ''} transition-transform duration-200"
			/>
		</button>
		<span>games?</span>
	</h1>

	<!-- Dropdown panel that appears below the category button -->
	{#if isOpen}
		<div
			bind:this={dropdownRef}
			class="bg-background/75 fixed left-1/2 z-50 mt-22 w-30 w-full max-w-xs -translate-x-1/2 transform border shadow-lg backdrop-blur"
			transition:fly={{ y: -5, duration: 250 }}
		>
			<!-- Search input at the top of dropdown -->
			<div class="border-b p-3">
				<div class="relative">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
						<Search size={18} class="text-muted-foreground" />
					</div>
					<input
						type="text"
						placeholder="Search categories..."
						class="w-full border-0 p-1 pl-10 text-white focus:ring-0 focus:outline-none"
						bind:value={searchTerm}
					/>
				</div>
			</div>

			<!-- Categories list -->
			<div class="max-h-60 overflow-y-auto">
				{#if categories.length === 0}
					<div class="text-muted-foreground animate-pulse p-4 text-center">Loading...</div>
				{:else if filteredCategories.length === 0}
					<div class="text-muted-foreground p-4 text-center">No categories found.</div>
				{:else}
					<div class="space-y-1 p-1">
						{#each filteredCategories as category (category)}
							<button
								class="w-full cursor-pointer px-4 py-2 text-left transition-colors {selectedCategory != category
									? 'hover:bg-muted-foreground/20'
									: ''} {selectedCategory == category ? 'bg-white text-black' : 'text-white'}"
								onclick={() => {
									selectedCategory = category;
									isOpen = false;
								}}
								animate:flip={{ duration: 150 }}
							>
								{category}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
