<script lang="ts">
  import Main from "./components/Main.svelte";
  import Footer from "./components/Footer.svelte";
</script>

<main>
  <Main />
  <Footer />
</main>

<style type="text/scss">
  @import "./styles/styles";

  main {
    text-align: center;
    padding: 1rem;
    margin: 0 auto;
    background-image: linear-gradient(to bottom, $dark-blue, $blue);
    color: $white;
    width: calc(100% - 2rem);
    height: calc(100% - 2rem);
    position: relative;

    &:after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      left: 0;
      background-image: url("../assets/bg-stars.svg");
    }
  }
</style>
