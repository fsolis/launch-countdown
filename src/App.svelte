<script lang="ts">
	import Main from './components/Main.svelte'
	import Footer from './components/Footer.svelte'
</script>

<main>
	<Main />
	<Footer />
</main>

<style type="text/scss">
	main {
		text-align: center;
		padding: 1rem;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>