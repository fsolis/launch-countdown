<script type="ts">
  import NumberCard from "./NumberCard.svelte";
  const time = Date.now() + 100000;
</script>

<div>
  <NumberCard value={9} label="Days" />
  <NumberCard value={7} label="Hours" />
</div>
