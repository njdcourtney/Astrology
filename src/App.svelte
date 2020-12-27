<script>
	import { zodiac } from './zodiac.js';
	import Horoscope from './Horoscope.svelte'

	let starSign = '';

</script>

<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
	<a class="navbar-brand" href="//www.nathancourtney.me.uk">Nathan Courtney</a>
</nav>

<div class="container">
	<div class="jumbotron">
		<h1>Real Astrology</h1>
		<p class="lead" >I graduated in 2004 with a Ph.D. in Astrophysics.<br/> After years of painstaking research I present the results of my work, a scientifically accurate horoscope.</p>

		<form>
			<div class="form-group">
				<label for="starSignSelect">Choose your star sign</label>
				<select bind:value={starSign} class="form-control form-control-lg" id="starSignSelect">
					<option hidden></option>
					{#each Object.keys(zodiac) as sign }
						<option value={sign}>{zodiac[sign].label}</option>
					{/each}
				</select>
			</div>
		</form>
	</div>

	{#if zodiac[starSign] !== undefined }
		<Horoscope sign={starSign}/>
	{/if}
</div>





