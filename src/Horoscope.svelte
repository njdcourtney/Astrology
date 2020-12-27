<script>
    // Take the star sign as an input
    export let sign;
    import { zodiac } from './zodiac.js';

    // Import the horoscopes
    import Alignment from './horoscopes/alignment.md';
    import Barnum from './horoscopes/barnum.md';
    import Cocktails from './horoscopes/cocktails.md';
    import Concern from './horoscopes/concern.md';
    import Foot from './horoscopes/foot.md';
    import ForDummies from './horoscopes/for_dummies.md';
    import Jupiter from './horoscopes/jupiter.md';
    import Lampost from './horoscopes/lamppost.md';
    import MarsAquarius from './horoscopes/mars_aquarius.md';
    import MayOrMayNot from './horoscopes/may_or_may_not.md';
    import NiceThings from './horoscopes/nice-things.md';
    import NicePerson from './horoscopes/nice_person.md';
    import NoEffect from './horoscopes/no-effect.md';
    import Norse from './horoscopes/norse.md';
    import Plasma from './horoscopes/plasma.md';
    import Roses from './horoscopes/roses.md';

    let horoscopes = [
        Alignment, Barnum, Cocktails, Concern, Foot, ForDummies, Jupiter, Lampost,
        MarsAquarius, MayOrMayNot, NiceThings, NicePerson, NoEffect, Norse,
        Plasma, Roses,
    ];

    // Calculate the day of the year
    let today = new Date(2020,11,31);
    let doY = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    // Work out which Horoscope to display
    $: selector = (doY + zodiac[sign].id) % horoscopes.length

</script>

<h2>{sign}</h2>
<p class="lead">{zodiac[sign].desc}</p>
<hr/>
<svelte:component this={horoscopes[selector]}/>

