<script type="ts">
  import { afterUpdate, onDestroy } from "svelte";

  import { writable } from "svelte/store";

  import AnimatedCard from "./AnimatedCard.svelte";
  import StaticCard from "./StaticCard.svelte";

  export let digit: number;

  let previousDigit, animation, animation2, flip;

  const previousDigitState = writable(digit);

  const previousDigitUnsub = previousDigitState.subscribe((val) => {
    previousDigit = val;
  });

  afterUpdate(() => {
    previousDigit = digit + 1;
    flip = animation === "fold";
    animation2 = animation || "unfold";
    animation = flip ? "unfold" : "fold";
  });

  onDestroy(() => {
    previousDigitUnsub();
  });
</script>

<div class="flip-container">
  <StaticCard position="upperCard" {digit} />
  <StaticCard position="lowerCard" digit={previousDigit} />
  <AnimatedCard digit={flip ? digit : previousDigit} {animation} />
  <AnimatedCard digit={flip ? previousDigit : digit} animation={animation2} />
</div>

<style type="text/scss">
  @import "../styles/styles.scss";

  .flip-container {
    display: block;
    position: relative;
    width: 50px;
    height: 55px;
    perspective-origin: 50% 50%;
    perspective: 300px;
    background-color: $blue;
    border-radius: 10px;
    box-shadow: 0px 10px 6px transparentize($color: #000000, $amount: 0.5);
    overflow: hidden;
    justify-self: center;

    &::before {
      content: "";
      position: absolute;
      height: 8px;
      width: 8px;
      left: -4px;
      top: calc(50% - 4px);
      border-radius: 50%;
      background-color: $darkest-blue;
      z-index: 1;

      @include md-screen {
        height: 10px;
        width: 10px;
        left: -5px;
        top: calc(50% - 5px);
      }

      @include lg-screen {
        height: 12px;
        width: 12px;
        left: -6px;
        top: calc(50% - 6px);
      }
    }

    &::after {
      content: "";
      position: absolute;
      height: 8px;
      width: 8px;
      right: -4px;
      top: calc(50% - 4px);
      border-radius: 50%;
      background-color: $darkest-blue;

      @include md-screen {
        height: 10px;
        width: 10px;
        right: -5px;
        top: calc(50% - 5px);
      }

      @include lg-screen {
        height: 12px;
        width: 12px;
        right: -6px;
        top: calc(50% - 6px);
      }
    }

    @include md-screen {
      width: 95px;
      height: 105px;
    }

    @include lg-screen {
      width: 145px;
      height: 155px;
    }
  }
</style>
