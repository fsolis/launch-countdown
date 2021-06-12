<script type="ts">
  import FlipContainer from "./FlipContainer.svelte";
  import { readable } from "svelte/store";
  import { onDestroy, time_ranges_to_array } from "svelte/internal";

  const END_TIME = Date.now() + 777600000;

  const TIME_COUNTDOWN = readable(END_TIME - Date.now(), (set) => {
    set(END_TIME - Date.now());

    const interval = setInterval(() => {
      set(END_TIME - Date.now());
    }, 1000);

    return () => clearInterval(interval);
  });

  let days,
    hours,
    mintues,
    seconds = 0;

  let timeRemainingUnsubscribe = TIME_COUNTDOWN.subscribe((time) => {
    const date = new Date(time);
    days = date.getDay();
    hours = date.getHours();
    mintues = date.getMinutes();
    seconds = date.getSeconds();
  });

  onDestroy(() => {
    timeRemainingUnsubscribe();
  });
</script>

<div class="countdown">
  <FlipContainer digit={days} />
  <FlipContainer digit={hours} />
  <FlipContainer digit={mintues} />
  <FlipContainer digit={seconds} />
  <div class="countdown__label"><p>Days</p></div>
  <div class="countdown__label"><p>Hours</p></div>
  <div class="countdown__label"><p>Minutes</p></div>
  <div class="countdown__label"><p>Seconds</p></div>
</div>

<style type="text/scss">
  @import "../styles/styles.scss";

  .countdown {
    display: grid;
    grid-template-rows: 2;
    grid-template-columns: repeat(4, 1fr);
    grid-column-gap: 0.25rem;
    z-index: 1000;

    @include md-screen {
      grid-column-gap: 1rem;
    }

    @include lg-screen {
      grid-column-gap: 1.5rem;
    }

    &__label {
      font-size: 0.6rem;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: $gray-blue;

      @include md-screen {
        font-size: 0.9rem;
        letter-spacing: 6px;
      }
    }
  }
</style>
