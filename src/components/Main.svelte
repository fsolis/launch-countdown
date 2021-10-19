<script type="ts">
  import Countdown from "./Countdown.svelte";
</script>

<div class="main-container">
  <h1 class="title">We're launching soon</h1>

  <div class="clock">
    <Countdown />
  </div>
</div>

<style type="text/scss">
  .main-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: calc(100% - 200px);
  }

  .title {
    font-size: 1.4rem;
    letter-spacing: 7px;
    text-transform: uppercase;
    margin-bottom: 5rem;
  }

  .clock {
    display: flex;
    flex-direction: row;
  }
</style>
