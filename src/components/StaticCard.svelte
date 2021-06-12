<script type="ts">
  type StaticCardPosition = "lowerCard" | "upperCard";
  export let position: StaticCardPosition;
  export let digit: number;
</script>

<div class={position}>
  <span>{`${digit < 10 ? 0 : ""}`}{digit}</span>
</div>

<style type="text/scss">
  @import "../styles/styles.scss";

  .upperCard,
  .lowerCard {
    display: flex;
    position: relative;
    justify-content: center;
    width: 100%;
    height: 50%;
    overflow: hidden;
    color: lighten($blue, 0.5);
  }

  span {
    font-size: 1.5rem;
    font-weight: lighter;
    color: $red;

    @include md-screen {
      font-size: 3rem;
    }

    @include lg-screen {
      font-size: 5rem;
    }
  }

  .upperCard {
    align-items: flex-end;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;

    span {
      transform: translateY(50%);
    }
  }

  .lowerCard {
    align-items: flex-start;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    background-color: lighten($blue, 5%);
    border-top: 0.5px solid transparentize($color: #000000, $amount: 0.7);

    span {
      transform: translateY(-50%);
    }
  }
</style>
